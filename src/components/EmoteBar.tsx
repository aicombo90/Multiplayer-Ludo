import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';


export interface Emote {
  id: string;
  emoji: string;
}

export const PREDEFINED_EMOTES: Emote[] = [
  { id: 'laugh', emoji: '😂' },
  { id: 'angry', emoji: '😡' },
  { id: 'clap', emoji: '👏' },
  { id: 'fire', emoji: '🔥' },
  { id: 'shocked', emoji: '😱' },
  { id: 'pro', emoji: '😎' },
  { id: 'poop', emoji: '💩' },
  { id: 'crown', emoji: '👑' },
  { id: 'target', emoji: '🎯' },
  { id: 'thunder', emoji: '⚡' },
  { id: 'brain', emoji: '🧠' },
  { id: 'cry', emoji: '😭' },
  { id: 'clown', emoji: '🤡' },
  { id: 'dice', emoji: '🎲' },
  { id: 'trophy', emoji: '🏆' },
  { id: 'boom', emoji: '💥' },
  { id: 'cursing', emoji: '🤬' },
  { id: 'bomb', emoji: '💣' },
  { id: 'party', emoji: '🥳' },
  { id: 'pumpkin', emoji: '🎃' },
  { id: 'ghost', emoji: '👻' },
  { id: 'skull', emoji: '💀' },
  { id: 'popcorn', emoji: '🍿' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'diamond', emoji: '💎' },
  { id: 'swords', emoji: '⚔️' },
  { id: 'sleep', emoji: '😴' },
  { id: 'vomit', emoji: '🤮' }
];

interface EmotePickerProps {
  onSendEmote: (emote: Emote) => void;
  disabled?: boolean;
}

export const EmotePicker: React.FC<EmotePickerProps> = ({ onSendEmote, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emote: Emote) => {
    soundEngine.playPowerup();
    onSendEmote(emote);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] hover:bg-[#ffe234] text-black text-xs font-black uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-lg"
        title="Send Expressive Emote"
      >
        <Smile className="w-4 h-4 text-black" />
        <span>ইমোটস / EMOTES</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing popover on click outside */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 bottom-full mb-2 z-50 w-64 sm:w-72 bg-zinc-950 border-2 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.4)] p-3 text-white rounded-xl"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FFD700] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ইমোট নির্বাচন করুন</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Emojis without text labels */}
              <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                {PREDEFINED_EMOTES.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleSelect(e)}
                    className="flex items-center justify-center p-2 bg-black hover:bg-zinc-800 border border-white/10 hover:border-[#FFD700] transition-transform rounded-lg group cursor-pointer hover:scale-125"
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform duration-150">
                      {e.emoji}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface ActiveEmoteData {
  senderName: string;
  emoji: string;
  label?: string;
  bnLabel?: string;
  timestamp: number;
}

interface EmoteOverlayProps {
  emote: ActiveEmoteData | null;
}

export const EmoteOverlay: React.FC<EmoteOverlayProps> = ({ emote }) => {
  if (!emote) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={emote.timestamp}
        initial={{ opacity: 0, scale: 0.3, y: 30 }}
        animate={{ opacity: 1, scale: 1.2, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -30 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
      >
        <span className="text-7xl sm:text-8xl select-none animate-bounce block">
          {emote.emoji}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export const EmoteBar = EmotePicker;

