"""Run: pytest -q   (API tests are skipped automatically if FastAPI is not installed)."""
import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ["DB_PATH"] = str(Path(tempfile.mkdtemp()) / "test.db")
os.environ["TELEGRAM_BOT_TOKEN"] = ""  # force demo mode

from backend import overpass  # noqa: E402


def test_haversine_known_distance():
    # Kanpur Central to IIT Kanpur is roughly 15 km
    d = overpass.haversine(26.4534, 80.3510, 26.5123, 80.2329)
    assert 12000 < d < 17000
    assert overpass.haversine(10, 10, 10, 10) == 0


def test_query_contains_all_types_and_radius():
    q = overpass.build_query(26.45, 80.35, 3000, ["hospital", "police"])
    assert "around:3000,26.45000,80.35000" in q
    assert '"amenity"="hospital"' in q and '"amenity"="police"' in q
    assert "pharmacy" not in q and q.endswith("out center tags 150;")


def test_fast_hospital_query_has_small_radius_and_server_timeout():
    q = overpass.build_query(26.45, 80.35, 3000, ["hospital"], timeout=3)
    assert "[timeout:3]" in q
    assert "around:3000,26.45000,80.35000" in q
    assert "pharmacy" not in q and "police" not in q


def test_overpass_retries_mirrors_with_exponential_backoff(monkeypatch):
    import asyncio
    import httpx
    from backend.config import settings

    calls = []
    delays = []

    class Response:
        def __init__(self, status_code):
            self.status_code = status_code

        def json(self):
            return {"elements": []}

    class Client:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, data):
            calls.append(url)
            return Response(200 if len(calls) == 3 else 503)

    async def sleep(delay):
        delays.append(delay)

    monkeypatch.setattr(settings, "overpass_urls", ["mirror-a", "mirror-b", "mirror-c"])
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    monkeypatch.setattr(overpass.asyncio, "sleep", sleep)
    assert asyncio.run(overpass._overpass("query", timeout=0.1, backoff_base=0.1)) == {"elements": []}
    assert calls == ["mirror-a", "mirror-b", "mirror-c"]
    assert delays == [0.1, 0.2]


def test_overpass_retries_next_mirror_after_access_error(monkeypatch):
    import asyncio
    import httpx
    from backend.config import settings

    calls = []

    class Response:
        def __init__(self, status_code):
            self.status_code = status_code

        def json(self):
            return {"elements": []}

    class Client:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, data):
            calls.append(url)
            return Response(403 if len(calls) == 1 else 200)

    async def no_wait(_delay):
        return None

    monkeypatch.setattr(settings, "overpass_urls", ["blocked-mirror", "available-mirror"])
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    monkeypatch.setattr(overpass.asyncio, "sleep", no_wait)
    assert asyncio.run(overpass._overpass("query")) == {"elements": []}
    assert calls == ["blocked-mirror", "available-mirror"]


def test_nearby_fast_caches_hospitals_only(monkeypatch):
    import asyncio

    key = "26.450,80.350,hospital@3000"
    overpass._cache.pop(key, None)
    queries = []

    async def fake_overpass(query, timeout, backoff_base):
        queries.append((query, timeout))
        return {"elements": [
            {"type": "node", "id": 5, "lat": 26.451, "lon": 80.351,
             "tags": {"amenity": "hospital", "name": "OSM Hospital"}},
            {"type": "node", "id": 6, "lat": 26.452, "lon": 80.352,
             "tags": {"amenity": "pharmacy", "name": "OSM Pharmacy"}},
        ]}

    monkeypatch.setattr(overpass, "_overpass", fake_overpass)
    first = asyncio.run(overpass.nearby_fast(26.45, 80.35))
    second = asyncio.run(overpass.nearby_fast(26.45, 80.35))
    assert list(first["results"]) == ["hospital"]
    assert first["results"]["hospital"][0]["name"] == "OSM Hospital"
    assert second["cached"] is True
    assert len(queries) == 1 and queries[0][1] == overpass.FAST_TIMEOUT


def test_nearby_fast_bounds_provider_fallback(monkeypatch):
    import asyncio

    monkeypatch.setattr(overpass, "_cache", {})
    monkeypatch.setattr(overpass, "FAST_PATH_DEADLINE", 0.01)
    monkeypatch.setattr(overpass, "FAST_NOMINATIM_DEADLINE", 0.01)

    async def slow_overpass(*_args, **_kwargs):
        await asyncio.sleep(0.03)

    async def slow_nominatim(*_args, **_kwargs):
        await asyncio.sleep(0.03)

    monkeypatch.setattr(overpass, "_overpass", slow_overpass)
    monkeypatch.setattr(overpass, "nearby_nominatim", slow_nominatim)
    result = asyncio.run(overpass.nearby_fast(28.61, 77.20))
    assert result["stale"] is True
    assert result["results"] == {"hospital": []}


def test_nearby_falls_back_to_nominatim_names_when_overpass_is_down(monkeypatch):
    import asyncio

    calls = []

    async def unavailable(*_args, **_kwargs):
        raise RuntimeError("Overpass mirrors unavailable")

    async def fake_nominatim(_path, params):
        calls.append(params["q"])
        if params["q"] == "hospital":
            return [{
                "category": "amenity", "type": "hospital", "osm_type": "node", "osm_id": 11,
                "lat": "28.6149", "lon": "77.2090", "name": "Nearby Hospital",
            }]
        return [{
            "category": "amenity", "type": "pharmacy", "osm_type": "node", "osm_id": 12,
            "lat": "28.6150", "lon": "77.2091", "name": "Nearby Pharmacy",
        }]

    monkeypatch.setattr(overpass, "_cache", {})
    monkeypatch.setattr(overpass, "_overpass", unavailable)
    monkeypatch.setattr(overpass, "_nominatim", fake_nominatim)

    async def exercise():
        fast = await overpass.nearby_fast(28.6139, 77.2090)
        full = await overpass.nearby(28.6139, 77.2090, ["hospital", "pharmacy"])
        return fast, full

    fast, full = asyncio.run(exercise())
    assert fast["results"]["hospital"][0]["name"] == "Nearby Hospital"
    assert full["results"]["pharmacy"][0]["name"] == "Nearby Pharmacy"
    assert full["results"]["hospital"][0]["distance_m"] > 0
    assert calls == ["hospital", "hospital", "pharmacy"]


def test_nominatim_fallback_covers_clinics_and_police(monkeypatch):
    import asyncio

    async def fake_nominatim(_path, params):
        kind = params["q"]
        if kind == "clinic":
            return [{
                "category": "healthcare", "type": "doctor", "osm_type": "node", "osm_id": 21,
                "lat": "28.6149", "lon": "77.2090", "name": "Local Clinic",
            }]
        if kind == "police":
            return [{
                "category": "amenity", "type": "police", "osm_type": "node", "osm_id": 22,
                "lat": "28.6150", "lon": "77.2091", "name": "Local Police Station",
            }]
        return []

    monkeypatch.setattr(overpass, "_nominatim", fake_nominatim)
    result = asyncio.run(overpass.nearby_nominatim(
        28.6139, 77.2090, ["clinic", "police"]
    ))
    assert result["results"]["clinic"][0]["name"] == "Local Clinic"
    assert result["results"]["police"][0]["name"] == "Local Police Station"


def test_nearby_returns_stale_last_good_result_when_overpass_fails(monkeypatch):
    import asyncio
    import time

    key = "26.450,80.350,hospital"
    saved = {
        "center": {"lat": 26.45, "lon": 80.35},
        "radius_m": 3000,
        "results": {"hospital": []},
        "fetched_at": time.time() - overpass.CACHE_TTL - 60,
    }
    overpass._cache[key] = (time.time() - overpass.CACHE_TTL - 60, saved)

    async def unavailable(*_args, **_kwargs):
        raise RuntimeError("mirrors unavailable")

    monkeypatch.setattr(overpass, "_overpass", unavailable)
    result = asyncio.run(overpass.nearby(26.45, 80.35, ["hospital"]))
    assert result["stale"] is True
    assert result["fetched_at"] == saved["fetched_at"]


def test_overpass_health_probe_is_cached(monkeypatch):
    import asyncio

    calls = []

    async def fake_overpass(*_args, **_kwargs):
        calls.append(True)
        return {"elements": []}

    monkeypatch.setattr(overpass, "_overpass", fake_overpass)
    monkeypatch.setattr(overpass, "_health_cache", None)
    first = asyncio.run(overpass.health())
    second = asyncio.run(overpass.health())
    assert first["reachable"] is True and second["reachable"] is True
    assert first == second and len(calls) == 1


def test_nominatim_reverse_cache_and_global_request_spacing(monkeypatch):
    import asyncio
    import httpx

    clock = [100.0]
    starts = []
    delays = []
    monkeypatch.setattr(overpass, "_geo_cache", {})
    monkeypatch.setattr(overpass, "_nominatim_last_request", 0.0)
    monkeypatch.setattr(overpass.time, "monotonic", lambda: clock[0])

    async def fake_sleep(delay):
        delays.append(delay)
        clock[0] += delay

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"display_name": "OSM mapped road"}

    class Client:
        def __init__(self, **kwargs):
            assert "AapatkaalSaathi" in kwargs["headers"]["User-Agent"]

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def get(self, _url, **_kwargs):
            starts.append(clock[0])
            return Response()

    monkeypatch.setattr(httpx, "AsyncClient", Client)
    monkeypatch.setattr(overpass.asyncio, "sleep", fake_sleep)

    async def exercise():
        first = await overpass.reverse(26.45, 80.35)
        second = await overpass.reverse(26.46, 80.36)
        cached = await overpass.reverse(26.46, 80.36)
        return first, second, cached

    assert asyncio.run(exercise()) == ("OSM mapped road", "OSM mapped road", "OSM mapped road")
    assert len(starts) == 2 and starts[1] - starts[0] >= 1.099
    assert delays == [1.1]


def test_worker_supervisor_restarts_after_unexpected_exit(monkeypatch):
    import asyncio
    import pytest
    from backend import main

    calls = []
    delays = []

    async def worker():
        calls.append(True)
        if len(calls) == 1:
            raise RuntimeError("temporary failure")
        raise asyncio.CancelledError()

    async def fake_sleep(delay):
        delays.append(delay)

    monkeypatch.setattr(main.asyncio, "sleep", fake_sleep)
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(main._supervise("test worker", worker))
    assert len(calls) == 2 and delays == [1]


def test_parse_sorts_dedups_and_classifies():
    els = [
        {"type": "node", "id": 1, "lat": 26.4600, "lon": 80.3500, "tags": {"amenity": "hospital", "name": "Far Hospital", "phone": "+91 512 123 4567; +91 99999"}},
        {"type": "way", "id": 2, "center": {"lat": 26.4510, "lon": 80.3501}, "tags": {"amenity": "hospital", "name": "Near Hospital", "emergency": "yes"}},
        {"type": "node", "id": 3, "lat": 26.4511, "lon": 80.3502, "tags": {"amenity": "hospital", "name": "Near Hospital"}},  # duplicate
        {"type": "node", "id": 4, "lat": 26.4520, "lon": 80.3500, "tags": {"amenity": "pharmacy"}},
        {"type": "node", "id": 5, "lat": 26.4520, "lon": 80.3500, "tags": {"shop": "kiosk"}},  # ignored
        {"type": "node", "id": 6, "tags": {"amenity": "police"}},  # no coordinates: ignored
    ]
    out = overpass.parse_elements(els, 26.45, 80.35)
    assert [h["name"] for h in out["hospital"]] == ["Near Hospital", "Far Hospital"]
    assert out["hospital"][0]["emergency"] is True
    assert out["hospital"][1]["phone"] == "+915121234567"
    assert len(out["pharmacy"]) == 1 and out["police"] == [] and out["clinic"] == []
    assert out["hospital"][0]["directions_google"].startswith("https://www.google.com/maps/dir/")


def test_clean_phone():
    assert overpass.clean_phone(None) is None
    assert overpass.clean_phone("abc") is None
    assert overpass.clean_phone("0512-2530001") == "0512-2530001".replace("-", "")


def test_contact_invite_expires_and_cannot_be_reused(monkeypatch):
    from backend import db

    now = [1_800_000_000.0]
    monkeypatch.setattr(db.time, "time", lambda: now[0])

    code = db.create_contact("Family", demo=False)
    contact = db.get_contact(code)
    assert len(code) >= 40
    assert contact["invite_expires"] == now[0] + db.CONTACT_INVITE_TTL
    assert db.join_contact(code, 123, "First person")
    assert not db.join_contact(code, 456, "Second person")
    assert db.get_contact(code)["chat_id"] == 123

    expired_code = db.create_contact("Expired", demo=False)
    now[0] += db.CONTACT_INVITE_TTL + 1
    assert not db.join_contact(expired_code, 789, "Late person")


def test_schema_migration_adds_invite_and_demo_columns():
    import sqlite3
    from backend.db import _migrate

    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.executescript("""
        CREATE TABLE contacts(code TEXT PRIMARY KEY, label TEXT, chat_id INTEGER, tg_name TEXT, created REAL);
        INSERT INTO contacts VALUES('pending', 'Family', NULL, NULL, 1000);
        CREATE TABLE walks(id TEXT PRIMARY KEY, track TEXT, name TEXT, deadline REAL, status TEXT,
                          codes TEXT, base TEXT, sent INTEGER DEFAULT 0, created REAL);
        CREATE TABLE tracks(token TEXT PRIMARY KEY, key TEXT, lat REAL, lon REAL, updated REAL,
                            label TEXT, expires REAL);
    """)
    _migrate(connection)
    contact = connection.execute("SELECT invite_expires FROM contacts WHERE code='pending'").fetchone()
    walk_columns = {row["name"] for row in connection.execute("PRAGMA table_info(walks)")}
    track_columns = {row["name"] for row in connection.execute("PRAGMA table_info(tracks)")}
    contact_columns = {row["name"] for row in connection.execute("PRAGMA table_info(contacts)")}
    assert contact["invite_expires"] == 1000 + 7 * 24 * 60 * 60
    assert {"demo_session", "alert_reason"} <= walk_columns
    assert {"owner"} <= walk_columns & track_columns
    assert "owner" in contact_columns


def test_device_owner_claims_and_deletes_only_matching_records():
    from backend import db
    from backend import walk

    owner_a = db.owner_digest("device-a")
    owner_b = db.owner_digest("device-b")
    code = db.create_contact("Family", demo=False)
    token, key = db.create_track(1, 2, "share")
    active = walk.start("Traveler", 1, [], 12, 77, "https://example.test", owner=owner_a)
    db.claim_legacy_data(owner_a, [code], [{"token": token, "key": key}], [])
    assert db.get_contact(code)["owner"] == owner_a
    assert db.get_track(token)["owner"] == owner_a
    assert db.delete_owner_data(owner_b) == {"walks": 0, "tracks": 0, "contacts": 0}
    assert db.get_track(token) is not None
    assert db.delete_owner_data(owner_a) == {"walks": 1, "tracks": 2, "contacts": 1}
    assert db.get_contact(code) is None and db.get_track(token) is None
    assert walk.get(active["id"]) is None


def test_share_links_reject_untrusted_host_and_use_configured_canonical_host(monkeypatch):
    import pytest
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient
    from backend import db, main
    from backend.config import settings

    monkeypatch.setattr(settings, "public_base_url", "")
    with TestClient(main.app) as client:
        device = client.post("/api/device-token", json={}).json()["token"]
        owner = db.owner_digest(device)
        headers = {"X-Device-Token": device, "Host": "attacker.example"}
        before = db.one("SELECT COUNT(*) AS n FROM tracks WHERE owner=?", (owner,))["n"]
        blocked = client.post("/api/track", json={"lat": 1, "lon": 2}, headers=headers)
        assert blocked.status_code == 503
        after = db.one("SELECT COUNT(*) AS n FROM tracks WHERE owner=?", (owner,))["n"]
        assert before == after

        monkeypatch.setattr(settings, "public_base_url", "https://sathi.example")
        created = client.post("/api/track", json={"lat": 1, "lon": 2}, headers=headers)
        assert created.status_code == 200
        assert created.json()["url"].startswith("https://sathi.example/t/")
        db.delete_owner_data(owner)


def test_removing_contact_also_removes_it_from_walk_alert_lists():
    import json
    from backend import db, walk

    owner = db.owner_digest("device-with-contact")
    code = db.create_contact("Family", demo=False, owner=owner)
    active = walk.start(
        "Traveler", 10, [code], 12, 77, "https://example.test", owner=owner
    )
    assert db.delete_contact(code, owner)
    assert not db.delete_contact(code, owner)
    assert db.get_contact(code) is None
    assert json.loads(walk.get(active["id"])["codes"]) == []
    assert db.delete_owner_data(owner) == {"walks": 1, "tracks": 1, "contacts": 0}


def test_track_deletion_is_owner_scoped_and_expiry_can_be_extended():
    import time
    from backend import db

    owner = db.owner_digest("device")
    other_owner = db.owner_digest("other-device")
    token, key = db.create_track(1, 2, "share", owner=owner)
    expiry = time.time() + 3600
    db.extend_track_expiry(token, expiry)
    assert db.one("SELECT expires FROM tracks WHERE token=?", (token,))["expires"] >= expiry
    assert not db.delete_track(token, key, other_owner)
    assert db.delete_track(token, key, owner)
    assert db.get_track(token) is None


def test_track_links_expire(monkeypatch):
    from backend import db

    now = [1_800_000_000.0]
    monkeypatch.setattr(db.time, "time", lambda: now[0])
    token, _ = db.create_track(1, 2, "temporary", hours=0.001)
    assert db.get_track(token) is not None
    now[0] += 4
    assert db.get_track(token) is None


def test_purge_retains_active_walk_tracks_and_removes_old_completed_data(monkeypatch):
    from backend import db, walk

    now = [1_800_000_000.0]
    monkeypatch.setattr(db.time, "time", lambda: now[0])
    active = walk.start("Active", 1, [], 12, 77, "https://example.test")
    completed = walk.start("Completed", 1, [], 12, 77, "https://example.test")
    db.run("UPDATE walks SET deadline=?,status='active' WHERE id=?", (now[0] - 90_000, active["id"]))
    db.run("UPDATE walks SET deadline=?,status='safe' WHERE id=?", (now[0] - 90_000, completed["id"]))
    for item in (active, completed):
        db.run("UPDATE tracks SET expires=? WHERE token=?", (now[0] - 7200, item["track"]))

    db.purge()

    assert walk.get(active["id"]) is not None
    assert db.one("SELECT token FROM tracks WHERE token=?", (active["track"],)) is not None
    assert walk.get(completed["id"]) is None
    assert db.one("SELECT token FROM tracks WHERE token=?", (completed["track"],)) is None
    db.run("DELETE FROM walks WHERE id=?", (active["id"],))
    db.run("DELETE FROM tracks WHERE token=?", (active["track"],))


def test_token_rate_limiter_limits_token_without_forwarded_ip():
    import asyncio
    import pytest
    from fastapi import HTTPException
    from starlette.requests import Request
    from backend.ratelimit import token_limiter

    limit = token_limiter(1, 60, param="code")

    def request(code):
        return Request({
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": f"/api/contacts/{code}",
            "raw_path": f"/api/contacts/{code}".encode(),
            "query_string": b"",
            "headers": [],
            "path_params": {"code": code},
            "client": ("proxy", 12345),
            "server": ("test", 80),
        })

    asyncio.run(limit(request("secret-code")))
    with pytest.raises(HTTPException) as error:
        asyncio.run(limit(request("secret-code")))
    assert error.value.status_code == 429


def test_expired_walk_alert_is_resumed_after_failure(monkeypatch):
    import asyncio
    import pytest
    from backend import telegram, walk

    now = [1_800_000_000.0]
    monkeypatch.setattr(walk.time, "time", lambda: now[0])
    active = walk.start("Traveler", 1, [], 12.0, 77.0, "https://example.test")
    now[0] += 61
    attempts = []

    async def fail_once(*_args, **_kwargs):
        attempts.append(True)
        if len(attempts) == 1:
            raise RuntimeError("temporary delivery failure")
        return 0

    monkeypatch.setattr(telegram, "notify", fail_once)
    with pytest.raises(RuntimeError):
        asyncio.run(walk.check_expired())
    interrupted = walk.get(active["id"])
    assert interrupted["status"] == "alerting"
    assert interrupted["alert_reason"] == "timer"
    assert asyncio.run(walk.check_expired()) == 1
    assert walk.get(active["id"])["status"] == "alerted"


def test_demo_messages_are_scoped_and_expire(monkeypatch):
    import asyncio
    from backend import telegram

    now = [1_800_000_000.0]
    monkeypatch.setattr(telegram.time, "time", lambda: now[0])
    first, expires = telegram.create_demo_session()
    second, _ = telegram.create_demo_session()

    assert asyncio.run(telegram.send(0, "private alert", 1.0, 2.0, demo_session=first))
    assert telegram.get_demo_messages(first)[0]["text"] == "private alert"
    assert telegram.get_demo_messages(second) == []
    assert telegram.delete_demo_session(first) == 1
    assert telegram.get_demo_messages(first) is None
    now[0] = expires + 1
    assert telegram.get_demo_messages(second) is None


def test_telegram_poller_retries_startup_failure(monkeypatch):
    import asyncio
    import httpx
    import pytest
    from backend import telegram
    from backend.config import settings

    clients = []
    delays = []
    update_calls = []

    class Response:
        def __init__(self, value):
            self.value = value

        def raise_for_status(self):
            return None

        def json(self):
            return self.value

    class Client:
        def __init__(self, **_kwargs):
            clients.append(self)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return Response({"ok": True})

        async def get(self, url, **_kwargs):
            if url.endswith("/getMe") and len(clients) == 1:
                raise httpx.ConnectError("offline")
            if url.endswith("/getMe"):
                return Response({"ok": True, "result": {"username": "demo_bot"}})
            update_calls.append(True)
            if len(update_calls) > 1:
                raise asyncio.CancelledError()
            return Response({"ok": True, "result": []})

    async def fake_sleep(delay):
        delays.append(delay)

    monkeypatch.setattr(settings, "telegram_token", "test-token")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    monkeypatch.setattr(telegram.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(telegram, "_poll_state", {"status": "starting", "last_success": None, "last_error": None})
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(telegram.poll_loop())
    assert len(clients) == 2 and delays == [1]
    assert telegram.health_status()["status"] == "connected"
    assert telegram.health_status()["last_error"] is None


def test_telegram_message_success_is_not_retried_when_location_pin_fails(monkeypatch):
    import asyncio
    import httpx
    from backend import telegram
    from backend.config import settings

    calls = []

    class Client:
        def __init__(self, timeout):
            assert timeout == 15

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, json):
            calls.append(url)
            status = 200 if url.endswith("sendMessage") else 503
            return httpx.Response(status, json={"ok": status == 200}, request=httpx.Request("POST", url))

    monkeypatch.setattr(settings, "telegram_token", "test-token")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    sent = asyncio.run(telegram.send(123, "Alert", 1.0, 2.0))
    assert sent is True
    assert [url.rsplit("/", 1)[-1] for url in calls] == ["sendMessage", "sendLocation"]


def test_telegram_notify_sends_to_contacts_concurrently(monkeypatch):
    import asyncio
    from backend import telegram

    active = [0]
    maximum = [0]

    async def fake_send(*_args, **_kwargs):
        active[0] += 1
        maximum[0] = max(maximum[0], active[0])
        await asyncio.sleep(0)
        active[0] -= 1
        return True

    monkeypatch.setattr(telegram.db, "get_contact", lambda code: {"chat_id": code})
    monkeypatch.setattr(telegram, "send", fake_send)
    sent = asyncio.run(telegram.notify(["one", "two", "three"], "Alert"))
    assert sent == 3
    assert maximum[0] == 3


def test_rate_limiter_uses_peer_not_forwarded_for():
    import asyncio
    import pytest
    from fastapi import HTTPException
    from starlette.requests import Request
    from backend.ratelimit import limiter

    limit = limiter(1, 60)

    def request(forwarded_for):
        return Request({
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/",
            "raw_path": b"/",
            "query_string": b"",
            "headers": [(b"x-forwarded-for", forwarded_for.encode())],
            "client": ("trusted-proxy", 12345),
            "server": ("test", 80),
        })

    asyncio.run(limit(request("198.51.100.1")))
    with pytest.raises(HTTPException) as error:
        asyncio.run(limit(request("203.0.113.8")))
    assert error.value.status_code == 429


def test_rate_limiter_does_not_evict_active_buckets_at_capacity(monkeypatch):
    import asyncio
    import pytest
    from fastapi import HTTPException
    from starlette.requests import Request
    from backend import ratelimit

    now = [0.0]
    monkeypatch.setattr(ratelimit.time, "monotonic", lambda: now[0])
    monkeypatch.setattr(ratelimit, "MAX_BUCKETS", 1)
    limit = ratelimit.limiter(2, 60)

    def request(ip):
        return Request({
            "type": "http", "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1", "method": "GET", "scheme": "http", "path": "/",
            "raw_path": b"/", "query_string": b"", "headers": [],
            "client": (ip, 12345), "server": ("test", 80),
        })

    asyncio.run(limit(request("first")))
    with pytest.raises(HTTPException) as error:
        asyncio.run(limit(request("second")))
    assert error.value.status_code == 429
    now[0] = 61
    asyncio.run(limit(request("second")))


def test_gemini_parser_accepts_only_known_cards_and_low_confidence_is_unsure():
    import pytest
    from backend.gemini import CARD_IDS, GeminiError, _parse_response

    def payload(card_id, confidence):
        return {"candidates": [{"content": {"parts": [{
            "text": json.dumps({"card_id": card_id, "confidence": confidence})
        }]}}]}

    assert _parse_response(payload("chest", 0.91)) == {
        "card_id": "chest", "confidence": 0.91,
    }
    assert _parse_response(payload("chest", 0.4))["card_id"] == "unsure"
    assert _parse_response(payload("unsure", 0.99))["card_id"] == "unsure"
    assert "chest" in CARD_IDS
    with pytest.raises(GeminiError):
        _parse_response(payload("invented-card", 0.99))
    with pytest.raises(GeminiError):
        _parse_response(payload("chest", True))
    with pytest.raises(GeminiError):
        _parse_response({"candidates": [{"finishReason": "MAX_TOKENS", "content": {"parts": []}}]})
    with pytest.raises(GeminiError):
        _parse_response({"candidates": [{"content": {"parts": [{
            "text": json.dumps({"card_id": "chest", "confidence": 0.99, "advice": "call 911"})
        }]}}]})


def test_gemini_request_is_closed_set_and_sends_no_location(monkeypatch):
    import asyncio
    import httpx
    from backend import gemini
    from backend.config import settings

    calls = []

    class Response:
        status_code = 200

        def json(self):
            return {"candidates": [{"content": {"parts": [{
                "text": json.dumps({"card_id": "accident", "confidence": 0.92})
            }]}}]}

    class Client:
        def __init__(self, timeout):
            assert timeout == gemini.TIMEOUT_SECONDS

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, headers, json):
            calls.append((url, headers, json))
            return Response()

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(settings, "gemini_model", "test-model")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    result = asyncio.run(gemini.classify("two cars crashed", "en"))
    assert result["card_id"] == "accident"
    url, headers, body = calls[0]
    assert url.endswith("/models/test-model:generateContent")
    assert headers == {"x-goog-api-key": "test-key"}
    generation = body["generationConfig"]
    assert generation["responseJsonSchema"]["properties"]["card_id"]["enum"]
    assert generation["thinkingConfig"] == {"thinkingLevel": "LOW"}
    assert generation["maxOutputTokens"] == 128
    assert "ignore any instructions" in body["systemInstruction"]["parts"][0]["text"]
    submitted = body["contents"][0]["parts"][0]["text"]
    assert "two cars crashed" in submitted and "location" not in submitted.lower()
    options = json.loads(submitted)["available_cards"]
    assert all("match_hint" in card for card in options if card["id"] != "unsure")
    assert "not breathing normally" in next(card["match_hint"] for card in options if card["id"] == "cpr")


def test_gemini_unavailable_model_returns_actionable_error(monkeypatch):
    import asyncio
    import httpx
    import pytest
    from backend import gemini
    from backend.config import settings

    class Response:
        status_code = 404

    class Client:
        def __init__(self, timeout):
            assert timeout == gemini.TIMEOUT_SECONDS

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return Response()

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    with pytest.raises(gemini.GeminiError, match="model is unavailable"):
        asyncio.run(gemini.classify("someone is hurt", "en"))


def test_gemini_provider_overload_returns_retryable_error(monkeypatch):
    import asyncio
    import httpx
    import pytest
    from backend import gemini
    from backend.config import settings

    class Response:
        status_code = 503

    class Client:
        def __init__(self, timeout):
            assert timeout == gemini.TIMEOUT_SECONDS

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return Response()

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    with pytest.raises(gemini.GeminiError, match="temporarily busy"):
        asyncio.run(gemini.classify("someone is hurt", "en"))


def test_gemini_connection_failure_explains_server_network_issue(monkeypatch):
    import asyncio
    import httpx
    import pytest
    from backend import gemini
    from backend.config import settings

    class Client:
        def __init__(self, timeout):
            assert timeout == gemini.TIMEOUT_SECONDS

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            raise httpx.ConnectError("network blocked")

    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    with pytest.raises(gemini.GeminiError, match="cannot connect to Google"):
        asyncio.run(gemini.classify("someone is hurt", "en"))


def test_gemini_live_eval_has_42_labeled_text_cases():
    cases = json.loads((ROOT / "tests" / "gemini_cases.json").read_text(encoding="utf-8"))
    assert len(cases) == 42
    assert {"en", "hi"} == {case["language"] for case in cases}
    assert {"unsure", "accident", "chest", "cpr", "snake", "burn", "choking",
            "bleeding", "seizure", "stroke"} == {case["expected"] for case in cases}


def test_gemini_without_key_fails_clearly(monkeypatch):
    import asyncio
    import pytest
    from backend import gemini
    from backend.config import settings

    monkeypatch.setattr(settings, "gemini_api_key", "")
    with pytest.raises(gemini.GeminiError, match="not configured"):
        asyncio.run(gemini.classify("someone is hurt", "en"))


def test_env_loader_reads_bom_file_and_fills_empty_process_value(monkeypatch, tmp_path):
    from backend import config

    (tmp_path / ".env").write_text("\ufeffGEMINI_API_KEY=example-key\n", encoding="utf-8")
    monkeypatch.setattr(config, "ROOT", tmp_path)
    monkeypatch.setenv("GEMINI_API_KEY", "   ")
    config._load_env()
    assert config.os.environ["GEMINI_API_KEY"] == "example-key"


def test_first_aid_cards_complete_in_both_languages():
    data = json.loads((ROOT / "frontend" / "firstaid.json").read_text(encoding="utf-8"))
    assert len(data["cards"]) >= 8
    for c in data["cards"]:
        for k in ("steps", "donts"):
            assert len(c[k]["en"]) == len(c[k]["hi"]) > 0, c["id"]
        assert c["title"]["en"] and c["title"]["hi"]
        # safety rule of this project: no medicine doses
        blob = json.dumps(c, ensure_ascii=False).lower()
        for bad in (" mg", "tablet", "ml "):
            assert bad not in blob, (c["id"], bad)


def test_api_flow_demo_mode(monkeypatch):
    import pytest
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient
    from backend import main
    app = main.app

    async def fake_health():
        return {"reachable": True, "checked_at": 1}

    monkeypatch.setattr(overpass, "health", fake_health)
    with TestClient(app) as c:
        health = c.get("/api/health").json()
        assert health["demo_mode"] is True
        assert health["overpass"]["reachable"] is True
        assert health["telegram"]["status"] == "demo"
        assert health["walk_watcher"]["status"] in {"running", "starting"}
        async def fake_fast(lat, lon):
            return {"center": {"lat": lat, "lon": lon}, "results": {"hospital": []}}

        monkeypatch.setattr(overpass, "nearby_fast", fake_fast)
        fast = c.post("/api/nearby/fast", json={"lat": 26.45, "lon": 80.35})
        assert fast.status_code == 200 and fast.json()["results"]["hospital"] == []
        async def fake_reverse(lat, lon):
            return f"Mapped place for {lat},{lon}"

        monkeypatch.setattr(overpass, "reverse", fake_reverse)
        reverse = c.post("/api/reverse", json={"lat": 26.45, "lon": 80.35})
        assert reverse.status_code == 200 and "26.45,80.35" in reverse.json()["address"]
        assert c.post("/api/reverse", json={"lat": 91, "lon": 0}).status_code == 422

        async def failed_reverse(_lat, _lon):
            raise RuntimeError("provider unavailable")

        monkeypatch.setattr(overpass, "reverse", failed_reverse)
        reverse_error = c.post("/api/reverse", json={"lat": 26.45, "lon": 80.35})
        assert reverse_error.status_code == 503 and "coordinates" in reverse_error.json()["detail"]
        assert c.get("/api/demo-log").status_code == 401
        session = c.post("/api/demo-session").json()["token"]
        device = c.post("/api/device-token", json={}).json()["token"]
        headers = {"X-Demo-Session": session, "X-Device-Token": device}
        async def fake_gemini(description, language):
            assert description == "someone fell"
            assert language == "en"
            return {"card_id": "accident", "confidence": 0.9}

        monkeypatch.setattr(main.gemini, "classify", fake_gemini)
        assert c.post(
            "/api/gemini/route",
            json={"description": "someone fell", "language": "en"},
        ).status_code == 401
        routed = c.post(
            "/api/gemini/route",
            json={"description": "someone fell", "language": "en"},
            headers=headers,
        )
        assert routed.status_code == 200 and routed.json()["card_id"] == "accident"
        assert c.post(
            "/api/gemini/route",
            json={"description": "x" * 501, "language": "en"},
            headers=headers,
        ).status_code == 422
        code = c.post("/api/contacts", json={"label": "Mom"}, headers=headers).json()["code"]
        assert c.get(f"/api/contacts/{code}", headers=headers).json()["joined"] is True  # demo mode auto-joins

        no_location_alert = c.post("/api/sos", json={"codes": [code]}, headers=headers)
        assert no_location_alert.status_code == 200 and no_location_alert.json()["sent"] == 1
        alert_text = c.get("/api/demo-log", headers=headers).json()["messages"][-1]["text"]
        assert "Location unavailable" in alert_text
        assert "q=None" not in alert_text

        walk_body = {"minutes": 30, "codes": [code], "lat": 26.45, "lon": 80.35, "name": "Asha", "battery": 47}
        w = c.post("/api/walk", json=walk_body, headers=headers).json()
        assert w["status"] == "active" and w["remaining_s"] > 1700
        assert c.post(f"/api/walk/{w['id']}/ping", json={"lat": 26.46, "lon": 80.36, "battery": 42}, headers=headers).json()["status"] == "active"
        tr = c.get(f"/api/track/{w['track']}").json()
        assert abs(tr["lat"] - 26.46) < 1e-9
        from backend import db
        assert db.get_track(w["track"])["battery"] == 42

        assert c.post(f"/api/walk/{w['id']}/panic", headers=headers).json()["status"] == "alerted"
        assert c.post(f"/api/walk/{w['id']}/safe", headers=headers).json()["status"] == "alerted"
        msgs = c.get("/api/demo-log", headers=headers).json()["messages"]
        assert any("SAFETY ALERT" in m["text"] and "Asha" in m["text"] for m in msgs)
        assert any("Last reported battery: 42%" in m["text"] for m in msgs)
        assert any(f"testserver/t/{w['track']}" in m["text"] for m in msgs)
        other_session = c.post("/api/demo-session").json()["token"]
        assert c.get("/api/demo-log", headers={"X-Demo-Session": other_session}).json()["messages"] == []

        w2 = c.post("/api/walk", json={"minutes": 5, "codes": [code], "lat": 1, "lon": 1}, headers=headers).json()
        extended = c.post(f"/api/walk/{w2['id']}/extend", json={"minutes": 10}, headers=headers)
        assert extended.status_code == 200 and extended.json()["remaining_s"] > 800
        assert c.post(f"/api/walk/{w2['id']}/safe", headers=headers).json()["status"] == "safe"
        assert c.post(f"/api/walk/{w2['id']}/panic", headers=headers).json()["status"] == "safe"  # no alert after check-in

        w3 = c.post("/api/walk", json={"minutes": 5, "codes": [code], "lat": 1, "lon": 1}, headers=headers).json()
        discreet = c.post(f"/api/walk/{w3['id']}/duress", headers=headers)
        assert discreet.status_code == 200 and discreet.json()["status"] == "alerted"
        assert discreet.json()["alert_reason"] == "duress"
        assert any("sent a discreet safety alert" in m["text"] for m in c.get("/api/demo-log", headers=headers).json()["messages"])

        invalid_battery = c.post("/api/walk", json={"minutes": 5, "codes": [code], "lat": 1, "lon": 1, "battery": 101}, headers=headers)
        assert invalid_battery.status_code == 422

        t = c.post("/api/track", json={"lat": 1, "lon": 2, "label": "x"}, headers=headers).json()
        assert c.post(f"/api/track/{t['token']}", json={"key": "wrong-key", "lat": 3, "lon": 3}, headers=headers).status_code == 403
        assert c.post(f"/api/track/{t['token']}", json={"key": t["key"], "lat": 3, "lon": 3}, headers=headers).status_code == 200

        removable = c.post("/api/contacts", json={"label": "Temporary"}, headers=headers).json()["code"]
        assert c.delete(f"/api/contacts/{removable}", headers=headers).status_code == 200
        assert c.get(f"/api/contacts/{removable}", headers=headers).status_code == 404

        sos_body = {"codes": [code], "lat": 1, "lon": 2, "emergency": "Snakebite"}
        assert c.post("/api/sos", json=sos_body).status_code == 401
        assert c.post("/api/sos", json=sos_body, headers=headers).json()["sent"] == 1
        assert c.post("/api/nearby", json={"lat": 999, "lon": 0}).status_code == 422
        deleted = c.delete("/api/data", headers=headers)
        assert deleted.status_code == 200
        assert deleted.json()["deleted"] == {"walks": 3, "tracks": 4, "contacts": 1}
        assert c.get(f"/api/contacts/{code}", headers=headers).status_code == 404
        assert c.get(f"/api/walk/{w2['id']}", headers=headers).status_code == 404
        assert c.get(f"/api/track/{t['token']}").status_code == 404
        assert c.get("/").status_code == 200
