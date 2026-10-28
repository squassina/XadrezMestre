import React from 'react';
import { ShieldCheck, Eye, Compass, Zap, Target, BookOpen, ArrowRight } from 'lucide-react';

interface ChessPrinciplesProps {
  onPracticeCategory: (category: string) => void;
}

export const ChessPrinciples: React.FC<ChessPrinciplesProps> = ({ onPracticeCategory }) => {
  const principles = [
    {
      id: 'cca',
      title: '01. A Fórmula Sagrada: C.C.A. (Xeques, Capturas, Ameaças)',
      icon: <Eye className="w-5 h-5 text-amber-400" />,
      category: 'Oportunidade Tática Perdida',
      summary: 'Em toda e qualquer jogada, antes de pensar em lances normais, examine obrigatoriamente todos os lances forçados.',
      details: [
        'Xeques: O adversário é obrigado a responder imediatamente ao rei em perigo.',
        'Capturas: Verifique trocas vantajosas ou peças que perderam defensores.',
        'Ameaças: Crie ataques diretos que obriguem o oponente a recuar ou perder material.',
      ],
      tip: 'Se você fizer esse checklist em 100% dos seus lances, seu rating subirá mais de 200 pontos em semanas.',
    },
    {
      id: 'hanging',
      title: '02. Erradicação de Peças Penduradas',
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      category: 'Peça Pendurada',
      summary: 'Peça pendurada é qualquer peça sem defensor ou cuja quantidade de atacantes é maior que a de defensores.',
      details: [
        'A Regra do Pouso: Antes de soltar a peça, olhe para a casa de destino. Alguém do oponente a controla?',
        'A Regra do Abandono: Quando você move uma peça, quem ela protegia antes ficou desamparado?',
        'Conte defensores com rigor cirúrgico (ex: 2 atacantes x 1 defensor = peça perdida).',
      ],
      tip: '85% das partidas abaixo de 1500 de rating são decididas por uma peça pendurada esquecida.',
    },
    {
      id: 'pins',
      title: '03. Cravadas: A Arma que Paralisa o Adversário',
      icon: <Target className="w-5 h-5 text-sky-400" />,
      category: 'Cravada Sofrida',
      summary: 'Uma cravada ocorre quando uma peça atacada não pode se mover porque exporia uma peça de valor superior atrás dela.',
      details: [
        'Cravada Absoluta: A peça protege o Rei. Mover esta peça é lance ilegal pelas regras.',
        'Cravada Relativa: A peça protege a Dama ou Torre. Mover é legal, mas custa uma perda material devastadora.',
        'Princípio de Ouro: Pressione a peça cravada com peões e lances forçados adicionais.',
      ],
      tip: 'Peças cravadas perdem a capacidade de defender outras peças!',
    },
    {
      id: 'forks',
      title: '04. Garfos Táticos: O Terror dos Cavalos e Peões',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      category: 'Garfo Sofrido',
      summary: 'O ataque duplo (garfo) força o adversário a escolher qual peça salvar enquanto a outra é capturada.',
      details: [
        'Cavalos saltam sobre obstáculos e atacam em "L", tornando-se invisíveis para quem não calcula seus saltos.',
        'Peões em e5/d5 frequentemente dão garfos em Bispo e Cavalo adversários.',
        'Defesa contra garfo: Procure um contra-xeque com ganho de tempo.',
      ],
      tip: 'Mantenha peças desprotegidas em casas de cores diferentes quando houver cavalos inimigos ativos.',
    },
    {
      id: 'opening',
      title: '05. Os Três Mandamentos da Abertura',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      category: 'Rei Vulnerável',
      summary: 'Não inicie ataques prematuros com a dama antes de mobilizar suas forças harmoniosamente.',
      details: [
        '1. Controle o Centro: Ocupe ou pressione as 4 casas centrais (e4, d4, e5, d5).',
        '2. Desenvolva Peças Menores: Cavalos e Bispos devem entrar em jogo primeiro.',
        '3. Roque Cedo: Coloque o rei em segurança e conecte suas torres antes de abrir o centro.',
      ],
      tip: 'Não mova a mesma peça duas vezes na abertura a menos que seja para uma captura vantajosa.',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>Manual do Enxadrista: Dicas & Conceitos Mestres</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Guia prático para eliminar os erros mais frequentes e acelerar seu progresso no xadrez.
        </p>
      </div>

      <div className="space-y-4">
        {principles.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
              </div>

              <button
                onClick={() => onPracticeCategory(item.category)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              >
                <span>Praticar Este Tema</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {item.summary}
            </p>

            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              {item.details.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-amber-300/90 flex items-center gap-2">
              <span className="font-bold shrink-0">💡 Conselho Chave:</span>
              <span>{item.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
