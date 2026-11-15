# Phase 1 — Audit report

## Scope and verification

Reviewed the README and pitch first, then the tracked backend, frontend, tests, and deployment configuration. Secrets and runtime database contents were not inspected.

Checks completed before implementation:

- Backend suite: **41 passed** using the system Python and a writable pytest temp directory. The project virtual environment initially lacked pytest; it was installed there for the final run. One upstream Starlette/httpx deprecation warning remains.
- `python -m compileall -q backend tests`: passed.
- `python tests/smoke.py http://127.0.0.1:8000`: passed against the already-running local server.
- Browser check at 360 px: no horizontal overflow; all visible buttons and links measured at least 48 px; the chest-pain card displayed its “Do NOT” steps and medical notice in Hindi and English.
- Simulated offline browser check: the service worker controlled the page; all nine first-aid cards and the direct 112 link remained available. Network-dependent nearby refreshes failed as expected.
- The running app's health endpoint reported the Overpass probe unreachable. A real phone, real emergency call, live Gemini session, Telegram delivery, and actual airplane mode were not tested.

## Ten highest-impact judge risks, ranked

1. **Google Maps receives more precise location than promised.** `updateNearbyGoogleMap` serializes the user's location to six decimal places, while the privacy notice describes an approximately 100-metre-rounded location. This is a material privacy/documentation mismatch.
2. **No HTTPS phone URL is ready.** The app is reachable locally over HTTP on port 8000, but no HTTPS tunnel is installed or running. Remote phone GPS and microphone access therefore cannot be demonstrated yet.
3. **Live OpenStreetMap availability is uncertain.** The current Overpass health probe is unreachable. The UI provides honest fallback actions, but fresh facility results cannot be guaranteed during a live demo.
4. **First-aid copy has not had qualified clinical review.** The project correctly discloses this, but incorrect or regionally unsuitable emergency guidance would be the most serious product risk. No card content should be represented as clinically validated.
5. **Gemini output is not medically validated.** The backend constrains and checks responses, but a generated answer can still be inaccurate. The 112 path and reviewed card steps must remain more prominent than generated advice.
6. **Voice calling cannot place a call silently.** Speech can open a `tel:` link or saved contact number, but the phone may require another tap. Voice audio is sent to Gemini for transcription; a real-device, HTTPS microphone test remains outstanding.
7. **Frontend emergency flows lack repeatable end-to-end coverage.** The existing smoke script checks only the landing page, health endpoint, and first-aid JSON. It does not exercise SOS, contact dialing, voice failures, or walk controls in a browser.
8. **Offline support is only partial by design.** The app shell, cards, and saved nearby data are available offline; fresh listings, maps, live location, Gemini, and remote alerts require connectivity. The simulated offline run confirmed the cards and 112 link, not every phone/browser combination.
9. **Rate limits and demo state are process-local.** They are suitable for the documented single-process demo but do not coordinate across multiple workers or replicas. A deployment that scales out without shared state can weaken limits and split demo/watcher state.
10. **GitHub would not discover the existing CI workflow.** It was stored under `aapatkaal-saathi/.github/workflows/` instead of the repository-root `.github/workflows/`, and GitHub reported no runs. The tests/lint were therefore not being enforced on pushes.

## Flow review

- **SOS:** Direct `tel:112` remains available; location, nearby hospital lookup, optional track creation, and contact alerting are separate paths. No ambulance dispatch is claimed. Live-provider success was not verified.
- **Nearby:** Fast hospital lookup, broader background results, stale-list age, and call-112 fallback exist. Current Overpass reachability is false.
- **First aid:** Nine bilingual cards render, include “Do NOT” lists, and show a medical disclaimer. Only the chest-pain card was manually selected in both languages; the complete card set still needs native/clinical review.
- **Live share:** The UI creates a time-limited track and clearly requires network access. No external recipient session was used.
- **Walk:** Backend tests cover state and recovery paths; a real Telegram alert and phone shutdown/restart scenario were not exercised.
- **Offline / denied GPS / slow network:** Offline cards and 112 were checked in a simulated disconnected browser. GPS denial and real airplane mode remain unverified. Network failures have fallback UI, but external providers cannot be made dependable by the app.

## Existing reliability/security controls

The project already has multiple Overpass mirrors, retries/backoff, a bounded fast hospital query, cached results, a health endpoint, startup walk recovery, input bounds, owner-scoped records, unguessable tokens, per-IP/token limits, escaped user-facing text, and a documented reverse-proxy trust requirement. These controls were reviewed rather than duplicated.

## Security review

A read-only security reviewer found **no confirmed vulnerabilities** in token authorization, SOS/Walk abuse controls, XSS handling, input validation/SQL usage, or reverse-proxy rate-limit trust. The reviewer confirmed owner checks and high-entropy tokens, bounded inputs and parameterized queries, escaped UI rendering, and an explicit forwarded-header trust configuration. This does not change the documented limitation that rate-limit and demo state are process-local.

## Follow-up after the audit

- Rounded coordinates sent to the Google Maps embed and Nearby search links to three decimal places (roughly 100 metres at the app's India locations), updated the English/Hindi privacy note, and bumped the service-worker cache key.
- Fixed the existing Ruff `E402` finding in the opt-in Gemini evaluator with a targeted noqa for the import that follows its `sys.path` setup.
- Moved the Actions workflow to the repository root, set its app working directory, and limited its token permission to repository contents read.
- Final validation: **41 tests passed**, Ruff checks passed, Python compilation passed, local deployment smoke check passed, and `git diff --check` passed.
- The HTTPS tunnel installer was cancelled. No public phone URL or real-device GPS/microphone test is available yet.
