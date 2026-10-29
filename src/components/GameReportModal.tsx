import React, { useMemo, useState } from 'react';
import { AnalyzedMove, TimeControl, MoveQuality } from '../types/chess';
import { 
  Trophy, AlertTriangle, Sparkles, TrendingUp, ArrowRight, 
  RotateCcw, CheckCircle2, XCircle, Clock, Zap, Target, X, ChevronRight 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';

interface GameReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moves: AnalyzedMove[];
  playerColor: 'w' | 'b';
  botName: string;
  botElo: number;
  timeControl?: string | TimeControl;
  gameOverMessage?: string;
  winner?: 'player' | 'bot' | 'draw';
  onReviewMove?: (moveIndex: number) => void;
  onNewGame?: () => void;
  onPracticeTactics?: () => void;
}

interface ChartPoint {
  index: number;
  moveNumber: number;
  san: string;
  player: string;
  isPlayerMove: boolean;
  evalPawns: number;
  evalBeforePawns: number;
  evalDiffPawns: number;
  quality: MoveQuality;
  qualityLabel: string;
  blunderCategory?: string;
  bestMoveSan?: string;
  isSignificantSwing: boolean;
}

export const GameReportModal: React.FC<GameReportModalProps> = ({
  isOpen,
  onClose,
  moves,
  playerColor,
  botName,
  botElo,
  timeControl,
  gameOverMessage,
  winner,
  onReviewMove,
  onNewGame,
  onPracticeTactics,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Compute accuracies and stats using standard Win-Probability Loss method
  const {
    chartData,
    playerAccuracy,
    botAccuracy,
    playerCount,
    botCount,
    playerBreakdown,
    botBreakdown,
    significantSwings,
  } = useMemo(() => {
    let playerLossSum = 0;
    let playerCount = 0;
    let botLossSum = 0;
    let botCount = 0;

    const pBreakdown: Record<MoveQuality, number> = {
      brilliant: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    };
    const bBreakdown: Record<MoveQuality, number> = {
      brilliant: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    };

    const swings: ChartPoint[] = [];

    // Helper: convert centipawns to win percentage (0 to 1) from White's perspective
    const winProb = (cp: number) => 1 / (1 + Math.pow(10, -cp / 400));

    const points: ChartPoint[] = moves.map((m, idx) => {
      const isPlayer = m.color === playerColor;
      const isWhite = m.color === 'w';

      // Win probability loss
      const wpBefore = winProb(m.evalBefore);
      const wpAfter = winProb(m.evalAfter);
      const wpLoss = isWhite
        ? Math.max(0, wpBefore - wpAfter)
        : Math.max(0, (1 - wpBefore) - (1 - wpAfter));

      const moveAccuracy = Math.max(0, Math.min(100, 100 * Math.exp(-4 * wpLoss)));

      if (isPlayer) {
        playerLossSum += moveAccuracy;
        playerCount++;
        pBreakdown[m.quality] = (pBreakdown[m.quality] || 0) + 1;
      } else {
        botLossSum += moveAccuracy;
        botCount++;
        bBreakdown[m.quality] = (bBreakdown[m.quality] || 0) + 1;
      }

      // Evaluation in pawns clamped to [-10, 10] for clean charts
      const evalPawns = Math.max(-10, Math.min(10, Number((m.evalAfter / 100).toFixed(2))));
      const evalBeforePawns = Math.max(-10, Math.min(10, Number((m.evalBefore / 100).toFixed(2))));
      const evalDiffPawns = Math.abs(Number((m.evalDiff / 100).toFixed(2)));

      // Significant swing: evaluation changed by >= 1.5 pawns or blunder/missed win
      const isSignificantSwing =
        evalDiffPawns >= 1.5 || m.quality === 'blunder' || m.quality === 'missed_win';

      const point: ChartPoint = {
        index: idx,
        moveNumber: m.moveNumber,
        san: m.san,
        player: isPlayer ? 'Você' : botName,
        isPlayerMove: isPlayer,
        evalPawns,
        evalBeforePawns,
        evalDiffPawns,
        quality: m.quality,
        qualityLabel: m.qualityLabel,
        blunderCategory: m.blunderCategory,
        bestMoveSan: m.bestMoveSan,
        isSignificantSwing,
      };

      if (isSignificantSwing) {
        swings.push(point);
      }

      return point;
    });

    // Sort swings by impact (biggest blunder/swings first)
    swings.sort((a, b) => b.evalDiffPawns - a.evalDiffPawns);

    const pAcc = playerCount > 0 ? Math.round(playerLossSum / playerCount) : 80;
    const bAcc = botCount > 0 ? Math.round(botLossSum / botCount) : 80;

    return {
      chartData: points,
      playerAccuracy: pAcc,
      botAccuracy: bAcc,
      playerCount,
      botCount,
      playerBreakdown: pBreakdown,
      botBreakdown: bBreakdown,
      significantSwings: swings.slice(0, 4), // top 4 swings
    };
  }, [moves, playerColor, botName]);

  if (!isOpen) return null;

  const isPlayerWin = winner === 'player';
  const isDraw = winner === 'draw';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              isPlayerWin
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isDraw
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isPlayerWin ? <Trophy className="w-6 h-6" /> : isDraw ? <Sparkles className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Relatório de Análise da Partida
                </h2>
                {timeControl && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {typeof timeControl === 'string' ? timeControl : timeControl.name}
                  </span>
                )}
              </div>
              {gameOverMessage && <p className="text-xs text-slate-400 mt-0.5">{gameOverMessage}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accuracy Comparison Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Player Accuracy Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Sua Precisão</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                  {playerAccuracy}%
                </span>
                <span className="text-xs text-slate-400">
                  {playerAccuracy >= 85 ? '🌟 Nível Mestre' : playerAccuracy >= 70 ? '👍 Bom Desempenho' : '⚡ Oportunidade de Melhora'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Você jogou com as {playerColor === 'w' ? 'Brancas' : 'Pretas'}
              </p>
            </div>

            <div className="w-16 h-16 rounded-full border-4 border-amber-400/40 border-t-amber-400 flex items-center justify-center font-mono font-bold text-sm text-amber-300 bg-amber-950/30">
              {playerAccuracy}%
            </div>
          </div>

          {/* Bot Accuracy Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Precisão do Oponente</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold font-mono text-slate-300 tabular-nums">
                  {botAccuracy}%
                </span>
                <span className="text-xs text-slate-400">
                  {botName} ({botElo} Elo)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {botCount} lances calculados pelo motor
              </p>
            </div>

            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-slate-300 flex items-center justify-center font-mono font-bold text-sm text-slate-300 bg-slate-900">
              {botAccuracy}%
            </div>
          </div>
        </div>

        {/* Move Quality Comparison Table */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Classificação dos Lances</span>
            <span className="text-[11px] text-slate-400">Você vs {botName}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40">
              <span className="text-[11px] text-cyan-400 block font-bold">!! Brilhantes</span>
              <span className="font-mono font-bold text-slate-100">{playerBreakdown.brilliant}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.brilliant}</span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
              <span className="text-[11px] text-emerald-400 block font-bold">! Melhores</span>
              <span className="font-mono font-bold text-slate-100">{playerBreakdown.best}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.best}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-300 block font-bold">👍 Bons</span>
              <span className="font-mono font-bold text-slate-100">{playerBreakdown.good}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.good}</span>
            </div>

            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40">
              <span className="text-[11px] text-amber-400 block font-bold">?! Imprecisões</span>
              <span className="font-mono font-bold text-amber-300">{playerBreakdown.inaccuracy}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.inaccuracy}</span>
            </div>

            <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-800/40">
              <span className="text-[11px] text-orange-400 block font-bold">? Erros</span>
              <span className="font-mono font-bold text-orange-300">{playerBreakdown.mistake}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.mistake}</span>
            </div>

            <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40">
              <span className="text-[11px] text-rose-400 block font-bold">?? Gafes</span>
              <span className="font-mono font-bold text-rose-400">{playerBreakdown.blunder}</span>
              <span className="text-[10px] text-slate-400 block">vs {botBreakdown.blunder}</span>
            </div>
          </div>
        </div>

        {/* Interactive Evaluation Chart using Recharts */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200">
                Gráfico de Avaliação da Engine & Oscilações Críticas
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Gafe / Oscilação Brusca
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Erro Tático
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Valores positivos indicam vantagem das Brancas (+); negativos indicam vantagem das Pretas (-). Clique nos pontos para revisar no tabuleiro.
          </p>

          <div className="w-full h-56 pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0] && onReviewMove) {
                      const pt = e.activePayload[0].payload as ChartPoint;
                      setSelectedPointIndex(pt.index);
                      onReviewMove(pt.index);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="index"
                    tickFormatter={(val) => {
                      const pt = chartData[val];
                      return pt ? `${pt.moveNumber}` : '';
                    }}
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[-8, 8]}
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => (val > 0 ? `+${val}` : `${val}`)}
                  />

                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload as ChartPoint;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="flex items-center justify-between gap-3 font-semibold text-slate-200">
                            <span>
                              Lance {d.moveNumber}: {d.san}
                            </span>
                            <span className="font-mono text-amber-300">
                              {d.evalPawns > 0 ? `+${d.evalPawns}` : d.evalPawns}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Jogador: <strong className="text-slate-300">{d.player}</strong> ({d.qualityLabel})
                          </div>
                          {d.bestMoveSan && d.quality !== 'best' && (
                            <div className="text-[11px] text-emerald-400">
                              Melhor lance: <strong>{d.bestMoveSan}</strong>
                            </div>
                          )}
                          {d.blunderCategory && (
                            <div className="text-[10px] text-rose-400 font-medium">
                              {d.blunderCategory}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="evalPawns"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#evalGradient)"
                  />

                  {/* Highlight Significant Swings / Blunders with Dots */}
                  {significantSwings.map((swing) => (
                    <ReferenceDot
                      key={`swing-${swing.index}`}
                      x={swing.index}
                      y={swing.evalPawns}
                      r={swing.quality === 'blunder' ? 5 : 4}
                      fill={swing.quality === 'blunder' ? '#ef4444' : '#f59e0b'}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                Nenhum lance registrado para gerar o gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Significant Evaluation Swings (Turning Points) */}
        {significantSwings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Momentos Decisivos da Partida (Maiores Oscilações)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {significantSwings.map((swing) => (
                <div
                  key={`card-${swing.index}`}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span className="text-amber-400 font-mono">
                          {swing.moveNumber}. {swing.san}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                          {swing.qualityLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Por: <strong>{swing.player}</strong> · Oscilação de ±{swing.evalDiffPawns} peões
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onReviewMove?.(swing.index);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium shrink-0 flex items-center gap-1 border border-slate-700 transition-all"
                    >
                      <span>Revisar</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {swing.bestMoveSan && (
                    <div className="text-[11px] text-emerald-400/90 pt-1 border-t border-slate-800/80">
                      Lance ideal do motor: <strong className="text-emerald-300 font-mono">{swing.bestMoveSan}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onPracticeTactics?.()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span>Treinar Táticas Baseadas Nos Erros</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReviewMove?.(0);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            >
              Revisar Tabuleiro
            </button>
            <button
              onClick={() => {
                onClose();
                onNewGame?.();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Jogar Nova Partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
