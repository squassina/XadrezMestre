import { TacticalPuzzle, PlayerStats, BlunderCategory } from '../types/chess';

export const INITIAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'pz-fork-1',
    title: 'Garfo de Cavalo Letal',
    fen: 'r1b1k2r/pppp1ppp/8/4n3/1b1N4/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 8',
    playerColor: 'w',
    moves: ['Qe2', 'O-O', 'Qxe5'],
    category: 'Garfo Sofrido',
    difficulty: 'Iniciante',
    rating: 850,
    hint: 'Aproveite o cavalo desprotegido em e5 cravando-o ou atacando múltiplos alvos.',
    lesson: 'Antes de mover uma peça para o centro, assegure-se de que ela tenha apoio de peões ou defensores.'
  },
  {
    id: 'pz-fork-2',
    title: 'O Clássico Garfo Real em c7',
    fen: 'r1bqk2r/pp1p1ppp/2n1pn2/2b5/4P3/2N2N2/PPP1BPPP/R1BQK2R w KQkq - 2 6',
    playerColor: 'w',
    moves: ['e5', 'Ng4', 'Ne4'],
    category: 'Garfo Sofrido',
    difficulty: 'Intermediário',
    rating: 1200,
    hint: 'Ganhe espaço no centro atacando uma peça adversária e criando saltos perigosos de cavalo.',
    lesson: 'Avanços de peões com ganho de tempo expulsam peças e criam casas de invasão.'
  },
  {
    id: 'pz-pin-1',
    title: 'Cravada Mortal na Dama',
    fen: 'r1b1kb1r/pppp1ppp/2n2q2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5',
    playerColor: 'w',
    moves: ['Bg5', 'Qg6', 'Bxd8'],
    category: 'Cravada Sofrida',
    difficulty: 'Iniciante',
    rating: 900,
    hint: 'Desenvolva o bispo c1 atacando a dama exposta.',
    lesson: 'Trazer a dama muito cedo na abertura expõe alvos fáceis para o adversário ganhar tempos de desenvolvimento.'
  },
  {
    id: 'pz-pin-2',
    title: 'Explorando o Rei no Centro',
    fen: 'r3k2r/ppp2ppp/2n5/3qp3/1b4b1/2NP1N2/PPP2PPP/R1BQR1K1 w kq - 4 9',
    playerColor: 'w',
    moves: ['Nxd5', 'Bxd1', 'Nxb4'],
    category: 'Cravada Sofrida',
    difficulty: 'Intermediário',
    rating: 1350,
    hint: 'Quando a dama inimiga estiver desprotegida, calcule combinações de remoção de defensor.',
    lesson: 'Uma peça aparentemente cravada pode se mover se a ameaça criada for de valor superior.'
  },
  {
    id: 'pz-hanging-1',
    title: 'Punição da Peça Pendurada',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4',
    playerColor: 'w',
    moves: ['Nxe5', 'Nxe5', 'd4'],
    category: 'Peça Pendurada',
    difficulty: 'Iniciante',
    rating: 950,
    hint: 'Golpe tático central: sacrifício aparente seguido de garfo de peão recuperando material com vantagem.',
    lesson: 'O golpe do centro (Nxe5 seguido de d4) ganha controle absoluto das casas e4 e d4.'
  },
  {
    id: 'pz-hanging-2',
    title: 'Ataque à Torre Desatenta',
    fen: '2r2rk1/pp1b1ppp/1qn1pn2/3p4/3P4/1PN1PN2/P1Q1BPPP/R4RK1 w - - 3 13',
    playerColor: 'w',
    moves: ['Qb2', 'Ne4', 'Nxe4'],
    category: 'Peça Pendurada',
    difficulty: 'Intermediário',
    rating: 1250,
    hint: 'Melhore a posição da sua dama saindo da linha de raio-x da torre adversária.',
    lesson: 'Profilaxia: antecipe ataques em colunas semiabertas antes que o adversário execute a tática.'
  },
  {
    id: 'pz-king-1',
    title: 'Mate do Corredor (Última Fileira)',
    fen: '6k1/5ppp/8/8/8/8/1r3PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    moves: ['Re8#'],
    category: 'Rei Vulnerável',
    difficulty: 'Iniciante',
    rating: 700,
    hint: 'O rei preto não possui casa de fuga (respiro / luft). Encontre o xeque-mate imediato.',
    lesson: 'Sempre faça um lance de respiro (h3 ou g3) para evitar mates de corredor no final de jogo.'
  },
  {
    id: 'pz-king-2',
    title: 'Demolição do Escudo de Peões',
    fen: 'r1b2rk1/ppq1bppp/2n1pn2/2pp4/2PP4/2N1PN2/PP1BBPPP/R2Q1RK1 w - - 5 9',
    playerColor: 'w',
    moves: ['cxd5', 'exd5', 'dxc5'],
    category: 'Rei Vulnerável',
    difficulty: 'Intermediário',
    rating: 1300,
    hint: 'Abra linhas centrais para isolar peões adversários e expor a diagonal do rei.',
    lesson: 'Peões isolados (d5) tornam-se alvos permanentes de cerco tático.'
  },
  {
    id: 'pz-tactics-1',
    title: 'Desvio Decisivo com Xeque Duplo',
    fen: 'r1b1k2r/pppp1Npp/8/4p3/2Bn3q/8/PPPP2PP/RNBQ2KR b kq - 1 9',
    playerColor: 'b',
    moves: ['Nf3+', 'gxf3', 'Qd4+'],
    category: 'Oportunidade Tática Perdida',
    difficulty: 'Avançado',
    rating: 1650,
    hint: 'Lances forçados: dê um xeque com sacrifício para abrir o rei branco e capturar o bispo em c4.',
    lesson: 'Xeques forçam respostas imediatas do defensor, retirando tempo de contra-ataque.'
  },
  {
    id: 'pz-tactics-2',
    title: 'Ataque Descoberto Devastador',
    fen: 'r2qkb1r/pp3ppp/2n1pn2/3p4/3P2b1/2NBPN2/PP3PPP/R1BQK2R w KQkq - 2 8',
    playerColor: 'w',
    moves: ['h3', 'Bh5', 'g4', 'Bg6', 'Ne5'],
    category: 'Oportunidade Tática Perdida',
    difficulty: 'Avançado',
    rating: 1600,
    hint: 'Pressione a peça cravada e instale um cavalo dominante em e5.',
    lesson: 'Quando o adversário insistir em manter uma cravada, ganhe espaço na ala do rei com cálculo preciso.'
  }
];

export function getPersonalizedPuzzles(stats: PlayerStats): TacticalPuzzle[] {
  // Find top blunder category in player's history
  const mistakeCounts = stats.mistakesByType || {};
  let worstCategory: BlunderCategory | null = null;
  let maxCount = 0;

  for (const [cat, count] of Object.entries(mistakeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      worstCategory = cat as BlunderCategory;
    }
  }

  // Sort puzzles so the worst category appears first
  const sorted = [...INITIAL_PUZZLES].sort((a, b) => {
    if (worstCategory) {
      if (a.category === worstCategory && b.category !== worstCategory) return -1;
      if (b.category === worstCategory && a.category !== worstCategory) return 1;
    }
    // Then sort close to player's rating
    return Math.abs(a.rating - stats.tacticalRating) - Math.abs(b.rating - stats.tacticalRating);
  });

  return sorted;
}
