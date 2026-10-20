import React from 'react';
import { MoveLogEntry } from '../types';
import { REALMS } from '../constants/gameConstants';
import { X, History, Trash2 } from 'lucide-react';

interface MoveLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: MoveLogEntry[];
  onClearLogs: () => void;
}

export const MoveLogDrawer: React.FC<MoveLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-black border-l-2 border-white/20 h-full p-5 shadow-2xl flex flex-col text-white font-mono animate-slideLeft">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#FF4D00]" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight">[ MOVE HISTORY ]</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearLogs}
              className="p-1.5 border border-white/20 hover:border-rose-500 text-white/70 hover:text-rose-500 transition-all cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-white/20 hover:border-[#FF4D00] text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {logs.length === 0 ? (
            <p className="text-center text-xs text-white/40 py-12 uppercase">[ NO MOVES RECORDED ]</p>
          ) : (
            logs.map(log => {
              const realm = REALMS[log.playerRealm];
              return (
                <div
                  key={log.id}
                  className="p-3 border border-white/15 bg-black text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{log.playerEmoji}</span>
                    <div>
                      <span className="font-bold text-white">{log.playerName.toUpperCase()}: </span>
                      <span className="text-white/80">{log.action}</span>
                      {log.details && (
                        <p className="text-[10px] text-[#FF4D00] mt-0.5 uppercase">{log.details}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-white/50">{log.timestamp}</span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
