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
    if (this._initialized) return;
    this._initialized = true;
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

    // Return to Home navigation
    document.getElementById("loginBackHomeBtn")?.addEventListener("click", () => {
      window.App.showScreen("onboardingScreen");
      this.clearErrors();
    });

    document.getElementById("regBackHomeBtn")?.addEventListener("click", () => {
      window.App.showScreen("onboardingScreen");
      this.clearErrors();
    });

    document.getElementById("otpHomeBtn")?.addEventListener("click", () => {
      clearInterval(this.otpTimerInterval);
      window.App.showScreen("onboardingScreen");
      this.clearErrors();
    });

    // Login Form Submit (Send OTP)
    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      this.clearErrors();

      const mobileInput = document.getElementById("loginMobile");
      const rawMobile = mobileInput?.value?.trim() || "";
      const mobile = this.cleanMobile(rawMobile);

      if (!mobile) {
        this.showLoginAlert("Please enter your 10-digit mobile number.", "error");
        window.App.showToast("Please enter your mobile number", "error");
        mobileInput?.classList.add("error");
        mobileInput?.focus();
        return;
      }
      if (!this.validateMobile(mobile)) {
        this.showLoginAlert("Please enter a valid 10-digit mobile number.", "error");
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        mobileInput?.classList.add("error");
        mobileInput?.focus();
        return;
      }
      mobileInput?.classList.remove("error");

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
        if (err.isMissingApiUrl || msg.includes("No backend API configured")) {
          this.showConnectionHelper("login");
          window.App.showToast("Backend server not connected", "warning");
          return;
        }
        if (err.isRenderWakingUp || msg.includes("waking up") || msg.includes("starting up")) {
          this.showWakeupNotice("login", () => {
            document.getElementById("loginForm")?.dispatchEvent(new Event("submit", { cancelable: true }));
          });
          window.App.showToast("Server waking up on Render...", "info");
          return;
        }
        if (
          msg.toLowerCase().includes("not registered") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("register first")
        ) {
          this.showLoginAlert("Mobile number is not registered. Redirecting to registration...", "info");
          window.App.showToast("Mobile number not registered", "info");
          const regMobile = document.getElementById("regMobile");
          if (regMobile) regMobile.value = mobile;
          setTimeout(() => {
            window.App.showScreen("registerScreen");
            document.getElementById("regName")?.focus();
          }, 800);
        } else {
          this.showLoginAlert(msg, "error");
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
      this.clearErrors();

      const nameInput = document.getElementById("regName");
      const mobileInput = document.getElementById("regMobile");
      const ageInput = document.getElementById("regAge");

      const name = nameInput?.value?.trim() || "";
      const rawMobile = mobileInput?.value?.trim() || "";
      const mobile = this.cleanMobile(rawMobile);
      const age = parseInt(ageInput?.value, 10);
      const sex = document.getElementById("regSex")?.value;

      if (!name || name.length < 2) {
        this.showRegAlert("Please enter a valid full name (minimum 2 characters).", "error");
        window.App.showToast("Please enter a valid full name", "error");
        nameInput?.classList.add("error");
        nameInput?.focus();
        return;
      }
      nameInput?.classList.remove("error");

      if (!mobile) {
        this.showRegAlert("Please enter your 10-digit mobile number.", "error");
        window.App.showToast("Please enter your mobile number", "error");
        mobileInput?.classList.add("error");
        mobileInput?.focus();
        return;
      }
      if (!this.validateMobile(mobile)) {
        this.showRegAlert("Please enter a valid 10-digit mobile number.", "error");
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        mobileInput?.classList.add("error");
        mobileInput?.focus();
        return;
      }
      mobileInput?.classList.remove("error");

      if (isNaN(age) || age < 1 || age > 120) {
        this.showRegAlert("Please enter a valid age between 1 and 120.", "error");
        window.App.showToast("Please enter a valid age", "error");
        ageInput?.classList.add("error");
        ageInput?.focus();
        return;
      }
      ageInput?.classList.remove("error");

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
        if (err.isMissingApiUrl || msg.includes("No backend API configured")) {
          this.showConnectionHelper("register");
          window.App.showToast("Backend server not connected", "warning");
          return;
        }
        if (err.isRenderWakingUp || msg.includes("waking up") || msg.includes("starting up")) {
          this.showWakeupNotice("register", () => {
            document.getElementById("registerForm")?.dispatchEvent(new Event("submit", { cancelable: true }));
          });
          window.App.showToast("Server waking up on Render...", "info");
          return;
        }
        if (msg.toLowerCase().includes("already registered")) {
          this.showRegAlert("Mobile number is already registered. Redirecting to login...", "info");
          window.App.showToast("Mobile number already registered", "info");
          const loginMobile = document.getElementById("loginMobile");
          if (loginMobile) loginMobile.value = mobile;
          setTimeout(() => {
            window.App.showScreen("loginScreen");
            document.getElementById("loginMobile")?.focus();
          }, 800);
        } else {
          this.showRegAlert(msg, "error");
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
        
        if (res && res.delivery_mode === "mock" && res.dev_otp) {
          const devCard = document.getElementById("devOtpCard");
          const devCodeEl = document.getElementById("devOtpCodeDisplay");
          if (devCodeEl) devCodeEl.textContent = res.dev_otp;
          if (devCard) devCard.style.display = "block";
          this.showAlert("Demo verification code refreshed. Use test OTP: " + res.dev_otp, "info");
        } else {
          const devCard = document.getElementById("devOtpCard");
          const devCodeEl = document.getElementById("devOtpCodeDisplay");
          if (devCodeEl) devCodeEl.textContent = "";
          if (devCard) devCard.style.display = "none";
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

    // Auto-fill Test Code Helper (Demo Mode only)
    document.getElementById("autoFillOtpBtn")?.addEventListener("click", () => {
      const devCard = document.getElementById("devOtpCard");
      if (!devCard || devCard.style.display === "none") return;
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

    // DEMO MODE Banner (Displayed ONLY when backend explicitly reports delivery_mode: 'mock')
    const devCard = document.getElementById("devOtpCard");
    const devCodeEl = document.getElementById("devOtpCodeDisplay");
    if (response && response.delivery_mode === "mock" && response.dev_otp) {
      if (devCodeEl) devCodeEl.textContent = response.dev_otp;
      if (devCard) devCard.style.display = "block";
    } else {
      if (devCodeEl) devCodeEl.textContent = "";
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

  showLoginAlert(message, type = "error") {
    const alertBox = document.getElementById("loginAlertBox");
    if (!alertBox) return;
    if (!message) {
      alertBox.style.display = "none";
      alertBox.textContent = "";
      return;
    }
    alertBox.textContent = message;
    alertBox.className = `otp-alert-box ${type}`;
    alertBox.style.display = "block";
  }

  showRegAlert(message, type = "error") {
    const alertBox = document.getElementById("regAlertBox");
    if (!alertBox) return;
    if (!message) {
      alertBox.style.display = "none";
      alertBox.textContent = "";
      return;
    }
    alertBox.textContent = message;
    alertBox.className = `otp-alert-box ${type}`;
    alertBox.style.display = "block";
  }

  showConnectionHelper(screenType = "login") {
    const alertBox = document.getElementById(screenType === "login" ? "loginAlertBox" : "regAlertBox");
    if (!alertBox) return;

    alertBox.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.88rem; color: #92400e; display: flex; align-items: center; gap: 6px;">
        <span>🔌</span> FastAPI Backend Connection Required
      </div>
      <p style="font-size: 0.8rem; margin-bottom: 8px; line-height: 1.4; color: #78350f;">
        The frontend cannot register or log in without connecting to your deployed FastAPI backend server on Render.
      </p>
      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <input type="url" id="manualConnectInput_${screenType}" class="form-input" style="font-size: 0.82rem; padding: 6px 10px; flex: 1; background: #ffffff;" placeholder="https://your-service.onrender.com" value="${window.API?.baseUrl || ''}">
        <button type="button" id="manualConnectBtn_${screenType}" class="btn btn-primary" style="white-space: nowrap; padding: 6px 12px; font-size: 0.8rem;">Connect Server</button>
      </div>
      <div id="manualConnectStatus_${screenType}" style="display: none; font-size: 0.78rem; margin-bottom: 6px; font-weight: 600;"></div>
      <p style="font-size: 0.73rem; color: var(--text-muted); margin: 0; line-height: 1.35;">
        💡 <em>To permanently wire your backend for all visitors, set <code>VITE_API_BASE_URL</code> in GitHub Repository Settings &rarr; Secrets and variables &rarr; Actions &rarr; Variables.</em>
      </p>
    `;
    alertBox.className = "otp-alert-box warning";
    alertBox.style.display = "block";

    const btn = document.getElementById(`manualConnectBtn_${screenType}`);
    const input = document.getElementById(`manualConnectInput_${screenType}`);
    const statusEl = document.getElementById(`manualConnectStatus_${screenType}`);

    btn?.addEventListener("click", async () => {
      let url = input?.value?.trim().replace(/\/+$/, "") || "";
      if (!url) {
        if (statusEl) {
          statusEl.style.display = "block";
          statusEl.style.color = "var(--status-danger)";
          statusEl.textContent = "Please enter your Render HTTPS backend URL.";
        }
        return;
      }
      if (!url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
        url = "https://" + url;
        if (input) input.value = url;
      }

      btn.disabled = true;
      btn.textContent = "Connecting...";
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.style.color = "var(--primary-teal-dark)";
        statusEl.textContent = "Checking /api/health...";
      }

      const health = await window.API.checkHealth(url);
      if (health.ok) {
        window.API.setBaseUrl(url);
        if (statusEl) {
          statusEl.style.color = "var(--status-normal)";
          statusEl.textContent = "✅ Connected to Arogya Lens API! Retrying request...";
        }
        window.App.showToast("Backend connected successfully!", "success");
        setTimeout(() => {
          alertBox.style.display = "none";
          if (screenType === "login") {
            document.getElementById("loginForm")?.dispatchEvent(new Event("submit", { cancelable: true }));
          } else {
            document.getElementById("registerForm")?.dispatchEvent(new Event("submit", { cancelable: true }));
          }
        }, 800);
      } else {
        btn.disabled = false;
        btn.textContent = "Connect Server";
        if (statusEl) {
          statusEl.style.color = "var(--status-danger)";
          statusEl.textContent = `❌ Could not reach ${url}/api/health. Please verify your Render service is running.`;
        }
      }
    });
  }

  showWakeupNotice(screenType = "login", onRetryCallback) {
    const alertBox = document.getElementById(screenType === "login" ? "loginAlertBox" : "regAlertBox");
    if (!alertBox) return;

    alertBox.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.88rem; color: #92400e; display: flex; align-items: center; gap: 6px;">
        <span>⏳</span> Cloud Server is Waking Up
      </div>
      <p style="font-size: 0.8rem; margin-bottom: 8px; line-height: 1.4; color: #78350f;">
        Render free-tier instances sleep after 15 minutes of inactivity and take 30–50 seconds to resume. Please wait a moment while the server starts.
      </p>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button type="button" id="wakeupRetryBtn_${screenType}" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem;">
          Retry Connection
        </button>
        <span id="wakeupStatus_${screenType}" style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);"></span>
      </div>
    `;
    alertBox.className = "otp-alert-box warning";
    alertBox.style.display = "block";

    const retryBtn = document.getElementById(`wakeupRetryBtn_${screenType}`);
    const statusText = document.getElementById(`wakeupStatus_${screenType}`);

    retryBtn?.addEventListener("click", async () => {
      retryBtn.disabled = true;
      retryBtn.textContent = "Pinging Server...";
      if (statusText) statusText.textContent = "Checking /api/health...";

      const health = await window.API.checkHealth();
      if (health.ok) {
        if (statusText) statusText.textContent = "Server is online!";
        window.App.showToast("Server online! Retrying request...", "success");
        setTimeout(() => {
          alertBox.style.display = "none";
          if (typeof onRetryCallback === "function") {
            onRetryCallback();
          }
        }, 500);
      } else {
        retryBtn.disabled = false;
        retryBtn.textContent = "Retry Connection";
        if (statusText) statusText.textContent = "Still waking up... please wait a few seconds.";
      }
    });
  }

  clearErrors() {
    document.querySelectorAll(".otp-digit-input").forEach((i) => i.classList.remove("error"));
    this.clearAlert();
    this.showLoginAlert("", "none");
    this.showRegAlert("", "none");
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

  cleanMobile(raw) {
    if (!raw) return "";
    let clean = String(raw).replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.slice(2);
    }
    return clean;
  }

  validateMobile(num) {
    const clean = this.cleanMobile(num);
    return clean.length >= 10 && clean.length <= 15;
  }
}

window.Auth = new AuthManager();

// Defensive initialization across script loading orders
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.Auth.init();
  });
} else {
  window.Auth.init();
}
