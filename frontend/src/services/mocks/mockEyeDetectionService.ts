import { EyeDetectionState, EyeAlignmentPrompt } from '../../types/screening';

export interface EyeDetectionConfig {
  autoAlignDelayMs?: number;
  manualOverride?: EyeAlignmentPrompt;
}

export type EyeDetectionCallback = (state: EyeDetectionState) => void;

class MockEyeDetectionEngine {
  private listener: EyeDetectionCallback | null = null;
  private intervalId: any = null;
  private sequenceStep = 0;
  private isRunning = false;
  private forcedState: EyeDetectionState | null = null;

  private statesSequence: EyeDetectionState[] = [
    { detected: false, aligned: false, quality: 'poor', prompt: 'position_eye', confidenceScore: 0.2 },
    { detected: true,  aligned: false, quality: 'fair', prompt: 'move_closer', confidenceScore: 0.45 },
    { detected: true,  aligned: false, quality: 'fair', prompt: 'move_left',   confidenceScore: 0.60 },
    { detected: true,  aligned: false, quality: 'good', prompt: 'hold_steady', confidenceScore: 0.85 },
    { detected: true,  aligned: true,  quality: 'good', prompt: 'eye_detected', confidenceScore: 0.95 },
  ];

  startDetection(
    _videoElement: HTMLVideoElement | null,
    callback: EyeDetectionCallback
  ) {
    this.stopDetection();
    this.listener = callback;
    this.isRunning = true;
    this.sequenceStep = 0;

    // Immediately emit initial state
    callback(this.statesSequence[0]);

    // Progress through realistic alignment steps every 1.5s
    this.intervalId = setInterval(() => {
      if (!this.isRunning || !this.listener) return;

      if (this.forcedState) {
        this.listener(this.forcedState);
        return;
      }

      if (this.sequenceStep < this.statesSequence.length - 1) {
        this.sequenceStep++;
        this.listener(this.statesSequence[this.sequenceStep]);
      }
    }, 1400);
  }

  // Allow developer or user to simulate immediate alignment states
  setManualOverride(prompt: EyeAlignmentPrompt | null) {
    if (!prompt) {
      this.forcedState = null;
      return;
    }

    switch (prompt) {
      case 'position_eye':
        this.forcedState = { detected: false, aligned: false, quality: 'poor', prompt: 'position_eye', confidenceScore: 0.1 };
        break;
      case 'move_closer':
        this.forcedState = { detected: true, aligned: false, quality: 'fair', prompt: 'move_closer', confidenceScore: 0.4 };
        break;
      case 'move_left':
        this.forcedState = { detected: true, aligned: false, quality: 'fair', prompt: 'move_left', confidenceScore: 0.5 };
        break;
      case 'move_right':
        this.forcedState = { detected: true, aligned: false, quality: 'fair', prompt: 'move_right', confidenceScore: 0.5 };
        break;
      case 'hold_steady':
        this.forcedState = { detected: true, aligned: false, quality: 'good', prompt: 'hold_steady', confidenceScore: 0.85 };
        break;
      case 'eye_detected':
        this.forcedState = { detected: true, aligned: true, quality: 'good', prompt: 'eye_detected', confidenceScore: 0.96 };
        break;
    }

    if (this.listener && this.forcedState) {
      this.listener(this.forcedState);
    }
  }

  stopDetection() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listener = null;
  }
}

export const mockEyeDetectionService = new MockEyeDetectionEngine();
