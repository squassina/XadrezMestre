# XadrezMestre — correção inicial da animação

Patch direcionado a `src/components/ChessBoard.tsx`.

## O que muda

- Evita que o `hover:scale-105` do Tailwind concorra com o `transform` controlado pelo Framer Motion: o hover passa a ocorrer em um elemento filho.
- Corrige a associação de identidade das peças: primeiro identifica o lance origem/destino, depois preserva peças que continuam na mesma casa e só então usa correspondência por tipo/cor. Isso evita que torres/cavalos/bispos idênticos troquem de identidade visual sem necessidade.
- Remove a mutação de `prevPiecesRef` dentro de `useMemo` e atualiza a referência após o commit com `useLayoutEffect`.
- Remove `will-change: transform` permanente de todas as peças para evitar forçar camadas de composição desnecessárias.

## Aplicação

Aplique na raiz do repositório:

```bash
git switch -c fix/smooth-chess-piece-animation
git apply 0001-fix-chess-piece-animation.patch
npm ci
npm run lint
npm run build
```

## Limitações / validação pendente

Este ambiente não conseguiu criar uma branch remota: a integração GitHub retornou `403 Resource not accessible by integration`. O clone também falhou por resolução DNS de `github.com`. Por isso, o patch ainda não foi aplicado no repositório e `npm run lint`, `npm run build` e testes de browser não foram executados. Validar especialmente movimentos normais, capturas, roque, promoção, desfazer/refazer e movimento do jogador de pretas.
