import React, { useState, useEffect } from 'react';
import { Sparkles, Swords, Play } from 'lucide-react';
import { UserProfile, checkAutoLoginUser } from '../services/firebase';

interface InitialLaunchScreenProps {
  onComplete: (profile: UserProfile | null) => void;
}

export const InitialLaunchScreen: React.FC<InitialLaunchScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 8);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    let profile: UserProfile | null = null;
    try {
      profile = await checkAutoLoginUser();
    } catch {
      // Fallback
    }

    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950 text-white p-6 font-mono select-none overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-rose-950/20 to-black pointer-events-none" />

      {/* Top Banner */}
      <div className="relative z-10 flex items-center gap-2 pt-8 text-xs text-amber-400 tracking-widest font-black uppercase">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>MYTHIC BATTLE ARENA • SEASON 1</span>
        <Sparkles className="w-4 h-4 animate-spin" />
      </div>

      {/* Center Brand Title */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-md">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 shadow-[0_0_50px_rgba(255,215,0,0.25)]">
          <Swords className="w-16 h-16 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter bg-gradient-to-r from-amber-300 via-rose-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,77,0,0.5)]">
          PORTAL OF LEGENDS
        </h1>
        <p className="text-xs text-zinc-400 tracking-wider font-semibold">
          MYTHIC LUDO BATTLEGROUNDS • ONLINE MULTIPLAYER
        </p>
      </div>

      {/* Bottom Loading / Start Section */}
      <div className="relative z-10 w-full max-w-sm space-y-3 pb-8">
        {!ready ? (
          <div className="space-y-1.5 text-center">
            <div className="flex justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>INITIALIZING ARENA...</span>
              <span>{Math.min(100, progress)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 border border-white/20 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-[#00FF41] rounded-full transition-all duration-150"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-black uppercase tracking-widest text-sm rounded-xl border border-amber-300 shadow-[0_0_25px_rgba(255,215,0,0.6)] cursor-pointer flex items-center justify-center gap-2 animate-bounce transition-transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>TAP TO ENTER ARENA (শুরু করুন)</span>
          </button>
        )}
      </div>
    </div>
  );
};
