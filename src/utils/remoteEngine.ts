import { Chess, Move } from 'chess.js';
import { BotLevel } from '../types/chess';
import { findBestMoveWithQuiescence } from './search';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface BotEngineConfig {
  skill?: number;
  elo?: number;
  movetime?: number;
  depth?: number;
  blunderChance?: number;
}

export const BOT_ENGINE: Record<BotLevel, BotEngineConfig> = {
  beginner: { skill: 0, depth: 1, movetime: 120, blunderChance: 0.28 },
  intermediate: { elo: 1400, movetime: 250, depth: 6, blunderChance: 0.10 },
  advanced: { elo: 1800, movetime: 450, depth: 10, blunderChance: 0.02 },
  master: { elo: 2300, movetime: 800, depth: 14, blunderChance: 0.0 },
};

export interface RemoteSearchResult {
  bestMove: string; // uci (e.g. e2e4)
  san?: string;
  lines: Array<{
    multipv: number;
    depth: number;
    cp?: number;
    mate?: number;
    pv: string[];
  }>;
  engine: string;
  ms: number;
}

export interface RemoteAnalyzeResult {
  bestMove: string;
  bestSan?: string;
  playedSan: string;
  cpBefore: number;
  cpAfter: number;
  lossPct: number;
  quality: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  pv: string[];
  engine: string;
}

/**
 * Ping backend to wake up cloud instances or engine processes
 */
export async function warmUp(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/engine/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
  } catch {
    // Silent warm up catch
  }
}

/**
 * Request move from Stockfish API with automatic seamless internal fallback
 */
export async function botMove(
  fen: string,
  config: BotEngineConfig,
  signal?: AbortSignal
): Promise<{ from: string; to: string; promotion?: string; source: 'stockfish' | 'interno'; san?: string }> {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    throw new Error('Sem lances legais disponíveis');
  }

  // Handle intentional beginner blunders if configured
  if (config.blunderChance && Math.random() < config.blunderChance && legalMoves.length > 1) {
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      from: randomMove.from,
      to: randomMove.to,
      promotion: randomMove.promotion,
      san: randomMove.san,
      source: 'interno',
    };
  }

  // Try Remote Stockfish Engine
  try {
    const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(config.movetime ? config.movetime + 3500 : 4000) : undefined;
    const combinedSignal = signal || timeoutSignal;

    const response = await fetch(`${API_BASE_URL}/api/engine/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen,
        movetime: config.movetime,
        depth: config.depth,
        skill: config.skill,
        elo: config.elo,
      }),
      signal: combinedSignal,
    });

    if (response.ok) {
      const data: RemoteSearchResult = await response.json();
      if (data.bestMove && data.bestMove.length >= 4) {
        const from = data.bestMove.slice(0, 2);
        const to = data.bestMove.slice(2, 4);
        const promotion = data.bestMove.length > 4 ? data.bestMove.slice(4, 5) : undefined;

        // Verify validity in chess.js
        const matched = legalMoves.find(
          (m) => m.from === from && m.to === to && (m.promotion ?? '') === (promotion ?? '')
        );
        if (matched) {
          return { from, to, promotion, san: matched.san, source: 'stockfish' };
        }
      }
    }
  } catch {
    // Engine API not reachable or timed out - fall through to internal search
  }

  // Fallback to internal search with quiescence
  const fallbackDepth = config.depth ? Math.min(3, config.depth) : 2;
  const bestResult = findBestMoveWithQuiescence(chess, fallbackDepth);
  const chosenMove = bestResult.move || legalMoves[0];

  return {
    from: chosenMove.from,
    to: chosenMove.to,
    promotion: chosenMove.promotion,
    san: chosenMove.san,
    source: 'interno',
  };
}

/**
 * Request move quality and evaluation from Stockfish API
 */
export async function analyzeMoveRemote(
  fenBefore: string,
  playedSan: string,
  depth: number = 10,
  signal?: AbortSignal
): Promise<RemoteAnalyzeResult | null> {
  try {
    const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined;
    const combinedSignal = signal || timeoutSignal;

    const response = await fetch(`${API_BASE_URL}/api/engine/analyze-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: fenBefore,
        move: playedSan,
        depth,
      }),
      signal: combinedSignal,
    });

    if (response.ok) {
      return (await response.json()) as RemoteAnalyzeResult;
    }
  } catch {
    // Failed or offline
  }

  return null;
}
