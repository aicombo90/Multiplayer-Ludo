import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { POWERUP_INFO } from '../constants/gameConstants';


interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg bg-black border-2 border-white/20 p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF4D00]" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-white">
              [ HOW TO PLAY — RULES ]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-white/20 hover:border-[#FF4D00] text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-white/80">
          <section className="space-y-1">
            <h3 className="font-bold text-sm text-[#FF4D00] flex items-center gap-1.5 uppercase tracking-wider">
              <span>🎯</span> OBJECTIVE
            </h3>
            <p>
              Lead all 4 realm tokens out of your yard, travel clockwise around the 52-cell track, navigate up your home stretch, and enter the central Mythic Portal before any opponent!
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-sm text-[#FF4D00] flex items-center gap-1.5 uppercase tracking-wider">
              <span>🎲</span> ROLLING & MOVING
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Roll a <b>6</b> to release a token from your yard onto your start cell.</li>
              <li>Rolling a <b>6</b> gives an extra bonus roll!</li>
              <li>Landing on an opponent's token on a non-safe cell captures it, sending it back to their yard.</li>
              <li>Cells marked with a star (<b>★</b>) or a realm's start cell are safe sanctuaries.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[#FF4D00] flex items-center gap-1.5 uppercase tracking-wider">
              <span>✨</span> POWER-UPS & SPECIAL BLESSINGS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(POWERUP_INFO).map(([type, info]) => (
                <div key={type} className="p-2.5 border border-white/15 bg-black flex items-start gap-2">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <h4 className="font-bold text-white uppercase">{info.name}</h4>
                    <p className="text-[10px] text-white/60 mt-0.5">{info.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-sm text-[#FF4D00] flex items-center gap-1.5 uppercase tracking-wider">
              <span>👑</span> REALM BLESSING
            </h3>
            <p>
              Once per game, if you roll a 1 with no legal moves available, your realm's ancient spirit awakens, automatically converting the roll into a <b>6</b>!
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#FF4D00] hover:bg-white text-black font-black uppercase text-xs tracking-widest border border-[#FF4D00] transition-all cursor-pointer"
        >
          GOT IT, LET'S PLAY!
        </button>

      </div>
    </div>
  );
};
