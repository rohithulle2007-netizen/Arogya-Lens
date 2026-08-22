import { EyeDetectionState, EyeAlignmentPrompt } from '../../types/screening';
import { mockEyeDetectionService } from '../mocks/mockEyeDetectionService';

export interface IEyeDetectionService {
  startDetection(
    videoElement: HTMLVideoElement | null,
    onDetectionUpdate: (state: EyeDetectionState) => void
  ): void;
  stopDetection(): void;
  setManualOverride?(prompt: EyeAlignmentPrompt | null): void;
}

// In the future, Backend/AI Member 2 can swap this out with TensorFlow.js,
// MediaPipe Face Mesh / Iris model, or an ONNX Web runtime model
export const eyeDetectionService: IEyeDetectionService = mockEyeDetectionService;
