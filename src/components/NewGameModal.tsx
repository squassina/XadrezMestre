import React, { useState, useEffect, useRef } from 'react';
import { BotLevel, TimeControl, PieceSet } from '../types/chess';
import { BOT_CONFIGS } from '../utils/engine';
import { TIME_CONTROLS, DEFAULT_TIME_CONTROL } from '../data/timeControls';
import { ChessPiece } from './ChessPiece';
import { useI18n } from '../i18n';
import { Sparkles, X, Clock, Zap, Flame, Timer, Infinity, Palette } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (options: {
    botLevel: BotLevel;
    playerColor: 'w' | 'b';
    coachInterruption: boolean;
    showEvalBar: boolean;
    timeControl: TimeControl;
    pieceSet?: PieceSet;
    maxQuiescenceDepth: number;
  }) => void;
  currentBotLevel: BotLevel;
  currentTimeControl: TimeControl;
  currentPieceSet?: PieceSet;
  mode?: 'full' | 'bot';
  currentPlayerColor?: 'w' | 'b';
  currentCoachInterruption?: boolean;
  currentShowEvalBar?: boolean;
  currentMaxQuiescenceDepth?: number;
  gameInProgress?: boolean;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentBotLevel,
  currentTimeControl,
  currentPieceSet = 'cburnett',
  mode = 'full',
  currentPlayerColor = 'w',
  currentCoachInterruption = true,
  currentShowEvalBar = true,
  currentMaxQuiescenceDepth = 6,
  gameInProgress = false,
}) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedBot, setSelectedBot] = useState<BotLevel>(currentBotLevel);
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>(currentPlayerColor);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(
    currentTimeControl || DEFAULT_TIME_CONTROL
  );
  const [selectedPieceSet, setSelectedPieceSet] = useState<PieceSet>(currentPieceSet);
  const [coachInterruption, setCoachInterruption] = useState(currentCoachInterruption);
  const [showEvalBar, setShowEvalBar] = useState(currentShowEvalBar);
  const [maxQuiescenceDepth, setMaxQuiescenceDepth] = useState(currentMaxQuiescenceDepth);

  // Sincroniza o estado interno com as props ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setSelectedBot(currentBotLevel);
      setSelectedColor(currentPlayerColor);
      setCoachInterruption(currentCoachInterruption);
      setShowEvalBar(currentShowEvalBar);
      setMaxQuiescenceDepth(currentMaxQuiescenceDepth);
      setSelectedTimeControl(currentTimeControl || DEFAULT_TIME_CONTROL);
      setSelectedPieceSet(currentPieceSet || 'cburnett');
    }
  }, [isOpen, currentBotLevel, currentTimeControl, currentPieceSet, currentPlayerColor, currentCoachInterruption, currentShowEvalBar, currentMaxQuiescenceDepth]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.querySelector<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')?.focus();
    }
  }, [isOpen, mode]);

  // Manipulador da tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Manipulador de clique no backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleStart = () => {
    if (gameInProgress && !window.confirm(t('Iniciar outra partida descartará a partida atual e seu histórico. Deseja continuar?'))) {
      return;
    }
    const finalColor: 'w' | 'b' = mode === 'bot'
      ? currentPlayerColor
      : selectedColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : selectedColor;
    onStartGame({
      botLevel: selectedBot,
      playerColor: finalColor,
      coachInterruption: mode === 'bot' ? currentCoachInterruption : coachInterruption,
      showEvalBar: mode === 'bot' ? currentShowEvalBar : showEvalBar,
      timeControl: mode === 'bot' ? currentTimeControl : selectedTimeControl,
      pieceSet: mode === 'bot' ? currentPieceSet : selectedPieceSet,
      maxQuiescenceDepth,
    });
    onClose();
  };

  const botList: BotLevel[] = ['beginner', 'intermediate', 'advanced', 'master'];

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-game-modal-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 text-slate-100 my-8 max-h-[90vh] overflow-y-auto cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 id="new-game-modal-title" className="text-base font-bold">{mode === 'bot' ? t('Trocar Bot') : t('Configurar Partida com Treinador')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label={t('Fechar modal')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'full' && (
          <>
        {/* Time Control Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Controle de Tempo (Relógio):')}</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {t(selectedTimeControl.description)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {TIME_CONTROLS.map((tc) => {
              const isSelected = selectedTimeControl.id === tc.id;
              let icon = <Timer className="w-3 h-3 text-emerald-400" />;
              if (tc.type === 'bullet') icon = <Zap className="w-3 h-3 text-amber-400" />;
              if (tc.type === 'blitz') icon = <Flame className="w-3 h-3 text-orange-400" />;
              if (tc.type === 'unlimited') icon = <Infinity className="w-3 h-3 text-sky-400" />;

              return (
                <button
                  type="button"
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc)}
                  aria-pressed={isSelected}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {icon}
                    <span className="font-mono font-bold text-xs">{tc.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">{t(tc.type)}</span>
                </button>
              );
            })}
          </div>
        </div>

          </>
        )}

        {/* Bot Level Selection */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">{t('Escolha seu Oponente de Treino:')}</label>
          <div className="grid grid-cols-2 gap-2">
            {botList.map((lvl) => {
              const cfg = BOT_CONFIGS[lvl];
              const isSelected = selectedBot === lvl;
              return (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setSelectedBot(lvl)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{cfg.avatar}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{cfg.elo} Elo</span>
                  </div>
                  <div className="font-semibold text-xs text-slate-100">{t(cfg.name)}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{t(cfg.description)}</div>
                </button>
              );
            })}
          </div>
        </div>


        {/* Tuning of tactical search */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="quiescence-depth" className="text-xs font-semibold text-slate-300">
              {t('Profundidade tática (maxQuiescenceDepth)')}
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">{maxQuiescenceDepth}</span>
          </div>
          <input
            id="quiescence-depth"
            type="range"
            min={1}
            max={12}
            step={1}
            value={maxQuiescenceDepth}
            onChange={(e) => setMaxQuiescenceDepth(Number(e.target.value))}
            className="w-full accent-amber-500"
            aria-describedby="quiescence-depth-help"
          />
          <div className="flex justify-between text-[10px] text-slate-500"><span>{t('Mais fácil / rápido')}</span><span>{t('Mais difícil / tático')}</span></div>
          <p id="quiescence-depth-help" className="text-[11px] text-slate-400 leading-relaxed">
            {t('Ajusta a busca tática adicional. O motor interno respeita este limite; com Stockfish remoto, o valor também ajusta o nível de força solicitado, enquanto o Stockfish controla sua própria busca quiescente.')}
          </p>
        </div>

        {mode === 'full' && (
          <>
        {/* Color Choice */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">{t('Suas Peças:')}</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedColor('w')}
              aria-pressed={selectedColor === 'w'}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'w'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400" />
              <span>{t('Brancas')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedColor('b')}
              aria-pressed={selectedColor === 'b'}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'b'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-600" />
              <span>{t('Pretas')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedColor('random')}
              aria-pressed={selectedColor === 'random'}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'random'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{t('🎲 Aleatório')}</span>
            </button>
          </div>
        </div>

          </>
        )}

        {mode === 'full' && (
          <>
        {/* Piece Set Selection */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Estilo Visual das Peças:')}</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">
              {{ staunty: 'Staunty', cburnett: 'Cburnett', merida: 'Merida', alpha: 'Alpha' }[selectedPieceSet]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSelectedPieceSet('staunty')} aria-pressed={selectedPieceSet === 'staunty'} className={`p-2.5 rounded-xl border text-left flex items-center gap-3 ${selectedPieceSet === 'staunty' ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-300'}`}>
              <div className="w-9 h-9 shrink-0 flex items-center justify-center p-0.5 bg-slate-900 rounded-lg border border-slate-800"><ChessPiece type="n" color="w" set="staunty" /></div>
              <div className="flex flex-col"><span className="text-xs font-bold text-slate-100">Staunty</span><span className="text-[10px] text-slate-400">{t('Clássico')}</span></div>
            </button>
            <button type="button" onClick={() => setSelectedPieceSet('merida')} aria-pressed={selectedPieceSet === 'merida'} className={`p-2.5 rounded-xl border text-left flex items-center gap-3 ${selectedPieceSet === 'merida' ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-300'}`}>
              <div className="w-9 h-9 shrink-0 flex items-center justify-center p-0.5 bg-slate-900 rounded-lg border border-slate-800"><ChessPiece type="n" color="w" set="merida" /></div>
              <div className="flex flex-col"><span className="text-xs font-bold text-slate-100">Merida</span><span className="text-[10px] text-slate-400">{t('Tradicional')}</span></div>
            </button>
            <button type="button" onClick={() => setSelectedPieceSet('cburnett')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                selectedPieceSet === 'cburnett'
                  ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="w-9 h-9 shrink-0 flex items-center justify-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                <ChessPiece type="n" color="w" set="cburnett" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-100">cburnett</span>
                <span className="text-[10px] text-slate-400">{t('Padrão de torneio clássico')}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPieceSet('alpha')}
              aria-pressed={selectedPieceSet === 'alpha'}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                selectedPieceSet === 'alpha'
                  ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="w-9 h-9 shrink-0 flex items-center justify-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                <ChessPiece type="n" color="w" set="alpha" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-100">Alpha</span>
                <span className="text-[10px] text-slate-400">{t('Estilo moderno estilizado')}</span>
              </div>
            </button>
          </div>
        </div>

          </>
        )}

        {mode === 'full' && (
          <>
        {/* Coach Settings */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">{t('Assistência do Treinador:')}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={coachInterruption}
                onChange={(e) => setCoachInterruption(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>{t('Feedback Imediato ao Cometer Gafes / Peças Penduradas')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showEvalBar}
                onChange={(e) => setShowEvalBar(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>{t('Exibir Barra de Avaliação em Tempo Real')}</span>
            </label>
          </div>
        </div>

          </>
        )}

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Iniciar Treinamento
          </button>
        </div>
      </div>
    </div>
  );
};
