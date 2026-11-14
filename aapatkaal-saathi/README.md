# Aapatkaal Saathi · आपातकाल साथी

One-screen emergency helper for the first 10 minutes of an accident or medical emergency.
Hindi + English. Real OpenStreetMap data. Core app works without API keys.

## What it does

| Feature | How it works |
|---|---|
| Big **SOS** button | Gets GPS, finds nearest hospitals, starts a live-location link, alerts your Telegram contacts, shows 112 |
| **Gemini card routing** (optional) | Matches a short Hindi/English description to one of the existing reviewed cards, or returns unsure. Gemini never writes first-aid steps |
| **What to tell 112** | Builds a Hindi or English call script from your coordinates, an approximate OSM place/road, and details you enter; nothing but coordinates for reverse lookup are sent to the server |
| **Nearest hospitals, clinics, pharmacies, police** | OpenStreetMap via Overpass API, sorted by distance, with Call and Directions buttons |
| **9 first-aid cards** (accident, chest pain, CPR, snakebite, burn, choking, bleeding, seizure, stroke) | Short steps plus a red **"Do NOT do this"** list, Hindi and English, read aloud by the phone's voice |
| **Live location on WhatsApp** | Creates a link to a page that updates every 10 seconds (OpenStreetMap map, no login for the receiver) |
| **Walk with me** | Timer runs on the server. No "I'm safe" tap in time, or panic pressed: Telegram alert + last location to contacts |
| **Works offline** | App shell, first-aid cards and the last nearby list are cached. Distances are recomputed from your current GPS |

## Run it (2 minutes)

```bash
./run.sh            # creates a venv, installs, starts on http://localhost:8000
```

Phones only allow GPS on **HTTPS**. For a live demo on judges' phones use one of:

```bash
cloudflared tunnel --url http://localhost:8000     # instant public https URL, nothing to sign up for
# or deploy the included Dockerfile to Render / Railway / Fly.io (all give https)
```

Set `PUBLIC_BASE_URL` to that https URL so alert links are correct.

## Optional Gemini feature

The Help screen can send a short incident description to Gemini and ask it to choose only from card IDs already present in `frontend/firstaid.json`. The app displays the unchanged reviewed card; Gemini cannot provide steps, diagnose, assess urgency, or remove the visible 112 action. An unknown card, low model confidence, missing key, timeout, or provider error falls back to the manual card menu.

Set `GEMINI_API_KEY` in `.env` on the server to enable it. `GEMINI_MODEL` defaults to `gemini-2.5-flash` and can be changed if unavailable to your account. Never put the key in frontend code or commit it. The model call sends the user's typed description and the app's card labels to Google; the app does not include GPS, contact details, or the user's device token in that request. Tell users not to enter names, phone numbers, or exact addresses. Google's current data handling, quota, and pricing terms apply; the rest of the app does not call Gemini and remains usable without the key.

The model's confidence is only a routing heuristic, not a measured probability or medical assessment. The optional live evaluation uses 30 synthetic English, Hindi, and Hinglish descriptions:

```bash
GEMINI_API_KEY=... python tests/evaluate_gemini.py --run
```

This sends 30 requests and may consume account quota. Do not claim an accuracy percentage until you run it with the configured model; the evaluation has not been run as part of this change. It does not test photos or clinical safety, and the feature deliberately accepts text only.

## Telegram alerts

* **No token = demo mode.** Contacts count as joined and the "alert" messages appear inside the Walk tab. Demo messages are scoped to an unguessable browser session and kept in server memory for up to 24 hours.
* **Real alerts:** talk to [@BotFather](https://t.me/BotFather), `/newbot`, put the token in `.env` as `TELEGRAM_BOT_TOKEN`, restart.
  In the app: Walk tab > **+ Add contact** > send the invite link by WhatsApp. The contact opens it and presses **Start**. Invite links expire after 7 days and can only be used once.
  A Telegram bot can only message people who started it first. This is a Telegram rule, say so in the pitch.
* Run **one** server process only (the bot poller and the walk watcher must not be duplicated).

## Reliability and health

* SOS shows the 112 action immediately. It asks Overpass for hospitals within 3 km first (short per-mirror timeout), then loads clinics, pharmacies and police in the background. External map providers can still be slow or unavailable; a fresh hospital result is not guaranteed within 3 seconds.
* The last successful place list is saved in this browser with its update time. The app shell, first-aid cards and saved list remain available offline; distances use the current or last saved location.
* `GET /api/health` reports a cached Overpass reachability probe, Telegram poller state, and walk watcher state. The Overpass probe is limited to once per minute.
* Active walks remain in SQLite and are checked again when the watcher starts after a server restart. Keep persistent storage enabled on the host if walks must survive redeploys.
* **What to tell 112** uses your current or saved location and an optional Nominatim reverse lookup. The mapped place/road is approximate and can be unavailable; the script always shows coordinates when a location is available. The incident and people-count fields stay in the browser and are not submitted.
* On first use, the location prompt explains why location helps and offers a manual place-search fallback. SOS and the 112 call button remain available without permission. Buttons and inputs have larger touch targets, visible keyboard focus, and status text for screen readers.

## Privacy and deleting data

* The browser creates an unguessable device token and stores it in local storage. The server stores only its SHA-256 digest to associate that device's safety contacts, live tracks, and walks. If site data is cleared or the device is lost, the token cannot be recovered; live tracks expire, but contact and walk records may remain until an administrator removes the database.
* Precise coordinates and place-search text are sent in POST bodies rather than URL query strings. Nearby and reverse-geocoding requests still send location to the configured OpenStreetMap services. SOS, Walk, and live sharing send location to the contacts or link recipients selected by the user.
* Gemini routing is opt-in per description. The entered text is sent to Google; do not enter identifying details. Location and first-aid card content are not included in the Gemini request (only card IDs and titles are).
* **Walk tab > Delete my data** removes the device's contacts, tracks, and walks from the server and clears personal/location state and demo messages from this browser. It ends live links immediately. It cannot recall Telegram/WhatsApp messages already delivered or copies recipients made.
* Removing one safety contact revokes its invite and removes it from that device's future walk alerts.
* API limits apply by peer IP and, for device/link/session operations, by an unguessable token. These counters are bounded and in-memory, so run one server process/replica; multiple workers would not share limits. With a reverse proxy, configure `FORWARDED_ALLOW_IPS` as described below; otherwise clients behind that proxy share one IP bucket.

### Reverse proxy and rate limits

The Docker image trusts forwarded headers only from `FORWARDED_ALLOW_IPS`, which defaults to `127.0.0.1`. If your reverse proxy has a known, fixed IP, set this to that exact IP or comma-separated IP list, and configure the proxy to overwrite client-supplied forwarding headers. Do not set it to `*`: untrusted clients could spoof their IP and bypass per-IP limits. If the proxy IP is not known, leave the default; requests will share the proxy's rate-limit bucket.

## Project layout

```
backend/   FastAPI: overpass.py (OSM), walk.py (dead-man switch), telegram.py, db.py (SQLite), ratelimit.py, main.py (API)
frontend/  index.html, app.js, style.css, firstaid.json, sw.js (offline), track.html (live link page)
tests/     pure-logic tests + a full API flow test (needs fastapi, httpx, pytest)
```

## Before you present, do these (they matter)

1. **Medical review.** `frontend/firstaid.json` is written from standard first-aid principles and contains no doses.
   Compare each card with Indian Red Cross, WHO and MoHFW/NDMA first-aid guidance and fix any differences. Say in the pitch that you did.
2. **Set `CONTACT_EMAIL`** in `.env`. Overpass and Nominatim usage policies require an identifying User-Agent. Do not hammer them: the app caches results and rate-limits itself.
3. **Test GPS on a real phone over HTTPS**, in a place with a hospital nearby, plus once with the phone in airplane mode (offline test).
4. Check Hindi voice: Android > Settings > Text-to-speech > install Hindi. iPhones have it built in.
5. Free hosts may wipe the SQLite file on redeploy. Create contacts **after** deploying, not before.

## Data and credits

Map data © OpenStreetMap contributors (ODbL). Places come from Overpass API; place search from Nominatim.

## Honest limits

* OpenStreetMap is patchy in small towns, and a listed place may be closed or have no beds.
* Not a replacement for 112. It does not dispatch an ambulance.
* First-aid cards are general guidance, not medical advice, and do not diagnose.
* Telegram alerts only reach contacts who pressed Start on your bot.
* Live location only updates while the sender's page stays open in the browser.
