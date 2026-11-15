/* Aapatkaal Saathi — front end (no build step; Leaflet loads from its CDN). */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ------------------------------------------------------------ strings */
const TXT = {
  en: {
    appName: 'Aapatkaal Saathi', sosHint: 'Tap in an emergency', locating: 'Finding your location…',
    locOk: 'Location found (±{m} m)', locSaved: 'Using your last saved location', locFail: 'Could not get your location. Search for a place instead.',
    changeLanguage: 'Change language', mainNavigation: 'Main navigation', mapProvider: 'Map provider', nearbyList: 'Nearby places list',
    call108Label: 'Call ambulance number 108; availability varies by state', googleMapTitle: 'Google Maps nearby services',
    sosLabel: 'Emergency help',
    locationTitle: 'Use location', locationReason: 'Location finds nearby listed hospitals; you can still call 112 without it.',
    useLocation: 'Use my location', skipLocation: 'Not now',
    locationRequesting: 'Getting your location…',
    locationPermissionDenied: 'Could not get location. Search for a place instead; calling 112 still works.',
    medicalNotice: 'General guidance, not medical advice. Call 112 in an emergency.',
    operatorOpen: '🗣️ What to tell 112', operatorTitle: 'What to tell the 112 operator',
    operatorIntro: 'Call 112 using the button below. Read this script aloud; edit the details if needed.',
    operatorRetry: 'Retry mapped place lookup',
    operatorPeople: 'How many people are hurt?', operatorPeoplePH: 'Leave blank if not yet counted',
    operatorEvent: 'What happened?', operatorEventPH: 'e.g. chest pain, road accident',
    operatorLoading: 'Getting a mapped place or road…',
    operatorOffline: 'Offline: mapped place unavailable. Give the coordinates below.',
    operatorUnavailable: 'Mapped place unavailable. Give the coordinates below.',
    operatorSearch: 'Location unavailable. Use place search above, then open this helper again.',
    operatorCoordinates: 'My coordinates are latitude {lat}, longitude {lon}.',
    operatorGPS: 'GPS-reported accuracy is about ±{m} m; this may be a saved location.',
    operatorMapPin: 'Approximate map pin selected; GPS accuracy is unavailable.',
    operatorSavedGPS: 'Saved GPS point; its age is unknown (last reported accuracy ±{m} m).',
    operatorLandmark: 'Nearby mapped place or road (OpenStreetMap; approximate): {address}',
    operatorPeopleLine: 'People hurt: {people}.',
    operatorNotCounted: 'Not counted yet',
    operatorEventLine: 'What happened: {event}.',
    operatorNotSpecified: 'Not specified yet',
    operatorHello: 'Hello, I need emergency help.',
    operatorClosing: 'Please send help. I will follow your instructions.',
    operatorRead: '🔊 Read this aloud', operatorCall: '📞 Call 112 now',
    operatorVoiceUnavailable: 'Speech playback is not available on this phone.',
    operatorNoHindiVoice: 'No Hindi voice found. Add Hindi text-to-speech in phone settings.',
    geminiTitle: 'Find a reviewed card with Gemini',
    geminiExplain: 'Describe the situation in Hindi or English by typing or using Gemini Live voice input. Your description and voice audio are sent through this app server to Google Gemini; this app does not store the audio. Do not include names, phone numbers, or exact addresses; GPS is not sent. Gemini tries to match an existing reviewed card. If no card fits, it may give brief general emergency guidance. It does not diagnose or recommend medicines, doses, or risky procedures. Check any guidance carefully and call 112 in an emergency.',
    geminiInput: 'What is happening?', geminiPlaceholder: 'For example: “My father has chest pain”',
    geminiVoice: '🎙️ Ask by voice with Gemini Live',
    voiceUnavailable: 'Voice input is not supported in this browser. Type your question instead.',
    voiceNoSpeech: 'Gemini did not detect speech. Check microphone permission and try again, or type your question.',
    voiceNoMicrophone: 'No microphone was detected. Connect or enable one, then try again; or type your question.',
    voiceCallConfirm: 'Open the phone dialer to call 112 now?',
    voiceAlertConfirm: 'Send an emergency alert to your saved safety contacts? Location may be shared if available.',
    voiceProcessing: 'Checking your spoken question…',
    geminiRun: 'Find a reviewed card', geminiWorking: 'Checking for a matching card…',
    liveStart: '🎙️ Start Gemini Live voice help', liveStop: 'Stop Gemini Live', liveStarting: 'Preparing Gemini Live…', liveMicPermission: 'Allow microphone access in your browser…', liveConnecting: 'Connecting audio to Gemini Live…', liveSetupTimeout: 'Gemini Live did not finish connecting. Check your connection and try again.', liveListening: 'Listening. Speak naturally; say “stop” or tap stop to end.', liveUnavailable: 'Live voice could not start. Check microphone permission and Gemini configuration.', liveHttpsRequired: 'Your browser requires HTTPS to use the microphone here. Open the secure app link.', liveNoMicrophone: 'No microphone was found. Connect or enable a microphone, then try again.', liveSocketClosed: 'Gemini Live closed the connection before it was ready. Check the app link and Gemini access, then retry.', liveSocketError: 'Your browser could not connect to Gemini Live. Check internet access or a firewall that may block WebSockets, then retry.', liveUnsupported: 'This browser does not support microphone capture. Try a current version of Chrome, Edge, or Safari.', livePlaybackError: 'Gemini replied, but this browser could not play the audio. Check the selected speaker and try again.', micDenied: 'Microphone access was denied. Allow microphone access in your browser settings, then try again.',
    medicinePhotoLabel: 'Photo of a medicine strip (up to 12 MB; resized on your device)', medicineRead: 'Read visible label aloud', medicineSpeak: '🔊 Read aloud', medicineWorking: 'Resizing photo and reading visible text…', medicineSafety: 'Only visible label text is read. No dosage or treatment advice.', medicinePhotoError: 'Could not process that photo. Try a JPEG, PNG, or WebP image.', medicineCompressError: 'Could not resize the photo below 5 MB. Try cropping closer to the medicine strip.',
    medicinePrivacy: 'The photo is sent to Google Gemini to read the visible label.', hospitalNameLabel: 'Nearby hospital name', hospitalCheck: 'Check current opening information with Google Search', hospitalWorking: 'Checking current sources…', hospitalGrounded: 'Search-grounded result; hours may change. Call the hospital to confirm.', hospitalNoSources: 'Could not verify current opening information. Call the hospital to confirm.', hospitalPrivacy: 'A rounded, approximate location and hospital name are sent to Google Search grounding.',
    geminiShortInput: 'Add a few words about what happened, or choose a card below.',
    demoBanner: 'Demo mode: alerts are simulated here; no contacts are notified.',
    offlineBanner: 'Offline: saved first-aid cards and nearby listings remain available. Fresh maps and contact alerts need internet; call 112 directly.',
    demoAlertSaved: 'Demo only: simulated alert saved in this app. No contact was notified.',
    geminiMatch: 'Gemini found a matching card: “{title}”. Read its steps below. This is not a diagnosis; call 112 in an emergency.',
    geminiUnsure: 'No reviewed card matched. Gemini’s limited general guidance is below. Call 112 in an emergency.',
    geminiAnswerTitleCard: 'Gemini answer based on this app card',
    geminiAnswerTitleGeneral: 'Gemini general answer (not covered by an app card)',
    geminiAnswerDisclaimer: 'AI guidance can be wrong. Follow emergency operator instructions; call 112 if anyone is in immediate danger.',
    geminiNotConfigured: 'Gemini is not configured. Choose a card below; the app works without a Gemini key.',
    geminiKeyInvalid: 'Gemini API key was rejected. Check the server configuration.',
    geminiModelUnavailable: 'Gemini model is unavailable. Check GEMINI_MODEL on the server and restart the app.',
    geminiRequestRejected: 'Gemini rejected the request. Check the server model and API configuration.',
    geminiBusy: 'Gemini is busy. Choose a card below or call 112.',
    geminiTimedOut: 'Gemini timed out. Choose a card below or call 112.',
    geminiConnectionError: 'This server cannot connect to Google Gemini. Check its internet/firewall access, then try again.',
    geminiProviderError: 'Google Gemini returned a service error. Try again later or choose a card below.',
    geminiUnavailable: 'Gemini could not complete this request. Try again, choose a reviewed card below, or call 112 if urgent.',
    geminiMalformed: 'Gemini returned an answer the app could not verify. Try again, choose a reviewed card below, or call 112 if urgent.',
    ambulanceNotice: '108 ambulance service availability varies by state. If unavailable, call 112.',
    homeNearbyTitle: 'Nearby hospitals listed on OpenStreetMap',
    homeNearbyLoading: 'Finding nearby listed hospitals…',
    homeNearbyError: 'Could not load nearby OpenStreetMap listings. This does not mean there are no hospitals. Try again or call 112.',
    homeNearbyEmpty: 'No hospitals are listed within 3 km on OpenStreetMap. Search the wider Nearby list, or call 112 if urgent.',
    homeNearbyPrompt: 'Tap to search for hospitals near this location.',
    homeNearbyRetry: 'Retry hospital search',
    homeNearbyAll: 'See all nearby services',
    homeNearbyGoogle: 'Search nearby hospitals on Google Maps',
    emergencyRankNote: 'Hospitals tagged emergency=yes in OpenStreetMap appear first. The tag may be outdated; services and opening status are not confirmed.',
    snakebiteHospitalNote: 'For a snakebite, call 112 and ask which hospital has anti-snake venom. OpenStreetMap cannot confirm stock or availability.',
    incidentShareTitle: 'Share this emergency',
    incidentShareExplain: 'Choose a contact to open WhatsApp with this incident and your location map link. WhatsApp receives the prefilled draft; it is not delivered to the contact until you tap Send. Gemini does not receive your location.',
    incidentShareNoContacts: 'Add a WhatsApp contact in the Walk tab first.',
    waAddContact: 'Add WhatsApp contact',
    waContactSend: 'WhatsApp {name}',
    waPreparing: 'Getting your location and preparing the message…',
    waLocationUnavailable: 'Could not get a location. Enable location or call 112.',
    waReady: 'WhatsApp opened for {name}. Review the message and tap Send.',
    waGeneric: 'Emergency',
    waMessage: 'I need help. Emergency: {event}. My location: {map}. Please call me. In India, call 112 for emergency help.',
    emergencyPhoneShare: 'Share alert using phone apps',
    emergencyPhoneShareExplain: 'Choose SMS or another available app. Review the message and send it yourself; your location is included when available.',
    emergencyPhoneShareUnavailable: 'Phone sharing is unavailable here. Use WhatsApp below or call 112.',
    whatsappContactsTitle: 'WhatsApp contacts (saved on this device)',
    whatsappContactsExplain: 'Numbers are stored on this device and are not sent to our server or Gemini. When you tap a contact, WhatsApp receives the number and prefilled message; you decide whether to send it.',
    waContactName: 'Contact name',
    waContactPhone: 'WhatsApp number (10-digit India number or include country code)',
    waContactNamePH: 'e.g. Family',
    waContactPhonePH: '+91 98765 43210',
    waContactSave: 'Save WhatsApp contact',
    waContactUpdate: 'Update WhatsApp contact',
    waContactCancel: 'Cancel edit',
    waContactEdit: 'Edit',
    waContactRemove: 'Remove',
    waContactEmpty: 'No WhatsApp contacts saved on this device yet.',
    waContactInvalid: 'Enter a valid phone number. Use 10 digits for an Indian number or include the country code.',
    waContactSaved: 'WhatsApp contact saved on this device.',
    waContactRemoved: 'WhatsApp contact removed.',
    waRemoveConfirm: 'Remove {name} from this device?',
    searchPlace: 'Search for your place', search: 'Search', placePH: 'e.g. Kalyanpur, Kanpur',
    whatHappened: 'What happened?', stepsH: 'Do this now', dontsH: 'Do NOT do this',
    read: '🔊 Read aloud', stop: 'Stop', noVoice: 'No Hindi voice found on this phone. Add Hindi text-to-speech in phone settings.',
    shareLive: '📍 Share live location on WhatsApp', sharing: 'Sharing live location. Link:', stopShare: 'Stop sharing',
    tabHelp: 'Help', tabNear: 'Nearby', tabWalk: 'Walk',
    hospital: 'Hospitals', clinic: 'Clinics', pharmacy: 'Pharmacies', police: 'Police',
    call: '📞 Call', dir: '🧭 Directions', emerg: 'Emergency dept', unnamed: 'Unnamed place',
    noResults: 'Nothing mapped nearby. OpenStreetMap may be incomplete here. Call 112.',
    osmWarn: 'Listed on OpenStreetMap. Opening hours and beds are not confirmed. Call first if you can.',
    osmMapFallback: 'View OpenStreetMap at this location',
    nearErrorNoSavedType: 'No saved listing for this type. Could not load a fresh list; that does not mean none exist.',
    savedList: 'Place list updated {m} min ago.', nearFresh: 'Places updated just now.',
    nearLoading: 'Finding nearby places…', nearError: 'Could not load places. Try refresh or call 112.',
    nearOffline: 'Could not refresh. Showing saved OSM data, updated {m} min ago.',
    nearUseLocation: 'Use my current location',
    nearLocationUpdating: 'Getting your current GPS location…',
    nearLocationGps: 'Current GPS location: {lat}, {lon} (accuracy ±{m} m).',
    nearLocationSaved: 'Could not refresh GPS; using saved location: {lat}, {lon}. Tap the button to retry.',
    nearLocationManual: 'Using searched map location: {lat}, {lon}. This is not live GPS.',
    nearLocationMissing: 'Location unavailable. Allow location access or search for a place.',
    nearLocationSecure: 'This page is not secure (HTTP), so Edge blocks live location. Open the app over HTTPS, or use localhost on this same device.',
    nearLocationDenied: 'Location permission is blocked. Allow location in your browser settings, then retry.',
    nearLocationFailed: 'Could not get GPS. Check device location settings and retry; showing saved location if available.',
    nearEssentials: 'Hospitals & pharmacies',
    nearMapCenter: 'Center map on my location', nearMapYou: 'Your location',
    nearMapAria: 'Nearby services map', nearMapLegend: 'Map markers',
    nearMapGoogle: 'Google Maps', nearMapOsm: 'OpenStreetMap pins',
    nearMapGoogleOpen: 'Open nearby search in Google Maps',
    nearMapGoogleStatus: 'Google Maps shows a pin at your latest GPS fix and recenters as you move. Nearby services are listed below.',
    nearMapLoading: 'Loading nearby map listings…',
    nearMapUnavailable: 'The map could not load. Use the nearby list below or call 112.',
    nearMapNeedLocation: 'Allow location to show nearby services on the map.',
    nearMapPlaces: '{n} nearby places shown. Listings may be incomplete or out of date.',
    nearMapNoPlaces: 'No nearby places are listed on OpenStreetMap. This does not mean none exist.',
    findingHospital: 'Finding the nearest listed hospital…',
    hospitalUnavailable: 'Could not refresh hospitals. The saved list may be old.',
    sendingAlert: 'Sending alert to your contacts…',
    refresh: 'Refresh', loadFail: 'Map service is busy. Call 112 or try again.',
    nearest: 'Nearest hospital', alertedN: 'Alert sent to {n} contact(s).', noContacts: 'No safety contacts yet. Add them in the Walk tab.',
    sendWA: 'Send my location on WhatsApp', alertFail: 'Could not reach your contacts. Call someone now.',
    walkTitle: 'Walk with me', walkExplain: 'Set a timer. If you do not tap “I’m safe” in time, your contacts get an alert with your last location. The timer runs on the server, so it works even if your phone dies. A one-time beep and vibration may remind you at one minute; browser support varies.',
    yourName: 'Your name (shown in alerts)', contactsTitle: 'Safety contacts', addContact: '+ Add contact', askLabel: 'Contact name (e.g. Mom)',
    joined: 'Joined', pending: 'Waiting', invite: 'Send invite', inviteText: 'Please be my safety contact. Open this link and press Start in Telegram: ',
    min: 'min', demo1: '1 min (demo)', startWalk: 'Start walk', imSafe: '✅ I’m safe', plus10: '+10 min', panic: '🚨 Alert now', duress: 'Send discreet alert',
    duressExplain: 'Sends the safety alert without an alarm sound from this app. The screen will show the alert state; device visibility and recipient notifications depend on their settings.',
    duressDelivered: 'Discreet alert delivered to {n} contact(s). The alert is visible on this screen.',
    duressDemo: 'Demo only: simulated discreet alert saved here; no contact was notified.',
    walkOn: 'Walk in progress. Your contacts are alerted when this reaches 0:00.', walkAlerting: 'The alert is still being delivered…', walkAlerted: 'Alert delivered to {n} contact(s). Call 112 if you need help.', walkNoRecipients: 'No contacts received the alert. Call 112 if you need help.', walkDemoAlert: 'Demo only: simulated alert saved in this app; no contact was notified.',
    walkSafe: 'Checked in. Stay safe!', noJoined: 'No contact has joined yet, so nobody would get the alert. Start anyway?',
    demoTitle: 'Demo mode: messages that would go to contacts on Telegram', needLoc: 'Location is needed first.',
    footer: 'General guidance, not medical advice. This app does not call an ambulance. In an emergency, always call 112.',
    away: 'away', del: 'Remove', removeContact: 'Remove {name}', countdownLabel: 'Time remaining',
    call112Label: 'Call emergency number 112', sosStatus: 'Emergency help status', dismissWalk: 'Close walk status',
    inviteExpired: 'Invite expired. Remove and add again.',
    privacyTitle: 'Privacy and your data', privacyNote: 'Your saved location, nearby list, and WhatsApp numbers stay on this device. Nearby searches send coordinates to OpenStreetMap services; the Google Maps embed also receives your location and selected service type. SOS, live sharing, and Walk send your location to the contacts or link you choose. Live links expire automatically; use Delete my data to end sharing now. Deleting cannot recall messages already delivered.',
    deleteData: 'Delete my data from this device', deleteConfirm: 'Delete this device’s saved contacts, WhatsApp numbers, live links, walks, and demo messages? This cannot recall messages already delivered.',
    deleteSuccess: 'Your device data was deleted.', deleteFail: 'Could not delete server data. Check your connection and try again.', deletingData: 'Deleting your data…',
  },
  hi: {
    appName: 'आपातकाल साथी', sosHint: 'आपातकाल में दबाएं', locating: 'आपकी लोकेशन खोज रहे हैं…',
    locOk: 'लोकेशन मिली (±{m} मी)', locSaved: 'पिछली सेव लोकेशन इस्तेमाल हो रही है', locFail: 'लोकेशन नहीं मिली। कोई जगह खोजें।',
    changeLanguage: 'भाषा बदलें', mainNavigation: 'मुख्य मेन्यू', mapProvider: 'नक्शा चुनें', nearbyList: 'पास की जगहों की सूची',
    call108Label: 'एम्बुलेंस नंबर 108 पर कॉल करें; उपलब्धता राज्य के अनुसार बदलती है', googleMapTitle: 'पास की सेवाओं का Google Maps नक्शा',
    sosLabel: 'आपातकाल में मदद लें',
    locationTitle: 'लोकेशन दें', locationReason: 'पास के दर्ज अस्पताल खोजने के लिए लोकेशन दें; 112 पर कॉल करने के लिए यह ज़रूरी नहीं।',
    useLocation: 'मेरी लोकेशन लें', skipLocation: 'अभी नहीं',
    locationRequesting: 'आपकी लोकेशन ले रहे हैं…',
    locationPermissionDenied: 'लोकेशन नहीं मिली। जगह खोजें; 112 पर कॉल कर सकते हैं।',
    medicalNotice: 'यह सामान्य जानकारी है, चिकित्सा सलाह नहीं। आपातकाल में 112 पर कॉल करें।',
    operatorOpen: '🗣️ 112 पर क्या बताएं', operatorTitle: '112 ऑपरेटर को क्या बताएं',
    operatorIntro: 'नीचे दिए बटन से 112 पर कॉल करें। यह बात पढ़कर बताएं; ज़रूरत हो तो जानकारी बदलें।',
    operatorRetry: 'नक्शे में जगह फिर खोजें',
    operatorPeople: 'कितने लोग घायल हैं?', operatorPeoplePH: 'गिनती न हुई हो तो खाली छोड़ें',
    operatorEvent: 'क्या हुआ?', operatorEventPH: 'जैसे सीने में दर्द, सड़क दुर्घटना',
    operatorLoading: 'नक्शे में पास की जगह या सड़क खोज रहे हैं…',
    operatorOffline: 'ऑफ़लाइन हैं: नक्शे में पास की जगह नहीं मिली। नीचे दिए निर्देशांक बताएं।',
    operatorUnavailable: 'नक्शे में पास की जगह नहीं मिली। नीचे दिए निर्देशांक बताएं।',
    operatorSearch: 'लोकेशन नहीं मिली। ऊपर जगह खोजें, फिर यह मदद दोबारा खोलें।',
    operatorCoordinates: 'मेरी लोकेशन: अक्षांश {lat}, देशांतर {lon}।',
    operatorGPS: 'GPS की बताई सटीकता लगभग ±{m} मीटर है; यह सेव की हुई लोकेशन हो सकती है।',
    operatorMapPin: 'आपने नक्शे पर अनुमानित जगह चुनी है; GPS की सटीकता उपलब्ध नहीं है।',
    operatorSavedGPS: 'सेव किया GPS बिंदु; यह कितना पुराना है पता नहीं (आख़िरी सटीकता ±{m} मीटर थी)।',
    operatorLandmark: 'नक्शे में पास की जगह या सड़क (OpenStreetMap; अनुमानित): {address}',
    operatorPeopleLine: 'घायल लोगों की संख्या: {people}।',
    operatorNotCounted: 'अभी गिनती नहीं हुई',
    operatorEventLine: 'क्या हुआ: {event}।',
    operatorNotSpecified: 'अभी नहीं बताया',
    operatorHello: 'नमस्ते, मुझे आपातकालीन मदद चाहिए।',
    operatorClosing: 'कृपया मदद भेजें।',
    operatorRead: '🔊 सुनकर बताएं', operatorCall: '📞 अभी 112 पर कॉल करें',
    operatorVoiceUnavailable: 'इस फ़ोन पर सुनाने की सुविधा उपलब्ध नहीं है।',
    operatorNoHindiVoice: 'हिंदी आवाज़ नहीं मिली। फ़ोन की सेटिंग में हिंदी आवाज़ जोड़ें।',
    geminiTitle: 'Gemini से जाँचा हुआ कार्ड खोजें',
    geminiExplain: 'टाइप करके या Gemini Live से बोलकर हिंदी या अंग्रेज़ी में बताएँ। आपका विवरण और आवाज़ इस ऐप के सर्वर से Google Gemini को भेजे जाते हैं; ऐप आवाज़ सेव नहीं करता। नाम, फ़ोन नंबर या पूरा पता न लिखें; GPS नहीं भेजा जाता। Gemini पहले मौजूदा जाँचे हुए कार्ड से मिलान करता है। कोई कार्ड न मिले तो यह सीमित सामान्य आपातकालीन जानकारी दे सकता है। यह बीमारी की पहचान, दवा/खुराक की सलाह या जोखिम भरे तरीके नहीं बताता। जानकारी ध्यान से देखें और आपातकाल में 112 पर कॉल करें।',
    geminiInput: 'क्या हो रहा है?', geminiPlaceholder: 'जैसे: “पापा के सीने में दर्द है”',
    geminiVoice: '🎙️ Gemini Live से बोलकर पूछें',
    voiceUnavailable: 'इस ब्राउज़र में आवाज़ से पूछना उपलब्ध नहीं है। सवाल टाइप करें।',
    voiceNoSpeech: 'Gemini को आवाज़ नहीं मिली। माइक्रोफ़ोन की अनुमति जाँचें और फिर बोलें, या सवाल लिखें।',
    voiceNoMicrophone: 'माइक्रोफ़ोन नहीं मिला। इसे चालू करें या सवाल लिखें।',
    voiceCallConfirm: 'क्या अभी 112 कॉल करने के लिए फ़ोन डायलर खोलें?',
    voiceAlertConfirm: 'क्या सेव किए सुरक्षा संपर्कों को आपातकालीन अलर्ट भेजें? उपलब्ध होने पर लोकेशन साझा हो सकती है।',
    voiceProcessing: 'आपका बोला सवाल जाँच रहे हैं…',
    geminiRun: 'जाँचा हुआ कार्ड खोजें', geminiWorking: 'मिलता-जुलता कार्ड देख रहे हैं…',
    liveStart: '🎙️ Gemini Live से बात करें', liveStop: 'Gemini Live बंद करें', liveStarting: 'Gemini Live तैयार कर रहे हैं…', liveMicPermission: 'ब्राउज़र में माइक्रोफ़ोन की अनुमति दें…', liveConnecting: 'Gemini Live से आवाज़ जोड़ रहे हैं…', liveSetupTimeout: 'Gemini Live जुड़ नहीं पाया। इंटरनेट जाँचें और फिर कोशिश करें।', liveListening: 'सुन रहे हैं। बोलें; रोकने के लिए “stop” कहें या बटन दबाएँ।', liveUnavailable: 'Live आवाज़ शुरू नहीं हुई। माइक्रोफ़ोन अनुमति और Gemini सेटिंग जाँचें।', liveHttpsRequired: 'इस पते पर माइक्रोफ़ोन के लिए HTTPS ज़रूरी है। सुरक्षित ऐप लिंक खोलें।', liveNoMicrophone: 'माइक्रोफ़ोन नहीं मिला। माइक्रोफ़ोन जोड़ें या चालू करें और फिर कोशिश करें।', liveSocketClosed: 'Gemini Live जुड़ने से पहले कनेक्शन बंद हो गया। ऐप लिंक और Gemini सेटिंग जाँचें।', liveSocketError: 'ब्राउज़र Gemini Live से नहीं जुड़ पाया। इंटरनेट या WebSocket रोकने वाले फ़ायरवॉल को जाँचें।', liveUnsupported: 'इस ब्राउज़र में माइक्रोफ़ोन नहीं चल रहा। Chrome, Edge या Safari का नया संस्करण आज़माएँ।', livePlaybackError: 'Gemini ने जवाब दिया, लेकिन ब्राउज़र आवाज़ नहीं चला पाया। स्पीकर जाँचें और फिर कोशिश करें।', micDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें।',
    medicinePhotoLabel: 'दवा की स्ट्रिप की फोटो (12 MB तक; फ़ोन पर छोटी होगी)', medicineRead: 'दिख रहा नाम पढ़ें', medicineSpeak: '🔊 ज़ोर से पढ़ें', medicineWorking: 'फोटो छोटी करके टेक्स्ट पढ़ रहे हैं…', medicineSafety: 'केवल दिख रहा टेक्स्ट पढ़ा जाएगा। खुराक या इलाज की सलाह नहीं मिलेगी।', medicinePhotoError: 'फोटो नहीं खुली। JPEG, PNG या WebP फोटो आज़माएँ।', medicineCompressError: 'फोटो 5 MB से छोटी नहीं हो पाई। दवा की स्ट्रिप के पास से फोटो लें।',
    medicinePrivacy: 'फोटो पर लिखा टेक्स्ट पढ़ने के लिए Google Gemini को भेजी जाएगी।', hospitalNameLabel: 'पास के अस्पताल का नाम', hospitalCheck: 'Google Search से अभी के खुले होने की जानकारी देखें', hospitalWorking: 'नई जानकारी खोज रहे हैं…', hospitalGrounded: 'Search से मिली जानकारी; समय बदल सकता है। पुष्टि के लिए अस्पताल को कॉल करें।', hospitalNoSources: 'अभी खुले होने की पुष्टि नहीं हुई। अस्पताल को कॉल करके पूछें।', hospitalPrivacy: 'लगभग की लोकेशन और अस्पताल का नाम Google Search को भेजे जाते हैं।',
    geminiShortInput: 'क्या हुआ, इसके बारे में कुछ शब्द लिखें या नीचे से कार्ड चुनें।',
    demoBanner: 'डेमो मोड: अलर्ट केवल इस ऐप में दिखते हैं; किसी संपर्क को संदेश नहीं जाता।',
    offlineBanner: 'इंटरनेट नहीं है: सेव किए प्राथमिक उपचार कार्ड और पास की सूची दिख सकती है। नए नक्शे और संपर्क अलर्ट के लिए इंटरनेट चाहिए; 112 पर सीधे कॉल करें।',
    demoAlertSaved: 'केवल डेमो: नकली अलर्ट इस ऐप में सहेजा गया; किसी संपर्क को सूचना नहीं गई।',
    geminiMatch: 'Gemini को मिलता-जुलता कार्ड मिला: “{title}”। नीचे दिए कदम पढ़ें। यह बीमारी की पहचान नहीं है; आपातकाल में 112 पर कॉल करें।',
    geminiUnsure: 'कोई जाँचा हुआ कार्ड नहीं मिला। Gemini की सीमित सामान्य जानकारी नीचे है। आपातकाल में 112 पर कॉल करें।',
    geminiAnswerTitleCard: 'ऐप कार्ड पर आधारित Gemini का जवाब',
    geminiAnswerTitleGeneral: 'Gemini का सामान्य जवाब (ऐप कार्ड में नहीं)',
    geminiAnswerDisclaimer: 'AI की सलाह गलत हो सकती है। आपातकालीन ऑपरेटर के निर्देश मानें; किसी को तत्काल खतरा हो तो 112 पर कॉल करें।',
    geminiNotConfigured: 'Gemini चालू नहीं है। नीचे कार्ड चुनें; बिना Gemini key के भी ऐप काम करता है।',
    geminiKeyInvalid: 'Gemini API key स्वीकार नहीं हुई। सर्वर की सेटिंग जांचें।',
    geminiModelUnavailable: 'Gemini मॉडल उपलब्ध नहीं है। सर्वर में GEMINI_MODEL जांचें और ऐप फिर शुरू करें।',
    geminiRequestRejected: 'Gemini ने अनुरोध स्वीकार नहीं किया। सर्वर का मॉडल और API सेटिंग जांचें।',
    geminiBusy: 'Gemini अभी व्यस्त है। नीचे कार्ड चुनें या 112 पर कॉल करें।',
    geminiTimedOut: 'Gemini से जवाब आने में देर हुई। नीचे कार्ड चुनें या 112 पर कॉल करें।',
    geminiConnectionError: 'यह सर्वर Google Gemini से कनेक्ट नहीं हो पा रहा। सर्वर का इंटरनेट/फ़ायरवॉल जांचें और फिर कोशिश करें।',
    geminiProviderError: 'Google Gemini की सेवा में त्रुटि आई। बाद में फिर कोशिश करें या नीचे से कार्ड चुनें।',
    geminiUnavailable: 'Gemini अभी जवाब नहीं दे पाया। फिर कोशिश करें, नीचे से कार्ड चुनें या ज़रूरत हो तो 112 पर कॉल करें।',
    geminiMalformed: 'Gemini का जवाब जाँचा नहीं जा सका। फिर कोशिश करें, नीचे से कार्ड चुनें या ज़रूरत हो तो 112 पर कॉल करें।',
    ambulanceNotice: '108 एम्बुलेंस हर राज्य में उपलब्ध नहीं है। संपर्क न हो तो 112 पर कॉल करें।',
    homeNearbyTitle: 'OpenStreetMap पर दर्ज पास के अस्पताल',
    homeNearbyLoading: 'पास के दर्ज अस्पताल खोज रहे हैं…',
    homeNearbyError: 'पास की OpenStreetMap सूची नहीं मिल सकी। इसका मतलब यह नहीं कि अस्पताल नहीं हैं। फिर कोशिश करें या 112 पर कॉल करें।',
    homeNearbyEmpty: 'OpenStreetMap पर 3 किमी के भीतर अस्पताल दर्ज नहीं है। Nearby में बड़ा दायरा खोजें या ज़रूरत हो तो 112 पर कॉल करें।',
    homeNearbyPrompt: 'इस लोकेशन के पास अस्पताल खोजने के लिए दबाएं।',
    homeNearbyRetry: 'अस्पताल फिर खोजें',
    homeNearbyAll: 'पास की सभी सेवाएं देखें',
    homeNearbyGoogle: 'Google Maps पर पास के अस्पताल खोजें',
    emergencyRankNote: 'OpenStreetMap में emergency=yes टैग वाले अस्पताल पहले दिखते हैं। टैग पुराना हो सकता है; सेवा या खुला होना पुष्ट नहीं है।',
    snakebiteHospitalNote: 'साँप के काटने पर 112 पर कॉल करें और पूछें कि किस अस्पताल में एंटी-स्नेक वेनम उपलब्ध है। OpenStreetMap इसका स्टॉक नहीं बताता।',
    incidentShareTitle: 'यह आपातकालीन संदेश भेजें',
    incidentShareExplain: 'संपर्क चुनें। WhatsApp में घटना और आपकी लोकेशन का नक्शा लिंक भरा हुआ खुलेगा। WhatsApp को संदेश मिलेगा, लेकिन संपर्क तक तभी जाएगा जब आप भेजें दबाएंगे। आपकी लोकेशन Gemini को नहीं जाती।',
    incidentShareNoContacts: 'पहले "साथ चलें" टैब में WhatsApp संपर्क जोड़ें।',
    waAddContact: 'WhatsApp संपर्क जोड़ें',
    waContactSend: '{name} को WhatsApp करें',
    waPreparing: 'लोकेशन लेकर संदेश तैयार कर रहे हैं…',
    waLocationUnavailable: 'लोकेशन नहीं मिली। लोकेशन चालू करें या 112 पर कॉल करें।',
    waReady: '{name} के लिए WhatsApp खुल गया है। संदेश जाँचकर भेजें दबाएं।',
    waGeneric: 'आपातकाल',
    waMessage: 'मुझे मदद चाहिए। आपातकाल: {event}। मेरी लोकेशन: {map}। कृपया मुझे कॉल करें। भारत में आपातकालीन मदद के लिए 112 पर कॉल करें।',
    emergencyPhoneShare: 'फ़ोन के ऐप से मदद का संदेश भेजें',
    emergencyPhoneShareExplain: 'SMS या उपलब्ध कोई दूसरा ऐप चुनें। संदेश खुद जाँचकर भेजें; लोकेशन उपलब्ध होने पर शामिल होगी।',
    emergencyPhoneShareUnavailable: 'यहाँ फ़ोन से शेयर करना उपलब्ध नहीं है। नीचे WhatsApp चुनें या 112 पर कॉल करें।',
    whatsappContactsTitle: 'WhatsApp संपर्क (इस फ़ोन में सेव)',
    whatsappContactsExplain: 'नंबर इसी फ़ोन में सेव रहते हैं; हमारे सर्वर या Gemini को नहीं भेजे जाते। संपर्क दबाने पर WhatsApp को नंबर और भरा हुआ संदेश मिलेगा; भेजने का फैसला आपका है।',
    waContactName: 'संपर्क का नाम',
    waContactPhone: 'WhatsApp नंबर (भारत का 10 अंकों का नंबर या देश कोड सहित)',
    waContactNamePH: 'जैसे परिवार',
    waContactPhonePH: '+91 98765 43210',
    waContactSave: 'WhatsApp संपर्क सेव करें',
    waContactUpdate: 'WhatsApp संपर्क बदलें',
    waContactCancel: 'बदलाव रद्द करें',
    waContactEdit: 'बदलें',
    waContactRemove: 'हटाएं',
    waContactEmpty: 'इस फ़ोन में अभी कोई WhatsApp संपर्क सेव नहीं है।',
    waContactInvalid: 'सही फ़ोन नंबर लिखें। भारत का नंबर 10 अंकों में या देश कोड के साथ लिखें।',
    waContactSaved: 'WhatsApp संपर्क इसी फ़ोन में सेव हो गया।',
    waContactRemoved: 'WhatsApp संपर्क हटा दिया गया।',
    waRemoveConfirm: 'क्या इस फ़ोन से {name} को हटाएं?',
    searchPlace: 'अपनी जगह खोजें', search: 'खोजें', placePH: 'जैसे कल्याणपुर, कानपुर',
    whatHappened: 'क्या हुआ?', stepsH: 'अभी यह करें', dontsH: 'यह न करें',
    read: '🔊 सुनें', stop: 'रोकें', noVoice: 'इस फ़ोन में हिंदी आवाज़ नहीं मिली। फ़ोन की सेटिंग में हिंदी आवाज़ जोड़ें।',
    shareLive: '📍 WhatsApp पर लाइव लोकेशन भेजें', sharing: 'लाइव लोकेशन शेयर हो रही है। लिंक:', stopShare: 'शेयरिंग बंद करें',
    tabHelp: 'मदद', tabNear: 'पास में', tabWalk: 'साथ चलें',
    hospital: 'अस्पताल', clinic: 'क्लिनिक', pharmacy: 'दवा की दुकानें', police: 'पुलिस',
    call: '📞 कॉल', dir: '🧭 रास्ता', emerg: 'आपातकालीन विभाग', unnamed: 'बिना नाम की जगह',
    noResults: 'पास में कुछ मैप में नहीं मिला। यहाँ OpenStreetMap अधूरा हो सकता है। 112 पर कॉल करें।',
    osmWarn: 'OpenStreetMap पर दर्ज है। खुलने का समय और बिस्तर पक्के नहीं हैं। हो सके तो पहले फ़ोन करें।',
    osmMapFallback: 'इस जगह का OpenStreetMap नक्शा देखें',
    nearErrorNoSavedType: 'इस तरह की सेव की हुई जगह नहीं है। नई सूची नहीं मिल सकी; इसका मतलब यह नहीं कि यहाँ कोई जगह नहीं है।',
    savedList: 'जगहों की सूची {m} मिनट पहले अपडेट हुई।', nearFresh: 'जगहों की सूची अभी अपडेट हुई।',
    nearLoading: 'पास की जगहें खोज रहे हैं…', nearError: 'जगहें नहीं मिलीं। फिर कोशिश करें या 112 पर कॉल करें।',
    nearOffline: 'नई जानकारी नहीं मिली। सेव OSM सूची {m} मिनट पुरानी है।',
    nearUseLocation: 'मेरी मौजूदा लोकेशन लें',
    nearLocationUpdating: 'आपकी मौजूदा GPS लोकेशन ले रहे हैं…',
    nearLocationGps: 'मौजूदा GPS लोकेशन: {lat}, {lon} (सटीकता ±{m} मीटर)।',
    nearLocationSaved: 'GPS लोकेशन नहीं मिली; सेव लोकेशन इस्तेमाल हो रही है: {lat}, {lon}। फिर कोशिश करने के लिए बटन दबाएं।',
    nearLocationManual: 'खोजी हुई नक्शे की लोकेशन: {lat}, {lon}। यह लाइव GPS नहीं है।',
    nearLocationMissing: 'लोकेशन उपलब्ध नहीं है। लोकेशन की अनुमति दें या जगह खोजें।',
    nearLocationSecure: 'यह पेज सुरक्षित HTTPS पर नहीं है, इसलिए Edge लाइव लोकेशन रोकता है। ऐप HTTPS लिंक से खोलें या इसी डिवाइस पर localhost इस्तेमाल करें।',
    nearLocationDenied: 'लोकेशन की अनुमति बंद है। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें।',
    nearLocationFailed: 'GPS नहीं मिला। डिवाइस की लोकेशन सेटिंग देखें; सेव लोकेशन हो तो वही दिखेगी।',
    nearEssentials: 'अस्पताल और फार्मेसी',
    nearMapCenter: 'मेरी लोकेशन पर नक्शा केंद्रित करें', nearMapYou: 'आपकी लोकेशन',
    nearMapAria: 'पास की सेवाओं का नक्शा', nearMapLegend: 'नक्शे के संकेत',
    nearMapGoogle: 'Google Maps', nearMapOsm: 'OpenStreetMap पिन',
    nearMapGoogleOpen: 'Google Maps में पास की जगहें खोलें',
    nearMapGoogleStatus: 'Google Maps पर आपकी नई GPS लोकेशन का पिन दिखता है और चलते समय नक्शा फिर केंद्रित होता है। पास की जगहों की सूची नीचे है।',
    nearMapLoading: 'पास की जगहों का नक्शा लोड हो रहा है…',
    nearMapUnavailable: 'नक्शा लोड नहीं हुआ। नीचे पास की सूची देखें या 112 पर कॉल करें।',
    nearMapNeedLocation: 'नक्शे पर पास की सेवाएं देखने के लिए लोकेशन दें।',
    nearMapPlaces: 'पास की {n} जगहें दिखाई गई हैं। सूची अधूरी या पुरानी हो सकती है।',
    nearMapNoPlaces: 'OpenStreetMap पर पास की जगहें दर्ज नहीं हैं। इसका मतलब यह नहीं कि कोई जगह नहीं है।',
    findingHospital: 'पास का दर्ज अस्पताल खोज रहे हैं…',
    hospitalUnavailable: 'अस्पतालों की नई जानकारी नहीं मिली। सेव सूची पुरानी हो सकती है।',
    sendingAlert: 'आपके संपर्कों को अलर्ट भेज रहे हैं…',
    refresh: 'फिर से लें', loadFail: 'मैप सेवा व्यस्त है। 112 पर कॉल करें या फिर कोशिश करें।',
    nearest: 'पास का अस्पताल', alertedN: '{n} संपर्कों को अलर्ट भेजा गया।', noContacts: 'अभी कोई भरोसेमंद संपर्क नहीं। "साथ चलें" टैब में जोड़ें।',
    sendWA: 'WhatsApp पर मेरी लोकेशन भेजें', alertFail: 'संपर्कों तक अलर्ट नहीं पहुँचा। अभी किसी को फ़ोन करें।',
    walkTitle: 'साथ चलें', walkExplain: 'टाइमर लगाएं। समय पर “मैं सुरक्षित हूँ” न दबाया, तो आपके संपर्कों को आख़िरी लोकेशन के साथ अलर्ट जाएगा। टाइमर सर्वर पर चलता है, इसलिए फ़ोन बंद होने पर भी चलेगा। एक मिनट बाकी होने पर फ़ोन बज सकता है या कंपन कर सकता है; यह सुविधा हर ब्राउज़र में काम नहीं करती।',
    yourName: 'आपका नाम (अलर्ट में दिखेगा)', contactsTitle: 'भरोसेमंद संपर्क', addContact: '+ संपर्क जोड़ें', askLabel: 'संपर्क का नाम (जैसे माँ)',
    joined: 'जुड़ गए', pending: 'इंतज़ार में', invite: 'निमंत्रण भेजें', inviteText: 'कृपया मेरे भरोसेमंद संपर्क बनें। यह लिंक खोलें और Telegram में Start दबाएं: ',
    min: 'मिनट', demo1: '1 मिनट (डेमो)', startWalk: 'चलना शुरू करें', imSafe: '✅ मैं सुरक्षित हूँ', plus10: '+10 मिनट', panic: '🚨 अभी अलर्ट भेजें', duress: 'चुपचाप सुरक्षा अलर्ट भेजें',
    duressExplain: 'ऐप से बिना अलार्म की आवाज़ किए सुरक्षा संदेश भेजा जाएगा। स्क्रीन पर अलर्ट दिखेगा; फ़ोन पर दिखना और संपर्कों को सूचना मिलना उनकी सेटिंग पर निर्भर है।',
    duressDelivered: '{n} संपर्कों तक चुपचाप सुरक्षा अलर्ट पहुँचा। यह अलर्ट इस स्क्रीन पर दिखेगा।',
    duressDemo: 'केवल डेमो: चुपचाप भेजा जाने वाला नकली अलर्ट यहाँ सेव हुआ; किसी संपर्क को सूचना नहीं गई।',
    walkOn: 'टाइमर चालू है। समय खत्म होने पर संपर्कों को अलर्ट जाएगा।', walkAlerting: 'अलर्ट भेजने की कोशिश जारी है…', walkAlerted: '{n} संपर्कों को अलर्ट पहुँचाया गया। मदद चाहिए तो 112 पर कॉल करें।', walkNoRecipients: 'किसी संपर्क को अलर्ट नहीं पहुँचा। मदद चाहिए तो 112 पर कॉल करें।', walkDemoAlert: 'केवल डेमो: नकली अलर्ट इस ऐप में सहेजा गया; किसी संपर्क को सूचना नहीं गई।',
    walkSafe: 'चेक-इन हो गया। सुरक्षित रहें!', noJoined: 'अभी कोई संपर्क जुड़ा नहीं है, इसलिए अलर्ट किसी को नहीं जाएगा। फिर भी शुरू करें?',
    demoTitle: 'डेमो मोड: संपर्कों को भेजे जाने वाले संदेश', needLoc: 'पहले लोकेशन दें।',
    footer: 'यह सामान्य जानकारी है, चिकित्सा सलाह नहीं। यह ऐप एम्बुलेंस नहीं भेजता। आपातकाल में 112 पर कॉल करें।',
    away: 'दूर', del: 'हटाएं', removeContact: '{name} को हटाएं', countdownLabel: 'बाकी समय',
    call112Label: 'आपातकालीन नंबर 112 पर कॉल करें', sosStatus: 'आपातकालीन मदद की स्थिति', dismissWalk: 'वॉक की स्थिति बंद करें',
    inviteExpired: 'निमंत्रण की अवधि खत्म। हटाकर फिर जोड़ें।',
    privacyTitle: 'आपकी निजता और डेटा', privacyNote: 'सेव की हुई लोकेशन, पास की सूची और WhatsApp नंबर इसी फ़ोन में रहते हैं। पास की जगह खोजने पर निर्देशांक OpenStreetMap सेवाओं को भेजे जाते हैं; Google Maps एम्बेड को भी आपकी लोकेशन और चुनी हुई सेवा का प्रकार मिलता है। SOS, लाइव लोकेशन और “साथ चलें” में आपकी लोकेशन चुने हुए संपर्कों या लिंक पर भेजी जाती है। लाइव लिंक अपने-आप खत्म होते हैं; शेयरिंग तुरंत रोकने के लिए मेरा डेटा हटाएं। पहले भेजे संदेश वापस नहीं लिए जा सकते।',
    deleteData: 'इस डिवाइस से मेरा डेटा हटाएं', deleteConfirm: 'इस डिवाइस के सेव संपर्क, WhatsApp नंबर, लाइव लिंक, वॉक और डेमो संदेश हटाएं? पहले भेजे संदेश वापस नहीं लिए जा सकते।',
    deleteSuccess: 'इस डिवाइस का डेटा हटा दिया गया।', deleteFail: 'सर्वर से डेटा नहीं हट सका। इंटरनेट जांचकर फिर कोशिश करें।', deletingData: 'आपका डेटा हटाया जा रहा है…',
  },
};
let lang = store.get('lang', 'hi');
const t = (k, v = {}) => (TXT[lang][k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x]);

/* ------------------------------------------------------------ state */
let pos = store.get('lastpos', null);     // {lat, lon, acc}
let locationPrompted = store.get('locationPrompted', false);
let locationRequestStatus = '';
let cards = [];
let curCard = null;
let nearType = 'essential';
let nearData = store.get('nearby', null); // {at, data}
let nearError = false, nearLoading = false, nearLoadPromise = null, nearRestPromise = null;
let nearbyMap = null, nearbyMapLocation = null, nearbyMapPlaces = null;
let nearbyMapFollow = true, nearbyMapLastPosition = null, nearbyMapDataKey = '';
let nearbyMapProvider = 'google', nearbyMapControlsBound = false;
let nearbyLocationChecked = false, nearbyLocationLoading = false, nearbyLocationRefreshFailed = false;
let nearbyLocationError = '';
let nearbyGoogleMapPosition = null;
let homeNearbyLoading = false, homeNearbyError = false, homeNearbySearched = false, homeNearbyPromise = null;
let contacts = store.get('contacts', []); // [{code,label,joined,link}]
let waContacts = store.get('waContacts', []);
if (!Array.isArray(waContacts)) waContacts = [];
waContacts = waContacts.filter(c => c && typeof c.label === 'string' && typeof c.phone === 'string')
  .map(c => ({label: c.label.trim().slice(0, 40), phone: normalizeWhatsAppPhone(c.phone)}))
  .filter(c => c.label && c.phone);
let editingWaContact = null;
let share = store.get('share', null);     // {token,key,url}
let walkSt = store.get('walk', null);     // {id,deadline,track,status,sent}
let shareTimer = null, walkTimers = [], watchId = null, demoMode = false;
let demoSession = store.get('demoSession', '');
let demoSessionExpires = store.get('demoSessionExpires', 0);
let demoSessionChecked = !!demoSession;
let demoSessionPromise = null;
let deviceToken = store.get('deviceToken', '');
let deviceTokenPromise = null;
let sosState = {locating: false, hospitalLoading: false, hospitalError: false, alertPending: false, alertSent: null};
let operator = {open: false, pos: null, address: '', lookup: 'idle'};
let operatorRequestId = 0;

async function ensureDemoSession() {
  if (demoSession && Date.now() < demoSessionExpires - 60000) return demoSession;
  if (demoSessionChecked && !demoSession) return '';
  if (!demoSessionPromise) {
    demoSessionPromise = (async () => {
      const r = await fetch('/api/demo-session', {method: 'POST'});
      if (!r.ok) throw new Error(r.statusText || 'Could not start a demo session.');
      const d = await r.json();
      demoMode = d.demo_mode;
      renderDemoBanner();
      demoSession = d.token || '';
      demoSessionExpires = d.expires_at ? d.expires_at * 1000 : 0;
      demoSessionChecked = true;
      store.set('demoSession', demoSession);
      store.set('demoSessionExpires', demoSessionExpires);
      return demoSession;
    })();
  }
  try { return await demoSessionPromise; }
  finally { demoSessionPromise = null; }
}

async function createDeviceToken() {
  const claims = {
    contacts: contacts.map(c => c.code).filter(Boolean),
    tracks: share?.token && share?.key ? [{token: share.token, key: share.key}] : [],
    walks: walkSt?.id ? [walkSt.id] : [],
  };
  const r = await fetch('/api/device-token', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(claims),
  });
  if (!r.ok) throw new Error(r.statusText || 'Could not start this device session.');
  const d = await r.json();
  deviceToken = d.token;
  store.set('deviceToken', deviceToken);
  return deviceToken;
}

async function ensureDeviceToken() {
  if (deviceToken) return deviceToken;
  if (!deviceTokenPromise) {
    deviceTokenPromise = (async () => {
      if (navigator.locks?.request) {
        return navigator.locks.request('aapatkaal-device-token', async () => {
          deviceToken = store.get('deviceToken', '');
          return deviceToken || createDeviceToken();
        });
      }
      return createDeviceToken();
    })();
  }
  try { return await deviceTokenPromise; }
  finally { deviceTokenPromise = null; }
}

async function api(path, body, method, retrySession = true) {
  const needsDemoSession = path === '/api/demo-log' || path === '/api/sos' || path === '/api/walk' || path === '/api/data';
  const session = needsDemoSession ? await ensureDemoSession() : '';
  const device = path === '/api/device-token' ? '' : await ensureDeviceToken();
  const options = body === undefined && !method ? {} : {
    method: method || 'POST', headers: {},
    body: body === undefined ? undefined : JSON.stringify(body)};
  options.headers = {...(options.headers || {})};
  if (body !== undefined) options.headers['Content-Type'] = 'application/json';
  if (device) options.headers['X-Device-Token'] = device;
  if (session) options.headers = {...(options.headers || {}), 'X-Demo-Session': session};
  const r = await fetch(path, options);
  if (r.status === 401 && needsDemoSession && session && retrySession) {
    demoSession = ''; demoSessionExpires = 0; demoSessionChecked = false;
    store.set('demoSession', ''); store.set('demoSessionExpires', 0);
    await ensureDemoSession();
    return api(path, body, method, false);
  }
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).detail || m; } catch {} throw new Error(m); }
  return r.json();
}
function hav(a, b, c, d) {
  const R = 6371000, p = Math.PI / 180, dp = (c - a) * p, dl = (d - b) * p;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
const myName = () => (store.get('name', '') || '').trim();
const joinedCodes = () => contacts.filter(c => c.joined).map(c => c.code);

/* ------------------------------------------------------------ static text + tabs */
function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('appName');
  $('#voiceNote').hidden = true;
  $('#operatorVoiceNote').hidden = true;
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  $('#langBtn').textContent = lang === 'hi' ? 'EN' : 'हिं';
  $('#langBtn').setAttribute('aria-label', t('changeLanguage'));
  $('#sos').setAttribute('aria-label', t('sosLabel'));
  $('#call112').setAttribute('aria-label', t('call112Label'));
  $('#call108').setAttribute('aria-label', t('call108Label'));
  $('#mainNav').setAttribute('aria-label', t('mainNavigation'));
  $('#tab-help').setAttribute('aria-label', t('tabHelp'));
  $('#mapSwitch').setAttribute('aria-label', t('mapProvider'));
  $('#nearGoogleMap').title = t('googleMapTitle');
  $('#nearList').setAttribute('aria-label', t('nearbyList'));
  $('#sosPanel').setAttribute('aria-label', t('sosStatus'));
  $('#countdown').setAttribute('aria-label', t('countdownLabel'));
  $('#placeQ').placeholder = t('placePH');
  $('#geminiDescription').placeholder = t('geminiPlaceholder');
  $('#operatorPeople').placeholder = t('operatorPeoplePH');
  $('#operatorEvent').placeholder = t('operatorEventPH');
  $('#waContactName').placeholder = t('waContactNamePH');
  $('#waContactPhone').placeholder = t('waContactPhonePH');
  $('#yourName').value = store.get('name', '');
  renderDemoBanner(); renderOfflineBanner(); renderLocationIntro(); renderHomeNearby(); renderChips(); renderCard(); renderNear(); renderContacts(); renderWhatsappContacts(); renderMinChips(); renderShare(); renderWalk(); renderOperator();
}
function renderDemoBanner() {
  const banner = $('#demoBanner');
  if (!banner) return;
  banner.hidden = !demoMode;
  banner.textContent = demoMode ? t('demoBanner') : '';
}
function renderOfflineBanner() {
  const banner = $('#offlineBanner');
  if (!banner) return;
  const offline = navigator.onLine === false;
  banner.hidden = !offline;
  banner.textContent = offline ? t('offlineBanner') : '';
}
window.addEventListener('online', renderOfflineBanner);
window.addEventListener('offline', () => {
  renderOfflineBanner();
  nearError = true;
  homeNearbyError = true;
  renderHomeNearby();
  renderNear();
});
$('#langBtn').onclick = () => { lang = lang === 'hi' ? 'en' : 'hi'; store.set('lang', lang); stopSpeak(); applyLang(); };
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
function showTab(n) {
  document.querySelectorAll('.tab').forEach(s => s.hidden = s.id !== 'tab-' + n);
  document.querySelectorAll('.tabs button').forEach(b => {
    const active = b.dataset.tab === n;
    b.classList.toggle('on', active);
    if (active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  const focusTarget = n === 'help' ? $('#sos') : n === 'near' ? $('#nearTitle') : $('#walkTitle');
  requestAnimationFrame(() => focusTarget?.focus({preventScroll: true}));
  if (n === 'near') {
    if (!nearbyLocationChecked) refreshNearbyLocation();
    else loadNearby();
    requestAnimationFrame(() => {
      nearbyMap?.invalidateSize();
      renderNearbyMap();
    });
  }
  if (n === 'walk') pollContacts();
}

/* ------------------------------------------------------------ location */
function renderLocationIntro() {
  $('#locationIntro').hidden = !!pos || locationPrompted;
  const status = $('#locationIntroStatus');
  status.hidden = !locationRequestStatus;
  status.textContent = locationRequestStatus ? t(locationRequestStatus) : '';
}

function renderNearbyLocationStatus(message) {
  const status = $('#nearLocationStatus');
  if (!status) return;
  if (message) {
    status.textContent = message;
    return;
  }
  if (!pos) {
    status.textContent = t(nearbyLocationError === 'insecure' ? 'nearLocationSecure'
      : nearbyLocationError === 'denied' ? 'nearLocationDenied'
      : nearbyLocationError ? 'nearLocationFailed' : 'nearLocationMissing');
    return;
  }
  const coordinates = {lat: pos.lat.toFixed(5), lon: pos.lon.toFixed(5)};
  status.textContent = nearbyLocationError
    ? `${t(nearbyLocationError === 'insecure' ? 'nearLocationSecure'
      : nearbyLocationError === 'denied' ? 'nearLocationDenied' : 'nearLocationFailed')} ${t('nearLocationSaved', coordinates)}`
    : pos.manual ? t('nearLocationManual', coordinates)
    : !nearbyLocationRefreshFailed && pos.updatedAt && Date.now() - pos.updatedAt < 120000
      ? t('nearLocationGps', {...coordinates, m: pos.acc ?? '?'})
      : t('nearLocationSaved', coordinates);
}

function locate() {
  return new Promise((res, rej) => {
    if (!window.isSecureContext) return rej(new Error('insecure-context'));
    if (!navigator.geolocation) return rej(new Error('no-geo'));
    navigator.geolocation.getCurrentPosition(p => {
      pos = {lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy), updatedAt: Date.now()};
      store.set('lastpos', pos); $('#locLine').textContent = t('locOk', {m: pos.acc});
      locationRequestStatus = '';
      locationPrompted = true; store.set('locationPrompted', true); renderLocationIntro();
      $('#manualLoc').hidden = true; nearbyLocationChecked = true; nearbyLocationRefreshFailed = false;
      renderNearbyLocationStatus(); renderNearbyMap(); startWatch(); loadHomeNearby(); res(pos);
    }, err => rej(err), {enableHighAccuracy: true, timeout: 20000, maximumAge: 0});
  });
}
function startWatch() {
  if (watchId !== null || !navigator.geolocation) return;
  watchId = navigator.geolocation.watchPosition(p => {
    pos = {lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy), updatedAt: Date.now()};
    store.set('lastpos', pos); nearbyLocationRefreshFailed = false;
    if (!$('#tab-near').hidden) {
      renderNearbyLocationStatus();
      renderNearbyMap();
      refreshNearbyDistances();
      if (!$('#tab-near').hidden && nearData?.data?.center &&
          Date.now() - nearData.at >= 60000 && hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) > 500) {
        loadNearby();
      }
    }
  }, error => {
    nearbyLocationError = error.code === 1 ? 'denied' : 'unavailable';
    nearbyLocationRefreshFailed = true;
    renderNearbyLocationStatus();
  }, {enableHighAccuracy: true, maximumAge: 0});
}
async function ensureLocation() {
  $('#locLine').textContent = t('locating');
  try { return await locate(); }
  catch {
    if (pos) { $('#locLine').textContent = t('locSaved'); return pos; }
    $('#locLine').textContent = t('locFail'); $('#manualLoc').hidden = false; return null;
  }
}
async function refreshNearbyLocation() {
  if (nearbyLocationLoading) return;
  const button = $('#nearUseLocation');
  const previous = pos;
  nearbyLocationLoading = true;
  button.disabled = true;
  renderNearbyLocationStatus(t('nearLocationUpdating'));
  try {
    await locate();
    nearbyLocationError = '';
    if (!previous || hav(previous.lat, previous.lon, pos.lat, pos.lon) > 500) {
      nearData = null;
      store.set('nearby', null);
    }
    renderNearbyLocationStatus();
    await loadNearby(true);
  } catch (error) {
    nearbyLocationError = error.message === 'insecure-context' ? 'insecure'
      : error.code === 1 ? 'denied' : 'unavailable';
    nearbyLocationChecked = true; nearbyLocationRefreshFailed = true;
    renderNearbyLocationStatus();
    if (pos) await loadNearby();
    else {
      nearLoading = false;
      renderNear();
    }
  } finally {
    nearbyLocationLoading = false;
    button.disabled = false;
  }
}
$('#nearUseLocation').onclick = refreshNearbyLocation;
$('#useLocation').onclick = async () => {
  const button = $('#useLocation');
  button.disabled = true;
  locationRequestStatus = 'locationRequesting';
  renderLocationIntro();
  try {
    await locate();
  } catch {
    locationRequestStatus = 'locationPermissionDenied';
    renderLocationIntro();
    $('#manualLoc').hidden = false;
  } finally {
    button.disabled = false;
  }
};
$('#skipLocation').onclick = () => {
  locationPrompted = true;
  store.set('locationPrompted', true);
  renderLocationIntro();
};

function renderOperator() {
  $('#operatorCard').hidden = !operator.open;
  if (!operator.open) return;
  const lines = [t('operatorHello')];
  if (operator.pos) {
    lines.push(t('operatorCoordinates', {
      lat: operator.pos.lat.toFixed(6), lon: operator.pos.lon.toFixed(6),
    }));
    lines.push(operator.pos.manual ? t('operatorMapPin')
      : operator.pos.updatedAt && Date.now() - operator.pos.updatedAt < 120000
        ? t('operatorGPS', {m: operator.pos.acc ?? '?'})
        : t('operatorSavedGPS', {m: operator.pos.acc ?? '?'}));
    if (operator.address) {
      lines.push(t('operatorLandmark', {address: operator.address}));
    } else if (operator.lookup === 'loading') {
      lines.push(t('operatorLoading'));
    } else if (operator.lookup !== 'idle') {
      lines.push(operator.lookup === 'offline' ? t('operatorOffline') : t('operatorUnavailable'));
    }
  } else {
    lines.push(t('operatorSearch'));
  }
  const count = $('#operatorPeople').value;
  const validCount = count !== '' && Number.isInteger(Number(count)) && Number(count) >= 0
    ? count : t('operatorNotCounted');
  const event = $('#operatorEvent').value.trim() || t('operatorNotSpecified');
  lines.push(t('operatorPeopleLine', {people: validCount}));
  lines.push(t('operatorEventLine', {event}));
  lines.push(t('operatorClosing'));
  $('#operatorScript').textContent = lines.join('\n\n');

  const status = operator.lookup === 'loading' ? t('operatorLoading')
    : operator.lookup === 'offline' ? t('operatorOffline')
      : operator.lookup === 'unavailable' ? t('operatorUnavailable')
        : !operator.pos ? t('operatorSearch')
          : operator.address ? t('operatorLandmark', {address: operator.address}) : '';
  $('#operatorLocation').textContent = status;
  $('#operatorLocation').hidden = !status;
  $('#operatorRetry').hidden = !operator.pos || operator.lookup === 'loading' || !!operator.address;
}

async function lookupOperatorAddress() {
  const requestId = ++operatorRequestId;
  if (navigator.onLine === false) {
    operator.lookup = 'offline';
    renderOperator();
    return;
  }
  operator.lookup = 'loading';
  renderOperator();
  try {
    const result = await api('/api/reverse', {lat: operator.pos.lat, lon: operator.pos.lon});
    if (requestId !== operatorRequestId) return;
    operator.address = (result.address || '').trim().slice(0, 180);
    operator.lookup = operator.address ? 'found' : 'unavailable';
  } catch {
    if (requestId !== operatorRequestId) return;
    operator.lookup = 'unavailable';
  }
  renderOperator();
}

$('#operatorBtn').onclick = async () => {
  if (operator.open && operator.pos) {
    if (operator.lookup === 'unavailable' || operator.lookup === 'offline') {
      await lookupOperatorAddress();
    }
    $('#operatorCard').scrollIntoView({behavior: 'smooth', block: 'start'});
    return;
  }
  operator.open = false;
  operator = {open: true, pos: null, address: '', lookup: 'loading'};
  if (!$('#operatorEvent').value.trim() && curCard) $('#operatorEvent').value = curCard.title[lang];
  renderOperator();
  if (!pos) await ensureLocation();
  if (!pos) {
    operator.lookup = 'unavailable';
    renderOperator();
    $('#operatorCard').scrollIntoView({behavior: 'smooth', block: 'start'});
    return;
  }
  operator.pos = {...pos};
  $('#operatorCard').scrollIntoView({behavior: 'smooth', block: 'start'});
  await lookupOperatorAddress();
};
$('#operatorPeople').oninput = renderOperator;
$('#operatorEvent').oninput = renderOperator;
$('#operatorRetry').onclick = lookupOperatorAddress;
$('#operatorRead').onclick = () => {
  if (!window.speechSynthesis) {
    $('#operatorVoiceNote').textContent = t('operatorVoiceUnavailable');
    $('#operatorVoiceNote').hidden = false;
    return;
  }
  const voice = pickVoice();
  $('#operatorVoiceNote').textContent = lang === 'hi' && !voice ? t('operatorNoHindiVoice') : '';
  $('#operatorVoiceNote').hidden = !(lang === 'hi' && !voice);
  speechSynthesis.cancel();
  $('#stopBtn').hidden = true;
  const utterance = new SpeechSynthesisUtterance($('#operatorScript').textContent);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.onend = () => { $('#operatorStop').hidden = true; };
  speechSynthesis.speak(utterance);
  $('#operatorStop').hidden = false;
};
$('#operatorStop').onclick = stopSpeak;

$('#geminiDescription').addEventListener('input', () => {
  const status = $('#geminiResult');
  status.hidden = true;
  status.textContent = '';
  $('#geminiAnswer').hidden = true;
  $('#geminiAnswerText').textContent = '';
});
let geminiVoiceRequest = false;
// Use Gemini Live's input transcription instead of the browser's remote speech service.
let liveStartMode = 'conversation';
let liveActiveMode = 'conversation';
let liveTranscript = '';
let liveTranscriptTimer = null;
function finishSpokenInput() {
  clearTimeout(liveTranscriptTimer);
  liveTranscriptTimer = null;
  const spoken = liveTranscript.trim();
  stopLive();
  liveActiveMode = 'conversation';
  if (spoken) { $('#geminiResult').hidden = false; $('#geminiResult').textContent = t('voiceProcessing'); submitSpokenQuestion(spoken); }
  else { $('#geminiResult').hidden = false; $('#geminiResult').textContent = t('voiceNoSpeech'); }
}
function submitSpokenQuestion(spoken) {
  const normalized = spoken.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  const asksToCall = /\b(call|dial)\s*112\b/.test(normalized) || /\b112\s*(pe|par)\s*(call|phone)\b/.test(normalized)
    || /112\s*पर\s*(कॉल|फोन)/u.test(spoken);
  const asksToAlert = /\b(alert|message|notify)\s+(my\s+)?(contacts|safety contacts)\b/.test(normalized)
    || /\bcontacts\s+ko\b.*\b(alert|message)\b/.test(normalized)
    || /मेरे\s*संपर्कों\s*को.*(अलर्ट|संदेश)/u.test(spoken);
  if (asksToCall) {
    if (window.confirm(t('voiceCallConfirm'))) window.location.href = 'tel:112';
    return;
  }
  if (asksToAlert) {
    if (window.confirm(t('voiceAlertConfirm'))) $('#sos').click();
    return;
  }
  $('#geminiDescription').value = spoken.slice(0, 500);
  $('#geminiDescription').dispatchEvent(new Event('input', {bubbles: true}));
  geminiVoiceRequest = true;
  $('#geminiRun').click();
}
$('#geminiVoice').onclick = () => {
  liveStartMode = 'transcribe';
  liveTranscript = '';
  $('#liveStart').click();
};
$('#geminiRun').onclick = async () => {
  const description = $('#geminiDescription').value.trim();
  const status = $('#geminiResult');
  const button = $('#geminiRun');
  const answerBox = $('#geminiAnswer');
  answerBox.hidden = true;
  status.hidden = false;
  if (description.length < 3) {
    status.textContent = t('geminiShortInput');
    return;
  }
  button.disabled = true;
  $('#geminiDescription').disabled = true;
  status.setAttribute('aria-busy', 'true');
  status.textContent = t('geminiWorking');
  try {
    const result = await api('/api/gemini/route', {description, language: lang});
    $('#geminiAnswerText').textContent = result.answer;
    answerBox.hidden = false;
    if (geminiVoiceRequest) speak([result.answer]);
    geminiVoiceRequest = false;
    const match = cards.find(card => card.id === result.card_id);
    if (!match || result.card_id === 'unsure') {
      $('#geminiAnswerTitle').textContent = t('geminiAnswerTitleGeneral');
      status.textContent = t('geminiUnsure');
      return;
    }
    $('#geminiAnswerTitle').textContent = t('geminiAnswerTitleCard');
    status.textContent = t('geminiMatch', {title: match.title[lang]});
    openCard(match.id, true);
  } catch (error) {
    const message = error.message.toLowerCase();
    status.textContent = /not configured/.test(message) ? t('geminiNotConfigured')
      : /api key|key was rejected/.test(message) ? t('geminiKeyInvalid')
      : /model.*unavailable/.test(message) ? t('geminiModelUnavailable')
      : /rejected the request/.test(message) ? t('geminiRequestRejected')
      : /busy/.test(message) ? t('geminiBusy')
      : /timed out/.test(message) ? t('geminiTimedOut')
      : /cannot connect to google/.test(message) ? t('geminiConnectionError')
      : /provider returned http/.test(message) ? t('geminiProviderError')
      : /did not return a usable answer|safety checks|incomplete/.test(message) ? t('geminiMalformed')
      : t('geminiUnavailable');
    answerBox.hidden = true;
    geminiVoiceRequest = false;
  } finally {
    button.disabled = false;
    $('#geminiDescription').disabled = false;
    status.removeAttribute('aria-busy');
  }
};

$('#placeGo').onclick = async () => {
  const q = $('#placeQ').value.trim(); if (q.length < 3) return;
  $('#placeRes').textContent = '…';
  try {
    const r = await api('/api/geocode', {q});
    $('#placeRes').innerHTML = r.results.map((x, i) => `<button class="btn ghost wide" data-i2="${i}">${esc(x.name.slice(0, 90))}</button>`).join('') || '—';
    $('#placeRes').querySelectorAll('button').forEach(b => b.onclick = () => {
      const x = r.results[+b.dataset.i2]; pos = {lat: x.lat, lon: x.lon, manual: true, updatedAt: Date.now()};
      nearbyLocationChecked = true;
      locationRequestStatus = '';
      store.set('lastpos', pos); locationPrompted = true; store.set('locationPrompted', true);
      renderLocationIntro(); renderNearbyLocationStatus(); $('#manualLoc').hidden = true;
      $('#locLine').textContent = x.name.slice(0, 60); loadHomeNearby(true);
    });
  } catch (e) { $('#placeRes').textContent = e.message; }
};

/* ------------------------------------------------------------ nearby places */
async function loadNearby(force) {
  if (!pos) {
    nearLoading = true; nearError = false; renderNear();
    await ensureLocation();
    nearLoading = false;
  }
  if (!pos) return renderNear();
  if (navigator.onLine === false) { nearError = true; nearLoading = false; return renderNear(); }
  if (homeNearbyPromise || nearRestPromise) {
    nearLoading = true;
    renderNear();
    if (homeNearbyPromise) await homeNearbyPromise;
    if (nearRestPromise) await nearRestPromise;
    nearLoading = false;
  }
  if (nearRestPromise) await nearRestPromise;
  const hasAllNearbyTypes = nearData?.data?.fullNearbyFetched && nearData?.data?.results &&
    ['hospital', 'clinic', 'pharmacy', 'police'].every(type => Array.isArray(nearData.data.results[type]));
  if (!force && hasAllNearbyTypes && Date.now() - nearData.at < 120000 &&
      hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) < 500) return renderNear();
  if (nearLoadPromise) return nearLoadPromise;
  nearLoading = true; nearError = false; renderNear();
  nearLoadPromise = (async () => {
    try {
      const sameArea = nearData?.data?.center &&
        hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) < 500;
      const otherTypesCached = !force && sameArea && Date.now() - nearData.at < 120000 &&
        ['clinic', 'pharmacy', 'police'].every(type => Array.isArray(nearData.data.results?.[type]));
      const query = {lat: pos.lat, lon: pos.lon};
      if (otherTypesCached) query.types = 'hospital';
      const data = await api('/api/nearby', query);
      saveNearby(data, true);
      nearError = !!data.stale;
    } catch {
      nearError = true;
    } finally {
      nearLoading = false; nearLoadPromise = null; renderNear();
    }
  })();
  return nearLoadPromise;
}
function saveNearby(data, fullNearby = false) {
  const previous = nearData;
  const sameArea = previous?.data?.center &&
    hav(pos.lat, pos.lon, previous.data.center.lat, previous.data.center.lon) < 500;
  const fetchedAt = data.fetched_at ? data.fetched_at * 1000 : Date.now();
  const oldFetchedAt = previous ? previous.at : fetchedAt;
  const ageAnchor = sameArea ? Math.min(oldFetchedAt, fetchedAt) : fetchedAt;
  const results = sameArea ? {...previous.data.results, ...data.results} : {...data.results};
  const merged = {...(sameArea ? previous.data : {}), ...data, results, fetched_at: ageAnchor / 1000};
  merged.fullNearbyFetched = fullNearby || (sameArea && previous.data.fullNearbyFetched === true);
  nearData = {at: ageAnchor, data: merged};
  store.set('nearby', nearData);
  renderHomeNearby();
}
function renderHomeNearby() {
  const section = $('#homeNearby');
  if (!section) return;
  section.hidden = !pos;
  const status = $('#homeNearbyStatus');
  const listEl = $('#homeNearbyList');
  const actions = $('#homeNearbyActions');
  if (!pos) return;
  const sameArea = nearData?.data?.center &&
    hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) < 500;
  const hospitals = sameArea ? placesFor('hospital') : [];
  if (sameArea) homeNearbySearched = true;
  if (homeNearbyLoading && !hospitals.length) {
    status.textContent = t('homeNearbyLoading');
    listEl.innerHTML = '<div class="skeleton" aria-hidden="true"></div>';
  } else if (hospitals.length) {
    const mins = Math.max(0, Math.floor((Date.now() - nearData.at) / 60000));
    const age = mins < 1 ? t('nearFresh') : t('savedList', {m: mins});
    status.textContent = `${homeNearbyError ? `${t('homeNearbyError')} ` : ''}${age} ${t('osmWarn')}`;
    listEl.innerHTML = hospitals.slice(0, 3).map(placeHTML).join('');
  } else {
    status.textContent = homeNearbyError ? t('homeNearbyError')
      : homeNearbySearched ? t('homeNearbyEmpty') : t('homeNearbyPrompt');
    listEl.innerHTML = '';
  }
  const call112 = !hospitals.length
    ? `<a class="btn danger wide" href="tel:112" aria-label="${t('call112Label')}">📞 112</a>` : '';
  actions.innerHTML = `${call112}<button id="homeNearbyRetry" class="btn ghost wide">${t('homeNearbyRetry')}</button><button id="homeNearbyAll" class="btn ghost wide">${t('homeNearbyAll')}</button>`;
  if (homeNearbyError || (homeNearbySearched && !hospitals.length)) {
    appendGoogleHospitalSearch(actions);
    appendOsmMap(actions);
  }
  $('#homeNearbyRetry').disabled = homeNearbyLoading;
  $('#homeNearbyRetry').onclick = () => loadHomeNearby(true);
  $('#homeNearbyAll').onclick = () => showTab('near');
}
async function loadHomeNearby(force = false) {
  if (!pos) return false;
  const sameArea = nearData?.data?.center &&
    hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) < 500;
  if (!force && sameArea && Date.now() - nearData.at < 120000) {
    homeNearbySearched = true;
    renderHomeNearby();
    const hasAllNearbyTypes = nearData.data.results && ['hospital', 'clinic', 'pharmacy', 'police']
      .every(type => Array.isArray(nearData.data.results[type]));
    if (!hasAllNearbyTypes) loadNearbyRest();
    return true;
  }
  if (homeNearbyPromise) return homeNearbyPromise;
  homeNearbyLoading = true;
  homeNearbyError = false;
  renderHomeNearby();
  const request = (async () => {
    const ok = await loadNearbyFast();
    homeNearbySearched = true;
    homeNearbyError = !ok;
    homeNearbyLoading = false;
    renderHomeNearby();
    loadNearbyRest();
    return ok;
  })();
  homeNearbyPromise = request;
  try { return await request; }
  finally { if (homeNearbyPromise === request) homeNearbyPromise = null; }
}
async function loadNearbyFast() {
  if (!pos || navigator.onLine === false) return false;
  try {
    const data = await api('/api/nearby/fast', {lat: pos.lat, lon: pos.lon});
    saveNearby(data);
    renderNear();
    return !data.stale;
  } catch {
    return false;
  }
}
async function loadNearbyRest() {
  if (nearRestPromise) return nearRestPromise;
  if (!pos) return;
  const request = (async () => {
    if (navigator.onLine === false) { nearError = true; nearLoading = false; renderNear(); return; }
    nearLoading = true;
    renderNear();
    try {
      const data = await api('/api/nearby', {lat: pos.lat, lon: pos.lon, types: 'hospital,clinic,pharmacy,police'});
      saveNearby(data);
      nearError = !!data.stale;
      homeNearbyError = nearError;
      homeNearbySearched = true;
      renderHomeNearby();
    } catch {
      nearError = true;
      homeNearbyError = true;
      renderHomeNearby();
    } finally {
      nearLoading = false;
      renderNear();
      if (!$('#sosPanel').hidden) {
        sosState.hospitalLoading = false;
        sosState.hospitalError = nearError;
        renderSosPanel();
      }
    }
  })();
  nearRestPromise = request;
  try { await request; }
  finally { if (nearRestPromise === request) nearRestPromise = null; }
}
function placesFor(type) {
  if (!nearData) return [];
  const types = type === 'essential' ? ['hospital', 'pharmacy'] : [type];
  const list = types.flatMap(kind => nearData.data.results[kind] || []).map(p => ({...p}));
  if (pos) list.forEach(p => p.distance_m = Math.round(hav(pos.lat, pos.lon, p.lat, p.lon)));
  return list.sort((a, b) => {
    if (type === 'hospital' && ['chest', 'stroke', 'accident', 'snake', 'burn'].includes(curCard?.id)) {
      const emergencyRank = Number(!!b.emergency) - Number(!!a.emergency);
      if (emergencyRank) return emergencyRank;
    }
    return a.distance_m - b.distance_m;
  });
}
function refreshNearbyDistances() {
  if (!nearData || $('#tab-near').hidden) return;
  const list = placesFor(nearType);
  const listEl = $('#nearList');
  listEl.innerHTML = list.length ? list.map(placeHTML).join('')
    : `<p class="note">${t(nearError ? 'nearErrorNoSavedType' : 'noResults')}</p>`;
  if (!list.length) appendCall112(listEl);
}
function placeHTML(p) {
  const name = p.name || t('unnamed');
  const type = nearType === 'essential' ? `<span class="badge">${t(p.type)}</span>` : '';
  return `<div class="place"><div class="nm">${esc(name)}${type}${p.emergency ? `<span class="badge">${t('emerg')}</span>` : ''}</div>
    <div class="meta"><span class="dist">${fmtDist(p.distance_m)}</span> ${t('away')}${p.address ? ' · ' + esc(p.address) : ''}${p.hours ? ' · ' + esc(p.hours) : ''}</div>
    <div class="acts">${p.phone ? `<a class="btn call" href="tel:${esc(p.phone)}">${t('call')}</a>` : ''}
    <a class="btn dir" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving">${t('dir')}</a>
    ${p.type === 'hospital' ? `<button type="button" class="btn ghost" data-check-hospital="${esc(name)}">${t('hospitalCheck')}</button>` : ''}</div></div>`;
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-check-hospital]');
  if (!button) return;
  $('#hospitalName').value = button.dataset.checkHospital;
  const details = $('#geminiTitle').closest('details'); details.open = true;
  $('#hospitalCheck').scrollIntoView({behavior: 'smooth', block: 'center'});
  $('#hospitalCheck').click();
});
function renderNear() {
  $('#typeTabs').innerHTML = ['essential', 'hospital', 'pharmacy', 'clinic', 'police'].map(k =>
    `<button class="chip ${k === nearType ? 'on' : ''}" data-k="${k}" aria-pressed="${k === nearType}">${t(k === 'essential' ? 'nearEssentials' : k)}</button>`).join('');
  $('#typeTabs').querySelectorAll('button').forEach(b => b.onclick = () => { nearType = b.dataset.k; renderNear(); });
  const meta = $('#nearMeta');
  const listEl = $('#nearList');
  renderNearbyMap();
  meta.textContent = '';
  if (!nearData) {
    if (nearLoading) {
      meta.textContent = t('nearLoading');
      listEl.innerHTML = '<div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div>';
      return;
    }
    meta.textContent = pos ? t(nearError ? 'nearError' : 'loadFail') : t('locFail');
    if (nearError || !pos) appendCall112(meta);
    if (nearError && pos) appendOsmMap(meta);
    listEl.innerHTML = '';
    return;
  }
  const mins = Math.max(0, Math.floor((Date.now() - nearData.at) / 60000));
  const age = mins < 1 ? t('nearFresh') : t('savedList', {m: mins});
  meta.textContent = `${nearError ? t('nearOffline', {m: mins}) : age} ${t('osmWarn')}`;
  if (nearError) {
    appendCall112(meta);
    appendOsmMap(meta);
  }
  const list = placesFor(nearType);
  let emergencyNote = '';
  if (nearType === 'hospital' && curCard && ['chest', 'stroke', 'accident', 'snake', 'burn'].includes(curCard.id)) {
    emergencyNote = `<p class="note">${curCard.id === 'snake' ? t('snakebiteHospitalNote') : t('emergencyRankNote')}</p>`;
  }
  listEl.innerHTML = emergencyNote + (list.length ? list.map(placeHTML).join('')
    : `<p class="note">${t(nearError ? 'nearErrorNoSavedType' : 'noResults')}</p>`);
  if (!list.length) appendCall112(listEl);
  if (nearLoading) meta.append(` ${t('nearLoading')}`);
}
function nearbyPopup(place) {
  const content = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = place.name || t('unnamed');
  content.append(name, document.createElement('br'));
  const kind = document.createElement('span');
  kind.textContent = t(place.type);
  content.append(kind);
  if (place.distance_m != null) {
    const distance = document.createElement('span');
    distance.textContent = ` · ${fmtDist(place.distance_m)} ${t('away')}`;
    content.append(distance);
  }
  content.append(document.createElement('br'));
  const directions = document.createElement('a');
  directions.href = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=driving`;
  directions.target = '_blank';
  directions.rel = 'noopener';
  directions.textContent = t('dir');
  content.append(directions);
  return content;
}
function renderNearbyMap() {
  const status = $('#nearMapStatus');
  if (!nearbyMapControlsBound) {
    $('#nearMapGoogleBtn').onclick = () => setNearbyMapProvider('google');
    $('#nearMapOsmBtn').onclick = () => setNearbyMapProvider('osm');
    nearbyMapControlsBound = true;
  }
  const googleSelected = nearbyMapProvider === 'google';
  $('#nearGoogleMap').hidden = !googleSelected;
  $('#nearMap').hidden = googleSelected;
  $('#nearMapGoogleBtn').classList.toggle('on', googleSelected);
  $('#nearMapOsmBtn').classList.toggle('on', !googleSelected);
  $('#nearMapLegend').hidden = googleSelected;
  $('#nearMapCenter').hidden = googleSelected;
  if (googleSelected) {
    updateNearbyGoogleMap();
    status.textContent = pos ? t('nearMapGoogleStatus') : t('nearMapNeedLocation');
    return;
  }
  if (!window.L) {
    status.textContent = t('nearMapUnavailable');
    return;
  }
  if (!nearbyMap) {
    nearbyMap = L.map('nearMap', {scrollWheelZoom: false}).setView(
      pos ? [pos.lat, pos.lon] : [20.5937, 78.9629], pos ? 13 : 5
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(nearbyMap);
    nearbyMapPlaces = L.layerGroup().addTo(nearbyMap);
    nearbyMap.on('dragstart', () => { nearbyMapFollow = false; });
    $('#nearMapCenter').onclick = () => {
      nearbyMapFollow = true;
      if (pos) nearbyMap.setView([pos.lat, pos.lon], Math.max(nearbyMap.getZoom(), 13));
    };
  }
  $('#nearMap').setAttribute('aria-label', t('nearMapAria'));
  $('#nearMapLegend').setAttribute('aria-label', t('nearMapLegend'));
  if (!$('#tab-near').hidden) nearbyMap.invalidateSize();
  const positionMoved = pos && (!nearbyMapLastPosition ||
    hav(pos.lat, pos.lon, nearbyMapLastPosition.lat, nearbyMapLastPosition.lon) > 20);
  if (pos) {
    if (!nearbyMapLocation) {
      nearbyMapLocation = L.circleMarker([pos.lat, pos.lon], {
        radius: 10, color: '#fff', weight: 3, fillColor: '#111827', fillOpacity: 1
      }).bindPopup(t('nearMapYou')).addTo(nearbyMap);
      if (nearbyMapFollow) nearbyMap.setView([pos.lat, pos.lon], 13);
    } else {
      nearbyMapLocation.setLatLng([pos.lat, pos.lon]);
      if (nearbyMapFollow && positionMoved) nearbyMap.panTo([pos.lat, pos.lon]);
    }
    if (positionMoved) nearbyMapLastPosition = {lat: pos.lat, lon: pos.lon};
  }
  nearbyMapPlaces.clearLayers();
  const types = ['hospital', 'clinic', 'pharmacy', 'police'];
  const colors = {hospital: '#c8102e', clinic: '#1a5fb4', pharmacy: '#147d47', police: '#7a3e9d'};
  const places = types.flatMap(type => (nearData?.data?.results?.[type] || []).map(place => ({
    ...place, type, distance_m: pos ? Math.round(hav(pos.lat, pos.lon, place.lat, place.lon)) : place.distance_m
  })));
  for (const place of places) {
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) continue;
    L.circleMarker([place.lat, place.lon], {
      radius: 8, color: '#fff', weight: 2, fillColor: colors[place.type], fillOpacity: 1
    }).bindPopup(nearbyPopup(place)).addTo(nearbyMapPlaces);
  }
  const dataKey = nearData?.data?.results || null;
  if (nearbyMapFollow && dataKey && dataKey !== nearbyMapDataKey) {
    const points = places.filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lon))
      .map(place => [place.lat, place.lon]);
    if (pos) points.push([pos.lat, pos.lon]);
    if (points.length > 1) nearbyMap.fitBounds(L.latLngBounds(points), {padding: [24, 24], maxZoom: 14});
    else if (pos) nearbyMap.setView([pos.lat, pos.lon], 13);
    nearbyMapDataKey = dataKey;
  }
  status.textContent = !pos ? t('nearMapNeedLocation')
    : !nearData ? t(nearLoading ? 'nearMapLoading' : 'nearMapNeedLocation')
      : places.length ? t('nearMapPlaces', {n: places.length})
        : t(nearLoading ? 'nearMapLoading' : 'nearMapNoPlaces');
}
function setNearbyMapProvider(provider) {
  nearbyMapProvider = provider;
  renderNearbyMap();
  if (provider === 'osm') requestAnimationFrame(() => nearbyMap?.invalidateSize());
}
function updateNearbyGoogleMap() {
  const frame = $('#nearGoogleMap');
  if (!pos) return;
  const moved = !nearbyGoogleMapPosition ||
    hav(pos.lat, pos.lon, nearbyGoogleMapPosition.lat, nearbyGoogleMapPosition.lon) >= 30;
  if (moved || frame.dataset.language !== lang) {
    const coordinates = `${pos.lat.toFixed(6)},${pos.lon.toFixed(6)}`;
    const embed = new URL('https://maps.google.com/maps');
    embed.searchParams.set('q', `loc:${coordinates}`);
    embed.searchParams.set('z', '16');
    embed.searchParams.set('output', 'embed');
    embed.searchParams.set('region', 'in');
    embed.searchParams.set('hl', lang);
    frame.src = embed.toString();
    nearbyGoogleMapPosition = {lat: pos.lat, lon: pos.lon};
    frame.dataset.language = lang;
  }
  const searchType = nearType === 'essential' ? 'hospitals and pharmacies' : t(nearType);
  const query = `${searchType} near ${pos.lat.toFixed(5)},${pos.lon.toFixed(5)}, India`;
  const search = new URL('https://www.google.com/maps/search/');
  search.searchParams.set('api', '1');
  search.searchParams.set('query', query);
  search.searchParams.set('hl', lang);
  search.searchParams.set('gl', 'in');
  $('#nearMapGoogleOpen').href = search.toString();
}
function appendCall112(parent) {
  const link = document.createElement('a');
  link.href = 'tel:112';
  link.className = 'call-inline';
  link.setAttribute('aria-label', t('call112Label'));
  link.innerHTML = '<span aria-hidden="true">📞</span> 112';
  parent.append(link);
}
function appendOsmMap(parent) {
  const lat = Number(pos?.lat), lon = Number(pos?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) return;
  const link = document.createElement('a');
  link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.className = 'osm-map-link';
  link.textContent = t('osmMapFallback');
  parent.append(link);
}
function appendGoogleHospitalSearch(parent) {
  const lat = Number(pos?.lat), lon = Number(pos?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) return;
  const search = new URL('https://www.google.com/maps/search/');
  search.searchParams.set('api', '1');
  search.searchParams.set('query', `hospitals near ${lat.toFixed(5)},${lon.toFixed(5)}, India`);
  search.searchParams.set('hl', lang);
  search.searchParams.set('gl', 'in');
  const link = document.createElement('a');
  link.href = search.toString();
  link.target = '_blank';
  link.rel = 'noopener';
  link.className = 'osm-map-link';
  link.textContent = t('homeNearbyGoogle');
  parent.append(link);
}
$('#nearRefresh').onclick = () => loadNearby(true);

/* ------------------------------------------------------------ first aid cards + voice */
async function loadCards() {
  try { cards = (await (await fetch('/firstaid.json')).json()).cards; } catch { cards = []; }
  renderChips();
}
function renderChips() {
  $('#chips').innerHTML = cards.map(c =>
    `<button class="chip ${curCard && curCard.id === c.id ? 'on' : ''}" data-id="${c.id}" aria-pressed="${!!curCard && curCard.id === c.id}"><i aria-hidden="true">${c.icon}</i>${esc(c.title[lang])}</button>`).join('');
  $('#chips').querySelectorAll('button').forEach(b => b.onclick = () => openCard(b.dataset.id, true));
}
function openCard(id, scroll) {
  curCard = cards.find(c => c.id === id) || null; stopSpeak(); renderChips(); renderCard();
  if (curCard && scroll) $('#card').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderCard() {
  $('#card').hidden = !curCard;
  renderIncidentShare();
  if (!curCard) return;
  $('#cardTitle').textContent = `${curCard.icon} ${curCard.title[lang]}`;
  $('#stepsList').innerHTML = curCard.steps[lang].map(s => `<li>${esc(s)}</li>`).join('');
  $('#dontsList').innerHTML = curCard.donts[lang].map(s => `<li>${esc(s)}</li>`).join('');
}
function whatsappContactButtons(attribute) {
  return waContacts.map((c, i) =>
    `<button class="btn wa wide" ${attribute}="${i}">${esc(t('waContactSend', {name: c.label}))}</button>`).join('');
}
function bindWhatsAppButtons(root, attribute) {
  root.querySelectorAll(`[${attribute}]`).forEach(button => {
    button.onclick = () => shareEmergencyWithContact(Number(button.getAttribute(attribute)), button);
  });
}
function renderIncidentShare() {
  const section = $('#incidentShare');
  section.hidden = !curCard;
  const buttons = $('#incidentShareButtons');
  if (!curCard) { buttons.replaceChildren(); return; }
  if (waContacts.length) {
    buttons.innerHTML = whatsappContactButtons('data-incident-wa');
    bindWhatsAppButtons(buttons, 'data-incident-wa');
  } else {
    buttons.innerHTML = `<p class="note">${t('incidentShareNoContacts')}</p><button id="incidentAddWa" class="btn ghost wide">${t('waAddContact')}</button>`;
    $('#incidentAddWa').onclick = () => {
      showTab('walk');
      $('#whatsappContactsBox').scrollIntoView({behavior: 'smooth', block: 'start'});
      $('#waContactName').focus();
    };
  }
}
let voices = [];
const loadVoices = () => { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; };
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice() {
  const norm = v => v.lang.replace('_', '-').toLowerCase();
  if (lang === 'hi') return voices.find(v => norm(v).startsWith('hi'));
  return voices.find(v => norm(v) === 'en-in') || voices.find(v => norm(v).startsWith('en'));
}
function speak(lines) {
  if (!window.speechSynthesis) return;
  stopSpeak(); const v = pickVoice();
  $('#voiceNote').hidden = !(lang === 'hi' && !v); $('#voiceNote').textContent = t('noVoice');
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; if (v) u.voice = v; u.rate = 0.92;
    if (i === lines.length - 1) u.onend = () => { $('#stopBtn').hidden = true; };
    speechSynthesis.speak(u);
  });
  $('#stopBtn').hidden = false;
}
function stopSpeak() {
  if (window.speechSynthesis) speechSynthesis.cancel();
  $('#stopBtn').hidden = true;
  $('#operatorStop').hidden = true;
}
$('#voiceBtn').onclick = () => {
  if (!curCard) return;
  const n = lang === 'hi' ? 'चरण' : 'Step';
  speak([curCard.title[lang], ...curCard.steps[lang].map((s, i) => `${n} ${i + 1}. ${s}`), t('dontsH'), ...curCard.donts[lang]]);
};
$('#stopBtn').onclick = stopSpeak;

/* Gemini Live voice, medicine label reading, and grounded opening lookup */
let liveSocket = null, liveStream = null, liveContext = null, liveProcessor = null, liveSource = null, liveNextAudioTime = 0, liveSetupTimer = null;
function pcmBase64(float32, sourceRate) {
  const step = sourceRate / 16000, count = Math.floor(float32.length / step), pcm = new Int16Array(count);
  for (let i = 0; i < count; i++) { const sample = float32[Math.floor(i * step)] || 0; pcm[i] = Math.max(-1, Math.min(1, sample)) * 32767; }
  const bytes = new Uint8Array(pcm.buffer); let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
function stopLive() {
  clearTimeout(liveSetupTimer); liveSetupTimer = null;
  if (liveProcessor) liveProcessor.disconnect(); if (liveSource) liveSource.disconnect();
  if (liveStream) liveStream.getTracks().forEach(track => track.stop());
  if (liveSocket && liveSocket.readyState < 2) liveSocket.close();
  if (liveContext) liveContext.close();
  liveProcessor = liveSource = liveStream = liveSocket = liveContext = null;
  $('#liveStart').hidden = false; $('#liveStop').hidden = true;
}
$('#liveStop').onclick = () => liveActiveMode === 'transcribe' ? finishSpokenInput() : stopLive();
$('#liveStart').onclick = async () => {
  $('#liveStatus').textContent = t('liveStarting'); $('#liveStart').disabled = true;
  liveActiveMode = liveStartMode;
  liveStartMode = 'conversation';
  try {
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (!window.isSecureContext && !localHost) { $('#liveStatus').textContent = t('liveHttpsRequired'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.WebSocket) throw new Error('unsupported');
    // Resume audio synchronously from the user gesture, before network or permission awaits.
    liveContext = new AudioContext();
    const audioResume = liveContext.resume();
    const liveDevice = await ensureDeviceToken();
    $('#liveStatus').textContent = t('liveMicPermission');
    liveStream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}});
    liveSource = liveContext.createMediaStreamSource(liveStream);
    await audioResume;
    liveProcessor = liveContext.createScriptProcessor(4096, 1, 1);
    liveProcessor.onaudioprocess = event => {
      if (liveSocket?.readyState === WebSocket.OPEN) liveSocket.send(JSON.stringify({realtimeInput: {audio: {mimeType: 'audio/pcm;rate=16000', data: pcmBase64(event.inputBuffer.getChannelData(0), liveContext.sampleRate)}}}));
    };
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    liveSocket = new WebSocket(`${wsProtocol}//${location.host}/api/gemini/live`);
    $('#liveStatus').textContent = t('liveConnecting');
    liveSetupTimer = setTimeout(() => { if (liveSocket && $('#liveStop').hidden) { $('#liveStatus').textContent = t('liveSetupTimeout'); stopLive(); } }, 15000);
    liveSocket.onopen = () => liveSocket.send(JSON.stringify({start: {device_token: liveDevice, language: lang, mode: liveActiveMode}}));
    liveSocket.onmessage = async event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.setupComplete) { clearTimeout(liveSetupTimer); liveSetupTimer = null; liveSource.connect(liveProcessor); liveProcessor.connect(liveContext.destination); $('#liveStatus').textContent = t('liveListening'); $('#liveStart').hidden = true; $('#liveStop').hidden = false; return; }
        if (msg.error) { $('#liveStatus').textContent = msg.error.message || t('liveUnavailable'); stopLive(); return; }
        const content = msg.serverContent || {};
        if (liveActiveMode === 'transcribe') {
          const inputText = content.inputTranscription?.text?.trim();
          if (inputText) {
            liveTranscript = !liveTranscript || inputText.startsWith(liveTranscript) ? inputText
              : liveTranscript.endsWith(inputText) ? liveTranscript : `${liveTranscript} ${inputText}`;
            $('#liveStatus').textContent = liveTranscript.slice(-250);
            // The dedicated Live Transcribe model finalizes transcript segments but
            // does not send the conversational model's turnComplete event.
            clearTimeout(liveTranscriptTimer);
            liveTranscriptTimer = setTimeout(finishSpokenInput, 1800);
          }
          if (content.turnComplete && liveTranscript.trim()) finishSpokenInput();
          return;
        }
        const transcript = content.inputTranscription?.text || content.outputTranscription?.text;
        if (transcript) $('#liveStatus').textContent = transcript.slice(-250);
        for (const part of content.modelTurn?.parts || []) if (part.inlineData?.data) {
          const raw = atob(part.inlineData.data), pcm = new Int16Array(raw.length / 2);
          for (let i = 0; i < pcm.length; i++) pcm[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
          const buffer = liveContext.createBuffer(1, pcm.length, 24000), channel = buffer.getChannelData(0);
          for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
          const output = liveContext.createBufferSource(); output.buffer = buffer; output.connect(liveContext.destination);
          liveNextAudioTime = Math.max(liveNextAudioTime, liveContext.currentTime); output.start(liveNextAudioTime); liveNextAudioTime += buffer.duration;
        }
        if (/\bstop\b|बंद करो|रोकें/.test(transcript || '')) stopLive();
      } catch { $('#liveStatus').textContent = t('livePlaybackError'); }
    };
    liveSocket.onerror = () => { $('#liveStatus').textContent = t('liveSocketError'); stopLive(); };
    liveSocket.onclose = () => { if (liveStream) { stopLive(); $('#liveStatus').textContent = t('liveSocketClosed'); } };
  } catch (error) {
    stopLive();
    $('#liveStatus').textContent = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' ? t('micDenied')
      : error?.name === 'NotFoundError' ? t('liveNoMicrophone')
      : error?.message === 'unsupported' ? t('liveUnsupported')
      : error?.message?.startsWith('Gemini') ? error.message : t('liveUnavailable');
  }
  finally { $('#liveStart').disabled = false; }
};

async function compressMedicinePhoto(file) {
  let image, objectUrl;
  if (window.createImageBitmap) image = await createImageBitmap(file);
  else {
    objectUrl = URL.createObjectURL(file);
    image = await new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = objectUrl;
    });
  }
  try {
    const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) throw new Error('encode');
    if (blob.size > 5 * 1024 * 1024) throw new Error('too-large');
    return blob;
  } finally {
    image.close?.();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

$('#medicineRead').onclick = async () => {
  const file = $('#medicinePhoto').files?.[0], status = $('#medicineStatus');
  if (!file) { status.hidden = false; status.textContent = t('medicinePhotoLabel'); return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) { status.hidden = false; status.textContent = t('medicinePhotoError'); return; }
  status.hidden = false; status.textContent = t('medicineWorking'); $('#medicineRead').disabled = true;
  try {
    const photo = await compressMedicinePhoto(file);
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(photo); });
    const result = await api('/api/gemini/medicine', {image_base64: data, mime_type: 'image/jpeg', language: lang});
    $('#medicineAnswerText').textContent = `${result.answer}\n\n${t('medicineSafety')}`;
    $('#medicineAnswer').hidden = false; status.textContent = ''; speak([result.answer, t('medicineSafety')]);
  } catch (e) { status.textContent = e.message === 'too-large' ? t('medicineCompressError') : e.message === 'canvas' || e.message === 'encode' ? t('medicinePhotoError') : e.message; $('#medicineAnswer').hidden = true; }
  finally { $('#medicineRead').disabled = false; }
};
$('#medicineSpeak').onclick = () => speak([$('#medicineAnswerText').textContent]);

$('#hospitalCheck').onclick = async () => {
  const name = $('#hospitalName').value.trim(), status = $('#hospitalStatus');
  if (name.length < 2 || !pos) { status.hidden = false; status.textContent = !pos ? t('locationPermissionDenied') : t('hospitalNameLabel'); return; }
  status.hidden = false; status.textContent = t('hospitalWorking'); $('#hospitalCheck').disabled = true;
  try {
    const result = await api('/api/gemini/hospital-hours', {name, lat: pos.lat, lon: pos.lon, language: lang});
    status.replaceChildren();
    const message = document.createElement('span'); message.textContent = `${result.answer} ${result.grounded ? t('hospitalGrounded') : t('hospitalNoSources')}`; status.append(message);
    for (const source of result.sources || []) { const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = source.title; status.append(document.createElement('br'), link); }
  } catch (e) { status.textContent = e.message; }
  finally { $('#hospitalCheck').disabled = false; }
};

/* ------------------------------------------------------------ live location share */
async function startShare() {
  if (share) return share;
  if (!pos) await ensureLocation(); if (!pos) throw new Error(t('needLoc'));
  share = await api('/api/track', {lat: pos.lat, lon: pos.lon, label: myName() || 'Live location'});
  store.set('share', share); runShare(); renderShare(); return share;
}
function runShare() {
  clearInterval(shareTimer);
  if (!share) return;
  shareTimer = setInterval(() => {
    if (!share || !pos) return;
    api('/api/track/' + share.token, {key: share.key, lat: pos.lat, lon: pos.lon}).catch(e => { if (/Invalid/.test(e.message)) stopShare(); });
  }, 10000);
}
async function stopShare() {
  if (!share) return;
  const current = share;
  try {
    await api(`/api/track/${current.token}`, {key: current.key}, 'DELETE');
  } catch (e) {
    if (!/not found|expired/i.test(e.message)) { alert(e.message); return; }
  }
  clearInterval(shareTimer); share = null; store.set('share', null); renderShare();
}
function renderShare() {
  $('#shareStatus').hidden = $('#shareStop').hidden = !share;
  if (share) $('#shareStatus').textContent = `${t('sharing')} ${share.url}`;
}
function openWA(text) {
  const u = 'https://wa.me/?text=' + encodeURIComponent(text);
  if (!window.open(u, '_blank')) location.href = u;
}
async function shareEmergencyWithContact(index, button) {
  const contact = waContacts[index];
  if (!contact) return;
  const popup = window.open('about:blank', '_blank');
  if (popup) popup.opener = null;
  if (button) button.disabled = true;
  const statusText = t('waPreparing');
  for (const id of ['incidentShareStatus', 'sosWAStatus']) {
    const status = document.getElementById(id);
    if (status) { status.hidden = false; status.textContent = statusText; }
  }
  try {
    const positionAge = pos?.updatedAt ? Date.now() - pos.updatedAt : Infinity;
    const current = positionAge >= 0 && positionAge <= 60000 ? pos : await ensureLocation();
    if (!current) {
      popup?.close();
      for (const id of ['incidentShareStatus', 'sosWAStatus']) {
        const status = document.getElementById(id);
        if (status) status.textContent = t('waLocationUnavailable');
      }
      return;
    }
    const map = `https://www.google.com/maps?q=${current.lat},${current.lon}`;
    const event = curCard?.title[lang] || t('waGeneric');
    const message = t('waMessage', {event, map});
    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
    if (popup) popup.location.href = url;
    else window.location.href = url;
    for (const id of ['incidentShareStatus', 'sosWAStatus']) {
      const status = document.getElementById(id);
      if (status) status.textContent = t('waReady', {name: contact.label});
    }
  } finally {
    if (button) button.disabled = false;
  }
}
function shareText() {
  const g = pos ? `https://www.google.com/maps?q=${pos.lat},${pos.lon}` : '';
  return `🆘 ${lang === 'hi' ? 'मुझे मदद चाहिए। मेरी लाइव लोकेशन:' : 'I need help. My live location:'} ${share ? share.url : g}\n${g}`;
}
$('#shareBtn').onclick = async () => {
  try { await startShare(); openWA(shareText()); } catch (e) { alert(e.message); }
};
$('#shareStop').onclick = stopShare;

/* ------------------------------------------------------------ SOS */
function renderSosPanel() {
  const panel = $('#sosPanel');
  panel.hidden = false;
  const best = placesFor('hospital')[0];
  let html = `<h3>${t('nearest')}</h3>`;
  if (sosState.locating) {
    html += `<p class="note">${t('locating')}</p>`;
  } else if (sosState.hospitalLoading) {
    html += `<p class="note">${t('findingHospital')}</p><div class="skeleton" aria-hidden="true"></div>`;
  } else if (best) {
    if (['chest', 'stroke', 'accident', 'snake', 'burn'].includes(curCard?.id)) {
      html += `<p class="note">${curCard.id === 'snake' ? t('snakebiteHospitalNote') : t('emergencyRankNote')}</p>`;
    }
    html += placeHTML(best);
    const mins = nearData ? Math.max(0, Math.floor((Date.now() - nearData.at) / 60000)) : 0;
    if (sosState.hospitalError || mins > 0) {
      html += `<p class="note">${sosState.hospitalError ? t('hospitalUnavailable') : t('savedList', {m: mins})}</p>`;
    }
  } else {
    html += `<p class="note">${sosState.hospitalError ? t('hospitalUnavailable') : t('noResults')}</p>`;
  }
  html += `<a class="btn danger wide" href="tel:112" aria-label="${t('call112Label')}"><span aria-hidden="true">📞</span> 112</a>`;
  html += `<p class="note">${t('emergencyPhoneShareExplain')}</p><button id="sosPhoneShare" class="btn ghost wide">${t('emergencyPhoneShare')}</button><p id="sosPhoneShareStatus" class="note" role="status" aria-live="polite" hidden></p>`;
  if (waContacts.length) {
    html += `<p class="note">${t('incidentShareExplain')}</p>${whatsappContactButtons('data-sos-wa')}<p id="sosWAStatus" class="note" role="status" aria-live="polite" hidden></p>`;
  } else {
    html += `<button id="sosWA" class="btn wa wide">${t('sendWA')}</button>`;
  }
  const alertText = sosState.alertPending ? t('sendingAlert')
    : sosState.alertSent === null ? t('noContacts')
      : sosState.alertSent > 0 ? demoMode ? t('demoAlertSaved') : t('alertedN', {n: sosState.alertSent})
        : t('alertFail');
  html += `<p class="note" role="status" aria-live="polite">${alertText}</p>`;
  panel.innerHTML = html;
  $('#sosPhoneShare')?.addEventListener('click', shareEmergencyFromPhone);
  $('#sosWA')?.addEventListener('click', () => openWA(shareText()));
  bindWhatsAppButtons(panel, 'data-sos-wa');
}
async function shareEmergencyFromPhone() {
  const status = $('#sosPhoneShareStatus');
  const map = pos ? `https://www.google.com/maps?q=${pos.lat},${pos.lon}` : '';
  const event = curCard?.title[lang] || t('waGeneric');
  const locationText = map || (lang === 'hi' ? 'लोकेशन उपलब्ध नहीं है' : 'Location unavailable');
  const text = t('waMessage', {event, map: locationText});
  try {
    if (navigator.share) {
      await navigator.share({title: t('appName'), text});
      if (status) { status.hidden = true; status.textContent = ''; }
      return;
    }
    openWA(text);
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (status) {
      status.hidden = false;
      status.textContent = t('emergencyPhoneShareUnavailable');
    }
  }
}
$('#sos').onclick = async () => {
  sosState = {locating: true, hospitalLoading: false, hospitalError: false, alertPending: false, alertSent: null};
  renderSosPanel();
  $('#sosPanel').scrollIntoView({behavior: 'smooth'});
  const hasLocation = !!(await ensureLocation());
  const codes = joinedCodes();
  if (!hasLocation && !codes.length) {
    sosState.locating = false;
    sosState.hospitalError = true;
    renderSosPanel();
    return;
  }

  sosState.locating = false;
  sosState.hospitalLoading = true;
  sosState.alertPending = codes.length > 0;
  renderSosPanel();

  loadHomeNearby().then(ok => {
    sosState.hospitalLoading = false;
    sosState.hospitalError = !ok;
    renderSosPanel();
  });

  if (codes.length) {
    const trackPromise = pos
      ? startShare().then(result => result.token).catch(() => '')
      : Promise.resolve('');
    trackPromise.then(track => api('/api/sos', {
      codes, lat: pos?.lat ?? null, lon: pos?.lon ?? null,
      emergency: curCard ? curCard.title.en : '', name: myName(), track,
    })).then(result => { sosState.alertSent = result.sent; })
      .catch(() => { sosState.alertSent = 0; })
      .finally(() => { sosState.alertPending = false; renderSosPanel(); });
  }
};

/* ------------------------------------------------------------ safety contacts */
function normalizeWhatsAppPhone(value) {
  const raw = String(value ?? '').trim();
  if (!raw || !/^\+?[\d\s().-]+$/.test(raw)) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) {
    if (!/^[6-9]\d{9}$/.test(digits)) return '';
    digits = `91${digits}`;
  }
  if (digits.length < 8 || digits.length > 15 || digits.startsWith('0')) return '';
  return digits;
}
function renderWhatsappContacts() {
  const list = $('#whatsappContactsList');
  list.innerHTML = waContacts.length
    ? waContacts.map((c, i) => `<div class="contact"><div><b>${esc(c.label)}</b><br><span class="note">+${esc(c.phone)}</span></div>
        <div><button class="btn ghost" data-wa-edit="${i}">${t('waContactEdit')}</button>
        <button class="btn ghost" data-wa-remove="${i}" aria-label="${esc(t('removeContact', {name: c.label}))}">✕</button></div></div>`).join('')
    : `<p class="note">${t('waContactEmpty')}</p>`;
  $('#waContactSave').textContent = t(editingWaContact === null ? 'waContactSave' : 'waContactUpdate');
  $('#waContactCancel').hidden = editingWaContact === null;
  list.querySelectorAll('[data-wa-edit]').forEach(button => button.onclick = () => {
    editingWaContact = Number(button.dataset.waEdit);
    const contact = waContacts[editingWaContact];
    if (!contact) { editingWaContact = null; return; }
    $('#waContactName').value = contact.label;
    $('#waContactPhone').value = `+${contact.phone}`;
    $('#waContactStatus').hidden = true;
    renderWhatsappContacts();
    $('#waContactName').focus();
  });
  list.querySelectorAll('[data-wa-remove]').forEach(button => button.onclick = () => {
    const index = Number(button.dataset.waRemove);
    const contact = waContacts[index];
    if (!contact || !confirm(t('waRemoveConfirm', {name: contact.label}))) return;
    waContacts.splice(index, 1);
    if (editingWaContact === index) {
      editingWaContact = null;
      $('#whatsappContactForm').reset();
    } else if (editingWaContact !== null && editingWaContact > index) editingWaContact--;
    store.set('waContacts', waContacts);
    $('#waContactStatus').hidden = false;
    $('#waContactStatus').textContent = t('waContactRemoved');
    renderWhatsappContacts();
    renderCard();
    if (!$('#sosPanel').hidden) renderSosPanel();
  });
}
$('#whatsappContactForm').onsubmit = event => {
  event.preventDefault();
  const label = $('#waContactName').value.trim().slice(0, 40);
  const phone = normalizeWhatsAppPhone($('#waContactPhone').value);
  const status = $('#waContactStatus');
  status.hidden = false;
  if (!label || !phone) {
    status.textContent = t('waContactInvalid');
    return;
  }
  const contact = {label, phone};
  if (editingWaContact === null) waContacts.push(contact);
  else waContacts[editingWaContact] = contact;
  store.set('waContacts', waContacts);
  editingWaContact = null;
  $('#whatsappContactForm').reset();
  status.textContent = t('waContactSaved');
  renderWhatsappContacts();
  renderCard();
  if (!$('#sosPanel').hidden) renderSosPanel();
};
$('#waContactCancel').onclick = () => {
  editingWaContact = null;
  $('#whatsappContactForm').reset();
  $('#waContactStatus').hidden = true;
  renderWhatsappContacts();
};
function renderContacts() {
  $('#contactsList').innerHTML = contacts.map(c => `<div class="contact"><div><b>${esc(c.label)}</b>
    <span class="pill ${c.joined ? 'ok' : 'wait'}">${c.joined ? t('joined') : c.inviteExpired ? t('inviteExpired') : t('pending')}</span></div>
    <div>${!c.joined && !c.inviteExpired && c.link ? `<button class="btn ghost" data-inv="${c.code}">${t('invite')}</button>` : ''}
    <button class="btn ghost" data-del="${c.code}" aria-label="${esc(t('removeContact', {name: c.label}))}"><span aria-hidden="true">✕</span></button></div></div>`).join('');
  $('#contactsList').querySelectorAll('[data-inv]').forEach(b => b.onclick = () => {
    const c = contacts.find(x => x.code === b.dataset.inv); openWA(t('inviteText') + c.link);
  });
  $('#contactsList').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    try {
      await api('/api/contacts/' + encodeURIComponent(b.dataset.del), undefined, 'DELETE');
      contacts = contacts.filter(x => x.code !== b.dataset.del);
      store.set('contacts', contacts); renderContacts();
    } catch (e) { alert(e.message); }
  });
}
$('#addContact').onclick = async () => {
  const label = (prompt(t('askLabel')) || '').trim(); if (!label) return;
  try {
    const r = await api('/api/contacts', {label});
    demoMode = r.demo_mode;
    contacts.push({code: r.code, label, joined: r.demo_mode, link: r.link}); store.set('contacts', contacts);
    renderContacts(); if (r.link) openWA(t('inviteText') + r.link); pollContacts();
  } catch (e) { alert(e.message); }
};
async function pollContacts() {
  let changed = false;
  for (const c of contacts.filter(x => !x.joined && !x.inviteExpired)) {
    try {
      const r = await api('/api/contacts/' + c.code, undefined, 'GET');
      if (r.joined) { c.joined = true; changed = true; }
      if (r.invite_expired !== c.inviteExpired) { c.inviteExpired = r.invite_expired; changed = true; }
      if (r.link !== c.link) { c.link = r.link; changed = true; }
    } catch {}
  }
  if (changed) { store.set('contacts', contacts); }
  renderContacts();
}
setInterval(() => { if (contacts.some(c => !c.joined && !c.inviteExpired) && !$('#tab-walk').hidden) pollContacts(); }, 5000);
$('#yourName').oninput = e => store.set('name', e.target.value);

/* ------------------------------------------------------------ walk with me */
let walkMin = store.get('walkMin', 30);
let walkAudioContext = null;
let walkBattery = null;
if (navigator.getBattery) navigator.getBattery().then(battery => { walkBattery = battery; }).catch(() => {});
function unlockWalkReminderAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    if (!walkAudioContext) walkAudioContext = new AudioContext();
    walkAudioContext.resume().catch(() => {});
  } catch {}
}
document.addEventListener('pointerdown', unlockWalkReminderAudio, {once: true});
function playWalkReminderSound() {
  if (!walkAudioContext || walkAudioContext.state !== 'running') return;
  try {
    const oscillator = walkAudioContext.createOscillator();
    const gain = walkAudioContext.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.07;
    oscillator.connect(gain); gain.connect(walkAudioContext.destination);
    oscillator.start(); oscillator.stop(walkAudioContext.currentTime + 0.18);
  } catch {}
}
function batteryPercent() {
  return walkBattery && Number.isFinite(walkBattery.level)
    ? Math.max(0, Math.min(100, Math.round(walkBattery.level * 100))) : null;
}
function renderMinChips() {
  const opts = [1, 15, 30, 60, 120];
  $('#minChips').innerHTML = opts.map(m =>
    `<button class="chip ${m === walkMin ? 'on' : ''}" data-m="${m}" aria-pressed="${m === walkMin}">${m === 1 ? t('demo1') : m + ' ' + t('min')}</button>`).join('');
  $('#minChips').querySelectorAll('button').forEach(b => b.onclick = () => { walkMin = +b.dataset.m; store.set('walkMin', walkMin); renderMinChips(); });
}
$('#walkStart').onclick = async () => {
  unlockWalkReminderAudio();
  if (!pos) await ensureLocation(); if (!pos) return alert(t('needLoc'));
  if (!joinedCodes().length && !confirm(t('noJoined'))) return;
  try {
    const w = await api('/api/walk', {minutes: walkMin, codes: joinedCodes(), lat: pos.lat, lon: pos.lon, name: myName(), battery: batteryPercent()});
    walkSt = {id: w.id, track: w.track, deadline: w.deadline * 1000, status: 'active', sent: 0, reminderDone: false};
    store.set('walk', walkSt); runWalk(); renderWalk();
    try { await navigator.wakeLock?.request('screen'); } catch {}
  } catch (e) { alert(e.message); }
};
function runWalk() {
  walkTimers.forEach(clearInterval); walkTimers = [];
  if (!walkSt || !['active', 'alerting'].includes(walkSt.status)) return;
  walkTimers.push(setInterval(renderWalk, 1000));
  walkTimers.push(setInterval(() => { if (pos && walkSt?.status === 'active') api(`/api/walk/${walkSt.id}/ping`, {lat: pos.lat, lon: pos.lon, battery: batteryPercent()}).then(syncWalk).catch(() => {}); }, 20000));
  walkTimers.push(setInterval(() => walkSt && api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}), 8000));
}
function syncWalk(w) {
  if (!walkSt) return;
  const deadline = w.deadline * 1000;
  if (walkSt.deadline !== deadline) walkSt.reminderDone = false;
  walkSt.status = w.status; walkSt.sent = w.sent; walkSt.deadline = deadline;
  walkSt.alertReason = w.alert_reason || '';
  store.set('walk', walkSt);
  if (!['active', 'alerting'].includes(w.status)) { walkTimers.forEach(clearInterval); walkTimers = []; }
  renderWalk(); if (w.status === 'alerted') pollDemo();
}
function renderWalk() {
  const run = !!walkSt; $('#walkSetup').hidden = run; $('#walkRun').hidden = !run; if (!run) return;
  const left = Math.max(0, Math.round((walkSt.deadline - Date.now()) / 1000));
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
  $('#countdown').textContent = walkSt.status === 'active' ? `${mm}:${ss}` : walkSt.status === 'safe' ? '✅' : '🚨';
  $('#walkRun').classList.toggle('alerted', walkSt.status === 'alerted');
  $('#walkMsg').textContent = walkSt.status === 'active' ? t('walkOn')
    : walkSt.status === 'safe' ? t('walkSafe')
      : walkSt.status === 'alerting' ? t('walkAlerting')
        : walkSt.sent === 0 ? t('walkNoRecipients')
          : walkSt.alertReason === 'duress' ? demoMode ? t('duressDemo') : t('duressDelivered', {n: walkSt.sent})
            : demoMode ? t('walkDemoAlert') : t('walkAlerted', {n: walkSt.sent});
  $('#btnSafe').textContent = walkSt.status === 'active' ? t('imSafe')
    : walkSt.status === 'alerting' ? t('walkAlerting') : t('dismissWalk');
  $('#btnSafe').setAttribute('aria-label', $('#btnSafe').textContent);
  $('#btnSafe').disabled = walkSt.status === 'alerting';
  $('#btnExtend').hidden = $('#btnPanic').hidden = $('#btnDuress').hidden = walkSt.status !== 'active';
  if (walkSt.status === 'active' && left > 0 && left <= 60 && !walkSt.reminderDone) {
    walkSt.reminderDone = true;
    store.set('walk', walkSt);
    if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
    playWalkReminderSound();
  }
  if (walkSt.status === 'active' && left === 0) setTimeout(() => walkSt && api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}), 6000);
}
async function walkAct(action, body) {
  if (!walkSt) return;
  try {
    const state = await api(`/api/walk/${walkSt.id}/${action}`, body || {});
    syncWalk(state);
    return state;
  } catch (e) { alert(e.message); return null; }
}
$('#btnSafe').onclick = async () => {
  if (walkSt?.status === 'alerting') return;
  if (walkSt && walkSt.status === 'active') {
    const state = await walkAct('safe');
    if (!state || state.status === 'active' || state.status === 'alerting') return;
  }
  walkSt = null; store.set('walk', null); walkTimers.forEach(clearInterval); renderWalk();
};
$('#btnExtend').onclick = () => walkAct('extend', {minutes: 10});
$('#btnPanic').onclick = () => walkAct('panic');
$('#btnDuress').onclick = () => walkAct('duress');

$('#deleteData').onclick = async () => {
  if (!confirm(t('deleteConfirm'))) return;
  const status = $('#deleteDataStatus');
  status.hidden = false;
  status.textContent = t('deletingData');
  try {
    await api('/api/data', undefined, 'DELETE');
    clearInterval(shareTimer);
    walkTimers.forEach(clearInterval); walkTimers = [];
    if (watchId !== null) navigator.geolocation?.clearWatch(watchId);
    watchId = null;
    for (const key of ['contacts', 'waContacts', 'share', 'walk', 'name', 'lastpos', 'nearby',
      'demoSession', 'demoSessionExpires', 'deviceToken', 'locationPrompted']) {
      try { localStorage.removeItem(key); } catch {}
    }
    contacts = []; waContacts = []; editingWaContact = null; share = null; walkSt = null; pos = null; nearData = null;
    homeNearbyLoading = false; homeNearbyError = false; homeNearbySearched = false;
    demoSession = ''; demoSessionExpires = 0; deviceToken = '';
    demoSessionChecked = false; locationPrompted = false; locationRequestStatus = '';
    nearbyLocationChecked = false; nearbyLocationLoading = false; nearbyLocationError = '';
    $('#whatsappContactForm').reset(); $('#waContactStatus').hidden = true;
    operatorRequestId++;
    operator = {open: false, pos: null, address: '', lookup: 'idle'};
    stopSpeak();
    $('#yourName').value = ''; $('#operatorPeople').value = ''; $('#operatorEvent').value = '';
    $('#locLine').textContent = '';
    $('#demoBox').hidden = true; $('#sosPanel').hidden = true;
    renderContacts(); renderWhatsappContacts(); renderCard(); renderShare(); renderWalk(); renderLocationIntro(); renderHomeNearby(); renderOperator();
    status.textContent = t('deleteSuccess');
  } catch {
    status.textContent = t('deleteFail');
  }
};

/* ------------------------------------------------------------ demo mode box */
async function pollDemo() {
  try {
    const d = await api('/api/demo-log', undefined, 'GET'); demoMode = d.demo_mode;
    renderDemoBanner();
    $('#demoBox').hidden = !d.demo_mode;
    $('#demoLog').innerHTML = d.messages.slice().reverse().map(m => `<div class="msg">${esc(m.text)}</div>`).join('');
  } catch {}
}
setInterval(pollDemo, 6000);

/* ------------------------------------------------------------ boot */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
loadCards(); applyLang(); pollDemo();
renderOfflineBanner();
if (share) runShare();
if (walkSt && ['active', 'alerting'].includes(walkSt.status)) { runWalk(); api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}); }
if (pos) $('#locLine').textContent = t('locSaved');
if (navigator.permissions) navigator.permissions.query({name: 'geolocation'}).then(p => { if (p.state === 'granted') locate().catch(() => {}); }).catch(() => {});
