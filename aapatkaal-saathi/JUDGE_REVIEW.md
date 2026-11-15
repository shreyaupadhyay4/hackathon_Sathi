# Hackathon panel review

## Honest product summary

Aapatkaal Saathi is a bilingual emergency-support prototype. It keeps a direct 112 action visible, offers nine locally stored first-aid cards, provides nearby mapped services, and lets a user share location with contacts they choose. Gemini answers short questions using an existing card where possible; for an uncovered question it generates limited general guidance. It does not dispatch emergency services, verify facility availability, or provide clinically validated AI advice.

## Counter-questions judges may ask

| Judge question | Honest answer | Evidence or next step |
|---|---|---|
| Does this call or dispatch an ambulance? | No. It opens the phone's 112 dialer and helps the user communicate. | Demonstrate the direct call link; do not claim dispatch integration. |
| Have doctors validated every card and AI answer? | No. Cards are draft general guidance; Gemini answers are not clinically validated. | Obtain qualified Indian medical review before public deployment. |
| What happens when Gemini gives a wrong answer? | The app keeps 112 visible and shows an AI warning, but cannot guarantee the generated answer is safe. | Keep model answers short; log no medical text; conduct clinician-led safety evaluation. |
| What if the issue is not in the cards? | Gemini may give general, question-specific guidance; if Gemini fails, the app shows fixed basic safety steps. | Test out-of-card and ambiguous prompts; never present this as diagnosis. |
| Are nearby hospitals open or equipped for this emergency? | The app cannot verify hours, beds, emergency department status, or stock. | Listings are OpenStreetMap data; call 112 or the facility to confirm. |
| Does it work without internet? | Cached app files and cards can work offline. New maps, Gemini, and remote alerts require connectivity. | Demonstrate airplane mode only for cached functions; do not claim offline Gemini. |
| Are Telegram contacts alerted in demo mode? | No. Without a bot token, alerts are simulated in the browser. Real contacts must start the bot first. | Show the persistent demo banner and simulated log. |
| Is the location link always live? | Only while the sender's page and server are available. | Keep the page open; use persistent database storage for hosted deployments. |
| What data does Gemini receive? | The typed question and app card text for the selected language. It does not receive GPS or contacts. | Never enter identifying details; the API key stays server-side. |
| What has been tested? | The backend suite and local HTTP smoke check pass. A routing evaluator exists; its score is not a clinical safety score. | Record the latest test/evaluation results before presenting; test GPS on a real HTTPS phone. |

## Feature review

- **Emergency call:** strong, simple fallback; the call itself depends on the phone and network.
- **First-aid cards:** useful offline structure; draft content needs qualified review and citations before public use.
- **Gemini Q&A:** useful for natural-language navigation and concise responses. The prompt and JSON schema reduce scope, but do not prove the answer is correct. Generated text must be described as experimental.
- **Maps:** helpful discovery, not verified dispatch data. External providers can be stale, rate-limited, or unavailable.
- **Safety contacts / Walk:** meaningful prototype workflow. Real Telegram delivery requires bot setup, user consent, persistent storage, and a live server.
- **Offline support:** shell/cards/saved listings only; not fresh location services, Gemini, or contact delivery.

## Best improvements before judging

1. Get a qualified clinician to review and approve the first-aid cards; show a source and review date per card.
2. Evaluate Gemini answers separately from card routing. Use synthetic Hindi/English/Hinglish prompts, an expert-written expected safety rubric, and clinician review; do not call routing accuracy medical accuracy.
3. Add a clear answer provenance label: “From app card” or “AI general guidance,” plus a visible emergency escalation.
4. Run the HTTPS/GPS/offline flow on a physical phone. Verify that a hosted service has outbound Gemini access and persistent storage if real Walk alerts are demonstrated.
5. Present the demo banner, provider failures, incomplete map coverage, and unverified facilities as explicit limitations rather than implying production readiness.
