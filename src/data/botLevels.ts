// Single source of truth for bot strength and server-side engine limits.
export type BotLevelId = 'beginner' | 'intermediate' | 'advanced' | 'master';
export interface EngineProfile {
  movetime: number;
  elo?: number;
  skill?: number;
  depth?: number;
  weak?: { multiPV: number; temp: number };
}
export interface BotProfile { elo: number; bookPly: number; engine: EngineProfile; }
export const BOT_PROFILES: Record<BotLevelId, BotProfile> = {
  beginner: { elo: 800, bookPly: 4, engine: { movetime: 120, depth: 1, weak: { multiPV: 5, temp: 20 } } },
  intermediate: { elo: 1350, bookPly: 10, engine: { movetime: 200, depth: 2, weak: { multiPV: 4, temp: 9 } } },
  advanced: { elo: 1800, bookPly: 20, engine: { movetime: 400, elo: 1800 } },
  master: { elo: 2300, bookPly: 30, engine: { movetime: 800, elo: 2300 } },
};
export const ENGINE_LIMITS = {
  movetime: [50, 5000], depth: [1, 30], multiPV: [1, 5], elo: [1320, 3190], skill: [0, 20], temp: [1, 50],
} as const;
