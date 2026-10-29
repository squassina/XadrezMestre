import { BotLevel } from '../types/chess';

export interface BookMove {
  san: string;
  weight: number; // probability weight (higher = more common main-line)
  name?: string;
  comment?: string;
}

export interface OpeningEntry {
  eco: string;
  name: string;
  moves: BookMove[];
  plan?: string;
}

/**
 * Opening position database indexed by normalized FEN key (piece placement + active color + castling)
 * This allows matching regardless of halfmove clock or move number!
 */
export function getPositionKey(fen: string): string {
  const parts = fen.split(' ');
  // parts[0] = pieces, parts[1] = turn, parts[2] = castling
  return `${parts[0]} ${parts[1]} ${parts[2]}`;
}

export const OPENING_BOOK: Record<string, OpeningEntry> = {
  // Initial position: 1. ?
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': {
    eco: 'A00',
    name: 'Posição Inicial',
    moves: [
      { san: 'e4', weight: 48, name: 'Peão do Rei', comment: 'O lance mais agressivo e popular de abertura, disputa e4/d5 e abre diagonais para Dama e Bispo.' },
      { san: 'd4', weight: 36, name: 'Peão da Dama', comment: 'Controle posicional direto do centro, protegido pela dama branca.' },
      { san: 'Nf3', weight: 10, name: 'Abertura Réti / Zukertort', comment: 'Desenvolvimento hipermoderno com controle flexível das casas d4 e e5.' },
      { san: 'c4', weight: 6, name: 'Abertura Inglesa', comment: 'Luta pelo centro pela ala da dama com grande flexibilidade de transposições.' },
    ],
    plan: 'Lute pelo controle do centro com peões (e4/d4), mobilize cavalos e bispos e prepare o roque rápido.'
  },

  // 1. e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': {
    eco: 'B00',
    name: 'Abertura do Peão do Rei (1. e4)',
    moves: [
      { san: 'e5', weight: 42, name: 'Jogo Aberto', comment: 'Resposta simétrica clássica bloqueando e4 e disputando d4.' },
      { san: 'c5', weight: 38, name: 'Defesa Siciliana', comment: 'A resposta mais combativa e com maior percentual de vitórias para as pretas.' },
      { san: 'e6', weight: 10, name: 'Defesa Francesa', comment: 'Prepara d5 com estrutura sólida de peões.' },
      { san: 'c6', weight: 8, name: 'Defesa Caro-Kann', comment: 'Prepara d5 mantendo a diagonal do bispo de casas brancas desobstruída.' },
      { san: 'd5', weight: 2, name: 'Defesa Escandinava', comment: 'Desafio imediato ao centro branco.' },
    ],
    plan: 'As pretas devem disputar a casa central d4 ou desequilibrar a ala da dama com a Siciliana.'
  },

  // 1. e4 e5 -> 2. ?
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': {
    eco: 'C20',
    name: 'Jogo Aberto',
    moves: [
      { san: 'Nf3', weight: 85, name: 'Ataque do Cavalo do Rei', comment: 'Desenvolve com ganho de tempo atacando o peão de e5.' },
      { san: 'Nc3', weight: 8, name: 'Abertura Vienense', comment: 'Desenvolvimento sólido controlando d5.' },
      { san: 'f4', weight: 4, name: 'Gambito do Rei', comment: 'Sacrifício romântico para desviar o peão de e5.' },
      { san: 'Bc4', weight: 3, name: 'Abertura do Bispo', comment: 'Pressão imediata na fraqueza f7.' },
    ],
    plan: 'As brancas atacam e5 forçando as pretas a gastar tempo defendendo o centro.'
  },

  // 1. e4 e5 2. Nf3 -> 2... ?
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': {
    eco: 'C40',
    name: 'Ataque do Cavalo do Rei',
    moves: [
      { san: 'Nc6', weight: 82, name: 'Defesa Clássica', comment: 'O lance mais natural, desenvolvendo o cavalo e defendendo e5.' },
      { san: 'Nf6', weight: 14, name: 'Defesa Petrov (Russa)', comment: 'Contra-ataque simétrico atacando o peão de e4.' },
      { san: 'd6', weight: 4, name: 'Defesa Philidor', comment: 'Defesa sólida porém passiva, bloqueia o bispo de f8.' },
    ],
    plan: 'Pretas protegem e5 ou contra-atacam e4 antes que as brancas assumam a iniciativa total.'
  },

  // 1. e4 e5 2. Nf3 Nc6 -> 3. ?
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq': {
    eco: 'C44',
    name: 'Abertura Aberta',
    moves: [
      { san: 'Bb5', weight: 52, name: 'Abertura Espanhola (Ruy Lopez)', comment: 'A abertura clássica mais respeitada do xadrez, pressionando o defensor de e5.' },
      { san: 'Bc4', weight: 36, name: 'Abertura Italiana', comment: 'Desenvolvimento harmonioso visando f7 e o controle de d5.' },
      { san: 'd4', weight: 8, name: 'Abertura Escocesa', comment: 'Abre o centro imediatamente liquidando a tensão de peões.' },
      { san: 'Nc3', weight: 4, name: 'Abertura dos Quatro Cavalos', comment: 'Desenvolvimento calmo e seguro de peças menores.' },
    ],
    plan: 'Brancas escolhem entre a pressão estratégica da Ruy Lopez ou o dinamismo tático da Italiana.'
  },

  // 1. e4 e5 2. Nf3 Nc6 3. Bb5 (Ruy Lopez) -> 3... ?
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq': {
    eco: 'C60',
    name: 'Abertura Espanhola (Ruy Lopez)',
    moves: [
      { san: 'a6', weight: 75, name: 'Variante Morphy', comment: 'Interroga o bispo branco imediatamente: recuar ou trocar?' },
      { san: 'Nf6', weight: 20, name: 'Defesa Berlinesa', comment: 'O muro de Berlim, altamente sólida e favorita em finais de campeonatos mundiais.' },
      { san: 'd6', weight: 3, name: 'Defesa Steinitz', comment: 'Sólida e paciente.' },
      { san: 'Bc5', weight: 2, name: 'Defesa Clássica', comment: 'Desenvolve o bispo para uma diagonal ativa.' },
    ],
    plan: 'Pretas desafiam o bispo de b5 para aliviar a pressão indireta sobre o peão de e5.'
  },

  // 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 -> 4... ?
  'r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R b KQkq': {
    eco: 'C70',
    name: 'Ruy Lopez: Variante Morphy (4. Ba4)',
    moves: [
      { san: 'Nf6', weight: 88, name: 'Linha Principal', comment: 'Desenvolve o cavalo atacando e4 e preparando o roque.' },
      { san: 'b5', weight: 8, name: 'Avanço na Ala da Dama', comment: 'Expulsa o bispo antes de desenvolver o cavalo.' },
      { san: 'd6', weight: 4, name: 'Steinitz Moderna', comment: 'Mantém a estrutura firme no centro.' },
    ],
    plan: 'Pretas atacam e4 e forçam as brancas a decidirem como proteger seu peão central.'
  },

  // 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O -> 5... ?
  'r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 b kq': {
    eco: 'C80',
    name: 'Ruy Lopez: Linha Principal Aberta/Fechada (5. O-O)',
    moves: [
      { san: 'Be7', weight: 76, name: 'Ruy Lopez Fechada', comment: 'Desenvolve o bispo preparando o roque e mantendo solidez.' },
      { san: 'Nxe4', weight: 20, name: 'Ruy Lopez Aberta', comment: 'Captura o peão central abrindo linhas táticas afiadas.' },
      { san: 'b5', weight: 4, name: 'Avanço Imediato', comment: 'Afasta o bispo para b3.' },
    ],
    plan: 'Brancas colocaram o rei em segurança com o roque e agora ameaçam Re1 reconquistando e5.'
  },

  // 1. e4 e5 2. Nf3 Nc6 3. Bc4 (Italian Game) -> 3... ?
  'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq': {
    eco: 'C50',
    name: 'Abertura Italiana',
    moves: [
      { san: 'Bc5', weight: 62, name: 'Giuoco Piano (Jogo Calmo)', comment: 'Desenvolve o bispo para a diagonal a7-g1 espelhando o bispo branco.' },
      { san: 'Nf6', weight: 34, name: 'Defesa dos Dois Cavalos', comment: 'Ataque direto ao peão de e4 com contra-ataques táticos.' },
    ],
    plan: 'Disputa feroz pelas diagonais centrais e pela casa d4.'
  },

  // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 -> 4... ?
  'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq': {
    eco: 'C53',
    name: 'Italiana: Giuoco Piano (4. c3)',
    moves: [
      { san: 'Nf6', weight: 88, name: 'Linha Principal Clássica', comment: 'Desenvolve com contra-ataque sobre e4 antes que as brancas joguem d4.' },
      { san: 'Qe7', weight: 8, name: 'Defesa Fechada', comment: 'Sustenta e5 com a dama.' },
    ],
    plan: 'Brancas preparam a ruptura d4 para montar um centro colossal de peões.'
  },

  // 1. e4 c5 (Sicilian Defense) -> 2. ?
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': {
    eco: 'B20',
    name: 'Defesa Siciliana',
    moves: [
      { san: 'Nf3', weight: 78, name: 'Siciliana Aberta', comment: 'Prepara a ruptura d4 abrindo a coluna d para o ataque branco.' },
      { san: 'Nc3', weight: 12, name: 'Siciliana Fechada', comment: 'Desenvolvimento mais lento sem abrir o centro precocemente.' },
      { san: 'c3', weight: 7, name: 'Variante Alapin', comment: 'Prepara d4 com suporte de peão para manter o centro.' },
      { san: 'd4', weight: 3, name: 'Gambito Smith-Morra', comment: 'Sacrifício de peão para aceleração de desenvolvimento.' },
    ],
    plan: 'As brancas preparam d4 enquanto as pretas garantem a coluna c semiaberta.'
  },

  // 1. e4 c5 2. Nf3 -> 2... ?
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': {
    eco: 'B27',
    name: 'Defesa Siciliana: 2. Nf3',
    moves: [
      { san: 'd6', weight: 52, name: 'Variante Clássica / Najdorf', comment: 'Controla e5 e abre diagonal para o bispo de c8.' },
      { san: 'Nc6', weight: 26, name: 'Variante dos Cavalos', comment: 'Desenvolve o cavalo controlando d4 e e5.' },
      { san: 'e6', weight: 20, name: 'Variante Scheveningen / Kan', comment: 'Controla d5 e prepara o desenvolvimento do bispo de casas pretas.' },
    ],
    plan: 'Pretas escolhem sua estrutura de peões (d6 ou e6) para combater a ruptura d4 branca.'
  },

  // 1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 -> 5... ?
  'r1bqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq': {
    eco: 'B90',
    name: 'Defesa Siciliana: Siciliana Aberta',
    moves: [
      { san: 'a6', weight: 58, name: 'Variante Najdorf', comment: 'Impede Bb5+ e Nb5, preparando expansão b5 na ala da dama. A variante predileta de Kasparov e Fischer.' },
      { san: 'g6', weight: 24, name: 'Variante do Dragão', comment: 'Prepara o fianchetto do bispo em g7, mirando a grande diagonal h8-a1.' },
      { san: 'e6', weight: 14, name: 'Variante Scheveningen', comment: 'O pequeno centro, extremamente flexível.' },
      { san: 'Nc6', weight: 4, name: 'Variante Clássica', comment: 'Pressão direta no cavalo central de d4.' },
    ],
    plan: 'Luta tática de máxima voltagem: brancas atacam na ala do rei e pretas contra-atacam na ala da dama.'
  },

  // 1. e4 e6 (French Defense) -> 2. ?
  'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': {
    eco: 'C00',
    name: 'Defesa Francesa',
    moves: [
      { san: 'd4', weight: 92, name: 'Ocupação do Centro', comment: 'Cria a dupla de peões ideal e4 e d4.' },
      { san: 'd3', weight: 5, name: 'Ataque Índio do Rei', comment: 'Sistema fechado com fianchetto de rei.' },
    ],
    plan: 'Brancas dominam o centro com peões enquanto pretas preparam o contra-golpe d5.'
  },

  // 1. e4 e6 2. d4 d5 -> 3. ?
  'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq': {
    eco: 'C01',
    name: 'Defesa Francesa (2... d5)',
    moves: [
      { san: 'Nc3', weight: 50, name: 'Variante Paulsen / Winawer', comment: 'Desenvolve protegendo e4 e mantendo máxima tensão.' },
      { san: 'Nd2', weight: 25, name: 'Variante Tarrasch', comment: 'Evita a cravada Bb4 mantendo flexibilidade.' },
      { san: 'e5', weight: 18, name: 'Variante do Avanço', comment: 'Bloqueia o centro ganhando vantagem de espaço na ala do rei.' },
      { san: 'exd5', weight: 7, name: 'Variante das Trocas', comment: 'Abre a coluna e simplificando a posição.' },
    ],
    plan: 'Disputa estratégica em torno da cadeia de peões e do bispo mau de c8 das pretas.'
  },

  // 1. e4 c6 (Caro-Kann) -> 2. ?
  'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': {
    eco: 'B10',
    name: 'Defesa Caro-Kann',
    moves: [
      { san: 'd4', weight: 90, name: 'Ocupação Central', comment: 'Estabelece o controle amplo de e4 e d4.' },
      { san: 'Nf3', weight: 6, name: 'Dois Cavalos', comment: 'Desenvolvimento ágil de peças.' },
    ],
    plan: 'Brancas controlam o centro e pretas responderão com d5 na jogada seguinte.'
  },

  // 1. e4 c6 2. d4 d5 -> 3. ?
  'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq': {
    eco: 'B12',
    name: 'Caro-Kann: Linhas Principais',
    moves: [
      { san: 'Nc3', weight: 52, name: 'Variante Clássica', comment: 'Protege e4 e leva à variante Capablanca após dxe4.' },
      { san: 'e5', weight: 34, name: 'Variante do Avanço', comment: 'Ganha espaço e restringe o cavalo de f6.' },
      { san: 'exd5', weight: 12, name: 'Variante das Trocas / Panov', comment: 'Abre a coluna c para ambos os lados.' },
    ],
    plan: 'Pretas buscam desenvolver o bispo de casas brancas para f5 antes de fechar a cadeia com e6.'
  },

  // 1. d4 (Queen's Pawn Game) -> 1... ?
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq': {
    eco: 'D00',
    name: 'Abertura do Peão da Dama (1. d4)',
    moves: [
      { san: 'd5', weight: 46, name: 'Jogo Fechado', comment: 'Ocupação simétrica do centro, bloqueando d4.' },
      { san: 'Nf6', weight: 44, name: 'Defesas Índias', comment: 'Impede e4 e mantém todas as opções estratégicas em aberto.' },
      { san: 'e6', weight: 5, name: 'Transposição Flexível', comment: 'Pode transpor para Francesa ou Gambito da Dama.' },
      { san: 'f5', weight: 3, name: 'Defesa Holandesa', comment: 'Luta assimétrica pela casa e4.' },
    ],
    plan: 'Pretas impedem que as brancas joguem e4 de graça no próximo lance.'
  },

  // 1. d4 d5 -> 2. ?
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': {
    eco: 'D00',
    name: 'Jogo do Peão da Dama',
    moves: [
      { san: 'c4', weight: 75, name: 'Gambito da Dama', comment: 'Oferece o peão de c4 para desviar o peão preto de d5 e obter centro total.' },
      { san: 'Nf3', weight: 15, name: 'Sistema London / Zukertort', comment: 'Desenvolvimento sólido preparando Bf4.' },
      { san: 'Bf4', weight: 8, name: 'Sistema London Direto', comment: 'Esquema moderno hiper-sólido muito popular.' },
    ],
    plan: 'Brancas buscam destruir a âncora d5 das pretas com o lance c4.'
  },

  // 1. d4 d5 2. c4 (Queen's Gambit) -> 2... ?
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': {
    eco: 'D06',
    name: 'Gambito da Dama',
    moves: [
      { san: 'e6', weight: 54, name: 'Gambito da Dama Recusado (QGD)', comment: 'A resposta mais clássica, sustentando firmemente d5.' },
      { san: 'c6', weight: 30, name: 'Defesa Eslava', comment: 'Protege d5 sem trancar o bispo de casas brancas em c8.' },
      { san: 'dxc4', weight: 14, name: 'Gambito da Dama Aceito (QGA)', comment: 'Captura o peão; as brancas recuperam facilmente com e3 ou e4.' },
    ],
    plan: 'Pretas defendem a fortaleza d5 ou aceitam a captura para focar no contra-ataque rápido.'
  },

  // 1. d4 d5 2. c4 e6 3. Nc3 -> 3... ?
  'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq': {
    eco: 'D30',
    name: 'Gambito da Dama Recusado (3. Nc3)',
    moves: [
      { san: 'Nf6', weight: 82, name: 'Linha Tradicional', comment: 'Desenvolvimento central sadio protegendo d5.' },
      { san: 'c6', weight: 12, name: 'Defesa Semi-Eslava', comment: 'Estrutura triangular com c6 e e6.' },
      { san: 'c5', weight: 6, name: 'Defesa Tarrasch', comment: 'Desafio imediato ao centro branco.' },
    ],
    plan: 'Brancas aumentam a pressão em d5 com Bg5 ou cxd5; pretas buscam igualdade sólida.'
  },

  // 1. d4 Nf6 2. c4 -> 2... ?
  'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': {
    eco: 'A46',
    name: 'Defesas Índias: 2. c4',
    moves: [
      { san: 'g6', weight: 46, name: 'Defesa Índia do Rei / Grünfeld', comment: 'Prepara fianchetto do bispo em g7.' },
      { san: 'e6', weight: 40, name: 'Defesa Nimzo-Índia / Bogo-Índia', comment: 'Prepara Bb4 cravando o cavalo de c3.' },
      { san: 'c5', weight: 12, name: 'Defesa Benoni', comment: 'Contra-ataque agudo na coluna d.' },
    ],
    plan: 'Pretas concedem o centro temporariamente para atacá-lo pelos flancos com peças e rupturas.'
  },

  // 1. d4 Nf6 2. c4 g6 3. Nc3 -> 3... ?
  'rnbqkb1r/pppppp1p/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq': {
    eco: 'E60',
    name: 'Defesa Índia do Rei / Grünfeld (3. Nc3)',
    moves: [
      { san: 'Bg7', weight: 62, name: 'Defesa Índia do Rei (KID)', comment: 'Fianchetto clássico; as pretas prepararão d6 e a ruptura e5.' },
      { san: 'd5', weight: 36, name: 'Defesa Grünfeld', comment: 'Desafio direto ao centro com peão, seguido por c5 e Bg7.' },
    ],
    plan: 'Brancas ocupam o centro com e4; pretas preparam contra-ataques virulentos no meio-jogo.'
  },

  // 1. c4 (English Opening) -> 1... ?
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq': {
    eco: 'A10',
    name: 'Abertura Inglesa',
    moves: [
      { san: 'e5', weight: 40, name: 'Siciliana Invertida', comment: 'As pretas jogam a Siciliana com as cores invertidas e um tempo a menos.' },
      { san: 'Nf6', weight: 35, name: 'Resposta Flexível', comment: 'Prepara g6 ou e6.' },
      { san: 'c5', weight: 15, name: 'Inglesa Simétrica', comment: 'Luta simétrica pelas casas centrais.' },
    ],
    plan: 'Brancas controlam a casa d5 e preparam o fianchetto do bispo em g2.'
  },

  // 1. Nf3 (Reti Opening) -> 1... ?
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq': {
    eco: 'A04',
    name: 'Abertura Réti / Zukertort',
    moves: [
      { san: 'd5', weight: 48, name: 'Ocupação do Centro', comment: 'Reivindica espaço central imediatamente.' },
      { san: 'Nf6', weight: 40, name: 'Desenvolvimento Simétrico', comment: 'Mantém opções de Defesas Índias.' },
      { san: 'c5', weight: 8, name: 'Controle de d4', comment: 'Prepara estruturas assimétricas.' },
    ],
    plan: 'Abertura hipermoderna com grande potencial de transposição para d4 ou c4.'
  }
};

/**
 * Lookup an opening entry by current board position
 */
export function getOpeningForPosition(fen: string): OpeningEntry | null {
  const key = getPositionKey(fen);
  return OPENING_BOOK[key] || null;
}

/**
 * Returns a recommended main-line move from the opening book if available
 */
export function getBookMove(fen: string): BookMove | null {
  const entry = getOpeningForPosition(fen);
  if (!entry || entry.moves.length === 0) return null;

  // Weighted random selection based on main-line frequency
  const totalWeight = entry.moves.reduce((sum, m) => sum + m.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const move of entry.moves) {
    randomVal -= move.weight;
    if (randomVal <= 0) {
      return move;
    }
  }

  return entry.moves[0];
}


/** Maximum number of half-moves for which each bot level may use the opening book. */
const OPENING_BOOK_MAX_PLIES: Record<BotLevel, number> = {
  beginner: 4,
  intermediate: 12,
  advanced: 20,
  master: 30,
};

export function canUseOpeningBook(botLevel: BotLevel, halfMovesPlayed: number): boolean {
  return halfMovesPlayed < OPENING_BOOK_MAX_PLIES[botLevel];
}
