// src/utils/remoteEngine.ts — cliente do Stockfish nativo (servidor) com reserva local
import { Chess } from 'chess.js';
import { searchBestMove } from './search';

// Em produção (GitHub Pages) defina VITE_API_URL=https://seu-servico.run.app  (sem barra no fim)
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
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Acorda o servidor (Cloud Run pode estar com "partida a frio"). Chame ao abrir o app. */
export function warmUp() {
  fetch(`${API}/api/engine/health`).catch(() => undefined);
}

export interface BotSettings { movetime: number; skill?: number; elo?: number; depth?: number }

/** Nível do bot -> parâmetros do Stockfish. UCI_Elo só existe de 1320 a 3190. */
export const BOT_ENGINE: Record<'beginner' | 'intermediate' | 'advanced' | 'master', BotSettings> = {
  beginner:     { movetime: 100,  skill: 0, depth: 1 },
  intermediate: { movetime: 250,  elo: 1400 },
  advanced:     { movetime: 400,  elo: 1800 },
  master:       { movetime: 800,  elo: 2300 },
};

/** Melhor lance do bot. Se o servidor falhar/demorar, usa o motor interno (mais fraco). */
export async function botMove(
  fen: string, s: BotSettings, signal?: AbortSignal,
): Promise<{ from: string; to: string; promotion?: string; source: 'stockfish' | 'interno' }> {
  try {
    const r = await post<RemoteSearch>('/api/engine/search', { fen, ...s }, 8000, signal);
    return { from: r.bestMove.slice(0, 2), to: r.bestMove.slice(2, 4), promotion: r.bestMove[4], source: 'stockfish' };
  } catch (e) {
    if (signal?.aborted) throw e; // cancelado de propósito (nova partida / desfez lance)
    const chess = new Chess(fen);
    const r = searchBestMove(chess, 4, 600);
    const mv = chess.moves({ verbose: true }).find((m) => m.san === r.san);
    if (!mv) throw new Error('sem lances');
    return { from: mv.from, to: mv.to, promotion: mv.promotion, source: 'interno' };
  }
}

/** Análise de um lance (coach). Sem reserva: se o servidor cair, devolve null e a UI esconde a análise. */
export async function analyzeMoveRemote(
  fen: string, move: string, depth = 12, signal?: AbortSignal,
): Promise<MoveAnalysis | null> {
  try {
    return await post<MoveAnalysis>('/api/engine/analyze-move', { fen, move, depth }, 15000, signal);
  } catch {
    return null;
  }
}

// Export the base URL variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
