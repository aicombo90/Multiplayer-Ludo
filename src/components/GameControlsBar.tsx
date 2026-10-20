import React from 'react';
import { GameState, GameSettings, RealmId } from '../types';
import { REALMS } from '../constants/gameConstants';
import { VoiceChatState } from '../services/voiceChat';
import { VoiceChatControls } from './VoiceChatControls';
import { EmoteBar } from './EmoteBar';
import { Dices, Sparkles, Clock } from 'lucide-react';

interface GameControlsBarProps {
  gameState: GameState;
  settings: GameSettings;
  onUpdateSettings?: (newSettings: Partial<GameSettings>) => void;
  onManualRoll: () => void;
  statusText: string;
  onSendEmote: (emote: any) => void;
  onlineRoomCode?: string | null;
  voiceChatState?: VoiceChatState;
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
  expectedPlayerIds?: string[];
  myUserId?: string;
  onResyncVoiceChat?: () => void;
  choiceDiceActive?: boolean;
  onChoiceDiceRoll?: (chosenNum: number) => void;
}

export const GameControlsBar: React.FC<GameControlsBarProps> = ({
  gameState,
  onManualRoll,
  statusText,
  onSendEmote,
  onlineRoomCode,
  voiceChatState,
  onToggleMic,
  onToggleSpeaker,
  expectedPlayerIds = [],
  myUserId = '',
  onResyncVoiceChat,
  choiceDiceActive = false,
  onChoiceDiceRoll
}) => {
  const currentPlayer = gameState.players[gameState.turn];
  const realm = currentPlayer ? REALMS[currentPlayer.realmIdx] : REALMS[0];
  const canRoll = !gameState.gameOver && !gameState.rolling && !gameState.awaitingMove && (!currentPlayer?.isAI || false);

  return (
    <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl px-2 py-1.5 flex flex-col gap-2 font-mono select-none">
      {/* Status Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-zinc-950/90 border border-white/20 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{realm.emoji}</span>
          <div className="truncate">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {statusText}
            </span>
          </div>
        </div>

        {/* Turn Timer Remaining */}
        {gameState.turnTimerRemaining !== null && gameState.turnTimerRemaining !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-md shrink-0 border ${
            gameState.turnTimerRemaining <= 5
              ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-zinc-900 border-white/20 text-amber-400'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{gameState.turnTimerRemaining}s</span>
          </div>
        )}
      </div>

      {/* Choice Dice Selector or Roll Action */}
      {choiceDiceActive && onChoiceDiceRoll ? (
        <div className="w-full p-2.5 bg-gradient-to-r from-purple-950/90 via-zinc-950 to-purple-950/90 border-2 border-purple-500/60 rounded-xl flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-fade-in">
          <div className="flex items-center gap-1 text-xs font-bold text-purple-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>BONUS DICE SELECTOR — CHOOSE YOUR STEPS</span>
          </div>
          <div className="grid grid-cols-6 gap-2 w-full max-w-sm">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => onChoiceDiceRoll(num)}
                className="py-2.5 bg-purple-900/60 hover:bg-purple-600 border border-purple-400 text-white font-black text-base rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          {/* Main Dice Roll Button */}
          <button
            type="button"
            disabled={!canRoll}
            onClick={onManualRoll}
            className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
              canRoll
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.4)] cursor-pointer active:scale-98 animate-pulse'
                : 'bg-zinc-900/80 border-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Dices className={`w-5 h-5 ${gameState.rolling ? 'animate-spin' : ''}`} />
            <span>
              {gameState.rolling
                ? 'ROLLING...'
                : gameState.awaitingMove
                ? `MOVE TOKEN (${gameState.dice})`
                : `${realm.name}: ROLL DICE (চালুন)`}
            </span>
          </button>

          {/* Online Voice Chat Controls */}
          {onlineRoomCode && onToggleMic && onToggleSpeaker && (
            <VoiceChatControls
              isMicOn={voiceChatState?.isMicOn ?? true}
              isSpeakerOn={voiceChatState?.isSpeakerOn ?? true}
              onToggleMic={onToggleMic}
              onToggleSpeaker={onToggleSpeaker}
              connectedPeers={voiceChatState?.connectedPeers ?? []}
              expectedPlayerIds={expectedPlayerIds}
              myUserId={myUserId}
              onResync={onResyncVoiceChat}
            />
          )}
        </div>
      )}

      {/* Emote Quick Bar */}
      <EmoteBar onSendEmote={onSendEmote} />
    </div>
  );
};
