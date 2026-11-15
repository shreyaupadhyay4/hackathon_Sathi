"""'Walk with me': a server-side dead-man's switch.

The countdown lives on the SERVER, so the alert still fires if the phone dies, loses signal
or the browser is closed. Tapping "I'm safe" cancels it.
"""
import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone

from . import db, telegram

log = logging.getLogger("walk")
IST = timezone(timedelta(hours=5, minutes=30))
_watcher_state = {"status": "starting", "last_check": None, "last_error": None}


def ist(ts: float) -> str:
    return datetime.fromtimestamp(ts, IST).strftime("%I:%M %p")


def maps_link(lat, lon) -> str:
    return f"https://www.google.com/maps?q={lat},{lon}"


def get(walk_id: str) -> dict | None:
    return db.one("SELECT * FROM walks WHERE id=?", (walk_id,))


def health_status() -> dict:
    return _watcher_state.copy()


def start(
    name: str,
    minutes: int,
    codes: list[str],
    lat: float,
    lon: float,
    base: str,
    demo_session: str | None = None,
    owner: str | None = None,
) -> dict:
    wid = db.new_id(32)
    track, _ = db.create_track(
        lat, lon, name or "Walk", hours=max(6, minutes / 60 + 2), owner=owner
    )
    now = time.time()
    db.run(
        "INSERT INTO walks(id,track,name,deadline,status,codes,base,created,demo_session,owner) "
        "VALUES(?,?,?,?,?,?,?,?,?,?)",
        (wid, track, name, now + minutes * 60, "active", json.dumps(codes), base, now, demo_session, owner),
    )
    return get(wid)


async def fire_alert(w: dict, reason: str) -> int:
    if w["status"] == "active":
        if db.run(
            "UPDATE walks SET status='alerting',alert_reason=? WHERE id=? AND status='active'",
            (reason, w["id"]),
        ) != 1:
            return 0
    elif w["status"] != "alerting":
        return 0

    reason = w.get("alert_reason") or reason
    t = db.get_track(w["track"]) or {}
    lat, lon = t.get("lat"), t.get("lon")
    who = w["name"] or "Your contact"
    why = {
        "panic": "pressed the PANIC button",
        "duress": "sent a discreet safety alert",
        "timer": "did not check in on time",
    }.get(reason, "needs a safety check")
    battery = (
        f"\nLast reported battery: {t['battery']}% (may be out of date)."
        if t.get("battery") is not None else ""
    )
    text = (f"🚨 SAFETY ALERT\n{who} {why}.\n"
            f"Last known location: {maps_link(lat, lon)}\n"
            f"Live location page: {w['base']}/t/{w['track']}{battery}\n\n"
            "Please call them now. If you cannot reach them, call 112.")
    codes = json.loads(w["codes"])
    has_targets = any(
        contact and contact["chat_id"] is not None
        for contact in (db.get_contact(code) for code in codes)
    )
    demo_session = w.get("demo_session")
    sent = await telegram.notify(codes, text, lat, lon, demo_session=demo_session)
    can_retry = telegram.configured() or telegram.get_demo_messages(demo_session or "") is not None
    if sent == 0 and has_targets and can_retry:
        log.warning("ALERT walk=%s delivery pending; watcher will retry", w["id"])
        return 0
    db.run(
        "UPDATE walks SET status='alerted',sent=? WHERE id=? AND status='alerting'",
        (sent, w["id"]),
    )
    log.warning("ALERT walk=%s reason=%s sent=%s", w["id"], reason, sent)
    return sent


async def check_expired() -> int:
    """Process overdue and interrupted alerts, including walks left by a prior process."""
    due = db.rows(
        "SELECT * FROM walks WHERE status='alerting' OR (status='active' AND deadline<=?)",
        (time.time(),),
    )
    for w in due:
        await fire_alert(w, "timer")
    return len(due)


async def watcher() -> None:
    """Runs forever; checks for expired walks every 5 seconds."""
    tick = 0
    active = db.one("SELECT COUNT(*) AS count FROM walks WHERE status IN ('active','alerting')")
    log.info("watcher started; resuming %s active walks", active["count"] if active else 0)
    _watcher_state.update(status="running", last_error=None)
    while True:
        try:
            await check_expired()
            tick += 1
            if tick % 60 == 0:
                db.purge()
            _watcher_state.update(status="running", last_check=time.time(), last_error=None)
        except asyncio.CancelledError:
            _watcher_state.update(status="stopped")
            raise
        except Exception as e:
            error = type(e).__name__
            _watcher_state.update(status="degraded", last_error=error)
            log.error("watcher error (%s)", error)
        await asyncio.sleep(5)
