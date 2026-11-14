/* Aapatkaal Saathi — front end (no build step, no external libraries). */
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
    changeLanguage: 'Change language', sosLabel: 'Emergency help',
    locationTitle: 'Use location', locationReason: 'Location helps share your position and find nearby help; 112 works without it.',
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
    geminiExplain: 'Describe the situation in Hindi or English. After you tap, your description is sent to Google Gemini. Do not include names, phone numbers, or exact addresses; GPS is not sent. Gemini can only match an existing reviewed card; it does not diagnose or give instructions. Check the card. Call 112 in an emergency.',
    geminiInput: 'What is happening?', geminiPlaceholder: 'For example: “My father has chest pain”',
    geminiRun: 'Find a reviewed card', geminiWorking: 'Checking for a matching reviewed card…',
    geminiMatch: 'Gemini suggests “{title}”. This is not a diagnosis. Check the card and call 112.',
    geminiUnsure: 'No clear card match. Choose a card below or call 112.',
    geminiNotConfigured: 'Gemini is not configured. Choose a card below; the app works without a Gemini key.',
    geminiUnavailable: 'Gemini could not help right now. Choose a card below or call 112.',
    searchPlace: 'Search for your place', search: 'Search', placePH: 'e.g. Kalyanpur, Kanpur',
    whatHappened: 'What happened?', stepsH: 'Do this now', dontsH: 'Do NOT do this',
    read: '🔊 Read aloud', stop: 'Stop', noVoice: 'No Hindi voice found on this phone. Add Hindi text-to-speech in phone settings.',
    shareLive: '📍 Share live location on WhatsApp', sharing: 'Sharing live location. Link:', stopShare: 'Stop sharing',
    tabHelp: 'Help', tabNear: 'Nearby', tabWalk: 'Walk',
    hospital: 'Hospitals', clinic: 'Clinics', pharmacy: 'Pharmacies', police: 'Police',
    call: '📞 Call', dir: '🧭 Directions', emerg: 'Emergency dept', unnamed: 'Unnamed place',
    noResults: 'Nothing mapped nearby. OpenStreetMap may be incomplete here. Call 112.',
    osmWarn: 'Listed on OpenStreetMap. Opening hours and beds are not confirmed. Call first if you can.',
    savedList: 'Place list updated {m} min ago.', nearFresh: 'Places updated just now.',
    nearLoading: 'Finding nearby places…', nearError: 'Could not load places. Try refresh or call 112.',
    nearOffline: 'Could not refresh. Showing saved OSM data, updated {m} min ago.',
    findingHospital: 'Finding the nearest listed hospital…',
    hospitalUnavailable: 'Could not refresh hospitals. The saved list may be old.',
    sendingAlert: 'Sending alert to your contacts…',
    refresh: 'Refresh', loadFail: 'Map service is busy. Call 112 or try again.',
    nearest: 'Nearest hospital', alertedN: 'Alert sent to {n} contact(s).', noContacts: 'No safety contacts yet. Add them in the Walk tab.',
    sendWA: 'Send my location on WhatsApp', alertFail: 'Could not reach your contacts. Call someone now.',
    walkTitle: 'Walk with me', walkExplain: 'Set a timer. If you do not tap “I’m safe” in time, your contacts get an alert with your last location. The timer runs on the server, so it works even if your phone dies.',
    yourName: 'Your name (shown in alerts)', contactsTitle: 'Safety contacts', addContact: '+ Add contact', askLabel: 'Contact name (e.g. Mom)',
    joined: 'Joined', pending: 'Waiting', invite: 'Send invite', inviteText: 'Please be my safety contact. Open this link and press Start in Telegram: ',
    min: 'min', demo1: '1 min (demo)', startWalk: 'Start walk', imSafe: '✅ I’m safe', plus10: '+10 min', panic: '🚨 Alert now',
    walkOn: 'Walk in progress. Your contacts are alerted when this reaches 0:00.', walkAlerted: 'Alert sent to {n} contact(s). Call 112 if you need help.',
    walkSafe: 'Checked in. Stay safe!', noJoined: 'No contact has joined yet, so nobody would get the alert. Start anyway?',
    demoTitle: 'Demo mode: messages that would go to contacts on Telegram', needLoc: 'Location is needed first.',
    footer: 'General guidance, not medical advice. This app does not call an ambulance. In an emergency, always call 112.',
    away: 'away', del: 'Remove', removeContact: 'Remove {name}', countdownLabel: 'Time remaining',
    call112Label: 'Call emergency number 112', sosStatus: 'Emergency help status', dismissWalk: 'Close walk status',
    inviteExpired: 'Invite expired. Remove and add again.',
    privacyTitle: 'Privacy and your data', privacyNote: 'Your saved location and nearby list stay on this device. Map searches send coordinates to OpenStreetMap services. SOS, live sharing, and Walk send your location to the contacts or link you choose. Live links expire automatically; use Delete my data to end sharing now. Deleting cannot recall messages already delivered.',
    deleteData: 'Delete my data from this device', deleteConfirm: 'Delete this device’s saved contacts, live links, walks, and demo messages? This cannot recall messages already delivered.',
    deleteSuccess: 'Your device data was deleted.', deleteFail: 'Could not delete server data. Check your connection and try again.', deletingData: 'Deleting your data…',
  },
  hi: {
    appName: 'आपातकाल साथी', sosHint: 'आपातकाल में दबाएं', locating: 'आपकी लोकेशन खोज रहे हैं…',
    locOk: 'लोकेशन मिली (±{m} मी)', locSaved: 'पिछली सेव लोकेशन इस्तेमाल हो रही है', locFail: 'लोकेशन नहीं मिली। कोई जगह खोजें।',
    changeLanguage: 'भाषा बदलें', sosLabel: 'आपातकाल में मदद लें',
    locationTitle: 'लोकेशन दें', locationReason: 'लोकेशन से आपकी जगह साझा होगी और पास की मदद मिलेगी; 112 इसके बिना भी काम करता है।',
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
    geminiTitle: 'Gemini से सही जानकारी वाला कार्ड खोजें',
    geminiExplain: 'स्थिति हिंदी या अंग्रेज़ी में लिखें। बटन दबाने पर आपका लिखा Google Gemini को भेजा जाएगा। नाम, फ़ोन नंबर या पूरा पता न लिखें; GPS लोकेशन नहीं भेजी जाती। Gemini केवल पहले से जाँचे गए कार्ड में से चुनता है; बीमारी नहीं बताता और निर्देश नहीं देता। कार्ड पढ़ें। आपातकाल में 112 पर कॉल करें।',
    geminiInput: 'क्या हो रहा है?', geminiPlaceholder: 'जैसे: “पापा के सीने में दर्द है”',
    geminiRun: 'जाँचा हुआ कार्ड खोजें', geminiWorking: 'मिलता-जुलता जाँचा हुआ कार्ड खोज रहे हैं…',
    geminiMatch: 'Gemini ने “{title}” कार्ड चुना है। यह बीमारी की पहचान नहीं है। कार्ड पढ़ें और 112 पर कॉल करें।',
    geminiUnsure: 'कोई साफ़ मेल नहीं मिला। नीचे कार्ड चुनें या 112 पर कॉल करें।',
    geminiNotConfigured: 'Gemini चालू नहीं है। नीचे कार्ड चुनें; बिना Gemini key के भी ऐप काम करता है।',
    geminiUnavailable: 'अभी Gemini से मदद नहीं मिली। नीचे कार्ड चुनें या 112 पर कॉल करें।',
    searchPlace: 'अपनी जगह खोजें', search: 'खोजें', placePH: 'जैसे कल्याणपुर, कानपुर',
    whatHappened: 'क्या हुआ?', stepsH: 'अभी यह करें', dontsH: 'यह न करें',
    read: '🔊 सुनें', stop: 'रोकें', noVoice: 'इस फ़ोन में हिंदी आवाज़ नहीं मिली। फ़ोन की सेटिंग में हिंदी आवाज़ जोड़ें।',
    shareLive: '📍 WhatsApp पर लाइव लोकेशन भेजें', sharing: 'लाइव लोकेशन शेयर हो रही है। लिंक:', stopShare: 'शेयरिंग बंद करें',
    tabHelp: 'मदद', tabNear: 'पास में', tabWalk: 'साथ चलें',
    hospital: 'अस्पताल', clinic: 'क्लिनिक', pharmacy: 'दवा की दुकानें', police: 'पुलिस',
    call: '📞 कॉल', dir: '🧭 रास्ता', emerg: 'आपातकालीन विभाग', unnamed: 'बिना नाम की जगह',
    noResults: 'पास में कुछ मैप में नहीं मिला। यहाँ OpenStreetMap अधूरा हो सकता है। 112 पर कॉल करें।',
    osmWarn: 'OpenStreetMap पर दर्ज है। खुलने का समय और बिस्तर पक्के नहीं हैं। हो सके तो पहले फ़ोन करें।',
    savedList: 'जगहों की सूची {m} मिनट पहले अपडेट हुई।', nearFresh: 'जगहों की सूची अभी अपडेट हुई।',
    nearLoading: 'पास की जगहें खोज रहे हैं…', nearError: 'जगहें नहीं मिलीं। फिर कोशिश करें या 112 पर कॉल करें।',
    nearOffline: 'नई जानकारी नहीं मिली। सेव OSM सूची {m} मिनट पुरानी है।',
    findingHospital: 'पास का दर्ज अस्पताल खोज रहे हैं…',
    hospitalUnavailable: 'अस्पतालों की नई जानकारी नहीं मिली। सेव सूची पुरानी हो सकती है।',
    sendingAlert: 'आपके संपर्कों को अलर्ट भेज रहे हैं…',
    refresh: 'फिर से लें', loadFail: 'मैप सेवा व्यस्त है। 112 पर कॉल करें या फिर कोशिश करें।',
    nearest: 'पास का अस्पताल', alertedN: '{n} संपर्कों को अलर्ट भेजा गया।', noContacts: 'अभी कोई भरोसेमंद संपर्क नहीं। "साथ चलें" टैब में जोड़ें।',
    sendWA: 'WhatsApp पर मेरी लोकेशन भेजें', alertFail: 'संपर्कों तक अलर्ट नहीं पहुँचा। अभी किसी को फ़ोन करें।',
    walkTitle: 'साथ चलें', walkExplain: 'टाइमर लगाएं। समय पर “मैं सुरक्षित हूँ” न दबाया, तो आपके संपर्कों को आख़िरी लोकेशन के साथ अलर्ट जाएगा। टाइमर सर्वर पर चलता है, इसलिए फ़ोन बंद होने पर भी चलेगा।',
    yourName: 'आपका नाम (अलर्ट में दिखेगा)', contactsTitle: 'भरोसेमंद संपर्क', addContact: '+ संपर्क जोड़ें', askLabel: 'संपर्क का नाम (जैसे माँ)',
    joined: 'जुड़ गए', pending: 'इंतज़ार में', invite: 'निमंत्रण भेजें', inviteText: 'कृपया मेरे भरोसेमंद संपर्क बनें। यह लिंक खोलें और Telegram में Start दबाएं: ',
    min: 'मिनट', demo1: '1 मिनट (डेमो)', startWalk: 'चलना शुरू करें', imSafe: '✅ मैं सुरक्षित हूँ', plus10: '+10 मिनट', panic: '🚨 अभी अलर्ट भेजें',
    walkOn: 'टाइमर चालू है। समय खत्म होने पर संपर्कों को अलर्ट जाएगा।', walkAlerted: '{n} संपर्कों को अलर्ट भेजा गया। मदद चाहिए तो 112 पर कॉल करें।',
    walkSafe: 'चेक-इन हो गया। सुरक्षित रहें!', noJoined: 'अभी कोई संपर्क जुड़ा नहीं है, इसलिए अलर्ट किसी को नहीं जाएगा। फिर भी शुरू करें?',
    demoTitle: 'डेमो मोड: संपर्कों को भेजे जाने वाले संदेश', needLoc: 'पहले लोकेशन दें।',
    footer: 'यह सामान्य जानकारी है, चिकित्सा सलाह नहीं। यह ऐप एम्बुलेंस नहीं भेजता। आपातकाल में 112 पर कॉल करें।',
    away: 'दूर', del: 'हटाएं', removeContact: '{name} को हटाएं', countdownLabel: 'बाकी समय',
    call112Label: 'आपातकालीन नंबर 112 पर कॉल करें', sosStatus: 'आपातकालीन मदद की स्थिति', dismissWalk: 'वॉक की स्थिति बंद करें',
    inviteExpired: 'निमंत्रण की अवधि खत्म। हटाकर फिर जोड़ें।',
    privacyTitle: 'आपकी निजता और डेटा', privacyNote: 'सेव की हुई लोकेशन और पास की सूची इसी फ़ोन में रहती है। जगह खोजने पर निर्देशांक OpenStreetMap सेवाओं को भेजे जाते हैं। SOS, लाइव लोकेशन और “साथ चलें” में आपकी लोकेशन चुने हुए संपर्कों या लिंक पर भेजी जाती है। लाइव लिंक अपने-आप खत्म होते हैं; शेयरिंग तुरंत रोकने के लिए मेरा डेटा हटाएं। पहले भेजे संदेश वापस नहीं लिए जा सकते।',
    deleteData: 'इस डिवाइस से मेरा डेटा हटाएं', deleteConfirm: 'इस डिवाइस के सेव संपर्क, लाइव लिंक, वॉक और डेमो संदेश हटाएं? पहले भेजे संदेश वापस नहीं लिए जा सकते।',
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
let nearType = 'hospital';
let nearData = store.get('nearby', null); // {at, data}
let nearError = false, nearLoading = false, nearLoadPromise = null;
let contacts = store.get('contacts', []); // [{code,label,joined,link}]
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
  $('#voiceNote').hidden = true;
  $('#operatorVoiceNote').hidden = true;
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  $('#langBtn').textContent = lang === 'hi' ? 'EN' : 'हिं';
  $('#langBtn').setAttribute('aria-label', t('changeLanguage'));
  $('#sos').setAttribute('aria-label', t('sosLabel'));
  $('#call112').setAttribute('aria-label', t('call112Label'));
  $('#sosPanel').setAttribute('aria-label', t('sosStatus'));
  $('#countdown').setAttribute('aria-label', t('countdownLabel'));
  $('#placeQ').placeholder = t('placePH');
  $('#geminiDescription').placeholder = t('geminiPlaceholder');
  $('#operatorPeople').placeholder = t('operatorPeoplePH');
  $('#operatorEvent').placeholder = t('operatorEventPH');
  $('#yourName').value = store.get('name', '');
  renderLocationIntro(); renderChips(); renderCard(); renderNear(); renderContacts(); renderMinChips(); renderShare(); renderWalk(); renderOperator();
}
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
  if (n === 'near') loadNearby();
  if (n === 'walk') pollContacts();
}

/* ------------------------------------------------------------ location */
function renderLocationIntro() {
  $('#locationIntro').hidden = !!pos || locationPrompted;
  const status = $('#locationIntroStatus');
  status.hidden = !locationRequestStatus;
  status.textContent = locationRequestStatus ? t(locationRequestStatus) : '';
}

function locate() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('no-geo'));
    navigator.geolocation.getCurrentPosition(p => {
      pos = {lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy), updatedAt: Date.now()};
      store.set('lastpos', pos); $('#locLine').textContent = t('locOk', {m: pos.acc});
      locationRequestStatus = '';
      locationPrompted = true; store.set('locationPrompted', true); renderLocationIntro();
      $('#manualLoc').hidden = true; startWatch(); res(pos);
    }, err => rej(err), {enableHighAccuracy: true, timeout: 12000, maximumAge: 20000});
  });
}
function startWatch() {
  if (watchId !== null || !navigator.geolocation) return;
  watchId = navigator.geolocation.watchPosition(p => {
    pos = {lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy), updatedAt: Date.now()};
    store.set('lastpos', pos);
  }, () => {}, {enableHighAccuracy: true, maximumAge: 15000});
}
async function ensureLocation() {
  $('#locLine').textContent = t('locating');
  try { return await locate(); }
  catch {
    if (pos) { $('#locLine').textContent = t('locSaved'); return pos; }
    $('#locLine').textContent = t('locFail'); $('#manualLoc').hidden = false; return null;
  }
}
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

$('#geminiRun').onclick = async () => {
  const description = $('#geminiDescription').value.trim();
  const status = $('#geminiResult');
  const button = $('#geminiRun');
  status.hidden = false;
  if (description.length < 3) {
    status.textContent = t('geminiUnsure');
    return;
  }
  button.disabled = true;
  status.textContent = t('geminiWorking');
  try {
    const result = await api('/api/gemini/route', {description, language: lang});
    const match = cards.find(card => card.id === result.card_id);
    if (!match || result.card_id === 'unsure') {
      status.textContent = t('geminiUnsure');
      return;
    }
    status.textContent = t('geminiMatch', {title: match.title[lang]});
    openCard(match.id, true);
  } catch (error) {
    status.textContent = /not configured/i.test(error.message)
      ? t('geminiNotConfigured') : t('geminiUnavailable');
  } finally {
    button.disabled = false;
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
      locationRequestStatus = '';
      store.set('lastpos', pos); locationPrompted = true; store.set('locationPrompted', true);
      renderLocationIntro(); $('#manualLoc').hidden = true; $('#locLine').textContent = x.name.slice(0, 60); loadNearby(true);
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
  if (!force && nearData && Date.now() - nearData.at < 120000 && hav(pos.lat, pos.lon, nearData.data.center.lat, nearData.data.center.lon) < 500) return renderNear();
  if (nearLoadPromise) return nearLoadPromise;
  nearLoading = true; nearError = false; renderNear();
  nearLoadPromise = (async () => {
    try {
      const data = await api('/api/nearby', {lat: pos.lat, lon: pos.lon});
      saveNearby(data);
      nearError = !!data.stale;
    } catch {
      nearError = true;
    } finally {
      nearLoading = false; nearLoadPromise = null; renderNear();
    }
  })();
  return nearLoadPromise;
}
function saveNearby(data) {
  const previous = nearData;
  const sameArea = previous?.data?.center &&
    hav(pos.lat, pos.lon, previous.data.center.lat, previous.data.center.lon) < 500;
  const fetchedAt = data.fetched_at ? data.fetched_at * 1000 : Date.now();
  const oldFetchedAt = previous ? previous.at : fetchedAt;
  const ageAnchor = sameArea ? Math.min(oldFetchedAt, fetchedAt) : fetchedAt;
  const results = sameArea ? {...previous.data.results, ...data.results} : {...data.results};
  const merged = {...(sameArea ? previous.data : {}), ...data, results, fetched_at: ageAnchor / 1000};
  nearData = {at: ageAnchor, data: merged};
  store.set('nearby', nearData);
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
  if (!pos) return;
  if (navigator.onLine === false) { nearError = true; nearLoading = false; renderNear(); return; }
  nearLoading = true;
  renderNear();
  try {
    const data = await api('/api/nearby', {lat: pos.lat, lon: pos.lon, types: 'clinic,pharmacy,police'});
    saveNearby(data);
    nearError = !!data.stale;
  } catch {
    nearError = true;
  } finally {
    nearLoading = false;
    renderNear();
  }
}
function placesFor(type) {
  if (!nearData) return [];
  const list = (nearData.data.results[type] || []).map(p => ({...p}));
  if (pos) list.forEach(p => p.distance_m = Math.round(hav(pos.lat, pos.lon, p.lat, p.lon)));
  return list.sort((a, b) => a.distance_m - b.distance_m);
}
function placeHTML(p) {
  const name = p.name || t('unnamed');
  return `<div class="place"><div class="nm">${esc(name)}${p.emergency ? `<span class="badge">${t('emerg')}</span>` : ''}</div>
    <div class="meta"><span class="dist">${fmtDist(p.distance_m)}</span> ${t('away')}${p.address ? ' · ' + esc(p.address) : ''}${p.hours ? ' · ' + esc(p.hours) : ''}</div>
    <div class="acts">${p.phone ? `<a class="btn call" href="tel:${esc(p.phone)}">${t('call')}</a>` : ''}
    <a class="btn dir" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving">${t('dir')}</a></div></div>`;
}
function renderNear() {
  $('#typeTabs').innerHTML = ['hospital', 'clinic', 'pharmacy', 'police'].map(k =>
    `<button class="chip ${k === nearType ? 'on' : ''}" data-k="${k}" aria-pressed="${k === nearType}">${t(k)}</button>`).join('');
  $('#typeTabs').querySelectorAll('button').forEach(b => b.onclick = () => { nearType = b.dataset.k; renderNear(); });
  const meta = $('#nearMeta');
  const listEl = $('#nearList');
  meta.textContent = '';
  if (!nearData) {
    if (nearLoading) {
      meta.textContent = t('nearLoading');
      listEl.innerHTML = '<div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div>';
      return;
    }
    meta.textContent = pos ? t(nearError ? 'nearError' : 'loadFail') : t('locFail');
    if (nearError || !pos) appendCall112(meta);
    listEl.innerHTML = '';
    return;
  }
  const mins = Math.max(0, Math.floor((Date.now() - nearData.at) / 60000));
  const age = mins < 1 ? t('nearFresh') : t('savedList', {m: mins});
  meta.textContent = `${nearError ? t('nearOffline', {m: mins}) : age} ${t('osmWarn')}`;
  if (nearError) appendCall112(meta);
  const list = placesFor(nearType);
  listEl.innerHTML = list.length ? list.map(placeHTML).join('') : `<p class="note">${t('noResults')}</p>`;
  if (!list.length) appendCall112(listEl);
  if (nearLoading) meta.append(` ${t('nearLoading')}`);
}
function appendCall112(parent) {
  const link = document.createElement('a');
  link.href = 'tel:112';
  link.className = 'call-inline';
  link.setAttribute('aria-label', t('call112Label'));
  link.innerHTML = '<span aria-hidden="true">📞</span> 112';
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
  $('#card').hidden = !curCard; if (!curCard) return;
  $('#cardTitle').textContent = `${curCard.icon} ${curCard.title[lang]}`;
  $('#stepsList').innerHTML = curCard.steps[lang].map(s => `<li>${esc(s)}</li>`).join('');
  $('#dontsList').innerHTML = curCard.donts[lang].map(s => `<li>${esc(s)}</li>`).join('');
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
    html += placeHTML(best);
    const mins = nearData ? Math.max(0, Math.floor((Date.now() - nearData.at) / 60000)) : 0;
    if (sosState.hospitalError || mins > 0) {
      html += `<p class="note">${sosState.hospitalError ? t('hospitalUnavailable') : t('savedList', {m: mins})}</p>`;
    }
  } else {
    html += `<p class="note">${sosState.hospitalError ? t('hospitalUnavailable') : t('noResults')}</p>`;
  }
  html += `<a class="btn danger wide" href="tel:112" aria-label="${t('call112Label')}"><span aria-hidden="true">📞</span> 112</a>`;
  html += `<button id="sosWA" class="btn wa wide">${t('sendWA')}</button>`;
  const alertText = sosState.alertPending ? t('sendingAlert')
    : sosState.alertSent === null ? t('noContacts')
      : sosState.alertSent > 0 ? t('alertedN', {n: sosState.alertSent}) : t('alertFail');
  html += `<p class="note" role="status" aria-live="polite">${alertText}</p>`;
  panel.innerHTML = html;
  $('#sosWA').onclick = () => openWA(shareText());
}
$('#sos').onclick = async () => {
  sosState = {locating: true, hospitalLoading: false, hospitalError: false, alertPending: false, alertSent: null};
  renderSosPanel();
  $('#sosPanel').scrollIntoView({behavior: 'smooth'});
  if (!await ensureLocation()) {
    sosState.locating = false;
    sosState.hospitalError = true;
    renderSosPanel();
    return;
  }

  const codes = joinedCodes();
  sosState.locating = false;
  sosState.hospitalLoading = true;
  sosState.alertPending = codes.length > 0;
  renderSosPanel();

  loadNearbyFast().then(ok => {
    sosState.hospitalLoading = false;
    sosState.hospitalError = !ok;
    renderSosPanel();
    loadNearbyRest();
  });

  const trackPromise = startShare().then(result => result.token).catch(() => '');
  if (codes.length) {
    trackPromise.then(track => api('/api/sos', {
      codes, lat: pos.lat, lon: pos.lon, emergency: curCard ? curCard.title.en : '', name: myName(), track,
    })).then(result => { sosState.alertSent = result.sent; })
      .catch(() => { sosState.alertSent = 0; })
      .finally(() => { sosState.alertPending = false; renderSosPanel(); });
  }
};

/* ------------------------------------------------------------ safety contacts */
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
function renderMinChips() {
  const opts = [1, 15, 30, 60, 120];
  $('#minChips').innerHTML = opts.map(m =>
    `<button class="chip ${m === walkMin ? 'on' : ''}" data-m="${m}" aria-pressed="${m === walkMin}">${m === 1 ? t('demo1') : m + ' ' + t('min')}</button>`).join('');
  $('#minChips').querySelectorAll('button').forEach(b => b.onclick = () => { walkMin = +b.dataset.m; store.set('walkMin', walkMin); renderMinChips(); });
}
$('#walkStart').onclick = async () => {
  if (!pos) await ensureLocation(); if (!pos) return alert(t('needLoc'));
  if (!joinedCodes().length && !confirm(t('noJoined'))) return;
  try {
    const w = await api('/api/walk', {minutes: walkMin, codes: joinedCodes(), lat: pos.lat, lon: pos.lon, name: myName()});
    walkSt = {id: w.id, track: w.track, deadline: Date.now() + w.remaining_s * 1000, status: 'active', sent: 0};
    store.set('walk', walkSt); runWalk(); renderWalk();
    try { await navigator.wakeLock?.request('screen'); } catch {}
  } catch (e) { alert(e.message); }
};
function runWalk() {
  walkTimers.forEach(clearInterval); walkTimers = [];
  if (!walkSt || walkSt.status !== 'active') return;
  walkTimers.push(setInterval(renderWalk, 1000));
  walkTimers.push(setInterval(() => { if (pos && walkSt) api(`/api/walk/${walkSt.id}/ping`, {lat: pos.lat, lon: pos.lon}).then(syncWalk).catch(() => {}); }, 20000));
  walkTimers.push(setInterval(() => walkSt && api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}), 8000));
}
function syncWalk(w) {
  if (!walkSt) return;
  walkSt.status = w.status; walkSt.sent = w.sent; walkSt.deadline = Date.now() + w.remaining_s * 1000; store.set('walk', walkSt);
  if (w.status !== 'active') { walkTimers.forEach(clearInterval); walkTimers = []; }
  renderWalk(); if (w.status === 'alerted') pollDemo();
}
function renderWalk() {
  const run = !!walkSt; $('#walkSetup').hidden = run; $('#walkRun').hidden = !run; if (!run) return;
  const left = Math.max(0, Math.round((walkSt.deadline - Date.now()) / 1000));
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
  $('#countdown').textContent = walkSt.status === 'active' ? `${mm}:${ss}` : walkSt.status === 'safe' ? '✅' : '🚨';
  $('#walkRun').classList.toggle('alerted', walkSt.status === 'alerted');
  $('#walkMsg').textContent = walkSt.status === 'active' ? t('walkOn') : walkSt.status === 'safe' ? t('walkSafe') : t('walkAlerted', {n: walkSt.sent});
  $('#btnSafe').textContent = walkSt.status === 'active' ? t('imSafe') : t('dismissWalk');
  $('#btnSafe').setAttribute('aria-label', walkSt.status === 'active' ? t('imSafe') : t('dismissWalk'));
  $('#btnExtend').hidden = $('#btnPanic').hidden = walkSt.status !== 'active';
  if (walkSt.status === 'active' && left > 0 && left <= 60 && left % 5 === 0 && navigator.vibrate) navigator.vibrate(250);
  if (walkSt.status === 'active' && left === 0) setTimeout(() => walkSt && api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}), 6000);
}
async function walkAct(action, body) {
  if (!walkSt) return;
  try { syncWalk(await api(`/api/walk/${walkSt.id}/${action}`, body || {})); } catch (e) { alert(e.message); }
}
$('#btnSafe').onclick = async () => {
  if (walkSt && walkSt.status === 'active') await walkAct('safe');
  walkSt = null; store.set('walk', null); walkTimers.forEach(clearInterval); renderWalk();
};
$('#btnExtend').onclick = () => walkAct('extend', {minutes: 10});
$('#btnPanic').onclick = () => walkAct('panic');

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
    for (const key of ['contacts', 'share', 'walk', 'name', 'lastpos', 'nearby',
      'demoSession', 'demoSessionExpires', 'deviceToken', 'locationPrompted']) {
      try { localStorage.removeItem(key); } catch {}
    }
    contacts = []; share = null; walkSt = null; pos = null; nearData = null;
    demoSession = ''; demoSessionExpires = 0; deviceToken = '';
    demoSessionChecked = false; locationPrompted = false; locationRequestStatus = '';
    operatorRequestId++;
    operator = {open: false, pos: null, address: '', lookup: 'idle'};
    stopSpeak();
    $('#yourName').value = ''; $('#operatorPeople').value = ''; $('#operatorEvent').value = '';
    $('#locLine').textContent = '';
    $('#demoBox').hidden = true; $('#sosPanel').hidden = true;
    renderContacts(); renderShare(); renderWalk(); renderLocationIntro(); renderOperator();
    status.textContent = t('deleteSuccess');
  } catch {
    status.textContent = t('deleteFail');
  }
};

/* ------------------------------------------------------------ demo mode box */
async function pollDemo() {
  try {
    const d = await api('/api/demo-log', undefined, 'GET'); demoMode = d.demo_mode;
    $('#demoBox').hidden = !d.demo_mode;
    $('#demoLog').innerHTML = d.messages.slice().reverse().map(m => `<div class="msg">${esc(m.text)}</div>`).join('');
  } catch {}
}
setInterval(pollDemo, 6000);

/* ------------------------------------------------------------ boot */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
loadCards(); applyLang(); pollDemo();
if (share) runShare();
if (walkSt) { if (walkSt.status === 'active') { runWalk(); api(`/api/walk/${walkSt.id}`, undefined, 'GET').then(syncWalk).catch(() => {}); } }
if (pos) $('#locLine').textContent = t('locSaved');
if (navigator.permissions) navigator.permissions.query({name: 'geolocation'}).then(p => { if (p.state === 'granted') locate().catch(() => {}); }).catch(() => {});
