import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'pt-BR' | 'en';
type TranslationContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

const translations: Record<string, string> = {
  'Treino em Partida': 'Game Training',
  'Exercícios Táticos': 'Tactical Puzzles',
  'Análise de Erros': 'Mistake Analysis',
  'Princípios do Xadrez': 'Chess Principles',
  'Nova Partida': 'New Game',
  'Idioma': 'Language',
  'Português (Brasil)': 'Portuguese (Brazil)',
  'Inglês': 'English',
  'Trocar Bot': 'Change Bot',
  'Configurar Partida com Treinador': 'Configure Training Game',
  'Fechar modal': 'Close dialog',
  'Controle de Tempo (Relógio):': 'Time Control:',
  'Escolha seu Oponente de Treino:': 'Choose Your Training Opponent:',
  'Profundidade tática (maxQuiescenceDepth)': 'Tactical Search Depth (maxQuiescenceDepth)',
  'Mais fácil / rápido': 'Easier / faster',
  'Mais difícil / tático': 'Harder / more tactical',
  'Ajusta a busca tática adicional. O motor interno respeita este limite; com Stockfish remoto, o valor também ajusta o nível de força solicitado, enquanto o Stockfish controla sua própria busca quiescente.': 'Adjusts additional tactical search. The built-in engine respects this limit; with remote Stockfish, this value also adjusts the requested strength level, while Stockfish controls its own quiescence search.',
  'Suas Peças:': 'Your Pieces:',
  'Brancas': 'White',
  'Pretas': 'Black',
  '🎲 Aleatório': '🎲 Random',
  'Estilo Visual das Peças:': 'Piece Style:',
  'Clássico': 'Classic',
  'Tradicional': 'Traditional',
  'Padrão de torneio clássico': 'Classic tournament standard',
  'Estilo moderno estilizado': 'Modern stylized look',
  'Assistência do Treinador:': 'Coach Assistance:',
  'Feedback Imediato ao Cometer Gafes / Peças Penduradas': 'Immediate feedback on blunders / hanging pieces',
  'Exibir Barra de Avaliação em Tempo Real': 'Show live evaluation bar',
  'Cancelar': 'Cancel',
  'Iniciar Treinamento': 'Start Training',
  'Treinador em Tempo Real Ativo': 'Real-Time Coach Active',
  'Jogue seus lances no tabuleiro. O treinador alertará imediatamente sobre gafes, peças penduradas e oportunidades táticas!': 'Play your moves on the board. The coach will immediately alert you to blunders, hanging pieces, and tactical opportunities!',
  'Mostrar Melhor Lance': 'Show Best Move',
  'Desfazer Lance': 'Undo Move',
  'Livro Teórico de Aberturas': 'Theoretical Opening Book',
  'Fase de Meio-Jogo / Fim da Teoria': 'Middlegame / Beyond Opening Theory',
  'Motor de Cálculo Ativo': 'Calculation Engine Active',
  'Linha Teórica': 'Theoretical Line',
  'Plano:': 'Plan:',
  'Total de Partidas': 'Total Games',
  'Gafes e Erros Registrados': 'Blunders and Mistakes Recorded',
  'Rating Tático': 'Tactical Rating',
  'exercícios resolvidos': 'puzzles solved',
  'Melhor Sequência': 'Best Streak',
  'Acertos consecutivos': 'Consecutive correct answers',
  'Distribuição de Erros Comuns': 'Common Mistake Distribution',
  'Identificação automática dos padrões recorrentes no seu jogo': 'Automatic identification of recurring patterns in your games',
  'Jogue partidas com o treinador ativo. Suas gafes e erros táticos serão categorizados aqui automaticamente para você treinar com foco!': 'Play games with the coach enabled. Your blunders and tactical mistakes will be categorized here automatically so you can focus your training!',
  'Treinar Tática →': 'Practice Tactics →',
  'Diagnóstico do Mestre AI': 'AI Master Diagnosis',
  'Gerando Plano...': 'Generating Plan...',
  'Atualizar Diagnóstico': 'Refresh Diagnosis',
  'Avaliação do Treinador:': 'Coach Assessment:',
  'Plano de Ação Recomendado:': 'Recommended Action Plan:',
  'Clique em': 'Click',
  ' para que o Grande Mestre analise suas partidas e elabore um roteiro de treino customizado.': ' so the Grandmaster can analyze your games and create a customized training plan.',
  'Zerar Histórico de Erros': 'Reset Mistake History',
  'Gafes Recentes Analisadas em Partida': 'Recent In-Game Blunders Analyzed',
  'Você jogou:': 'You played:',
  'Melhor:': 'Best:',
  'Manual do Enxadrista: Dicas & Conceitos Mestres': 'Chess Player Manual: Tips & Master Concepts',
  'Guia prático para eliminar os erros mais frequentes e acelerar seu progresso no xadrez.': 'A practical guide to eliminate common mistakes and accelerate your chess progress.',
  'Praticar Este Tema': 'Practice This Topic',
  '💡 Conselho Chave:': '💡 Key Advice:',
  'Calculando variantes...': 'Calculating variations...',
  'O computador está avaliando continuations possíveis.': 'The computer is evaluating possible continuations.',
  'Variantes consideradas': 'Candidate lines',
  'Motor': 'Engine',
  'Profundidade': 'Depth',
  'Avaliação': 'Evaluation',
};

const I18nContext = createContext<TranslationContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('xadrez_language');
      if (saved === 'en' || saved === 'pt-BR') return saved;
      return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
    } catch {
      return 'pt-BR';
    }
  });

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem('xadrez_language', next); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'pt-BR' ? 'pt-BR' : 'en';
  }, [language]);

  const t = useCallback((text: string) => language === 'pt-BR' ? text : (translations[text] || text), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
