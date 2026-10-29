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
    otp_subtext: "Verification code for",
    resend_otp: "Resend Code",
    verify_btn: "Verify & Continue",
    scan_tab: "Scan",
    home_tab: "Home",
    dashboard_tab: "Dashboard",
    history_tab: "History",
    profile_tab: "Profile",
    disclaimer_notice: "Medical Notice: Arogya Lens is a non-invasive screening tool. It does not replace laboratory blood tests (CBC) or clinical diagnosis.",
    start_screening: "Start 4-Point Screening",
    step_left_eye: "Step 1 of 4: Left Eye",
    step_right_eye: "Step 2 of 4: Right Eye",
    step_left_thumb: "Step 3 of 4: Left Thumb",
    step_right_thumb: "Step 4 of 4: Right Thumb",
    align_left_eye_instruction: "Gently pull down lower eyelid of your LEFT eye to expose the pink conjunctiva. Align inside the guide.",
    align_right_eye_instruction: "Gently pull down lower eyelid of your RIGHT eye to expose the pink conjunctiva. Align inside the guide.",
    align_left_thumb_instruction: "Place your LEFT thumb nail bed flat inside the oval guide under bright, even light.",
    align_right_thumb_instruction: "Place your RIGHT thumb nail bed flat inside the oval guide under bright, even light.",
    position_eye: "Position eye in frame",
    position_thumb: "Position thumb nail bed in frame",
    hold_steady: "Hold steady...",
    target_aligned: "Target Aligned & Ready",
    capture_photo: "Capture",
    review_title: "Review 4-Point Scans",
    review_subtext: "Inspect all 4 scans before running AI biomarker analysis",
    retake_step: "Retake",
    analyze_all_btn: "Analyze All 4 Scans",
    analyzing_title: "Analyzing 4-Point Scans...",
    analyzing_subtext: "Extracting optical biomarkers from bilateral conjunctiva & nail beds",
    results_title: "Screening Assessment",
    estimated_hb: "Estimated Hb",
    hb_unit: "g/dL",
    confidence: "Optical Confidence",
    status_likely_normal: "Likely Normal",
    status_possible_anemia: "Possible Anaemia",
    status_high_risk: "High Risk / Severe Deficiency",
    status_low_confidence: "Low Confidence (Retake Recommended)",
    status_image_failed: "Image Quality Failed",
    view_dashboard_btn: "Continue to Dashboard",
    retake: "Start New Screening",
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
    otp_subtext: "सत्यापन कोड:",
    resend_otp: "पुनः भेजें",
    verify_btn: "सत्यापित करें और आगे बढ़ें",
    scan_tab: "स्कैन",
    home_tab: "होम",
    dashboard_tab: "डैशबोर्ड",
    history_tab: "इतिहास",
    profile_tab: "प्रोफाइल",
    disclaimer_notice: "चिकित्सा सूचना: आरोग्य लेंस एक गैर-आक्रामक स्क्रीनिंग उपकरण है। यह प्रयोगशाला रक्त परीक्षण (CBC) या चिकित्सीय निदान का विकल्प नहीं है।",
    start_screening: "4-बिंदु स्क्रीनिंग शुरू करें",
    step_left_eye: "चरण 1/4: बायीं आँख",
    step_right_eye: "चरण 2/4: दायीं आँख",
    step_left_thumb: "चरण 3/4: बायाँ अँगूठा",
    step_right_thumb: "चरण 4/4: दायाँ अँगूठा",
    align_left_eye_instruction: "गुलाबी कंजंक्टिवा दिखाने के लिए अपनी बायीं आँख की निचली पलक को नीचे खींचें। गाइड में संरेखित करें।",
    align_right_eye_instruction: "गुलाबी कंजंक्टिवा दिखाने के लिए अपनी दायीं आँख की निचली पलक को नीचे खींचें। गाइड में संरेखित करें।",
    align_left_thumb_instruction: "अपने बाएं अंगूठे के नाखून को अच्छी रोशनी में अंडाकार गाइड के अंदर सीधा रखें।",
    align_right_thumb_instruction: "अपने दाएं अंगूठे के नाखून को अच्छी रोशनी में अंडाकार गाइड के अंदर सीधा रखें।",
    position_eye: "फ्रेम में आँख रखें",
    position_thumb: "फ्रेम में अँगूठे का नाखून रखें",
    hold_steady: "स्थिर रखें...",
    target_aligned: "संरेखण पूर्ण",
    capture_photo: "फोटो लें",
    review_title: "4-बिंदु स्कैन की समीक्षा करें",
    review_subtext: "एआई बायोमार्कर विश्लेषण से पहले सभी 4 स्कैन की जांच करें",
    retake_step: "पुनः लें",
    analyze_all_btn: "सभी 4 स्कैन का विश्लेषण करें",
    analyzing_title: "4-बिंदु स्कैन का विश्लेषण हो रहा है...",
    analyzing_subtext: "दोनों आँखों की कंजंक्टिवा और दोनों अँगूठों के नाखूनों से बायोमार्कर निकाले जा रहे हैं",
    results_title: "स्क्रीनिंग परिणाम",
    estimated_hb: "अनुमानित हीमोग्लोबिन",
    hb_unit: "g/dL",
    confidence: "ऑप्टिकल विश्वास",
    status_likely_normal: "संभावित सामान्य",
    status_possible_anemia: "संभावित एनीमिया",
    status_high_risk: "उच्च जोखिम / गंभीर कमी",
    status_low_confidence: "कम विश्वसनीयता (पुनः प्रयास करें)",
    status_image_failed: "छवि गुणवत्ता विफल",
    view_dashboard_btn: "डैशबोर्ड पर आगे बढ़ें",
    retake: "नई स्क्रीनिंग शुरू करें",
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
