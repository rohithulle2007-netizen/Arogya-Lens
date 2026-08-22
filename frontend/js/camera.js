/**
 * Arogya Lens — Adaptive WebRTC Camera Controller
 * Automatically detects device type, screen orientation, and native aspect ratio
 * (e.g. 9:16 / 3:4 on mobile phones in portrait, 16:9 / 4:3 on laptops/desktops in landscape)
 */

class CameraManager {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.facingMode = "user"; // "user" (front/selfie) or "environment" (rear/macro)
    this.isStreaming = false;
    this.resizeDebounceTimer = null;

    // Listen to device orientation and viewport changes
    this.bindOrientationListeners();
  }

  init(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
  }

  bindOrientationListeners() {
    const handleOrientationOrResize = () => {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = setTimeout(() => {
        if (this.isStreaming && this.videoElement) {
          this.applyOptimalAspectRatio();
        }
      }, 300);
    };

    window.addEventListener("orientationchange", handleOrientationOrResize);
    window.addEventListener("resize", handleOrientationOrResize);
  }

  /**
   * Determine optimal camera constraints based on device type and screen orientation
   */
  getOptimalConstraints(facingMode = this.facingMode) {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || ('ontouchstart' in window) 
      || (window.innerWidth <= 768);

    // On mobile devices in portrait, request portrait orientation
    // On laptops / desktops, request widescreen landscape
    let videoConstraints;
    if (isPortrait) {
      videoConstraints = {
        facingMode: { ideal: facingMode },
        width: { ideal: 1080, min: 480, max: 2160 },
        height: { ideal: 1440, min: 640, max: 3840 },
        aspectRatio: { ideal: 3 / 4 }
      };
    } else {
      videoConstraints = {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920, min: 640, max: 3840 },
        height: { ideal: 1080, min: 480, max: 2160 },
        aspectRatio: { ideal: 16 / 9 }
      };
    }

    return {
      video: videoConstraints,
      audio: false
    };
  }

  async startCamera(facingMode = this.facingMode) {
    this.stopCamera(); // Ensure previous tracks are cleanly terminated

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API (getUserMedia) is not supported by your browser.");
    }

    this.facingMode = facingMode;
    const constraints = this.getOptimalConstraints(facingMode);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        
        // Wait for video metadata to read true hardware feed dimensions
        this.videoElement.onloadedmetadata = () => {
          this.applyOptimalAspectRatio();
        };

        await this.videoElement.play();
        this.isStreaming = true;
      }
      return this.stream;
    } catch (err) {
      console.warn("Primary camera constraint failed, falling back to permissive mode:", err);
      // Fallback with minimal constraints if device has strict camera capabilities
      try {
        const fallbackConstraints = {
          video: { facingMode: { ideal: facingMode } },
          audio: false
        };
        this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          this.videoElement.onloadedmetadata = () => {
            this.applyOptimalAspectRatio();
          };
          await this.videoElement.play();
          this.isStreaming = true;
        }
        return this.stream;
      } catch (fallbackErr) {
        console.error("Camera access error:", fallbackErr);
        if (fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError") {
          throw new Error("Camera permission was denied. Please allow camera access in your browser settings.");
        }
        throw new Error("Unable to start video camera stream: " + fallbackErr.message);
      }
    }
  }

  /**
   * Automatically adapts UI container and eye guide frame to native camera aspect ratio
   */
  applyOptimalAspectRatio() {
    if (!this.videoElement) return;

    const vWidth = this.videoElement.videoWidth;
    const vHeight = this.videoElement.videoHeight;

    if (vWidth && vHeight) {
      const container = document.querySelector(".camera-preview-container");
      if (container) {
        // Set dynamic aspect ratio directly on preview container
        container.style.aspectRatio = `${vWidth} / ${vHeight}`;
        container.style.setProperty("--camera-aspect-ratio", `${vWidth} / ${vHeight}`);
      }

      // Adapt eye guide frame geometry based on portrait vs landscape stream
      const guideFrame = document.getElementById("eyeGuideFrame");
      if (guideFrame) {
        if (vHeight > vWidth) {
          // Portrait stream (e.g. mobile phone)
          guideFrame.style.width = "75%";
          guideFrame.style.maxWidth = "260px";
          guideFrame.style.height = "160px";
        } else {
          // Landscape stream (e.g. laptop webcam)
          guideFrame.style.width = "45%";
          guideFrame.style.maxWidth = "280px";
          guideFrame.style.height = "170px";
        }
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isStreaming = false;
  }

  async toggleCameraFacing() {
    const nextFacing = this.facingMode === "user" ? "environment" : "user";
    return this.startCamera(nextFacing);
  }

  captureFrameBlob(canvasId, format = "image/jpeg", quality = 0.95) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !this.videoElement || !this.isStreaming) {
      throw new Error("Camera is not actively streaming frames.");
    }

    // Preserve exact hardware video resolution without downsampling
    const width = this.videoElement.videoWidth || 1280;
    const height = this.videoElement.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    // Flip horizontally if front camera for natural mirror capture
    if (this.facingMode === "user") {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoElement, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(this.videoElement, 0, 0, width, height);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas frame conversion failed."));
      }, format, quality);
    });
  }
}

window.Camera = new CameraManager();
