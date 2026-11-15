"""Tiny SQLite layer. Everything the safety features need survives a server restart."""
import hashlib
import json
import secrets
import sqlite3
import threading
import time

from .config import settings

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None
CONTACT_INVITE_TTL = 7 * 24 * 60 * 60

SCHEMA = """
CREATE TABLE IF NOT EXISTS contacts(
  code TEXT PRIMARY KEY, label TEXT, chat_id INTEGER, tg_name TEXT, created REAL,
  invite_expires REAL, owner TEXT);
CREATE TABLE IF NOT EXISTS tracks(
  token TEXT PRIMARY KEY, key TEXT, lat REAL, lon REAL, updated REAL, label TEXT, expires REAL,
  owner TEXT, battery INTEGER);
CREATE TABLE IF NOT EXISTS walks(
  id TEXT PRIMARY KEY, track TEXT, name TEXT, deadline REAL, status TEXT,
  codes TEXT, base TEXT, sent INTEGER DEFAULT 0, created REAL, demo_session TEXT,
  alert_reason TEXT, owner TEXT);
"""


def _migrate(c: sqlite3.Connection) -> None:
    contact_columns = {row["name"] for row in c.execute("PRAGMA table_info(contacts)")}
    if "invite_expires" not in contact_columns:
        c.execute("ALTER TABLE contacts ADD COLUMN invite_expires REAL")
        c.execute(
            "UPDATE contacts SET invite_expires=created+? "
            "WHERE chat_id IS NULL AND invite_expires IS NULL",
            (CONTACT_INVITE_TTL,),
        )
    if "owner" not in contact_columns:
        c.execute("ALTER TABLE contacts ADD COLUMN owner TEXT")

    track_columns = {row["name"] for row in c.execute("PRAGMA table_info(tracks)")}
    if "owner" not in track_columns:
        c.execute("ALTER TABLE tracks ADD COLUMN owner TEXT")
    if "battery" not in track_columns:
        c.execute("ALTER TABLE tracks ADD COLUMN battery INTEGER")

    walk_columns = {row["name"] for row in c.execute("PRAGMA table_info(walks)")}
    if "demo_session" not in walk_columns:
        c.execute("ALTER TABLE walks ADD COLUMN demo_session TEXT")
    if "alert_reason" not in walk_columns:
        c.execute("ALTER TABLE walks ADD COLUMN alert_reason TEXT")
    if "owner" not in walk_columns:
        c.execute("ALTER TABLE walks ADD COLUMN owner TEXT")
    c.execute("CREATE INDEX IF NOT EXISTS contacts_owner_idx ON contacts(owner)")
    c.execute("CREATE INDEX IF NOT EXISTS tracks_owner_idx ON tracks(owner)")
    c.execute("CREATE INDEX IF NOT EXISTS walks_owner_idx ON walks(owner)")


def conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(settings.db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.executescript(SCHEMA)
        _migrate(_conn)
        _conn.commit()
    return _conn


def run(sql: str, args: tuple = ()) -> int:
    with _lock:
        c = conn()
        changed = c.execute(sql, args).rowcount
        c.commit()
        return changed


def rows(sql: str, args: tuple = ()) -> list[dict]:
    with _lock:
        return [dict(r) for r in conn().execute(sql, args).fetchall()]


def one(sql: str, args: tuple = ()) -> dict | None:
    r = rows(sql, args)
    return r[0] if r else None


def new_id(n: int = 32) -> str:
    return secrets.token_urlsafe(n)


def owner_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---- contacts ----
def create_contact(label: str, demo: bool, owner: str | None = None) -> str:
    code = new_id(32)
    # In demo mode (no Telegram token) contacts count as "joined" so the full flow can be shown.
    now = time.time()
    invite_expires = None if demo else now + CONTACT_INVITE_TTL
    run(
        "INSERT INTO contacts(code,label,chat_id,tg_name,created,invite_expires,owner) "
        "VALUES(?,?,?,?,?,?,?)",
        (code, label, 0 if demo else None, None, now, invite_expires, owner),
    )
    return code


def get_contact(code: str) -> dict | None:
    return one("SELECT * FROM contacts WHERE code=?", (code,))


def delete_contact(code: str, owner: str) -> bool:
    with _lock:
        c = conn()
        walks = c.execute("SELECT id,codes FROM walks WHERE owner=?", (owner,)).fetchall()
        for item in walks:
            codes = json.loads(item["codes"] or "[]")
            if code in codes:
                c.execute(
                    "UPDATE walks SET codes=? WHERE id=?",
                    (json.dumps([saved for saved in codes if saved != code]), item["id"]),
                )
        deleted = c.execute(
            "DELETE FROM contacts WHERE code=? AND owner=?", (code, owner)
        ).rowcount
        c.commit()
        return deleted == 1


def join_contact(code: str, chat_id: int, tg_name: str) -> bool:
    return run(
        "UPDATE contacts SET chat_id=?, tg_name=?, invite_expires=NULL "
        "WHERE code=? AND chat_id IS NULL AND invite_expires>?",
        (chat_id, tg_name, code, time.time()),
    ) == 1


# ---- tracks (live location links) ----
def create_track(
    lat: float,
    lon: float,
    label: str,
    hours: float = 6,
    owner: str | None = None,
) -> tuple[str, str]:
    token, key = new_id(32), new_id(32)
    now = time.time()
    run(
        "INSERT INTO tracks(token,key,lat,lon,updated,label,expires,owner) VALUES(?,?,?,?,?,?,?,?)",
        (token, key, lat, lon, now, label, now + hours * 3600, owner),
    )
    return token, key


def delete_track(token: str, key: str, owner: str) -> bool:
    return run("DELETE FROM tracks WHERE token=? AND key=? AND owner=?", (token, key, owner)) == 1


def extend_track_expiry(token: str, expires: float) -> None:
    run("UPDATE tracks SET expires=MAX(expires,?) WHERE token=?", (expires, token))


def update_track(token: str, lat: float, lon: float, battery: int | None = None) -> None:
    run(
        "UPDATE tracks SET lat=?, lon=?, updated=?, battery=COALESCE(?,battery) WHERE token=?",
        (lat, lon, time.time(), battery, token),
    )


def get_track(token: str) -> dict | None:
    t = one("SELECT * FROM tracks WHERE token=?", (token,))
    if t and t["expires"] < time.time():
        return None
    return t


def claim_legacy_data(
    owner: str,
    contacts: list[str],
    tracks: list[dict],
    walks: list[str],
) -> None:
    """Attach pre-owner records only when the caller can prove possession of their tokens."""
    with _lock:
        c = conn()
        for code in contacts:
            c.execute("UPDATE contacts SET owner=? WHERE code=? AND owner IS NULL", (owner, code))
        for item in tracks:
            c.execute(
                "UPDATE tracks SET owner=? WHERE token=? AND key=? AND owner IS NULL",
                (owner, item["token"], item["key"]),
            )
        for walk_id in walks:
            row = c.execute(
                "SELECT track FROM walks WHERE id=? AND owner IS NULL", (walk_id,)
            ).fetchone()
            if row:
                c.execute("UPDATE walks SET owner=? WHERE id=? AND owner IS NULL", (owner, walk_id))
                c.execute(
                    "UPDATE tracks SET owner=? WHERE token=? AND owner IS NULL",
                    (owner, row["track"]),
                )
        c.commit()


def delete_owner_data(owner: str) -> dict[str, int]:
    with _lock:
        c = conn()
        deleted = {
            "walks": c.execute("DELETE FROM walks WHERE owner=?", (owner,)).rowcount,
            "tracks": c.execute("DELETE FROM tracks WHERE owner=?", (owner,)).rowcount,
            "contacts": c.execute("DELETE FROM contacts WHERE owner=?", (owner,)).rowcount,
        }
        c.commit()
    return deleted


def purge() -> None:
    now = time.time()
    # Keep rows for one cleanup interval after public access expires so a
    # recently overdue Walk can still be diagnosed during restart recovery.
    run(
        "DELETE FROM tracks WHERE expires<? AND NOT EXISTS "
        "(SELECT 1 FROM walks WHERE walks.track=tracks.token AND status IN ('active','alerting'))",
        (now - 60 * 60,),
    )
    run(
        "DELETE FROM walks WHERE status IN ('safe','alerted') AND deadline<?",
        (now - 24 * 60 * 60,),
    )
