export type RealmId = 0 | 1 | 2 | 3;

export type GameMode = 'classic' | 'blitz' | 'relic' | 'team';
export type AIDifficulty = 'apprentice' | 'tactician' | 'grandmaster';

export interface HouseRules {
  enablePowerups: boolean;
  starBlessing: boolean;
  realmBlessing: boolean;
  threeSixesPenalty: boolean;
  blitzStartTokensOut: number;
  turnTimerSeconds: number;
}

export interface GameSettings {
  mode: GameMode;
  playerCount: number;
  aiDifficulty: AIDifficulty;
  speed: number;
  voiceLanguage: 'bn' | 'en';
  voiceEnabled: boolean;
  soundMuted: boolean;
  ambientMusic: boolean;
  view3D: boolean;
  autoRollHuman: boolean;
  houseRules: HouseRules;
}

export type PowerupType = 'dice' | 'shield' | 'dash' | 'warp' | 'double_dice';

export interface TokenState {
  id: number;
  pos: number;
  state: 'yard' | 'path' | 'home' | 'done';
  slot?: number;
  step?: number;
  shielded?: boolean;
}


export type Token = TokenState;

export interface Player {
  id?: string;
  realmIdx: RealmId;
  name?: string;
  isAI: boolean;
  tokens: TokenState[];
  hasWon?: boolean;
  finishedCount?: number;
  blessingUsed?: boolean;
  slot?: number;
  rank?: number;
  score?: number;
}


export interface GameState {
  players: Player[];
  turn: number; // Index into players array
  dice: number | null;
  rolling: boolean;
  consecutiveSixes: number;
  awaitingMove: boolean;
  movable: number[]; // Array of token IDs (0..3) for current player
  gameOver: boolean;
  winner: Player | null;
  powerups: Record<number, PowerupType>; // pathIdx -> PowerupType
  turnTimerRemaining: number | null;
}

export interface MoveLogEntry {
  id: string;
  timestamp: string;
  playerRealm: RealmId;
  playerName: string;
  playerEmoji: string;
  action: string;
  details?: string;
  type: 'roll' | 'move' | 'capture' | 'powerup' | 'blessing' | 'win' | 'penalty';
}

export interface GameStats {
  gamesPlayed: number;
  captures: number;
  wins: Record<string, number>; // realm yard -> wins
  powerupsCollected: number;
  fastestWinTurns: number;
}
