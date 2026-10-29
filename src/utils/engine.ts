import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { AnalyzedMove, BlunderCategory, MoveQuality, BotLevel, BotConfig } from '../types/chess';

import { getOpeningForPosition, getBookMove, OPENING_BOOK, OpeningEntry } from '../data/openings';

export { getOpeningForPosition, getBookMove, OPENING_BOOK };

// Standard piece values in centipawns
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables (PST) - from White's perspective (a8 is index 0)
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

// Transposition Cache for Fast Evaluation
const evalCache = new Map<string, number>();
const bestMoveCache = new Map<string, { move: Move | null; score: number }>();
const MAX_CACHE_SIZE = 5000;

function getCachedEval(fen: string): number | undefined {
  return evalCache.get(fen);
}

function setCachedEval(fen: string, score: number) {
  if (evalCache.size >= MAX_CACHE_SIZE) {
    evalCache.clear();
  }
  evalCache.set(fen, score);
}

function getCachedBestMove(key: string): { move: Move | null; score: number } | undefined {
  return bestMoveCache.get(key);
}

function setCachedBestMove(key: string, result: { move: Move | null; score: number }) {
  if (bestMoveCache.size >= MAX_CACHE_SIZE) {
    bestMoveCache.clear();
  }
  bestMoveCache.set(key, result);
}

/**
 * Fast static evaluation from White's perspective (+ means White is winning, - means Black)
 */
export function evaluateBoard(chess: Chess): number {
  const fen = chess.fen();
  const cached = getCachedEval(fen);
  if (cached !== undefined) return cached;

  if (chess.isCheckmate()) {
    const val = chess.turn() === 'w' ? -20000 : 20000;
    setCachedEval(fen, val);
    return val;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    setCachedEval(fen, 0);
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    const row = board[r];
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (!piece) continue;

      const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      let pstVal = 0;

      switch (piece.type) {
        case 'p': pstVal = PAWN_TABLE[idx]; break;
        case 'n': pstVal = KNIGHT_TABLE[idx]; break;
        case 'b': pstVal = BISHOP_TABLE[idx]; break;
        case 'r': pstVal = ROOK_TABLE[idx]; break;
        case 'q': pstVal = QUEEN_TABLE[idx]; break;
        case 'k': pstVal = KING_TABLE[idx]; break;
      }

      const totalVal = PIECE_VALUES[piece.type] + pstVal;
      score += piece.color === 'w' ? totalVal : -totalVal;
    }
  }

  if (chess.inCheck()) {
    score += chess.turn() === 'w' ? -35 : 35;
  }

  setCachedEval(fen, score);
  return score;
}

/**
 * Fast Move Ordering with MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
 */
function sortMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let aScore = 0;
    let bScore = 0;

    if (a.captured) {
      aScore = PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece];
    }
    if (b.captured) {
      bScore = PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece];
    }

    if (a.san.includes('+') || a.san.includes('#')) aScore += 60;
    if (b.san.includes('+') || b.san.includes('#')) bScore += 60;

    return bScore - aScore;
  });
}

/**
 * Minimax with Alpha-Beta Pruning and Move Ordering
 */
export function findBestMove(
  chess: Chess,
  depth: number = 2
): { move: Move | null; score: number } {
  const cacheKey = `${chess.fen()}_d${depth}`;
  const cached = getCachedBestMove(cacheKey);
  if (cached) return cached;

  const isWhite = chess.turn() === 'w';
  const moves = sortMoves(chess.moves({ verbose: true }));

  if (moves.length === 0) {
    const res = { move: null, score: evaluateBoard(chess) };
    setCachedBestMove(cacheKey, res);
    return res;
  }

  // 1. Check Opening Book Library for first 10-15 moves (ply <= 30)
  const historyLen = chess.history().length;
  if (historyLen <= 30) {
    const opening = getOpeningForPosition(chess.fen());
    if (opening && opening.moves.length > 0) {
      // Find top book main-line move
      const topBookMove = opening.moves[0];
      const matched = moves.find((m) => m.san === topBookMove.san);
      if (matched) {
        const bookRes = { move: matched, score: evaluateBoard(chess) };
        setCachedBestMove(cacheKey, bookRes);
        return bookRes;
      }
    }
  }

  let bestMove: Move | null = moves[0];
  let bestScore = isWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, !isWhite);
    chess.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      break;
    }
  }

  const result = { move: bestMove, score: bestScore };
  setCachedBestMove(cacheKey, result);
  return result;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isWhite: boolean
): number {
  if (depth <= 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = sortMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    return evaluateBoard(chess);
  }

  if (isWhite) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Fast detection of common tactical blunder archetype
 */
/**
 * Fast detection of common tactical blunder archetype
 * Corrected to avoid marking player's check as King Vulnerable.
 */
export function detectBlunderCategory(
  chessBefore: Chess,
  chessAfter: Chess,
  playedMove: Move,
  bestMove: Move | null
): BlunderCategory {
  const opponentMoves = chessAfter.moves({ verbose: true });
  const moveNumber = chessAfter.history().length;
  const playerColor = playedMove.color;

  // 1. King Vulnerability: Did the move allow immediate mate or dangerous checks against player's King?
  const opponentChecks = opponentMoves.filter((m) => m.san.includes('+') || m.san.includes('#'));
  const allowsMate = opponentMoves.some((m) => m.san.includes('#'));
  
  if (allowsMate) {
    return 'Rei Vulnerável';
  }

  // If opponent now has devastating checks against the player's king, or player moved king unnecessarily
  if (opponentChecks.length > 0) {
    // If king was moved losing castling rights early or checks win material
    if (playedMove.piece === 'k' && moveNumber <= 30) {
      return 'Rei Vulnerável';
    }
    // King shield pawn moved (e.g. f2/f3/f4/g4 or f7/f6/f5/g5)
    if (playedMove.piece === 'p' && (playedMove.from.startsWith('f') || playedMove.from.startsWith('g'))) {
      return 'Rei Vulnerável';
    }
  }

  // 2. Check if a piece was left hanging (piece on destination or elsewhere is captured for free)
  const destPiece = chessAfter.get(playedMove.to);
  if (destPiece) {
    const capturesOnDest = opponentMoves.filter((m) => m.to === playedMove.to);
    if (capturesOnDest.length > 0) {
      const pieceVal = PIECE_VALUES[destPiece.type] || 100;
      const capturingPieceVal = PIECE_VALUES[capturesOnDest[0].piece] || 100;
      if (pieceVal >= capturingPieceVal) {
        return 'Peça Pendurada';
      }
    }
  }

  // Check if any other piece of player is attacked undefended
  for (const oppMove of opponentMoves) {
    if (oppMove.captured && PIECE_VALUES[oppMove.captured] >= 300) {
      // High value piece captured
      return 'Peça Pendurada';
    }
  }

  // 3. Fork check: does opponent have a knight/pawn move attacking 2+ pieces?
  for (const oppMove of opponentMoves) {
    if (oppMove.piece === 'n' || oppMove.piece === 'p') {
      const testChess = new Chess(chessAfter.fen());
      try {
        testChess.move(oppMove);
        const threats = testChess.moves({ verbose: true }).filter((m) => {
          const target = testChess.get(m.to);
          return target && target.color === playerColor && PIECE_VALUES[target.type] >= 300;
        });
        const uniqueTargets = new Set(threats.map((m) => m.to));
        if (uniqueTargets.size >= 2) {
          return 'Garfo Sofrido';
        }
      } catch {}
    }
  }

  // 4. Missed winning tactic
  if (bestMove && (bestMove.captured || bestMove.san.includes('+') || bestMove.san.includes('#'))) {
    return 'Oportunidade Tática Perdida';
  }

  // 5. Opening slow development
  if (moveNumber <= 12 && (playedMove.piece === 'q' || playedMove.piece === 'k')) {
    return 'Desenvolvimento Lento';
  }

  return 'Erro Posicional';
}

/**
 * Ultra-fast move classification (< 5ms)
 */
export function analyzeMove(
  chessBefore: Chess,
  playedMove: Move,
  engineDepth: number = 2
): AnalyzedMove {
  const playerColor = chessBefore.turn();
  const isWhite = playerColor === 'w';

  // Fast evaluation of position before
  const { move: bestMove, score: evalBefore } = findBestMove(chessBefore, engineDepth);

  // Fast evaluation of position after
  const chessAfter = new Chess(chessBefore.fen());
  chessAfter.move(playedMove);
  const evalAfter = evaluateBoard(chessAfter);

  const evalDiff = isWhite ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

  let quality: MoveQuality = 'good';
  let qualityLabel = 'Bom';
  let blunderCategory: BlunderCategory | undefined;

  // Check if move is in opening book
  const openingBefore = getOpeningForPosition(chessBefore.fen());
  let isBookMove = false;
  let openingName = openingBefore?.name;
  let eco = openingBefore?.eco;
  let coachFeedback = undefined;

  if (openingBefore) {
    const matchedBookMove = openingBefore.moves.find((m) => m.san === playedMove.san);
    if (matchedBookMove) {
      isBookMove = true;
      quality = 'best';
      qualityLabel = 'Livro Teórico';
      coachFeedback = {
        explanation: matchedBookMove.comment || `Lance teórico clássico na ${openingBefore.name}.`,
        tacticalConcept: `${openingBefore.eco} · ${openingBefore.name}`,
        proTip: openingBefore.plan || 'Controle o centro com peões e mobilize as peças menores.',
        keyQuestionsToAsk: [
          'Este lance desenvolve uma peça ou apoia o centro?',
          'Qual é o plano estratégico típico desta abertura?'
        ]
      };
    }
  }

  const isExactBest = bestMove && playedMove.from === bestMove.from && playedMove.to === bestMove.to;

  if (isBookMove) {
    // Already set as Livro Teórico
  } else if (isExactBest) {
    quality = 'best';
    qualityLabel = 'Melhor Lance';
  } else if (evalDiff <= 30) {
    quality = 'best';
    qualityLabel = 'Excelente';
  } else if (evalDiff <= 80) {
    quality = 'good';
    qualityLabel = 'Bom';
  } else if (evalDiff <= 170) {
    quality = 'inaccuracy';
    qualityLabel = 'Imprecisão';
    blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
  } else if (evalDiff <= 300) {
    quality = 'mistake';
    qualityLabel = 'Erro';
    blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
  } else {
    quality = 'blunder';
    qualityLabel = 'Gafe (Capivara)';
    blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
  }

  const historyLength = chessAfter.history().length;
  const moveNumber = Math.ceil(historyLength / 2);

  return {
    moveNumber,
    san: playedMove.san,
    from: playedMove.from,
    to: playedMove.to,
    fen: chessAfter.fen(),
    color: playerColor,
    evalBefore,
    evalAfter,
    evalDiff,
    quality,
    qualityLabel,
    blunderCategory,
    bestMoveSan: bestMove ? bestMove.san : undefined,
    bestMoveFromTo: bestMove ? { from: bestMove.from, to: bestMove.to } : undefined,
    isBookMove,
    openingName,
    eco,
    coachFeedback,
    timestamp: Date.now(),
  };
}

/**
 * Asynchronous move analysis that does not block the UI thread
 */
export function analyzeMoveAsync(
  chessBefore: Chess,
  playedMove: Move,
  engineDepth: number = 2
): Promise<AnalyzedMove> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(analyzeMove(chessBefore, playedMove, engineDepth));
    }, 0);
  });
}

/**
 * Bot configs for different skill levels
 */
export const BOT_CONFIGS: Record<BotLevel, BotConfig> = {
  beginner: {
    id: 'beginner',
    name: 'Sofia Novata',
    title: 'Iniciante',
    elo: 800,
    depth: 1,
    randomness: 0.35,
    blunderChance: 0.25,
    avatar: '♟️',
    description: 'Comete gafes típicas de iniciantes, excelente para treinar punições táticas.',
  },
  intermediate: {
    id: 'intermediate',
    name: 'Carlos Estrategista',
    title: 'Intermediário',
    elo: 1350,
    depth: 2,
    randomness: 0.12,
    blunderChance: 0.06,
    avatar: '♞',
    description: 'Joga com base em princípios sólidos, mas deixa escapar táticas de 2 lances.',
  },
  advanced: {
    id: 'advanced',
    name: 'Dra. Helena',
    title: 'Avançado',
    elo: 1750,
    depth: 2,
    randomness: 0.03,
    blunderChance: 0.01,
    avatar: '♜',
    description: 'Cálculo apurado, rara perda de material e forte pressão posicional.',
  },
  master: {
    id: 'master',
    name: 'GM Mikhail',
    title: 'Mestre',
    elo: 2200,
    depth: 3,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: '♛',
    description: 'Nível quase impecável. Exige precisão tática e profilaxia máxima.',
  },
};

/**
 * Generate bot move based on chosen personality/rating
 */
export function getBotMove(chess: Chess, botLevel: BotLevel): Move | null {
  const config = BOT_CONFIGS[botLevel];
  const moves = sortMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) return null;

  // 1. Play standard main-line moves from Opening Book during first 10-15 moves
  const ply = chess.history().length;
  if (ply <= 30) {
    const maxBookPly = config.id === 'beginner' ? 6 : config.id === 'intermediate' ? 14 : 26;
    if (ply < maxBookPly) {
      const bookMove = getBookMove(chess.fen());
      if (bookMove) {
        const matched = moves.find((m) => m.san === bookMove.san);
        if (matched) return matched;
      }
    }
  }

  // Blunder chance for lower bots
  if (Math.random() < config.blunderChance && moves.length > 2) {
    const nonCaptureMoves = moves.filter((m) => !m.captured);
    const pool = nonCaptureMoves.length > 0 ? nonCaptureMoves : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Random suboptimal choice
  if (Math.random() < config.randomness && moves.length > 1) {
    const subPool = moves.slice(0, Math.min(3, moves.length));
    return subPool[Math.floor(Math.random() * subPool.length)];
  }

  const { move } = findBestMove(chess, config.depth);
  return move || moves[0];
}

// usado por search.ts (motor interno de reserva)
export const PST: Record<PieceSymbol, number[]> = {
  p: PAWN_TABLE, n: KNIGHT_TABLE, b: BISHOP_TABLE, r: ROOK_TABLE, q: QUEEN_TABLE, k: KING_TABLE,
};
