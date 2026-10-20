import React, { useEffect } from 'react';
import { Film, Flame, Swords, Zap } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';


export interface CaptureReplayData {
  capturerName: string;
  capturerEmoji: string;
  capturerColor?: string;
  capturedName: string;
  capturedEmoji: string;
  capturedColor?: string;
  tauntEmoji?: string;
  tauntText?: string;
}

interface VARCaptureReplayModalProps {
  data: CaptureReplayData | null;
  onClose: () => void;
}

export const VARCaptureReplayModal: React.FC<VARCaptureReplayModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  useEffect(() => {
    soundEngine.playCapture();
    const timer = setTimeout(() => {
      onClose();
    }, 1800);
    return () => clearTimeout(timer);
  }, [data, onClose]);

  const tauntEmojis = ['🤣', '😈', '💀', '🤡', '🔥'];
  const displayTaunt = data.tauntEmoji || tauntEmojis[Math.floor(Math.random() * tauntEmojis.length)];
  const displayQuote = data.tauntText || 'মান সম্মান শেষ! এবার প্রতিশোধ নেওয়ার পালা! ⚔️';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 font-mono select-none pointer-events-auto cursor-pointer animate-fade-in"
    >
      
      {/* Slow-Motion Broadcast Replay Frame */}
      <div className="relative w-full max-w-sm bg-zinc-950 border-2 border-rose-500/90 shadow-[0_0_50px_rgba(244,63,94,0.5)] rounded-2xl overflow-hidden p-4 text-white text-center space-y-3">
        
        {/* VAR Header Badge */}
        <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-widest animate-pulse">
            <Film className="w-4 h-4 text-rose-500" />
            <span>[ 🎬 VAR INSTANT REPLAY ]</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-950 px-2 py-0.5 border border-rose-500/50 rounded text-[10px] text-rose-300 font-bold">
            <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
            <span>SLOW-MO 0.5X</span>
          </div>
        </div>

        {/* Slow Motion Clash Arena */}
        <div className="relative bg-gradient-to-b from-black via-zinc-900 to-black border border-white/10 rounded-xl p-4 flex items-center justify-around overflow-hidden shadow-inner">
          
          {/* Scanline Effect overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

          {/* Capturer Player */}
          <div className="flex flex-col items-center space-y-1 z-10 animate-bounce">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(52,211,153,0.5)]">
              {data.capturerEmoji}
            </div>
            <span className="text-[11px] font-black uppercase text-emerald-300 max-w-[90px] truncate">
              {data.capturerName}
            </span>
            <span className="text-[9px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-500/40">
              ⚡ TAKEDOWN!
            </span>
          </div>

          {/* Versus Clash Icon */}
          <div className="flex flex-col items-center justify-center space-y-1 z-10">
            <Swords className="w-8 h-8 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-black text-rose-400 tracking-widest uppercase">
              CUT!
            </span>
          </div>

          {/* Captured Victim Player with Laughing Emoji Overlay */}
          <div className="flex flex-col items-center space-y-1 z-10 relative">
            
            {/* TAUNTING LAUGH EMOJI FLOATING ON VICTIM */}
            <div className="absolute -top-3 -right-2 text-3xl animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20">
              {displayTaunt}
            </div>

            <div className="w-14 h-14 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-3xl opacity-75 grayscale contrast-125 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
              {data.capturedEmoji}
            </div>
            <span className="text-[11px] font-black uppercase text-rose-300 line-through max-w-[90px] truncate">
              {data.capturedName}
            </span>
            <span className="text-[9px] bg-rose-950 px-1.5 py-0.5 rounded text-rose-200 border border-rose-600/60 font-bold">
              💀 DESTROYED
            </span>
          </div>

        </div>

        {/* Aggressive Provocative Banner */}
        <div className="bg-rose-950/80 border border-rose-500/60 p-2.5 rounded-xl space-y-1 text-center">
          <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{displayQuote}</span>
          </div>
          <p className="text-[10px] text-zinc-300 font-sans">
            প্রতিপক্ষের গুটি কেটে আপনি অতিরিক্ত ১টি বোনাস চাল জয় করলেন!
          </p>
        </div>

        {/* Auto Progress Bar */}
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/10">
          <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 h-full w-full animate-[shrink_2.4s_linear_forwards]" />
        </div>

      </div>

    </div>
  );
};
