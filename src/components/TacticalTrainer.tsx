import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { TacticalPuzzle, PlayerStats, BlunderCategory, BoardArrow, PieceSet, BoardTheme } from '../types/chess';
import { useI18n } from '../i18n';
import { INITIAL_PUZZLES, getPersonalizedPuzzles } from '../data/puzzles';
import { ChessBoard } from './ChessBoard';
import { soundEffects } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Trophy, Flame, Target, ArrowRight, RotateCcw, Lightbulb, CheckCircle2, XCircle,
  Sparkles, Award, ShieldAlert, Zap
} from 'lucide-react';

interface TacticalTrainerProps {
  playerStats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  boardTheme: BoardTheme;
  pieceSet?: PieceSet;
}

export const TacticalTrainer: React.FC<TacticalTrainerProps> = ({
  playerStats,
  onUpdateStats,
  boardTheme,
  pieceSet = 'staunty',
}) => {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [puzzles, setPuzzles] = useState<TacticalPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [moveStep, setMoveStep] = useState<number>(0); // which move in puzzle.moves we are at
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'solved' | 'failed'>('playing');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Initialize puzzles list based on category & player mistakes
  useEffect(() => {
    let list = getPersonalizedPuzzles(playerStats);
    if (activeCategory === 'weakness') {
      // Find player's most frequent blunder
      const counts = playerStats.mistakesByType || {};
      let topMistake: string | null = null;
      let maxC = 0;
      Object.entries(counts).forEach(([cat, val]) => {
        if (val > maxC) {
          maxC = val;
          topMistake = cat;
        }
      });
      if (topMistake) {
        list = list.filter((p) => p.category === topMistake);
      }
    } else if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (list.length === 0) {
      list = INITIAL_PUZZLES;
    }

    setPuzzles(list);
    setCurrentPuzzleIndex(0);
    loadPuzzle(list[0]);
  }, [activeCategory, playerStats.mistakesByType]);

  const loadPuzzle = (puzzle: TacticalPuzzle) => {
    if (!puzzle) return;
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setMoveStep(0);
    setPuzzleStatus('playing');
    setStatusMessage('');
    setHintUsed(false);
    setArrows([]);
    setLastMove(null);
  };

  const currentPuzzle = puzzles[currentPuzzleIndex] || INITIAL_PUZZLES[0];

  const handleMove = ({ from, to, promotion }: { from: Square; to: Square; promotion?: string }) => {
    if (puzzleStatus !== 'playing') return;

    try {
      // Clone game to test move
      const testChess = new Chess(chess.fen());
      const moveResult = testChess.move({ from, to, promotion: promotion || 'q' });
      if (!moveResult) return;

      const expectedSan = currentPuzzle.moves[moveStep];

      // Check if move matches expected SAN
      if (moveResult.san === expectedSan) {
        // Correct move!
        soundEffects.playMove();
        if (moveResult.captured) soundEffects.playCapture();

        const updatedChess = new Chess(chess.fen());
        updatedChess.move({ from, to, promotion: promotion || 'q' });
        setChess(updatedChess);
        setLastMove({ from, to });
        setArrows([]);

        const nextStep = moveStep + 1;

        if (nextStep >= currentPuzzle.moves.length) {
          // Solved!
          completePuzzleSuccess();
        } else {
          // Computer makes the intermediate response
          setMoveStep(nextStep);
          setStatusMessage(t('Muito bem! Calcule o próximo lance.'));

          setTimeout(() => {
            const botSan = currentPuzzle.moves[nextStep];
            const botMove = updatedChess.move(botSan);
            if (botMove) {
              soundEffects.playMove();
              if (botMove.captured) soundEffects.playCapture();
              setChess(new Chess(updatedChess.fen()));
              setLastMove({ from: botMove.from, to: botMove.to });
              setMoveStep(nextStep + 1);
            }
          }, 450);
        }
      } else {
        // Incorrect move
        soundEffects.playBlunder();
        setPuzzleStatus('failed');
        setStatusMessage(t('Lance ') + moveResult.san + t(' não é a melhor continuação tática. Tente novamente!'));

        // Record failure in stats
        onUpdateStats({
          puzzlesFailed: playerStats.puzzlesFailed + 1,
          streak: 0,
          tacticalRating: Math.max(400, playerStats.tacticalRating - 8),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const completePuzzleSuccess = () => {
    soundEffects.playVictory();
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#10b981', '#f59e0b', '#38bdf8', '#fbbf24'],
    });

    setPuzzleStatus('solved');
    setStatusMessage(t('Sensacional! Tática resolvida com precisão.'));

    const newStreak = playerStats.streak + 1;
    const newBestStreak = Math.max(playerStats.bestStreak, newStreak);
    const ratingGain = hintUsed ? 5 : 15;

    onUpdateStats({
      puzzlesSolved: playerStats.puzzlesSolved + 1,
      streak: newStreak,
      bestStreak: newBestStreak,
      tacticalRating: playerStats.tacticalRating + ratingGain,
    });
  };

  const handleRetry = () => {
    loadPuzzle(currentPuzzle);
  };

  const handleNextPuzzle = () => {
    const nextIdx = (currentPuzzleIndex + 1) % puzzles.length;
    setCurrentPuzzleIndex(nextIdx);
    loadPuzzle(puzzles[nextIdx]);
  };

  const handleShowHint = () => {
    setHintUsed(true);
    const expectedSan = currentPuzzle.moves[moveStep];
    setStatusMessage(t('Dica:') + ' ' + t(currentPuzzle.hint) + ' (' + t('Procure o lance') + ' ' + expectedSan.charAt(0) + ')');
  };

  const handleShowSolution = () => {
    const testChess = new Chess(currentPuzzle.fen);
    const firstMove = currentPuzzle.moves[0];
    const mv = testChess.move(firstMove);
    if (mv) {
      setArrows([
        {
          from: mv.from,
          to: mv.to,
          color: 'green',
        },
      ]);
      setStatusMessage(t('Solução recomendada:') + ' ' + currentPuzzle.moves.join(' → '));
    }
  };

  const categories = [
    { id: 'all', label: 'Todos os Temas' },
    { id: 'weakness', label: '🎯 Seus Pontos Fracos' },
    { id: 'Garfo Sofrido', label: 'Garfos' },
    { id: 'Cravada Sofrida', label: 'Cravadas' },
    { id: 'Peça Pendurada', label: t('Peças Penduradas') },
    { id: 'Rei Vulnerável', label: t('Segurança do Rei') },
    { id: 'Oportunidade Tática Perdida', label: t('Ataques Forçados') },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full max-w-6xl mx-auto">
      {/* Chessboard Area */}
      <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
        {/* Turn & Objective banner */}
        <div className="flex items-center justify-between w-full max-w-[560px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full border ${currentPuzzle.playerColor === 'w' ? 'bg-white border-slate-400' : 'bg-slate-950 border-slate-600'}`} />
            <span className="font-semibold text-slate-200">
              {t(currentPuzzle.playerColor === 'w' ? 'Brancas jogam e vencem' : 'Pretas jogam e vencem')}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-slate-400">
            <span>{t('Exercício #')}{currentPuzzleIndex + 1} {t('de')} {puzzles.length}</span>
            <span className="text-amber-400 font-semibold">{currentPuzzle.rating} Elo</span>
          </div>
        </div>

        {/* Board */}
        <ChessBoard
          chess={chess}
          orientation={currentPuzzle.playerColor}
          onMove={handleMove}
          interactive={puzzleStatus === 'playing'}
          arrows={arrows}
          lastMove={lastMove}
          boardTheme={boardTheme}
          pieceSet={pieceSet}
        />
      </div>

      {/* Control & Lesson Sidebar */}
      <div className="flex flex-col gap-4 w-full lg:w-[420px]">
        {/* Rating and Streaks Header */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 mb-0.5">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold font-mono tabular-nums">{playerStats.tacticalRating}</span>
            </div>
            <span className="text-[10px] text-slate-400">{t('Elo Tático')}</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <div className="flex items-center gap-1 text-orange-400 mb-0.5">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold font-mono tabular-nums">{playerStats.streak}</span>
            </div>
            <span className="text-[10px] text-slate-400">{t('Sequência Atual')}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-bold font-mono tabular-nums">{playerStats.puzzlesSolved}</span>
            </div>
            <span className="text-[10px] text-slate-400">{t('Resolvidos')}</span>
          </div>
        </div>

        {/* Theme Filter Selector */}
        <div className="flex flex-col gap-1.5 bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-xs font-semibold text-slate-300">{t('Filtro de Treinamento')}</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Puzzle Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-100">{t(currentPuzzle.title)}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="text-amber-300 font-medium">{t(currentPuzzle.category)}</span>
                <span aria-hidden="true">·</span>
                <span>{t(currentPuzzle.difficulty)}</span>
              </div>
            </div>

            {currentPuzzle.category === 'Garfo Sofrido' && <Zap className="w-5 h-5 text-amber-400" />}
            {currentPuzzle.category === 'Cravada Sofrida' && <Target className="w-5 h-5 text-sky-400" />}
            {currentPuzzle.category === 'Peça Pendurada' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
            {currentPuzzle.category === 'Rei Vulnerável' && <Trophy className="w-5 h-5 text-purple-400" />}
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                puzzleStatus === 'solved'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : puzzleStatus === 'failed'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                  : 'bg-amber-950/40 text-amber-200 border border-amber-800/60'
              }`}
            >
              {puzzleStatus === 'solved' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {puzzleStatus === 'failed' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {puzzleStatus === 'playing' && <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Lesson on solved */}
          {puzzleStatus === 'solved' && (
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 block mb-1">{t('Lição do Treinador:')}</strong>
              {t(currentPuzzle.lesson)}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {puzzleStatus === 'solved' ? (
              <button
                onClick={handleNextPuzzle}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                <span>{t('Próximo Exercício')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : puzzleStatus === 'failed' ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Tentar Novamente')}</span>
                </button>
                <button
                  onClick={handleShowSolution}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                >
                  {t('Ver Solução')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={handleShowHint}
                  disabled={hintUsed}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{hintUsed ? t('Dica Revelada') : t('Pedir Dica')}</span>
                </button>
                <button
                  onClick={handleShowSolution}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
                >
                  {t('Desistir & Ver')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
