import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitGame: () => void;
  isOnlineMatch?: boolean;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onExitGame,
  isOnlineMatch
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between p-2 sm:p-4 font-mono select-none overflow-y-auto animate-fade-in">
      
      {/* Top Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-md shrink-0 my-1" />

      <div className="w-full max-w-md bg-zinc-950 border-2 border-rose-600 p-5 sm:p-6 shadow-2xl rounded-2xl text-white space-y-5 relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-900/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-500 animate-bounce" />
            <h3 className="font-display font-black text-lg uppercase tracking-wider text-rose-400">
              গেম থেকে বের হতে চান? (EXIT GAME)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Message */}
        <div className="p-4 bg-rose-950/40 border border-rose-600/40 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-white leading-relaxed">
            আপনি কি নিশ্চিত যে গেম থেকে বের হয়ে হোম পেজে ফিরে যেতে চান?
          </p>
          {isOnlineMatch && (
            <p className="text-amber-300 font-bold text-[11px] leading-normal pt-1 border-t border-rose-900/40">
              ⚠️ অনলাইন গেম চলাকালীন বের হলে আপনার ম্যাচটি বাতিল হয়ে যাবে এবং অন্যান্য প্লেয়াররা অবগত হবে।
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider border border-white/20 rounded-xl transition-all cursor-pointer"
          >
            ↩️ গেম চালু রাখুন (CANCEL)
          </button>
          
          <button
            type="button"
            onClick={() => {
              onExitGame();
              onClose();
            }}
            className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider border border-rose-400 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>গেম বাতিল (EXIT)</span>
          </button>
        </div>

        {/* Ad Banner inside card */}
        <AdBanner type="banner_468x60" className="pt-1" />

      </div>

      {/* Bottom Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-md shrink-0 my-1" />

    </div>
  );
};