# Aapatkaal Saathi · आपातकाल साथी

One-screen emergency helper for the first 10 minutes of an accident or medical emergency.
Hindi + English. Real OpenStreetMap data. Core app works without API keys.

## What it does

| Feature | How it works |
|---|---|
| Big **SOS** button | Gets GPS, finds nearest hospitals, starts a live-location link, alerts your Telegram contacts, shows 112 |
| **Emergency calling** | 112 is always available as a direct call link. 108 is shown as an ambulance option where available; coverage varies by state |
| **Gemini question answers** (optional) | Gives a short answer in Hindi or English. When a card matches, the answer is based on its steps and the card opens automatically; otherwise Gemini gives limited general safety guidance |
| **What to tell 112** | Builds a Hindi or English call script from your coordinates, an approximate OSM place/road, and details you enter; nothing but coordinates for reverse lookup are sent to the server |
| **Nearby map and services** | Google Maps coordinate pin recenters as GPS moves; OpenStreetMap also shows a live location marker and nearby facilities. Hospital and pharmacy lists show distance from your current location, with clinic/police filters and Call and Directions buttons |
| **9 first-aid cards** (accident, chest pain, CPR, snakebite, burn, choking, bleeding, seizure, stroke) | Short steps plus a red **"Do NOT do this"** list, Hindi and English, read aloud by the phone's voice |
| **Emergency WhatsApp message** | After choosing a first-aid card, open WhatsApp with that incident and a map link for a locally saved contact. Review and tap Send; the phone number stays on the device and is not sent to Gemini |
| **Live location on WhatsApp** | Creates a link to a page that updates every 10 seconds, with nearby hospital, clinic, pharmacy, and police markers on an OpenStreetMap map (no login for the receiver) |
| **Walk with me** | Timer runs on the server. A one-time beep/vibration may remind you at one minute. Check in, extend, send a regular alert, or send a quiet contact alert. Alerts include map and live-track links; the latest battery percentage is included only when the browser provides it. |
| **Works offline** | App shell, first-aid cards and the last nearby list are cached. Distances are recomputed from your current GPS |

## Run it (2 minutes)

```bash
./run.sh            # macOS/Linux: creates a venv, installs, starts on http://localhost:8000
# Windows PowerShell: .\run.ps1
```

Phones only allow GPS on **HTTPS**. For a live demo on judges' phones use one of:

```bash
cloudflared tunnel --url http://localhost:8000     # instant public https URL, nothing to sign up for
# or deploy the included Dockerfile; the Render Blueprint is included
```

For a tunnel demo, start the server, open the tunnel in a second terminal, copy its HTTPS URL into `PUBLIC_BASE_URL` in `.env`, then restart the server. On Render, the app uses Render's assigned HTTPS hostname automatically unless `PUBLIC_BASE_URL` is explicitly set. Share links are otherwise inferred only for localhost during local development.

For a free Render deploy, connect the repository as a Blueprint and use the included `render.yaml`. Enter a real contact email when prompted. The Blueprint uses a free web instance without a persistent disk: SQLite data can be lost when the service spins down, restarts, or redeploys. Free Render web services also spin down after inactivity, so the first request after idle can take about a minute. Treat it as a demo deployment and create contacts after each restart if needed.

## Optional Gemini feature

The Help screen sends a short emergency question or description to Gemini and displays only a live Gemini response. When a card matches, Gemini is instructed to answer from that card's steps and don'ts, and the app opens the card automatically. For questions outside the cards, Gemini is instructed to provide limited, context-related safety guidance and recommend 112/operator help when appropriate. Browser speech recognition remains available; Gemini Live adds hands-free audio relayed through the app server to Google. The app does not store microphone audio. A spoken “Call 112” or “Alert my contacts” command requires an on-screen confirmation; the phone opens its normal dialer or the app's existing SOS flow. It must not diagnose, guess causes, predict outcomes, recommend medicines or doses, or describe risky procedures. If the live request fails or returns malformed data, the app shows an error; it does not display a canned answer. The manual cards and direct 112 action remain available. Generated answers are fallible and not clinically validated.

The Gemini tools also let a user check current opening information for a listed hospital using Google Search grounding, and photograph a medicine strip to read clearly visible label text aloud in the selected language. The hospital name and rounded approximate coordinates are sent for the search; the medicine photo is sent to Gemini. Search results may be stale or ambiguous, so call the hospital to confirm. Medicine reading does not provide dosage or treatment advice; ask a pharmacist or clinician if the label is unclear.

Set `GEMINI_API_KEY` in `.env` on the server to enable it. `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`, a fast model for short answers. Change it if unavailable to your API account. Never put the key in frontend code or commit it. The request sends the user's typed question, category hints, and the app's card titles, steps, and don'ts for the selected language to Google. It does not include GPS, contact details, or the user's device token. Tell users not to enter names, phone numbers, or exact addresses. Google's current data handling, quota, and pricing terms apply; the rest of the app does not call Gemini and remains usable without the key.

The request uses a JSON schema for the card ID, match score, and answer; the backend rejects missing, overlong, or certain unsafe-looking unmatched answers. The prompt handles Hindi, English, Hinglish, mixed scripts, ambiguous questions, and situational context such as being alone near a road. These checks do not prove an answer is medically safe or correct. The match score is a routing heuristic, not a measured probability or medical assessment, and generated answers have not undergone clinical validation. The optional live evaluation uses 43 synthetic descriptions to evaluate card routing only; it does not measure answer safety or accuracy:

```bash
GEMINI_API_KEY=... python tests/evaluate_gemini.py --run
```

This sends 43 requests and may consume account quota. Do not claim an accuracy percentage until you run it with the configured model; the evaluation has not been run as part of this change. It does not test photos or clinical safety, and the feature deliberately accepts text only.

## Telegram alerts

* **No token = demo mode.** A persistent banner says alerts are simulated and no contacts are notified. Demo contacts count as joined; simulated messages appear in the Walk tab and are scoped to an unguessable browser session for up to 24 hours (server memory only).
* **Real alerts:** talk to [@BotFather](https://t.me/BotFather), `/newbot`, put the token in `.env` as `TELEGRAM_BOT_TOKEN`, restart.
  In the app: Walk tab > **+ Add contact** > send the invite link by WhatsApp. The contact opens it and presses **Start**. Invite links expire after 7 days and can only be used once.
  A Telegram bot can only message people who started it first. This is a Telegram rule, say so in the pitch.
* Run **one** server process only (the bot poller and the walk watcher must not be duplicated).

## Reliability and health

* Opening Nearby refreshes GPS; **Use my current location** retries it. The screen identifies whether it is showing live GPS, a searched pin, or a saved location. Hospitals and pharmacies are listed together by distance; clinic and police filters are also available. If all four Overpass mirrors fail, the app falls back to bounded OpenStreetMap/Nominatim searches for hospitals, pharmacies, clinics, and police stations. If those services fail or have no mapped hospitals, the first page offers a Google Maps nearby-hospital search link. External map providers can still be slow or unavailable.
* The SOS panel always keeps a direct 112 call action available. It can also open the phone's native share sheet with an emergency message and location link; the user chooses an app/contact and confirms sending. If location is unavailable, the app can still alert saved safety contacts and marks the location as unavailable in that message. Facility phone buttons appear only when a number is present in OpenStreetMap data; verify the number and availability when possible.
* The 108 quick dial is a state-dependent ambulance option, not a nationwide guarantee. Maharashtra's National Health Mission lists 108 for its emergency medical service ([official source](https://nhm.maharashtra.gov.in/en/scheme/maharashtra-emergency-medical-services-mems-emergency-medical-service-on-call/)); if 108 is unavailable, call 112.
* The last successful place list is saved in this browser with its update time. The app shell, first-aid cards and saved list remain available offline; distances use the current or last saved location.
* `GET /api/health` reports a cached Overpass reachability probe, Telegram poller state, and walk watcher state. The Overpass probe is limited to once per minute. The SOS hospital-only query has a short deadline; if live data is slow or unavailable, the app shows its saved result or an honest unavailable state while the full nearby search continues.
* Active walks remain in SQLite and are checked again when the watcher starts after a server restart. Keep persistent storage enabled on the host if walks must survive redeploys.
* **What to tell 112** uses your current or saved location and an optional Nominatim reverse lookup. The mapped place/road is approximate and can be unavailable; the script always shows coordinates when a location is available. The incident and people-count fields stay in the browser and are not submitted.
* On first use, the location prompt explains why location helps and offers a manual place-search fallback. SOS and the 112 call button remain available without permission. Buttons and inputs have larger touch targets, visible keyboard focus, and status text for screen readers.

## Privacy and deleting data

* The browser creates an unguessable device token and stores it in local storage. The server stores only its SHA-256 digest to associate that device's safety contacts, live tracks, and walks. If site data is cleared or the device is lost, the token cannot be recovered. Public track access expires at its deadline; expired rows are cleaned after a one-hour grace unless an active/alerting Walk still needs the track. Completed Walk rows are purged 24 hours after their scheduled deadline. Contact records remain until you use Delete my data or an administrator removes them.
* WhatsApp emergency numbers are stored only in this browser. Selecting one opens a prefilled WhatsApp chat containing the selected incident and location map link; you must review and tap Send. The message and location are not sent to Gemini.
* Precise coordinates and place-search text are sent in POST bodies rather than URL query strings. Nearby and reverse-geocoding requests send location to the configured OpenStreetMap services; the Nearby Google Maps embed also receives a roughly 100-metre-rounded location and the selected service type. SOS, Walk, and live sharing send location to the contacts or link recipients selected by the user. Walk includes the latest Battery API percentage in safety alerts when supported; it may be stale and is omitted when unavailable.
* Gemini questions are sent to Google; do not enter identifying details. The typed-question route excludes GPS, contacts, and device tokens. Hospital-hours search sends the hospital name and coordinates rounded to about 1 km. Medicine photos are sent to Google Gemini to read visible label text. Live voice streams microphone audio through the app server to Gemini; the app does not store it. The route request includes app card titles and the selected language's first-aid steps and don'ts so Gemini can ground a response in a matching card.
* **Walk tab > Delete my data** removes the device's contacts, tracks, and walks from the server and clears WhatsApp numbers, personal/location state, and demo messages from this browser. It ends live links immediately. It cannot recall Telegram/WhatsApp messages already delivered or copies recipients made.
* Removing one safety contact revokes its invite and removes it from that device's future walk alerts.
* API limits apply by peer IP and, for device/link/session operations, by an unguessable token. These counters are bounded and in-memory, so run one server process/replica; multiple workers would not share limits. With a reverse proxy, configure `FORWARDED_ALLOW_IPS` as described below; otherwise clients behind that proxy share one IP bucket.
* Uvicorn access logs are disabled in the included run and Docker commands so bearer live-link tokens in request paths are not copied into routine logs. App logs record operational errors and status, not coordinates or message bodies. Both pages set a strict-origin referrer policy so a live-link path is not sent to map/CDN providers.

### Reverse proxy and rate limits

The Docker image trusts forwarded headers only from `FORWARDED_ALLOW_IPS`, which defaults to `127.0.0.1`. If your reverse proxy has a known, fixed IP, set this to that exact IP or comma-separated IP list, and configure the proxy to overwrite client-supplied forwarding headers. Do not set it to `*`: untrusted clients could spoof their IP and bypass per-IP limits. If the proxy IP is not known, leave the default; requests will share the proxy's rate-limit bucket.

## Project layout

```
backend/   FastAPI: overpass.py (OSM), walk.py (dead-man switch), telegram.py, db.py (SQLite), ratelimit.py, main.py (API)
frontend/  index.html, app.js, style.css, firstaid.json, sw.js (offline), track.html (live link page)
tests/     API and pure-logic tests, Gemini evaluator, and deployment smoke check
render.yaml  one-click Render Blueprint for the Docker web service
```

Run `python tests/smoke.py [https://your-deployment]` after deployment. GitHub Actions runs the backend suite, Python compilation, lint checks, and a local HTTP smoke check on pushes and pull requests. Run the same checks locally with:

```bash
python -m pip install -r backend/requirements.txt pytest ruff
python -m pytest -q
python -m compileall -q backend tests
ruff check backend tests --select E4,E7,E9,F
python tests/smoke.py http://127.0.0.1:8000  # start the app in another terminal first
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
* 108 ambulance coverage depends on the state; use 112 if it does not connect.
* First-aid cards are general guidance, not medical advice, and do not diagnose.
* Telegram alerts only reach contacts who pressed Start on your bot.
* Live location only updates while the sender's page stays open in the browser.
