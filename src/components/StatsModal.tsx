import React from 'react';
import { X, Trophy, Swords, Zap, RefreshCw } from 'lucide-react';
import { GameStats } from '../types';
import { REALMS } from '../constants/gameConstants';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-black border-2 border-white/20 p-6 shadow-2xl text-white space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF4D00]" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-white">[ MATCH RECORDS ]</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-white/20 hover:border-[#FF4D00] text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 border border-white/15 bg-black space-y-0.5">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">[ GAMES PLAYED ]</span>
            <p className="text-3xl font-black text-white font-display">{stats.gamesPlayed}</p>
          </div>
          <div className="p-3.5 border border-white/15 bg-black space-y-0.5">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">[ TOTAL CAPTURES ]</span>
            <p className="text-3xl font-black text-[#FF4D00] font-display">{stats.captures}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest">
            REALM WINS BREAKDOWN
          </h3>
          <div className="space-y-1.5">
            {REALMS.map(realm => (
              <div
                key={realm.id}
                className="p-2.5 border border-white/15 bg-black flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{realm.emoji}</span>
                  <span className="font-bold text-white uppercase">{realm.name}</span>
                </div>
                <span className="font-extrabold text-[#00FF41]">
                  {stats.wins[realm.yard] ?? 0} WINS
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onResetStats}
            className="px-3 py-2 border border-white/20 hover:border-rose-500 text-xs text-white/70 hover:text-rose-500 flex items-center gap-1.5 transition-all cursor-pointer uppercase font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET STATS</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-[#FF4D00] font-black text-xs text-black hover:text-white uppercase tracking-wider border border-white transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
