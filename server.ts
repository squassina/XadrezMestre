import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { engineRouter } from './server/engineRoutes';
import { enginePool } from './server/engine';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50kb' }));

// CORS headers for API calls
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Mount Stockfish Engine Routes
app.use('/api/engine', engineRouter);

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Heuristic fallback explanation generator for offline/fast response
function generateFallbackExplanation(category: string, san: string, bestSan: string, evalDiff?: number) {
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
    const { fen, san, bestSan, blunderCategory, evalDiff, moveNumber, userMistakeHistory } = req.body;

    if (!san || !bestSan) {
      return res.status(400).json({ error: 'Parâmetros san e bestSan são obrigatórios.' });
    }

    if (!ai) {
      // Return instant heuristic explanation
      const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san, bestSan, evalDiff);
      return res.json({ ...fallback, isAiGenerated: false });
    }

    const prompt = `Você é um Grande Mestre Internacional de Xadrez e treinador pedagógico paciente, entusiasmado e didático em língua portuguesa.
O aluno jogou o lance "${san}", mas o melhor lance do motor era "${bestSan}".
Classificação do erro: "${blunderCategory || 'Imprecisão/Gafe'}".
Diferença de avaliação: ${evalDiff ? `${evalDiff} centipawns` : 'perda significativa'}.
Posição atual FEN: ${fen || 'desconhecida'}.
Histórico de erros recentes do aluno: ${JSON.stringify(userMistakeHistory || [])}.

Forneça um feedback imediato e altamente construtivo em formato JSON rigoroso:
{
  "explanation": "Explicação clara e amigável em 2-3 frases do motivo tático ou estratégico pelo qual ${san} foi problemático e por que ${bestSan} era superior.",
  "tacticalConcept": "Nome conciso do conceito de xadrez em português (Ex: 'Peça Pendurada', 'Cravada Relativa', 'Controle Central', 'Rei Desprotegido')",
  "proTip": "Uma dica prática memorável para o aluno aplicar já na próxima partida",
  "keyQuestionsToAsk": ["Pergunta 1 de checklist mental antes do lance", "Pergunta 2"]
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

    const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san, bestSan, evalDiff);
    return res.json({ ...fallback, isAiGenerated: false });
  } catch (error) {
    console.error('Error generating coach feedback:', error);
    const { san, bestSan, blunderCategory } = req.body;
    const fallback = generateFallbackExplanation(blunderCategory || 'Imprecisão', san || '', bestSan || '');
    return res.json({ ...fallback, isAiGenerated: false });
  }
});

// Diagnostics endpoint to analyze user performance over multiple games
app.post('/api/coach/diagnostics', async (req, res) => {
  try {
    const { stats, errorCounts, totalGames } = req.body;

    if (!ai) {
      return res.json({
        summary: `Você disputou ${totalGames || 0} partidas analisadas. Seu foco principal deve ser reduzir peças desprotegidas e manter a vigilância tática.`,
        strengths: ['Entusiasmo para aprender', 'Iniciativa em buscar posições ativas'],
        weaknesses: Object.keys(errorCounts || {}).slice(0, 3),
        recommendations: [
          'Resolva 5 exercícios de cravadas e garfos diariamente.',
          'Antes de cada lance, faça o checklist: Xeques, Capturas, Ameaças.',
          'Considere o roque mais cedo para evitar ataques na coluna central.'
        ]
      });
    }

    const prompt = `Analise o perfil de erros deste jogador de xadrez:
Partidas jogadas: ${totalGames}
Estatísticas de erros: ${JSON.stringify(errorCounts)}
Estatísticas gerais: ${JSON.stringify(stats)}

Retorne um diagnóstico didático em JSON em português:
{
  "summary": "Resumo de 2 frases do estilo e principal gargalo do aluno",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
  "recommendations": ["Recomendação prática 1", "Recomendação prática 2", "Recomendação prática 3"]
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
    return res.json({
      summary: 'Continue praticando exercícios de tática para solidificar o reconhecimento de padrões.',
      strengths: ['Dedicação aos treinos'],
      weaknesses: ['Vigilância em peças desprotegidas'],
      recommendations: ['Exercícios diários de cálculo de lances forçados']
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
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess Coach Server running on port ${PORT}`);
  });

  const gracefulShutdown = () => {
    console.log('Shutting down server and engine pool...');
    enginePool.destroy();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

