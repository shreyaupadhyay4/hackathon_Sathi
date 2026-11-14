"""Telegram Bot API: contacts join via a deep link, alerts go out as messages + a map pin.

No token set -> DEMO MODE: alerts are held in a browser-scoped session and shown inside the app,
so the whole flow can be demonstrated without a bot.
"""
import asyncio
import json
import logging
import secrets
import threading
import time

from . import db
from .config import settings

log = logging.getLogger("telegram")
DEMO_SESSION_TTL = 24 * 60 * 60
MAX_DEMO_SESSIONS = 10000
MAX_MESSAGE_CHARS = 1000
_demo_lock = threading.Lock()
_demo_sessions: dict[str, float] = {}
_demo_messages: dict[str, list[dict]] = {}
_poll_state = {"status": "disabled", "last_success": None, "last_error": None}


def configured() -> bool:
    return bool(settings.telegram_token)


def health_status() -> dict:
    if not configured():
        return {"configured": False, "status": "demo", "last_success": None, "last_error": None}
    state = _poll_state.copy()
    if state["status"] == "disabled":
        state["status"] = "starting"
    elif state["status"] == "connected" and state["last_success"] is not None:
        if time.time() - state["last_success"] > 90:
            state["status"] = "stale"
    return {"configured": True, **state}


def create_demo_session() -> tuple[str, float]:
    now = time.time()
    with _demo_lock:
        expired = [token for token, expiry in _demo_sessions.items() if expiry <= now]
        for token in expired:
            _demo_sessions.pop(token, None)
            _demo_messages.pop(token, None)
        while len(_demo_sessions) >= MAX_DEMO_SESSIONS:
            oldest = min(_demo_sessions, key=_demo_sessions.get)
            _demo_sessions.pop(oldest, None)
            _demo_messages.pop(oldest, None)
        token = secrets.token_urlsafe(32)
        expires = now + DEMO_SESSION_TTL
        _demo_sessions[token] = expires
    return token, expires


def get_demo_messages(token: str) -> list[dict] | None:
    with _demo_lock:
        expiry = _demo_sessions.get(token)
        if expiry is None or expiry <= time.time():
            _demo_sessions.pop(token, None)
            _demo_messages.pop(token, None)
            return None
        return list(_demo_messages.get(token, []))


def delete_demo_session(token: str) -> int:
    with _demo_lock:
        messages = len(_demo_messages.pop(token, []))
        _demo_sessions.pop(token, None)
        return messages


def _api(method: str) -> str:
    return f"https://api.telegram.org/bot{settings.telegram_token}/{method}"


async def send(
    chat_id: int,
    text: str,
    lat: float | None = None,
    lon: float | None = None,
    demo_session: str | None = None,
) -> bool:
    text = "\n".join(" ".join(line.split()) for line in text.splitlines())[:MAX_MESSAGE_CHARS]
    if not configured():
        with _demo_lock:
            expiry = _demo_sessions.get(demo_session or "")
            if expiry is None or expiry <= time.time():
                return False
            messages = _demo_messages.setdefault(demo_session, [])
            messages.append({"t": time.time(), "text": text, "lat": lat, "lon": lon})
            del messages[:-50]
            return True
    import httpx

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(_api("sendMessage"), json={"chat_id": chat_id, "text": text})
            ok = bool(r.json().get("ok"))
            if ok and lat is not None and lon is not None:
                await c.post(_api("sendLocation"), json={"chat_id": chat_id, "latitude": lat, "longitude": lon})
            return ok
    except Exception as e:
        log.warning("telegram send failed (%s)", type(e).__name__)
        return False


async def notify(codes: list[str], text: str, lat=None, lon=None, demo_session: str | None = None) -> int:
    """Send to every contact that has joined. Returns how many were reached."""
    sent = 0
    for code in dict.fromkeys(codes):  # unique, keep order
        c = db.get_contact(code)
        if c and c["chat_id"] is not None and await send(
            c["chat_id"], text, lat, lon, demo_session=demo_session
        ):
            sent += 1
    return sent


async def _handle(update: dict) -> None:
    msg = update.get("message") or {}
    text = (msg.get("text") or "").strip()
    chat = msg.get("chat") or {}
    if not text.startswith("/start") or "id" not in chat:
        return
    parts = text.split()
    code = parts[1] if len(parts) > 1 else ""
    name = (msg.get("from") or {}).get("first_name", "")
    c = db.get_contact(code) if code else None
    if c and db.join_contact(code, chat["id"], name):
        await send(chat["id"], f"✅ Done. You are now a safety contact ({c['label'] or 'contact'}).\n"
                               "If they miss a safety check-in or press SOS, you will get a message here "
                               "with their last location.\n\nThis is not an emergency service. "
                               "In a real emergency, call 112.")
    else:
        await send(chat["id"], "Hi! I am Aapatkaal Saathi's alert bot. Ask your friend to share their "
                               "invite link with you and open it to become their safety contact.")


async def poll_loop() -> None:
    if not configured():
        _poll_state.update(status="demo", last_error=None)
        log.warning("TELEGRAM_BOT_TOKEN not set: running in DEMO MODE (alerts shown in app).")
        return
    import httpx

    _poll_state.update(status="starting", last_error=None)
    offset = None
    delay = 1
    while True:
        try:
            async with httpx.AsyncClient(timeout=40) as c:
                delete_response = await c.post(_api("deleteWebhook"))
                delete_response.raise_for_status()
                if not delete_response.json().get("ok"):
                    raise RuntimeError("Telegram deleteWebhook returned an unsuccessful response")
                me_response = await c.get(_api("getMe"))
                me_response.raise_for_status()
                me = me_response.json()
                if not me.get("ok"):
                    raise RuntimeError("Telegram getMe returned an unsuccessful response")
                settings.bot_username = me["result"]["username"]
                log.info("Telegram bot ready: @%s", settings.bot_username)
                _poll_state.update(status="connecting", last_error=None)
                while True:
                    params = {"timeout": 25, "allowed_updates": json.dumps(["message"])}
                    if offset is not None:
                        params["offset"] = offset
                    response = await c.get(_api("getUpdates"), params=params)
                    response.raise_for_status()
                    data = response.json()
                    if not data.get("ok"):
                        raise RuntimeError("Telegram getUpdates returned an unsuccessful response")
                    _poll_state.update(status="connected", last_success=time.time(), last_error=None)
                    delay = 1
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        await _handle(update)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            error = type(e).__name__
            _poll_state.update(status="degraded", last_error=error)
            log.warning("Telegram poll failed (%s); retrying in %s seconds", error, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, 60)
