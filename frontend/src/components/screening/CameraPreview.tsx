import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, VideoOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export type CameraPermissionState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

interface CameraPreviewProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  onStreamActive?: (stream: MediaStream) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  children?: React.ReactNode;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  onVideoReady,
  onStreamActive,
  videoRef: externalVideoRef,
  children,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = externalVideoRef || internalVideoRef;
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionState, setPermissionState] = useState<CameraPermissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFacingUser, setIsFacingUser] = useState<boolean>(true);

  // Safe camera track cleanup function
  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (activeVideoRef.current) {
      activeVideoRef.current.srcObject = null;
    }
  }, [activeVideoRef]);

  const startCamera = useCallback(async () => {
    stopCameraTracks();
    setPermissionState('requesting');
    setErrorMessage('');

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unavailable');
      setErrorMessage('Camera API is not supported on this browser or environment.');
      return;
    }

    try {
      const isPortrait = window.innerHeight > window.innerWidth;
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFacingUser ? 'user' : 'environment',
          width: isPortrait ? { ideal: 1080, min: 480, max: 2160 } : { ideal: 1920, min: 640, max: 3840 },
          height: isPortrait ? { ideal: 1440, min: 640, max: 3840 } : { ideal: 1080, min: 480, max: 2160 },
          aspectRatio: isPortrait ? { ideal: 3 / 4 } : { ideal: 16 / 9 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (activeVideoRef.current) {
        activeVideoRef.current.srcObject = stream;
        activeVideoRef.current.onloadedmetadata = () => {
          activeVideoRef.current?.play().catch((err) => {
            console.warn('Auto-play blocked or interrupted:', err);
          });
          if (activeVideoRef.current && onVideoReady) {
            onVideoReady(activeVideoRef.current);
          }
        };
      }

      setPermissionState('granted');
      if (onStreamActive) {
        onStreamActive(stream);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Camera access was denied. Please allow camera permission in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('unavailable');
        setErrorMessage('No camera device found on this system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionState('unavailable');
        setErrorMessage('Camera is currently in use by another application.');
      } else {
        setPermissionState('unavailable');
        setErrorMessage(err.message || 'Unable to access camera feed.');
      }
    }
  }, [isFacingUser, onStreamActive, onVideoReady, stopCameraTracks, activeVideoRef]);

  // Request camera on mount
  useEffect(() => {
    startCamera();

    // Critical cleanup when component unmounts
    return () => {
      stopCameraTracks();
    };
  }, [startCamera, stopCameraTracks]);

  const toggleCameraFacing = () => {
    setIsFacingUser((prev) => !prev);
  };

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-h-[70vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-slate-800 select-none">
      {/* Live Video Feed */}
      <video
        ref={activeVideoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          permissionState === 'granted' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isFacingUser ? '-scale-x-100' : ''}`}
      />

      {/* Permission: Requesting State */}
      {permissionState === 'requesting' && (
        <div className="relative z-10 flex flex-col items-center text-center p-6 text-slate-300">
          <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 animate-pulse">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Connecting to Camera</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Initializing camera for high-resolution conjunctiva eye screening...
          </p>
        </div>
      )}

      {/* Permission: Not Granted / Idle State */}
      {permissionState === 'idle' && (
        <div className="relative z-10 flex flex-col items-center text-center p-6 text-slate-300">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Camera Permission Required</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-5">
            Camera access is required for eye screening and anaemia analysis.
          </p>
          <Button variant="primary" size="md" onClick={startCamera} leftIcon={<Camera className="w-4 h-4" />}>
            Allow Camera
          </Button>
        </div>
      )}

      {/* Permission: Denied State */}
      {permissionState === 'denied' && (
        <div className="relative z-10 flex flex-col items-center text-center p-6 text-slate-300 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Camera Access Denied</h3>
          <p className="text-xs text-rose-300 mb-2 font-medium">{errorMessage}</p>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Please tap the lock or camera icon in your browser address bar, enable camera permission, and tap try again.
          </p>
          <Button variant="outline" size="md" onClick={startCamera} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Again
          </Button>
        </div>
      )}

      {/* Permission: Unavailable State */}
      {permissionState === 'unavailable' && (
        <div className="relative z-10 flex flex-col items-center text-center p-6 text-slate-300 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <VideoOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Camera Unavailable</h3>
          <p className="text-xs text-slate-400 mb-5">{errorMessage}</p>
          <Button variant="outline" size="md" onClick={startCamera} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Camera Switch button if granted */}
      {permissionState === 'granted' && (
        <button
          onClick={toggleCameraFacing}
          title="Switch Camera"
          className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/20 transition active:scale-95 shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* Frame overlay / Custom Children rendered on top of video */}
      {permissionState === 'granted' && children}
    </div>
  );
};
