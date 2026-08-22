/**
 * Arogya Lens — Bilingual Dictionary (English / Hindi)
 */

const I18N_DICTIONARY = {
  en: {
    app_title: "Arogya Lens",
    subtitle: "AI-Powered Non-Invasive Anaemia Screening",
    welcome: "Welcome",
    login: "Log In",
    register: "Register",
    phone_number: "Mobile Number",
    phone_placeholder: "Enter 10-digit mobile",
    name: "Full Name",
    name_placeholder: "e.g. Priya Sharma",
    age: "Age (Years)",
    sex: "Sex",
    male: "Male",
    female: "Female",
    other: "Other",
    send_otp: "Send OTP",
    verify_otp: "Verify OTP",
    otp_label: "Enter 6-Digit Code",
    otp_subtext: "Code sent to your mobile number",
    resend_otp: "Resend Code",
    verify_btn: "Verify & Continue",
    scan_tab: "Scan",
    home_tab: "Home",
    dashboard_tab: "Dashboard",
    history_tab: "History",
    profile_tab: "Profile",
    disclaimer_notice: "Medical Notice: Arogya Lens is a non-invasive screening tool. It does not replace laboratory blood tests (CBC) or clinical diagnosis.",
    start_screening: "Start Eye Scan",
    align_eye_title: "Eye Alignment",
    align_instruction: "Gently pull down your lower eyelid to reveal the inner pink conjunctiva. Align inside the guide.",
    position_eye: "Position eye in frame",
    hold_steady: "Hold steady...",
    eye_detected: "Eye Detected & Aligned",
    capture_photo: "Capture Scan",
    analyzing_title: "Analyzing Eye Image...",
    analyzing_subtext: "Extracting optical conjunctiva features & estimating Hemoglobin",
    results_title: "Screening Assessment",
    estimated_hb: "Estimated Hb",
    hb_unit: "g/dL",
    confidence: "Optical Confidence",
    status_likely_normal: "Likely Normal",
    status_possible_anemia: "Possible Anaemia",
    status_high_risk: "High Risk / Severe Deficiency",
    status_low_confidence: "Low Confidence (Retake Recommended)",
    status_image_failed: "Image Quality Failed",
    symptoms_title: "Reported Symptoms",
    symptoms_sub: "Select any symptoms you are currently experiencing",
    sym_fatigue: "Fatigue & Weakness",
    sym_dizziness: "Dizziness / Lightheaded",
    sym_pale_skin: "Pale Skin / Nails",
    sym_cold_hands: "Cold Hands & Feet",
    sym_shortness_breath: "Shortness of Breath",
    sym_headache: "Frequent Headaches",
    sym_none: "No Symptoms",
    save_continue: "Save & View Dashboard",
    retake: "Retake Scan",
    recent_history: "Recent Screenings",
    total_screenings: "Total Scans",
    average_hb: "Average Hb",
    latest_status: "Latest Status",
    hb_trend: "Hemoglobin Trend",
    logout: "Log Out",
    edit_profile: "Edit Profile"
  },
  hi: {
    app_title: "आरोग्य लेंस",
    subtitle: "एआई-संचालित गैर-आक्रामक एनीमिया स्क्रीनिंग",
    welcome: "नमस्ते",
    login: "लॉग इन करें",
    register: "पंजीकरण करें",
    phone_number: "मोबाइल नंबर",
    phone_placeholder: "10-अंकों का मोबाइल नंबर दर्ज करें",
    name: "पूरा नाम",
    name_placeholder: "उदा. प्रिया शर्मा",
    age: "आयु (वर्ष)",
    sex: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    send_otp: "ओटीपी भेजें",
    verify_otp: "ओटीपी सत्यापित करें",
    otp_label: "6-अंकों का कोड दर्ज करें",
    otp_subtext: "आपके मोबाइल नंबर पर कोड भेजा गया है",
    resend_otp: "पुनः भेजें",
    verify_btn: "सत्यापित करें और आगे बढ़ें",
    scan_tab: "स्कैन",
    home_tab: "होम",
    dashboard_tab: "डैशबोर्ड",
    history_tab: "इतिहास",
    profile_tab: "प्रोफाइल",
    disclaimer_notice: "चिकित्सा सूचना: आरोग्य लेंस एक गैर-आक्रामक स्क्रीनिंग उपकरण है। यह प्रयोगशाला रक्त परीक्षण (CBC) या चिकित्सीय निदान का विकल्प नहीं है।",
    start_screening: "आँख की जाँच शुरू करें",
    align_eye_title: "आँख का संरेखण",
    align_instruction: "भीतरी गुलाबी कंजंक्टिवा देखने के लिए निचली पलक को धीरे से नीचे खींचें। गाइड के अंदर संरेखित करें।",
    position_eye: "फ्रेम में आँख रखें",
    hold_steady: "स्थिर रखें...",
    eye_detected: "आँख संरेखित हो गई",
    capture_photo: "फोटो खींचें",
    analyzing_title: "छवि का विश्लेषण हो रहा है...",
    analyzing_subtext: "कंजंक्टिवा विशेषताओं का विश्लेषण और हीमोग्लोबिन का अनुमान लगाया जा रहा है",
    results_title: "स्क्रीनिंग परिणाम",
    estimated_hb: "अनुमानित हीमोग्लोबिन",
    hb_unit: "g/dL",
    confidence: "ऑप्टिकल विश्वास",
    status_likely_normal: "संभावित सामान्य",
    status_possible_anemia: "संभावित एनीमिया",
    status_high_risk: "उच्च जोखिम / गंभीर कमी",
    status_low_confidence: "कम विश्वसनीयता (पुनः प्रयास करें)",
    status_image_failed: "छवि गुणवत्ता विफल",
    symptoms_title: "लक्षण दर्ज करें",
    symptoms_sub: "कृपया अनुभव किए जा रहे लक्षणों का चयन करें",
    sym_fatigue: "थकान और कमजोरी",
    sym_dizziness: "चक्कर आना",
    sym_pale_skin: "त्वचा या नाखूनों का पीलापन",
    sym_cold_hands: "हाथ-पैर ठंडे रहना",
    sym_shortness_breath: "सांस फूलना",
    sym_headache: "सिरदर्द",
    sym_none: "कोई लक्षण नहीं",
    save_continue: "सहेजें और डैशबोर्ड देखें",
    retake: "फिर से स्कैन करें",
    recent_history: "हाल की जांच",
    total_screenings: "कुल जांच",
    average_hb: "औसत एचबी",
    latest_status: "नवीनतम स्थिति",
    hb_trend: "हीमोग्लोबिन प्रगति चार्ट",
    logout: "लॉग आउट",
    edit_profile: "प्रोफ़ाइल संपादित करें"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem(window.CONFIG?.STORAGE_LANG_KEY || "arogya_lens_lang") || "en";
  }

  t(key) {
    return I18N_DICTIONARY[this.currentLang]?.[key] || I18N_DICTIONARY["en"]?.[key] || key;
  }

  setLanguage(lang) {
    if (I18N_DICTIONARY[lang]) {
      this.currentLang = lang;
      localStorage.setItem(window.CONFIG?.STORAGE_LANG_KEY || "arogya_lens_lang", lang);
      this.updateDOM();
    }
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang === "en" ? "hi" : "en");
  }

  updateDOM() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const translation = this.t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.getAttribute("placeholder")) el.setAttribute("placeholder", translation);
      } else {
        el.textContent = translation;
      }
    });

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.textContent = this.currentLang === "en" ? "हिन्दी" : "English";
    }
  }
}

window.I18N = new I18nManager();
