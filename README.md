# XadrezMestre — patch de calibragem de dificuldade

Base analisada: `main` em `a936f903c9a03bb2c981cfa67fe53ee101e0c31b`.

## Achados prioritários

1. `src/utils/remoteEngine.ts`: o fallback local executa sempre `searchBestMove(chess, 4, 600)`, ignorando o nível selecionado.
2. `src/App.tsx`: o livro de aberturas prevalece sobre o nível, inclusive para o iniciante.
3. `server/engine.ts`: `depth` definido faz o backend ignorar `movetime`. O perfil iniciante envia ambos, logo o tempo configurado não é utilizado.
4. Elo exibido na UI e parâmetros enviados ao Stockfish diferem; esses números precisam ser tratados como perfis aproximados, não como rating medido.

## Arquivos de patch

- `src/utils/remoteEngine.ts`: versão completa proposta que corrige fallback fixo, aplica profundidade/tempo por perfil e valida legalidade do lance remoto. `apply-to-main.patch` é um diff parcial de referência; prefira integrar o módulo completo e revisar o código com testes.
- `opening-book.patch`: limita livro de aberturas por nível.
- `server-search.patch`: torna a precedência de `depth`/`movetime` explícita.
- `src/utils/difficulty.ts`: perfis de dificuldade centralizados propostos.
- `src/utils/difficulty.test.ts`: testes para monotonicidade dos perfis e limites do livro (requer Vitest adicionado ao projeto de testes).
- `src/utils/remoteEngine.ts`: versão completa proposta do cliente remoto/fallback.
- `server/engine.ts.notes`: orientação para backend.

## Bloqueio de execução

Não foram feitas alterações no GitHub. O conector retorna `403 Resource not accessible by integration` ao criar branch, issue ou arquivo, apesar de informar `push/admin` nas permissões do repositório. O clone via shell falhou por indisponibilidade de DNS para `github.com`. Portanto não consegui executar `npm run lint`, `npm run build` ou os testes da branch. A PR não foi criada e `main` permaneceu intacta.

## Recomendações antes de merge

1. Aplicar os patches em uma branch dedicada e revisar o diff.
2. Adicionar runner de testes (o `package.json` não possui script/test runner no estado inspecionado) ou adaptar os testes ao runner já usado no ambiente do projeto.
3. Executar `npm ci`, `npm run lint` e `npm run build`.
4. Testar partidas usando o motor remoto e, separadamente, desligando a API para validar o fallback de cada nível.
5. Ajustar os tempos/Elo com partidas reais; desempenho não permite afirmar ELO exato sem medição.
