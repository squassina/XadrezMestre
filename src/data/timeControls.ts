import { TimeControl } from '../types/chess';

export const TIME_CONTROLS: TimeControl[] = [
  // Bullet
  {
    id: 'bullet-1-0',
    name: '1 min',
    type: 'bullet',
    baseMinutes: 1,
    incrementSeconds: 0,
    description: 'Bullet puro · Hiper-rápido (60s)',
  },
  {
    id: 'bullet-2-1',
    name: '2+1',
    type: 'bullet',
    baseMinutes: 2,
    incrementSeconds: 1,
    description: 'Bullet com 1s de incremento',
  },

  // Blitz
  {
    id: 'blitz-3-0',
    name: '3 min',
    type: 'blitz',
    baseMinutes: 3,
    incrementSeconds: 0,
    description: 'Blitz clássico · Ritmo eletrizante',
  },
  {
    id: 'blitz-3-2',
    name: '3+2',
    type: 'blitz',
    baseMinutes: 3,
    incrementSeconds: 2,
    description: 'Blitz competitivo com 2s de bônus',
  },
  {
    id: 'blitz-5-0',
    name: '5 min',
    type: 'blitz',
    baseMinutes: 5,
    incrementSeconds: 0,
    description: 'Blitz padrão de clubes e mestres',
  },
  {
    id: 'blitz-5-3',
    name: '5+3',
    type: 'blitz',
    baseMinutes: 5,
    incrementSeconds: 3,
    description: 'Blitz profundo com incremento',
  },

  // Rapid
  {
    id: 'rapid-10-0',
    name: '10 min',
    type: 'rapid',
    baseMinutes: 10,
    incrementSeconds: 0,
    description: 'Rápido popular · Ideal para treinar cálculo',
  },
  {
    id: 'rapid-15-10',
    name: '15+10',
    type: 'rapid',
    baseMinutes: 15,
    incrementSeconds: 10,
    description: 'Rápido oficial FIDE · Tempo amplo para planejar',
  },

  // Unlimited
  {
    id: 'unlimited',
    name: 'Sem Tempo',
    type: 'unlimited',
    baseMinutes: 0,
    incrementSeconds: 0,
    description: 'Modo Zen · Treino focado sem relógio',
  },
];

export const DEFAULT_TIME_CONTROL = TIME_CONTROLS[6]; // 10 min rapid by default
