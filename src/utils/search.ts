import { Chess, Move } from 'chess.js';

// Standard piece values in centipawns
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables (from White's perspective)
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

const CHECKMATE_SCORE = 100000;

export function evaluatePosition(chess: Chess, ply: number = 0): number {
  if (chess.isCheckmate()) {
    // Distance-aware checkmate: closer checkmate is better
    return chess.turn() === 'w' ? -(CHECKMATE_SCORE - ply) : (CHECKMATE_SCORE - ply);
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
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

  return score;
}

/**
 * Quiescence search: avoids the horizon effect by continuing to search captures
 * until a quiet position is reached.
 */
function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  isWhite: boolean,
  ply: number,
  maxQDepth: number = 4
): number {
  const standPat = evaluatePosition(chess, ply);

  if (ply >= maxQDepth) {
    return standPat;
  }

  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // Fast capture moves only
    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured || m.san.includes('+'));
    // Sort captures by MVV-LVA
    captureMoves.sort((a, b) => {
      const aVal = (PIECE_VALUES[a.captured || 'p'] || 100) - (PIECE_VALUES[a.piece] || 100) / 10;
      const bVal = (PIECE_VALUES[b.captured || 'p'] || 100) - (PIECE_VALUES[b.piece] || 100) / 10;
      return bVal - aVal;
    });

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, false, ply + 1, maxQDepth);
      chess.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;

    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured || m.san.includes('+'));
    captureMoves.sort((a, b) => {
      const aVal = (PIECE_VALUES[a.captured || 'p'] || 100) - (PIECE_VALUES[a.piece] || 100) / 10;
      const bVal = (PIECE_VALUES[b.captured || 'p'] || 100) - (PIECE_VALUES[b.piece] || 100) / 10;
      return bVal - aVal;
    });

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, true, ply + 1, maxQDepth);
      chess.undo();

      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

/**
 * Minimax with Alpha-Beta Pruning and Quiescence Search
 */
function minimaxAlphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isWhite: boolean,
  ply: number
): number {
  if (depth <= 0) {
    return quiescence(chess, alpha, beta, isWhite, ply);
  }

  if (chess.isGameOver()) {
    return evaluatePosition(chess, ply);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return evaluatePosition(chess, ply);
  }

  // Move ordering: checks and high-value captures first
  moves.sort((a, b) => {
    let aWeight = 0;
    let bWeight = 0;
    if (a.captured) aWeight += (PIECE_VALUES[a.captured] || 100) * 10 - (PIECE_VALUES[a.piece] || 100);
    if (b.captured) bWeight += (PIECE_VALUES[b.captured] || 100) * 10 - (PIECE_VALUES[b.piece] || 100);
    if (a.san.includes('+') || a.san.includes('#')) aWeight += 70;
    if (b.san.includes('+') || b.san.includes('#')) bWeight += 70;
    return bWeight - aWeight;
  });

  if (isWhite) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimaxAlphaBeta(chess, depth - 1, alpha, beta, false, ply + 1);
      chess.undo();

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Beta cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimaxAlphaBeta(chess, depth - 1, alpha, beta, true, ply + 1);
      chess.undo();

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return minEval;
  }
}

/**
 * Find best move using Quiescence Search and Alpha-Beta
 */
export function findBestMoveWithQuiescence(
  chess: Chess,
  depth: number = 3
): { move: Move | null; score: number } {
  const isWhite = chess.turn() === 'w';
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) {
    return { move: null, score: evaluatePosition(chess, 0) };
  }

  // Sort candidate moves
  moves.sort((a, b) => {
    let aScore = 0;
    let bScore = 0;
    if (a.captured) aScore += (PIECE_VALUES[a.captured] || 100) * 10 - (PIECE_VALUES[a.piece] || 100);
    if (b.captured) bScore += (PIECE_VALUES[b.captured] || 100) * 10 - (PIECE_VALUES[b.piece] || 100);
    if (a.san.includes('#')) aScore += 10000;
    else if (a.san.includes('+')) aScore += 80;
    if (b.san.includes('#')) bScore += 10000;
    else if (b.san.includes('+')) bScore += 80;
    return bScore - aScore;
  });

  let bestMove = moves[0];
  let bestScore = isWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimaxAlphaBeta(chess, depth - 1, alpha, beta, !isWhite, 1);
    chess.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
    }
  }

  return { move: bestMove, score: bestScore };
}
