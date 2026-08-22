import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, Zap, Check, Sparkles, SlidersHorizontal, Info } from 'lucide-react';
import { CameraPreview } from './CameraPreview';
import { ScannerFrame } from './ScannerFrame';
import { EyeAlignmentStatus } from './EyeAlignmentStatus';
import { Button } from '../common/Button';
import { eyeDetectionService } from '../../services/api/eyeDetectionService';
import { useScreening } from '../../context/ScreeningContext';
import { EyeDetectionState, EyeAlignmentPrompt } from '../../types/screening';

export const EyeScanner: React.FC = () => {
  const navigate = useNavigate();
  const { setCapturedImage } = useScreening();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [detectionState, setDetectionState] = useState<EyeDetectionState>({
    detected: false,
    aligned: false,
    quality: 'poor',
    prompt: 'position_eye',
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);
  const [showDevControls, setShowDevControls] = useState(false);
  const countdownIntervalRef = useRef<any>(null);

  // Initialize eye detection service with video ref
  useEffect(() => {
    eyeDetectionService.startDetection(videoRef.current, (state) => {
      setDetectionState(state);
    });

    return () => {
      eyeDetectionService.stopDetection();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Handle capture trigger
  const captureFrame = useCallback(() => {
    if (isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    let dataUrl: string | null = null;

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw frame with correct orientation
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      }
    }

    // If camera wasn't rendered yet (e.g. running in testing simulator without webcam hardware), generate high quality conjunctiva sample SVG canvas
    if (!dataUrl) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 800;
      fallbackCanvas.height = 600;
      const fCtx = fallbackCanvas.getContext('2d');
      if (fCtx) {
        fCtx.fillStyle = '#0f172a';
        fCtx.fillRect(0, 0, 800, 600);
        // Conjunctiva eye mockup
        fCtx.fillStyle = '#f8fafc';
        fCtx.beginPath();
        fCtx.ellipse(400, 300, 260, 130, 0, 0, 2 * Math.PI);
        fCtx.fill();
        // Iris
        fCtx.fillStyle = '#3b82f6';
        fCtx.beginPath();
        fCtx.arc(400, 280, 70, 0, 2 * Math.PI);
        fCtx.fill();
        // Pupil
        fCtx.fillStyle = '#0f172a';
        fCtx.beginPath();
        fCtx.arc(400, 280, 32, 0, 2 * Math.PI);
        fCtx.fill();
        // Inner palpebral conjunctiva reddish zone
        fCtx.fillStyle = '#f87171';
        fCtx.beginPath();
        fCtx.ellipse(400, 380, 200, 35, 0, 0, Math.PI);
        fCtx.fill();
        dataUrl = fallbackCanvas.toDataURL('image/jpeg', 0.90);
      }
    }

    // Save strictly to memory context (no permanent localStorage)
    if (dataUrl) {
      setCapturedImage(dataUrl);
    }

    // Flash and navigate to quality assessment
    setTimeout(() => {
      setIsCapturing(false);
      navigate('/scanner/quality');
    }, 450);
  }, [isCapturing, navigate, setCapturedImage]);

  // Handle auto-capture countdown when aligned
  useEffect(() => {
    if (detectionState.detected && detectionState.aligned) {
      if (autoCaptureCountdown === null) {
        setAutoCaptureCountdown(2);
        countdownIntervalRef.current = setInterval(() => {
          setAutoCaptureCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              captureFrame();
              return null;
            }
            return prev - 1;
          });
        }, 800);
      }
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setAutoCaptureCountdown(null);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [detectionState.detected, detectionState.aligned, autoCaptureCountdown, captureFrame]);

  // Manual test trigger for prompt
  const handleSimulatePrompt = (prompt: EyeAlignmentPrompt) => {
    if (eyeDetectionService.setManualOverride) {
      eyeDetectionService.setManualOverride(prompt);
    }
  };

  const isAligned = detectionState.detected && detectionState.aligned;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Instructions header card */}
      <div className="w-full bg-teal-50/80 border border-teal-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-left">
        <div className="w-7 h-7 rounded-lg bg-teal-600 flex-shrink-0 flex items-center justify-center text-white">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-semibold text-slate-900">How to capture conjunctiva:</p>
          <p className="text-slate-600 mt-0.5">
            Gently pull down your lower eyelid to reveal the reddish inner conjunctiva lining, then hold steady in the frame.
          </p>
        </div>
      </div>

      {/* Main Camera Viewfinder container */}
      <div className="relative w-full max-w-md mx-auto">
        <CameraPreview videoRef={videoRef}>
          <ScannerFrame detectionState={detectionState} isCapturing={isCapturing} />
        </CameraPreview>

        {/* Live Alignment Guidance Overlay on bottom of viewfinder */}
        <div className="absolute bottom-4 inset-x-0">
          <EyeAlignmentStatus detectionState={detectionState} />
        </div>

        {/* Auto Capture Countdown overlay */}
        {autoCaptureCountdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-emerald-500 text-white font-black text-4xl flex items-center justify-center shadow-2xl animate-ping opacity-90">
              {autoCaptureCountdown}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls Bar */}
      <div className="w-full max-w-md flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          <Button
            variant={isAligned ? 'primary' : 'outline'}
            size="lg"
            fullWidth
            onClick={captureFrame}
            isLoading={isCapturing}
            leftIcon={<Camera className="w-5 h-5" />}
            className={isAligned ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-400/40' : ''}
          >
            {isAligned ? 'Capture Eye Image' : 'Take Picture'}
          </Button>

          {/* Test / Simulation Toggle */}
          <button
            onClick={() => setShowDevControls((p) => !p)}
            title="Toggle Demo Simulation Controls"
            className="p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm active:scale-95 flex-shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Dev / Hackathon Simulation Panel for live testing without physical eye alignment */}
        {showDevControls && (
          <div className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 text-left space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                🧪 AI / CV Simulation Controls
              </span>
              <span className="text-[10px] text-slate-400">Frontend Member 1 Mock Engine</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulate computer vision states without manual webcam maneuvering:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSimulatePrompt('position_eye')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-left transition"
              >
                1. Position eye
              </button>
              <button
                onClick={() => handleSimulatePrompt('move_closer')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-left transition"
              >
                2. Move closer
              </button>
              <button
                onClick={() => handleSimulatePrompt('move_left')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-left transition"
              >
                3. Move left
              </button>
              <button
                onClick={() => handleSimulatePrompt('hold_steady')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-left transition"
              >
                4. Hold steady
              </button>
              <button
                onClick={() => handleSimulatePrompt('eye_detected')}
                className="col-span-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Trigger Aligned State (Green)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
