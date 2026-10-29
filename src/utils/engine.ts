import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { AnalyzedMove, BlunderCategory, MoveQuality, BotLevel, BotConfig } from '../types/chess';
import { getOpeningForPosition, getBookMove, OPENING_BOOK } from '../data/openings';

export { getOpeningForPosition, getBookMove, OPENING_BOOK };

// Valores padrão das peças em centipawns
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Tabelas de Posição das Peças (PST) - Perspectiva das Brancas
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

const KING_ENDGAME_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10,   0,   0, -10, -20, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -30,   0,   0,   0,   0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50
];

// Cache de Transposição
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

export const BOT_CONFIGS: Record<BotLevel, BotConfig> = {
  beginner: {
    id: 'beginner',
    name: 'Sofia Novata',
    title: 'Iniciante',
    elo: 800,
    depth: 1,
    maxQuiescenceDepth: 2,
    randomness: 0.35,
    blunderChance: 0.25,
    avatar: '♟️',
    description: 'Comete erros táticos simples e deixa peças penduradas com frequência.',
  },
  intermediate: {
    id: 'intermediate',
    name: 'Carlos Estrategista',
    title: 'Intermediário',
    elo: 1350,
    depth: 2,
    maxQuiescenceDepth: 4,
    randomness: 0.10,
    blunderChance: 0.04,
    avatar: '♞',
    description: 'Não entrega peças facilmente em trocas simples, mas falha em planos de longo prazo.',
  },
  advanced: {
    id: 'advanced',
    name: 'Dra. Helena',
    title: 'Avançado',
    elo: 1750,
    depth: 3,
    maxQuiescenceDepth: 6,
    randomness: 0.02,
    blunderChance: 0.0,
    avatar: '♜',
    description: 'Cálculo apurado de trocas táticas e forte pressão em estruturas de peões.',
  },
  master: {
    id: 'master',
    name: 'GM Mikhail',
    title: 'Mestre',
    elo: 2200,
    depth: 4,
    maxQuiescenceDepth: 8,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: '♛',
    description: 'Cálculo profundo e implacável em combinações táticas longas.',
  },
};

function isEndgame(chess: Chess): boolean {
  const board = chess.board();
  let nonPawnMaterial = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        nonPawnMaterial += PIECE_VALUES[piece.type];
      }
    }
  }
  return nonPawnMaterial <= 2600;
}

function evaluatePawnStructure(chess: Chess): number {
  const board = chess.board();
  let score = 0;

  const whitePawnsPerCol = new Array(8).fill(0);
  const blackPawnsPerCol = new Array(8).fill(0);
  const whitePawns: { r: number; c: number }[] = [];
  const blackPawns: { r: number; c: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'p') {
        if (piece.color === 'w') {
          whitePawnsPerCol[c]++;
          whitePawns.push({ r, c });
        } else {
          blackPawnsPerCol[c]++;
          blackPawns.push({ r, c });
        }
      }
    }
  }

  // 1. Peões Dobrados
  for (let c = 0; c < 8; c++) {
    if (whitePawnsPerCol[c] > 1) score -= (whitePawnsPerCol[c] - 1) * 20;
    if (blackPawnsPerCol[c] > 1) score += (blackPawnsPerCol[c] - 1) * 20;
  }

  // 2. Peões Isolados
  for (let c = 0; c < 8; c++) {
    const left = c - 1;
    const right = c + 1;

    const whiteHasAdj = (left >= 0 && whitePawnsPerCol[left] > 0) || (right < 8 && whitePawnsPerCol[right] > 0);
    if (whitePawnsPerCol[c] > 0 && !whiteHasAdj) {
      score -= 15 * whitePawnsPerCol[c];
    }

    const blackHasAdj = (left >= 0 && blackPawnsPerCol[left] > 0) || (right < 8 && blackPawnsPerCol[right] > 0);
    if (blackPawnsPerCol[c] > 0 && !blackHasAdj) {
      score += 15 * blackPawnsPerCol[c];
    }
  }

  // 3. Peões Passados
  for (const p of whitePawns) {
    let isPassed = true;
    for (let checkCol = Math.max(0, p.c - 1); checkCol <= Math.min(7, p.c + 1); checkCol++) {
      for (let checkRow = 0; checkRow < p.r; checkRow++) {
        const piece = board[checkRow][checkCol];
        if (piece && piece.color === 'b' && piece.type === 'p') {
          isPassed = false;
          break;
        }
      }
      if (!isPassed) break;
    }
    if (isPassed) {
      const rankBonus = (7 - p.r) * 15;
      score += 20 + rankBonus;
    }
  }

  for (const p of blackPawns) {
    let isPassed = true;
    for (let checkCol = Math.max(0, p.c - 1); checkCol <= Math.min(7, p.c + 1); checkCol++) {
      for (let checkRow = p.r + 1; checkRow < 8; checkRow++) {
        const piece = board[checkRow][checkCol];
        if (piece && piece.color === 'w' && piece.type === 'p') {
          isPassed = false;
          break;
        }
      }
      if (!isPassed) break;
    }
    if (isPassed) {
      const rankBonus = p.r * 15;
      score -= (20 + rankBonus);
    }
  }

  return score;
}

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
  const inEndgame = isEndgame(chess);

  let whiteBishops = 0;
  let blackBishops = 0;

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
        case 'b':
          pstVal = BISHOP_TABLE[idx];
          if (piece.color === 'w') whiteBishops++; else blackBishops++;
          break;
        case 'r': pstVal = ROOK_TABLE[idx]; break;
        case 'q': pstVal = QUEEN_TABLE[idx]; break;
        case 'k':
          pstVal = inEndgame ? KING_ENDGAME_TABLE[idx] : KING_TABLE[idx];
          break;
      }

      const totalVal = PIECE_VALUES[piece.type] + pstVal;
      score += piece.color === 'w' ? totalVal : -totalVal;
    }
  }

  if (whiteBishops >= 2) score += 50;
  if (blackBishops >= 2) score -= 50;

  score += evaluatePawnStructure(chess);

  if (chess.inCheck()) {
    score += chess.turn() === 'w' ? -35 : 35;
  }

  setCachedEval(fen, score);
  return score;
}

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

export function quiescenceSearch(
  chess: Chess,
  alpha: number,
  beta: number,
  isWhite: boolean,
  maxDepth: number = 4
): number {
  const standPat = evaluateBoard(chess);

  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  if (maxDepth <= 0 || chess.isGameOver()) {
    return standPat;
  }

  const tacticalMoves = sortMoves(
    chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion)
  );

  for (const move of tacticalMoves) {
    chess.move(move);
    const score = quiescenceSearch(chess, alpha, beta, !isWhite, maxDepth - 1);
    chess.undo();

    if (isWhite) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }

  return isWhite ? alpha : beta;
}

export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isWhite: boolean,
  maxQuiescenceDepth: number = 4
): number {
  if (chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  if (depth <= 0) {
    return quiescenceSearch(chess, alpha, beta, isWhite, maxQuiescenceDepth);
  }

  const moves = sortMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    return evaluateBoard(chess);
  }

  if (isWhite) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false, maxQuiescenceDepth);
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
      const evaluation = minimax(chess, depth - 1, alpha, beta, true, maxQuiescenceDepth);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMove(
  chess: Chess,
  depth: number = 2,
  maxQuiescenceDepth: number = 4
): { move: Move | null; score: number } {
  const cacheKey = `${chess.fen()}_d${depth}_q${maxQuiescenceDepth}`;
  const cached = getCachedBestMove(cacheKey);
  if (cached) return cached;

  const isWhite = chess.turn() === 'w';
  const moves = sortMoves(chess.moves({ verbose: true }));

  if (moves.length === 0) {
    const res = { move: null, score: evaluateBoard(chess) };
    setCachedBestMove(cacheKey, res);
    return res;
  }

  const historyLen = chess.history().length;
  if (historyLen <= 30) {
    const opening = getOpeningForPosition(chess.fen());
    if (opening && opening.moves.length > 0) {
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
    const score = minimax(chess, depth - 1, alpha, beta, !isWhite, maxQuiescenceDepth);
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

export function detectBlunderCategory(
  chessBefore: Chess,
  chessAfter: Chess,
  playedMove: Move,
  bestMove: Move | null
): BlunderCategory {
  const opponentMoves = chessAfter.moves({ verbose: true });
  const moveNumber = chessAfter.history().length;
  const playerColor = playedMove.color;

  const opponentChecks = opponentMoves.filter((m) => m.san.includes('+') || m.san.includes('#'));
  const allowsMate = opponentMoves.some((m) => m.san.includes('#'));

  if (allowsMate) {
    return 'Rei Vulnerável';
  }

  if (opponentChecks.length > 0) {
    if (playedMove.piece === 'k' && moveNumber <= 30) {
      return 'Rei Vulnerável';
    }
    if (playedMove.piece === 'p' && (playedMove.from.startsWith('f') || playedMove.from.startsWith('g'))) {
      return 'Rei Vulnerável';
    }
  }

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

  for (const oppMove of opponentMoves) {
    if (oppMove.captured && PIECE_VALUES[oppMove.captured] >= 300) {
      return 'Peça Pendurada';
    }
  }

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

  if (bestMove && (bestMove.captured || bestMove.san.includes('+') || bestMove.san.includes('#'))) {
    return 'Oportunidade Tática Perdida';
  }

  if (moveNumber <= 12 && (playedMove.piece === 'q' || playedMove.piece === 'k')) {
    return 'Desenvolvimento Lento';
  }

  return 'Erro Posicional';
}

export function analyzeMove(
  chessBefore: Chess,
  playedMove: Move,
  engineDepth: number = 2
): AnalyzedMove {
  const playerColor = chessBefore.turn();
  const isWhite = playerColor === 'w';

  const { move: bestMove, score: evalBefore } = findBestMove(chessBefore, engineDepth);

  const chessAfter = new Chess(chessBefore.fen());
  chessAfter.move(playedMove);
  const evalAfter = evaluateBoard(chessAfter);

  const evalDiff = isWhite ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

  let quality: MoveQuality = 'good';
  let qualityLabel = 'Bom';
  let blunderCategory: BlunderCategory | undefined;

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
    // Mantém Livro Teórico
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

export function getBotMove(chess: Chess, botLevel: BotLevel): Move | null {
  const config = BOT_CONFIGS[botLevel];
  const moves = sortMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) return null;

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

  if (Math.random() < config.blunderChance && moves.length > 2) {
    const nonCaptureMoves = moves.filter((m) => !m.captured);
    const pool = nonCaptureMoves.length > 0 ? nonCaptureMoves : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (Math.random() < config.randomness && moves.length > 1) {
    const subPool = moves.slice(0, Math.min(3, moves.length));
    return subPool[Math.floor(Math.random() * subPool.length)];
  }

  const { move } = findBestMove(chess, config.depth, config.maxQuiescenceDepth);
  return move || moves[0];
}

export const PST: Record<PieceSymbol, number[]> = {
  p: PAWN_TABLE, n: KNIGHT_TABLE, b: BISHOP_TABLE, r: ROOK_TABLE, q: QUEEN_TABLE, k: KING_TABLE,
};
