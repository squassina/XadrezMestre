import { describe, expect, it } from 'vitest';
import { canUseOpeningBook, DIFFICULTY_PROFILES } from './difficulty';
import { BOT_ENGINE } from './remoteEngine';

const levels = ['beginner', 'intermediate', 'advanced', 'master'] as const;

describe('difficulty profiles', () => {
  it('increases fallback time and depth with each displayed level', () => {
    for (let i = 1; i < levels.length; i++) {
      expect(DIFFICULTY_PROFILES[levels[i]].fallbackDepth)
        .toBeGreaterThan(DIFFICULTY_PROFILES[levels[i - 1]].fallbackDepth);
      expect(DIFFICULTY_PROFILES[levels[i]].fallbackTimeMs)
        .toBeGreaterThan(DIFFICULTY_PROFILES[levels[i - 1]].fallbackTimeMs);
    }
  });

  it('keeps gameplay requests time-based and consistent with UI levels', () => {
    expect(BOT_ENGINE.beginner).toMatchObject({ skill: 0, movetime: 90, fallbackDepth: 2 });
    expect(BOT_ENGINE.intermediate).toMatchObject({ elo: 1350, fallbackDepth: 3 });
    expect(BOT_ENGINE.advanced).toMatchObject({ elo: 1750, fallbackDepth: 5 });
    expect(BOT_ENGINE.master).toMatchObject({ elo: 2200, fallbackDepth: 7, variety: 0 });
    for (const profile of Object.values(BOT_ENGINE)) expect(profile.depth).toBeUndefined();
  });

  it('limits opening theory more for beginners', () => {
    expect(canUseOpeningBook('beginner', 3)).toBe(true);
    expect(canUseOpeningBook('beginner', 4)).toBe(false);
    expect(canUseOpeningBook('intermediate', 9)).toBe(true);
    expect(canUseOpeningBook('intermediate', 10)).toBe(false);
    expect(canUseOpeningBook('master', 25)).toBe(true);
    expect(canUseOpeningBook('master', 26)).toBe(false);
  });
});
