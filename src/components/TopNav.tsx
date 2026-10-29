import React from 'react';
import { Crown } from 'lucide-react';
import { PieceSet, BoardTheme } from '../types/chess';

export type NavTab = 'game' | 'tactics' | 'analytics' | 'principles';

interface TopNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onNewGame: () => void;
  boardTheme: BoardTheme;
  onSelectTheme: (theme: BoardTheme) => void;
  pieceSet: PieceSet;
  onSelectPieceSet: (set: PieceSet) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onNewGame,
  boardTheme,
  onSelectTheme,
  pieceSet,
  onSelectPieceSet,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onSelectTab('game')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Crown className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100">
            Xadrez<span className="text-amber-400">Mestre</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('game')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 py-1 border-b-2 ${
              currentTab === 'game' ? 'text-amber-400 border-amber-400 font-semibold' : 'border-transparent'
            }`}
          >
            Treino em Partida
          </button>
          <button
            onClick={() => onSelectTab('tactics')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 py-1 border-b-2 ${
              currentTab === 'tactics' ? 'text-amber-400 border-amber-400 font-semibold' : 'border-transparent'
            }`}
          >
            Exercícios Táticos
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 py-1 border-b-2 ${
              currentTab === 'analytics' ? 'text-amber-400 border-amber-400 font-semibold' : 'border-transparent'
            }`}
          >
            Diagnóstico de Erros
          </button>
          <button
            onClick={() => onSelectTab('principles')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 py-1 border-b-2 ${
              currentTab === 'principles' ? 'text-amber-400 border-amber-400 font-semibold' : 'border-transparent'
            }`}
          >
            Conceitos & Princípios
          </button>
        </nav>

        {/* Zone 3: Selectors & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Piece Set Selector */}
          <select
            value={pieceSet}
            onChange={(e) => onSelectPieceSet(e.target.value as PieceSet)}
            aria-label="Conjunto de Peças"
            className="text-xs bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
            title="Escolha o estilo das peças"
          >
            <option value="custom">Peças: SVGs Personalizados (Custom)</option>
            <option value="cburnett">Peças: cburnett (Padrão)</option>
            <option value="modern-minimalist">Peças: Modern-Minimalist (Clean)</option>
            <option value="staunty">Peças: Staunty (Madeira & Marfim)</option>
            <option value="merida">Peças: Merida (Clássico Europeu)</option>
            <option value="alpha">Peças: Alpha (Minimalista)</option>
          </select>

          {/* Board Theme Selector */}
          <select
            value={boardTheme}
            onChange={(e) => onSelectTheme(e.target.value as BoardTheme)}
            aria-label="Tema do Tabuleiro"
            className="text-xs bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs hidden sm:block"
            title="Escolha as cores do tabuleiro"
          >
            <option value="emerald">Tab: Verde Torneio</option>
            <option value="wood">Tab: Madeira Nogueira</option>
            <option value="tournament">Tab: Azul & Gelo</option>
            <option value="marble">Tab: Mármore Escuro</option>
          </select>

          <button
            onClick={onNewGame}
            className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-95"
          >
            Nova Partida
          </button>
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800/80 px-2 py-1 bg-slate-950">
        <button
          onClick={() => onSelectTab('game')}
          className={`text-[11px] py-1 px-2 ${currentTab === 'game' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Partida
        </button>
        <button
          onClick={() => onSelectTab('tactics')}
          className={`text-[11px] py-1 px-2 ${currentTab === 'tactics' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Táticas
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`text-[11px] py-1 px-2 ${currentTab === 'analytics' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Erros
        </button>
        <button
          onClick={() => onSelectTab('principles')}
          className={`text-[11px] py-1 px-2 ${currentTab === 'principles' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          Dicas
        </button>
      </div>
    </header>
  );
};
