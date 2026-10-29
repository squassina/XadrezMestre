# Third-party notices

Este arquivo registra componentes de terceiros identificados no XadrezMestre. A licença MIT do código próprio do projeto não altera nem substitui as licenças de arquivos ou programas de terceiros.

## Peças de xadrez — Lichess `lila`

Fonte upstream: [lichess-org/lila](https://github.com/lichess-org/lila)  
Inventário oficial de autoria e licenças: [`COPYING.md`](https://github.com/lichess-org/lila/blob/master/COPYING.md)

Os SVGs usados pela interface estão em `public/pieces/`. O inventário do Lichess registra, entre outras, estas condições para conjuntos com nomes correspondentes:

| Conjunto | Informação no inventário upstream | Observação |
|---|---|---|
| `cburnett` | Colin M. L. Burnett — GPL-2.0-or-later | Preserve a licença e cumpra suas condições ao redistribuir os arquivos. |
| `merida` | Armando Hernandez Marroquin — GPL-2.0-or-later | Preserve a licença e cumpra suas condições ao redistribuir os arquivos. |
| `alpha` | Eric Bentzen — “free for personal non commercial use” | Não tratar como liberado para uso comercial. Obtenha autorização/licença adequada ou substitua esse conjunto antes de distribuir para fins comerciais. |
| `staunty` | A licença específica não foi confirmada neste inventário apenas pelo nome da pasta | Verifique a origem e os termos dos arquivos locais; não presuma que o nome equivale ao conjunto “Staunton” do Lichess. |

As informações acima são um resumo do inventário upstream, não aconselhamento jurídico. Confira o arquivo upstream e os metadados dos arquivos efetivamente distribuídos antes de publicar ou redistribuir. A atribuição ao projeto Lichess não significa endosso por Lichess.

## Motor de xadrez — Stockfish

- Projeto: [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish)
- Licença: GNU General Public License, versão 3 (GPLv3).
- Versão configurada no `Dockerfile`: `sf_18`.
- O Dockerfile baixa o arquivo de release oficial, instala o executável em `/usr/local/bin/stockfish` e copia `Copying.txt` e `AUTHORS` para `/usr/share/doc/stockfish/`.

Ao redistribuir o binário Stockfish ou uma imagem que o contenha, cumpra as obrigações aplicáveis da GPLv3, incluindo disponibilizar o texto da licença e o código-fonte correspondente à versão exata distribuída ou uma forma válida de obtê-lo. Consulte os termos oficiais do [repositório Stockfish](https://github.com/official-stockfish/Stockfish/blob/master/README.md).

## Outros componentes

As dependências JavaScript estão declaradas em `package.json`; consulte as licenças de cada dependência e suas distribuições para obter os avisos completos.
