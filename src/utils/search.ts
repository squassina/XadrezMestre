import { Chess, PieceSymbol, Square } from 'chess.js';
import { PIECE_VALUES, PST } from './engine';

const MATE = 100000;
const EXACT = 0, LOWER = 1, UPPER = 2;
type TTEntry = { depth: number; score: number; flag: number; move?: string };

const tt = new Map<string, TTEntry>();
const killers: Array<[string?, string?]> = [];
let nodes = 0;
let deadline = 0;
let stopped = false;

// Avaliação do ponto de vista de quem joga (negamax precisa disso)
function evalStm(chess: Chess): number {
  const board = chess.board();
  let s = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const idx = p.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      const v = PIECE_VALUES[p.type] + PST[p.type][idx];
      s += p.color === 'w' ? v : -v;
    }
  }
  return chess.turn() === 'w' ? s : -s;
}

const key = (chess: Chess) => chess.fen().split(' ').slice(0, 4).join(' ');

const PIECE_OF: Record<string, PieceSymbol> = { N: 'n', B: 'b', R: 'r', Q: 'q', K: 'k' };

// SAN (string) é ~25x mais rápido de gerar que moves({ verbose: true })
function moveScore(chess: Chess, san: string, ttMove: string | undefined, ply: number): number {
  if (san === ttMove) return 1_000_000;
  let s = 0;
  if (san.includes('x')) {
    const m = san.match(/x([a-h][1-8])/);
    const victim = m ? chess.get(m[1] as Square)?.type : undefined; // en passant: victim = peão
    const attacker = PIECE_OF[san[0]] ?? 'p';
    s += 10_000 + PIECE_VALUES[victim ?? 'p'] * 10 - PIECE_VALUES[attacker];
  }
  if (san.includes('=')) s += 9_000;
  if (killers[ply]?.includes(san)) s += 5_000;
  if (san.endsWith('+') || san.endsWith('#')) s += 3_000;
  return s;
}

function order(chess: Chess, moves: string[], ttMove: string | undefined, ply: number): string[] {
  return moves
    .map((m) => [moveScore(chess, m, ttMove, ply), m] as const)
    .sort((a, b) => b[0] - a[0])
    .map((x) => x[1]);
}

function tick() {
  if ((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
}

function qsearch(chess: Chess, alpha: number, beta: number, qDepth = 0, maxQuiescenceDepth = 8): number {
  tick();
  if (stopped) return 0;
  const stand = evalStm(chess);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qDepth >= maxQuiescenceDepth) return alpha;
  const tactical = chess.moves().filter((m) => m.includes('x') || m.includes('='));
  for (const m of order(chess, tactical, undefined, 0)) {
    chess.move(m);
    const sc = -qsearch(chess, -beta, -alpha, qDepth + 1, maxQuiescenceDepth);
    chess.undo();
    if (stopped) return 0;
    if (sc >= beta) return beta;
    if (sc > alpha) alpha = sc;
  }
  return alpha;
}

// Placar de mate depende da distância (ply) -> ajuste ao guardar/ler da TT
const toTT = (s: number, ply: number) => (s > MATE - 1000 ? s + ply : s < -MATE + 1000 ? s - ply : s);
const fromTT = (s: number, ply: number) => (s > MATE - 1000 ? s - ply : s < -MATE + 1000 ? s + ply : s);

function negamax(chess: Chess, depth: number, alpha: number, beta: number, ply: number, maxQuiescenceDepth: number): number {
  tick();
  if (stopped) return 0;
  if (ply > 0 && chess.isDraw()) return 0;

  const inCheck = chess.inCheck();
  if (inCheck) depth++; // extensão de xeque
  if (depth <= 0) return qsearch(chess, alpha, beta, 0, maxQuiescenceDepth);

  const k = key(chess);
  const e = tt.get(k);
  if (e && e.depth >= depth && ply > 0) {
    const s = fromTT(e.score, ply);
    if (e.flag === EXACT) return s;
    if (e.flag === LOWER && s >= beta) return s;
    if (e.flag === UPPER && s <= alpha) return s;
  }

  const moves = chess.moves();
  if (moves.length === 0) return inCheck ? -MATE + ply : 0;

  const alpha0 = alpha;
  let best = -Infinity;
  let bestSan: string | undefined;

  for (const m of order(chess, moves, e?.move, ply)) {
    chess.move(m);
    const sc = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, maxQuiescenceDepth);
    chess.undo();
    if (stopped) return 0;
    if (sc > best) { best = sc; bestSan = m; }
    if (sc > alpha) alpha = sc;
    if (alpha >= beta) {
      if (!m.includes('x')) killers[ply] = [m, killers[ply]?.[0]];
      break;
    }
  }

  const flag = best <= alpha0 ? UPPER : best >= beta ? LOWER : EXACT;
  if (tt.size > 200_000) tt.clear();
  tt.set(k, { depth, score: toTT(best, ply), flag, move: bestSan });
  return best;
}

export interface SearchResult { san: string | null; score: number; depth: number; nodes: number }

/** Aprofundamento iterativo com limite de tempo. score = centipawns do ponto de vista de QUEM JOGA. */
export function searchBestMove(chess: Chess, maxDepth = 6, timeMs = 800, maxQuiescenceDepth = 8): SearchResult {
  nodes = 0; stopped = false; deadline = Date.now() + timeMs; killers.length = 0;
  let rootMoves = chess.moves();
  if (rootMoves.length === 0) return { san: null, score: 0, depth: 0, nodes: 0 };

  let result: SearchResult = { san: rootMoves[0], score: 0, depth: 0, nodes: 0 };
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let bestMove = rootMoves[0];
    let bestScore = -Infinity;
    for (const m of rootMoves) {
      chess.move(m);
      const sc = -negamax(chess, depth - 1, -Infinity, -alpha, 1, maxQuiescenceDepth);
      chess.undo();
      if (stopped) break;
      if (sc > bestScore) { bestScore = sc; bestMove = m; }
      if (sc > alpha) alpha = sc;
    }
    if (stopped) break; // descarta iteração incompleta
    result = { san: bestMove, score: bestScore, depth, nodes };
    rootMoves = [bestMove, ...rootMoves.filter((m) => m !== bestMove)]; // melhor primeiro
    if (Math.abs(bestScore) > MATE - 1000) break; // mate achado
  }
  return result;
}
