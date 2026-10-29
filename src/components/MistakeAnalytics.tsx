import React, { useState } from 'react';
import { PlayerStats, BlunderCategory } from '../types/chess';
import { API_BASE_URL } from '../utils/remoteEngine';
import { useI18n } from '../i18n';
import { 
  AlertTriangle, ShieldAlert, Zap, Target, Award, Sparkles, 
  RotateCcw, CheckCircle2, TrendingUp, HelpCircle, Activity 
} from 'lucide-react';

interface MistakeAnalyticsProps {
  playerStats: PlayerStats;
  onSelectPuzzleCategory: (category: string) => void;
  onResetStats: () => void;
}

export const MistakeAnalytics: React.FC<MistakeAnalyticsProps> = ({
  playerStats,
  onSelectPuzzleCategory,
  onResetStats,
}) => {
  const { t } = useI18n();
  const [aiReport, setAiReport] = useState<{
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const mistakeCounts = playerStats.mistakesByType || {};
  const totalMistakes = Object.values(mistakeCounts).reduce((a, b) => a + b, 0);

  const mistakeIcons: Record<string, React.ReactNode> = {
    'Peça Pendurada': <ShieldAlert className="w-4 h-4 text-rose-400" />,
    'Garfo Sofrido': <Zap className="w-4 h-4 text-amber-400" />,
    'Cravada Sofrida': <Target className="w-4 h-4 text-sky-400" />,
    'Rei Vulnerável': <AlertTriangle className="w-4 h-4 text-orange-400" />,
    'Oportunidade Tática Perdida': <Sparkles className="w-4 h-4 text-purple-400" />,
    'Desenvolvimento Lento': <Activity className="w-4 h-4 text-emerald-400" />,
  };

  const mistakeTips: Record<string, string> = {
    'Peça Pendurada': 'Antes de cada lance, confira se todas as suas peças têm defensores ativos e se o destino é seguro.',
    'Garfo Sofrido': 'Fique atento ao posicionamento de cavalos adversários e peões que possam atacar duas peças ao mesmo tempo.',
    'Cravada Sofrida': 'Desate peças cravadas antes de abrir linhas; evite alinhar sua dama ou rei na mesma linha do bispo/torre inimiga.',
    'Rei Vulnerável': 'Priorize o roque nos primeiros 10 a 12 lances para proteger seu rei e conectar as torres.',
    'Oportunidade Tática Perdida': 'Sempre calcule a trilogia forçada: Xeques, Capturas e Ameaças diretas antes de lances passivos.',
    'Desenvolvimento Lento': 'Desenvolva cavalos e bispos antes de mover a mesma peça duas vezes na abertura.',
  };

  const handleRequestAiDiagnostics = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: playerStats,
          errorCounts: mistakeCounts,
          totalGames: playerStats.gamesPlayed,
        }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Top Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">{t('Total de Partidas')}</span>
          <span className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-0.5">
            {playerStats.gamesPlayed}
          </span>
          <div className="text-[10px] text-slate-400 mt-1">
            {playerStats.gamesWon}V · {playerStats.gamesLost}D · {playerStats.gamesDrawn}E
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">{t('Gafes e Erros Registrados')}</span>
          <span className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5">
            {totalMistakes}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            {playerStats.gamesPlayed > 0
              ? `${(totalMistakes / Math.max(1, playerStats.gamesPlayed)).toFixed(1)} erros por partida`
              : 'Nenhum erro registrado'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">{t('Rating Tático')}</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
            {playerStats.tacticalRating}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            {playerStats.puzzlesSolved} exercícios resolvidos
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">{t('Melhor Sequência')}</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            {playerStats.bestStreak} 🔥
          </span>
          <span className="text-[10px] text-slate-400 mt-1">{t('Acertos consecutivos')}</span>
        </div>
      </div>

      {/* Main Grid: Mistake distribution & Diagnostic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Common Blunder Archetypes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{t('Distribuição de Erros Comuns')}</h3>
              <p className="text-xs text-slate-400">{t('Identificação automática dos padrões recorrentes no seu jogo')}</p>
            </div>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>

          {totalMistakes === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-slate-800/80">
              Jogue partidas com o treinador ativo. Suas gafes e erros táticos serão categorizados aqui automaticamente para você treinar com foco!
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(mistakeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const percent = Math.round((count / totalMistakes) * 100);
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          {mistakeIcons[category] || <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          <span>{category}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-slate-400">
                          <span>{count} ocorrências</span>
                          <span className="text-amber-400 font-semibold">{percent}%</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Targeted tip & Action */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span className="truncate max-w-[260px] text-slate-400/90">{mistakeTips[category] || ''}</span>
                        <button
                          onClick={() => onSelectPuzzleCategory(category)}
                          className="text-amber-400 hover:text-amber-300 font-medium shrink-0 ml-2 hover:underline"
                        >
                          Treinar Tática →
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right: AI Coach Diagnostics & Action Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">{t('Diagnóstico do Mestre AI')}</h3>
              </div>
              <button
                onClick={handleRequestAiDiagnostics}
                disabled={loadingAi}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                {loadingAi ? t('Gerando Plano...') : t('Atualizar Diagnóstico')}
              </button>
            </div>

            {aiReport ? (
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                  <p className="font-medium text-amber-300 mb-1">{t('Avaliação do Treinador:')}</p>
                  <p>{aiReport.summary}</p>
                </div>

                {aiReport.recommendations && (
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <p className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('Plano de Ação Recomendado:')}</span>
                    </p>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {aiReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex flex-col items-center justify-center text-center gap-2 min-h-[180px]">
                <HelpCircle className="w-6 h-6 text-slate-500" />
                <p>
                  Clique em <strong className="text-slate-300">"Atualizar Diagnóstico"</strong> para que o Grande Mestre analise suas partidas e elabore um roteiro de treino customizado.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={onResetStats}
              className="text-xs text-rose-400 hover:text-rose-300 underline"
            >
              Zerar Histórico de Erros
            </button>
          </div>
        </div>
      </div>

      {/* Recent Mistake History Log */}
      {playerStats.recentMistakes && playerStats.recentMistakes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-100">{t('Gafes Recentes Analisadas em Partida')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {playerStats.recentMistakes.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {m.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{m.date}</span>
                </div>
                <div className="text-slate-300">
                  Você jogou: <span className="font-mono font-bold text-rose-300">{m.movePlayed}</span>
                  <span className="mx-2 text-slate-500">|</span>
                  Melhor: <span className="font-mono font-bold text-emerald-400">{m.bestMove}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic">{m.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
