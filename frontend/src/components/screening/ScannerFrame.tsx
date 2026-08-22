import React from 'react';
import { Eye, CheckCircle2, Scan } from 'lucide-react';
import { EyeDetectionState } from '../../types/screening';

interface ScannerFrameProps {
  detectionState: EyeDetectionState;
  isCapturing?: boolean;
}

export const ScannerFrame: React.FC<ScannerFrameProps> = ({
  detectionState,
  isCapturing = false,
}) => {
  const isAligned = detectionState.detected && detectionState.aligned;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
      {/* Darkened semi-transparent ambient vignette mask */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Target Eye Scanning Rectangular Window */}
      <div className="relative z-20 w-[84%] max-w-[340px] aspect-[16/9] sm:aspect-[16/9] rounded-2xl flex items-center justify-center">
        {/* Transparent Cutout simulation using negative ring */}
        <div
          className={`absolute -inset-[1000px] pointer-events-none transition-all duration-300 ${
            isAligned
              ? 'ring-[1000px] ring-black/40'
              : 'ring-[1000px] ring-black/55'
          }`}
        />

        {/* Primary Rounded Rectangular Eye Target Box */}
        <div
          className={`relative w-full h-full rounded-2xl border-[3px] transition-all duration-300 overflow-hidden shadow-2xl ${
            isAligned
              ? 'border-emerald-400 bg-emerald-500/10 shadow-emerald-500/40 ring-4 ring-emerald-400/30'
              : detectionState.detected
              ? 'border-cyan-400 bg-cyan-500/5 shadow-cyan-500/20'
              : 'border-white/70 bg-transparent shadow-black/60'
          }`}
        >
          {/* Animated Scanning Laser Line */}
          <div
            className={`absolute left-0 right-0 h-1 transition-opacity duration-300 ${
              isAligned
                ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] opacity-90 animate-scan-line'
                : 'bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-60 animate-scan-line'
            }`}
          />

          {/* Eye & Conjunctiva anatomical guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <svg viewBox="0 0 200 100" className="w-4/5 h-4/5 text-white stroke-current fill-none stroke-[1.5] stroke-dasharray-[4_4]">
              {/* Outer eye contour */}
              <path d="M 10 50 Q 100 0 190 50 Q 100 100 10 50 Z" />
              {/* Iris circle */}
              <circle cx="100" cy="50" r="24" strokeWidth="1.2" />
              {/* Lower eyelid / Palpebral Conjunctiva inspection zone */}
              <path d="M 35 60 Q 100 88 165 60" strokeWidth="2.5" stroke="#34d399" strokeDasharray="none" className="opacity-70" />
            </svg>
          </div>

          {/* Corner Viewfinder brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/90 rounded-tl-sm" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/90 rounded-tr-sm" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/90 rounded-bl-sm" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/90 rounded-br-sm" />

          {/* Lower Conjunctiva Region Label */}
          <div className="absolute bottom-1.5 inset-x-0 text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 text-teal-200 backdrop-blur-xs border border-teal-500/30">
              Palpebral Conjunctiva Zone
            </span>
          </div>

          {/* Aligned Badge */}
          {isAligned && (
            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Capture flash effect */}
        {isCapturing && (
          <div className="fixed inset-0 z-50 bg-white animate-fade-out pointer-events-none" />
        )}
      </div>
    </div>
  );
};
