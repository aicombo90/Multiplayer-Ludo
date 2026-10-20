/**
 * Statistics Persistence Storage
 */

import { GameStats } from '../types';

const STATS_KEY = 'portal_ludo_stats';

const defaultStats: GameStats = {
  gamesPlayed: 0,
  captures: 0,
  wins: {
    mayan: 0,
    pharaoh: 0,
    viking: 0,
    shogun: 0
  },
  powerupsCollected: 0,
  fastestWinTurns: 999
};

export const statsStorage = {
  getStats(): GameStats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultStats,
          ...parsed,
          wins: { ...defaultStats.wins, ...(parsed.wins || {}) }
        };
      }
    } catch {
      // Fallback
    }
    return defaultStats;
  },

  recordCapture(): void {
    const s = this.getStats();
    s.captures += 1;
    this.save(s);
  },

  recordPowerup(): void {
    const s = this.getStats();
    s.powerupsCollected += 1;
    this.save(s);
  },

  recordWin(yardKey: string, turns = 999): void {
    const s = this.getStats();
    s.gamesPlayed += 1;
    s.wins[yardKey] = (s.wins[yardKey] || 0) + 1;
    if (turns < s.fastestWinTurns) {
      s.fastestWinTurns = turns;
    }
    this.save(s);
  },

  resetStats(): GameStats {
    this.save(defaultStats);
    return defaultStats;
  },

  save(stats: GameStats): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }
};
