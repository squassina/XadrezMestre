import React, { useState } from 'react';
import { AnalyzedMove, CoachFeedback } from '../types/chess';
import { AlertTriangle, Lightbulb, RotateCcw, Eye, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

interface CoachPanelProps {
  currentMove: AnalyzedMove | null;
  onUndoMove: () => void;
  onShowBestMoveArrow: () => void;
  isShowingBestMoveArrow: boolean;
  onRequestDetailedAiHelp?: () => void;
  isLoadingAiHelp?: boolean;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  currentMove,
  onUndoMove,
  onShowBestMoveArrow,
  isShowingBestMoveArrow,
  onRequestDetailedAiHelp,
  isLoadingAiHelp = false,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!currentMove) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-400 min-h-[170px]">
        <Sparkles className="w-8 h-8 text-amber-400/60 mb-2" />
        <h3 className="text-sm font-semibold text-slate-200">Treinador em Tempo Real Ativo</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Jogue seus lances no tabuleiro. O treinador alertará imediatamente sobre gafes, peças penduradas e oportunidades táticas!
        </p>
      </div>
    );
  }

  const isCriticalError = currentMove.quality === 'blunder' || currentMove.quality === 'mistake' || currentMove.quality === 'missed_win';
  const isInaccuracy = currentMove.quality === 'inaccuracy';
  const isPositive = currentMove.quality === 'best' || currentMove.quality === 'brilliant' || currentMove.quality === 'good';

  const badgeColor = {
    blunder: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    mistake: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    inaccuracy: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    missed_win: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    good: 'bg-slate-800 text-slate-300 border-slate-700',
    best: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    brilliant: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  }[currentMove.quality];

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      isCriticalError 
        ? 'bg-rose-950/20 border-rose-800/40 shadow-rose-950/30 shadow-lg' 
        : isInaccuracy 
        ? 'bg-amber-950/20 border-amber-800/40' 
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header: Quality & Blunder category */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {isCriticalError ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : isInaccuracy ? (
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}

          <div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${badgeColor}`}>
              {currentMove.qualityLabel}
            </span>
            {currentMove.blunderCategory && (
              <span className="ml-2 text-xs font-semibold text-slate-200">
                {currentMove.blunderCategory}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Lance {currentMove.moveNumber}: <span className="font-bold text-slate-200">{currentMove.san}</span>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="text-xs text-slate-300 leading-relaxed mb-3">
        {currentMove.coachFeedback ? (
          <div>
            <p className="font-normal">{currentMove.coachFeedback.explanation}</p>
            {currentMove.coachFeedback.proTip && (
              <div className="mt-2 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-amber-200/90 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-amber-300">Dica Prática:</strong> {currentMove.coachFeedback.proTip}</span>
              </div>
            )}
            {currentMove.coachFeedback.keyQuestionsToAsk && currentMove.coachFeedback.keyQuestionsToAsk.length > 0 && (
              <div className="mt-2 text-[11px] text-slate-400 flex items-start gap-1">
                <HelpCircle className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Checklist Mental:</strong> {currentMove.coachFeedback.keyQuestionsToAsk.join(' · ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            {isCriticalError ? (
              <p>
                O lance <span className="font-mono font-bold text-rose-300">{currentMove.san}</span> cedeu uma vantagem importante.
                {currentMove.bestMoveSan && (
                  <> O motor calculou que <span className="font-mono font-bold text-emerald-400">{currentMove.bestMoveSan}</span> era a melhor resposta.</>
                )}
              </p>
            ) : isPositive ? (
              <p>Excelente lance! Mantém pressão central e ótima coordenação de peças.</p>
            ) : (
              <p>Lance jogável, mas havia alternativas com maior dinamismo.</p>
            )}
          </div>
        )}
      </div>

      {/* Interactive Actions */}
      {isCriticalError && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={onUndoMove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Desfazer & Tentar Novamente</span>
          </button>

          {currentMove.bestMoveSan && (
            <button
              onClick={onShowBestMoveArrow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isShowingBestMoveArrow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isShowingBestMoveArrow ? 'Ocultar Seta' : `Ver Lance Ideal (${currentMove.bestMoveSan})`}</span>
            </button>
          )}

          {onRequestDetailedAiHelp && (
            <button
              onClick={onRequestDetailedAiHelp}
              disabled={isLoadingAiHelp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium ml-auto disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isLoadingAiHelp ? 'Analisando...' : 'Pedir Explicação ao Mestre AI'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
