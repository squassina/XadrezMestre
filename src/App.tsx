import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess, Square, PieceSymbol, Move } from 'chess.js';
import {
  AnalyzedMove, BotLevel, PlayerStats, BoardArrow, BlunderCategory, MoveQuality, TimeControl,
  PieceSet, BoardTheme
} from './types/chess';
import { analyzeMove, analyzeMoveAsync, getBotMove, evaluateBoard, detectBlunderCategory, BOT_CONFIGS } from './utils/engine';
import { botMove, analyzeMoveRemote, BOT_ENGINE, warmUp, API_BASE_URL, uciPvToSan, EngineLine } from './utils/remoteEngine';
import { soundEffects } from './utils/sound';
import { TIME_CONTROLS, DEFAULT_TIME_CONTROL } from './data/timeControls';
import { TopNav, NavTab } from './components/TopNav';
import { ChessBoard } from './components/ChessBoard';
import { ChessClock } from './components/ChessClock';
import { EvalBar } from './components/EvalBar';
import { MoveHistory } from './components/MoveHistory';
import { CoachPanel } from './components/CoachPanel';
import { OpeningBookPanel } from './components/OpeningBookPanel';
import { canUseOpeningBook, getOpeningForPosition, getBookMove } from './data/openings';
import { TacticalTrainer } from './components/TacticalTrainer';
import { MistakeAnalytics } from './components/MistakeAnalytics';
import { ChessPrinciples } from './components/ChessPrinciples';
import { NewGameModal } from './components/NewGameModal';
import { GameReportModal } from './components/GameReportModal';
import { useI18n } from './i18n';
import { useI18n } from './i18n';
import {
  RotateCcw, Sparkles, Trophy, Lightbulb, RefreshCw, Flag,
  HelpCircle, ChevronRight, User, Bot, AlertTriangle, Timer, Zap, Flame, Clock, BarChart2
} from 'lucide-react';

const STORAGE_KEY = 'xadrez_mestre_stats_v1';

const DEFAULT_STATS: PlayerStats = {
  tacticalRating: 1000,
  puzzlesSolved: 0,
  puzzlesFailed: 0,
  streak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDrawn: 0,
  mistakesByType: {
    'Peça Pendurada': 0,
    'Garfo Sofrido': 0,
    'Cravada Sofrida': 0,
    'Rei Vulnerável': 0,
    'Oportunidade Tática Perdida': 0,
    'Desenvolvimento Lento': 0,
  },
  recentMistakes: [],
};

export default function App() {\n  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<NavTab>('game');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => {
    try {
      return (localStorage.getItem('xadrez_board_theme') as BoardTheme) || 'emerald';
    } catch {
      return 'emerald';
    }
  });
  const [pieceSet, setPieceSet] = useState<PieceSet>(() => {
    try {
      return (localStorage.getItem('xadrez_piece_set') as PieceSet) || 'alpha';
    } catch {
      return 'alpha';
    }
  });

  const handleSelectTheme = (theme: BoardTheme) => {
    setBoardTheme(theme);
    try { localStorage.setItem('xadrez_board_theme', theme); } catch {}
  };

  const handleSelectPieceSet = (set: PieceSet) => {
    setPieceSet(set);
    try { localStorage.setItem('xadrez_piece_set', set); } catch {}
  };

  const [newGameModalOpen, setNewGameModalOpen] = useState(false);
  const [newGameModalMode, setNewGameModalMode] = useState<'full' | 'bot'>('full');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const botAbortRef = useRef<AbortController | null>(null);

  // Ping engine backend on mount
  useEffect(() => {
    warmUp();
  }, []);

  // Chess Game State
  const [chess, setChess] = useState<Chess>(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [botLevel, setBotLevel] = useState<BotLevel>('intermediate');
  const [maxQuiescenceDepth, setMaxQuiescenceDepth] = useState<number>(() => {
    try { return Math.max(1, Math.min(12, Number(localStorage.getItem('xadrez_max_quiescence_depth') || 6))); } catch { return 6; }
  });
  const [thinkingPlan, setThinkingPlan] = useState<{ status: 'thinking' | 'ready'; engine: string; ms?: number; lines: Array<{ multipv: number; depth: number; pv: string[]; cp?: number; mate?: number }>; source?: 'stockfish' | 'interno' | 'book' } | null>(null);
  const [coachInterruption, setCoachInterruption] = useState(true);
  const [showEvalBar, setShowEvalBar] = useState(true);

  const [moves, setMoves] = useState<AnalyzedMove[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isShowingBestMoveArrow, setIsShowingBestMoveArrow] = useState(false);
  const [isLoadingAiHelp, setIsLoadingAiHelp] = useState(false);

  // Game over state
  const [gameOver, setGameOver] = useState<{ isOver: boolean; winner?: 'player' | 'bot' | 'draw'; message?: string }>({
    isOver: false,
  });

  // Time Control & Chess Clock State
  const [timeControl, setTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [whiteTime, setWhiteTime] = useState<number>(DEFAULT_TIME_CONTROL.baseMinutes * 60 * 1000);
  const [blackTime, setBlackTime] = useState<number>(DEFAULT_TIME_CONTROL.baseMinutes * 60 * 1000);

  // Persistent Player Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STATS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerStats));
    } catch {}
  }, [playerStats]);

  const updateStats = (newPartial: Partial<PlayerStats>) => {
    setPlayerStats((prev) => ({
      ...prev,
      ...newPartial,
    }));
  };

  // Compute captured pieces and material count
  const { capturedWhite, capturedBlack, materialDiff } = useMemo(() => {
    const board = chess.board();
    type NonKingPiece = 'p' | 'n' | 'b' | 'r' | 'q';
    const counts: { w: Record<NonKingPiece, number>; b: Record<NonKingPiece, number> } = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          counts[piece.color][piece.type as NonKingPiece]++;
        }
      }
    }

    const startingPieces: Record<NonKingPiece, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const capW: PieceSymbol[] = [];
    const capB: PieceSymbol[] = [];
    const pieceTypes: NonKingPiece[] = ['p', 'n', 'b', 'r', 'q'];

    pieceTypes.forEach((type) => {
      const missingW = startingPieces[type] - counts.w[type];
      for (let i = 0; i < missingW; i++) capW.push(type);

      const missingB = startingPieces[type] - counts.b[type];
      for (let i = 0; i < missingB; i++) capB.push(type);
    });

    const values: Record<NonKingPiece, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const whiteSum = pieceTypes.reduce((s, t) => s + counts.w[t] * values[t], 0);
    const blackSum = pieceTypes.reduce((s, t) => s + counts.b[t] * values[t], 0);

    return {
      capturedWhite: capW,
      capturedBlack: capB,
      materialDiff: whiteSum - blackSum,
    };
  }, [chess.fen()]);

  // Handle Time-Out Flag Fall
  const handleTimeOut = useCallback((flaggedColor: 'w' | 'b') => {
    soundEffects.playFlagFall();
    const isPlayerFlagged = flaggedColor === playerColor;
    const winner = isPlayerFlagged ? 'bot' : 'player';


    setGameOver({
      isOver: true,
      winner,
      message: isPlayerFlagged
        ? 'Derrota por Tempo! Seu relógio esgotou.'
        : 'Vitória por Tempo! O relógio do adversário zerou.',
    });

    setPlayerStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      gamesWon: prev.gamesWon + (winner === 'player' ? 1 : 0),
      gamesLost: prev.gamesLost + (winner === 'bot' ? 1 : 0),
    }));
  }, [playerColor]);

  // Timer countdown loop
  useEffect(() => {
    if (timeControl.type === 'unlimited' || gameOver.isOver || moves.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 100) {
            handleTimeOut('w');
            return 0;
          }
          if (prev < 10000 && prev % 1000 < 100 && playerColor === 'w') {
            soundEffects.playLowTimeTick();
          }
          return prev - 100;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 100) {
            handleTimeOut('b');
            return 0;
          }
          if (prev < 10000 && prev % 1000 < 100 && playerColor === 'b') {
            soundEffects.playLowTimeTick();
          }
          return prev - 100;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeControl.type, gameOver.isOver, moves.length, chess.turn(), playerColor, handleTimeOut]);

  // Start new match
  const handleStartNewGame = ({
    botLevel: newLevel,
    playerColor: newColor,
    coachInterruption: newCoach,
    showEvalBar: newEval,
    timeControl: newTimeControl,
    pieceSet: newPieceSet,
    maxQuiescenceDepth: newMaxQuiescenceDepth,
  }: {
    botLevel: BotLevel;
    playerColor: 'w' | 'b';
    coachInterruption: boolean;
    showEvalBar: boolean;
    timeControl: TimeControl;
    pieceSet?: PieceSet;
    maxQuiescenceDepth: number;
  }) => {
    if (newPieceSet) {
      handleSelectPieceSet(newPieceSet);
    }
    const newChess = new Chess();
    setChess(newChess);
    setMoves([]);
    setHistoryIndex(-1);
    setPlayerColor(newColor);
    setBotLevel(newLevel);
    setMaxQuiescenceDepth(newMaxQuiescenceDepth);
    try { localStorage.setItem('xadrez_max_quiescence_depth', String(newMaxQuiescenceDepth)); } catch {}
    setThinkingPlan(null);
    setCoachInterruption(newCoach);
    setShowEvalBar(newEval);
    setTimeControl(newTimeControl);
    const initialMs = newTimeControl.baseMinutes * 60 * 1000;
    setWhiteTime(initialMs);
    setBlackTime(initialMs);
    setEvalScore(0);
    setArrows([]);
    setLastMove(null);
    setIsShowingBestMoveArrow(false);
    setGameOver({ isOver: false });

    // If player is black, bot makes the first move!
    if (newColor === 'b') {
      setIsBotThinking(true);
      setTimeout(() => {
        makeBotMove(newChess, newLevel, []);
      }, 500);
    }
  };

  const checkGameOverStatus = (game: Chess, lastPlayerColor: 'w' | 'b') => {
    if (game.isCheckmate()) {
      const winner = lastPlayerColor === playerColor ? 'player' : 'bot';
      soundEffects.playVictory();

      setGameOver({
        isOver: true,
        winner,
        message: winner === 'player' ? 'Vitória por Xeque-Mate! Parabéns!' : 'Derrota por Xeque-Mate. Revise seus erros com o treinador.',
      });

      // Update stats
      updateStats({
        gamesPlayed: playerStats.gamesPlayed + 1,
        gamesWon: playerStats.gamesWon + (winner === 'player' ? 1 : 0),
        gamesLost: playerStats.gamesLost + (winner === 'bot' ? 1 : 0),
      });
      return true;
    }

    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
      soundEffects.playMove();
      let reason = 'Empate';
      if (game.isStalemate()) reason = 'Empate por Afogamento';
      if (game.isThreefoldRepetition()) reason = 'Empate por Repetição Tripla';
      if (game.isInsufficientMaterial()) reason = 'Empate por Material Insuficiente';

      setGameOver({
        isOver: true,
        winner: 'draw',
        message: reason,
      });

      updateStats({
        gamesPlayed: playerStats.gamesPlayed + 1,
        gamesDrawn: playerStats.gamesDrawn + 1,
      });
      return true;
    }

    return false;
  };

  // Bot move logic with Stockfish and Opening Book integration
  const makeBotMove = useCallback((currentGame: Chess, currentBot: BotLevel, currentMoveList: AnalyzedMove[]) => {
    setIsBotThinking(true);
    setThinkingPlan({ status: 'thinking', engine: 'Stockfish', lines: [] });
    botAbortRef.current?.abort();
    const ctrl = new AbortController();
    botAbortRef.current = ctrl;

    const executeBotTurn = async () => {
      try {
        const fen = currentGame.fen();
        const legalMoves = currentGame.moves({ verbose: true });
        if (legalMoves.length === 0 || ctrl.signal.aborted) {
          setIsBotThinking(false);
          return;
        }

        // 1. Check opening book first (main lines in first 10-15 moves)
        let chosenMove: Move | null = null;
        let planLines: EngineLine[] = [];
        let planEngine = 'Livro de aberturas';
        let planMs = 0;
        const bookEntry = getOpeningForPosition(fen);
        const bookMoveObj = canUseOpeningBook(currentBot, currentGame.history().length)
          ? getBookMove(fen)
          : null;

        if (bookMoveObj) {
          const match = legalMoves.find((m) => m.san === bookMoveObj.san);
          if (match) {
            chosenMove = match;
          }
        }

        // 2. If no book move, call botMove (Stockfish API with local search fallback)
        if (!chosenMove) {
          const baseSettings = BOT_ENGINE[currentBot];
          const adjustedSettings = currentBot === 'beginner'
            ? { ...baseSettings, skill: Math.max(0, Math.min(20, (baseSettings.skill ?? 0) + (maxQuiescenceDepth - 6) * 2)), maxQuiescenceDepth }
            : { ...baseSettings, elo: Math.max(1320, Math.min(3190, (baseSettings.elo ?? BOT_CONFIGS[currentBot].elo) + (maxQuiescenceDepth - 6) * 80)), maxQuiescenceDepth };
          const remoteChoice = await botMove(fen, adjustedSettings, ctrl.signal);
          planLines = remoteChoice.lines;
          planEngine = remoteChoice.engine;
          planMs = remoteChoice.ms;
          if (ctrl.signal.aborted) return;
          const match = legalMoves.find(
            (m) => m.from === remoteChoice.from && m.to === remoteChoice.to && (m.promotion ?? '') === (remoteChoice.promotion ?? '')
          );
          chosenMove = match || legalMoves[0];
        }

        if (!chosenMove || ctrl.signal.aborted) {
          setIsBotThinking(false);
          return;
        }

        const planPv = planLines.map((line) => ({ ...line, pv: uciPvToSan(fen, line.pv).slice(0, 6) }));
        if (bookMoveObj && chosenMove && planEngine === 'Livro de aberturas') {
          planPv.unshift({ multipv: 1, depth: 0, pv: [chosenMove.san], cp: undefined, mate: undefined });
        }
        setThinkingPlan({ status: 'ready', engine: planEngine, ms: planMs, lines: planPv, source: bookMoveObj && planEngine === 'Livro de aberturas' ? 'book' : planEngine.includes('interno') ? 'interno' : 'stockfish' });

        const chessBeforeBot = new Chess(fen);
        const newGame = new Chess(fen);
        newGame.move(chosenMove);

        soundEffects.playMove();
        if (chosenMove.captured) soundEffects.playCapture();
        if (newGame.inCheck()) soundEffects.playCheck();

        // Immediate board update
        setChess(newGame);
        setLastMove({ from: chosenMove.from, to: chosenMove.to });
        setArrows([]);
        setIsShowingBestMoveArrow(false);
        setIsBotThinking(false);

        // Add increment to bot's clock
        if (timeControl.incrementSeconds > 0) {
          const botColor = playerColor === 'w' ? 'b' : 'w';
          if (botColor === 'w') {
            setWhiteTime((t) => t + timeControl.incrementSeconds * 1000);
          } else {
            setBlackTime((t) => t + timeControl.incrementSeconds * 1000);
          }
        }

        // Move Analysis for Bot
        const remoteAnalysis = await analyzeMoveRemote(fen, chosenMove.san, 10, ctrl.signal);
        let analyzed: AnalyzedMove;

        if (remoteAnalysis) {
          analyzed = {
            moveNumber: Math.ceil(newGame.history().length / 2),
            san: remoteAnalysis.playedSan,
            from: chosenMove.from,
            to: chosenMove.to,
            fen: newGame.fen(),
            color: chessBeforeBot.turn(),
            evalBefore: remoteAnalysis.cpBefore,
            evalAfter: remoteAnalysis.cpAfter,
            evalDiff: Math.round(remoteAnalysis.lossPct * 10),
            quality: remoteAnalysis.quality,
            qualityLabel: remoteAnalysis.quality === 'best' ? 'Melhor Lance' : remoteAnalysis.quality === 'good' ? 'Bom' : remoteAnalysis.quality === 'inaccuracy' ? 'Imprecisão' : remoteAnalysis.quality === 'mistake' ? 'Erro' : 'Gafe (Capivara)',
            bestMoveSan: remoteAnalysis.bestSan || remoteAnalysis.bestMove,
            bestMoveFromTo: remoteAnalysis.bestMove && remoteAnalysis.bestMove.length >= 4 ? { from: remoteAnalysis.bestMove.slice(0, 2), to: remoteAnalysis.bestMove.slice(2, 4) } : undefined,
            isBookMove: Boolean(bookMoveObj),
            openingName: bookEntry?.name,
            eco: bookEntry?.eco,
            timestamp: Date.now(),
          };
        } else {
          analyzed = await analyzeMoveAsync(chessBeforeBot, chosenMove, 2);
        }

        const newMoves = [...currentMoveList, analyzed];
        setMoves(newMoves);
        setHistoryIndex(newMoves.length - 1);
        setEvalScore(analyzed.evalAfter);
        checkGameOverStatus(newGame, newGame.turn() === 'w' ? 'b' : 'w');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error during bot move:', err);
        }
        setIsBotThinking(false);
      }
    };

    executeBotTurn();
  }, [checkGameOverStatus, playerColor, timeControl.incrementSeconds, maxQuiescenceDepth]);

  // Handle Player Move - Zero-Lag Optimistic Execution
  const handlePlayerMove = useCallback(({ from, to, promotion }: { from: Square; to: Square; promotion?: string }) => {
    if (gameOver.isOver || isBotThinking || chess.turn() !== playerColor) return;

    try {
      const chessBefore = new Chess(chess.fen());
      const newGame = new Chess(chess.fen());
      const testMove = newGame.move({ from, to, promotion: promotion || 'q' });
      if (!testMove) return;

      // 1. INSTANT UI UPDATE: piece lands immediately with 0ms lag
      setChess(newGame);
      setLastMove({ from, to });
      setArrows([]);
      setIsShowingBestMoveArrow(false);
      setThinkingPlan(null);

      // Add increment to player's clock
      if (timeControl.incrementSeconds > 0) {
        if (playerColor === 'w') {
          setWhiteTime((t) => t + timeControl.incrementSeconds * 1000);
        } else {
          setBlackTime((t) => t + timeControl.incrementSeconds * 1000);
        }
      }

      if (testMove.captured) {
        soundEffects.playCapture();
      } else if (newGame.inCheck()) {
        soundEffects.playCheck();
      } else {
        soundEffects.playMove();
      }

      // 2. NON-BLOCKING ASYNC ANALYSIS (Stockfish remote with local fallback)
      analyzeMoveRemote(chessBefore.fen(), testMove.san, 12).then(async (remoteAnalysis) => {
        let analyzed: AnalyzedMove;

        if (remoteAnalysis) {
          const quality = remoteAnalysis.quality;
          const isBook = Boolean(getOpeningForPosition(chessBefore.fen())?.moves.some((m) => m.san === testMove.san));
          const blunderCat = !isBook && (quality === 'blunder' || quality === 'mistake' || quality === 'inaccuracy')
            ? detectBlunderCategory(chessBefore, newGame, testMove, null)
            : undefined;

          analyzed = {
            moveNumber: Math.ceil(newGame.history().length / 2),
            san: remoteAnalysis.playedSan,
            from: testMove.from,
            to: testMove.to,
            fen: newGame.fen(),
            color: playerColor,
            evalBefore: remoteAnalysis.cpBefore,
            evalAfter: remoteAnalysis.cpAfter,
            evalDiff: Math.round(remoteAnalysis.lossPct * 10),
            quality,
            qualityLabel: isBook ? 'Livro Teórico' : quality === 'best' ? 'Melhor Lance' : quality === 'good' ? 'Bom' : quality === 'inaccuracy' ? 'Imprecisão' : quality === 'mistake' ? 'Erro' : 'Gafe (Capivara)',
            blunderCategory: blunderCat,
            bestMoveSan: remoteAnalysis.bestSan || remoteAnalysis.bestMove,
            bestMoveFromTo: remoteAnalysis.bestMove && remoteAnalysis.bestMove.length >= 4 ? { from: remoteAnalysis.bestMove.slice(0, 2), to: remoteAnalysis.bestMove.slice(2, 4) } : undefined,
            isBookMove: isBook,
            timestamp: Date.now(),
          };
        } else {
          analyzed = await analyzeMoveAsync(chessBefore, testMove, 2);
        }

        if (analyzed.quality === 'blunder' || analyzed.quality === 'mistake') {
          soundEffects.playBlunder();
        }

        const newMoveList = [...moves, analyzed];
        setMoves(newMoveList);
        setHistoryIndex(newMoveList.length - 1);
        setEvalScore(analyzed.evalAfter);

        // Record mistake if blunder or mistake
        if (analyzed.blunderCategory && (analyzed.quality === 'blunder' || analyzed.quality === 'mistake' || analyzed.quality === 'inaccuracy')) {
          const cat = analyzed.blunderCategory;
          const currentCount = playerStats.mistakesByType[cat] || 0;
          const newMistakeRecord = {
            id: `err-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            category: cat,
            fen: chessBefore.fen(),
            movePlayed: testMove.san,
            bestMove: analyzed.bestMoveSan || 'Melhor lance',
            explanation: `Você jogou ${testMove.san}, permitindo desvantagem tática em relação a ${analyzed.bestMoveSan}.`,
          };

          updateStats({
            mistakesByType: {
              ...playerStats.mistakesByType,
              [cat]: currentCount + 1,
            },
            recentMistakes: [newMistakeRecord, ...playerStats.recentMistakes.slice(0, 19)],
          });
        }

        // Check for Game Over
        const ended = checkGameOverStatus(newGame, playerColor);
        if (ended) return;

        // Trigger Bot response if not game over
        makeBotMove(newGame, botLevel, newMoveList);
      });
    } catch (e) {
      console.error(e);
    }
  }, [chess, playerColor, isBotThinking, gameOver.isOver, moves, botLevel, playerStats, makeBotMove, checkGameOverStatus, timeControl.incrementSeconds]);

  // Undo move and retry
  const handleUndoMove = () => {
    botAbortRef.current?.abort();
    setIsBotThinking(false);
    if (moves.length === 0) return;

    // If bot just moved, we undo 2 moves (bot move and player move)
    // If only player moved, undo 1 move
    const stepsToUndo = chess.turn() !== playerColor ? 1 : 2;
    const targetIdx = Math.max(-1, moves.length - stepsToUndo - 1);

    const replayChess = new Chess();
    for (let i = 0; i <= targetIdx; i++) {
      replayChess.move(moves[i].san);
    }

    const slicedMoves = moves.slice(0, targetIdx + 1);
    setChess(replayChess);
    setMoves(slicedMoves);
    setHistoryIndex(targetIdx);
    setArrows([]);
    setIsShowingBestMoveArrow(false);
    setLastMove(targetIdx >= 0 ? { from: slicedMoves[targetIdx].from, to: slicedMoves[targetIdx].to } : null);
    setEvalScore(evaluateBoard(replayChess));
  };

  // Show/Hide Best Move Arrow
  const handleToggleBestMoveArrow = () => {
    const currentMove = moves[historyIndex >= 0 ? historyIndex : moves.length - 1];
    if (!currentMove || !currentMove.bestMoveFromTo) return;

    if (isShowingBestMoveArrow) {
      setArrows([]);
      setIsShowingBestMoveArrow(false);
    } else {
      setArrows([
        {
          from: currentMove.bestMoveFromTo.from,
          to: currentMove.bestMoveFromTo.to,
          color: 'green',
          width: 3.2,
        },
      ]);
      setIsShowingBestMoveArrow(true);
    }
  };

  // Request AI Grandmaster Explanation from Server
  const handleRequestAiExplanation = async () => {
    const currentMove = moves[historyIndex >= 0 ? historyIndex : moves.length - 1];
    if (!currentMove) return;

    setIsLoadingAiHelp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: currentMove.fen,
          san: currentMove.san,
          bestSan: currentMove.bestMoveSan || 'Melhor lance',
          blunderCategory: currentMove.blunderCategory,
          evalDiff: currentMove.evalDiff,
          moveNumber: currentMove.moveNumber,
          userMistakeHistory: playerStats.recentMistakes.slice(0, 4),
        }),
      });

      const data = await res.json();
      if (data && data.explanation) {
        // Update move with detailed AI coach feedback
        const updatedMoves = [...moves];
        const idx = historyIndex >= 0 ? historyIndex : moves.length - 1;
        updatedMoves[idx] = {
          ...updatedMoves[idx],
          coachFeedback: data,
        };
        setMoves(updatedMoves);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAiHelp(false);
    }
  };

  // History step navigation
  const handleSelectHistoryMove = (index: number) => {
    setHistoryIndex(index);
    const replayChess = new Chess();
    for (let i = 0; i <= index; i++) {
      replayChess.move(moves[i].san);
    }
    setChess(replayChess);
    setArrows([]);
    setIsShowingBestMoveArrow(false);
    if (index >= 0) {
      setLastMove({ from: moves[index].from, to: moves[index].to });
      setEvalScore(moves[index].evalAfter);
    } else {
      setLastMove(null);
      setEvalScore(0);
    }
  };

  const currentMoveForCoach = moves[historyIndex >= 0 ? historyIndex : moves.length - 1] || null;
  const botConfig = BOT_CONFIGS[botLevel];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <TopNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onNewGame={() => { setNewGameModalMode('full'); setNewGameModalOpen(true); }}
        boardTheme={boardTheme}
        onSelectTheme={handleSelectTheme}
        pieceSet={pieceSet}
        onSelectPieceSet={handleSelectPieceSet}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'game' && (
          <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6">
            {/* Left: Eval Bar + Chessboard Container */}
            <div className="flex flex-col items-center gap-3 w-full max-w-[620px]">
              {/* Opponent Info Strip */}
              <div className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                    {botConfig.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{botConfig.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">({botConfig.elo} Elo)</span>
                      {timeControl.type !== 'unlimited' && (
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/80">
                          {timeControl.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isBotThinking ? (
                        <span className="text-amber-400 font-medium animate-pulse">{t('Calculando lance...')}</span>
                      ) : (
                        <span>{playerColor === 'w' ? 'Pretas' : 'Brancas'} · {botConfig.title}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {timeControl.type !== 'unlimited' && (
                    <ChessClock
                      timeRemainingMs={playerColor === 'w' ? blackTime : whiteTime}
                      isActive={!gameOver.isOver && moves.length > 0 && chess.turn() !== playerColor}
                      playerColor={playerColor === 'w' ? 'b' : 'w'}
                      compact={true}
                    />
                  )}
                  <button
                    onClick={() => { setNewGameModalMode('bot'); setNewGameModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    title="Trocar adversário"
                  >
                    Trocar Bot
                  </button>
                </div>
              </div>

              {/* Board and Eval Bar Row */}
              <div className="flex items-center gap-3 w-full justify-center">
                {showEvalBar && (
                  <div className="shrink-0 h-[480px] sm:h-[540px] flex items-center">
                    <EvalBar score={evalScore} isCheckmate={chess.isCheckmate()} orientation={playerColor} />
                  </div>
                )}

                <div className="flex-1 max-w-[560px]">
                  <ChessBoard
                    chess={chess}
                    orientation={playerColor}
                    onMove={handlePlayerMove}
                    interactive={!gameOver.isOver && !isBotThinking && historyIndex === moves.length - 1}
                    arrows={arrows}
                    lastMove={lastMove}
                    boardTheme={boardTheme}
                    pieceSet={pieceSet}
                  />
                </div>
              </div>


              {/* Engine thinking / principal variations */}
              <section className="w-full max-w-[560px] mx-auto rounded-xl border border-slate-800 bg-slate-900/90 p-3" aria-live="polite">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Como o computador está pensando
                  </h3>
                  {thinkingPlan?.status === 'thinking' && <span className="text-[10px] text-amber-300 animate-pulse">{t('Calculando variantes…')}</span>}
                  {thinkingPlan?.status === 'ready' && <span className="text-[10px] text-slate-500">{thinkingPlan.engine}{thinkingPlan.ms ? ' · ' + thinkingPlan.ms + ' ms' : ''}</span>}
                </div>
                {!thinkingPlan && <p className="text-[11px] text-slate-400">Quando chegar a vez do computador, mostraremos as principais linhas calculadas e alternativas consideradas.</p>}
                {thinkingPlan?.status === 'thinking' && <p className="text-[11px] text-slate-400">O motor está comparando lances candidatos, respostas e posições futuras. As variantes aparecem quando a busca terminar.</p>}
                {thinkingPlan?.status === 'ready' && thinkingPlan.lines.length === 0 && <p className="text-[11px] text-slate-400">{t('O motor não retornou variantes detalhadas para esta posição.')}</p>}
                {thinkingPlan?.status === 'ready' && thinkingPlan.lines.length > 0 && (
                  <div className="space-y-2">
                    {thinkingPlan.lines.slice(0, 3).map((line) => (
                      <div key={String(line.multipv) + '-' + line.pv.join('-')} className="rounded-lg bg-slate-950/70 border border-slate-800 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-amber-300">{line.multipv === 1 ? 'Plano principal' : 'Alternativa ' + line.multipv}</span>
                          <span className="text-[10px] text-slate-500">{line.depth ? 'Profundidade ' + line.depth : 'Livro de aberturas'}{line.mate !== undefined ? ' · mate em ' + line.mate : line.cp !== undefined ? ' · avaliação ' + (line.cp / 100).toFixed(2) + ' (lado a jogar)' : ''}</span>
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed text-slate-200 break-words">{line.pv.join(' ') || 'Variante indisponível'}</p>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-500">São variantes calculadas pelo motor, não uma explicação de intenção humana. O resultado pode mudar com mais tempo de busca ou após a resposta do jogador.</p>
                  </div>
                )}
              </section>

              {/* Player Info Strip */}
              <div className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                    VOCÊ
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">
                      Você ({playerColor === 'w' ? 'Brancas' : 'Pretas'})
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Rating Tático: {playerStats.tacticalRating} Elo
                    </div>
                  </div>
                </div>

                {/* Quick Board Actions & Player Clock */}
                <div className="flex items-center gap-2">
                  {timeControl.type !== 'unlimited' && (
                    <ChessClock
                      timeRemainingMs={playerColor === 'w' ? whiteTime : blackTime}
                      isActive={!gameOver.isOver && moves.length > 0 && chess.turn() === playerColor}
                      playerColor={playerColor}
                      compact={true}
                    />
                  )}
                  <button
                    onClick={handleUndoMove}
                    disabled={moves.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('Desfazer')}</span>
                  </button>
                  {moves.length >= 2 && (
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-medium shadow-xs transition-colors"
                      title="Gráfico de Precisão e Relatório da Partida"
                    >
                      <BarChart2 className="w-3 h-3 text-indigo-400" />
                      <span>{t('Relatório')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setPlayerColor(playerColor === 'w' ? 'b' : 'w')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    title="Girar Tabuleiro"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('Girar')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Coach Analysis & Move History Sidebar */}
            <div className="flex flex-col gap-4 w-full xl:w-[440px]">
              {/* Game Over Notice Modal / Banner */}
              {gameOver.isOver && (
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/50 shadow-xl flex flex-col gap-2.5 text-center">
                  <Trophy className="w-7 h-7 text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100">{gameOver.message}</h3>
                  <p className="text-xs text-slate-400">
                    A partida foi finalizada! Veja o gráfico de precisão lance a lance e momentos críticos.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Ver Relatório da Partida
                    </button>
                    <button
                      onClick={() => handleStartNewGame({ botLevel, playerColor, coachInterruption, showEvalBar, timeControl, maxQuiescenceDepth })}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors"
                    >
                      Jogar Novamente
                    </button>
                    <button
                      onClick={() => setActiveTab('tactics')}
                      className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      Treinar Táticas
                    </button>
                  </div>
                </div>
              )}

              {/* Immediate Coach Feedback Panel */}
              <CoachPanel
                currentMove={currentMoveForCoach}
                onUndoMove={handleUndoMove}
                onShowBestMoveArrow={handleToggleBestMoveArrow}
                isShowingBestMoveArrow={isShowingBestMoveArrow}
                onRequestDetailedAiHelp={handleRequestAiExplanation}
                isLoadingAiHelp={isLoadingAiHelp}
              />

              {/* Opening Book Library Panel (first 10-15 moves) */}
              <OpeningBookPanel
                fen={chess.fen()}
                moveCount={moves.length}
              />

              {/* Move History Panel */}
              <div className="h-[260px]">
                <MoveHistory
                  moves={moves}
                  currentMoveIndex={historyIndex}
                  onSelectMove={handleSelectHistoryMove}
                  capturedWhite={capturedWhite}
                  capturedBlack={capturedBlack}
                  materialDiff={materialDiff}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tactical Trainer */}
        {activeTab === 'tactics' && (
          <TacticalTrainer
            playerStats={playerStats}
            onUpdateStats={updateStats}
            boardTheme={boardTheme}
            pieceSet={pieceSet}
          />
        )}

        {/* Tab 3: Mistake Analytics & Diagnostics */}
        {activeTab === 'analytics' && (
          <MistakeAnalytics
            playerStats={playerStats}
            onSelectPuzzleCategory={(category) => {
              setActiveTab('tactics');
            }}
            onResetStats={() => {
              if (confirm('Deseja realmente zerar o histórico de erros e estatísticas?')) {
                setPlayerStats(DEFAULT_STATS);
              }
            }}
          />
        )}

        {/* Tab 4: Chess Principles & Concepts */}
        {activeTab === 'principles' && (
          <ChessPrinciples
            onPracticeCategory={(category) => {
              setActiveTab('tactics');
            }}
          />
        )}
      </main>

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={newGameModalOpen}
        onClose={() => setNewGameModalOpen(false)}
        onStartGame={handleStartNewGame}
        currentBotLevel={botLevel}
        currentTimeControl={timeControl}
        currentPieceSet={pieceSet}
        mode={newGameModalMode}
        currentPlayerColor={playerColor}
        currentCoachInterruption={coachInterruption}
        currentShowEvalBar={showEvalBar}
        currentMaxQuiescenceDepth={maxQuiescenceDepth}
        gameInProgress={moves.length > 0 && !gameOver.isOver}
      />

      {/* Game Precision & Analysis Report Modal */}
      <GameReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        moves={moves}
        playerColor={playerColor}
        botName={BOT_CONFIGS[botLevel].name}
        botElo={BOT_CONFIGS[botLevel].elo}
        timeControl={timeControl.name}
        gameOverMessage={gameOver.message}
        winner={gameOver.winner}
        onReviewMove={(moveIdx) => {
          handleSelectHistoryMove(moveIdx);
          setIsReportModalOpen(false);
        }}
        onNewGame={() => {
          setIsReportModalOpen(false);
          setNewGameModalOpen(true);
        }}
        onPracticeTactics={() => {
          setIsReportModalOpen(false);
          setActiveTab('tactics');
        }}
      />
    </div>
  );
}
