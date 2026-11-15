# Aapatkaal Saathi · आपातकाल साथी

A bilingual (Hindi and English) emergency helper for the first minutes after an accident or medical emergency. It brings reviewed first-aid cards, emergency calling, nearby services, and optional safety-contact tools together in one mobile-friendly app.

> **In an emergency in India, call 112.** This app does not contact emergency dispatch or replace professional medical care.

## Features

- **SOS and emergency calls:** Find nearby mapped hospitals, keep a direct 112 call action available, and show 108 as an ambulance option where available.
- **Reviewed first-aid cards:** Nine bilingual cards cover accidents, chest pain, CPR, snakebite, burns, choking, bleeding, seizures, and stroke. Each card includes actions to take and actions to avoid.
- **Gemini card routing (optional):** Describe an incident in Hindi or English and Gemini can select an existing reviewed card—or return “unsure.” Gemini does not diagnose, assess urgency, or generate first-aid instructions.
- **Nearby services and maps:** Browse hospitals, clinics, pharmacies, and police services using OpenStreetMap data. Map providers and external listings may be unavailable or incomplete.
- **Safety contacts:** Optional Telegram alerts and a server-timed “Walk with me” feature. WhatsApp messages are prefilled for review; you choose whether to send them.
- **Live location sharing:** Share a link with a live map and nearby services.
- **Offline support:** The app shell, first-aid cards, and last saved nearby list can be available offline.

## Run locally

From the repository root:

```bash
cd aapatkaal-saathi
cp .env.example .env
./run.sh
```

Open [http://localhost:8000](http://localhost:8000). The run script creates a virtual environment, installs backend requirements, and starts the app. You can run it without API keys; optional integrations remain unavailable until configured.

## Optional configuration

Edit `aapatkaal-saathi/.env`:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables Gemini's reviewed-card routing. Keep the key on the server; never put it in frontend code or commit it. |
| `GEMINI_MODEL` | Gemini model ID. Defaults to `gemini-3.5-flash-lite`. |
| `TELEGRAM_BOT_TOKEN` | Enables real Telegram alerts. Without it, the app uses demo mode. |
| `CONTACT_EMAIL` | Contact included in the OpenStreetMap service User-Agent. Set a real email for deployed use. |
| `PUBLIC_BASE_URL` | Public HTTPS URL used in links shared by the app. |
| `FORWARDED_ALLOW_IPS` | Exact trusted reverse-proxy IPs. Do not set this to `*`. |

Copying `.env.example` creates a local `.env`, which is ignored by Git. Never commit API keys, bot tokens, or other credentials.

### Gemini privacy and safety

Gemini routing is opt-in. The incident description and reviewed-card labels are sent to Google; GPS, contacts, and device tokens are not included. Do not enter names, phone numbers, or exact addresses. Gemini can only return an ID from the app's reviewed first-aid cards, and the app displays the unchanged card. Its confidence value is a routing heuristic, not a medical assessment.

### Using on a phone

Browsers generally require HTTPS for GPS on phones. For a temporary demo, run a trusted HTTPS tunnel to the local server and set `PUBLIC_BASE_URL` to that public HTTPS address. See the [detailed app guide](aapatkaal-saathi/README.md) for deployment, Telegram setup, reverse-proxy configuration, privacy details, and demo checks.

## Tests

With the project's virtual environment activated from `aapatkaal-saathi/`:

```bash
python -m pytest -q
```

The optional live Gemini evaluation sends 30 synthetic descriptions and may use API quota:

```bash
GEMINI_API_KEY=... python tests/evaluate_gemini.py --run
```

Do not treat that evaluation as evidence of clinical safety or medical accuracy.

## Project layout

```text
aapatkaal-saathi/
  backend/    FastAPI app, Gemini routing, OpenStreetMap, Telegram, SQLite
  frontend/   Mobile web app, reviewed cards, maps, offline support
  tests/      Automated tests and optional synthetic Gemini evaluation
  run.sh      Local development launcher
```

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
