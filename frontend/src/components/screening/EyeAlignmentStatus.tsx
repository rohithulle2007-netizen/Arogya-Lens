import React from 'react';
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { EyeDetectionState, EyeAlignmentPrompt } from '../../types/screening';

interface EyeAlignmentStatusProps {
  detectionState: EyeDetectionState;
}

export const EyeAlignmentStatus: React.FC<EyeAlignmentStatusProps> = ({ detectionState }) => {
  const { detected, aligned, prompt } = detectionState;

  const getStatusConfig = () => {
    if (detected && aligned) {
      return {
        text: '✓ Eye detected & aligned',
        icon: <Check className="w-4 h-4 text-emerald-400 font-extrabold" />,
        bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-900/50',
        hint: 'Hold steady while the high-res frame is captured',
      };
    }

    switch (prompt) {
      case 'move_closer':
        return {
          text: 'Move slightly closer',
          icon: <Eye className="w-4 h-4 text-amber-300 animate-pulse" />,
          bg: 'bg-slate-900/90 text-amber-300 border-amber-500/40 shadow-slate-950/50',
          hint: 'Bring your eye closer to fill the target rectangle',
        };
      case 'move_left':
        return {
          text: 'Move slightly left',
          icon: <ArrowLeft className="w-4 h-4 text-cyan-300 animate-bounce" />,
          bg: 'bg-slate-900/90 text-cyan-300 border-cyan-500/40 shadow-slate-950/50',
          hint: 'Shift camera slightly to the left',
        };
      case 'move_right':
        return {
          text: 'Move slightly right',
          icon: <ArrowRight className="w-4 h-4 text-cyan-300 animate-bounce" />,
          bg: 'bg-slate-900/90 text-cyan-300 border-cyan-500/40 shadow-slate-950/50',
          hint: 'Shift camera slightly to the right',
        };
      case 'hold_steady':
        return {
          text: 'Hold steady',
          icon: <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />,
          bg: 'bg-teal-950/90 text-teal-300 border-teal-500/50 shadow-teal-950/50',
          hint: 'Gently pull down lower eyelid to expose inner conjunctiva',
        };
      case 'position_eye':
      default:
        return {
          text: 'Position your eye inside the frame',
          icon: <Eye className="w-4 h-4 text-slate-300" />,
          bg: 'bg-slate-900/90 text-slate-200 border-slate-700/80 shadow-slate-950/50',
          hint: 'Align your eye inside the rectangular viewfinder',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center gap-1.5 z-30 max-w-sm mx-auto px-4 select-none">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md shadow-lg text-xs font-semibold tracking-wide transition-all duration-300 ${config.bg}`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
      <p className="text-[11px] text-slate-400 text-center font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
        {config.hint}
      </p>
    </div>
  );
};
