import React from 'react';
import { GameState, RealmId, TokenState } from '../types';
import { REALMS, PATH, SAFE_IDX, STAR_BLESSING_IDX, POWERUP_INFO } from '../constants/gameConstants';
import { VoiceChatState } from '../services/voiceChat';
import { Sparkles, Shield, Dices } from 'lucide-react';

export interface BoardProps {
  gameState: GameState;
  onDiceClick: () => void;
  onTokenClick: (realmIdx: RealmId, tokenId: number) => void;
  onYardClick: (realmIdx: RealmId) => void;
  view3D?: boolean;
  tauntPopup?: any;
  speakingPlayers?: Record<string, boolean>;
  onlineRoomCode?: string | null;
  voiceChatState?: VoiceChatState;
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
  expectedPlayerIds?: string[];
  myUserId?: string;
  onResyncVoiceChat?: () => void;
  onSendEmote?: (emote: any) => void;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  onDiceClick,
  onTokenClick,
  onYardClick,
  tauntPopup,
  speakingPlayers = {}
}) => {
  const currentPlayer = gameState.players[gameState.turn];
  const canRoll = !gameState.gameOver && !gameState.rolling && !gameState.awaitingMove && (!currentPlayer?.isAI || false);

  // Quick lookup for tokens at grid coordinate [r, c]
  const getTokenCoords = (realmIdx: RealmId, tok: TokenState): [number, number] | null => {
    if (tok.state === 'yard' || tok.state === 'done') return null;
    const realm = REALMS[realmIdx];
    if (tok.pos <= 50) {
      const idx = (realm.start + tok.pos) % 52;
      return PATH[idx];
    }
    const homeIdx = tok.pos - 51;
    if (homeIdx >= 0 && homeIdx < realm.home.length) {
      return realm.home[homeIdx];
    }
    return null;
  };

  // Find all tokens on a specific cell [r, c]
  const getTokensAtCell = (r: number, c: number) => {
    const list: { realmIdx: RealmId; token: TokenState; isCurrentMovable: boolean }[] = [];
    gameState.players.forEach(p => {
      p.tokens.forEach(tok => {
        const coord = getTokenCoords(p.realmIdx, tok);
        if (coord && coord[0] === r && coord[1] === c) {
          const isCurrentMovable =
            currentPlayer?.realmIdx === p.realmIdx &&
            gameState.awaitingMove &&
            gameState.movable.includes(tok.id);
          list.push({ realmIdx: p.realmIdx, token: tok, isCurrentMovable });
        }
      });
    });
    return list;
  };

  // Helper to get path index from [r, c]
  const getPathIndex = (r: number, c: number): number => {
    return PATH.findIndex(([pr, pc]) => pr === r && pc === c);
  };

  // Check if cell is in yard (0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left)
  const getYardRealm = (r: number, c: number): RealmId | null => {
    if (r < 6 && c < 6) return 0;
    if (r < 6 && c >= 9) return 1;
    if (r >= 9 && c >= 9) return 2;
    if (r >= 9 && c < 6) return 3;
    return null;
  };

  // Check if cell is in center home triangle area
  const isCenter = (r: number, c: number) => r >= 6 && r <= 8 && c >= 6 && c <= 8;

  // Render individual Yard (6x6 Corner)
  const renderYard = (realmId: RealmId) => {
    const realm = REALMS[realmId];
    const player = gameState.players.find(p => p.realmIdx === realmId);
    const isCurrentTurn = currentPlayer?.realmIdx === realmId;
    const yardTokens = player ? player.tokens.filter(t => t.state === 'yard') : [];
    const isSpeaking = player?.id ? speakingPlayers[player.id] : false;

    const yardBgColors: Record<RealmId, string> = {
      0: 'bg-emerald-950/80 border-emerald-500/60',
      1: 'bg-amber-950/80 border-amber-500/60',
      2: 'bg-zinc-950 border-zinc-700/80',
      3: 'bg-rose-950/80 border-rose-500/60'
    };

    return (
      <div
        onClick={() => onYardClick(realmId)}
        className={`w-full h-full p-2 rounded-2xl border-2 flex flex-col justify-between transition-all duration-200 select-none cursor-pointer ${
          yardBgColors[realmId]
        } ${isCurrentTurn ? 'ring-2 ring-white/80 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.01]' : 'opacity-90'}`}
      >
        {/* Yard Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{realm.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[80px]">
                {player?.name || realm.name}
              </span>
              <span className="text-[9px] font-bold text-white/50 uppercase">
                {player?.isAI ? '🤖 AI BOT' : '👤 HUMAN'}
              </span>
            </div>
          </div>
          {isSpeaking && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF41] animate-ping" title="Speaking" />
          )}
        </div>

        {/* 4 Yard Token Slots */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-black/40 rounded-xl border border-white/10 mx-auto">
          {[0, 1, 2, 3].map(slotIdx => {
            const tok = yardTokens.find(t => t.id === slotIdx);
            const isMovable =
              isCurrentTurn &&
              gameState.awaitingMove &&
              tok &&
              gameState.movable.includes(tok.id);

            return (
              <div
                key={slotIdx}
                onClick={e => {
                  if (tok && isMovable) {
                    e.stopPropagation();
                    onTokenClick(realmId, tok.id);
                  }
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  tok
                    ? isMovable
                      ? 'bg-amber-400 border-white text-black shadow-[0_0_12px_#FFD700] scale-110 cursor-pointer animate-pulse'
                      : 'bg-zinc-800/90 border-white/30 text-white cursor-pointer hover:scale-105'
                    : 'bg-black/30 border-dashed border-white/20'
                }`}
                style={tok ? { backgroundColor: realm.glowColor } : {}}
              >
                {tok && (
                  <span className="text-sm select-none drop-shadow">
                    {realm.tokenEmojis[slotIdx] || realm.emoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Home Done Progress */}
        <div className="text-[10px] text-center font-bold text-white/70">
          FINISHED: {player?.tokens.filter(t => t.state === 'done').length ?? 0} / 4
        </div>
      </div>
    );
  };

  // Render a single path cell
  const renderCell = (r: number, c: number) => {
    const pathIdx = getPathIndex(r, c);
    const tokens = getTokensAtCell(r, c);
    const isSafe = pathIdx !== -1 && SAFE_IDX.has(pathIdx);
    const isStar = pathIdx !== -1 && STAR_BLESSING_IDX.has(pathIdx);
    const powerup = pathIdx !== -1 && gameState.powerups ? gameState.powerups[pathIdx] : null;

    // Check if cell is in a Home Column
    let homeRealmColor: string | null = null;
    REALMS.forEach(realm => {
      if (realm.home.some(([hr, hc]) => hr === r && hc === c)) {
        homeRealmColor = realm.glowColor;
      }
    });

    return (
      <div
        key={`${r}-${c}`}
        className={`relative w-full h-full border border-white/10 flex items-center justify-center transition-colors ${
          homeRealmColor
            ? 'bg-opacity-40'
            : isSafe
            ? 'bg-amber-500/15'
            : 'bg-zinc-900/60'
        }`}
        style={homeRealmColor ? { backgroundColor: `${homeRealmColor}33` } : {}}
      >
        {/* Safe / Star Tile Badge */}
        {isStar ? (
          <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute inset-auto opacity-70 pointer-events-none animate-spin" />
        ) : isSafe ? (
          <span className="text-[10px] absolute inset-auto opacity-60 text-amber-400 pointer-events-none">⭐</span>
        ) : null}

        {/* Powerup Item on cell */}
        {powerup && POWERUP_INFO[powerup] && (
          <span className="text-xs absolute -top-1 -right-1 z-10 animate-bounce pointer-events-none drop-shadow">
            {POWERUP_INFO[powerup].emoji}
          </span>
        )}

        {/* Tokens standing on cell */}
        {tokens.map(({ realmIdx, token, isCurrentMovable }, idx) => {
          const realm = REALMS[realmIdx];
          return (
            <button
              key={`${realmIdx}-${token.id}`}
              type="button"
              onClick={e => {
                e.stopPropagation();
                if (isCurrentMovable) {
                  onTokenClick(realmIdx, token.id);
                }
              }}
              className={`absolute rounded-full border-2 flex items-center justify-center transition-all ${
                tokens.length > 1 ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 text-xs'
              } ${
                isCurrentMovable
                  ? 'border-white bg-amber-400 shadow-[0_0_15px_#FFD700] scale-125 z-30 animate-pulse cursor-pointer'
                  : 'border-white/60 z-20 cursor-default'
              }`}
              style={{
                backgroundColor: realm.glowColor,
                transform: tokens.length > 1 ? `translate(${(idx - (tokens.length - 1) / 2) * 6}px, ${(idx - (tokens.length - 1) / 2) * 6}px)` : undefined
              }}
            >
              <span className="drop-shadow">{realm.tokenEmojis[token.id] || realm.emoji}</span>
              {token.shielded && (
                <Shield className="w-2.5 h-2.5 text-cyan-300 absolute -top-1 -right-1 fill-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-full sm:max-w-xl md:max-w-2xl aspect-square p-2 sm:p-3 bg-zinc-950 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden font-mono select-none">
      {/* 15x15 Grid Arena */}
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 relative bg-black/80 rounded-2xl overflow-hidden border border-white/10">
        
        {/* Top-Left Yard (Mayan: 0..5, 0..5) */}
        <div className="col-start-1 col-end-7 row-start-1 row-end-7 z-10 p-0.5">
          {renderYard(0)}
        </div>

        {/* Top-Right Yard (Pharaoh: 0..5, 9..14) */}
        <div className="col-start-10 col-end-16 row-start-1 row-end-7 z-10 p-0.5">
          {renderYard(1)}
        </div>

        {/* Bottom-Right Yard (Viking: 9..14, 9..14) */}
        <div className="col-start-10 col-end-16 row-start-10 row-end-16 z-10 p-0.5">
          {renderYard(2)}
        </div>

        {/* Bottom-Left Yard (Shogun: 9..14, 0..5) */}
        <div className="col-start-1 col-end-7 row-start-10 row-end-16 z-10 p-0.5">
          {renderYard(3)}
        </div>

        {/* Center Portal / Finish Chamber (6..8, 6..8) */}
        <div
          onClick={() => {
            if (canRoll) onDiceClick();
          }}
          className={`col-start-7 col-end-10 row-start-7 row-end-10 z-20 bg-gradient-to-br from-amber-600 via-rose-600 to-purple-800 rounded-2xl border-2 border-amber-300 flex flex-col items-center justify-center p-1 shadow-[0_0_30px_rgba(255,215,0,0.4)] ${
            canRoll ? 'cursor-pointer animate-pulse hover:scale-105' : ''
          }`}
        >
          {gameState.dice !== null ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {gameState.dice}
              </span>
              <span className="text-[9px] font-black tracking-widest text-amber-200 uppercase">
                {gameState.awaitingMove ? 'SELECT TOKEN' : 'MYTHIC ROLL'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <Dices className={`w-8 h-8 text-amber-200 ${gameState.rolling ? 'animate-spin' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-wider text-white">
                {canRoll ? 'TAP TO ROLL' : 'ARENA PORTAL'}
              </span>
            </div>
          )}
        </div>

        {/* 15x15 Cells Grid */}
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => {
            if (getYardRealm(r, c) !== null || isCenter(r, c)) {
              return null;
            }
            return (
              <div
                key={`grid-${r}-${c}`}
                style={{
                  gridColumnStart: c + 1,
                  gridColumnEnd: c + 2,
                  gridRowStart: r + 1,
                  gridRowEnd: r + 2
                }}
              >
                {renderCell(r, c)}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Taunt Popups */}
      {tauntPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/90 border-2 border-amber-400 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-2xl">{tauntPopup.emoji}</span>
          <span className="text-xs font-black text-amber-300 uppercase">{tauntPopup.text}</span>
        </div>
      )}
    </div>
  );
};
