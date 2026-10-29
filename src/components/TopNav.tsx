import React from 'react';
import { Crown, Languages } from 'lucide-react';
import { PieceSet, BoardTheme } from '../types/chess';
import { useI18n } from '../i18n';

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
  currentTab, onSelectTab, onNewGame, boardTheme, onSelectTheme, pieceSet, onSelectPieceSet,
}) => {
  const { language, setLanguage, t } = useI18n();
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-3">
        <button onClick={() => onSelectTab('game')} className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group" aria-label="XadrezMestre">
          <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform"><Crown className="w-4 h-4" /></span>
          <span className="text-base font-bold tracking-tight text-slate-100">Xadrez<span className="text-amber-400">Mestre</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
          {([
            ['game', 'Treino em Partida'],
            ['tactics', 'Exercícios Táticos'],
            ['analytics', 'Diagnóstico de Erros'],
            ['principles', 'Conceitos & Princípios'],
          ] as [NavTab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => onSelectTab(tab)} className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 py-1 border-b-2 ${currentTab === tab ? 'text-amber-400 border-amber-400 font-semibold' : 'border-transparent'}`}>
              {t(label)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-slate-400" title={t('Idioma')}>
            <Languages className="w-4 h-4" />
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'pt-BR' | 'en')} aria-label={t('Idioma')} className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500">
              <option value="pt-BR">PT-BR</option>
              <option value="en">EN</option>
            </select>
          </label>
          <select value={pieceSet} onChange={(e) => onSelectPieceSet(e.target.value as PieceSet)} aria-label={t('Conjunto de Peças')} className="text-xs bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs hidden sm:block" title={t('Escolha o estilo das peças')}>
            <option value="staunty">{t('Peças')}: Staunty</option><option value="cburnett">{t('Peças')}: Cburnett</option><option value="merida">{t('Peças')}: Merida</option><option value="alpha">{t('Peças')}: Alpha</option>
          </select>
          <select value={boardTheme} onChange={(e) => onSelectTheme(e.target.value as BoardTheme)} aria-label={t('Tema do Tabuleiro')} className="text-xs bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs hidden sm:block" title={t('Escolha as cores do tabuleiro')}>
            <option value="emerald">{t('Tab')}: {t('Verde Torneio')}</option><option value="wood">{t('Tab')}: {t('Madeira Nogueira')}</option><option value="tournament">{t('Tab')}: {t('Azul & Gelo')}</option><option value="marble">{t('Tab')}: {t('Mármore Escuro')}</option>
          </select>
          <button onClick={onNewGame} className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-95">{t('Nova Partida')}</button>
        </div>
      </div>
      <div className="flex md:hidden items-center justify-around border-t border-slate-800/80 px-2 py-1 bg-slate-950">
        {([['game','Partida'],['tactics','Táticas'],['analytics','Erros'],['principles','Dicas']] as [NavTab,string][]).map(([tab,label]) => (
          <button key={tab} onClick={() => onSelectTab(tab)} className={`text-[11px] py-1 px-2 ${currentTab === tab ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>{t(label)}</button>
        ))}
      </div>
    </header>
  );
};
