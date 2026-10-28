import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { AnalyzedMove, BlunderCategory, MoveQuality, BotLevel, BotConfig } from '../types/chess';

// Standard piece values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
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

function getSquareIndex(square: Square, color: Color): number {
  const file = square.charCodeAt(0) - 97; // 0 to 7
  const rank = 8 - parseInt(square[1], 10); // 0 to 7 (8 is 0, 1 is 7)
  if (color === 'w') {
    return rank * 8 + file;
  } else {
    // Mirror for black
    return (7 - rank) * 8 + file;
  }
}

/**
 * Static evaluation from White's perspective (+ means White is winning, - means Black)
 */
export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -20000 : 20000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const squareName = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
      const idx = getSquareIndex(squareName, piece.color);
      let pstVal = 0;

      switch (piece.type) {
        case 'p': pstVal = PAWN_TABLE[idx] || 0; break;
        case 'n': pstVal = KNIGHT_TABLE[idx] || 0; break;
        case 'b': pstVal = BISHOP_TABLE[idx] || 0; break;
        case 'r': pstVal = ROOK_TABLE[idx] || 0; break;
        case 'q': pstVal = QUEEN_TABLE[idx] || 0; break;
        case 'k': pstVal = KING_TABLE[idx] || 0; break;
      }

      const totalPieceVal = PIECE_VALUES[piece.type] + pstVal;
      if (piece.color === 'w') {
        score += totalPieceVal;
      } else {
        score -= totalPieceVal;
      }
    }
  }

  // Bonus for active mobility and king check
  if (chess.inCheck()) {
    score += chess.turn() === 'w' ? -40 : 40;
  }

  return score;
}

/**
 * Minimax with alpha-beta pruning
 */
export function findBestMove(
  chess: Chess,
  depth: number = 3
): { move: Move | null; score: number } {
  const isWhite = chess.turn() === 'w';
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) {
    return { move: null, score: evaluateBoard(chess) };
  }

  // Simple move sorting: prioritize captures & checks
  moves.sort((a, b) => {
    let aVal = a.captured ? PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece] : 0;
    let bVal = b.captured ? PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece] : 0;
    if (a.san.includes('+') || a.san.includes('#')) aVal += 50;
    if (b.san.includes('+') || b.san.includes('#')) bVal += 50;
    return bVal - aVal;
  });

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

  return { move: bestMove, score: bestScore };
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isWhite: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
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
 * Detect common tactical blunder archetype
 */
export function detectBlunderCategory(
  chessBefore: Chess,
  chessAfter: Chess,
  playedMove: Move,
  bestMove: Move | null
): BlunderCategory {
  // Check if player's king is now in dangerous check
  if (chessAfter.inCheck()) {
    return 'Rei Vulnerável';
  }

  // Check if opponent now has a winning fork (attacking 2 valuable pieces)
  const opponentMoves = chessAfter.moves({ verbose: true });
  for (const oppMove of opponentMoves) {
    if (oppMove.piece === 'n' || oppMove.piece === 'p') {
      chessAfter.move(oppMove);
      // Count attacked player pieces
      const playerPiecesAttacked = opponentMoves.filter(m => m.captured && ['q', 'r', 'k'].includes(m.captured));
      chessAfter.undo();
      if (playerPiecesAttacked.length >= 2) {
        return 'Garfo Sofrido';
      }
    }
  }

  // Check if a piece was left hanging (piece on destination or elsewhere is attacked without defender)
  const destPiece = chessAfter.get(playedMove.to);
  if (destPiece) {
    // Check if opponent can immediately capture this piece for free
    const capturesOnDest = opponentMoves.filter(m => m.to === playedMove.to);
    if (capturesOnDest.length > 0) {
      const pieceVal = PIECE_VALUES[destPiece.type];
      const capturingPieceVal = PIECE_VALUES[capturesOnDest[0].piece];
      if (pieceVal > capturingPieceVal || capturesOnDest.length > 1) {
        return 'Peça Pendurada';
      }
    }
  }

  // Check if bestMove was a winning tactic that was missed
  if (bestMove && (bestMove.captured || bestMove.san.includes('+') || bestMove.san.includes('#'))) {
    return 'Oportunidade Tática Perdida';
  }

  // Opening slow development
  const moveNumber = chessAfter.history().length;
  if (moveNumber <= 14 && (playedMove.piece === 'q' || playedMove.piece === 'k')) {
    return 'Desenvolvimento Lento';
  }

  return 'Erro Posicional';
}

/**
 * Classifies a move based on centipawn loss and quality thresholds
 */
export function analyzeMove(
  chessBefore: Chess,
  playedMove: Move,
  engineDepth: number = 3
): AnalyzedMove {
  const playerColor = chessBefore.turn();
  const isWhite = playerColor === 'w';

  // Find best move from position before
  const { move: bestMove, score: evalBefore } = findBestMove(chessBefore, engineDepth);

  // Clone chess to test played move evaluation
  const chessAfter = new Chess(chessBefore.fen());
  chessAfter.move(playedMove);
  
  // Find opponent's best response score after player's move
  const { score: evalAfter } = findBestMove(chessAfter, engineDepth);

  // Evaluate difference from player's viewpoint:
  // If player is white, eval loss is evalBefore - evalAfter
  // If player is black, eval loss is evalAfter - evalBefore (since negative is good for black)
  const evalDiff = isWhite ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

  let quality: MoveQuality = 'good';
  let qualityLabel = 'Bom';
  let blunderCategory: BlunderCategory | undefined;

  const isExactBest = bestMove && playedMove.from === bestMove.from && playedMove.to === bestMove.to;

  if (isExactBest) {
    // Check for brilliant move: sacrificed material and won position
    const isSacrifice = playedMove.captured ? false : (playedMove.piece !== 'p' && evalDiff <= 0 && evalBefore >= 100);
    if (isSacrifice && Math.abs(evalAfter) > 200) {
      quality = 'brilliant';
      qualityLabel = 'Brilhante';
    } else {
      quality = 'best';
      qualityLabel = 'Melhor Lance';
    }
  } else if (evalDiff <= 25) {
    quality = 'best';
    qualityLabel = 'Excelente';
  } else if (evalDiff <= 65) {
    quality = 'good';
    qualityLabel = 'Bom';
  } else if (evalDiff <= 140) {
    quality = 'inaccuracy';
    qualityLabel = 'Imprecisão';
    blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
  } else if (evalDiff <= 280) {
    quality = 'mistake';
    qualityLabel = 'Erro';
    blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
  } else {
    // Loss > 280 centipawns or missed mate
    if (isWhite ? evalBefore >= 300 && evalAfter < 100 : evalBefore <= -300 && evalAfter > -100) {
      quality = 'missed_win';
      qualityLabel = 'Vitória Perdida';
      blunderCategory = 'Oportunidade Tática Perdida';
    } else {
      quality = 'blunder';
      qualityLabel = 'Gafe (Capivara)';
      blunderCategory = detectBlunderCategory(chessBefore, chessAfter, playedMove, bestMove);
    }
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
    timestamp: Date.now(),
  };
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
    randomness: 0.15,
    blunderChance: 0.08,
    avatar: '♞',
    description: 'Joga com base em princípios sólidos, mas deixa escapar táticas de 2 lances.',
  },
  advanced: {
    id: 'advanced',
    name: 'Dra. Helena',
    title: 'Avançado',
    elo: 1750,
    depth: 3,
    randomness: 0.04,
    blunderChance: 0.02,
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
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Blunder chance for lower bots: pick a random move or hanging move
  if (Math.random() < config.blunderChance && moves.length > 2) {
    const nonCaptureMoves = moves.filter(m => !m.captured);
    const pool = nonCaptureMoves.length > 0 ? nonCaptureMoves : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Random suboptimal choice
  if (Math.random() < config.randomness && moves.length > 1) {
    // Pick from top 3
    moves.sort(() => Math.random() - 0.5);
    return moves[0];
  }

  const { move } = findBestMove(chess, config.depth);
  return move || moves[0];
}
