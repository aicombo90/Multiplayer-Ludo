import React, { useState, useEffect } from 'react';
import { Users, X, PlusCircle, LogIn, Loader2, Check, Copy, Play } from 'lucide-react';
import { RealmId, Player, Token, GameState, PowerupType } from '../types';
import { REALMS, PATH, SAFE_IDX } from '../constants/gameConstants';
import { AdBanner } from './AdBanner';
import {
  createRoomInFirestore,
  joinRoomInFirestore,
  startRoomMatchInFirestore,
  subscribeToRoom,
  getCurrentUserIdSync,
  RoomData,
  RoomPlayer
} from '../services/firebase';


interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetRoomCode?: (roomCode: string) => void;
  onRoomMatchStarted: (roomCode: string, isHost: boolean) => void;
  activeRoomCode: string | null;
  onLeaveRoom: () => void;
  initialPlayerName?: string;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  onSetRoomCode,
  onRoomMatchStarted,
  activeRoomCode,
  onLeaveRoom,
  initialPlayerName
}) => {
  const [tab, setTab] = useState<'create' | 'join' | 'lobby'>(activeRoomCode ? 'lobby' : 'create');
  const [playerName, setPlayerName] = useState(() => initialPlayerName || localStorage.getItem('mythic_ludo_player_name') || 'Warrior 1');
  const [isNameSubmitted, setIsNameSubmitted] = useState<boolean>(() => !!initialPlayerName || !!localStorage.getItem('mythic_ludo_player_name'));

  useEffect(() => {
    if (initialPlayerName && initialPlayerName.trim()) {
      setPlayerName(initialPlayerName.trim());
      setIsNameSubmitted(true);
    }
  }, [initialPlayerName]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [selectedMatchType, setSelectedMatchType] = useState<'normal' | 'relic'>('normal');
  const [selectedRealm, setSelectedRealm] = useState<RealmId>(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(() => getCurrentUserIdSync());

  // Subscribe to real-time room updates if room code is active
  useEffect(() => {
    const codeToSubscribe = activeRoomCode || currentRoom?.roomCode;
    if (!codeToSubscribe) {
      return;
    }

    const unsubscribe = subscribeToRoom(codeToSubscribe, (room) => {
      if (room) {
        setCurrentRoom(room);
        setTab('lobby');
        if (room.status === 'playing') {
          const isHost = room.players.find(p => p.id === myUserId)?.isHost ?? false;
          onRoomMatchStarted(room.roomCode, isHost);
        }
      } else {
        setErrorMsg('রুমটি মুছে ফেলা হয়েছে বা পাওয়া যায়নি।');
        onLeaveRoom();
      }
    });

    return () => unsubscribe();
  }, [activeRoomCode, currentRoom?.roomCode, myUserId]);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { roomCode, userId } = await createRoomInFirestore(
        playerName.trim() || 'Host',
        selectedRealm,
        maxPlayers,
        selectedMatchType
      );
      setMyUserId(userId);
      if (onSetRoomCode) onSetRoomCode(roomCode);
      setTab('lobby');
    } catch (err: any) {
      setErrorMsg(err.message || 'রুম তৈরি করতে ব্যর্থ হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMsg('অনুগ্রহ করে রুম কোডটি লিখুন!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const formattedCode = roomCodeInput.trim().toUpperCase();
      const { userId } = await joinRoomInFirestore(
        formattedCode,
        playerName.trim() || 'Player',
        selectedRealm
      );
      setMyUserId(userId);
      if (onSetRoomCode) onSetRoomCode(formattedCode);
      setTab('lobby');
    } catch (err: any) {
      setErrorMsg(err.message || 'রুমে জয়েন করতে সমস্যা হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = currentRoom?.roomCode || activeRoomCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartMatch = async () => {
    if (!currentRoom || currentRoom.players.length < 2) return;
    setLoading(true);
    try {
      // Build initial GameState for room match
      const initialPlayers: Player[] = currentRoom.players.map((rp, idx) => {
        // Rotate diagonal opposite realms (Pair A: 0 & 2 [Mayan/Viking], Pair B: 1 & 3 [Pharaoh/Shogun]) if 2-player match
        let assignedRealmIdx = rp.realmIdx;
        if (currentRoom.players.length === 2) {
          const roomHash = (currentRoom.roomCode || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + Date.now();
          const useSecondPair = roomHash % 2 === 0;
          if (useSecondPair) {
            assignedRealmIdx = idx === 0 ? 1 : 3; // Pharaoh (Gold/Top-Right) vs Shogun (Red/Bottom-Left)
          } else {
            assignedRealmIdx = idx === 0 ? 0 : 2; // Mayan (Green/Top-Left) vs Viking (Blue/Bottom-Right)
          }
        }

        const realm = REALMS[assignedRealmIdx];
        const tokens: Token[] = [0, 1, 2, 3].map(id => ({
          id,
          pos: -1,
          state: 'yard',
          shielded: false,
          slot: id // Must be token id (0, 1, 2, 3) for proper yard slot placement
        }));

        return {
          id: rp.id,
          name: rp.name,
          realmIdx: assignedRealmIdx,
          isAI: false,
          tokens,
          finishedCount: 0,
          blessingUsed: false,
          slot: idx
        };
      });

      // Initial powerups for Relic Mode
      const initialPowerups: Record<number, any> = {};
      if (currentRoom.matchType === 'relic') {
        const candidates: number[] = [];
        for (let i = 0; i < PATH.length; i++) {
          if (!SAFE_IDX.has(i)) candidates.push(i);
        }
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        const chosen = candidates.slice(0, 5);
        const relicTypes: PowerupType[] = ['dice', 'shield', 'dash', 'warp', 'double_dice'];
        chosen.forEach((idx, i) => {
          initialPowerups[idx] = relicTypes[i % relicTypes.length];
        });
      }

      const initialGameState: GameState = {
        players: initialPlayers,
        turn: 0,
        dice: null,
        rolling: false,
        consecutiveSixes: 0,
        awaitingMove: false,
        movable: [],
        gameOver: false,
        winner: null,
        powerups: initialPowerups,
        turnTimerRemaining: null
      };

      await startRoomMatchInFirestore(currentRoom.roomCode, initialGameState);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'খেলা শুরু করতে ব্যর্থ হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  const isHost = currentRoom?.players.find(p => p.id === myUserId)?.isHost ?? false;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 font-mono select-none overflow-y-auto">
      
      {/* Top Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-lg shrink-0 my-1" />

      <div className="w-full max-w-lg bg-black border-2 border-white/20 p-5 sm:p-6 shadow-2xl text-white overflow-y-auto space-y-5 relative my-auto rounded-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF4D00]" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight">
              [ MULTIPLAYER ROOMS ]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-white/20 hover:border-[#FF4D00] text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INITIAL STEP: NAME SUBMISSION BEFORE ROOM CREATION/JOINING */}
        {!activeRoomCode && !isNameSubmitted && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (playerName.trim()) {
                setIsNameSubmitted(true);
                setErrorMsg(null);
              } else {
                setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন!');
              }
            }}
            className="space-y-4 text-xs animate-fade-in"
          >
            <div className="p-4 bg-zinc-950 border border-white/20 rounded-xl space-y-3">
              <label className="block text-amber-300 font-extrabold uppercase text-xs tracking-wider">
                আপনার নাম লিখুন (ENTER YOUR NAME) <span className="text-[#FF4D00]">*</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={15}
                autoFocus
                className="w-full p-3.5 bg-black border-2 border-amber-400 text-amber-200 font-black uppercase text-base focus:border-[#00FF41] outline-none rounded-lg shadow-inner"
                placeholder="আপনার নাম..."
              />
              <p className="text-[10px] text-white/50 font-mono">
                * রুমে আপনার বন্ধুদের দেখানোর জন্য একটি সুন্দর নাম দিন।
              </p>
            </div>

            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full py-4 bg-[#FF4D00] hover:bg-white text-black font-black uppercase tracking-widest text-sm border-2 border-[#FF4D00] hover:border-white transition-all shadow-[0_0_20px_rgba(255,77,0,0.5)] cursor-pointer disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
            >
              <span>সাবমিট করুন (SUBMIT & CONTINUE)</span>
              <span>➔</span>
            </button>
          </form>
        )}

        {/* Tab Navigation (If name is submitted and not currently in active room) */}
        {!activeRoomCode && isNameSubmitted && (
          <div className="space-y-3">
            {/* Saved Player Name Display Banner */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-950 border border-amber-500/40 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black">👤 প্লেয়ার নাম:</span>
                <span className="font-extrabold text-white uppercase text-sm">{playerName}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNameSubmitted(false)}
                className="text-[10px] text-amber-300 hover:text-white underline font-bold uppercase cursor-pointer"
              >
                [নাম পরিবর্তন]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase">
              <button
                type="button"
                onClick={() => { setTab('create'); setErrorMsg(null); }}
                className={`py-2.5 border transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-lg ${
                  tab === 'create'
                    ? 'border-[#FF4D00] bg-[#FF4D00] text-black font-black'
                    : 'border-white/20 bg-black text-white/70 hover:border-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>রুম তৈরি (CREATE)</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('join'); setErrorMsg(null); }}
                className={`py-2.5 border transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-lg ${
                  tab === 'join'
                    ? 'border-[#00FF41] bg-[#00FF41] text-black font-black'
                    : 'border-white/20 bg-black text-white/70 hover:border-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>জয়েন রুম (JOIN)</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 border border-rose-500 bg-rose-950/40 text-rose-300 text-xs font-bold uppercase tracking-wide rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* CREATE ROOM TAB */}
        {tab === 'create' && !activeRoomCode && isNameSubmitted && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-white/80 font-extrabold uppercase mb-1.5 text-[11px] tracking-wider">
                ম্যাচ টাইপ নির্বাচন করুন (SELECT MATCH TYPE) <span className="text-[#FF4D00]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatchType('normal')}
                  className={`p-3 border-2 cursor-pointer transition-all rounded-lg text-left ${
                    selectedMatchType === 'normal'
                      ? 'border-[#00FF41] bg-[#00FF41]/15 text-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.3)]'
                      : 'border-white/20 bg-zinc-950 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  <div className="font-black text-sm uppercase flex items-center gap-1.5">
                    <span>🎲 1. Normal Match</span>
                  </div>
                  <div className="text-[10px] text-zinc-300 font-medium mt-1 leading-tight">
                    ক্লাসিক লুদো নিয়ম ও কোনো পাওয়ার-আপ ছাড়া স্বাভাবিক খেলা
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMatchType('relic')}
                  className={`p-3 border-2 cursor-pointer transition-all rounded-lg text-left ${
                    selectedMatchType === 'relic'
                      ? 'border-[#FF4D00] bg-[#FF4D00]/15 text-[#FF4D00] shadow-[0_0_12px_rgba(255,77,0,0.3)]'
                      : 'border-white/20 bg-zinc-950 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  <div className="font-black text-sm uppercase flex items-center gap-1.5">
                    <span>⚡ 2. Power Relic Mode</span>
                  </div>
                  <div className="text-[10px] text-zinc-300 font-medium mt-1 leading-tight">
                    বোর্ডে বিশেষ স্পেশাল রেলিক টোকেন থাকবে (ড্যাশ, শিল্ড, চয়েস ডাইস)
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/70 font-bold uppercase mb-1">
                মোট প্লেয়ার সংখ্যা (Max Players)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-2.5 border font-extrabold cursor-pointer transition-all rounded-lg ${
                      maxPlayers === num
                        ? 'border-[#FF4D00] bg-[#FF4D00]/20 text-[#FF4D00]'
                        : 'border-white/20 bg-black text-white/60 hover:text-white'
                    }`}
                  >
                    {num} PLAYERS
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={loading || !playerName.trim()}
              className="w-full py-3.5 bg-[#FF4D00] hover:bg-white text-black font-black uppercase tracking-widest border border-[#FF4D00] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded-lg shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              <span>রুম তৈরি করুন (CREATE ROOM)</span>
            </button>
          </div>
        )}

        {/* JOIN ROOM TAB */}
        {tab === 'join' && !activeRoomCode && isNameSubmitted && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-white/70 font-bold uppercase mb-1">
                রুম কোড লিখুন (6-Digit Room Code) <span className="text-[#00FF41]">*</span>
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full p-3 bg-black border-2 border-[#00FF41] text-[#00FF41] font-black text-center text-2xl tracking-[0.3em] uppercase focus:outline-none rounded-lg"
                placeholder="XXXXXX"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={loading || !playerName.trim() || !roomCodeInput.trim()}
              className="w-full py-3.5 bg-[#00FF41] hover:bg-white text-black font-black uppercase tracking-widest border border-[#00FF41] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded-lg shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>রুমে জয়েন করুন (JOIN ROOM)</span>
            </button>
          </div>
        )}

        {/* LOBBY TAB */}
        {(tab === 'lobby' || activeRoomCode) && (
          <div className="space-y-4 text-xs">
            {/* Room Code Display Box */}
            <div className="p-4 border-2 border-[#FF4D00] bg-black text-center space-y-2">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] block">
                [ ROOM CODE / বন্ধুদের শেয়ার করুন ]
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#FF4D00] tracking-[0.3em] uppercase">
                {currentRoom?.roomCode || activeRoomCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black font-bold uppercase tracking-wider border border-white/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#00FF41]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>

            {/* Match Mode Badge */}
            <div className="p-3 bg-zinc-950 border border-amber-500/40 rounded-lg flex items-center justify-between font-bold text-xs">
              <span className="text-zinc-400 uppercase">MATCH MODE:</span>
              <span className={`px-2.5 py-1 rounded font-black uppercase border ${
                currentRoom?.matchType === 'relic'
                  ? 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]'
                  : 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]'
              }`}>
                {currentRoom?.matchType === 'relic' ? '⚡ POWER RELIC MODE' : '🎲 NORMAL MATCH'}
              </span>
            </div>

            {/* In-Lobby Status Indicator & Players List */}
            <div className="space-y-3 p-3.5 border-2 border-[#00FF41]/40 bg-black/80">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FF41]"></span>
                  </span>
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    IN-LOBBY CONNECTED PLAYERS
                  </span>
                </div>
                <span className="text-[11px] font-black text-[#00FF41] bg-[#00FF41]/10 px-2 py-0.5 border border-[#00FF41]/30 uppercase">
                  {currentRoom?.players.length ?? 1} / {currentRoom?.maxPlayers ?? 4} PLAYERS
                </span>
              </div>

              <div className="space-y-2">
                {currentRoom?.players.map((p, idx) => {
                  const realm = REALMS[p.realmIdx];
                  const isMe = p.id === myUserId;

                  return (
                    <div
                      key={p.id || idx}
                      className="p-3 border border-white/20 bg-zinc-950 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{realm.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm uppercase tracking-wide">
                              {p.name} {isMe ? <span className="text-[#00FF41] font-mono text-xs">(YOU)</span> : ''}
                            </span>
                            {p.isHost && (
                              <span className="bg-[#FF4D00] text-black text-[9px] px-1.5 font-black uppercase rounded-xs">
                                HOST
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/60 font-mono uppercase">
                            [ {realm.name} ]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#00FF41]/10 border border-[#00FF41]/50 px-2.5 py-1 text-[#00FF41] text-[10px] font-black uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse"></span>
                        <span>IN-LOBBY</span>
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slots waiting for players */}
                {Array.from({ length: (currentRoom?.maxPlayers ?? 4) - (currentRoom?.players.length ?? 1) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-3 border border-dashed border-white/15 bg-black/40 flex items-center justify-between opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-white/30">⏳</span>
                      <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                        [ WAITING FOR PLAYER {(currentRoom?.players.length ?? 1) + i + 1} ]
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/30 uppercase">
                      OPEN SLOT
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Action or Waiting Indicator */}
            {isHost ? (
              <button
                onClick={handleStartMatch}
                disabled={loading || (currentRoom?.players.length ?? 0) < 2}
                className="w-full py-4 bg-[#00FF41] hover:bg-white text-black font-black uppercase text-sm tracking-widest border border-[#00FF41] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>
                  {(currentRoom?.players.length ?? 0) < 2
                    ? 'অন্য প্লেয়ার জয়েন করার জন্য অপেক্ষা করুন...'
                    : 'খেলা শুরু করুন (START MATCH)'}
                </span>
              </button>
            ) : (
              <div className="p-3 border border-amber-500/50 bg-amber-950/20 text-amber-300 text-center font-bold uppercase tracking-wide animate-pulse">
                ⏳ হোস্ট গেম শুরু করার জন্য অপেক্ষা করুন...
              </div>
            )}

            {/* Leave Room Button */}
            <button
              onClick={() => {
                onLeaveRoom();
                onClose();
              }}
              className="w-full py-2.5 border border-rose-500/50 hover:border-rose-500 text-rose-400 font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              রুম থেকে বের হন (LEAVE ROOM)
            </button>
          </div>
        )}

      </div>

      {/* Bottom Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-lg shrink-0 my-1" />

    </div>
  );
};
