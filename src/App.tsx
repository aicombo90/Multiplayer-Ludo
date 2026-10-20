import React, { useState, useEffect, useRef } from 'react';
import {
  GameSettings,
  GameState,
  Player,
  TokenState,
  RealmId,
  MoveLogEntry,
  GameStats,
  GameMode,
  AIDifficulty,
  HouseRules
} from './types';
import {
  REALMS,
  PATH,
  SAFE_IDX,
  STAR_BLESSING_IDX,
  POWERUP_INFO
} from './constants/gameConstants';
import { soundEngine } from './services/soundEngine';
import { voiceAssistant } from './services/voiceAssistant';
import { chooseAIMove } from './services/aiEngine';
import { statsStorage } from './services/statsStorage';

import { TopBar } from './components/TopBar';
import { SetupWizard } from './components/SetupWizard';
import { Board } from './components/Board';
import { GameControlsBar } from './components/GameControlsBar';
import { OracleWidget } from './components/OracleWidget';
import { MoveLogDrawer } from './components/MoveLogDrawer';
import { RulesModal } from './components/RulesModal';
import { StatsModal } from './components/StatsModal';
import { VictoryModal, MatchHighlights } from './components/VictoryModal';
import { VARCaptureReplayModal, CaptureReplayData } from './components/VARCaptureReplayModal';
import { OnlineRoomModal } from './components/OnlineRoomModal';
import { EmoteOverlay, Emote, ActiveEmoteData } from './components/EmoteBar';
import { InitialLaunchScreen } from './components/InitialLaunchScreen';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { LoginModal } from './components/LoginModal';
import { PortalParticleExplosion } from './components/PortalParticleExplosion';
import { PowerupType } from './types';
import { voiceChatService, VoiceChatState } from './services/voiceChat';
import {
  auth,
  subscribeToRoom,
  updateRoomGameStateInFirestore,
  cancelRoomMatchInFirestore,
  sendEmoteInRoom,
  getCurrentUserIdSync,
  UserProfile,
  updateUserStatsInFirestore
} from './services/firebase';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ludoTheme') === 'light';
    } catch {
      return false;
    }
  });

  const [settings, setSettings] = useState<GameSettings>({
    mode: 'classic',
    playerCount: 4,
    aiDifficulty: 'tactician',
    speed: 1,
    voiceLanguage: 'bn',
    voiceEnabled: false,
    soundMuted: soundEngine.isMuted(),
    ambientMusic: false,
    view3D: true,
    autoRollHuman: false,
    houseRules: {
      enablePowerups: true,
      starBlessing: true,
      realmBlessing: true,
      threeSixesPenalty: true,
      blitzStartTokensOut: 0,
      turnTimerSeconds: 0
    }
  });

  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const lastMatchConfigRef = useRef<{
    playerRealms: RealmId[];
    slotIsAI: boolean[];
    mode: GameMode;
    aiDifficulty: AIDifficulty;
    houseRules: HouseRules;
  } | null>(null);
  const [showWizard, setShowWizard] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showMoveLog, setShowMoveLog] = useState<boolean>(false);
  const [showOnlineRoomModal, setShowOnlineRoomModal] = useState<boolean>(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlineRoomPlayers, setOnlineRoomPlayers] = useState<string[]>([]);

  const handleExitGame = () => {
    if (onlineRoomCode) {
      cancelRoomMatchInFirestore(onlineRoomCode).catch(() => {});
      setOnlineRoomCode(null);
    }
    setShowWizard(true);
    setGameState(prev => ({
      ...prev,
      gameOver: false,
      winner: null
    }));
  };

  const [voiceChatState, setVoiceChatState] = useState<VoiceChatState>({
    isMicOn: true,
    isSpeakerOn: true,
    connectedPeers: [],
    speakingPlayers: {}
  });

  const handleToggleMic = async () => {
    const nextState = await voiceChatService.toggleMic();
    setVoiceChatState(prev => ({ ...prev, isMicOn: nextState }));
  };

  const handleToggleSpeaker = () => {
    const nextState = voiceChatService.toggleSpeaker();
    setVoiceChatState(prev => ({ ...prev, isSpeakerOn: nextState }));
  };

  const handleResyncVoice = () => {
    if (onlineRoomCode) {
      const myUid = getCurrentUserIdSync();
      const idsFromGame = gameState.players.map(p => p.id).filter((id): id is string => !!id);
      const allPlayerIds = Array.from(new Set([...idsFromGame, ...onlineRoomPlayers, myUid]));
      voiceChatService.resyncVoiceChat(allPlayerIds);
    }
  };

  const [activeEmote, setActiveEmote] = useState<ActiveEmoteData | null>(null);
  const [matchDurationSeconds, setMatchDurationSeconds] = useState<number>(0);
  const [particleExplosion, setParticleExplosion] = useState<{
    active: boolean;
    isGrandVictory: boolean;
    realmColor: string;
  } | null>(null);

  // Auto-dismiss portal particle explosion fireworks after 1.8 seconds max so game never gets blocked
  useEffect(() => {
    if (!particleExplosion || !particleExplosion.active) return;
    const timer = setTimeout(() => {
      setParticleExplosion(null);
    }, particleExplosion.isGrandVictory ? 4000 : 1800);
    return () => clearTimeout(timer);
  }, [particleExplosion]);
  const [screenShakeActive, setScreenShakeActive] = useState<boolean>(false);
  const [choiceDiceActive, setChoiceDiceActive] = useState<boolean>(false);
  const [captureReplayData, setCaptureReplayData] = useState<CaptureReplayData | null>(null);
  const [matchCapturesCount, setMatchCapturesCount] = useState<number>(0);
  const [matchRollsCount, setMatchRollsCount] = useState<number>(0);
  const [keyMoments, setKeyMoments] = useState<string[]>([]);
  const [matchHighlights, setMatchHighlights] = useState<MatchHighlights | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    players: [],
    turn: 0,
    dice: null,
    rolling: false,
    consecutiveSixes: 0,
    awaitingMove: false,
    movable: [],
    gameOver: false,
    winner: null,
    powerups: {},
    turnTimerRemaining: null
  });

  // Match Duration Timer Effect - Starts as soon as game match starts
  useEffect(() => {
    if (!isAppLoaded || gameState.players.length === 0 || gameState.gameOver) return;

    const interval = setInterval(() => {
      setMatchDurationSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isAppLoaded, gameState.players.length, gameState.gameOver]);
  const lastEmoteTimeRef = useRef<number>(0);

  const [stats, setStats] = useState<GameStats>(() => statsStorage.getStats());
  const [moveLogs, setMoveLogs] = useState<MoveLogEntry[]>([]);
  const [oracleMsg, setOracleMsg] = useState<string>('পৌরাণিক পোর্টাল খুলছে... খেলা শুরু করার জন্য প্রস্তুত হয়ে যান!');
  const [isOracleSpeaking, setIsOracleSpeaking] = useState<boolean>(false);
  const [tauntPopup, setTauntPopup] = useState<{ r: number; c: number; text: string; id: number } | null>(null);

  // Keep sound mute & voice settings in sync
  useEffect(() => {
    soundEngine.setMuted(settings.soundMuted);
  }, [settings.soundMuted]);

  useEffect(() => {
    voiceAssistant.setLanguage(settings.voiceLanguage);
    voiceAssistant.setEnabled(settings.voiceEnabled);
  }, [settings.voiceLanguage, settings.voiceEnabled]);

  const handleToggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    try {
      localStorage.setItem('ludoTheme', next ? 'light' : 'dark');
    } catch {}
  };

  const speakOracle = (text: string) => {
    setOracleMsg(text);
    if (settings.voiceEnabled && !settings.soundMuted) {
      setIsOracleSpeaking(true);
      voiceAssistant.speak(text, () => setIsOracleSpeaking(false));
    } else {
      setIsOracleSpeaking(false);
      voiceAssistant.cancel();
    }
  };

  const addLog = (
    playerRealm: RealmId,
    action: string,
    details?: string,
    type: MoveLogEntry['type'] = 'move'
  ) => {
    const realm = REALMS[playerRealm];
    const newEntry: MoveLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      playerRealm,
      playerName: realm.name,
      playerEmoji: realm.emoji,
      action,
      details,
      type
    };
    setMoveLogs(prev => [newEntry, ...prev].slice(0, 50));
  };

  // Start new match configuration
  const handleStartMatch = (
    playerRealms: RealmId[],
    slotIsAI: boolean[],
    mode: GameMode,
    aiDifficulty: AIDifficulty,
    houseRules: HouseRules
  ) => {
    soundEngine.unlock();
    setMatchDurationSeconds(0);
    setMatchCapturesCount(0);
    setMatchRollsCount(0);
    setKeyMoments(['🎮 গেম ম্যাচ শুরু হয়েছে!']);
    setMatchHighlights(null);
    lastMatchConfigRef.current = { playerRealms, slotIsAI, mode, aiDifficulty, houseRules };

    // Assign map powerups if enabled
    const powerupsMap: Record<number, any> = {};
    if (houseRules.enablePowerups) {
      const candidates: number[] = [];
      for (let i = 0; i < PATH.length; i++) {
        if (!SAFE_IDX.has(i)) candidates.push(i);
      }
      // Shuffle
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      const chosen = candidates.slice(0, 6);
      const types = ['dice', 'shield', 'dash', 'warp', 'double_dice'];
      chosen.forEach((idx, i) => {
        powerupsMap[idx] = types[i % types.length];
      });
    }

    const initialPlayers: Player[] = playerRealms.map((realmId, i) => {
      const startOutCount = houseRules.blitzStartTokensOut;
      return {
        slot: i,
        realmIdx: realmId,
        isAI: slotIsAI[i],
        tokens: [0, 1, 2, 3].map(slot => ({
          id: slot,
          slot,
          state: slot < startOutCount ? 'path' : 'yard',
          pos: slot < startOutCount ? 0 : -1,
          shielded: false
        })),
        finishedCount: 0,
        blessingUsed: false
      };
    });

    setGameState({
      players: initialPlayers,
      turn: 0,
      dice: null,
      rolling: false,
      consecutiveSixes: 0,
      awaitingMove: false,
      movable: [],
      gameOver: false,
      winner: null,
      powerups: powerupsMap,
      turnTimerRemaining: null
    });

    setMoveLogs([]);
    setShowWizard(false);

    const welcomeMsg = voiceAssistant.getCommentary('welcome');
    speakOracle(welcomeMsg);
  };

  // Current Active Player
  const currentPlayer = gameState.players[gameState.turn];
  const currentRealm = REALMS[currentPlayer?.realmIdx ?? 0];

  // Sync state with online room in real-time
  useEffect(() => {
    if (!onlineRoomCode) {
      setOnlineRoomPlayers([]);
      return;
    }

    const unsubscribe = subscribeToRoom(onlineRoomCode, (room) => {
      if (!room || room.status === 'cancelled') {
        const myUid = getCurrentUserIdSync();
        const myPlayer = gameState.players.find(p => p.id === myUid) || gameState.players[0];

        if (myPlayer && !gameState.gameOver && gameState.players.length >= 2) {
          soundEngine.playVictory();
          setGameState(prev => ({
            ...prev,
            gameOver: true,
            winner: myPlayer
          }));
          speakOracle(`🎉 প্রতিপক্ষ খেলা ছেড়ে চলে গেছে! ${myPlayer.name} বিজয়ী হয়েছেন!`);
          addLog(myPlayer.realmIdx, `VICTORY! Opponent left - ${myPlayer.name} Wins!`, undefined, 'win');
        } else {
          setOnlineRoomCode(null);
          setShowWizard(true);
        }
        return;
      }
      if (room.players) {
        setOnlineRoomPlayers(room.players.map(p => p.id));
      }
      if (room.gameState && room.status === 'playing') {
        setGameState(room.gameState);
      }
      if (room.lastEmote && room.lastEmote.timestamp > lastEmoteTimeRef.current) {
        lastEmoteTimeRef.current = room.lastEmote.timestamp;
        soundEngine.playPowerup();
        setActiveEmote({
          senderName: room.lastEmote.senderName,
          emoji: room.lastEmote.emoji,
          timestamp: room.lastEmote.timestamp
        });
        setTimeout(() => setActiveEmote(null), 2000);
      }
    });

    return () => unsubscribe();
  }, [onlineRoomCode]);

  // Manage Real-Time Voice Chat lifecycle in Online Rooms
  useEffect(() => {
    if (onlineRoomCode) {
      const myUid = getCurrentUserIdSync();
      const idsFromGame = gameState.players.map(p => p.id).filter((id): id is string => !!id);
      const allPlayerIds = Array.from(new Set([...idsFromGame, ...onlineRoomPlayers, myUid]));

      voiceChatService.startVoiceChat(
        onlineRoomCode,
        myUid,
        allPlayerIds,
        (newState) => setVoiceChatState(newState)
      );
    } else {
      voiceChatService.stopVoiceChat();
    }

    return () => {
      voiceChatService.stopVoiceChat();
    };
  }, [onlineRoomCode, gameState.players.map(p => p.id).join(','), onlineRoomPlayers.join(',')]);

  const handleSendEmote = (emote: Emote | string) => {
    const emojiStr = typeof emote === 'string' ? emote : emote.emoji;
    const myName = currentPlayer?.name || REALMS[currentPlayer?.realmIdx ?? 0].name;
    if (onlineRoomCode) {
      const currentUid = getCurrentUserIdSync();
      sendEmoteInRoom(onlineRoomCode, currentUid, myName, emojiStr).catch(() => {});
    } else {
      soundEngine.playPowerup();
      setActiveEmote({
        senderName: myName,
        emoji: emojiStr,
        timestamp: Date.now()
      });
      setTimeout(() => setActiveEmote(null), 2000);
    }
  };


  // Sync state to Firestore when state updates in room match
  const updateAndSyncGameState = (
    updater: GameState | ((prev: GameState) => GameState)
  ) => {
    setGameState(prev => {
      const nextState = typeof updater === 'function' ? updater(prev) : updater;
      if (onlineRoomCode) {
        updateRoomGameStateInFirestore(onlineRoomCode, nextState).catch(() => {});
      }
      return nextState;
    });
  };

  // Roll Dice Engine
  const handleRollDice = () => {
    if (gameState.rolling || gameState.dice !== null || gameState.gameOver || !currentPlayer) return;

    // Check turn permission for online multiplayer room matches
    if (onlineRoomCode) {
      const currentUid = getCurrentUserIdSync();
      if (currentPlayer.id !== currentUid) {
        speakOracle('এখন আপনার চাল নয়! অন্য প্লেয়ারের চালের জন্য অপেক্ষা করুন।');
        return;
      }
    }

    soundEngine.unlock();
    setMatchRollsCount(prev => prev + 1);
    updateAndSyncGameState(prev => ({ ...prev, rolling: true }));

    let ticks = 0;
    const interval = setInterval(() => {
      soundEngine.playDiceTick();
      ticks++;
      if (ticks > 6) {
        clearInterval(interval);
        const rolledVal = Math.floor(Math.random() * 6) + 1;
        soundEngine.playDiceSettle();

        processRollResult(rolledVal);
      }
    }, 70 / settings.speed);
  };

  const processRollResult = (roll: number) => {
    const p = currentPlayer;
    if (!p) return;

    addLog(p.realmIdx, `Rolled a ${roll}`, undefined, 'roll');

    let newSixes = roll === 6 ? gameState.consecutiveSixes + 1 : 0;

    // Check 3 sixes penalty
    if (newSixes >= 3 && settings.houseRules.threeSixesPenalty) {
      speakOracle(voiceAssistant.getCommentary('threeSixes'));
      addLog(p.realmIdx, '3 Sixes Penalty - Turn forfeited', undefined, 'penalty');
      setTimeout(() => advanceTurn(0), 1000 / settings.speed);
      return;
    }

    // Determine legal movable tokens
    let movableIds = getLegalMovableTokens(p, roll);

    // Realm Blessing: 1 converts to 6 if stuck
    if (movableIds.length === 0 && roll === 1 && !p.blessingUsed && settings.houseRules.realmBlessing) {
      const blessedMovable = getLegalMovableTokens(p, 6);
      if (blessedMovable.length > 0) {
        p.blessingUsed = true;
        roll = 6;
        movableIds = blessedMovable;
        addLog(p.realmIdx, 'Realm Blessing Awakened (1 -> 6)', undefined, 'blessing');
        speakOracle(voiceAssistant.getCommentary('blessingAwaken'));
      }
    }

    if (movableIds.length === 0) {
      const extraRoll = roll === 6;
      setTimeout(() => {
        if (extraRoll) {
          updateAndSyncGameState(prev => ({ ...prev, rolling: false, dice: null, consecutiveSixes: newSixes }));
        } else {
          advanceTurn(0);
        }
      }, 800 / settings.speed);
      return;
    }

    updateAndSyncGameState(prev => ({
      ...prev,
      rolling: false,
      dice: roll,
      consecutiveSixes: newSixes,
      awaitingMove: true,
      movable: movableIds
    }));
  };

  const getLegalMovableTokens = (p: Player, roll: number): number[] => {
    const valid: number[] = [];
    p.tokens.forEach(tok => {
      if (tok.state === 'yard') {
        if (roll === 6) valid.push(tok.id);
      } else if (tok.state === 'path' || tok.state === 'home') {
        if (tok.pos + roll <= 56) valid.push(tok.id);
      }
    });
    return valid;
  };

  // Move Token Logic with Step-by-Step Ludo Hop Animation
  const handleMoveToken = (realmIdx: RealmId, tokenId: number) => {
    if (!gameState.awaitingMove || gameState.dice === null) return;
    const p = currentPlayer;
    if (!p || p.realmIdx !== realmIdx) return;

    if (onlineRoomCode) {
      const currentUid = getCurrentUserIdSync();
      if (p.id && p.id !== currentUid) {
        speakOracle('এখন আপনার চাল নয়! অন্য প্লেয়ারের চালের জন্য অপেক্ষা করুন।');
        return;
      }
    }

    const roll = gameState.dice;
    const tok = p.tokens[tokenId];
    if (!tok) return;

    // Immediately disable further clicks during movement
    setGameState(prev => ({
      ...prev,
      awaitingMove: false,
      movable: []
    }));

    if (tok.state === 'yard') {
      // Single exit hop from yard to start cell (pos 0)
      soundEngine.playHop(0.1);
      const targetPos = 0;
      const targetState: TokenState['state'] = 'path';

      setGameState(prevState => {
        const updatedPlayers = prevState.players.map(player => {
          if (player.realmIdx !== realmIdx) return player;
          return {
            ...player,
            tokens: player.tokens.map(t => {
              if (t.id !== tokenId) return t;
              return { ...t, pos: targetPos, state: targetState };
            })
          };
        });

        const nextState: GameState = {
          ...prevState,
          players: updatedPlayers
        };

        if (onlineRoomCode) {
          updateRoomGameStateInFirestore(onlineRoomCode, nextState).catch(() => {});
        }

        setTimeout(() => finalizeMove(realmIdx, tokenId, roll, nextState), 120 / settings.speed);
        return nextState;
      });
      return;
    }

    // Step-by-step tile hopping (1, 2, 3, 4, 5...)
    const startPos = tok.pos;
    const targetPos = Math.min(startPos + roll, 56);
    let currentStepPos = startPos;
    const stepDelay = Math.max(90, 130 / settings.speed);

    const stepInterval = setInterval(() => {
      currentStepPos++;
      soundEngine.playHop(0.1);

      const stepState: TokenState['state'] = currentStepPos === 56 ? 'done' : currentStepPos >= 51 ? 'home' : 'path';

      setGameState(prevState => {
        const updatedPlayers = prevState.players.map(player => {
          if (player.realmIdx !== realmIdx) return player;
          return {
            ...player,
            tokens: player.tokens.map(t => {
              if (t.id !== tokenId) return t;
              return { ...t, pos: currentStepPos, state: stepState };
            })
          };
        });

        const nextState: GameState = {
          ...prevState,
          players: updatedPlayers
        };

        if (onlineRoomCode) {
          updateRoomGameStateInFirestore(onlineRoomCode, nextState).catch(() => {});
        }

        if (currentStepPos >= targetPos) {
          clearInterval(stepInterval);
          setTimeout(() => finalizeMove(realmIdx, tokenId, roll, nextState), 100 / settings.speed);
        }

        return nextState;
      });
    }, stepDelay);
  };

  const finalizeMove = (
    realmIdx: RealmId,
    tokenId: number,
    roll: number,
    baseState: GameState = gameState
  ) => {
    const nextState: GameState = JSON.parse(JSON.stringify(baseState));
    const p = nextState.players.find(pl => pl.realmIdx === realmIdx);
    if (!p) return;
    const tok = p.tokens[tokenId];
    const realm = REALMS[realmIdx];

    // Reached Home event - Trigger Voice Line & Particle Blast
    const reachedHome = tok.pos === 56 && tok.state === 'done';
    if (reachedHome) {
      soundEngine.playPowerup();
      p.finishedCount = p.tokens.filter(t => t.state === 'done').length;
      addLog(realmIdx, `Token #${tokenId + 1} reached the Mythic Portal!`, undefined, 'move');
      speakOracle('একটি গুটি পোর্টালে পৌঁছে গেল! আরও একটি বোনাস চাল পেলে!');
      setKeyMoments(prev => [`✨ ${p.name || realm.name} এর গুটি #${tokenId + 1} পোর্টালে ঢুকেছে!`, ...prev].slice(0, 8));

      // Single token portal entry burst
      setParticleExplosion({
        active: true,
        isGrandVictory: false,
        realmColor: REALMS[realmIdx].accentColor || '#FFD700'
      });
    }

    // Check Capture (Token Cut Event) - Trigger Voice Line & Replay
    let capturedAny = false;
    let capturedOpName = '';
    let capturedOpEmoji = '';

    if (tok.state === 'path') {
      const myIdx = (realm.start + tok.pos) % 52;
      if (!SAFE_IDX.has(myIdx)) {
        nextState.players.forEach(op => {
          if (op.realmIdx === realmIdx) return;
          op.tokens.forEach(otok => {
            if (otok.state === 'path') {
              const opRealm = REALMS[op.realmIdx];
              const opIdx = (opRealm.start + otok.pos) % 52;
              if (opIdx === myIdx) {
                if (otok.shielded) {
                  otok.shielded = false;
                  soundEngine.playShield();
                  addLog(op.realmIdx, 'Aegis Shield absorbed capture attack!', undefined, 'powerup');
                } else {
                  otok.state = 'yard';
                  otok.pos = -1;
                  capturedAny = true;
                  capturedOpName = op.name || opRealm.name;
                  capturedOpEmoji = opRealm.emoji;
                  soundEngine.playCapture();
                  statsStorage.recordCapture();
                  setMatchCapturesCount(prev => prev + 1);
                  setKeyMoments(prev => [`⚔️ ${p.name || realm.name} কেটে দিল ${op.name || opRealm.name} এর গুটি!`, ...prev].slice(0, 8));
                  addLog(realmIdx, `Captured ${opRealm.name}'s token!`, undefined, 'capture');
                  const capLine = voiceAssistant.getCommentary('capture');
                  speakOracle(capLine);
                }
              }
            }
          });
        });
      }
    }

    // Trigger Instant Highlight Replay for Token Captures
    if (capturedAny) {
      const capturerRealm = REALMS[realmIdx];
      const tauntQuotes = [
        'মান সম্মান শেষ! এবার প্রতিশোধ নেওয়ার পালা! ⚔️',
        'উফ! কী জঘন্য কাটা পড়ল! 🤣',
        'এক চালের ভুলেই গুটি নাই হয়ে গেল! 💀',
        'প্রতিশোধের আগুন জ্বালিয়ে খেলুন! 🔥'
      ];
      setCaptureReplayData({
        capturerName: p.name || capturerRealm.name,
        capturerEmoji: capturerRealm.emoji,
        capturedName: capturedOpName || 'Enemy Token',
        capturedEmoji: capturedOpEmoji || '⚔️',
        tauntEmoji: '🤣',
        tauntText: tauntQuotes[Math.floor(Math.random() * tauntQuotes.length)]
      });
    }

    // Check Map Power-up Landings - Optional Voice Line
    let bonusRollPowerup = false;
    if (tok.state === 'path') {
      const myIdx = (realm.start + tok.pos) % 52;
      const pType = nextState.powerups[myIdx];
      if (pType) {
        delete nextState.powerups[myIdx];
        statsStorage.recordPowerup();

        if (pType === 'dice') {
          setChoiceDiceActive(true);
          soundEngine.playPowerup();
          speakOracle('🎯 চয়েস ডাইস রেলিক সংগৃহীত হয়েছে! পছন্দের ডাইস নম্বর সিলেক্ট করুন!');
          addLog(realmIdx, 'Collected Choice Dice Relic Token!', undefined, 'powerup');
        } else if (pType === 'shield') {
          tok.shielded = true;
          soundEngine.playShield();
          speakOracle(voiceAssistant.getCommentary('powerupShield'));
          addLog(realmIdx, 'Activated Aegis Shield Powerup!', undefined, 'powerup');
        } else if (pType === 'dash') {
          soundEngine.playPowerup();
          tok.pos = Math.min(tok.pos + 3, 57);
          tok.state = tok.pos === 57 ? 'done' : tok.pos >= 51 ? 'home' : 'path';
          if (tok.pos === 57) p.finishedCount += 1;
          speakOracle('⚡ ড্যাশ (+3 ঘর লাফ)!');
          addLog(realmIdx, 'Activated Dash (+3 Steps)!', undefined, 'powerup');
        } else if (pType === 'warp') {
          soundEngine.playPowerup();
          tok.pos = Math.min(tok.pos + 6, 57);
          tok.state = tok.pos === 57 ? 'done' : tok.pos >= 51 ? 'home' : 'path';
          if (tok.pos === 57) p.finishedCount += 1;
          speakOracle(voiceAssistant.getCommentary('powerupWarp'));
          addLog(realmIdx, 'Activated Portal Warp (+6 Teleport)!', undefined, 'powerup');
        } else if (pType === 'double_dice') {
          bonusRollPowerup = true;
          soundEngine.playPowerup();
          speakOracle('✨ ডাবল চাল বোনাস পেয়েছে!');
          addLog(realmIdx, 'Activated Double Step Bonus Turn!', undefined, 'powerup');
        }

        // Auto-respawn Relic Token on map if total count < 3
        const currentPowerupCount = Object.keys(nextState.powerups).length;
        if (currentPowerupCount < 3) {
          const emptyPathIndices: number[] = [];
          for (let i = 0; i < PATH.length; i++) {
            if (!SAFE_IDX.has(i) && !nextState.powerups[i]) {
              emptyPathIndices.push(i);
            }
          }
          if (emptyPathIndices.length > 0) {
            const randomIdx = emptyPathIndices[Math.floor(Math.random() * emptyPathIndices.length)];
            const relicTypes: PowerupType[] = ['dice', 'shield', 'dash', 'warp', 'double_dice'];
            const newRelicType = relicTypes[Math.floor(Math.random() * relicTypes.length)];
            nextState.powerups[randomIdx] = newRelicType;
          }
        }
      }
    }

    // Check Star Tile Landing (Safe Zone, no extra roll)
    if (tok.state === 'path') {
      const myIdx = (realm.start + tok.pos) % 52;
      if (STAR_BLESSING_IDX.has(myIdx)) {
        soundEngine.playStarBlessing();
        addLog(realmIdx, 'Landed on Star Safe Tile', undefined, 'blessing');
      }
    }

    // Check Win Condition - Trigger Voice Line, Screen Shake & Particle Explosion
    if (p.finishedCount === 4) {
      soundEngine.playVictory();
      statsStorage.recordWin(realm.yard);
      setStats(statsStorage.getStats());
      nextState.gameOver = true;
      nextState.winner = p;

      const finalWinningText = `${p.name || realm.name} এর গুটি #${tokenId + 1} পোর্টালে ঢুকে চূড়ান্ত জয় এনে দিয়েছে!`;
      const finalHighlights: MatchHighlights = {
        durationSeconds: matchDurationSeconds,
        totalCaptures: matchCapturesCount + (capturedAny ? 1 : 0),
        totalRolls: matchRollsCount + 1,
        winningMoveText: finalWinningText,
        mvpPlayerName: p.name || realm.name,
        mvpPlayerEmoji: realm.emoji,
        keyMoments: [`🏆 ${p.name || realm.name} চ্যাম্পিয়ন জয় করেছেন!`, ...keyMoments].slice(0, 6)
      };
      setMatchHighlights(finalHighlights);

      updateAndSyncGameState(nextState);
      speakOracle(voiceAssistant.getCommentary('victory'));
      addLog(realmIdx, 'VICTORY! All 4 tokens entered the portal!', undefined, 'win');

      // GRAND VICTORY: Screen Shake + Particle Explosion
      setScreenShakeActive(true);
      setTimeout(() => setScreenShakeActive(false), 800);

      setParticleExplosion({
        active: true,
        isGrandVictory: true,
        realmColor: REALMS[realmIdx].accentColor || '#FFD700'
      });
      return;
    }

    const extraRoll = roll === 6 || bonusRollPowerup || capturedAny || reachedHome;

    setTimeout(() => {
      if (extraRoll) {
        nextState.dice = null;
        nextState.rolling = false;
        nextState.awaitingMove = false;
        nextState.movable = [];
        updateAndSyncGameState(nextState);
      } else {
        advanceTurn(0, nextState);
      }
    }, 600 / settings.speed);
  };

  const advanceTurn = (sixesCount = 0, baseState: GameState = gameState) => {
    const nextState: GameState = JSON.parse(JSON.stringify(baseState));
    if (!nextState.players || nextState.players.length === 0) return;
    const nextTurnIdx = (nextState.turn + 1) % nextState.players.length;
    nextState.turn = nextTurnIdx;
    nextState.dice = null;
    nextState.rolling = false;
    nextState.consecutiveSixes = sixesCount;
    nextState.awaitingMove = false;
    nextState.movable = [];

    updateAndSyncGameState(nextState);
  };

  // AI Automatic Turn Processing Hook
  useEffect(() => {
    if (gameState.gameOver || !currentPlayer) return;

    if (currentPlayer.isAI) {
      // AI Roll Trigger
      if (gameState.dice === null && !gameState.rolling) {
        const timer = setTimeout(() => {
          handleRollDice();
        }, 650 / settings.speed);
        return () => clearTimeout(timer);
      }

      // AI Move Choice Trigger
      if (gameState.awaitingMove && gameState.movable.length > 0) {
        const timer = setTimeout(() => {
          const chosenTokenId = chooseAIMove(
            currentPlayer,
            gameState.movable,
            gameState.dice!,
            gameState.players,
            gameState.powerups,
            settings.aiDifficulty
          );
          if (chosenTokenId !== -1) {
            handleMoveToken(currentPlayer.realmIdx, chosenTokenId);
          }
        }, 750 / settings.speed);
        return () => clearTimeout(timer);
      }
    }
  }, [
    gameState.turn,
    gameState.dice,
    gameState.rolling,
    gameState.awaitingMove,
    gameState.gameOver,
    settings.speed,
    settings.aiDifficulty
  ]);

  // Auto-move when only 1 token is legally movable (Single Token Auto-Step)
  useEffect(() => {
    if (
      gameState.awaitingMove &&
      gameState.movable.length === 1 &&
      gameState.dice !== null &&
      !gameState.rolling &&
      !gameState.gameOver &&
      currentPlayer
    ) {
      const singleTokenId = gameState.movable[0];
      const timer = setTimeout(() => {
        handleMoveToken(currentPlayer.realmIdx, singleTokenId);
      }, 350 / settings.speed);
      return () => clearTimeout(timer);
    }
  }, [
    gameState.awaitingMove,
    gameState.movable,
    gameState.dice,
    gameState.rolling,
    gameState.gameOver,
    gameState.turn,
    settings.speed
  ]);

  // Sync winner stats to Firestore for logged-in user
  useEffect(() => {
    if (gameState.gameOver && gameState.winner && userProfile) {
      const isWinner = gameState.winner.id === userProfile.uid || gameState.winner.name === userProfile.displayName;
      updateUserStatsInFirestore(userProfile.uid, isWinner).then(() => {
        setUserProfile(prev => prev ? {
          ...prev,
          totalGames: (prev.totalGames || 0) + 1,
          totalWins: isWinner ? (prev.totalWins || 0) + 1 : (prev.totalWins || 0)
        } : null);
      }).catch(() => {});
    }
  }, [gameState.gameOver, gameState.winner]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between pb-2 ${isLightMode ? 'bg-[#F0F0F0] text-black' : 'bg-[#0A0A0A] text-white'} transition-colors duration-300 font-display select-none overflow-x-hidden`}>
      
      {/* Initial Landing & Free Fire Style Loading Progress Screen */}
      {!isAppLoaded && (
        <InitialLaunchScreen
          onComplete={(profile) => {
            setUserProfile(profile);
            setIsAppLoaded(true);
          }}
        />
      )}

      {/* Top Header Controls */}
      <TopBar
        settings={settings}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
        onOpenRules={() => setShowRules(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenMoveLog={() => setShowMoveLog(true)}
        onOpenOnlineRoom={() => {
          setShowWizard(false);
          setShowOnlineRoomModal(true);
        }}
        activeRoomCode={onlineRoomCode}
        onNewGame={() => setShowWizard(true)}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
        voiceChatState={voiceChatState}
        onToggleMic={handleToggleMic}
        onToggleSpeaker={handleToggleSpeaker}
        onSendEmote={handleSendEmote}
        onOpenExitModal={() => setShowExitModal(true)}
        userProfile={userProfile}
        onOpenLoginModal={() => setShowLoginModal(true)}
        matchDurationSeconds={matchDurationSeconds}
      />

      {/* Main Full Screen Game Stage */}
      <main className={`w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center relative p-0 sm:p-1 ${screenShakeActive ? 'animate-screen-shake' : ''}`}>
        {particleExplosion && (
          <PortalParticleExplosion
            active={particleExplosion.active}
            isGrandVictory={particleExplosion.isGrandVictory}
            realmColor={particleExplosion.realmColor}
            onComplete={() => setParticleExplosion(null)}
          />
        )}
        <Board
          gameState={gameState}
          onDiceClick={handleRollDice}
          onTokenClick={handleMoveToken}
          onYardClick={realmId => {
            if (currentPlayer?.realmIdx === realmId && !currentPlayer.isAI && gameState.dice === null) {
              handleRollDice();
            }
          }}
          view3D={false}
          tauntPopup={tauntPopup}
          speakingPlayers={voiceChatState.speakingPlayers}
          onlineRoomCode={onlineRoomCode}
          voiceChatState={voiceChatState}
          onToggleMic={handleToggleMic}
          onToggleSpeaker={handleToggleSpeaker}
          expectedPlayerIds={Array.from(new Set([...gameState.players.map(p => p.id).filter((id): id is string => !!id), ...onlineRoomPlayers]))}
          myUserId={getCurrentUserIdSync()}
          onResyncVoiceChat={handleResyncVoice}
          onSendEmote={handleSendEmote}
        />

        {/* Game Controls Bar */}
        {gameState.players.length > 0 && (
          <GameControlsBar
            gameState={gameState}
            settings={settings}
            onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
            onManualRoll={handleRollDice}
            statusText={
              gameState.gameOver
                ? `👑 VICTORY FOR ${gameState.winner?.name || REALMS[gameState.winner?.realmIdx || 0].name}!`
                : gameState.awaitingMove
                ? `${REALMS[currentPlayer?.realmIdx || 0].name}: SELECT A TOKEN TO MOVE (${gameState.dice})`
                : gameState.rolling
                ? `${REALMS[currentPlayer?.realmIdx || 0].name}: ROLLING MYTHIC DICE...`
                : `${REALMS[currentPlayer?.realmIdx || 0].name}'S TURN - ROLL THE DICE`
            }
            onSendEmote={handleSendEmote}
            onlineRoomCode={onlineRoomCode}
            voiceChatState={voiceChatState}
            onToggleMic={handleToggleMic}
            onToggleSpeaker={handleToggleSpeaker}
            expectedPlayerIds={Array.from(new Set([...gameState.players.map(p => p.id).filter((id): id is string => !!id), ...onlineRoomPlayers]))}
            myUserId={getCurrentUserIdSync()}
            onResyncVoiceChat={handleResyncVoice}
            choiceDiceActive={choiceDiceActive}
            onChoiceDiceRoll={(chosenNum) => {
              if (gameState.rolling || gameState.gameOver || !currentPlayer) return;
              setChoiceDiceActive(false);
              soundEngine.playDiceSettle();
              processRollResult(chosenNum);
            }}
          />
        )}
      </main>

      {/* Instant Highlight Replay Overlay for Token Captures */}
      {captureReplayData && (
        <div 
          onClick={() => setCaptureReplayData(null)}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col justify-between items-center pointer-events-auto cursor-pointer animate-fade-in font-mono select-none overflow-hidden"
        >
          {/* Top Letterbox Bar */}
          <div className="w-full bg-gradient-to-b from-black via-black/90 to-transparent p-4 flex items-center justify-between border-b-2 border-amber-500/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="font-extrabold text-xs sm:text-sm text-amber-300 uppercase tracking-widest">
                ⚡ TOKEN CUT ACTION • REPLAY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-emerald-500/40">
              TAP TO CLOSE
            </span>
          </div>

          {/* Center Clash Card */}
          <div className="my-auto max-w-sm w-full mx-4 p-6 bg-zinc-950 border-2 border-rose-500/80 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.5)] text-center space-y-4 animate-bounce">
            <div className="text-xs font-black text-rose-400 uppercase tracking-widest animate-pulse">
              💥 গুটি কাটা হয়েছে! (TOKEN CAPTURED) 💥
            </div>

            <div className="flex items-center justify-center gap-4 text-3xl sm:text-4xl">
              <div className="p-3 bg-black border-2 border-amber-400 rounded-xl shadow-lg">
                {captureReplayData.capturerEmoji}
              </div>
              <span className="text-2xl text-rose-500 font-black animate-ping">➔</span>
              <div className="p-3 bg-black border-2 border-rose-500 rounded-xl shadow-lg opacity-60 line-through">
                {captureReplayData.capturedEmoji}
              </div>
            </div>

            <div className="text-sm font-black text-white uppercase tracking-wider">
              <span className="text-amber-300">{captureReplayData.capturerName}</span> captured <span className="text-rose-400">{captureReplayData.capturedName}</span>!
            </div>
          </div>

          {/* Bottom Letterbox Bar */}
          <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent p-4 text-center border-t-2 border-amber-500/80">
            <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-bold">
              [ স্বয়ংক্রিয়ভাবে ১.৫ সেকেন্ডে বন্ধ হবে / ট্যাপ করে স্কিপ করুন ]
            </span>
          </div>
        </div>
      )}

      {/* Floating Emote Overlay Reaction */}
      <EmoteOverlay emote={activeEmote} />

      {/* Account / Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onLoginSuccess={(profile) => {
          setUserProfile(profile);
          setShowLoginModal(false);
        }}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Exit Game Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onExitGame={handleExitGame}
        isOnlineMatch={!!onlineRoomCode}
      />

      {/* Online Room Modal */}
      <OnlineRoomModal
        isOpen={showOnlineRoomModal}
        onClose={() => {
          setShowOnlineRoomModal(false);
          if (!onlineRoomCode) {
            setShowWizard(true);
          }
        }}
        activeRoomCode={onlineRoomCode}
        onSetRoomCode={(code) => {
          setOnlineRoomCode(code);
          setShowWizard(false);
        }}
        onRoomMatchStarted={(code) => {
          setOnlineRoomCode(code);
          setShowWizard(false);
          setShowOnlineRoomModal(false);
        }}
        onLeaveRoom={() => {
          setOnlineRoomCode(null);
          setShowWizard(true);
        }}
        initialPlayerName={userProfile?.displayName}
      />

      {/* Setup Wizard Overlay */}
      {showWizard && !onlineRoomCode && (
        <SetupWizard
          onStartGame={handleStartMatch}
          onOpenOnlineRoom={() => {
            setShowWizard(false);
            setShowOnlineRoomModal(true);
          }}
        />
      )}

      {/* Move Log Drawer */}
      <MoveLogDrawer
        isOpen={showMoveLog}
        onClose={() => setShowMoveLog(false)}
        logs={moveLogs}
        onClearLogs={() => setMoveLogs([])}
      />

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Stats Modal */}
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        onResetStats={() => setStats(statsStorage.resetStats())}
      />

      {/* VAR Slow-Motion Instant Replay Modal Overlay */}
      <VARCaptureReplayModal
        data={captureReplayData}
        onClose={() => setCaptureReplayData(null)}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        winner={gameState.winner}
        matchHighlights={matchHighlights}
        onPlayAgain={() => {
          if (onlineRoomCode) {
            setShowOnlineRoomModal(true);
          } else if (lastMatchConfigRef.current) {
            const cfg = lastMatchConfigRef.current;
            handleStartMatch(cfg.playerRealms, cfg.slotIsAI, cfg.mode, cfg.aiDifficulty, cfg.houseRules);
          } else {
            setShowWizard(true);
          }
        }}
        onGoHome={() => {
          setOnlineRoomCode(null);
          setGameState(prev => ({ ...prev, winner: null, gameOver: true }));
          setShowWizard(true);
        }}
        isOnlineMatch={!!onlineRoomCode}
      />

    </div>
  );
}
