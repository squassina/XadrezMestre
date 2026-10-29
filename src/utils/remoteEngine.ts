import { Chess } from 'chess.js';
import type { BotLevel } from '../types/chess';
import { DIFFICULTY_PROFILES } from './difficulty';
import { searchBestMove } from './search';

// Em produção (GitHub Pages) configure VITE_API_URL sem barra final.
const API = String((import.meta as any).env?.VITE_API_URL ?? (globalThis as any).process?.env?.VITE_API_URL ?? '').replace(/\/$/, '');

export interface EngineLine { multipv: number; depth: number; cp?: number; mate?: number; pv: string[] }
export interface RemoteSearch { bestMove: string; san: string | null; lines: EngineLine[]; engine: string; ms: number }
export interface MoveAnalysis {
  bestMove: string; bestSan: string | null; playedSan: string;
  cpBefore: number; cpAfter: number; lossPct: number;
  quality: 'best' | 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  pv: string[]; engine: string;
}

async function post<T>(path: string, body: unknown, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const abort = () => ctrl.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export function warmUp() {
  fetch(`${API}/api/engine/health`).catch(() => undefined);
}

export interface BotSettings {
  movetime: number;
  skill?: number;
  elo?: number;
  /** Kept only for legacy callers. Gameplay profiles use movetime, not both constraints. */
  depth?: number;
  fallbackTimeMs?: number;
  fallbackDepth?: number;
  variety?: number;
  maxQuiescenceDepth?: number;
}

export const BOT_ENGINE: Record<BotLevel, BotSettings> = {
  beginner:     { movetime: 90,  skill: 0,   fallbackTimeMs: DIFFICULTY_PROFILES.beginner.fallbackTimeMs, fallbackDepth: DIFFICULTY_PROFILES.beginner.fallbackDepth, variety: DIFFICULTY_PROFILES.beginner.variety },
  intermediate: { movetime: 220, elo: 1350, fallbackTimeMs: DIFFICULTY_PROFILES.intermediate.fallbackTimeMs, fallbackDepth: DIFFICULTY_PROFILES.intermediate.fallbackDepth, variety: DIFFICULTY_PROFILES.intermediate.variety },
  advanced:     { movetime: 450, elo: 1750, fallbackTimeMs: DIFFICULTY_PROFILES.advanced.fallbackTimeMs, fallbackDepth: DIFFICULTY_PROFILES.advanced.fallbackDepth, variety: DIFFICULTY_PROFILES.advanced.variety },
  master:       { movetime: 800, elo: 2200, fallbackTimeMs: DIFFICULTY_PROFILES.master.fallbackTimeMs, fallbackDepth: DIFFICULTY_PROFILES.master.fallbackDepth, variety: DIFFICULTY_PROFILES.master.variety },
};

/** Exported to allow deterministic tests of fallback selection. */
export function fallbackBotMove(
  fen: string,
  settings: BotSettings,
  random: () => number = Math.random,
): { from: string; to: string; promotion?: string; source: 'interno' } {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });
  if (!legalMoves.length) throw new Error('sem lances');

  const depth = Math.max(1, Math.min(10, settings.fallbackDepth ?? 4));
  const timeMs = Math.max(50, Math.min(2_000, settings.fallbackTimeMs ?? settings.movetime));
  const result = searchBestMove(chess, depth, timeMs, settings.maxQuiescenceDepth ?? 8);
  const best = legalMoves.find((move) => move.san === result.san) ?? legalMoves[0];
  const variety = Math.max(0, Math.min(1, settings.variety ?? 0));

  if (variety > 0 && random() < variety && legalMoves.length > 1) {
    const alternatives = legalMoves.filter((move) =>
      move.san !== best.san && !move.san.includes('#') && (!move.captured || variety < 0.5)
    );
    if (alternatives.length) {
      const index = Math.min(alternatives.length - 1, Math.floor(random() * alternatives.length));
      const move = alternatives[index];
      return { from: move.from, to: move.to, promotion: move.promotion, source: 'interno' };
    }
  }

  return { from: best.from, to: best.to, promotion: best.promotion, source: 'interno' };
}

export async function botMove(
  fen: string, settings: BotSettings, signal?: AbortSignal,
): Promise<{ from: string; to: string; promotion?: string; source: 'stockfish' | 'interno'; lines: EngineLine[]; engine: string; ms: number }> {
  try {
    const { depth: _depth, fallbackTimeMs: _fallbackTime, fallbackDepth: _fallbackDepth, variety: _variety, maxQuiescenceDepth: _maxQ, ...engineSettings } = settings;
    const r = await post<RemoteSearch>('/api/engine/search', { fen, multiPV: 3, ...engineSettings }, Math.max(4_000, settings.movetime + 3_000), signal);
    const chess = new Chess(fen);
    const move = chess.moves({ verbose: true }).find((candidate) =>
      candidate.from === r.bestMove.slice(0, 2) && candidate.to === r.bestMove.slice(2, 4) &&
      (candidate.promotion ?? '') === (r.bestMove[4] ?? '')
    );
    if (!move) throw new Error('motor remoto retornou lance ilegal');
    return { from: move.from, to: move.to, promotion: move.promotion, source: 'stockfish', lines: r.lines ?? [], engine: r.engine, ms: r.ms };
  } catch (error) {
    if (signal?.aborted) throw error;
    const fallback = fallbackBotMove(fen, settings);
    return { ...fallback, lines: [{ multipv: 1, depth: settings.fallbackDepth ?? 4, pv: [fallback.from + fallback.to + (fallback.promotion ?? '')] }], engine: 'Motor interno (fallback)', ms: settings.fallbackTimeMs ?? settings.movetime };
  }
}

export async function analyzeMoveRemote(
  fen: string, move: string, depth = 12, signal?: AbortSignal,
): Promise<MoveAnalysis | null> {
  try {
    return await post<MoveAnalysis>('/api/engine/analyze-move', { fen, move, depth }, 15_000, signal);
  } catch {
    return null;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Converte uma variante UCI em notação SAN para exibição ao jogador. */
export function uciPvToSan(fen: string, pv: string[]): string[] {
  const chess = new Chess(fen);
  const san: string[] = [];
  for (const uci of pv) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) break;
    try {
      const move = chess.move({ from: uci.slice(0, 2) as any, to: uci.slice(2, 4) as any, promotion: uci[4] });
      san.push(move.san);
    } catch { break; }
  }
  return san;
}
