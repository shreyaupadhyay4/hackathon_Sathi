# Aapatkaal Saathi — judge brief

## 30-second pitch

Aapatkaal Saathi is a one-screen emergency helper for the first minutes of an incident in India. It keeps 112 one tap away, offers short Hindi and English first-aid cards, finds nearby places mapped in OpenStreetMap, and lets a person share their location with people they choose. Optional Gemini only routes a short description to an existing first-aid card; it cannot create medical instructions. Core use does not need an API key.

## Three-minute demo path

1. Open the app and point out the persistent demo banner. Explain that without a Telegram bot token, every alert is simulated inside this browser and no contact is notified.
2. Tap SOS. Show the direct 112 action, nearest mapped hospital (if available), source/age wording, and the fallback when GPS or map services are unavailable.
3. Open Help, show its short steps, **Do NOT** list, and visible medical notice. Type a non-identifying emergency question into Gemini. Show the matching card opening automatically, or the built-in general safety steps if no card fits.
4. Open **What to tell 112**. Add the event and people count locally, show the approximate mapped place if lookup succeeds, then read the script aloud. The app does not call the operator.
5. Open Walk, add a demo contact, start the short demo timer, and show the simulated alert log. In production, Telegram reaches only contacts who started the bot; it is not a 112 dispatch service.
6. Finish on Nearby and show the OpenStreetMap source and the “listed, not confirmed open” limitation.

## What is real and what is not

- Places come from OpenStreetMap through Overpass or Nominatim. Map coverage, hours, phone numbers, emergency tags, and operating status may be incomplete or stale.
- A hospital tagged `emergency=yes` can be ranked ahead for selected incidents; that tag does not prove an emergency department is open or available. For snakebite, call 112 and ask which hospital has anti-snake venom. The app cannot confirm stock.
- Telegram alerts require a configured bot and a contact who has pressed Start. Demo alerts are not sent externally.
- The walk timer runs on the server while the server and its persistent SQLite storage are available. A one-time T-60 beep/vibration is best-effort browser behavior. Users can send a quiet contact alert; the screen visibly changes, so it is not covert. Alerts include the last map/track links and, when supported, the last reported battery percentage. A hosting platform that deletes the database can lose walks.
- Browser GPS generally requires HTTPS. Offline use covers the app shell, first-aid cards, and the last saved nearby list; live maps and alerts need connectivity.
- First-aid text is general information, not a diagnosis or medical advice. It needs review against current Indian Red Cross, WHO, and MoHFW/NDMA material before public deployment.
- Gemini is optional and may time out, be unavailable, or return “unsure.” The user description goes to Google; do not enter identifying details. It only selects a known card. On no match or failure, the app shows static general safety steps and keeps the manual cards and 112 action available.

## Likely judge questions

**Does it dispatch an ambulance?** No. It provides a direct `tel:112` action and helps the user communicate. No dispatch integration exists.

**Are listed hospitals open or able to treat this emergency?** We cannot verify that. Listings are community map data; call 112 or the facility to confirm. Emergency tags are only map tags.

**Why Gemini?** It can shorten navigation from a plain Hindi, English, or Hinglish description to one existing card. It never writes steps or decides urgency, and the manual menu remains available.

**What happens without internet or GPS?** The cached app and first-aid cards remain usable, 112 can still be dialed, and saved map listings may be shown with their age. Live location, fresh place lookup, and remote alerts need connectivity; location sharing is optional.

**What data leaves the phone?** Nearby and reverse lookup send coordinates to OpenStreetMap services; chosen SOS/Walk flows may send location to selected contacts. Gemini receives the entered text plus card IDs/titles/category hints, not GPS or contact details. WhatsApp numbers stay in browser storage.

**What has not been clinically validated?** The first-aid cards require a qualified review before public use. We do not claim clinical validation or measured Gemini accuracy.
