"""Aapatkaal Saathi: FastAPI app. Run: uvicorn backend.main:app --reload"""
import asyncio
import json
import logging
import secrets
import time
from contextlib import asynccontextmanager
from typing import Annotated, Literal
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db, gemini, overpass, telegram, walk
from .config import ROOT, settings
from .ratelimit import limiter, token_limiter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
FRONTEND = ROOT / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [asyncio.create_task(_supervise("walk watcher", walk.watcher))]
    if telegram.configured():
        tasks.append(asyncio.create_task(_supervise("Telegram poller", telegram.poll_loop)))
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


async def _supervise(name: str, worker):
    delay = 1
    while True:
        try:
            await worker()
            raise RuntimeError(f"{name} stopped unexpectedly")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logging.getLogger("lifespan").error(
                "%s stopped (%s); restarting in %s seconds", name, type(e).__name__, delay
            )
            await asyncio.sleep(delay)
            delay = min(delay * 2, 60)


app = FastAPI(title="Aapatkaal Saathi", lifespan=lifespan)
_live_ws_hits: dict[str, list[float]] = {}


def base_url(request: Request) -> str:
    if settings.public_base_url:
        parsed = urlsplit(settings.public_base_url)
        local_host = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
        if (
            not parsed.hostname
            or (parsed.scheme != "https" and not local_host)
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
        ):
            raise HTTPException(503, "PUBLIC_BASE_URL must be a trusted HTTPS URL without credentials or query data.")
        return settings.public_base_url
    host = (request.url.hostname or "").lower()
    if host in {"localhost", "127.0.0.1", "::1", "testserver"}:
        return str(request.base_url).rstrip("/")
    raise HTTPException(503, "Set PUBLIC_BASE_URL to the trusted public HTTPS address before creating share links.")


def _require_demo_session(request: Request) -> str | None:
    if telegram.configured():
        return None
    token = request.headers.get("x-demo-session", "")
    if not token or telegram.get_demo_messages(token) is None:
        raise HTTPException(401, "Demo session expired. Reload the app and try again.")
    return token


def _require_device(request: Request) -> str:
    token = request.headers.get("x-device-token", "")
    if len(token) != 43 or any(c not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for c in token):
        raise HTTPException(401, "A valid device session is required.")
    return db.owner_digest(token)


def _require_owned_contacts(codes: list[str], owner: str) -> None:
    if any((contact := db.get_contact(code)) is None or contact["owner"] != owner for code in codes):
        raise HTTPException(404, "A safety contact was not found for this device.")


def _single_line(value: str, limit: int) -> str:
    return " ".join(value.split())[:limit]


Lat = Field(ge=-90, le=90)
Lon = Field(ge=-180, le=180)
BoundedToken = Annotated[
    str, Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
]


# ------------------------------------------------------------------ info
@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "demo_mode": not telegram.configured(),
        "overpass": await overpass.health(),
        "telegram": telegram.health_status(),
        "gemini": {"configured": gemini.configured()},
        "walk_watcher": walk.health_status(),
        "bot": settings.bot_username or None,
    }


@app.post("/api/demo-session", dependencies=[Depends(limiter(20, 60))])
async def new_demo_session():
    if telegram.configured():
        return {"demo_mode": False, "token": None, "expires_at": None}
    token, expires = telegram.create_demo_session()
    return {"demo_mode": True, "token": token, "expires_at": expires}


class LegacyTrackClaim(BaseModel):
    token: BoundedToken
    key: BoundedToken


class DeviceTokenClaims(BaseModel):
    contacts: list[BoundedToken] = Field(default_factory=list, max_length=100)
    tracks: list[LegacyTrackClaim] = Field(default_factory=list, max_length=100)
    walks: list[BoundedToken] = Field(default_factory=list, max_length=100)


@app.post("/api/device-token", dependencies=[Depends(limiter(10, 60))])
async def new_device_token(body: DeviceTokenClaims):
    token = secrets.token_urlsafe(32)
    owner = db.owner_digest(token)
    db.claim_legacy_data(
        owner,
        body.contacts,
        [track.model_dump() for track in body.tracks],
        body.walks,
    )
    return {"token": token}


@app.delete(
    "/api/data",
    dependencies=[Depends(limiter(5, 60)), Depends(token_limiter(3, 60, header="x-device-token"))],
)
async def delete_device_data(request: Request):
    owner = _require_device(request)
    deleted = db.delete_owner_data(owner)
    demo_token = request.headers.get("x-demo-session", "")
    demo_messages = telegram.delete_demo_session(demo_token) if demo_token else 0
    return {"deleted": deleted, "demo_messages": demo_messages}


# ------------------------------------------------------------------ nearby places (OpenStreetMap)
class ReverseLocation(BaseModel):
    lat: float = Lat
    lon: float = Lon


class GeminiRouteRequest(BaseModel):
    description: str = Field(min_length=3, max_length=gemini.MAX_DESCRIPTION_CHARS)
    language: Literal["en", "hi"]


class GeminiLiveRequest(BaseModel):
    language: Literal["en", "hi"]


@app.websocket("/api/gemini/live")
async def gemini_live_proxy(websocket: WebSocket):
    """Relay Live audio over the app's origin to avoid client-side WSS restrictions."""
    await websocket.accept()
    upstream = None
    try:
        ip = websocket.client.host if websocket.client else "?"
        now = time.monotonic()
        hits = [stamp for stamp in _live_ws_hits.get(ip, []) if stamp > now - 60]
        if len(hits) >= 4:
            await websocket.close(code=4429, reason="Wait before starting another Live session")
            return
        hits.append(now)
        _live_ws_hits[ip] = hits
        if len(_live_ws_hits) > 10000:
            _live_ws_hits.clear()
            _live_ws_hits[ip] = hits
        start = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        claims = start.get("start", {}) if isinstance(start, dict) else {}
        device = claims.get("device_token", "") if isinstance(claims, dict) else ""
        language = claims.get("language") if isinstance(claims, dict) else None
        mode = claims.get("mode", "conversation") if isinstance(claims, dict) else None
        if (
            not isinstance(device, str) or len(device) != 43
            or any(c not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for c in device)
            or language not in {"en", "hi"}
            or mode not in {"conversation", "transcribe"}
        ):
            await websocket.close(code=4401, reason="Valid device session and language required")
            return

        auth = await gemini.live_token(language)
        import websockets
        from urllib.parse import quote
        url = (
            "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta."
            "GenerativeService.BidiGenerateContentConstrained?access_token="
            + quote(auth["token"], safe="")
        )
        upstream = await websockets.connect(url, open_timeout=gemini.TIMEOUT_SECONDS)
        instruction = "" if mode == "transcribe" else (
            f"You are a calm emergency first-aid helper. Speak in {'Hindi' if language == 'hi' else 'English'}. "
            "Give only simple, low-risk first-aid guidance; no diagnosis, medicine, doses, or risky procedures. "
            "For emergencies tell the user to call India 112 and follow the operator. Keep replies short."
        )
        live_setup = {
            "model": "models/gemini-3.5-transcribe-live" if mode == "transcribe" else auth["model"],
            "generationConfig": {"responseModalities": ["TEXT"] if mode == "transcribe" else ["AUDIO"]},
            "inputAudioTranscription": {},
        }
        if mode == "conversation":
            live_setup["systemInstruction"] = {"parts": [{"text": instruction}]}
            live_setup["outputAudioTranscription"] = {}
        await upstream.send(json.dumps({"setup": live_setup}))
        setup_message = await asyncio.wait_for(upstream.recv(), timeout=gemini.TIMEOUT_SECONDS)
        setup_payload = json.loads(setup_message)
        if "setupComplete" not in setup_payload:
            await websocket.send_json({"error": {"message": "Gemini Live setup was rejected."}})
            await websocket.close(code=1011, reason="Gemini Live setup failed")
            return
        await websocket.send_text(setup_message if isinstance(setup_message, str) else setup_message.decode("utf-8"))

        async def from_browser():
            while True:
                await upstream.send(await websocket.receive_text())

        async def from_gemini():
            async for message in upstream:
                await websocket.send_text(message if isinstance(message, str) else message.decode("utf-8"))

        tasks = [asyncio.create_task(from_browser()), asyncio.create_task(from_gemini())]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)
        for task in done:
            task.result()
    except WebSocketDisconnect:
        pass
    except gemini.GeminiError as error:
        try:
            await websocket.send_json({"error": {"message": str(error)}})
            await websocket.close(code=1011, reason="Gemini is unavailable")
        except Exception:
            pass
    except Exception as error:
        logging.getLogger("gemini-live").warning("Live relay failed (%s)", type(error).__name__)
        try:
            await websocket.send_json({"error": {"message": "Live audio connection failed."}})
            await websocket.close(code=1011, reason="Live audio connection failed")
        except Exception:
            pass
    finally:
        if upstream is not None:
            await upstream.close()


class GeminiHospitalRequest(ReverseLocation):
    name: str = Field(min_length=2, max_length=120)
    language: Literal["en", "hi"]


class GeminiMedicineRequest(BaseModel):
    image_base64: str = Field(min_length=1, max_length=7_000_000)
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    language: Literal["en", "hi"]


@app.post("/api/gemini/live-token", dependencies=[Depends(limiter(5, 60)), Depends(token_limiter(5, 60, header="x-device-token"))])
async def gemini_live_token(body: GeminiLiveRequest, request: Request):
    _require_device(request)
    try:
        return await gemini.live_token(body.language)
    except gemini.GeminiError as error:
        raise HTTPException(503, str(error)) from error


@app.post("/api/gemini/hospital-hours", dependencies=[Depends(limiter(8, 60)), Depends(token_limiter(5, 60, header="x-device-token"))])
async def gemini_hospital_hours(body: GeminiHospitalRequest, request: Request):
    _require_device(request)
    try:
        # Round coordinates to about 1 km; exact GPS is not needed for this search.
        location = f"{body.lat:.2f}, {body.lon:.2f}"
        return await gemini.hospital_hours(_single_line(body.name, 120), location, body.language)
    except gemini.GeminiError as error:
        raise HTTPException(503, str(error)) from error


@app.post("/api/gemini/medicine", dependencies=[Depends(limiter(5, 60)), Depends(token_limiter(3, 60, header="x-device-token"))])
async def gemini_medicine(body: GeminiMedicineRequest, request: Request):
    _require_device(request)
    import base64
    try:
        image = base64.b64decode(body.image_base64, validate=True)
        if len(image) > gemini.MAX_IMAGE_BYTES:
            raise ValueError("Photo must be 5 MB or smaller.")
        return {"answer": await gemini.read_medicine(image, body.mime_type, body.language)}
    except (ValueError, gemini.GeminiError) as error:
        raise HTTPException(422 if isinstance(error, ValueError) else 503, str(error)) from error


@app.post(
    "/api/gemini/route",
    dependencies=[
        Depends(limiter(8, 60)),
        Depends(token_limiter(5, 60, header="x-device-token")),
    ],
)
async def gemini_route(body: GeminiRouteRequest, request: Request):
    _require_device(request)
    description = _single_line(body.description, gemini.MAX_DESCRIPTION_CHARS)
    if len(description) < 3:
        raise HTTPException(422, "Describe what happened in a few words.")
    try:
        return await gemini.classify(description, body.language)
    except gemini.GeminiError as error:
        raise HTTPException(503, str(error)) from error


class NearbyRequest(ReverseLocation):
    types: str = Field("hospital,clinic,pharmacy,police", max_length=120)


FacilityOsmId = Annotated[str, Field(min_length=2, max_length=32, pattern=r"^[nwr]\d+$")]


class FacilityCheckRequest(BaseModel):
    osm_id: FacilityOsmId
    status: Literal["open", "closed"]


class FacilityCheckLookup(BaseModel):
    osm_ids: list[FacilityOsmId] = Field(max_length=100)


@app.post("/api/facility-checks/lookup", dependencies=[Depends(limiter(60, 60))])
async def facility_check_lookup(body: FacilityCheckLookup):
    return {"checks": db.get_facility_checks(body.osm_ids)}


@app.post("/api/facility-checks", dependencies=[Depends(limiter(30, 60))])
async def facility_check_submit(body: FacilityCheckRequest):
    return db.set_facility_check(body.osm_id, body.status)


@app.post("/api/nearby", dependencies=[Depends(limiter(30, 60))])
async def api_nearby(body: NearbyRequest):
    try:
        return await overpass.nearby(body.lat, body.lon, [t.strip() for t in body.types.split(",")])
    except Exception as e:
        logging.getLogger("nearby").error("overpass failed (%s)", type(e).__name__)
        raise HTTPException(503, "Map service is busy. Try again, or use the saved list.")


@app.post("/api/nearby/fast", dependencies=[Depends(limiter(10, 60))])
async def api_nearby_fast(body: ReverseLocation):
    try:
        return await overpass.nearby_fast(body.lat, body.lon)
    except Exception as e:
        logging.getLogger("nearby").error("fast Overpass query failed (%s)", type(e).__name__)
        raise HTTPException(503, "Nearby hospitals are temporarily unavailable. Call 112.")


class GeocodeRequest(BaseModel):
    q: str = Field(min_length=3, max_length=120)


@app.post("/api/geocode", dependencies=[Depends(limiter(10, 60))])
async def api_geocode(body: GeocodeRequest):
    try:
        return {"results": await overpass.geocode(body.q)}
    except Exception:
        raise HTTPException(503, "Place search is unavailable right now.")


@app.post("/api/reverse", dependencies=[Depends(limiter(10, 60))])
async def api_reverse(body: ReverseLocation):
    try:
        return {"address": await overpass.reverse(body.lat, body.lon)}
    except Exception as e:
        logging.getLogger("reverse").warning("Nominatim reverse lookup failed: %s", type(e).__name__)
        raise HTTPException(503, "Nearby mapped place is unavailable. Give the operator your coordinates.")


# ------------------------------------------------------------------ safety contacts (Telegram)
class NewContact(BaseModel):
    label: str = Field("", max_length=40)


@app.post(
    "/api/contacts",
    dependencies=[Depends(limiter(20, 60)), Depends(token_limiter(20, 60, header="x-device-token"))],
)
async def new_contact(body: NewContact, request: Request):
    owner = _require_device(request)
    demo = not telegram.configured()
    label = _single_line(body.label, 40) or "Contact"
    code = db.create_contact(label, demo, owner=owner)
    link = f"https://t.me/{settings.bot_username}?start={code}" if settings.bot_username and not demo else None
    return {"code": code, "link": link, "demo_mode": demo}


@app.get(
    "/api/contacts/{code}",
    dependencies=[
        Depends(limiter(120, 60)),
        Depends(token_limiter(30, 60, param="code")),
        Depends(token_limiter(120, 60, header="x-device-token")),
    ],
)
async def contact_status(code: BoundedToken, request: Request):
    owner = _require_device(request)
    c = db.get_contact(code)
    if not c or c["owner"] != owner:
        raise HTTPException(404, "Unknown contact")
    invite_live = (
        c["chat_id"] is None
        and c["invite_expires"] is not None
        and c["invite_expires"] > time.time()
    )
    link = f"https://t.me/{settings.bot_username}?start={code}" if settings.bot_username and invite_live else None
    return {"code": code, "label": c["label"], "joined": c["chat_id"] is not None,
            "tg_name": c["tg_name"], "link": link,
            "invite_expired": c["chat_id"] is None and not invite_live}


@app.delete(
    "/api/contacts/{code}",
    dependencies=[
        Depends(limiter(10, 60)),
        Depends(token_limiter(10, 60, param="code")),
        Depends(token_limiter(10, 60, header="x-device-token")),
    ],
)
async def delete_contact(code: BoundedToken, request: Request):
    owner = _require_device(request)
    if not db.delete_contact(code, owner):
        raise HTTPException(404, "Safety contact not found for this device.")
    return {"ok": True}


class SOS(BaseModel):
    codes: list[BoundedToken] = Field(default_factory=list, max_length=10)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    emergency: str = Field("", max_length=60)
    name: str = Field("", max_length=40)
    track: str = Field("", max_length=128)


@app.post(
    "/api/sos",
    dependencies=[Depends(limiter(10, 60)), Depends(token_limiter(10, 60, header="x-device-token"))],
)
async def sos(body: SOS, request: Request):
    owner = _require_device(request)
    _require_owned_contacts(body.codes, owner)
    demo_session = _require_demo_session(request)
    who = _single_line(body.name, 40) or "Someone you know"
    emergency = _single_line(body.emergency, 60)
    track = body.track
    if track:
        live_track = db.get_track(track)
        if not live_track or live_track["owner"] != owner:
            raise HTTPException(404, "Live location link not found for this device.")
    live = f"\nLive location page: {base_url(request)}/t/{track}" if track else ""
    location = (
        f"\nLocation: {walk.maps_link(body.lat, body.lon)}"
        if body.lat is not None and body.lon is not None
        else "\nLocation unavailable; call them to confirm where they are."
    )
    text = (f"🆘 EMERGENCY\n{who} needs help" + (f" ({emergency})." if emergency else ".") +
            f"{location}{live}\n\nPlease call them now and call 112.")
    sent = await telegram.notify(body.codes, text, body.lat, body.lon, demo_session=demo_session)
    return {"sent": sent}


# ------------------------------------------------------------------ live location link
class NewTrack(BaseModel):
    lat: float = Lat
    lon: float = Lon
    label: str = Field("", max_length=40)


@app.post(
    "/api/track",
    dependencies=[Depends(limiter(20, 60)), Depends(token_limiter(20, 60, header="x-device-token"))],
)
async def new_track(body: NewTrack, request: Request):
    owner = _require_device(request)
    public_url = base_url(request)
    token, key = db.create_track(body.lat, body.lon, _single_line(body.label, 40), owner=owner)
    return {"token": token, "key": key, "url": f"{public_url}/t/{token}"}


class TrackUpdate(BaseModel):
    key: BoundedToken
    lat: float = Lat
    lon: float = Lon


class TrackDelete(BaseModel):
    key: BoundedToken


@app.post(
    "/api/track/{token}",
    dependencies=[
        Depends(limiter(60, 60)),
        Depends(token_limiter(60, 60, param="token")),
        Depends(token_limiter(60, 60, header="x-device-token")),
    ],
)
async def update_track(token: BoundedToken, body: TrackUpdate, request: Request):
    owner = _require_device(request)
    t = db.get_track(token)
    if not t or t["owner"] != owner or t["key"] != body.key:
        raise HTTPException(403, "Invalid link")
    db.update_track(token, body.lat, body.lon)
    return {"ok": True}


@app.delete(
    "/api/track/{token}",
    dependencies=[
        Depends(limiter(10, 60)),
        Depends(token_limiter(10, 60, param="token")),
        Depends(token_limiter(10, 60, header="x-device-token")),
    ],
)
async def stop_track(token: BoundedToken, body: TrackDelete, request: Request):
    owner = _require_device(request)
    if not db.delete_track(token, body.key, owner):
        raise HTTPException(404, "Live location link not found.")
    return {"ok": True}


@app.get(
    "/api/track/{token}",
    dependencies=[Depends(limiter(120, 60)), Depends(token_limiter(120, 60, param="token"))],
)
async def read_track(token: BoundedToken):
    t = db.get_track(token)
    if not t:
        raise HTTPException(404, "This live location link has expired.")
    return {"lat": t["lat"], "lon": t["lon"], "label": t["label"], "age_s": int(time.time() - t["updated"])}


@app.get("/t/{token}", dependencies=[Depends(limiter(120, 60)), Depends(token_limiter(120, 60, param="token"))])
async def track_page(token: BoundedToken):
    if not db.get_track(token):
        raise HTTPException(404, "This live location link has expired.")
    return FileResponse(FRONTEND / "track.html")


# ------------------------------------------------------------------ walk with me
class WalkStart(BaseModel):
    minutes: int = Field(ge=1, le=720)
    codes: list[BoundedToken] = Field(default_factory=list, max_length=10)
    lat: float = Lat
    lon: float = Lon
    name: str = Field("", max_length=40)
    battery: int | None = Field(default=None, ge=0, le=100)


class Ping(BaseModel):
    lat: float = Lat
    lon: float = Lon
    battery: int | None = Field(default=None, ge=0, le=100)


class Extend(BaseModel):
    minutes: int = Field(ge=1, le=240)


def _view(w: dict) -> dict:
    return {"id": w["id"], "status": w["status"], "deadline": w["deadline"], "sent": w["sent"],
            "remaining_s": max(0, int(w["deadline"] - time.time())), "track": w["track"],
            "alert_reason": w.get("alert_reason")}


def _need(wid: BoundedToken, owner: str) -> dict:
    w = walk.get(wid)
    if not w or w.get("owner") != owner:
        raise HTTPException(404, "Walk not found")
    return w


@app.post(
    "/api/walk",
    dependencies=[Depends(limiter(10, 60)), Depends(token_limiter(10, 60, header="x-device-token"))],
)
async def walk_start(body: WalkStart, request: Request):
    owner = _require_device(request)
    _require_owned_contacts(body.codes, owner)
    demo_session = _require_demo_session(request)
    name = _single_line(body.name, 40)
    w = walk.start(
        name, body.minutes, body.codes, body.lat, body.lon, base_url(request),
        demo_session=demo_session, owner=owner,
    )
    if body.battery is not None:
        db.update_track(w["track"], body.lat, body.lon, body.battery)
    who = name or "Your contact"
    await telegram.notify(
        body.codes,
        f"🚶 {who} started a safety walk. You will be alerted if they have not checked in by "
        f"{walk.ist(w['deadline'])}.\nLive location: {w['base']}/t/{w['track']}",
        body.lat, body.lon, demo_session=demo_session)
    return _view(w)


@app.get(
    "/api/walk/{wid}",
    dependencies=[
        Depends(limiter(120, 60)),
        Depends(token_limiter(120, 60, param="wid")),
        Depends(token_limiter(120, 60, header="x-device-token")),
    ],
)
async def walk_status(wid: BoundedToken, request: Request):
    return _view(_need(wid, _require_device(request)))


@app.post(
    "/api/walk/{wid}/ping",
    dependencies=[
        Depends(limiter(60, 60)),
        Depends(token_limiter(60, 60, param="wid")),
        Depends(token_limiter(60, 60, header="x-device-token")),
    ],
)
async def walk_ping(wid: BoundedToken, body: Ping, request: Request):
    w = _need(wid, _require_device(request))
    if w["status"] == "active":
        db.update_track(w["track"], body.lat, body.lon, body.battery)
    return _view(w)


@app.post(
    "/api/walk/{wid}/safe",
    dependencies=[
        Depends(limiter(30, 60)),
        Depends(token_limiter(30, 60, param="wid")),
        Depends(token_limiter(30, 60, header="x-device-token")),
    ],
)
async def walk_safe(wid: BoundedToken, request: Request):
    w = _need(wid, _require_device(request))
    changed = db.run(
        "UPDATE walks SET status='safe' WHERE id=? AND owner=? AND status='active'",
        (wid, w["owner"]),
    )
    if changed:
        await telegram.notify(
            json.loads(w["codes"]),
            f"✅ {w['name'] or 'Your contact'} checked in: reached safely.",
            demo_session=w.get("demo_session"),
        )
    return _view(_need(wid, _require_device(request)))


@app.post(
    "/api/walk/{wid}/extend",
    dependencies=[
        Depends(limiter(30, 60)),
        Depends(token_limiter(30, 60, param="wid")),
        Depends(token_limiter(30, 60, header="x-device-token")),
    ],
)
async def walk_extend(wid: BoundedToken, body: Extend, request: Request):
    w = _need(wid, _require_device(request))
    if w["status"] == "active":
        deadline = max(w["deadline"], time.time()) + body.minutes * 60
        changed = db.run(
            "UPDATE walks SET deadline=? WHERE id=? AND owner=? AND status='active'",
            (deadline, wid, w["owner"]),
        )
        if changed:
            db.extend_track_expiry(w["track"], deadline + 2 * 60 * 60)
    return _view(_need(wid, _require_device(request)))


@app.post(
    "/api/walk/{wid}/panic",
    dependencies=[
        Depends(limiter(30, 60)),
        Depends(token_limiter(30, 60, param="wid")),
        Depends(token_limiter(30, 60, header="x-device-token")),
    ],
)
async def walk_panic(wid: BoundedToken, request: Request):
    w = _need(wid, _require_device(request))
    if w["status"] == "active":
        await walk.fire_alert(w, "panic")
    return _view(_need(wid, _require_device(request)))


@app.post(
    "/api/walk/{wid}/duress",
    dependencies=[
        Depends(limiter(30, 60)),
        Depends(token_limiter(30, 60, param="wid")),
        Depends(token_limiter(30, 60, header="x-device-token")),
    ],
)
async def walk_duress(wid: BoundedToken, request: Request):
    w = _need(wid, _require_device(request))
    if w["status"] == "active":
        await walk.fire_alert(w, "duress")
    return _view(_need(wid, _require_device(request)))


# ------------------------------------------------------------------ demo mode
@app.get(
    "/api/demo-log",
    dependencies=[Depends(limiter(30, 60)), Depends(token_limiter(30, 60, header="x-demo-session"))],
)
async def demo_log(request: Request):
    if telegram.configured():
        return {"demo_mode": False, "messages": []}
    token = request.headers.get("x-demo-session", "")
    messages = telegram.get_demo_messages(token) if token else None
    if messages is None:
        raise HTTPException(401, "A valid demo session is required.")
    return {"demo_mode": True, "messages": messages[-10:]}


# ------------------------------------------------------------------ frontend (must be last)
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
