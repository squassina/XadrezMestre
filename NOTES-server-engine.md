# Server engine notes

O diff `server-search.patch` deixa a precedência explícita, mas o desenho recomendado é que o fluxo de jogo (`BOT_ENGINE`) envie apenas `movetime`, reservando `depth` para operações de análise. Foi identificado que o perfil iniciante original enviava `{ movetime: 100, skill: 0, depth: 1 }`, fazendo `server/engine.ts` preferir `go depth 1` e descartar o tempo solicitado.

O backend já reseta `UCI_LimitStrength` e `Skill Level`/`UCI_Elo` em cada busca. Validar os valores de `UCI_Elo` no binário de Stockfish distribuído pela imagem de produção; os valores apresentados na interface são objetivos de calibragem, não ELO medido empiricamente.
