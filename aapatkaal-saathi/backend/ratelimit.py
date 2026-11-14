"""Small bounded in-memory per-IP and bearer-token rate limiters."""
import hashlib
import threading
import time
from collections import OrderedDict, deque

from fastapi import HTTPException, Request

MAX_BUCKETS = 10000


def _consume(buckets: OrderedDict, key: str, max_calls: int, per_seconds: int) -> None:
    now = time.monotonic()
    with _lock:
        hits = buckets.get(key)
        if hits is None:
            if len(buckets) >= MAX_BUCKETS:
                buckets.popitem(last=False)
            hits = deque()
            buckets[key] = hits
        else:
            buckets.move_to_end(key)
        while hits and hits[0] <= now - per_seconds:
            hits.popleft()
        if len(hits) >= max_calls:
            raise HTTPException(429, "Too many requests. Please wait a moment.")
        hits.append(now)


_lock = threading.Lock()


def limiter(max_calls: int, per_seconds: int):
    """Limit requests by the peer IP (the trusted proxy config determines that peer)."""
    buckets: OrderedDict[str, deque] = OrderedDict()

    async def dep(request: Request):
        ip = request.client.host if request.client else "?"
        _consume(buckets, ip, max_calls, per_seconds)

    return dep


def token_limiter(
    max_calls: int,
    per_seconds: int,
    *,
    param: str | None = None,
    header: str | None = None,
):
    """Limit bearer-token use without retaining raw tokens in limiter state."""
    if bool(param) == bool(header):
        raise ValueError("Provide exactly one token path parameter or header")
    buckets: OrderedDict[str, deque] = OrderedDict()

    async def dep(request: Request):
        token = request.path_params.get(param) if param else request.headers.get(header, "")
        if token:
            token = token[:128]
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            _consume(buckets, digest, max_calls, per_seconds)

    return dep
