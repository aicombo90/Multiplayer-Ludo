import { RealmId, PowerupType } from '../types';

export interface RealmInfo {
  id: RealmId;
  key: 'p0' | 'p1' | 'p2' | 'p3';
  name: string;
  colorName: string;
  emoji: string;
  tokenEmojis: string[];
  yard: 'mayan' | 'pharaoh' | 'viking' | 'shogun';
  corner: [number, number]; // [row, col] grid origin
  start: number; // path index
  home: [number, number][]; // 6 home stretch cells [r,c]
  glowColor: string;
  accentColor: string;
  bgGradient: string;
  description: string;
  blessingName: string;
}

// Ludo Outer Path (52 cells) [row, col] 0-indexed (0..14)
export const PATH: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

// Safe path indices (starts + star tiles)
export const SAFE_IDX = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Pure Star Blessing tiles (excluding starting tiles)
export const STAR_BLESSING_IDX = new Set([8, 21, 34, 47]);

export const REALMS: RealmInfo[] = [
  {
    id: 0,
    key: 'p0',
    name: 'Mayan Ruler',
    colorName: 'Jade Green',
    emoji: '🗿',
    tokenEmojis: ['🐆', '🗿', '🐍', '🐲'],
    yard: 'mayan',
    corner: [0, 0],
    start: 0,
    home: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    glowColor: '#10B981',
    accentColor: '#064E3B',
    bgGradient: 'from-emerald-900 via-teal-800 to-green-950',
    description: 'Masters of the ancient jungle temples & stone totems.',
    blessingName: 'Jungle Awakening'
  },
  {
    id: 1,
    key: 'p1',
    name: "Pharaoh's Gold",
    colorName: 'Sun Gold',
    emoji: '𓋹',
    tokenEmojis: ['𓆣', '🐕', '🏺', '👑'],
    yard: 'pharaoh',
    corner: [0, 9],
    start: 13,
    home: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    glowColor: '#EAB308',
    accentColor: '#713F12',
    bgGradient: 'from-amber-800 via-yellow-700 to-amber-950',
    description: 'Rulers of the golden pyramid dunes & sacred Ankhs.',
    blessingName: 'Sun God Ankh'
  },
  {
    id: 2,
    key: 'p2',
    name: 'Viking Voyage',
    colorName: 'Obsidian Black',
    emoji: '⚔️',
    tokenEmojis: ['🔨', '⛵', '🛡️', '🏔️'],
    yard: 'viking',
    corner: [9, 9],
    start: 26,
    home: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    glowColor: '#18181B',
    accentColor: '#09090B',
    bgGradient: 'from-zinc-950 via-neutral-900 to-black',
    description: 'Conquerors of the obsidian realm & dark legendary shields.',
    blessingName: 'Shadow Gale'
  },
  {
    id: 3,
    key: 'p3',
    name: "Shogun's Path",
    colorName: 'Crimson Red',
    emoji: '⛩️',
    tokenEmojis: ['🥷', '👺', '⚔️', '⛩️'],
    yard: 'shogun',
    corner: [9, 0],
    start: 39,
    home: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    glowColor: '#EF4444',
    accentColor: '#7F1D1D',
    bgGradient: 'from-rose-900 via-red-800 to-rose-950',
    description: 'Guardians of the cherry blossom Torii & samurai steel.',
    blessingName: 'Bushido Honor'
  }
];

export const YARD_SLOTS: [number, number][] = [
  [25, 25], [25, 75], [75, 25], [75, 75]
];

export const DIAGONAL_PARTNER: Record<RealmId, RealmId> = {
  0: 2,
  1: 3,
  2: 0,
  3: 1
};

export const DICE_ANCHORS: Record<RealmId, { x: number; row: 'top' | 'bottom' }> = {
  0: { x: 18, row: 'top' },
  1: { x: 78, row: 'top' },
  2: { x: 78, row: 'bottom' },
  3: { x: 18, row: 'bottom' }
};

export const POWERUP_INFO: Record<PowerupType, { name: string; emoji: string; desc: string; color: string }> = {
  dice: {
    name: 'Bonus Roll',
    emoji: '🎲',
    desc: 'Grants an immediate extra dice roll!',
    color: '#38bdf8'
  },
  shield: {
    name: 'Aegis Shield',
    emoji: '🛡️',
    desc: 'Protects token against its next capture attempt.',
    color: '#a855f7'
  },
  dash: {
    name: 'Lightning Dash',
    emoji: '⚡',
    desc: 'Instantly leaps 2 extra steps forward!',
    color: '#facc15'
  },
  warp: {
    name: 'Portal Warp',
    emoji: '🌀',
    desc: 'Warps forward to the next safe tile!',
    color: '#a855f7'
  },
  double_dice: {
    name: 'Double Steps',
    emoji: '✨',
    desc: 'Multiplies your current dice roll steps by 2!',
    color: '#ec4899'
  }
};

export const TAUNT_EMOJIS = ['😎', '😂', '🔥', '💀', '👑', '🎉', '😡', '🤔'];

export const ORACLE_COMMENTARY: Record<string, string[]> = {
  welcome: [
    'পোর্টাল অফ লেজেন্ডসে স্বাগতম! যুদ্ধ শুরু হোক!',
    'Welcome to Portal of Legends! Let the mythic battle begin!'
  ],
  roll_six: [
    'মহাজাগতিক ছক্কা! আবার চালুন!',
    'A divine six! Roll again!',
    'চমৎকার ছক্কা! ভাগ্যের চাকা ঘুরেছে!'
  ],
  capture: [
    'গুটি কাটা পড়েছে! অসাধারণ আক্রমণ!',
    'Token captured! What a ruthless strike!',
    'রণক্ষেত্রে এক বিধ্বংসী আঘাত!'
  ],
  win: [
    'মহাবিজয় অর্জিত হয়েছে! রিয়েলমের নতুন অধিপতি!',
    'Victory of Legends! The supreme ruler reigns!',
    'অভিনন্দন! আপনি পৌরাণিক লুডো চ্যাম্পিয়ন!'
  ],
  victory: [
    'মহাবিজয় অর্জিত হয়েছে! রিয়েলমের নতুন অধিপতি!',
    'Victory of Legends! The supreme ruler reigns!'
  ],
  three_sixes: [
    'তিন ছক্কার অপঘাত! চাল বাতিল হলো!',
    'Three consecutive sixes! Turn forfeited by the gods!'
  ],
  threeSixes: [
    'তিন ছক্কার অপঘাত! চাল বাতিল হলো!',
    'Three consecutive sixes! Turn forfeited by the gods!'
  ],
  blessingAwaken: [
    'রিয়েলম ব্লেসিং জাগ্রত হয়েছে!',
    'Realm blessing awakened!'
  ],
  powerupShield: [
    'এজিস শিল্ড সক্রিয় হয়েছে!',
    'Aegis shield activated!'
  ],
  powerupWarp: [
    'পোর্টাল ওয়ার্প! গুটি সামনে চলে গেল!',
    'Portal warp! Token leaped forward!'
  ]
};

