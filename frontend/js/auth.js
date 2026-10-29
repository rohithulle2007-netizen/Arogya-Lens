/**
 * Arogya Lens — Authentication Controller
 * Mobile OTP sign-in, account registration, 6-box OTP input,
 * paste navigation, resend countdown, and session persistence.
 */

class AuthManager {
  constructor() {
    this.pendingMobile = null;
    this.authMode = "login"; // "login" | "register"
    this.cachedRegistrationData = null;
    this.otpTimerInterval = null;
    this.remainingSeconds = 0;
  }

  init() {
    this.bindEvents();
    this.setupOtpInputBehaviors();
  }

  bindEvents() {
    // Navigate between Login and Register screens
    document.getElementById("goToRegisterBtn")?.addEventListener("click", () => {
      window.App.showScreen("registerScreen");
      this.clearErrors();
    });

    document.getElementById("goToLoginBtn")?.addEventListener("click", () => {
      window.App.showScreen("loginScreen");
      this.clearErrors();
    });

    // Login Form Submit (Send OTP)
    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mobileInput = document.getElementById("loginMobile");
      const mobile = mobileInput?.value?.trim();

      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        mobileInput?.focus();
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || "Send OTP";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Checking...";
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.sendOtp(mobile);
        this.openOtpScreen({ mobile, mode: "login", response: res });
      } catch (err) {
        const msg = err.message || "Failed to send OTP";
        if (
          msg.toLowerCase().includes("not registered") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("register first")
        ) {
          window.App.showToast("Mobile number not registered. Redirecting to registration...", "info");
          const regMobile = document.getElementById("regMobile");
          if (regMobile) regMobile.value = mobile;
          setTimeout(() => {
            window.App.showScreen("registerScreen");
            document.getElementById("regName")?.focus();
          }, 800);
        } else {
          window.App.showToast(msg, "error");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        window.App.showLoading(false);
      }
    });

    // Registration Form Submit (Send OTP & Register)
    document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("regName")?.value?.trim();
      const mobile = document.getElementById("regMobile")?.value?.trim();
      const age = parseInt(document.getElementById("regAge")?.value, 10);
      const sex = document.getElementById("regSex")?.value;

      if (!name || name.length < 2) {
        window.App.showToast("Please enter a valid full name (minimum 2 characters)", "error");
        document.getElementById("regName")?.focus();
        return;
      }
      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        document.getElementById("regMobile")?.focus();
        return;
      }
      if (!age || age < 1 || age > 120) {
        window.App.showToast("Please enter a valid age (1-120)", "error");
        document.getElementById("regAge")?.focus();
        return;
      }

      this.cachedRegistrationData = { name, mobile_number: mobile, age, sex };

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || "Send OTP & Register";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating profile...";
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.register(this.cachedRegistrationData);
        this.openOtpScreen({ mobile, mode: "register", response: res });
      } catch (err) {
        const msg = err.message || "Registration failed";
        if (msg.toLowerCase().includes("already registered")) {
          window.App.showToast("Mobile number is already registered. Redirecting to login...", "info");
          const loginMobile = document.getElementById("loginMobile");
          if (loginMobile) loginMobile.value = mobile;
          setTimeout(() => {
            window.App.showScreen("loginScreen");
            document.getElementById("loginMobile")?.focus();
          }, 800);
        } else {
          window.App.showToast(msg, "error");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        window.App.showLoading(false);
      }
    });

    // Verify OTP Button
    document.getElementById("verifyOtpBtn")?.addEventListener("click", () => {
      this.handleVerify();
    });

    // Resend OTP Button with countdown protection
    document.getElementById("resendOtpBtn")?.addEventListener("click", async () => {
      const btn = document.getElementById("resendOtpBtn");
      if (btn?.disabled || !this.pendingMobile) return;

      btn.disabled = true;
      this.clearErrors();

      try {
        window.App.showLoading(true);
        const res = await window.API.sendOtp(this.pendingMobile);
        
        if (res.dev_otp) {
          const devCodeEl = document.getElementById("devOtpCodeDisplay");
          if (devCodeEl) devCodeEl.textContent = res.dev_otp;
          this.showAlert("A new development test code has been generated.", "success");
        } else {
          this.showAlert("A new verification code has been dispatched via SMS.", "success");
        }

        // Clear boxes and focus first input
        this.clearOtpBoxes();
        this.startOtpTimer(res.cooldown_seconds || 30);
      } catch (err) {
        this.showAlert(err.message || "Failed to resend OTP. Please try again.", "error");
        btn.disabled = false;
      } finally {
        window.App.showLoading(false);
      }
    });

    // Change Mobile / Return to previous form
    const handleChangeMobile = () => {
      clearInterval(this.otpTimerInterval);
      if (this.authMode === "register") {
        window.App.showScreen("registerScreen");
        document.getElementById("regMobile")?.focus();
      } else {
        window.App.showScreen("loginScreen");
        document.getElementById("loginMobile")?.focus();
      }
    };

    document.getElementById("changeMobileBtn")?.addEventListener("click", handleChangeMobile);
    document.getElementById("otpBackBtn")?.addEventListener("click", handleChangeMobile);
  }

  setupOtpInputBehaviors() {
    const inputs = Array.from(document.querySelectorAll(".otp-digit-input"));
    if (!inputs.length) return;

    inputs.forEach((input, index) => {
      // 1. Numeric Input & Auto-Progression
      input.addEventListener("input", (e) => {
        const cleaned = input.value.replace(/\D/g, "");
        input.value = cleaned ? cleaned.slice(0, 1) : "";

        if (input.value) {
          input.classList.add("filled");
          input.classList.remove("error");
          this.clearAlert();

          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
          }
        } else {
          input.classList.remove("filled");
        }
      });

      // 2. Backspace & Arrow Navigation
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          if (!input.value && index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].value = "";
            inputs[index - 1].classList.remove("filled");
            e.preventDefault();
          } else {
            input.classList.remove("filled");
          }
        } else if (e.key === "ArrowLeft" && index > 0) {
          inputs[index - 1].focus();
          e.preventDefault();
        } else if (e.key === "ArrowRight" && index < inputs.length - 1) {
          inputs[index + 1].focus();
          e.preventDefault();
        } else if (e.key === "Enter") {
          this.handleVerify();
        }
      });

      // 3. Paste Support across all 6 boxes
      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData?.getData("text") || "";
        const digits = pastedText.replace(/\D/g, "").slice(0, 6);

        if (!digits) return;

        inputs.forEach((box, i) => {
          if (i < digits.length) {
            box.value = digits[i];
            box.classList.add("filled");
            box.classList.remove("error");
          } else {
            box.value = "";
            box.classList.remove("filled");
          }
        });

        this.clearAlert();
        const nextIndex = Math.min(digits.length, inputs.length - 1);
        inputs[nextIndex].focus();
      });
    });

    // Auto-fill Test Code Helper (Dev Mode only)
    document.getElementById("autoFillOtpBtn")?.addEventListener("click", () => {
      const code = document.getElementById("devOtpCodeDisplay")?.textContent?.trim() || "123456";
      inputs.forEach((box, i) => {
        box.value = code[i] || "";
        box.classList.add("filled");
        box.classList.remove("error");
      });
      this.clearAlert();
      inputs[inputs.length - 1]?.focus();
    });
  }

  async handleVerify() {
    const inputs = Array.from(document.querySelectorAll(".otp-digit-input"));
    let otp = "";
    let hasEmpty = false;

    inputs.forEach((input) => {
      const val = input.value.trim();
      otp += val;
      if (!val) {
        input.classList.add("error");
        hasEmpty = true;
      }
    });

    if (otp.length !== 6 || hasEmpty) {
      this.showAlert("Please enter the complete 6-digit verification code.", "error");
      const firstEmpty = inputs.find((i) => !i.value.trim());
      firstEmpty?.focus();
      return;
    }

    const verifyBtn = document.getElementById("verifyOtpBtn");
    const spinner = document.getElementById("verifyBtnSpinner");
    const btnText = document.getElementById("verifyBtnText");

    if (verifyBtn) verifyBtn.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Verifying...";
    this.clearAlert();

    try {
      window.App.showLoading(true);
      const res = await window.API.verifyOtp(this.pendingMobile, otp);
      window.API.setToken(res.access_token);

      // Stop timer
      clearInterval(this.otpTimerInterval);

      // Post-verification flow
      if (this.authMode === "register") {
        window.App.showToast("Account created & verified! Welcome to Arogya Lens.", "success");
      } else {
        const userName = res.profile?.name || res.user?.name || "Patient";
        window.App.showToast(`Welcome back, ${userName}!`, "success");
      }

      await window.App.loadUserSession();
      window.App.showScreen("homeScreen");
    } catch (err) {
      // Mark boxes with error state and shake animation
      inputs.forEach((box) => box.classList.add("error"));
      this.showAlert(err.message || "Invalid or expired OTP. Please try again.", "error");
      inputs[0]?.focus();
    } finally {
      if (verifyBtn) verifyBtn.disabled = false;
      if (spinner) spinner.style.display = "none";
      if (btnText) btnText.textContent = "Verify OTP & Continue";
      window.App.showLoading(false);
    }
  }

  openOtpScreen({ mobile, mode = "login", response = null }) {
    this.pendingMobile = mobile;
    this.authMode = mode;

    // Display masked mobile number: only last 4 digits visible
    const sentMobileEl = document.getElementById("otpSentMobile");
    if (sentMobileEl) {
      sentMobileEl.textContent = this.maskMobile(mobile);
    }

    // Configure mode badge & screen title
    const modeBadge = document.getElementById("otpModeBadge");
    if (modeBadge) {
      modeBadge.textContent = mode === "register" ? "New Account" : "Sign In";
    }

    const titleEl = document.getElementById("otpScreenTitle");
    if (titleEl) {
      titleEl.textContent = mode === "register" ? "Verify & Register" : "Verify Mobile";
    }

    // Dev / Demo Mode Notice
    const devCard = document.getElementById("devOtpCard");
    const devCodeEl = document.getElementById("devOtpCodeDisplay");
    if (response && response.delivery_mode === "mock" && response.dev_otp) {
      if (devCodeEl) devCodeEl.textContent = response.dev_otp;
      if (devCard) devCard.style.display = "block";
    } else {
      if (devCard) devCard.style.display = "none";
    }

    // Reset OTP boxes
    this.clearOtpBoxes();
    this.clearAlert();

    // Transition directly to OTP Screen without misleading SMS toast
    window.App.showScreen("otpScreen");

    // Focus first input box
    const firstInput = document.querySelector(".otp-digit-input");
    setTimeout(() => firstInput?.focus(), 150);

    // Start Resend countdown timer
    this.startOtpTimer(response?.cooldown_seconds || 30);
  }

  startOtpTimer(seconds = 30) {
    clearInterval(this.otpTimerInterval);
    this.remainingSeconds = seconds;

    const resendBtn = document.getElementById("resendOtpBtn");
    const timerText = document.getElementById("otpCountdownTimer");

    if (resendBtn) resendBtn.disabled = true;
    if (timerText) timerText.textContent = `(${this.remainingSeconds}s)`;

    this.otpTimerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.otpTimerInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (timerText) timerText.textContent = "";
      } else {
        if (timerText) timerText.textContent = `(${this.remainingSeconds}s)`;
      }
    }, 1000);
  }

  maskMobile(mobile) {
    if (!mobile) return "";
    const clean = mobile.replace(/\D/g, "");
    const last4 = clean.slice(-4);
    return `+91 ******${last4}`;
  }

  clearOtpBoxes() {
    const inputs = document.querySelectorAll(".otp-digit-input");
    inputs.forEach((i) => {
      i.value = "";
      i.classList.remove("filled", "error");
    });
  }

  clearErrors() {
    document.querySelectorAll(".otp-digit-input").forEach((i) => i.classList.remove("error"));
    this.clearAlert();
  }

  showAlert(message, type = "error") {
    const alertBox = document.getElementById("otpAlertBox");
    if (!alertBox) return;

    if (!message) {
      alertBox.style.display = "none";
      alertBox.className = "otp-alert-box";
      alertBox.textContent = "";
      return;
    }

    alertBox.textContent = message;
    alertBox.className = `otp-alert-box ${type}`;
    alertBox.style.display = "block";
  }

  clearAlert() {
    this.showAlert("", "none");
  }

  validateMobile(num) {
    return /^[6-9]\d{9}$/.test(num);
  }

  async demoLogin() {
    const demoMobile = "9876543210";
    try {
      window.App.showLoading(true);
      let backendReachable = false;
      const apiUrl = window.CONFIG?.API_BASE_URL;

      if (apiUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const ping = await fetch(`${apiUrl}/api/health`, { method: "GET", signal: controller.signal });
          clearTimeout(timeoutId);
          if (ping.ok) backendReachable = true;
        } catch (e) {
          backendReachable = false;
        }
      }

      if (backendReachable) {
        try {
          await window.API.sendOtp(demoMobile);
        } catch (e) {
          try {
            await window.API.register({
              name: "Priya Sharma",
              mobile_number: demoMobile,
              age: 28,
              sex: "female",
            });
          } catch (regErr) {
            console.log("Demo user existing/ready:", regErr.message);
          }
          await window.API.sendOtp(demoMobile);
        }

        const res = await window.API.verifyOtp(demoMobile, "123456");
        window.API.setToken(res.access_token);
        window.API.disableDemoMode();
        window.App.showToast("Logged in to Live Server (Priya Sharma)", "success");
      } else {
        // Run full offline / GitHub Pages demo mode
        window.API.enableDemoMode();
        window.App.showToast("Interactive Demo Mode Activated (No backend required)", "success");
      }

      await window.App.loadUserSession();
      window.App.showScreen("homeScreen");
    } catch (err) {
      window.API.enableDemoMode();
      window.App.showToast("Interactive Demo Mode Activated", "info");
      await window.App.loadUserSession();
      window.App.showScreen("homeScreen");
    } finally {
      window.App.showLoading(false);
    }
  }
}

window.Auth = new AuthManager();
