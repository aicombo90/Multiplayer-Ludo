import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Swords, Award, RotateCcw, Home, Clock, Dices, Film, Zap } from 'lucide-react';
import { Player } from '../types';
import { REALMS } from '../constants/gameConstants';
import { AdBanner } from './AdBanner';


export interface MatchHighlights {
  durationSeconds: number;
  totalCaptures: number;
  totalRolls: number;
  winningMoveText: string;
  mvpPlayerName: string;
  mvpPlayerEmoji: string;
  keyMoments: string[];
}

interface VictoryModalProps {
  winner: Player | null;
  onPlayAgain: () => void;
  onGoHome: () => void;
  isOnlineMatch?: boolean;
  matchHighlights?: MatchHighlights | null;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  onPlayAgain,
  onGoHome,
  isOnlineMatch = false,
  matchHighlights
}) => {
  const [showHighlightsTab, setShowHighlightsTab] = useState<boolean>(true);

  if (!winner) return null;
  const realm = REALMS[winner.realmIdx];

  const formatTimer = (totalSec: number = 0) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Generate celebratory confetti particles
    const container = document.getElementById('victory-confetti-container');
    if (!container) return;

    container.innerHTML = '';
    const colors = ['#FF4D00', '#00FF41', '#FFFFFF', '#FFD700'];
    for (let i = 0; i < 70; i++) {
      const conf = document.createElement('div');
      conf.className = 'absolute w-2 h-3 rounded-none animate-fall opacity-80';
      conf.style.left = `${Math.random() * 100}%`;
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.animationDuration = `${2 + Math.random() * 2.5}s`;
      conf.style.animationDelay = `${Math.random() * 0.8}s`;
      container.appendChild(conf);
    }
  }, [winner]);

  const handleHomeClick = () => {
    try {
      // Smartlink open on Home click as requested
      window.open('https://www.effectivecpmnetwork.com/m0ryaji6?key=0a532616f3190c2bbd63b832d450c88e', '_blank');
    } catch (err) {
      console.warn('Smartlink redirect note:', err);
    }
    onGoHome();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 font-mono select-none overflow-y-auto">
      <div id="victory-confetti-container" className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Top Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-sm shrink-0 my-1" />

      <div className="relative w-full max-w-sm bg-zinc-950 border-2 border-amber-500 p-4 sm:p-5 shadow-[0_0_50px_rgba(255,215,0,0.4)] text-center text-white space-y-3.5 rounded-2xl animate-scaleUp my-auto max-h-[88vh] overflow-y-auto">
        
        <div className="w-16 h-16 mx-auto border-2 border-amber-400 bg-black shadow-2xl rounded-2xl flex items-center justify-center animate-bounce">
          <div className="text-3xl">
            🏆
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            [ PORTAL OF LEGENDS CHAMPION ]
          </span>
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-white">
            {realm.emoji} {winner.name} জয়ী হয়েছেন!
          </h2>
        </div>

        {/* Tab Toggle: Match Summary vs Victory View */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-black/80 border border-amber-500/40 rounded-xl">
          <button
            type="button"
            onClick={() => setShowHighlightsTab(true)}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              showHighlightsTab
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 ম্যাচ হাইলাইটস</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHighlightsTab(false)}
            className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              !showHighlightsTab
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>🏆 বিজয়ী বিবরণ</span>
          </button>
        </div>

        {/* MATCH HIGHLIGHTS SUMMARY CARD */}
        {showHighlightsTab && matchHighlights ? (
          <div className="bg-zinc-900/90 border border-amber-500/50 p-3 rounded-xl space-y-2.5 text-left animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                <Film className="w-4 h-4 text-amber-400" />
                <span>ম্যাচ হাইলাইটস সামারি (HIGHLIGHTS)</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 border border-emerald-500/40 rounded font-bold">
                COMPLETED
              </span>
            </div>

            {/* Highlights Grid Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/70 p-2 rounded-lg border border-white/10 space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>মোট সময় (DURATION)</span>
                </div>
                <div className="text-sm font-black text-cyan-300">
                  {formatTimer(matchHighlights.durationSeconds)}
                </div>
              </div>

              <div className="bg-black/70 p-2 rounded-lg border border-white/10 space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Swords className="w-3 h-3 text-rose-400" />
                  <span>মোট গুটি কাটা (CAPTURES)</span>
                </div>
                <div className="text-sm font-black text-rose-400">
                  ⚔️ {matchHighlights.totalCaptures}
                </div>
              </div>

              <div className="bg-black/70 p-2 rounded-lg border border-white/10 space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Dices className="w-3 h-3 text-amber-400" />
                  <span>মোট ডাইস চাল (ROLLS)</span>
                </div>
                <div className="text-sm font-black text-amber-300">
                  🎲 {matchHighlights.totalRolls}
                </div>
              </div>

              <div className="bg-black/70 p-2 rounded-lg border border-white/10 space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>ম্যাচ MVP (BEST PLAYER)</span>
                </div>
                <div className="text-xs font-black text-emerald-300 truncate">
                  {matchHighlights.mvpPlayerEmoji} {matchHighlights.mvpPlayerName}
                </div>
              </div>
            </div>

            {/* Final Winning Move Highlight Banner */}
            <div className="bg-amber-950/60 border border-amber-500/60 p-2 rounded-lg text-xs space-y-1">
              <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>চূড়ান্ত বিজয়ী চাল (FINAL WINNING MOVE):</span>
              </div>
              <p className="text-[11px] font-bold text-amber-100 font-sans leading-tight">
                {matchHighlights.winningMoveText}
              </p>
            </div>

            {/* Key Timeline Highlights List */}
            {matchHighlights.keyMoments.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">
                  📍 ম্যাচের বিশেষ বিশেষ ঘটনা (KEY MOMENTS):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {matchHighlights.keyMoments.map((moment, idx) => (
                    <div key={idx} className="text-[11px] text-zinc-200 bg-black/50 px-2 py-1 border border-white/5 rounded flex items-center gap-1.5 font-sans">
                      <span className="text-amber-400 text-[10px] font-mono">#{idx + 1}</span>
                      <span className="truncate">{moment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-200/80 leading-relaxed px-2 font-sans">
            {winner.name} ({realm.name}) এর ৪টি গুটি পোর্টালে সাফল্যের সাথে প্রবেশ করেছে এবং চূড়ান্ত বিজয় লাভ করেছে!
          </p>
        )}

        {/* Ad Banner Inside Victory Dialog */}
        <AdBanner type="rectangle_300x250" />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onPlayAgain}
            className="py-3 px-2 bg-[#00FF41] hover:bg-white text-black font-black uppercase text-xs tracking-wider rounded-xl border border-[#00FF41] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,255,65,0.4)]"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{isOnlineMatch ? 'অনলাইন রুম' : 'আবার চালুন'}</span>
          </button>

          <button
            onClick={handleHomeClick}
            className="py-3 px-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl border border-amber-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.4)]"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>হোম বাটন</span>
          </button>
        </div>

      </div>

      {/* Bottom Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-sm shrink-0 my-1" />

    </div>
  );
};
