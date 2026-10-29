/**
 * Arogya Lens — Authentication Controller
 * Mobile OTP sign-in, account registration, input validation & countdown timer
 */

class AuthManager {
  constructor() {
    this.pendingMobile = null;
    this.otpTimerInterval = null;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Navigate between Login and Register
    document.getElementById("goToRegisterBtn")?.addEventListener("click", () => {
      window.App.showScreen("registerScreen");
    });

    document.getElementById("goToLoginBtn")?.addEventListener("click", () => {
      window.App.showScreen("loginScreen");
    });

    // Login Form Submit (Send OTP)
    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mobileInput = document.getElementById("loginMobile");
      const mobile = mobileInput?.value?.trim();

      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.sendOtp(mobile);
        window.App.showToast(res.message || "OTP sent successfully! (Demo: 123456)", "success");
        this.openOtpScreen(mobile);
      } catch (err) {
        const msg = err.message || "Failed to send OTP";
        if (msg.toLowerCase().includes("not registered") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("register")) {
          window.App.showToast("Mobile number not registered. Redirecting to registration...", "info");
          const regMobile = document.getElementById("regMobile");
          if (regMobile) regMobile.value = mobile;
          setTimeout(() => window.App.showScreen("registerScreen"), 1200);
        } else {
          window.App.showToast(msg, "error");
        }
      } finally {
        window.App.showLoading(false);
      }
    });

    // Registration (Create Account & Send OTP)
    document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("regName")?.value?.trim();
      const mobile = document.getElementById("regMobile")?.value?.trim();
      const age = parseInt(document.getElementById("regAge")?.value, 10);
      const sex = document.getElementById("regSex")?.value;

      if (!name || name.length < 2) {
        window.App.showToast("Please enter a valid full name", "error");
        return;
      }
      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        return;
      }
      if (!age || age < 1 || age > 120) {
        window.App.showToast("Please enter a valid age (1-120)", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.register({ name, mobile_number: mobile, age, sex });
        window.App.showToast("Account created! Verification OTP sent.", "success");
        this.openOtpScreen(mobile);
      } catch (err) {
        window.App.showToast(err.message || "Registration failed", "error");
      } finally {
        window.App.showLoading(false);
      }
    });

    // OTP Digit Inputs Auto-Focus / Progression
    const otpInputs = document.querySelectorAll(".otp-digit-input");
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        if (input.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    // Auto-fill Test OTP button helper
    document.getElementById("autoFillOtpBtn")?.addEventListener("click", () => {
      const testCode = ["1", "2", "3", "4", "5", "6"];
      otpInputs.forEach((input, i) => {
        input.value = testCode[i] || "";
      });
      otpInputs[otpInputs.length - 1]?.focus();
    });

    // Verify OTP Button
    document.getElementById("verifyOtpBtn")?.addEventListener("click", async () => {
      let otp = "";
      otpInputs.forEach(i => otp += i.value);

      if (otp.length !== 6) {
        window.App.showToast("Please enter the complete 6-digit OTP", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.verifyOtp(this.pendingMobile, otp);
        window.API.setToken(res.access_token);
        window.App.showToast("Verified successfully! Welcome to Arogya Lens.", "success");

        await window.App.loadUserSession();
        window.App.showScreen("homeScreen");
      } catch (err) {
        window.App.showToast(err.message || "Invalid or expired OTP", "error");
      } finally {
        window.App.showLoading(false);
      }
    });

    // Resend OTP
    document.getElementById("resendOtpBtn")?.addEventListener("click", async () => {
      if (!this.pendingMobile) return;
      try {
        window.App.showLoading(true);
        const res = await window.API.sendOtp(this.pendingMobile);
        window.App.showToast(res.message || "A new OTP code has been sent", "success");
        this.startOtpTimer();
      } catch (err) {
        window.App.showToast(err.message || "Failed to resend OTP", "error");
      } finally {
        window.App.showLoading(false);
      }
    });

    // Change mobile number
    document.getElementById("changeMobileBtn")?.addEventListener("click", () => {
      window.App.showScreen("loginScreen");
    });
  }

  validateMobile(num) {
    return /^[6-9]\d{9}$/.test(num);
  }

  openOtpScreen(mobile) {
    this.pendingMobile = mobile;
    const sentMobileEl = document.getElementById("otpSentMobile");
    if (sentMobileEl) {
      sentMobileEl.textContent = `+91 ${mobile.slice(0, 2)}****${mobile.slice(6)}`;
    }

    // Reset OTP boxes
    document.querySelectorAll(".otp-digit-input").forEach(i => i.value = "");
    this.startOtpTimer();
    window.App.showScreen("otpScreen");
    document.querySelector(".otp-digit-input")?.focus();
  }

  startOtpTimer() {
    clearInterval(this.otpTimerInterval);
    let remaining = 30;
    const resendBtn = document.getElementById("resendOtpBtn");
    const timerText = document.getElementById("otpTimerText");

    if (resendBtn) resendBtn.disabled = true;
    if (timerText) timerText.textContent = `(${remaining}s)`;

    this.otpTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(this.otpTimerInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (timerText) timerText.textContent = "";
      } else {
        if (timerText) timerText.textContent = `(${remaining}s)`;
      }
    }, 1000);
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
              sex: "female"
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
