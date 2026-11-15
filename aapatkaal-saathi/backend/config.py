"""Settings, read from environment variables or a .env file in the project root."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_env() -> None:
    p = ROOT / ".env"
    if not p.exists():
        return
    # utf-8-sig also handles a BOM added by some Windows editors.
    for line in p.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        key = k.strip()
        # An empty exported variable should not mask a configured value in .env.
        if not os.environ.get(key, "").strip():
            os.environ[key] = v.strip().strip('"').strip("'")


_load_env()


class Settings:
    # Telegram bot token from @BotFather. Leave empty for DEMO MODE (alerts are shown in the app).
    telegram_token: str = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    # Optional Gemini API credentials; the manual first-aid flow works without them.
    gemini_api_key: str = os.environ.get("GEMINI_API_KEY", "").strip()
    gemini_model: str = (
        os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite").strip() or "gemini-3.5-flash-lite"
    )
    # Public https URL of your deployment (used in alert links). Auto-detected if empty.
    public_base_url: str = (
        os.environ.get("PUBLIC_BASE_URL", "").strip().rstrip("/")
        or os.environ.get("RENDER_EXTERNAL_URL", "").strip().rstrip("/")
        or (
            f"https://{os.environ['RENDER_EXTERNAL_HOSTNAME'].strip()}"
            if os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip() else ""
        )
    )
    # Overpass/Nominatim usage policies ask apps to identify themselves. Put a real contact here.
    contact: str = os.environ.get("CONTACT_EMAIL", "you@example.com")
    db_path: str = os.environ.get("DB_PATH", str(ROOT / "data" / "app.db"))
    overpass_urls = [
        u.strip()
        for u in os.environ.get(
            "OVERPASS_URLS",
            "https://overpass-api.de/api/interpreter,"
            "https://overpass.kumi.systems/api/interpreter,"
            "https://overpass.nchc.org.tw/api/interpreter,"
            "https://overpass.private.coffee/api/interpreter",
        ).split(",")
        if u.strip()
    ]
    nominatim_url: str = os.environ.get("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    bot_username: str = ""  # filled at startup via getMe

    @property
    def user_agent(self) -> str:
        return f"AapatkaalSaathi/1.0 (hackathon project; contact: {self.contact})"


settings = Settings()
Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
