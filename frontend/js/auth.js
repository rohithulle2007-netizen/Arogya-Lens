/**
 * Arogya Lens — Authentication Controller
 * Handles registration, OTP request, 6-digit auto-advancing verification, and session checks
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
    // Form Switchers
    document.getElementById("goToRegisterBtn")?.addEventListener("click", () => {
      window.App.showScreen("registerScreen");
    });

    document.getElementById("goToLoginBtn")?.addEventListener("click", () => {
      window.App.showScreen("loginScreen");
    });

    // Login (Send OTP)
    document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mobile = document.getElementById("loginMobile")?.value.trim();
      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.sendOtp(mobile);
        this.pendingMobile = mobile;
        window.App.showToast("OTP sent successfully: " + (res.otp || "123456"), "success");
        this.openOtpScreen(mobile);
      } catch (err) {
        const msg = err.message || "Failed to send OTP";
        window.App.showToast(msg, "error");
        if (msg.toLowerCase().includes("not registered") || msg.toLowerCase().includes("register")) {
          const regMobile = document.getElementById("regMobile");
          if (regMobile) regMobile.value = mobile;
        }
      } finally {
        window.App.showLoading(false);
      }
    });

    // Registration (Create Account & Send OTP)
    document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("regName")?.value.trim();
      const mobile = document.getElementById("regMobile")?.value.trim();
      const age = parseInt(document.getElementById("regAge")?.value, 10);
      const sex = document.getElementById("regSex")?.value;

      if (!name || !mobile || isNaN(age)) {
        window.App.showToast("Please fill in all required fields", "error");
        return;
      }

      if (!this.validateMobile(mobile)) {
        window.App.showToast("Please enter a valid 10-digit mobile number", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.register({ name, mobile_number: mobile, age, sex });
        this.pendingMobile = mobile;
        window.App.showToast("Account registered! OTP: " + (res.otp || "123456"), "success");
        this.openOtpScreen(mobile);
      } catch (err) {
        window.App.showToast(err.message || "Registration failed", "error");
      } finally {
        window.App.showLoading(false);
      }
    });

    // 6-Digit OTP Auto-Focus Advance
    const otpInputs = document.querySelectorAll(".otp-digit-input");
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    // OTP Verification Submit
    document.getElementById("verifyOtpBtn")?.addEventListener("click", async () => {
      let otp = "";
      document.querySelectorAll(".otp-digit-input").forEach(inp => otp += inp.value.trim());

      if (otp.length < 6) {
        window.App.showToast("Please enter the complete 6-digit OTP code", "error");
        return;
      }

      try {
        window.App.showLoading(true);
        const res = await window.API.verifyOtp(this.pendingMobile, otp);
        window.API.setToken(res.access_token);
        window.App.showToast("Verification successful! Welcome.", "success");
        this.clearOtpInputs();
        await window.App.loadUserSession();
        window.App.showScreen("homeScreen");
      } catch (err) {
        window.App.showToast(err.message || "Invalid OTP code", "error");
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
        window.App.showToast("New OTP sent: " + (res.otp || "123456"), "success");
        this.startOtpTimer(30);
      } catch (err) {
        window.App.showToast(err.message, "error");
      } finally {
        window.App.showLoading(false);
      }
    });
  }

  validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  openOtpScreen(mobile) {
    const mobileDisplay = document.getElementById("otpSentMobile");
    if (mobileDisplay) mobileDisplay.textContent = `+91 ${mobile}`;
    window.App.showScreen("otpScreen");
    this.clearOtpInputs();
    document.querySelector(".otp-digit-input")?.focus();
    this.startOtpTimer(30);
  }

  clearOtpInputs() {
    document.querySelectorAll(".otp-digit-input").forEach(inp => inp.value = "");
  }

  startOtpTimer(seconds) {
    clearInterval(this.otpTimerInterval);
    const resendBtn = document.getElementById("resendOtpBtn");
    const timerText = document.getElementById("otpTimer");
    if (!resendBtn || !timerText) return;

    resendBtn.disabled = true;
    let remaining = seconds;
    timerText.textContent = `(${remaining}s)`;

    this.otpTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(this.otpTimerInterval);
        resendBtn.disabled = false;
        timerText.textContent = "";
      } else {
        timerText.textContent = `(${remaining}s)`;
      }
    }, 1000);
  }
}

window.Auth = new AuthManager();
