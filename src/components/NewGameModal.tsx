import React, { useState } from 'react';
import { BotLevel, TimeControl, PieceSet } from '../types/chess';
import { BOT_CONFIGS } from '../utils/engine';
import { TIME_CONTROLS, DEFAULT_TIME_CONTROL } from '../data/timeControls';
import { ChessPiece } from './ChessPiece';
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
  }) => void;
  currentBotLevel: BotLevel;
  currentTimeControl: TimeControl;
  currentPieceSet?: PieceSet;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentBotLevel,
  currentTimeControl,
  currentPieceSet = 'cburnett',
}) => {
  const [selectedBot, setSelectedBot] = useState<BotLevel>(currentBotLevel);
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('w');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(currentTimeControl || DEFAULT_TIME_CONTROL);
  const [selectedPieceSet, setSelectedPieceSet] = useState<PieceSet>(currentPieceSet);
  const [coachInterruption, setCoachInterruption] = useState(true);
  const [showEvalBar, setShowEvalBar] = useState(true);

  if (!isOpen) return null;

  const handleStart = () => {
    let finalColor: 'w' | 'b' = selectedColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : selectedColor;
    onStartGame({
      botLevel: selectedBot,
      playerColor: finalColor,
      coachInterruption,
      showEvalBar,
      timeControl: selectedTimeControl,
      pieceSet: selectedPieceSet,
    });
    onClose();
  };

  const botList: BotLevel[] = ['beginner', 'intermediate', 'advanced', 'master'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Configurar Partida com Treinador</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Time Control Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Controle de Tempo (Relógio):</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {selectedTimeControl.description}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {TIME_CONTROLS.map((tc) => {
              const isSelected = selectedTimeControl.id === tc.id;
              let icon = <Timer className="w-3 h-3 text-emerald-400" />;
              if (tc.type === 'bullet') icon = <Zap className="w-3 h-3 text-amber-400" />;
              if (tc.type === 'blitz') icon = <Flame className="w-3 h-3 text-orange-400" />;
              if (tc.type === 'unlimited') icon = <Infinity className="w-3 h-3 text-sky-400" />;

              return (
                <button
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc)}
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
                  <span className="text-[10px] text-slate-400 capitalize">{tc.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bot Level Selection */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">Escolha seu Oponente de Treino:</label>
          <div className="grid grid-cols-2 gap-2">
            {botList.map((lvl) => {
              const cfg = BOT_CONFIGS[lvl];
              const isSelected = selectedBot === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedBot(lvl)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-xs ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{cfg.avatar}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{cfg.elo} Elo</span>
                  </div>
                  <div className="font-semibold text-xs text-slate-100">{cfg.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{cfg.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Choice */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">Suas Peças:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedColor('w')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'w'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400" />
              <span>Brancas</span>
            </button>

            <button
              onClick={() => setSelectedColor('b')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'b'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-600" />
              <span>Pretas</span>
            </button>

            <button
              onClick={() => setSelectedColor('random')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'random'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🎲 Aleatório</span>
            </button>
          </div>
        </div>

        {/* Piece Set Selection: cburnett vs Modern */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Estilo Visual das Peças:</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">
              {selectedPieceSet === 'modern' ? 'Modern' : 'cburnett'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPieceSet('cburnett')}
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
                <span className="text-[10px] text-slate-400">Padrão de torneio clássico</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPieceSet('modern')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                selectedPieceSet === 'modern'
                  ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="w-9 h-9 shrink-0 flex items-center justify-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                <ChessPiece type="n" color="w" set="modern" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-100">Modern-Minimalist</span>
                <span className="text-[10px] text-slate-400">Vetoriais limpas, sem bordas</span>
              </div>
            </button>
          </div>
        </div>

        {/* Coach Settings */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">Assistência do Treinador:</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={coachInterruption}
                onChange={(e) => setCoachInterruption(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>Feedback Imediato ao Cometer Gafes / Peças Penduradas</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showEvalBar}
                onChange={(e) => setShowEvalBar(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>Exibir Barra de Avaliação em Tempo Real</span>
            </label>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
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
