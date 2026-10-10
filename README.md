# Wilderfeast — Fichas, Mecânicas e Compêndios 0.8.1

Um único módulo reúne as fichas aprimoradas de ferais e monstros, testes assistidos, correções e doze compêndios de apoio à ficha. Destinado ao Foundry VTT 13 e ao sistema Wilderfeast 2.0.0–2.0.1.

## Instalação pelo manifesto

Este é um módulo complementar, não um sistema independente. Requer Foundry VTT 13 e o sistema `wilderfeast` 2.0.0–2.0.1 instalado.

Em **Módulos Complementares → Instalar Módulo**, cole:

```text
https://github.com/DMArkhron/WilderfeastRPG-Foundry/releases/latest/download/module.json
```

Depois, ative o módulo em Gerenciar Módulos no seu mundo Wilderfeast.

## Instalar ou atualizar manualmente

1. Feche o Foundry. Extraia a pasta `wilderfeast-enhanced` deste ZIP em `Data/modules/`, substituindo a pasta do módulo de fichas anterior, se instalada.
2. Reinicie o Foundry e ative **Wilderfeast — Fichas, Mecânicas e Compêndios** em Gerenciar Módulos.
3. Desative **Wilderfeast — Compêndios da Ficha**, caso tenha instalado o pacote separado. Seu conteúdo agora pertence ao módulo unificado.
4. Abra a pasta **Wilderfeast — Ficha** na aba Compêndios e leia **Comece aqui — Compêndios da Ficha** em Condições e Referências.

O identificador `wilderfeast-enhanced` foi mantido. Configurações, seleção de ficha, identidade, níveis e Condições já preenchidos continuam no mesmo lugar. A inicialização não executa migração nem altera atores. Os bancos LevelDB já estão compilados; Node/npm são necessários apenas para desenvolvimento.

### Se já importou conteúdo dos compêndios separados

Importe **Atualizar Referências Antigas**, em Assistentes da Ficha, e execute como GM. A macro apresenta uma prévia antes de atualizar links, caminhos de imagens e chamadas de assistentes em atores, Itens, páginas de Journal, macros e atores de tokens independentes. Alterações concorrentes são detectadas; documentos pendentes são informados e a operação pode ser repetida.

A atualização é opcional para mundos que ainda não importaram conteúdo do módulo separado. Mensagens antigas do chat não são alteradas. As macros anteriores de fichas continuam apontando para a mesma API. Enquanto o módulo de compêndios anterior continuar instalado e desativado, suas macros de assistente recebem uma ponte de compatibilidade; após atualizar as referências, essa instalação antiga deixa de ser necessária.

## Ataques, música e marcador (0.8.1)

Na ficha, os **Ataques do Utensílio** acompanham o Alcance configurado: Golpear e, se disponível, Atirar. Todos os Estilos de ataque são permitidos pelo livro. Os botões abrem a rolagem com as opções preenchidas e indicam custo, dano e risco. Quebra reduz o alcance a 1 (Golpear) e o dano à metade.

Ao abrir o mundo como GM, são criadas a Playlist **Wilderfeast — Fogueira da Floresta** e a Cena **Capa — Wilderfeast**. Ativar essa Cena inicia a faixa em loop. Também existe uma Playlist importável no compêndio **Ambiente**. A instalação é repetível sem duplicar os documentos gerenciados.

A capa enviada está incluída como padrão da Cena. Imagens personalizadas já configuradas são preservadas; para usar a capa incluída, selecione modules/wilderfeast-enhanced/assets/media/capa-wilderfeast.png em Cenas > Capa e música.

Abra **Marcador da Caçada** na aba Cenas, no controle de tokens ou por sua macro. O mestre pode aumentar/diminuir o preenchimento ou clicar em 0–4. Jogadores leem o valor. Esse contador é independente das distâncias preenchidas nos atores; não é um contador automático de rodadas.

No painel, **Peça de posições no mapa** insere as faixas de Pernadas sob os tokens. **Peça com preenchimento** insere uma versão vinculada ao valor do painel. Os Tiles começam bloqueados. Para mover ou redimensionar, abra a camada Tiles e desbloqueie a peça. A distância de cada token é indicada por sua posição visual, sem automação de movimento.

Prévia: `preview/hunt/hunt-marker.html`, `hunt-map.html` e `tool-attacks.html`. Arte portátil: `assets/hunt/marcador-posicoes.svg` e variantes `marcador-0.svg` a `marcador-4.svg`.

## Gerador de personagem (0.7.0)

Abra a aba **Atores** e clique em **Gerar personagem**, abaixo de Criar Ator/Criar Pasta. O botão exige permissão de criar Atores.

As páginas são **Utensílio → Especialidade → Origem → Matilha → Nome**. Leia as Técnicas e Traços, escolha os valores e use **Próxima etapa**. **Voltar** conserva seu rascunho. Na página Nome, revise e clique em **Criar personagem**: a ficha abre com seus quatro Itens, Estilos 3/2/1/1, três Habilidades em 1, Vigor 20 e os recursos do Utensílio. Os campos narrativos podem ser completados depois na aba Identidade.

Fechar/cancelar antes do fim não cria um Ator. A ficha recebe propriedade do usuário que criou o personagem; a Harmonia da matilha continua nas configurações do mundo. Prévia externa: `preview/generator/generator-tool.html`, com as outras etapas na mesma pasta.

O manifesto agora inclui `compatibility.verified: "13"`, completando a declaração para essa geração do Foundry. Validação em um mundo ativo permanece pendente.

## Conteúdo e uso

| Compêndio | Entradas |
| --- | ---: |
| Utensílios | 6 |
| Técnicas Iniciantes | 24 |
| Técnicas Intermediárias | 18 |
| Técnicas Avançadas | 12 |
| Técnicas de Conjunto (Compartilhadas) | 12 |
| Traços | 99 |
| Especialidades | 8 |
| Condições e Referências | 20 |
| Assistentes da Ficha | 8 |
| Partes dos Monstros | 109 |
| Receitas do Livro | 6 |
| Música — Fogueira da Floresta | 1 |
| **Total** | **323** |

São 77 nomes de Traço, incluindo Brio/Tino, com suas versões por nível. As Compartilhadas são sempre Intermediárias. Cada entrada informa custo, requisitos, efeito e página, com links internos.

As fichas mantêm identificação visual distinta para ferais e monstros, abas de mecânicas/Condições/identidade/anotações, controles de recursos e testes assistidos. As rolagens preservam distribuição de bônus, Sucessos extras, Brio/Tino, segurar a onda/virar o bicho e suporte a tokens independentes.

Os botões **Compêndios**, **Utensílio**, **Especialidade** e **Traço / Nível** ficam nas fichas. Monstros recebem Compêndios e Traço / Nível. Controles de alteração exigem propriedade da ficha. Também é possível usar as macros de Assistentes da Ficha.

- **Utensílio:** preenche os campos nativos e importa a Técnica obrigatória e, se escolhida, uma Iniciante adicional. Sem criação, preserva Estilos e a quantidade de Durabilidade perdida. A opção de criação aplica 3/2/1/1 e restaura Durabilidade, após prévia.
- **Especialidade:** registra a identidade e importa um Traço dela e outro de qualquer Especialidade, preservando Traços e níveis existentes. Vínculos narrativos são preenchidos na ficha.
- **Traço / Nível:** importa a versão atual ou substitui a anterior após informar os Itens que serão retirados. Essa substituição remove edições locais dessas versões, indicadas na prévia.
- **Técnicas:** arraste os Itens ao aprendê-los. Para recalcular Alcance/Durabilidade após aprender Chicotada, Agulha e Linha, Lançamento Ricochete ou Utensílio Reforçado, abra Utensílio com criação desmarcada e sem importar Técnica adicional.

Utensílios usam Journals de referência e um assistente porque seus valores pertencem ao ator. Espeto começa com **Sequência de Movimentos**; alcance 2 (Atirar) depende de **Agulha e Linha**. Panela começa com **Escudo de Aço**, elevando Durabilidade a 50.

### Limites dos efeitos específicos

Os Itens do compêndio ficam em Referência ou Passivo, sem cobrança automática. Custos, alvos, Sucessos, dano, manutenção e bônus específicos são resolvidos pela mesa. **Besta Ensanguentada** permite Ferido 4 e desloca seus efeitos; **Sem Medo da Morte** permite gastar Vigor em Ferido 2. A automação comum não contempla essas exceções; controle-as manualmente conforme as notas nas entradas.

## Validação e manutenção

Veja `docs/MODIFICACOES.md` e `docs/DEPURACAO.md`. Os relatórios anteriores foram mantidos em `docs/historico-fichas/` e `docs/compendium/` como histórico.

Prévia das fichas: `preview/feral.html` e `preview/monster.html`. Catálogo navegável: `preview/compendium/catalogo.html`. São prévias externas ao Foundry.

Para desenvolvimento: Node 20+, Python 3 e `npm install`. Use `npm run generate`, `npm run build`, `npm test` e `npm run preview:catalog`. O catálogo auditado está em `data/catalog.json`; documentos individuais, em `pack-source/`. Os IDs anteriores são preservados e seus UUIDs apontam para o pacote unificado.

## Créditos e licenças

Código de fichas: `LICENSE`. Código e ícones dos compêndios: `LICENSE-COMPENDIUM.txt`. Textos e regras de Wilderfeast vêm dos PDFs fornecidos no projeto e pertencem a seus titulares; licenças de código não os abrangem.

## Partes e pastas (0.3.0)

Os compêndios ficam nas pastas Personagens, Técnicas, Monstros, Referências e Assistentes, dentro de Wilderfeast — Ficha. Partes dos Monstros possui 41 pastas internas por criatura: 40 espécies do bestiário e o Gigante da aventura (contém informação do final da aventura).

As 109 Partes são Itens nativos `part`, prontos para arrastar à ficha. Durabilidade atual/máxima começa no valor do livro; a descrição separa regra íntegra e Se Quebrada, com referências e links. Perdas de Traços, mudanças de alcance, passivas e outros efeitos de quebra continuam manuais. A referência Partes dos monstros — uso e Partes adicionais explica as Partes variáveis do Onagung sem inventar Durabilidade.

Atualize substituindo a pasta do módulo com o Foundry fechado. O ID do módulo e os IDs das entradas anteriores permanecem iguais. A organização de pastas é definida pelo manifesto; mundos que já personalizaram sua organização podem precisar reorganizar a aba Compêndios manualmente.

## Visual das fichas (0.4.0)

Fichas com papel claro, divisórias do bestiário, títulos e nome em pinceladas, faixas triangulares em laranja/branco/azul e rodapé com entalhes e vegetação. Monstros usam blocos inteiros de Traços e Partes. A decoração não intercepta cliques e o layout acompanha o redimensionamento da própria janela. Os campos e a edição de retrato continuam disponíveis. Prévias em `preview/feral.html` e `preview/monster.html`; capturas em `preview/feral-sheet.png` e `preview/monster-sheet.png`.

Verificações desta versão: 206 testes automatizados e 16 cenários de interface. A validação dentro de um mundo Foundry ainda precisa ser feita após a instalação.

## Arte do livro (0.5.0)

Cabeçalhos ilustrados com a cena do capítulo Criação de Personagens (ferais) e a arte da capa (monstros), do PDF fornecido. O painel de nome segue a composição branca/azul/laranja dos títulos de capítulo. A imagem do personagem permanece independente do fundo ilustrado e pode ser editada normalmente.

## Vigor e criação (0.5.1)

Vigor com medidor circular da reserva atual em relação ao máximo efetivo. Botões Criar em Técnicas, Traços e Partes ficam dentro do painel, abaixo da divisória.

## Cards e textos (0.5.2)

Técnicas, Traços e Partes usam cards de regras inspirados nas receitas do livro. Rótulo Procurar corrigido; custo abreviado no resumo e níveis duplicados evitados, sem alterar dados dos Itens.

## Chat e culinária (0.6.7)

Rolagens com blocos de dados e resultados, ícones dos Utensílios do PDF e seis Receitas como Itens nativos na pasta Culinária. Arraste uma Receita à ficha para consultá-la na seção Receitas. Benefícios e consumo são resolvidos manualmente. O sistema armazena as Receitas como Técnica com categoria Receita, separadas das Técnicas de combate.

## Utensílio visual (0.6.7)

Clique no ícone grande para abrir a escolha ilustrada dos seis Utensílios e o assistente de configuração. Durabilidade aparece em um medidor circular, com campos atual/máxima, e o Alcance permanece editável. O nome aceita Utensílios personalizados.

## Janelas da ficha (0.6.7)

Janelas de rolagem, Vigor, Itens e compêndios compartilham o estilo claro azul/laranja. A troca de Utensílio tem ícones de tamanho limitado, conteúdo com rolagem e rodapé acessível. O bloco de Ações, Iniciar turno e Harmonia foi retirado das fichas.

## Escolhas e cabeçalho (0.6.7)

Traços e Especialidades mostram suas descrições na janela de escolha, incluindo os dois Traços escolhidos na criação. O cabeçalho apresenta Ações e Harmonia nas molduras do nome; a barra do Caderno da matilha e Posição na Caçada receberam o mesmo estilo.

## Botões da ficha (0.6.7)

As seis ações principais usam ícones próprios e molduras azul/laranja. A grade se adapta à largura da janela, preservando as operações existentes.

## Paleta dos monstros (0.6.7)

Fichas de monstros usam vermelho suave, verde e branco, mantendo pinceladas e costuras. O retrato padrão é uma criatura sorridente; retratos personalizados são preservados. Fichas dos jogadores continuam com sua paleta azul/laranja.

## Tons dos monstros (0.6.7)

O tema de monstros combina vermelho terroso e laranja, com verde e branco; os tons rosados foram retirados.

## Editores de Itens e handouts (0.6.7)

As janelas nativas de edição recebem a paleta azul/laranja/branco, campos amplos e fonte legível. O módulo mantém o editor e a gravação de dados do Foundry.
