# Relatório técnico — XadrezMestre (versão 2: Stockfish nativo no servidor)

Repositório: `squassina/XadrezMestre` (branch `main`).
Método: clone, `npm ci`, `tsc --noEmit`, leitura do código, e **testes reais** do backend novo com o binário oficial **Stockfish 18** (`stockfish-ubuntu-x86-64-avx2`) rodando neste ambiente.
Não foi possível abrir o app em navegador nem executar Docker/Cloud Run aqui; isso está marcado como "não testado" na seção 11.

> "Starfish" foi lido como **Stockfish**.

---

## 0. Sobre GitHub Actions e GitHub Pages (correção de rota)

Entendi a ideia de usar uma Action, e ela **é central** no plano, mas com outro papel:

- Uma Action **compila** o TypeScript e **publica arquivos estáticos**. O workflow atual (`deploy.yml`) já faz isso: `npm run build` (Vite compila o TS do front) e envia `dist/` ao Pages. Esse código roda **no navegador** do usuário.
- O GitHub Pages **só serve arquivos estáticos**. Ele não mantém um processo Node/Express ligado, nem executa um binário como o Stockfish nativo. Então o `server.ts` e o Stockfish nativo **não podem rodar no Pages**, mesmo que uma Action os compile.
- Para usar Stockfish nativo é preciso um **host que execute o servidor** (Cloud Run, Fly.io, VPS…). A Action entra como **pipeline de deploy** desse host: a cada `push`, compila, valida e publica o backend. É o que a seção 6 entrega (`deploy-backend.yml`).

Se você tinha em mente uma Action específica (por exemplo, uma que publica o servidor em algum serviço), me diga o nome e eu adapto o workflow.

---

## 1. Resumo executivo

1. **Arquitetura-alvo:** front estático no GitHub Pages + **API com Stockfish 18 nativo** em um container (Cloud Run como padrão), deployada por GitHub Actions.
2. O backend foi **construído e testado** com Stockfish 18 real: busca de lance, análise com `multiPV`, e **análise de lance já classificada** (chance de vitória perdida). Valida entrada, limita tempo/profundidade, tem fila, *rate limit*, CORS e encerramento limpo.
3. O cliente (`remoteEngine.ts`) chama a API e **cai para o motor interno** (`search.ts`, Alfa-Beta melhorado) se o servidor estiver fora; testado nos dois cenários.
4. O motor do coach deixa de ser "material + tabelas" e passa a ser Stockfish: isso corrige a maior parte dos problemas de análise do app (seção 3).
5. Licença: rodar o Stockfish **no servidor** não distribui o binário ao usuário, o que reduz muito a preocupação com a GPL que existia no plano de WebAssembly (seção 9). Continua valendo publicar o código e incluir `LICENSE`.
6. Visual (peças e tabuleiro): passo a passo na seção 8, sem mudança em relação à versão anterior.

---

## 2. Arquitetura

```
 Navegador (GitHub Pages, estático)
   React + chess.js  ──►  botMove() / analyzeMoveRemote()
        │                          │ HTTPS + CORS
        │  falhou / demorou?       ▼
        │                 Cloud Run (container)
        ▼                 ├─ Express (server.ts)
  motor interno           ├─ /api/engine/search        → lance + linhas (multiPV)
  (search.ts, reserva)    ├─ /api/engine/analyze-move  → qualidade do lance
                          ├─ /api/engine/health
                          ├─ /api/coach/*  (Gemini, já existia)
                          └─ pool de N processos Stockfish nativos (UCI)

 GitHub Actions
   deploy.yml          → build do front (VITE_API_URL) → Pages
   deploy-backend.yml  → typecheck → build do Dockerfile → Cloud Run
```

Observação: com o backend no ar, as rotas `/api/coach/*` (que hoje quebram em produção no Pages) também passam a funcionar, desde que o front use `VITE_API_URL` para elas (seção 5.4).

---

## 3. Diagnóstico do código atual e o que o Stockfish resolve

Stack: React 19 + Vite + Tailwind 4 + `chess.js`; `server.ts` (Express + Gemini); `src/utils/engine.ts` (542 linhas: avaliação, Alfa-Beta, bots, classificação).

| # | Achado | Resolvido por |
|---|---|---|
| 1 | `analyzeMove` compara avaliação de **busca** (prof. 2) com avaliação **estática** do lance jogado: mistura profundidade com erro | `analyze-move`: mesma profundidade antes/depois |
| 2 | `detectBlunderCategory`: `chessAfter.inCheck()` após o seu lance indica que **você deu xeque**, mas vira "Rei Vulnerável" | **Não** resolvido pelo motor: corrigir na lógica de categorias |
| 3 | Sem busca de quiescência (efeito horizonte) | Stockfish (e `search.ts` na reserva) |
| 4 | Mate vale ±20000 fixo, sem distância | Stockfish (`mate N`); `search.ts` na reserva |
| 5 | Cache por FEN completa, limpo ao chegar a 5000 | Some: o servidor não usa mais |
| 6 | "Aleatoriedade" do bot sorteia entre os 3 primeiros lances da ordenação (capturas/xeques), não entre os melhores | `Skill Level` / `UCI_Elo` + erro injetado |
| 7 | Busca na thread principal: UI trava em prof. 3 | Busca sai do navegador |
| 8 | `chess.js` `moves({verbose:true})` = **2,2 ms** por chamada (`moves()` texto: 0,08 ms) | Servidor nativo; `search.ts` usa texto |
| 9 | Avaliação só de material + tabelas de casas | Stockfish (NNUE) |
| 10 | Barra de avaliação mostra avaliação **estática** | Usar `cpAfter` do `analyze-move` |
| 11 | Pages é estático: `/api/coach/*` não existe em produção | Backend + `VITE_API_URL` |
| 12 | `server.ts` usa o modelo `gemini-3.8-flash`; não consegui confirmar que exista | Conferir na documentação do Gemini |
| 13 | Sem `LICENSE`, `README`, testes; `index.html` tem remendo de WebSocket do AI Studio | Seção 10 |

---

## 4. Backend do motor (construído e testado)

Arquivos em `codigo/` (espelham os caminhos do repositório):

| Arquivo | Função |
|---|---|
| `server/engine.ts` | `EnginePool`: N processos Stockfish via UCI (stdin/stdout), fila, reinício após falha, `search()` e `analyzeMove()` |
| `server/engineRoutes.ts` | Rotas HTTP, validação, *rate limit* por IP |
| `alteracoes-server-engine-deploy.patch` | Mudanças em `server.ts` (CORS, `trust proxy`, SIGTERM, rotas), `engine.ts` (exporta tabelas), `deploy.yml` e `.env.example` |
| `src/utils/remoteEngine.ts` | Cliente: `botMove`, `analyzeMoveRemote`, `warmUp`, níveis dos bots |
| `src/utils/search.ts` | Alfa-Beta melhorado (reserva offline) |
| `Dockerfile`, `.dockerignore` | Imagem Node 22 + binário oficial do Stockfish |
| `.github/workflows/deploy-backend.yml`, `deploy.yml` | Pipelines |

### 4.1 API

`POST /api/engine/search`
```json
{ "fen": "...", "movetime": 500, "depth": null, "multiPV": 1, "skill": 20, "elo": null }
```
Resposta: `{ bestMove: "e2e4", san: "e4", lines: [{ multipv, depth, cp|mate, pv[] }], engine: "Stockfish 18", ms }`.
Placares `cp`/`mate` vêm **do ponto de vista de quem joga** (padrão UCI).

`POST /api/engine/analyze-move`
```json
{ "fen": "<posição ANTES>", "move": "Qxf7#" , "depth": 12 }   // move em SAN ou UCI
```
Resposta: `{ bestMove, bestSan, playedSan, cpBefore, cpAfter, lossPct, quality, pv, engine }`.
`cpBefore`/`cpAfter` já vêm **do ponto de vista das brancas** (para a barra de avaliação). `lossPct` = pontos percentuais de chance de vitória perdidos (curva do Lichess). Classificação: melhor lance = `best`; perda ≥15 = `blunder`; ≥10 = `mistake`; ≥5 = `inaccuracy`; ≥2 = `good`; senão `excellent`. **Limiares inspirados no Lichess; calibre com seus jogos** (veja o resultado do `1.f3` abaixo).

`GET /api/engine/health` → `{ ok, pool, queued }`.

### 4.2 Proteções implementadas

- FEN validada com `chess.js` no servidor; partida terminada é rejeitada.
- Limites: `movetime` 50–5000 ms, `depth` ≤ 30 (≤ 20 na análise), `multiPV` ≤ 5, `UCI_Elo` 1320–3190, `skill` 0–20.
- Fila com teto (50) → `503` quando cheia; *timeout* por busca com reinício do processo.
- *Rate limit* por IP (padrão 20 req / 10 s), corpo JSON ≤ 20 KB.
- CORS por lista (`ALLOWED_ORIGIN`). **CORS não é segurança contra `curl`**: o teto de custo real é `--max-instances` + *rate limit*.
- `SIGTERM` fecha os processos Stockfish (sem órfãos).

### 4.3 Resultados dos testes (Stockfish 18 oficial, 1 vCPU)

| Teste | Resultado |
|---|---|
| Mate em 1 (`Qxf7#`) | achou, `mate 1`, 302 ms |
| Meio-jogo, prof. 14, `multiPV 3` | 3 linhas (+0,82 / +0,68 / +0,56), 480 ms |
| `UCI_Elo 1350` | aceito, joga `e4` |
| 4 requisições simultâneas, pool = 1, 400 ms cada | 1740 ms no total: a fila serializa corretamente |
| FEN inválida / sem FEN / partida acabada | `400` com mensagem |
| 25 requisições rápidas (limite 20/10 s) | primeiras `200`, depois `429` |
| CORS | origem permitida recebe `Access-Control-Allow-Origin`; outra origem não recebe (o navegador bloqueia) |
| `analyze-move`: `Qxf7#` | `best`, perda 0 |
| `analyze-move`: `Qxe5+??` (perde a dama, ignorando mate em 1) | `blunder`, perda ≈ 91 pts |
| `analyze-move`: mate entregue (mate do tolo, `Qh4#`) | `best` |
| `analyze-move`: `1.f3` na posição inicial | `mistake`, perda 11,6 pts (**limiar duro para abertura**; considere suavizar nos primeiros lances) |
| `SIGTERM` no processo Node | servidor encerra, 0 Stockfish órfãos (use `node --import tsx server.ts`; `npm start`/wrappers podem não repassar o sinal) |
| Cliente com servidor | `source: 'stockfish'` |
| Cliente com servidor inacessível | bot cai para `source: 'interno'` (achou `Qxf7#`); análise devolve `null` |
| `vite build` com `VITE_API_URL` | a URL entra no bundle; `tsc --noEmit` sem erros; YAML dos workflows válido |

### 4.4 Níveis dos bots (ponto de partida)

`UCI_Elo` no Stockfish 18 vai de **1320 a 3190** (confirmado no binário). Abaixo de 1320 use `Skill Level` baixo + profundidade curta.

| Bot | Config em `BOT_ENGINE` |
|---|---|
| Sofia Novata (800) | `skill 0`, `depth 1`, `movetime 100` (+ `blunderChance` do app) |
| Carlos Estrategista (1350) | `elo 1400`, 250 ms |
| Dra. Helena (1750) | `elo 1800`, 400 ms |
| GM Mikhail (2200) | `elo 2300`, 800 ms |
| (novo) Máquina | `skill 20`, sem `elo`, 2000 ms |

Elo do Stockfish limitado não equivale a Elo humano: calibre jogando partidas. Não testei a força real desses perfis.

### 4.5 "Ou melhor que Stockfish"

No servidor você pode ir além do que o navegador permite, sem trocar de motor:

- **Threads / Hash maiores** para a "análise profunda pós-partida" (um endpoint separado com `Threads` = vCPUs).
- **Tabelas Syzygy** para finais perfeitos (centenas de MB; opcional).
- Motores de rede neural (Lc0) exigem GPU para valer a pena; não recomendo para este projeto.

---

## 5. Integração no front

### 5.1 Variável de ambiente
`VITE_API_URL` = URL do serviço (sem barra no fim). Em produção vem de `vars.API_URL` do repositório (o `deploy.yml` já passa). Local: `.env` com `VITE_API_URL=http://localhost:3000`.

### 5.2 Lance do bot (`App.tsx`, `makeBotMove`)

```ts
import { botMove, BOT_ENGINE, warmUp } from './utils/remoteEngine';

// uma vez, ao abrir o app (acorda o Cloud Run)
useEffect(() => { warmUp(); }, []);

// dentro de makeBotMove (agora async)
const ctrl = new AbortController();
botAbort.current?.abort();      // useRef<AbortController|null>
botAbort.current = ctrl;
setIsBotThinking(true);

// o livro de aberturas continua vindo primeiro (getBookMove); só chame o motor se não houver lance de livro
const r = await botMove(currentGame.fen(), BOT_ENGINE[currentBot], ctrl.signal);
const botMoveObj = currentGame.moves({ verbose: true })
  .find((m) => m.from === r.from && m.to === r.to && (m.promotion ?? '') === (r.promotion ?? ''));
```
Cancele (`ctrl.abort()`) ao desfazer lance ou iniciar nova partida, e ignore respostas atrasadas.

### 5.3 Análise do lance (substitui `analyzeMoveAsync`)

```ts
import { analyzeMoveRemote } from './utils/remoteEngine';

const a = await analyzeMoveRemote(fenBefore, playedSan, 12);
if (a) {
  analyzed.quality      = a.quality === 'brilliant' ? 'best' : a.quality;
  analyzed.qualityLabel = a.quality === 'brilliant' ? 'Excelente' : analyzed.qualityLabel;
  analyzed.evalBefore   = a.cpBefore;   // centipawns, lado das brancas
  analyzed.evalAfter    = a.cpAfter;
  analyzed.evalDiff     = Math.round(a.lossPct * 10);   // ou adapte os limiares do app
  analyzed.bestMoveSan  = a.bestSan ?? undefined;
  setEvalScore(a.cpAfter);              // barra de avaliação passa a mostrar valor real
}
// se a === null (servidor fora): mantenha o comportamento atual ou esconda a análise
```
A categoria do erro (`Peça Pendurada`, `Garfo`...) continua sendo da `detectBlunderCategory`: corrija o achado nº 2 e, se quiser, use a linha `pv` para melhorar as dicas.

### 5.4 Rotas do coach
Troque `fetch('/api/coach/explain'…)` (`App.tsx` ~l.473) e `fetch('/api/coach/diagnostics'…)` (`MistakeAnalytics.tsx` ~l.51) por `fetch(`${API}/api/coach/...`)`, exportando `API` de `remoteEngine.ts` (ou de um `config.ts`).

---

## 6. Deploy com GitHub Actions

### 6.1 Fluxo
1. `push` em `main` que altere `server/**`, `server.ts`, `Dockerfile` ou dependências → `deploy-backend.yml` roda `npm ci`, `npm run lint` e faz o **build do Dockerfile + deploy no Cloud Run** (`google-github-actions/deploy-cloudrun`, com `source: .`).
2. Copie a URL do serviço para a variável do repositório `API_URL`.
3. `push` em `main` → `deploy.yml` gera o front com `VITE_API_URL` e publica no Pages.

### 6.2 Configuração única no Google Cloud (resumo)
- Projeto com as APIs **Cloud Run**, **Cloud Build** e **Artifact Registry** ativas.
- Conta de serviço para o deploy + **Workload Identity Federation** com o repositório (autenticação sem chave JSON).
- Variáveis do repositório: `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GCP_REGION`, `API_URL`.
- Para o coach: secret `GEMINI_API_KEY` no Secret Manager e descomente `secrets:` no workflow.
- Siga a documentação oficial de `google-github-actions/auth` e `deploy-cloudrun` para os papéis (IAM) exigidos; **não testei** esse pipeline aqui.

Observação: o `.env.example` original já cita "Cloud Run service URL" (o projeto nasceu no AI Studio, que publica no Cloud Run), então esse host é o caminho mais natural. Alternativas: **Fly.io** (máquina persistente, `flyctl-actions`), **Render/Railway** (deploy automático do repo + Dockerfile) ou uma VPS.

### 6.3 Dockerfile
Baixa o binário oficial do Stockfish por tag. Verifiquei que `sf_18` tem os binários `avx2`, `bmi2`, `sse41-popcnt` e genérico para Ubuntu x86-64. A tag mais recente nos *releases* era `sf_19`, mas os nomes de arquivo usados aqui retornaram 404 nela, por isso o `Dockerfile` fixa **`sf_18`** (`ARG SF_TAG`). Para atualizar, confira os nomes dos *assets* da nova versão. Se o host não tiver AVX2 (ou for ARM), troque `SF_BUILD` (para ARM, use o *asset* ARM correspondente; não testei).

Dimensionamento sugerido: `ENGINE_POOL` = nº de vCPUs; 2 vCPU / 1 GiB; `--max-instances` baixo para limitar custo.

---

## 7. Capacidade, latência, custo e segurança

- **Latência de um lance do bot** ≈ ida e volta de rede (50–200 ms) + `movetime` (100–800 ms). Boa para jogo.
- **Partida a frio** (Cloud Run em 0 instâncias): inicia Node + Stockfish, alguns segundos na primeira chamada. Mitigação: `warmUp()` ao abrir o app e/ou `--min-instances=1` (custo contínuo; confira preços atuais).
- **Capacidade:** cada processo atende uma busca por vez. Um bot a 400 ms ocupa ~0,4 s de CPU por lance; com 2 processos, dezenas de partidas simultâneas cabem em uma instância. A análise (duas buscas por lance) pesa mais; use profundidade 10–12.
- **Abuso:** API pública gera custo. Camadas: `--max-instances`, *rate limit* (já), limites de parâmetros (já). Se necessário: token por sessão ou Cloudflare Turnstile.
- **Reserva offline:** `search.ts` mantém o jogo funcionando (mais fraco) se o servidor cair.

---

## 8. Peças e tabuleiro — como melhorar

### 8.1 Estado atual

- `ChessPiece.tsx`: SVGs inline desenhados à mão (peão, cavalo, bispo, torre, dama, rei) com preenchimento chapado, torre e rei bem simplificados, sem sombra.
- `ChessBoard.tsx`: 64 `div` com classes Tailwind de cor (3 temas), marcador de lance legal em âmbar, setas em SVG.
- Peças usam **HTML5 drag-and-drop**, que **não funciona em telas de toque** (celular/tablet). Esse é o maior problema de usabilidade.
- Sem animação de deslizar a peça; sem destaque de captura em estilo "anel"; seta termina no centro da casa (cobre a peça); marcadores de seta com `markerUnits` padrão escalam com a espessura e ficam grandes.

### 8.2 Peças: passo a passo

**Opção 1 (recomendada): conjuntos de peças em SVG prontos.**

1. Escolha um conjunto. O repositório `lichess-org/lila` (`public/piece/`) tem dezenas (cburnett, merida, staunty, cardinal, alpha, etc.). **As licenças variam por conjunto** (alguns são GPL, outros Creative Commons com restrições); leia o arquivo de licença de cada pasta antes de usar.
2. Copie os 12 SVGs para `public/pieces/<conjunto>/` com nomes `wK.svg … bP.svg`.
3. Troque `ChessPiece.tsx` por uma versão que usa `<img>`:

```tsx
import { PieceSymbol, Color } from 'chess.js';

export const ChessPiece = React.memo(({ type, color, set = 'cburnett', className = 'w-full h-full' }: {
  type: PieceSymbol; color: Color; set?: string; className?: string;
}) => (
  <img
    src={`${import.meta.env.BASE_URL}pieces/${set}/${color}${type.toUpperCase()}.svg`}
    alt={`${color === 'w' ? 'branca' : 'preta'} ${type}`}
    draggable={false}
    className={`${className} pointer-events-none select-none piece-shadow`}
  />
));
```

4. Sombra suave que dá "volume":

```css
.piece-shadow { filter: drop-shadow(0 2px 1.5px rgb(0 0 0 / 0.35)); }
```

5. Seletor de conjunto: guarde `pieceSet` no estado (como o `boardTheme`) e no `localStorage`; adicione um `<select>` no `TopNav.tsx`.

**Opção 2: manter SVG inline**, mas substituir os `<path>` por desenhos de boa qualidade (os mesmos conjuntos acima) e usar contorno fino + leve gradiente. Dá mais trabalho e o resultado é igual ao da opção 1.

### 8.3 Tabuleiro: passo a passo

1. **Temas por variáveis CSS** (em vez de classes Tailwind arbitrárias), assim cada tema vira um bloco de CSS:

```css
.board-brown   { --sq-light:#f0d9b5; --sq-dark:#b58863; --sq-hi:rgba(255,255,0,.35); }
.board-green   { --sq-light:#eeeed2; --sq-dark:#769656; --sq-hi:rgba(255,255,0,.40); }
.board-blue    { --sq-light:#dee3e6; --sq-dark:#8ca2ad; --sq-hi:rgba(20,85,220,.30); }
.board-walnut  { --sq-light:#d9b98a; --sq-dark:#8b5a2b; --sq-hi:rgba(255,215,0,.35); }
.sq-light { background: var(--sq-light); color: var(--sq-dark); }
.sq-dark  { background: var(--sq-dark);  color: var(--sq-light); }
```

   Aplique `board-<tema>` no contêiner e `sq-light`/`sq-dark` nas casas. Cor das coordenadas = cor oposta da casa (já é o efeito do `color` acima).

2. **Textura de madeira** (opcional) por cima da cor, com ruído SVG embutido:

```css
.board-walnut .sq-light, .board-walnut .sq-dark {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.02 .6' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-blend-mode: multiply;
}
```

3. **Moldura e profundidade**: borda externa de 8–12 px com gradiente escuro, `box-shadow: 0 20px 40px -12px rgb(0 0 0 / .6), inset 0 0 0 1px rgb(255 255 255 / .06)`. Coordenadas podem ir na moldura em vez de dentro das casas.
4. **Destaques** (estilo Lichess): lance anterior = sobreposição `--sq-hi`; seleção = mesma sobreposição mais forte; xeque = `radial-gradient(ellipse at center, rgba(255,0,0,1) 0%, rgba(231,0,0,1) 25%, rgba(169,0,0,0) 89%)` sobre a casa do rei (em vez de pulsar a casa inteira).
5. **Marcadores de lance legal**: bolinha cinza translúcida (≈30 % da casa) para casa vazia; **anel** ou cantos para captura. O âmbar atual compete com as setas.
6. **Setas**: encurte a seta antes do centro da casa de destino, use `markerUnits="userSpaceOnUse"` nos `<marker>` e desenhe a cabeça como polígono; opcional: desenhar setas com botão direito.

### 8.4 Animação de movimento

O pacote `motion` já está nas dependências. Anime a peça que acabou de se mover (`lastMove.to`) deslizando da casa de origem:

```tsx
// dentro da casa 'to' do último lance; dx/dy = deslocamento em casas (origem - destino)
const dx = (fileIdx(from) - fileIdx(to)) * 100;   // em % do tamanho da casa
const dy = (rankIdx(from) - rankIdx(to)) * 100;

<motion.div
  key={`${square}-${fen}`}
  initial={{ x: `${dx}%`, y: `${dy}%` }}
  animate={{ x: 0, y: 0 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
  className="w-full h-full flex items-center justify-center"
>
  <ChessPiece ... />
</motion.div>
```

Observação: `%` em `x/y` é relativo ao próprio elemento; deixe o `motion.div` com 100 % da casa (aplique o *padding* dentro dele, não no tamanho do `div`). Respeite `prefers-reduced-motion`.

### 8.5 Toque e arrastar com *Pointer Events* (importante)

Troque `draggable`/`onDragStart`/`onDrop` por Pointer Events, que funcionam com mouse, toque e caneta:

1. No contêiner do tabuleiro: `style={{ touchAction: 'none' }}`.
2. `onPointerDown` na peça: guardar casa de origem, `setPointerCapture`, criar uma "peça fantasma" que segue o dedo (posição `fixed`/`absolute` pelo `clientX/Y`).
3. `onPointerMove`: atualizar posição da fantasma.
4. `onPointerUp`: descobrir a casa sob o ponteiro com `document.elementFromPoint` (ou calculando pelo retângulo do tabuleiro) e chamar `executeMove`.
5. Manter também o clique-clique (já existe), que continua funcionando.

### 8.6 Alternativa: usar a biblioteca Chessground

`chessground` é o tabuleiro do Lichess: toque, arrastar, animação, setas, *premoves*, temas de peças e tabuleiro prontos. Troca grande (é imperativa, não React) e é **GPL-3.0**, o que combina com a licença do Stockfish. Reduz muito o código de `ChessBoard.tsx`, mas muda a arquitetura dos puzzles e das setas do coach.

---

## 9. Licença (não sou advogado)

- **Stockfish é GPL-3.0.** Rodar o Stockfish **no seu servidor** e devolver lances por HTTP **não distribui** o programa ao usuário (a GPL-3.0 não tem a cláusula de uso em rede da AGPL). Isso é bem mais simples do que embutir WebAssembly no site, que distribuiria o motor a cada visitante.
- Se você **distribuir** a imagem Docker (por exemplo, em registro público), aí sim distribui o binário: mantenha o aviso de licença (o `Dockerfile` já copia `Copying.txt` e `AUTHORS`) e ofereça o código-fonte.
- Boa prática: adicionar `LICENSE` ao repositório, mencionar o Stockfish em um `README`/`NOTICE` e manter o código público.
- Conjuntos de peças têm licenças próprias (seção 8.2).

---

## 10. Roteiro sugerido

| Fase | Tarefa | Esforço |
|---|---|---|
| 0 | Aplicar o `.patch`, adicionar `server/`, `search.ts`, `remoteEngine.ts`; rodar local com `apt install stockfish` | P |
| 1 | Corrigir achados 2, 11, 12 e 13; `LICENSE`/`README` | P |
| 2 | Integrar `botMove` e `analyzeMoveRemote` no `App.tsx` (seção 5) | M |
| 3 | Deploy: Dockerfile + Cloud Run + variáveis + `deploy-backend.yml` | M |
| 4 | Calibrar níveis dos bots e limiares do coach com partidas reais | M |
| 5 | Visual: peças, tabuleiro, animação, toque (seção 8) | M |
| 6 | (Opcional) endpoint de análise profunda com `Threads`/Syzygy; proteção anti-abuso | M |

Teste local rápido do backend (sem Docker):
```bash
sudo apt install stockfish                       # fica em /usr/games/stockfish
STOCKFISH_PATH=/usr/games/stockfish ENGINE_POOL=2 npm run dev
curl -X POST localhost:3000/api/engine/search -H 'content-type: application/json' \
  -d '{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","movetime":300}'
```
(O `apt` instala o Stockfish 16; o Dockerfile usa o 18.)

---

## 11. O que foi e não foi testado

**Testado aqui:** `EnginePool` e rotas com Stockfish 18 real (tabela 4.3); `server.ts` em modo produção (health, CORS, coach em modo *fallback*, SIGTERM); cliente com e sem servidor; `search.ts` (mates e comparação com o motor antigo); `tsc --noEmit`; `vite build` com `VITE_API_URL`; sintaxe YAML dos workflows.

**Não testado:** build do `Dockerfile` (sem Docker neste ambiente); deploy no Cloud Run e autenticação por Workload Identity; chamadas do navegador reais (CORS na prática, *cold start*); integração no `App.tsx` (apenas descrita na seção 5); força real dos bots por nível; atualização para `sf_19`.

---

## 12. Arquivos entregues

`codigo-stockfish-servidor.zip` contém a pasta `codigo/` completa:
`server/engine.ts`, `server/engineRoutes.ts`, `src/utils/search.ts`, `src/utils/remoteEngine.ts`, `Dockerfile`, `.dockerignore`, `.github/workflows/deploy-backend.yml`, `.github/workflows/deploy.yml` e `alteracoes-server-engine-deploy.patch` (mudanças em `server.ts`, `engine.ts`, `deploy.yml` e `.env.example`).
Aplicar: copie os arquivos novos para o repositório e rode `git apply codigo/alteracoes-server-engine-deploy.patch`.
