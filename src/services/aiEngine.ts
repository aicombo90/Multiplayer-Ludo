import { PATH, SAFE_IDX, REALMS, STAR_BLESSING_IDX } from '../constants/gameConstants';
import { Player, RealmId, AIDifficulty } from '../types';

export function chooseAIMove(
  p: Player,
  movableTokenIds: number[],
  roll: number,
  allPlayers: Player[],
  powerupsMap: Record<number, string>,
  difficulty: AIDifficulty = 'tactician'
): number {
  if (movableTokenIds.length === 0) return -1;
  if (movableTokenIds.length === 1) return movableTokenIds[0];

  if ((difficulty as string) === 'novice' || difficulty === 'apprentice') {
    // Novice/Apprentice: Random selection
    return movableTokenIds[Math.floor(Math.random() * movableTokenIds.length)];
  }

  let bestTokenId = movableTokenIds[0];
  let maxScore = -Infinity;

  movableTokenIds.forEach(ti => {
    const tok = p.tokens[ti];
    let score = 0;

    const startPos = tok.pos;
    const newPos = tok.state === 'yard' ? 0 : startPos + roll;

    // 1. Reaching home (pos === 57 or 56)
    if (newPos >= 56) {
      score += 150;
    }

    // 2. Unlocking token from yard
    if (tok.state === 'yard') {
      score += (difficulty as string) === 'mythic' || difficulty === 'grandmaster' ? 45 : 35;
    } else {
      score += newPos * 0.8; // Moving forward preference
    }

    // 3. Capturing Opponent Tokens
    if (tok.state !== 'yard' && newPos <= 50) {
      const coord = getTokenCoord(p.realmIdx, { ...tok, pos: newPos, state: 'path' });
      if (coord && !coord.pct && coord.r !== undefined && coord.c !== undefined) {
        const pathIdx = getPathIndexAt(coord.r, coord.c);
        if (pathIdx !== -1 && !SAFE_IDX.has(pathIdx)) {
          // Check for opponent tokens at this target tile
          allPlayers.forEach(op => {
            if (op.realmIdx === p.realmIdx) return;
            op.tokens.forEach(otok => {
              if (otok.state === 'path') {
                const oc = getTokenCoord(op.realmIdx, otok);
                if (oc && !oc.pct && oc.r === coord.r && oc.c === coord.c) {
                  if (otok.shielded) {
                    score += 25; // Shield break bonus
                  } else {
                    score += (difficulty as string) === 'mythic' || difficulty === 'grandmaster' ? 120 : 80; // Capture bonus
                  }
                }
              }
            });
          });
        }
      }
    }

    // 4. Safe Tile Landings & Star Blessings
    if (newPos <= 50) {
      const coord = getTokenCoord(p.realmIdx, { ...tok, pos: newPos, state: 'path' });
      if (coord && !coord.pct && coord.r !== undefined && coord.c !== undefined) {
        const pathIdx = getPathIndexAt(coord.r, coord.c);
        if (pathIdx !== -1) {
          if (STAR_BLESSING_IDX.has(pathIdx)) {
            score += 40; // Star Blessing extra roll
          } else if (SAFE_IDX.has(pathIdx)) {
            score += 25; // Safe space
          }

          // Powerup landing bonus
          if (powerupsMap[pathIdx]) {
            score += 30;
          }
        }
      }
    }

    // 5. Grandmaster Extra Tactical Heuristics
    if ((difficulty as string) === 'mythic' || difficulty === 'grandmaster') {
      // Threat evaluation: Avoid leaving token vulnerable on an unsafe cell close to enemy
      if (newPos <= 50) {
        const coord = getTokenCoord(p.realmIdx, { ...tok, pos: newPos, state: 'path' });
        if (coord && !coord.pct && coord.r !== undefined && coord.c !== undefined) {
          const pathIdx = getPathIndexAt(coord.r, coord.c);
          if (pathIdx !== -1 && !SAFE_IDX.has(pathIdx) && !tok.shielded) {
            allPlayers.forEach(op => {
              if (op.realmIdx === p.realmIdx) return;
              op.tokens.forEach(otok => {
                if (otok.state === 'path') {
                  const oc = getTokenCoord(op.realmIdx, otok);
                  if (oc && !oc.pct && oc.r !== undefined && oc.c !== undefined) {
                    const opPathIdx = getPathIndexAt(oc.r, oc.c);
                    if (opPathIdx !== -1) {
                      const dist = (pathIdx - opPathIdx + 52) % 52;
                      if (dist >= 1 && dist <= 6) {
                        score -= 20; // Danger penalty
                      }
                    }
                  }
                }
              });
            });
          }
        }
      }

      // Home stretch entry bonus
      if (startPos <= 50 && newPos >= 51) {
        score += 50; // Reaching safe home stretch!
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestTokenId = ti;
    }
  });

  return bestTokenId;
}

// Helper coordinate calculations for AI simulation
function getTokenCoord(realmIdx: RealmId, tok: { pos: number; state: string }): { pct: boolean; x?: number; y?: number; r?: number; c?: number } | null {
  const realm = REALMS[realmIdx];
  if (tok.state === 'yard' || tok.state === 'done') return null;

  if (tok.pos <= 50) {
    const idx = (realm.start + tok.pos) % 52;
    const [r, c] = PATH[idx];
    return { pct: false, r, c };
  }
  const [r, c] = realm.home[tok.pos - 51];
  return { pct: false, r, c };
}

function getPathIndexAt(r: number, c: number): number {
  for (let i = 0; i < PATH.length; i++) {
    if (PATH[i][0] === r && PATH[i][1] === c) return i;
  }
  return -1;
}
