"""Small post-deploy smoke check: python tests/smoke.py [base-url]."""
import sys
from urllib.request import urlopen


BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")


def get(path: str):
    with urlopen(f"{BASE}{path}", timeout=8) as response:
        if response.status != 200:
            raise RuntimeError(f"{path} returned HTTP {response.status}")
        return response.read()


page = get("/").decode("utf-8")
assert "Aapatkaal Saathi" in page
health = get("/api/health").decode("utf-8").replace(" ", "")
assert '"ok":true' in health
cards = get("/firstaid.json").decode("utf-8")
assert '"cards"' in cards and '"snake"' in cards
qr = get("/qr.js").decode("utf-8")
assert "QrGenerator" in qr
print(f"Smoke check passed for {BASE}")
