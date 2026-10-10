# Atualização 0.8.0 — Ataques, música e marcador de Caçada

- Ataques visuais na área do Utensílio equipado. Os quatro Estilos ficam disponíveis para Golpear e, quando o Alcance da ficha permitir, Atirar. Cada card informa Ações, Pernadas, dano e risco de ficar Exposto.
- A seleção abre a rolagem com Estilo/Habilidade preenchidos. Os atalhos validam o Utensílio atual antes de rolar. Utensílio quebrado restringe os atalhos a Golpear a 1 Pernada e aplica metade do dano. As regras de Técnicas e pagamento de ações continuam no fluxo existente.
- MP3 original **Fogueira da Floresta** incluído no módulo: 183,36 segundos. Novo compêndio **Ambiente**, com uma Playlist nativa contendo a faixa em repetição contínua e volume inicial de 35%.
- Ao abrir um mundo Wilderfeast como GM ativo, o módulo cria uma única Playlist e a Cena **Capa — Wilderfeast**, vinculando diretamente a faixa à Cena. A Cena não é ativada automaticamente. Ativá-la inicia a música em loop.
- A última capa da conversa **Capa panorâmica Wilderfeast** não pôde ser recuperada. Portanto, a Cena fica sem imagem até receber o arquivo: use **Cenas → Capa e música → Escolher imagem**, ou anexe a capa para incorporá-la numa atualização. Nenhuma outra imagem foi colocada no lugar dela.
- Relógio/marcador independente de **0 a 4 Pernadas**, seguindo a referência de distância do livro (p. 64). GM aumenta, diminui ou seleciona diretamente o valor. Jogadores podem ler; o controle não altera automaticamente as distâncias de atores ou a rodada de combate.
- Peça de posições para colocar sob tokens no grid e peça com preenchimento sincronizado ao painel. As peças são Tiles nativos, inseridos no centro da Cena, abaixo dos tokens e bloqueados inicialmente; podem ser desbloqueados, movidos e redimensionados na camada Tiles.
- Botão de marcador na barra de controles dos tokens e na aba Cenas. Três novas macros em Assistentes da Ficha: Abrir Marcador da Caçada, Inserir Marcador de Posições e Configurar Capa e Música.
- 12 compêndios, 323 documentos de conteúdo e 41 pastas internas. Fichas e gerador anteriores preservados.

---

# Atualização 0.7.0 — Gerador de personagem

- Declaração de compatibilidade completa para Foundry 13 (`minimum`, `verified` e `maximum`), corrigindo a ausência de versão verificada exibida em Gerenciar Módulos. O sistema permanece Wilderfeast 2.0.0–2.0.1.
- Botão **Gerar personagem** no diretório de Atores, abaixo dos botões de criação. Disponível a quem tem permissão de criar Atores.
- Cinco páginas separadas: **Utensílio → Especialidade → Origem → Matilha → Nome**. Voltar conserva as escolhas; cancelar em qualquer página encerra o rascunho.
- Utensílios com ilustrações originais, escolha de Estilo 3/2 e leitura da Técnica adicional. Técnica obrigatória incluída automaticamente.
- Especialidades com descrições e leitura dos dois Traços: um da Especialidade e outro de qualquer Especialidade, exigindo opções distintas.
- Origem com três refeições, três Habilidades diferentes com +1, Ingrediente Típico, Tempero Típico e Conexão. Matilha com arquétipo, nome, propósito e Toca.
- Página Nome com aparência e revisão antes de criar. A criação grava um novo ator nativo `wilder`, quatro Itens incorporados, Vigor 20, Estilos 3/2/1/1 e recursos/Alcance do Utensílio; as demais Habilidades começam em 0. Nome/aparência e campos narrativos podem ser editados depois.
- Novos campos narrativos visíveis na aba Identidade. O campo antigo `signatureDish` foi preservado, agora rotulado **Ingrediente Típico**.
- Atores existentes e Harmonia do mundo não são alterados pelo gerador. Um novo ator só é criado ao concluir. Cliques repetidos compartilham a mesma abertura do assistente.
- Prévia e código-fonte do gerador incluídos no ZIP. API: `game.modules.get("wilderfeast-enhanced").api.generateCharacter()`.

---

# Atualização 0.6.7 — Editores azul, laranja e branco

- Tema aplicado às janelas nativas de Itens (Técnicas, Traços, Receitas e Partes), Journals e páginas de handouts no mundo Wilderfeast.
- Fundo vermelho e fonte decorativa do editor original substituídos por branco/papel claro, cabeçalho azul, molduras laranjas e texto legível em Arial.
- Nome com moldura de capítulo e largura completa, campos de custo ampliados e descrição em card com ferramentas de edição legíveis. Janela inicial ampliada e limitada à tela, com rolagem do conteúdo.
- Submissão, permissões, editor de texto e campos nativos preservados. O ajuste de tamanho ocorre apenas na primeira abertura; rerenderizações preservam o tamanho escolhido.
- 152 testes automatizados e 62 verificações de interface aprovados. Escopo dos documentos, dimensionamento, preservação de tamanho e prévias de três Itens em tela larga/estreita verificados.
- Prévia dos Itens usa o template nativo do sistema com moldura de janela e alternância de edição simuladas; validação do editor real em mundo ativo do Foundry ainda pendente.

---

# Atualização 0.6.6 — Vermelho e laranja, sem rosa

- Tons rosados do tema de monstros substituídos por vermelho terroso, laranja e fundos claros quentes.
- Cabeçalho com tonalidade quente, molduras combinando vermelho/laranja, Vigor em laranja/vermelho, Ataque vermelho e título de Habilidades laranja.
- Retrato padrão, costuras, cards, Condições e destaques sem a antiga paleta rosa. Verde e branco preservados; a arte do cabeçalho recebe mistura de cor por CSS.
- 149 testes automatizados e 56 verificações de interface aprovados. As regras e a paleta dos jogadores permanecem preservadas. Validação em mundo ativo do Foundry ainda pendente.

---

# Atualização 0.6.5 — Monstros em vermelho, verde e branco

- Tema exclusivo das fichas de monstros: verde de floresta, vermelho suave e branco, com tons claros derivados para contraste.
- Cabeçalho, barra superior, molduras do nome/Ações/Harmonia, Vigor, abas, botões, Estilos/Habilidades, Traços/Partes, Condições, posição na Caçada e rodapé seguem a nova paleta.
- Molduras costuradas, pinceladas e entalhes preservados em variantes vetoriais próprias. Cantos arredondados e detalhes suaves mantêm a estética fofa.
- Novo retrato vetorial padrão de criatura sorridente, usado apenas na apresentação dos monstros sem retrato próprio ou com o antigo ícone padrão do módulo. Retratos personalizados não são substituídos nem gravados novamente.
- Tema dos jogadores preservado em azul/laranja. Regras, documentos, recursos e rolagens não foram alterados.
- 149 testes automatizados e 56 verificações de interface aprovados, incluindo paletas separadas, imagens, tamanho da janela, leitura e controles. Prévia fora do Foundry; validação em um mundo ativo ainda pendente.

---

# Atualização 0.6.4 — Botões da ficha

- Fazer teste, Atacar, Sofrer dano, Pagar Vigor, Recuperar e Desfazer recebem ícones vetoriais próprios, moldura dupla laranja, sombra azul e detalhes nos cantos.
- Teste e Ataque destacados em azul; demais ações em papel claro. Destaque ao passar o mouse, pressionar e navegar por teclado.
- Grade adaptável de seis, três ou duas colunas, conforme a largura da ficha. Botões de manutenção também seguem o estilo das molduras.
- Operações e permissões preservadas. 149 testes automatizados e 54 verificações de interface aprovados, incluindo cliques nos seis botões em tela larga/estreita e modo de leitura.
- Prévia fora do Foundry; validação em um mundo ativo ainda pendente.

---

# Atualização 0.6.3 — Escolhas legíveis e recursos no cabeçalho

- Importar Traço agora mostra o efeito completo do nível selecionado antes de importar; a descrição muda ao trocar a opção. Links de referência são enriquecidos pelo Foundry.
- A escolha de Especialidade mostra sua descrição e referências; a escolha dos dois Traços também permite ler cada efeito. Importação, cancelamento, preservação de Traços e confirmação continuam usando os assistentes existentes.
- Barra superior refeita como Caderno da matilha, com cores azul/laranja, molduras e ícones; atalhos de Compêndios, Utensílio, Especialidade e Traços/Níveis mantidos.
- Posição na Caçada refeita com distância em quadro circular, rota visual, terreno e card de Forçar a barra. Os campos continuam guardando os mesmos valores; a distância permanece relativa à presa.
- Pronomes retirado do cabeçalho. Ações e Harmonia aparecem em molduras no estilo do nome, ao lado da Especialidade. Ações é um campo editável; Harmonia abre o assistente compartilhado (ajuste pela Guia). Dados de pronomes anteriormente salvos não são apagados.
- 149 testes automatizados e 52 verificações de interface aprovados. Descrições dinâmicas, cancelamento, cabeçalho clicável, modo de leitura e dez janelas em três tamanhos de tela verificados. Prévia fora do Foundry; validação em um mundo ativo ainda pendente.

---

# Atualização 0.6.2 — Janelas da ficha e correção do seletor

- Corrigido o seletor de Utensílio: o assistente de compêndio usava apenas a classe wfc-dialog, enquanto a grade e os tamanhos dos ícones eram definidos em wfe-dialog. Todas as janelas agora compartilham a classe visual da ficha.
- Seleção dos seis Utensílios em grade; imagens limitadas a 88 px (72 px em telas estreitas). Largura inicial de 560 px, limitada pela tela; conteúdo com rolagem e rodapé de confirmação separado.
- Testes, ataques, Vigor/Durabilidade, configuração de Itens, assistentes de compêndio e confirmações (inclusive migração) recebem fundo de papel, moldura laranja, cabeçalho azul, campos claros e botões legíveis.
- Bloco Ações / Iniciar turno / Harmonia retirado das fichas de ferais e monstros. Condições ativas continuam visíveis. As regras assistidas e APIs existentes permanecem disponíveis; esta remoção é visual.
- 147 testes automatizados e 42 verificações de interface aprovados. As sete janelas capturadas dos assistentes reais foram verificadas em 1440×900, 1280×600 e 390×520; confirmação acessível antes/depois de rolar o conteúdo, seleção dos ícones e ausência de imagens quebradas.
- As molduras das janelas nas prévias são uma reprodução offline do Foundry; validação em um mundo ativo ainda pendente.

---

# Atualização 0.6.1 — Utensílio interativo

- Ícone original do Utensílio ampliado, com aro laranja/azul, destaque ao passar o mouse e foco por teclado.
- Clique no ícone abre o assistente com seis opções ilustradas. Mantidos os passos de Técnicas, criação opcional e prévia da configuração.
- Durabilidade atual em medidor circular inspirado no Vigor; máxima e Alcance editáveis em áreas separadas. Nome livre permanece editável.
- Layout adaptável a janelas estreitas. Seleção desabilitada para quem não pode editar a ficha.
- 147 testes automatizados e 21 verificações de interface aprovados, incluindo seletor ilustrado, cancelamento, ícone grande, clique sem sobreposição e modo de leitura. Prévia gerada do template real. Validação em mundo ativo do Foundry ainda pendente.

---

# Atualização 0.6.0 — Chat, Utensílios e Receitas

- Rolagens do módulo redesenhadas com ícone do Utensílio, etiquetas de Estilo/Habilidade/dado/limiar, dados clicáveis, quadro de Sucessos/Qualidade/Pontos e destaque de Dano. Paleta azul e laranja das referências.
- Preservados distribuição de pontos, Brio, Tino, finalização e confirmação das consequências. Esta atualização visual não altera regras nem aplica dano ao gerar a rolagem.
- Seis ícones originais dos Utensílios extraídos do Livro Básico, usados no compêndio, nas Técnicas específicas do Utensílio, na ficha e no chat. Os caminhos SVG anteriores também exibem a arte original, para Itens já importados que usam esses caminhos.
- Novo compêndio Receitas do Livro na pasta Culinária: seis Itens ilustrados das páginas 79–84, com ingredientes, preparo resumido, recuperação e efeitos condicionais.
- Receitas importadas aparecem na seção Receitas da ficha. O sistema possui apenas os tipos Parte, Técnica e Traço; as receitas usam o tipo nativo Técnica com categoria Receita, separadas visualmente das Técnicas de combate. Não há consumo ou aplicação automática dos benefícios.
- Receitas: Panquecas de café da manhã com manteiga de prótea-real; Gyozas de Peixasa; Sopa de macarrão com bolinhas de peixe e vegetais de inverno; Cabeça de Lapuni picante; Chá de mel aurora; Pratanguejo no vapor.
- Selo FERAL/MONSTRO ao lado de Wilderfeast removido, conforme a marcação amarela. Identificação F/M da moldura do nome preservada.
- Onze compêndios, 319 documentos de conteúdo e 41 pastas internas de Partes. IDs anteriores preservados; nenhum ator é alterado na inicialização.

## Depuração

146 testes automatizados, 20 verificações das fichas/chat e 10 verificações do catálogo aprovados. Casos cobrem custos, receitas, Ingredientes Raros, Temperos, efeitos alternativos, ícones e ausência do selo removido. Os onze bancos LevelDB foram compilados e extraídos de volta, idênticos às fontes. Prévias do chat e de receita inspecionadas, com ajuste de contraste no Dado de Ação e de composição da imagem da receita. Verificação fora do Foundry; validação em mundo ativo ainda pendente.

---

# Atualização 0.5.2 — Cards e textos de regras

- Técnicas, Traços e Partes agora usam cards com moldura dupla laranja, cantos marcados, títulos azuis e separador pontilhado, inspirados no card de receita enviado.
- Texto das regras em fonte sem serifa, com rótulos destacados, categoria enquadrada e notas/fonte em blocos menores. Custos, requisitos, treinamento e links continuam preservados.
- Custo no resumo perde o prefixo redundante Custo/Custa; o campo original do Item não é alterado.
- Habilidade Procurar alinhada ao Livro Básico, substituindo o rótulo Buscar. A chave de dados search e os valores existentes permanecem iguais.
- Nível de Traço não ganha um segundo número quando o nome já termina no nível atual.
- Lembrete padrão de Tino exibido apenas nos ferais; Brio continua nas duas fichas.
- Botões de criação e controles dos cards continuam sem sobreposição.

Verificação: 143 testes automatizados e 19 cenários de interface aprovados, incluindo rótulo Procurar, custo sem prefixo repetido, card real Sequência de Movimentos e cliques dos botões Criar. Prévias inspecionadas fora do Foundry; validação em um mundo ativo ainda pendente.

---

# Atualização 0.5.1 — Vigor e botões Criar

- Medidor circular de Vigor: reserva atual no centro, preenchimento proporcional em laranja, reserva restante em azul, máximo efetivo e campo Base separados.
- Moldura com losangos, bordas duplas e cores do livro. Layout compacto conserva medidor e campos de edição.
- Medidor usa o máximo efetivo, incluindo Descansado/Fadigado, e limita o preenchimento entre 0% e 100%; não modifica os valores do ator.
- Técnicas, Traços e Partes: botões Criar posicionados dentro do painel, abaixo da divisória. Bordas e títulos não passam mais sobre os botões.
- Campos e ações existentes preservados, com medidor acessível e bloqueio de edição em somente leitura.

Verificação: 143 testes automatizados e 18 cenários de interface aprovados. Testes adicionais conferem valores do medidor e se os botões Criar recebem o clique no centro, sem sobreposição. Prévias amplas e compactas revisadas. Validação em mundo Foundry ativo ainda pendente.

---

# Atualização 0.5.0 — Direção artística do livro

- Cabeçalho ilustrado: arte do capítulo Criação de Personagens nos ferais e arte da capa nos monstros, extraídas diretamente do PDF fornecido.
- Nome em painel branco com letras azuis, moldura dupla laranja, cantos circulares e faixa ornamental inferior, inspirado no título do capítulo 2. Marcadores F/M identificam o tipo de ficha.
- Retrato com moldura laranja/branca e cantos recortados; imagem do ator e edição preservadas.
- Paleta reforçada de azul noturno, laranja e papel claro, com textura discreta. Vigor recebe moldura própria, com pequenos losangos.
- Títulos de seção, divisórias, faixas costuradas e rodapé com vegetação mantidos e ajustados à nova composição.
- Layout adaptável à janela da ficha. Campos, ações, dados, compêndios e IDs preservados.

## Verificação

143 testes automatizados e 16 cenários de interface aprovados. Prévias de feral e monstro inspecionadas em tamanho amplo e compacto; imagem e nome continuam editáveis e os campos em somente leitura permanecem bloqueados. A decoração fica fora da área útil dos controles. As imagens de fundo e molduras carregaram nas prévias. Não foi realizada validação em um mundo Foundry ativo.

---

# Atualização 0.4.0 — Estilo e layout das fichas

- Layout inspirado na referência 1: fundo de papel, divisórias finas com terminação em losango, títulos em pincelada e linhas pontilhadas entre Itens.
- Estilos em laranja, Habilidades em azul, Traços em verde e Partes/Técnicas em preto.
- Cabeçalho com moldura irregular para o retrato, nome sobre pincelada azul e identificação visível de Feral/Monstro.
- Faixas triangulares em laranja, branco e azul nas bordas do cabeçalho.
- Rodapé azul com entalhes e vegetação sobreposta ao papel. Área reservada mantém a decoração fora dos campos e controles; não captura cliques.
- Monstros com Traços e Partes em largura inteira; Durabilidade em coluna escura à direita. Ferais conservam Técnicas e Traços lado a lado na largura ampla.
- Adaptação ao tamanho da janela da ficha, inclusive quando o navegador permanece largo; janela inicial de 980 × 940, redimensionável.
- Sete arquivos SVG próprios para a decoração, sem downloads externos. Retratos permanecem editáveis e usam a imagem do ator.
- Campos, nomes dos campos, ações, compêndios, IDs e regras existentes preservados.

## Depuração

143 testes automatizados e 16 cenários de interface aprovados. As verificações cobrem quatro abas, imagens, leitura sem edição, larguras compactas e janelas de 500 px em um navegador de 1200 px. As fichas de Feral e Monstro foram renderizadas e inspecionadas visualmente. Foram corrigidos a precedência do fundo do campo de nome, o carregamento das pinceladas e o posicionamento da vegetação, além do pequeno transbordamento dos losangos.

Validação realizada em prévias de navegador e ambiente simulado, sem um mundo Foundry ativo. Os dez compêndios compilados da atualização anterior permanecem no pacote.

---

# Atualização 0.3.0 — Partes e organização

- Novo compêndio Partes dos Monstros: 109 Itens nativos `part`, cobrindo as 40 espécies do bestiário e o Gigante da aventura.
- 41 pastas internas por criatura. Nomes qualificados evitam confundir Partes homônimas.
- Durabilidade atual/máxima conforme o PDF, incluindo valores excepcionais (Teia 1, Lã 50, Geleca 80).
- Descrições separadas em Parte íntegra e Se Quebrada, com páginas e links para Traços/Condições. Efeitos especiais permanecem manuais.
- Referência para Partes adicionais do Onagung: Durabilidade variável e importação das Partes dos monstros digeridos, sem criar um Item com valor inventado.
- Cinco pastas temáticas no diretório: Personagens, Técnicas, Monstros, Referências e Assistentes.
- Um módulo, dez compêndios e 313 entradas de conteúdo; as 41 pastas internas não entram nessa contagem.
- IDs dos documentos anteriores e ID do módulo preservados; nenhuma alteração automática de atores ao iniciar.

## Depuração

- 143 testes automatizados aprovados, incluindo correspondência de Partes, organização única dos compêndios e caso variável do Onagung.
- 109 valores de Durabilidade conferidos independentemente pelas coordenadas da coluna Durabilidade no PDF, nas 41 páginas de fichas.
- Compilação dos dez bancos LevelDB e extração de retorno idêntica às fontes, incluindo as pastas internas.
- 12 cenários de interface das fichas e 9 verificações do catálogo aprovados em navegador, fora do Foundry. Prévia visual inspecionada.
- A auditoria encontrou a Parte LAMA do Tanpo sem ponto após o nome no PDF; o extrator foi corrigido e a entrada incluída.
- Não houve teste em um mundo Foundry ativo nesta sessão. Confirmar carregamento, pastas e arrastar Itens no mundo real após instalar. Mundos com organização já personalizada podem conservar suas pastas existentes.

---

# Unificação — 0.2.0

- Um único módulo e uma ativação reúnem fichas, regras assistidas e nove compêndios.
- Mantido o ID wilderfeast-enhanced para preservar configurações, dados e seleção de ficha.
- Mantidos os IDs dos 202 documentos anteriores; acrescentada Atualizar Referências Antigas, totalizando 203 documentos.
- UUIDs e caminhos dos ícones passam a apontar para o pacote unificado.
- Assistentes registrados em api.compendium após a inicialização, preservando a API de rolagens e recursos.
- Scripts e ícones organizados em subpastas; as duas folhas de estilo pertencem ao mesmo manifesto.
- Metadados antigos preservados para reconhecer conteúdo já importado e evitar duplicações.
- Macros novas usam a API integrada; macros antigas de assistentes recebem compatibilidade enquanto o pacote anterior estiver instalado e desativado.
- Atualização opcional de referências do mundo por macro com prévia para GM, incluindo tokens independentes, detecção de alterações concorrentes e relatório de pendências.
- Instalação e relatórios atualizados, com histórico das duas entregas preservado.

O conteúdo do livro e o comportamento das regras automatizadas das fichas continuam como nas entregas anteriores. Limitações dos efeitos específicos permanecem indicadas nas entradas.
