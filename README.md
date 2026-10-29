# XadrezMestre ♟️

**Jogue xadrez, entenda suas decisões e evolua a cada partida.**

O XadrezMestre é um jogo de xadrez com adversários automáticos de diferentes níveis e ferramentas de treinamento. Além de jogar uma partida completa, você pode revisar seus lances, estudar padrões táticos e acompanhar estatísticas para identificar o que precisa melhorar.

## ✨ O que você pode fazer

- **Jogar contra o computador:** escolha entre quatro adversários, de iniciante a mestre, e ajuste o desafio ao seu momento.
- **Configurar a partida:** escolha jogar de brancas ou pretas, defina o ritmo do relógio e personalize o conjunto de peças.
- **Escolher o ritmo:** use partidas rápidas ou jogue sem limite de tempo para pensar com calma.
- **Receber análise dos lances:** consulte a avaliação das jogadas, a qualidade atribuída a cada lance e, quando disponível, uma alternativa recomendada.
- **Aprender com o treinador:** receba explicações e dicas relacionadas aos conceitos táticos e posicionais identificados na partida.
- **Estudar aberturas:** explore nomes, ideias e sugestões de lances de uma base de aberturas.
- **Resolver exercícios táticos:** pratique combinações e padrões, como peças penduradas, garfos, cravadas e oportunidades táticas.
- **Acompanhar seu progresso:** veja estatísticas de partidas, exercícios, sequências de acertos e erros recorrentes.
- **Personalizar o tabuleiro:** selecione temas visuais e conjuntos de peças disponíveis.

> Os recursos de análise e sugestões são ferramentas de estudo. A avaliação de um lance pode variar conforme o mecanismo, a profundidade de cálculo e a posição.

## ♟️ Como jogar

1. **Inicie uma partida.** Abra a configuração de nova partida.
2. **Escolha o adversário.** Comece pelo nível que permita partidas desafiadoras, mas administráveis.
3. **Configure o jogo.** Selecione sua cor, o controle de tempo e as opções de visualização e treinador.
4. **Faça seus lances.** Selecione uma peça e depois a casa de destino, respeitando as regras do xadrez.
5. **Observe a resposta do computador.** O adversário joga automaticamente quando chega a sua vez.
6. **Acompanhe o relógio e o histórico.** Em partidas com tempo, administre seus segundos. Use o histórico e as análises para entender decisões importantes.
7. **Revise e pratique.** Ao terminar, examine os lances e treine os temas que causaram mais dificuldades.

### Controles de tempo

O jogo oferece os seguintes controles:

| Controle | Tipo | Como funciona |
|---|---|---|
| 1 min | Bullet | Partida de ritmo extremamente rápido, sem incremento. |
| 2+1 | Bullet | 2 minutos iniciais e 1 segundo de incremento por lance. |
| 3 min | Blitz | 3 minutos iniciais, sem incremento. |
| 3+2 | Blitz | 3 minutos iniciais e 2 segundos por lance. |
| 5 min | Blitz | 5 minutos iniciais, sem incremento. |
| 5+3 | Blitz | 5 minutos iniciais e 3 segundos por lance. |
| 10 min | Rápido | 10 minutos iniciais, sem incremento. |
| 15+10 | Rápido | 15 minutos iniciais e 10 segundos por lance. |
| Sem Tempo | Livre | Sem relógio, ideal para estudar e calcular variantes. |

O incremento é acrescentado ao relógio do jogador após cada lance, de acordo com o controle escolhido.

### Ajuste da profundidade tática

Na configuração da partida, o controle **Profundidade tática (maxQuiescenceDepth)** permite ajustar o desafio de 1 a 12. Valores menores limitam a busca tática adicional do mecanismo interno de reserva; valores maiores permitem examinar sequências de capturas e promoções mais longas, com possível aumento do tempo de cálculo. Quando Stockfish remoto está disponível, o ajuste também desloca a força solicitada ao motor (e, portanto, pode tornar o adversário mais fácil ou mais difícil). O Stockfish mantém sua própria busca quiescente interna, que não é diretamente configurável por esse parâmetro. A preferência fica salva localmente no navegador.

### Variantes calculadas pelo computador

Durante o turno do computador, o jogo exibe um estado de cálculo e, ao concluir a busca, mostra até três linhas candidatas em notação algébrica (SAN), incluindo a linha principal e alternativas. As variantes vêm do recurso MultiPV do Stockfish quando o motor remoto está disponível; o mecanismo interno de reserva pode fornecer uma linha mais curta. Elas representam resultados do cálculo da posição, não uma transcrição de pensamento humano, e podem mudar conforme tempo, profundidade e posição.

### Escolha de cor e troca de adversário

Você pode jogar com as brancas ou com as pretas. Quando escolhe as pretas, o computador faz o primeiro lance. A opção **Trocar Bot** permite alterar o nível do adversário sem precisar alterar as demais configurações da partida.

Ao iniciar uma nova partida enquanto outra ainda está em andamento, o jogo pede confirmação porque a partida atual e seu histórico serão descartados.

## 🤖 Como funciona o ELO dos adversários automáticos

O jogo oferece quatro perfis de adversário. Cada um tem um **ELO indicativo**, usado para comunicar aproximadamente o nível de desafio pretendido.

| Adversário | ELO indicativo | Perfil |
|---|---:|---|
| Sofia Novata — Iniciante | 800 | Comete erros simples com mais frequência e pode deixar peças sem proteção. |
| Carlos Estrategista — Intermediário | 1350 | Resolve trocas simples, mas pode falhar em planos de longo prazo. |
| Dra. Helena — Avançado | 1750 | Calcula melhor as táticas e pressiona estruturas de peões. |
| GM Mikhail — Mestre | 2200 | Usa busca mais profunda e tende a escolher lances mais consistentes. |

### O que determina a força do bot?

A configuração de cada adversário combina vários parâmetros:

- **Profundidade de busca:** quantos lances futuros o mecanismo considera durante a análise. Em geral, uma busca mais profunda pode encontrar recursos táticos melhores, mas exige mais processamento.
- **Análise de posições futuras:** o mecanismo avalia material, posicionamento das peças e estrutura de peões, entre outros fatores.
- **Variação na escolha de lances:** os perfis mais baixos permitem mais escolhas subótimas e têm maior chance configurada de erro. Os níveis superiores reduzem esses fatores.
- **Livro de aberturas:** quando uma posição está cadastrada, o computador pode selecionar um lance de abertura ponderado por pesos de frequência. O uso desse livro tem um limite de meios-lances que varia por nível: 4 para Iniciante, 12 para Intermediário, 20 para Avançado e 30 para Mestre. Depois do limite, o bot passa a depender do mecanismo de cálculo para escolher o lance.

### O ELO é uma estimativa, não uma classificação oficial

Os valores 800, 1350, 1750 e 2200 são rótulos de dificuldade definidos na configuração do jogo. **Não são ratings oficiais obtidos em torneios, nem uma medição garantida da força real do mecanismo.** A força percebida também depende da posição, do tempo disponível, do uso do livro de aberturas e do comportamento de busca.

O ELO do adversário não é o mesmo que o **rating tático do jogador** exibido nas estatísticas. O rating tático acompanha o desempenho nos exercícios; ele não deve ser interpretado como um rating FIDE ou como uma classificação competitiva oficial.

## 📈 Como melhorar seu xadrez com o XadrezMestre

Uma rotina simples e consistente costuma ser mais útil do que jogar muitas partidas sem revisão.

1. **Escolha um nível adequado.** Se perder peças em um lance ou não conseguir terminar o desenvolvimento, pratique com o nível iniciante. Se vencer com facilidade e identificar os planos do bot, aumente a dificuldade.
2. **Revise os momentos críticos.** Procure lances classificados como imprecisões, erros ou falhas graves. Pergunte: “O que meu adversário ameaçava?” e “Minha peça ficará protegida depois deste lance?”.
3. **Resolva exercícios táticos regularmente.** Antes de mover, procure xeques, capturas e ameaças para ambos os lados. Tente calcular a resposta do adversário antes de confirmar a solução.
4. **Proteja suas peças.** Verifique quais peças estão atacadas e quantas vezes cada casa ou peça está defendida.
5. **Desenvolva as peças e cuide do rei.** Na abertura, dispute o centro, desenvolva cavalos e bispos, e procure rocar em segurança quando apropriado.
6. **Use partidas sem tempo para aprender.** Calcule variantes e compare suas ideias com as sugestões do treinador sem a pressão do relógio.
7. **Observe padrões, não apenas lances isolados.** Se as estatísticas mostram repetidamente garfos sofridos, peças penduradas ou reis vulneráveis, dedique exercícios a esse tema.
8. **Aumente a dificuldade gradualmente.** Busque partidas em que precise pensar, mas ainda consiga entender os motivos das decisões.

### Uma lista de verificação antes de cada lance

- Meu rei está em segurança?
- O adversário ameaça capturar alguma peça ou dar xeque-mate?
- Minha jogada deixa uma peça desprotegida?
- Tenho algum xeque, captura ou ameaça forte?
- Qual é a resposta mais provável do adversário?

## 🎨 Personalização

O jogo inclui temas de tabuleiro e conjuntos de peças selecionáveis. Escolha uma combinação confortável para você e mantenha contraste suficiente entre as casas e as peças para reconhecer padrões rapidamente. As preferências visuais são guardadas localmente no navegador quando o armazenamento está disponível.

## 🧠 Como o jogo pode ficar ainda melhor

A qualidade do XadrezMestre pode ser aprimorada continuamente em quatro frentes:

### 1. Força e consistência do adversário
- Comparar cada nível com partidas de referência e ajustar os ELOs indicativos com base em resultados reais.
- Medir taxa de vitória, precisão média e frequência de erros em conjuntos de posições reproduzíveis.
- Testar o mecanismo em aberturas, meio-jogo, finais, xeques, capturas, promoções e posições táticas.
- Tornar explícito quando uma sugestão vem do livro de aberturas e quando vem do mecanismo de cálculo.

### 2. Análise e qualidade pedagógica
- Explicar não apenas que um lance foi ruim, mas qual ameaça foi ignorada e qual plano alternativo era melhor.
- Distinguir claramente avaliação aproximada, melhor lance encontrado e feedback gerado por IA.
- Incluir exemplos de variantes curtas que o jogador possa reproduzir no tabuleiro.
- Verificar a consistência entre a avaliação numérica, a classificação do lance e a explicação textual.

### 3. Experiência de uso e acessibilidade
- Garantir que o tabuleiro funcione bem com mouse, toque, teclado e leitores de tela.
- Manter animações suaves em movimentos normais, capturas, roque, promoção e mudanças de orientação.
- Oferecer controles claros para desfazer, refazer, reiniciar e revisar a partida, quando disponíveis.
- Testar layouts em telas pequenas, foco de teclado, contraste e mensagens de confirmação.

### 4. Confiabilidade e desempenho
- Automatizar testes de regras, lances legais, relógio, incremento, final de partida e persistência de estatísticas.
- Medir tempos de resposta do mecanismo e manter uma alternativa quando o serviço remoto não estiver disponível.
- Executar lint, testes automatizados e build em cada alteração.
- Validar manualmente os fluxos principais no navegador e monitorar erros após a publicação.

Esses pontos são oportunidades de evolução; não significam que todas essas melhorias já estejam implementadas.

## 📚 Créditos, peças e licenças de terceiros

Os conjuntos de peças de xadrez distribuídos em `public/pieces/` foram obtidos/adaptados a partir do repositório de código aberto **[Lichess `lila`](https://github.com/lichess-org/lila)**. Consulte também o [inventário oficial de direitos autorais e licenças do Lichess (`COPYING.md`)](https://github.com/lichess-org/lila/blob/master/COPYING.md), que discrimina autores e condições por conjunto/arquivo. Os arquivos de terceiros continuam sujeitos às suas licenças originais; a licença MIT deste projeto não as substitui.

**Atenção antes de redistribuir ou usar comercialmente:** o inventário upstream lista o conjunto `cburnett` como GPL-2.0-or-later, `merida` como GPL-2.0-or-later e `alpha` como “free for personal non commercial use”. Portanto, não presuma que todos os conjuntos podem ser usados comercialmente sob a licença MIT do XadrezMestre. O conjunto `alpha` deve ser substituído ou ter sua autorização/licença esclarecida antes de qualquer uso comercial. Para o conjunto local `staunty`, confirme a origem e a licença específica dos arquivos: o nome da pasta, por si só, não comprova que corresponda ao conjunto “Staunton” listado no inventário upstream.

O motor de xadrez usado no backend é **[Stockfish](https://github.com/official-stockfish/Stockfish)**, software livre sob a **GNU GPL v3**. O `Dockerfile` baixa o binário oficial da versão `sf_18` e o instala em `/usr/local/bin/stockfish`; a rota do backend usa esse executável para busca e análise. Ao distribuir uma imagem ou binário que inclua Stockfish, cumpra a GPLv3, incluindo a licença e o código-fonte correspondente (ou uma referência válida para obtê-lo), conforme as exigências aplicáveis. Se o serviço remoto não estiver disponível, o frontend possui um mecanismo interno de fallback, que não é Stockfish.

Veja o arquivo [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) para um resumo dos componentes e avisos de licença.

## 🛠️ Tecnologias e desenvolvimento

O projeto utiliza React, TypeScript e Vite na interface, chess.js para regras e estado da partida, Tailwind CSS para estilos e Framer Motion para animações. O código também inclui lógica de avaliação local e integração com um mecanismo remoto para apoiar as jogadas e análises.

### Requisitos

- Node.js compatível com as versões declaradas em package.json
- npm

### Executar localmente

    npm ci
    npm run dev

### Validar as alterações

    npm run lint
    npm test
    npm run build

- **npm run lint:** verifica os tipos TypeScript.
- **npm test:** executa a suíte de testes Vitest.
- **npm run build:** gera a versão de produção.

## 🤝 Contribuições

Contribuições são bem-vindas. Para mudanças de comportamento, inclua testes quando possível e descreva como validar o resultado. Para alterações no jogo, teste pelo menos uma partida com as brancas e outra com as pretas, os controles de tempo relevantes e a análise dos lances afetados.

---

**XadrezMestre — jogue, revise, aprenda e evolua.**
