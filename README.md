# XadrezMestre ♟️

**XadrezMestre** é uma plataforma moderna e interativa de treino e análise de xadrez em português, combinando o motor oficial **Stockfish** no servidor com inteligência artificial e feedback pedagógico imediato.

## ✨ Recursos

- ♟️ **Tabuleiro Responsivo com Pointer Events**: suporte completo a toque e arrasto (*drag & drop*) em smartphones, tablets e desktop, com marcadores suaves de lance legal e anel de captura.
- ⚡ **Motor Stockfish Nativo no Servidor**: busca veloz com `multiPV`, avaliação em centipawns e cálculo de probabilidade de vitória (estilo Lichess).
- 🔄 **Motor Interno de Reserva (Quiescence Search)**: motor Alfa-Beta com busca de quiescência integrado diretamente no cliente para suporte offline sem perda de continuidade.
- 📊 **Relatório da Partida & Gráfico de Precisão (Recharts)**: gráfico interativo de avaliação ao longo dos lances com destaque de gafes (*blunders*), oscilações críticas e revisão interativa lance a lance.
- 📖 **Livro de Aberturas**: reconhecimento automático das principais linhas teóricas (Ruy Lopez, Siciliana, Francesa, Gambito da Dama, etc.) nos primeiros 10–15 lances.
- ⏱️ **Relógio de Xadrez & Modos de Tempo**: Bullet, Blitz, Rápido e Sem Limite com acréscimo Fischer por lance.
- 🎓 **Treinador Didático de Erros**: classificação tática automática de erros (*Peça Pendurada*, *Rei Vulnerável*, *Garfo*, *Cravada*, etc.) com diagnósticos personalizados.

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, Stockfish UCI Engine Pool, Google Gen AI SDK (`gemini-2.5-flash`).
- **Lógica de Jogo**: `chess.js`.

## 📜 Licença

Distribuído sob licença MIT. O motor de xadrez [Stockfish](https://stockfishchess.org) é distribuído sob licença GPL-3.0.
