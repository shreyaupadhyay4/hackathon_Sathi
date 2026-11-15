# Aapatkaal Saathi · आपातकाल साथी

A bilingual Hindi and English emergency helper for the first minutes after an accident or medical emergency. It brings emergency calling, first-aid cards, nearby mapped services, and optional safety-contact tools together in a mobile-friendly app.

> **In an emergency in India, call 112.** This app does not contact emergency dispatch or replace professional medical care.

## Features

- **SOS and emergency calls:** Keep a direct 112 call action available and find nearby places listed in OpenStreetMap. An ambulance call option may also be available depending on the state.
- **Bilingual first-aid cards:** Browse concise Hindi and English cards with steps and “Do NOT do this” guidance. Cards are general information and need qualified review before public use.
- **Optional Gemini routing:** Describe an incident in Hindi, English, or Hinglish to find a matching existing card. Gemini does not write first-aid instructions, diagnose, or assess urgency.
- **Nearby services and maps:** View mapped hospitals, pharmacies, clinics, and police stations. Listings may be incomplete or out of date.
- **Safety contacts and live location:** Use the optional Walk feature to check in or alert contacts. Real Telegram alerts require a configured bot and contacts who have started it.
- **Offline basics:** The app shell, first-aid cards, and last saved nearby list can remain available offline. Fresh maps and alerts need connectivity.

## Run locally

The application is in the `aapatkaal-saathi` folder.

**Windows PowerShell**

```powershell
cd aapatkaal-saathi
Copy-Item .env.example .env
.\run.ps1
```

**macOS or Linux**

```bash
cd aapatkaal-saathi
cp .env.example .env
./run.sh
```

Open the local address printed by the run script. To use Gemini, add your `GEMINI_API_KEY` to `aapatkaal-saathi/.env` and restart the app. Keep `.env` private and never commit API keys.

Without a Telegram bot token, the app shows a demo-mode banner and simulates alerts in the browser; it does not notify contacts.

## HTTPS and deployment

Phone browsers generally require **HTTPS** for GPS. For a phone demo, use an HTTPS tunnel or deploy the included Docker app. The project includes a Render Blueprint at `aapatkaal-saathi/render.yaml`; configure `CONTACT_EMAIL` when deploying.

The included free Render configuration has no persistent disk. Its SQLite data may be lost on restart, redeploy, or spin-down, and the first request after inactivity may take about a minute. Treat it as a demo deployment.

## Checks

From the `aapatkaal-saathi` folder, run:

```bash
python -m pip install -r backend/requirements.txt pytest ruff
python -m pytest -q
python -m compileall -q backend tests
ruff check backend tests --select E4,E7,E9,F
```

After starting the app, run the HTTP smoke check:

```bash
python tests/smoke.py http://127.0.0.1:8000
```

An optional Gemini evaluator sends synthetic incident descriptions to the configured model and may use API quota:

```bash
GEMINI_API_KEY=... python tests/evaluate_gemini.py --run
```

## Privacy and limitations

Gemini receives the description entered for routing and card labels, not GPS or contact details. Do not enter names, phone numbers, or exact addresses. Nearby and reverse-geocoding features send location to map services; SOS and Walk share location only through the options the user chooses.

OpenStreetMap listings can be incomplete or stale. The app cannot confirm that a facility is open, has beds, or can treat a particular emergency. Live location updates only while the sender’s page remains open. Telegram messages only reach contacts who have started the bot.

First-aid cards are general information, not diagnosis or medical advice. They require qualified review before public use.

## Project details

See [`aapatkaal-saathi/README.md`](aapatkaal-saathi/README.md) for full setup, feature behavior, privacy details, and the three-minute demo guide. See [`aapatkaal-saathi/PITCH.md`](aapatkaal-saathi/PITCH.md) for the judge brief and likely questions.
