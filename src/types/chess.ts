export type MoveQuality = 
  | 'brilliant' 
  | 'best' 
  | 'good' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'blunder' 
  | 'missed_win';

export type BlunderCategory = 
  | 'Peça Pendurada' 
  | 'Cravada Sofrida' 
  | 'Garfo Sofrido' 
  | 'Rei Vulnerável' 
  | 'Oportunidade Tática Perdida' 
  | 'Desenvolvimento Lento'
  | 'Erro Posicional';

export interface CoachFeedback {
  explanation: string;
  tacticalConcept: string;
  proTip: string;
  keyQuestionsToAsk?: string[];
  isAiGenerated?: boolean;
}

export interface AnalyzedMove {
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  color: 'w' | 'b';
  evalBefore: number; // in centipawns
  evalAfter: number;  // in centipawns
  evalDiff: number;   // loss for player (negative or positive)
  quality: MoveQuality;
  qualityLabel: string;
  blunderCategory?: BlunderCategory;
  bestMoveSan?: string;
  bestMoveFromTo?: { from: string; to: string };
  isBookMove?: boolean;
  openingName?: string;
  eco?: string;
  coachFeedback?: CoachFeedback;
  timestamp: number;
}

export type BotLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface BotConfig {
  id: BotLevel;
  name: string;
  title: string;
  elo: number;
  depth: number;
  randomness: number; // probability of suboptimal move
  blunderChance: number;
  avatar: string;
  description: string;
}

export interface TacticalPuzzle {
  id: string;
  title: string;
  fen: string;
  playerColor: 'w' | 'b';
  moves: string[]; // sequence of SAN moves: [playerMove1, botResponse1, playerMove2, ...]
  category: BlunderCategory;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  rating: number;
  hint: string;
  lesson: string;
}

export interface PlayerStats {
  tacticalRating: number;
  puzzlesSolved: number;
  puzzlesFailed: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  mistakesByType: Record<string, number>;
  recentMistakes: Array<{
    id: string;
    date: string;
    category: BlunderCategory;
    fen: string;
    movePlayed: string;
    bestMove: string;
    explanation: string;
  }>;
}

export interface BoardArrow {
  from: string;
  to: string;
  color: 'green' | 'red' | 'amber' | 'blue';
  width?: number;
}

export type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'unlimited';

export interface TimeControl {
  id: string;
  name: string;
  type: TimeControlType;
  baseMinutes: number;
  incrementSeconds: number;
  description: string;
}

export type PieceSet = 'cburnett' | 'staunty' | 'merida' | 'alpha';
export type BoardTheme = 'emerald' | 'wood' | 'tournament' | 'marble';


