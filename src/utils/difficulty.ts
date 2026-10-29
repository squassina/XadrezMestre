import type { BotLevel } from '../types/chess';

export interface DifficultyProfile {
  fallbackTimeMs: number;
  fallbackDepth: number;
  openingBookPlies: number;
  variety: number;
}

/** Profiles ordered from weakest to strongest. ELO values remain an approximation. */
export const DIFFICULTY_PROFILES: Record<BotLevel, DifficultyProfile> = {
  beginner:     { fallbackTimeMs: 90,  fallbackDepth: 2, openingBookPlies: 4,  variety: 0.65 },
  intermediate: { fallbackTimeMs: 220, fallbackDepth: 3, openingBookPlies: 10, variety: 0.20 },
  advanced:     { fallbackTimeMs: 450, fallbackDepth: 5, openingBookPlies: 20, variety: 0.04 },
  master:       { fallbackTimeMs: 800, fallbackDepth: 7, openingBookPlies: 26, variety: 0 },
};

export function canUseOpeningBook(level: BotLevel, ply: number): boolean {
  return ply >= 0 && ply < DIFFICULTY_PROFILES[level].openingBookPlies;
}
