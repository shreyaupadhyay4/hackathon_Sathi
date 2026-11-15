# Aapatkaal Saathi — judge brief

## 30-second pitch

Aapatkaal Saathi is a one-screen emergency helper for the first minutes of an incident in India. It keeps 112 one tap away, offers short Hindi and English first-aid cards, finds nearby places mapped in OpenStreetMap, and lets a person share their location with people they choose. Optional Gemini answers short emergency questions using a matching app card when available and limited general safety guidance otherwise. Core use does not need an API key.

## Three-minute demo path

1. Open the app and point out the persistent demo banner. Explain that without a Telegram bot token, every alert is simulated inside this browser and no contact is notified.
2. Tap SOS. Show the direct 112 action, nearest mapped hospital (if available), source/age wording, and the fallback when GPS or map services are unavailable.
3. Open Help, show its short steps, **Do NOT** list, and visible medical notice. Type a non-identifying emergency question into Gemini. Show the short response and matching card, or the question-specific general safety response when no card fits.
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
- Gemini is optional and may time out or return an incomplete answer. The user question and app card content for the selected language go to Google; do not enter identifying details. Answers are not clinically validated. Gemini is instructed to use card steps when a card matches and otherwise provide limited general safety guidance. On failure, the app reports the error instead of showing a canned answer; manual cards and the 112 action remain available.

## Likely judge questions

**Does it dispatch an ambulance?** No. It provides a direct `tel:112` action and helps the user communicate. No dispatch integration exists.

**Are listed hospitals open or able to treat this emergency?** We cannot verify that. Listings are community map data; call 112 or the facility to confirm. Emergency tags are only map tags.

**Why Gemini?** It can answer a short Hindi, English, or Hinglish emergency question from an existing card or provide limited general safety guidance if there is no match. It must not diagnose or prescribe medicines; its responses can still be wrong, so users should follow 112 operator instructions.

**What happens without internet or GPS?** The cached app and first-aid cards remain usable, 112 can still be dialed, and saved map listings may be shown with their age. Live location, fresh place lookup, and remote alerts need connectivity; location sharing is optional.

**What data leaves the phone?** Nearby and reverse lookup send coordinates to OpenStreetMap services; chosen SOS/Walk flows may send location to selected contacts. Gemini receives the entered question and the app's card text for the selected language, not GPS or contact details. WhatsApp numbers stay in browser storage.

**What has not been clinically validated?** The first-aid cards require a qualified review before public use. We do not claim clinical validation or measured Gemini accuracy.

See [`JUDGE_REVIEW.md`](JUDGE_REVIEW.md) for a fuller feature review, counter-questions, and remaining gaps.
