/**
 * Arogya Lens — Multi-Site 4-Point Scanner Controller
 * Sequence: Left Eye -> Right Eye -> Left Thumb -> Right Thumb -> 4-Card Review
 */

const SCAN_STEPS = [
  {
    key: "left_eye",
    icon: "👁️",
    labelKey: "step_left_eye",
    instructionKey: "align_left_eye_instruction",
    targetType: "eye",
    sublabel: "Pull down LEFT lower eyelid"
  },
  {
    key: "right_eye",
    icon: "👁️",
    labelKey: "step_right_eye",
    instructionKey: "align_right_eye_instruction",
    targetType: "eye",
    sublabel: "Pull down RIGHT lower eyelid"
  },
  {
    key: "left_thumb",
    icon: "👍",
    labelKey: "step_left_thumb",
    instructionKey: "align_left_thumb_instruction",
    targetType: "thumb",
    sublabel: "Align LEFT thumb nail bed"
  },
  {
    key: "right_thumb",
    icon: "👍",
    labelKey: "step_right_thumb",
    instructionKey: "align_right_thumb_instruction",
    targetType: "thumb",
    sublabel: "Align RIGHT thumb nail bed"
  }
];

class ScannerManager {
  constructor() {
    this.currentStepIndex = 0;
    this.singleRetakeKey = null;
    this.scans = {
      left_eye: null,
      right_eye: null,
      left_thumb: null,
      right_thumb: null
    };
    this.alignmentInterval = null;
    this.isAligned = false;
  }

  init() {
    window.Camera.init("cameraVideo");
    this.bindEvents();
  }

  bindEvents() {
    // Start 4-Point Scanner from Home or Nav
    document.getElementById("startScanBtn")?.addEventListener("click", async () => {
      this.resetFullScan();
      window.App.showScreen("scannerScreen");
      await this.launchCurrentStep();
    });

    document.getElementById("navScanBtn")?.addEventListener("click", async () => {
      this.resetFullScan();
      window.App.showScreen("scannerScreen");
      await this.launchCurrentStep();
    });

    // Flip Camera
    document.getElementById("flipCameraBtn")?.addEventListener("click", async () => {
      try {
        await window.Camera.toggleCameraFacing();
      } catch (err) {
        window.App.showToast(err.message, "error");
      }
    });

    // Shutter Trigger
    document.getElementById("shutterBtn")?.addEventListener("click", async () => {
      await this.handleShutterCapture();
    });

    // Review Screen Actions: Individual Retakes
    document.getElementById("retakeLeftEyeBtn")?.addEventListener("click", async () => {
      await this.retakeSingleStep("left_eye");
    });
    document.getElementById("retakeRightEyeBtn")?.addEventListener("click", async () => {
      await this.retakeSingleStep("right_eye");
    });
    document.getElementById("retakeLeftThumbBtn")?.addEventListener("click", async () => {
      await this.retakeSingleStep("left_thumb");
    });
    document.getElementById("retakeRightThumbBtn")?.addEventListener("click", async () => {
      await this.retakeSingleStep("right_thumb");
    });

    // Review Screen Actions: Retake All
    document.getElementById("retakeAllBtn")?.addEventListener("click", async () => {
      this.resetFullScan();
      window.App.showScreen("scannerScreen");
      await this.launchCurrentStep();
    });

    // Review Actions: Confirm & Submit All 4 Scans to AI Backend
    document.getElementById("confirmAnalyzeBtn")?.addEventListener("click", async () => {
      if (!this.scans.left_eye && !this.scans.right_eye && !this.scans.left_thumb && !this.scans.right_thumb) {
        window.App.showToast("Please capture the required scans first", "error");
        return;
      }

      try {
        window.App.showScreen("analyzingScreen");
        const screeningResult = await window.API.analyzeMultiSite(this.scans);
        
        // Pass result to Screening Manager for display & direct dashboard guidance
        window.Screening.presentResult(screeningResult);
      } catch (err) {
        window.App.showToast(err.message || "Screening analysis failed", "error");
        window.App.showScreen("captureReviewScreen");
      }
    });
  }

  resetFullScan() {
    this.currentStepIndex = 0;
    this.singleRetakeKey = null;
    this.scans = {
      left_eye: null,
      right_eye: null,
      left_thumb: null,
      right_thumb: null
    };
  }

  async retakeSingleStep(stepKey) {
    const idx = SCAN_STEPS.findIndex(s => s.key === stepKey);
    if (idx !== -1) {
      this.singleRetakeKey = stepKey;
      this.currentStepIndex = idx;
      window.App.showScreen("scannerScreen");
      await this.launchCurrentStep();
    }
  }

  async launchCurrentStep() {
    this.updateStepUI();
    try {
      await window.Camera.startCamera();
      this.startAlignmentHeuristics();
    } catch (err) {
      window.App.showToast(err.message, "error");
    }
  }

  updateStepUI() {
    const step = SCAN_STEPS[this.currentStepIndex];
    if (!step) return;

    // Update Step label & icon
    const labelEl = document.getElementById("scannerStepText");
    const iconEl = document.getElementById("scannerStepIcon");
    if (labelEl) labelEl.textContent = window.I18N.t(step.labelKey);
    if (iconEl) iconEl.textContent = step.icon;

    // Update Dots
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`stepDot${i}`);
      if (dot) {
        dot.className = "step-dot";
        if (i - 1 < this.currentStepIndex) {
          dot.classList.add("completed");
        } else if (i - 1 === this.currentStepIndex) {
          dot.classList.add("active");
        }
      }
    }

    // Toggle Eye Frame vs Thumb Frame
    const eyeFrame = document.getElementById("eyeGuideFrame");
    const thumbFrame = document.getElementById("thumbGuideFrame");
    const eyeSublabel = document.getElementById("eyeGuideSublabel");
    const thumbSublabel = document.getElementById("thumbGuideSublabel");

    if (step.targetType === "eye") {
      if (eyeFrame) eyeFrame.style.display = "block";
      if (thumbFrame) thumbFrame.style.display = "none";
      if (eyeSublabel) eyeSublabel.textContent = step.sublabel;
    } else {
      if (eyeFrame) eyeFrame.style.display = "none";
      if (thumbFrame) thumbFrame.style.display = "flex";
      if (thumbSublabel) thumbSublabel.textContent = step.sublabel;
    }

    // Update instruction paragraph
    const instrEl = document.getElementById("scannerInstructionText");
    if (instrEl) {
      instrEl.textContent = window.I18N.t(step.instructionKey);
    }
  }

  startAlignmentHeuristics() {
    clearInterval(this.alignmentInterval);
    const step = SCAN_STEPS[this.currentStepIndex];
    const targetFrame = step.targetType === "eye" ? document.getElementById("eyeGuideFrame") : document.getElementById("thumbGuideFrame");
    const statusText = document.getElementById("alignmentStatusText");
    const statusDot = document.getElementById("alignmentStatusDot");

    let count = 0;
    this.alignmentInterval = setInterval(() => {
      count++;
      if (count < 2) {
        if (targetFrame) targetFrame.className = step.targetType === "eye" ? "eye-guide-frame" : "thumb-guide-frame";
        if (statusText) statusText.textContent = step.targetType === "eye" ? window.I18N.t("position_eye") : window.I18N.t("position_thumb");
        if (statusDot) statusDot.className = "status-dot active-orange";
        this.isAligned = false;
      } else if (count < 4) {
        if (targetFrame) targetFrame.className = (step.targetType === "eye" ? "eye-guide-frame" : "thumb-guide-frame") + " warning";
        if (statusText) statusText.textContent = window.I18N.t("hold_steady");
        if (statusDot) statusDot.className = "status-dot active-orange";
        this.isAligned = false;
      } else {
        if (targetFrame) targetFrame.className = (step.targetType === "eye" ? "eye-guide-frame" : "thumb-guide-frame") + " aligned";
        if (statusText) statusText.textContent = window.I18N.t("target_aligned");
        if (statusDot) statusDot.className = "status-dot active-green";
        this.isAligned = true;
      }
    }, 850);
  }

  async handleShutterCapture() {
    try {
      const blob = await window.Camera.captureFrameBlob("captureCanvas");
      const currentStep = SCAN_STEPS[this.currentStepIndex];
      this.scans[currentStep.key] = blob;

      // Update thumbnail preview in review grid
      this.updateReviewThumbnail(currentStep.key, blob);

      // Play subtle feedback
      window.App.showToast(`${currentStep.icon} ${window.I18N.t(currentStep.labelKey)} Captured!`, "success");

      // Check if this was a single step retake
      if (this.singleRetakeKey) {
        this.singleRetakeKey = null;
        window.Camera.stopCamera();
        clearInterval(this.alignmentInterval);
        window.App.showScreen("captureReviewScreen");
        return;
      }

      // Progress to next step or review
      if (this.currentStepIndex < 3) {
        this.currentStepIndex++;
        this.updateStepUI();
        this.startAlignmentHeuristics();
      } else {
        // All 4 captured
        window.Camera.stopCamera();
        clearInterval(this.alignmentInterval);
        window.App.showScreen("captureReviewScreen");
      }
    } catch (err) {
      window.App.showToast("Failed to capture photo: " + err.message, "error");
    }
  }

  updateReviewThumbnail(key, blob) {
    const imgMap = {
      left_eye: "thumbLeftEye",
      right_eye: "thumbRightEye",
      left_thumb: "thumbLeftThumb",
      right_thumb: "thumbRightThumb"
    };
    const cardMap = {
      left_eye: "cardLeftEye",
      right_eye: "cardRightEye",
      left_thumb: "cardLeftThumb",
      right_thumb: "cardRightThumb"
    };

    const imgId = imgMap[key];
    const cardId = cardMap[key];
    if (imgId && blob) {
      const imgEl = document.getElementById(imgId);
      if (imgEl) imgEl.src = URL.createObjectURL(blob);
      const cardEl = document.getElementById(cardId);
      if (cardEl) cardEl.classList.add("captured");
    }
  }
}

window.Scanner = new ScannerManager();
