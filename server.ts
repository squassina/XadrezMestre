import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import { mountEngineRoutes } from './server/engineRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Atrás do proxy do Cloud Run/Fly: req.ip passa a ser o IP real do cliente (rate limit)
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));

// CORS: o front fica no GitHub Pages (outro domínio). Ex.: ALLOWED_ORIGIN=https://squassina.github.io
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Motor Stockfish nativo (/api/engine/*)
const enginePool = mountEngineRoutes(app);

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Heuristic fallback explanation generator for offline/fast response
function generateFallbackExplanation(category: string, san: string, bestSan: string, evalDiff?: number, language: string = 'pt-BR') {
  if (language === 'en') {
    switch (category) {
      case 'Peça Pendurada': return { explanation: 'The move ' + san + ' left a piece undefended. The recommended move was ' + bestSan + '.', tacticalConcept: 'Material Safety', proTip: 'Before moving, check what attacks the destination square and whether you can recapture.', keyQuestionsToAsk: ['Is my piece defended?', 'Can the opponent gain tempo by attacking it?'] };
      case 'Cravada Sofrida': return { explanation: 'The move ' + san + ' allowed a pin against a more valuable piece. ' + bestSan + ' kept the position safer.', tacticalConcept: 'Pins', proTip: 'Watch for pieces aligned on the same rank, file, or diagonal.', keyQuestionsToAsk: ['Are valuable pieces aligned?', 'Can I prevent or break the pin?'] };
      case 'Garfo Sofrido': return { explanation: 'The move ' + san + ' allowed a double attack. The correct move was ' + bestSan + '.', tacticalConcept: 'Forks and Double Attacks', proTip: 'Look for knights and pawns attacking two targets at once.', keyQuestionsToAsk: ['Can the opponent attack two pieces in one move?'] };
      case 'Rei Vulnerável': return { explanation: 'The move ' + san + ' weakened your king’s shelter or allowed dangerous checks. The ideal move was ' + bestSan + '.', tacticalConcept: 'King Safety', proTip: 'Prioritize king safety and castling.', keyQuestionsToAsk: ['Is my king safe from checks and open files?'] };
      case 'Oportunidade Tática Perdida': return { explanation: 'You played ' + san + ', but ' + bestSan + ' offered a tactical chance to win material or attack decisively.', tacticalConcept: 'Forcing Moves', proTip: 'Calculate checks, captures, and direct threats first.', keyQuestionsToAsk: ['Do I have a useful check or capture?'] };
      default: return { explanation: 'The move ' + san + ' gave up initiative and space. The engine’s best move was ' + bestSan + '.', tacticalConcept: 'Piece Activity', proTip: 'Improve your least active piece and control the center.', keyQuestionsToAsk: ['Which piece is least active?'] };
    }
  }
  switch (category) {
    case 'Peça Pendurada':
      return {
        explanation: `O lance ${san} deixou uma peça sem defesa ou moveu para uma casa controlada pelo adversário. O melhor lance recomendado era ${bestSan}.`,
        tacticalConcept: 'Segurança Material & Coordenação de Peças',
        proTip: 'Antes de soltar a peça, pergunte-se: "Quem ataca esta casa? E se o adversário capturar agora, eu posso recapturar?"',
        keyQuestionsToAsk: ['Minha peça tem defensores suficientes?', 'O adversário tem lances com ganho de tempo atacando essa peça?']
      };
    case 'Cravada Sofrida':
      return {
        explanation: `Ao jogar ${san}, você permitiu ou sofreu uma cravada contra uma peça de maior valor (como Dama ou Rei). O lance ${bestSan} mantinha a solidez defensiva.`,
        tacticalConcept: 'Cravadas Absolutas e Relativas',
        proTip: 'Fique atento a peças alinhadas no mesmo raio de ação de Bispos, Torres e Damas inimigas.',
        keyQuestionsToAsk: ['Há peças valiosas na mesma coluna, fileira ou diagonal?', 'Como posso desatar a cravada preventivamente?']
      };
    case 'Garfo Sofrido':
      return {
        explanation: `Com o lance ${san}, você permitiu que o oponente atacasse dois alvos simultaneamente no próximo lance. O lance correto era ${bestSan}.`,
        tacticalConcept: 'Ataque Duplo (Garfo)',
        proTip: 'Cavalos e Peões são especialistas em garfos. Identifique quando duas peças desprotegidas estão próximas.',
        keyQuestionsToAsk: ['O adversário pode atacar duas das minhas peças em um único lance?']
      };
    case 'Rei Vulnerável':
      return {
        explanation: `O lance ${san} enfraqueceu o escudo de peões do seu rei ou permitiu xeques perigosos. O lance ideal era ${bestSan}.`,
        tacticalConcept: 'Segurança do Rei',
        proTip: 'No meio-jogo com muitas peças no tabuleiro, a prioridade máxima é colocar o rei em segurança com o roque.',
        keyQuestionsToAsk: ['Meu rei está protegido contra xeques e aberturas de coluna?']
      };
    case 'Oportunidade Tática Perdida':
      return {
        explanation: `Você jogou ${san}, mas havia uma oportunidade tática concreta com ${bestSan} que ganhava material ou criava ataque decisivo!`,
        tacticalConcept: 'Visão Tática e Lances Forçados',
        proTip: 'Sempre calcule primeiro os lances forçados: Xeques, Capturas e Ameaças diretas (CCA).',
        keyQuestionsToAsk: ['Tenho algum xeque ou captura vantajosa nesta posição?']
      };
    default:
      return {
        explanation: `O lance ${san} cedeu iniciativa e espaço. O lance preciso do motor de xadrez era ${bestSan}, mantendo uma posição mais ativa.`,
        tacticalConcept: 'Atividade de Peças e Controle de Casas Chave',
        proTip: 'Procure melhorar a pior das suas peças e controlar o centro do tabuleiro.',
        keyQuestionsToAsk: ['Qual das minhas peças está menos ativa agora?']
      };
  }
}

// Coach Move Analysis Endpoint
app.post('/api/coach/explain', async (req, res) => {
  try {
    const { fen, san, bestSan, blunderCategory, evalDiff, moveNumber, userMistakeHistory, language = 'pt-BR' } = req.body;

    if (!san || !bestSan) {
      return res.status(400).json({ error: 'Parâmetros san e bestSan são obrigatórios.' });
    }

    if (!ai) {
      // Return instant heuristic explanation
      const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san, bestSan, evalDiff, language);
      return res.json({ ...fallback, isAiGenerated: false });
    }

    const prompt = `You are an International Chess Grandmaster and a patient, enthusiastic chess coach. Respond in ${language === 'en' ? 'English' : 'Brazilian Portuguese'}.
The student played "${san}", but the engine’s best move was "${bestSan}".
Mistake classification: "${blunderCategory || 'Inaccuracy/Blunder'}".
Evaluation difference: ${evalDiff ? `${evalDiff} centipawns` : 'significant loss'}.
Current position FEN: ${fen || 'unknown'}.
Recent student mistakes: ${JSON.stringify(userMistakeHistory || [])}.

Return immediate, constructive feedback as strict JSON:
{
  "explanation": "A clear, friendly 2–3 sentence explanation of why ${san} was problematic and why ${bestSan} was better.",
  "tacticalConcept": "Concise chess concept name in the requested language",
  "proTip": "A memorable practical tip the student can apply in the next game",
  "keyQuestionsToAsk": ["Mental checklist question 1", "Question 2"]
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const text = response.text?.trim();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({ ...parsed, isAiGenerated: true });
      } catch (parseError) {
        console.error('JSON parse error from Gemini:', parseError);
      }
    }

    const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san, bestSan, evalDiff, language);
    return res.json({ ...fallback, isAiGenerated: false });
  } catch (error) {
    console.error('Error generating coach feedback:', error);
    const { san, bestSan, blunderCategory, language = 'pt-BR' } = req.body;
    const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san || '', bestSan || '', undefined, language);
    return res.json({ ...fallback, isAiGenerated: false });
  }
});

// Diagnostics endpoint to analyze user performance over multiple games
app.post('/api/coach/diagnostics', async (req, res) => {
  try {
    const { stats, errorCounts, totalGames, language = 'pt-BR' } = req.body;

    if (!ai) {
      return res.json(language === 'en' ? {
        summary: `You have played ${totalGames || 0} analyzed games. Focus on reducing undefended pieces and maintaining tactical awareness.`,
        strengths: ['Enthusiasm for learning', 'Initiative in seeking active positions'],
        weaknesses: Object.keys(errorCounts || {}).slice(0, 3),
        recommendations: ['Solve five pin and fork puzzles daily.', 'Before each move, check for checks, captures, and threats.', 'Consider castling earlier to avoid attacks along the center files.']
      } : {
        summary: `Você disputou ${totalGames || 0} partidas analisadas. Seu foco principal deve ser reduzir peças desprotegidas e manter a vigilância tática.`,
        strengths: ['Entusiasmo para aprender', 'Iniciativa em buscar posições ativas'],
        weaknesses: Object.keys(errorCounts || {}).slice(0, 3),
        recommendations: ['Resolva 5 exercícios de cravadas e garfos diariamente.', 'Antes de cada lance, faça o checklist: Xeques, Capturas, Ameaças.', 'Considere o roque mais cedo para evitar ataques na coluna central.']
      });
    }

    const prompt = `Analyze this chess player's mistake profile. Respond in ${language === 'en' ? 'English' : 'Brazilian Portuguese'}:
Games played: ${totalGames}
Mistake statistics: ${JSON.stringify(errorCounts)}
General statistics: ${JSON.stringify(stats)}

Return an educational diagnosis as strict JSON:
{
  "summary": "Two-sentence summary of the player’s style and main improvement area",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": ["Practical recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    console.error('Error in diagnostics:', err);
    const language = req.body?.language ?? 'pt-BR';
    return res.json(language === 'en' ? {
      summary: 'Keep practicing tactical puzzles to strengthen pattern recognition.', strengths: ['Dedication to training'], weaknesses: ['Awareness of undefended pieces'], recommendations: ['Daily exercises calculating forcing moves']
    } : {
      summary: 'Continue praticando exercícios de tática para solidificar o reconhecimento de padrões.', strengths: ['Dedicação aos treinos'], weaknesses: ['Vigilância em peças desprotegidas'], recommendations: ['Exercícios diários de cálculo de lances forçados']
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync('dist/index.html')) {
    // modo "tudo junto". Em deploy só-API (front no Pages) não existe dist/ e isso é ignorado.
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess Coach Server running on port ${PORT}`);
  });

  // Encerramento limpo (Cloud Run envia SIGTERM): não deixa processos Stockfish órfãos
  const shutdown = () => { enginePool.close(); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

