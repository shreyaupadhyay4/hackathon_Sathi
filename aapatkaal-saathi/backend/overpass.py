"""Nearby hospitals / clinics / pharmacies / police from OpenStreetMap (Overpass API), plus Nominatim."""
import asyncio
import math
import re
import time

from .config import settings

TYPE_FILTERS = {
    "hospital": ['["amenity"="hospital"]', '["healthcare"="hospital"]'],
    "clinic": ['["amenity"~"^(clinic|doctors)$"]', '["healthcare"~"^(clinic|doctor|centre)$"]'],
    "pharmacy": ['["amenity"="pharmacy"]', '["healthcare"="pharmacy"]'],
    "police": ['["amenity"="police"]'],
}
ALL_TYPES = list(TYPE_FILTERS)
RADII = [3000, 8000, 20000]  # metres; widen only if too few results
FAST_TIMEOUT = 0.65
HEALTH_TTL = 60

_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 600
_health_cache: tuple[float, dict] | None = None
_nominatim_lock = asyncio.Lock()
_geo_cache: dict[str, tuple[float, object]] = {}
_nominatim_last_request = 0.0


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Distance in metres."""
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def build_query(lat: float, lon: float, radius: int, types: list[str], timeout: int = 20) -> str:
    parts = []
    for t in types:
        for flt in TYPE_FILTERS[t]:
            parts.append(f"nwr{flt}(around:{radius},{lat:.5f},{lon:.5f});")
    return f"[out:json][timeout:{timeout}];(" + "".join(parts) + ");out center tags 150;"


def classify(tags: dict) -> str | None:
    am, hc = tags.get("amenity", ""), tags.get("healthcare", "")
    if am == "hospital" or hc == "hospital":
        return "hospital"
    if am == "police":
        return "police"
    if am == "pharmacy" or hc == "pharmacy":
        return "pharmacy"
    if am in ("clinic", "doctors") or hc in ("clinic", "doctor", "centre"):
        return "clinic"
    return None


def clean_phone(raw: str | None) -> str | None:
    if not raw:
        return None
    first = re.split(r"[;,/]", raw)[0].strip()
    digits = re.sub(r"[^\d+]", "", first)
    return digits if len(re.sub(r"\D", "", digits)) >= 5 else None


def gmaps_dir(lat, lon) -> str:
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}&travelmode=driving"


def osm_dir(lat, lon, to_lat, to_lon) -> str:
    return f"https://www.openstreetmap.org/directions?from={lat},{lon}&to={to_lat},{to_lon}"


def parse_elements(elements: list[dict], lat: float, lon: float, per_type: int = 10) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {t: [] for t in ALL_TYPES}
    for el in elements:
        tags = el.get("tags") or {}
        kind = classify(tags)
        if not kind:
            continue
        la = el.get("lat") if el.get("lat") is not None else (el.get("center") or {}).get("lat")
        lo = el.get("lon") if el.get("lon") is not None else (el.get("center") or {}).get("lon")
        if la is None or lo is None:
            continue
        name = tags.get("name:hi") or tags.get("name") or tags.get("name:en") or ""
        addr = ", ".join(x for x in [tags.get("addr:housename"), tags.get("addr:street"),
                                     tags.get("addr:suburb") or tags.get("addr:city")] if x)
        out[kind].append({
            "id": f'{el.get("type", "n")[0]}{el.get("id")}',
            "type": kind,
            "name": name,
            "name_en": tags.get("name:en") or tags.get("name") or "",
            "lat": la, "lon": lo,
            "distance_m": round(haversine(lat, lon, la, lo)),
            "phone": clean_phone(tags.get("phone") or tags.get("contact:phone")),
            "hours": tags.get("opening_hours"),
            "emergency": tags.get("emergency") == "yes",
            "address": addr,
            "directions_google": gmaps_dir(la, lo),
            "directions_osm": osm_dir(lat, lon, la, lo),
        })
    for kind, items in out.items():
        items.sort(key=lambda x: x["distance_m"])
        # drop near-duplicates (same name within 150 m: a hospital mapped as node + building)
        dedup: list[dict] = []
        for it in items:
            if it["name"] and any(d["name"] == it["name"] and haversine(d["lat"], d["lon"], it["lat"], it["lon"]) < 150
                                  for d in dedup):
                continue
            dedup.append(it)
        out[kind] = dedup[:per_type]
    return out


async def _overpass(query: str, timeout: float = 8, backoff_base: float = 0.25) -> dict:
    import httpx  # imported lazily so pure functions stay testable without it

    last = None
    headers = {"User-Agent": settings.user_agent}
    async with httpx.AsyncClient(timeout=timeout, headers=headers) as c:
        for index, url in enumerate(settings.overpass_urls):
            try:
                r = await c.post(url, data={"data": query})
                if r.status_code == 200:
                    try:
                        return r.json()
                    except ValueError as e:
                        last = f"{url} -> invalid JSON: {e!r}"
                else:
                    last = f"{url} -> HTTP {r.status_code}"
                    if r.status_code not in (408, 429) and r.status_code < 500:
                        break
            except httpx.RequestError as e:
                last = f"{url} -> {e!r}"
            if index + 1 < len(settings.overpass_urls):
                await asyncio.sleep(backoff_base * (2 ** index))
    raise RuntimeError(last or "no Overpass server configured")


def _cached(key: str) -> tuple[float, dict] | None:
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL:
        return hit
    return None


def _save_cache(key: str, payload: dict) -> None:
    if len(_cache) > 500:
        _cache.clear()
    _cache[key] = (time.time(), payload)


async def nearby_fast(lat: float, lon: float) -> dict:
    """Fetch only hospitals within 3 km, with a short deadline for the SOS path."""
    key = f"{lat:.3f},{lon:.3f},hospital@3000"
    hit = _cached(key)
    if hit:
        return {**hit[1], "cached": True}
    try:
        data = await asyncio.wait_for(
            _overpass(
                build_query(lat, lon, 3000, ["hospital"], timeout=3),
                timeout=FAST_TIMEOUT,
                backoff_base=0.05,
            ),
            timeout=2.5,
        )
    except (RuntimeError, asyncio.TimeoutError):
        stale = _cache.get(key)
        if stale:
            return {**stale[1], "cached": True, "stale": True}
        raise
    result = parse_elements(data.get("elements", []), lat, lon)
    payload = {
        "center": {"lat": lat, "lon": lon},
        "radius_m": 3000,
        "results": {"hospital": result["hospital"]},
        "source": "OpenStreetMap contributors (ODbL) via Overpass API",
        "fetched_at": time.time(),
        "cached": False,
    }
    _save_cache(key, payload)
    return payload


async def nearby(lat: float, lon: float, types: list[str]) -> dict:
    types = [t for t in types if t in TYPE_FILTERS] or ALL_TYPES
    key = f"{lat:.3f},{lon:.3f},{','.join(sorted(types))}"
    hit = _cache.get(key)
    fresh_hit = _cached(key)
    if fresh_hit:
        return {**fresh_hit[1], "cached": True}

    need = "hospital" if "hospital" in types else types[0]
    result, used = {t: [] for t in ALL_TYPES}, RADII[0]
    try:
        for radius in RADII:
            used = radius
            data = await _overpass(build_query(lat, lon, radius, types))
            result = parse_elements(data.get("elements", []), lat, lon)
            if len(result[need]) >= 3:
                break
    except RuntimeError:
        if hit:
            return {**hit[1], "cached": True, "stale": True}
        raise
    payload = {
        "center": {"lat": lat, "lon": lon},
        "radius_m": used,
        "results": {t: result[t] for t in types},
        "source": "OpenStreetMap contributors (ODbL) via Overpass API",
        "fetched_at": time.time(),
        "cached": False,
    }
    _save_cache(key, payload)
    return payload


async def health() -> dict:
    """Probe Overpass at most once per minute so health checks do not add load."""
    global _health_cache
    now = time.time()
    if _health_cache and now - _health_cache[0] < HEALTH_TTL:
        return dict(_health_cache[1])
    try:
        await asyncio.wait_for(
            _overpass("[out:json][timeout:2];node(0);out;", timeout=0.8, backoff_base=0.05),
            timeout=2.5,
        )
        status = {"reachable": True, "checked_at": time.time()}
    except (RuntimeError, asyncio.TimeoutError):
        status = {"reachable": False, "checked_at": time.time()}
    _health_cache = (time.time(), status)
    return dict(status)


async def _nominatim(path: str, params: dict):
    global _nominatim_last_request
    import httpx

    key = path + repr(sorted(params.items()))
    hit = _geo_cache.get(key)
    if hit and time.time() - hit[0] < 86400:
        return hit[1]
    async with _nominatim_lock:  # policy: max 1 request per second
        hit = _geo_cache.get(key)
        if hit and time.time() - hit[0] < 86400:
            return hit[1]
        wait = 1.1 - (time.monotonic() - _nominatim_last_request)
        if wait > 0:
            await asyncio.sleep(wait)
        _nominatim_last_request = time.monotonic()
        async with httpx.AsyncClient(timeout=15, headers={"User-Agent": settings.user_agent}) as c:
            r = await c.get(f"{settings.nominatim_url}{path}", params={**params, "format": "jsonv2"})
            r.raise_for_status()
            data = r.json()
    _geo_cache[key] = (time.time(), data)
    return data


async def geocode(q: str) -> list[dict]:
    data = await _nominatim("/search", {"q": q, "countrycodes": "in", "limit": 5})
    return [{"name": d.get("display_name", ""), "lat": float(d["lat"]), "lon": float(d["lon"])} for d in data]


async def reverse(lat: float, lon: float) -> str:
    d = await _nominatim("/reverse", {"lat": f"{lat:.4f}", "lon": f"{lon:.4f}", "zoom": 16})
    return d.get("display_name", "") if isinstance(d, dict) else ""
