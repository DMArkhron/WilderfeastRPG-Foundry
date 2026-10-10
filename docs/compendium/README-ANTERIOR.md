# Wilderfeast — Compêndios da Ficha 0.1.0

Módulo complementar de conteúdo em português, baseado no Livro Básico enviado ao projeto. Destinado ao Foundry VTT 13 e ao sistema Wilderfeast 2.0.0–2.0.1. Pode ser usado junto de Wilderfeast Enhanced 0.1.0, com metadados de nível, categoria, utensílio e origem exibidos na ficha aprimorada.

## Instalar

1. Extraia a pasta `wilderfeast-compendium` do ZIP em `Data/modules/` da instalação do Foundry.
2. Reinicie o Foundry e, no mundo Wilderfeast, ative **Wilderfeast — Compêndios da Ficha** em Gerenciar Módulos.
3. Na aba Compêndios, abra a pasta **Wilderfeast — Ficha** e a entrada **Comece aqui — Compêndios da Ficha** em Condições e Referências.

Este módulo é adicional: mantenha o módulo de fichas aprimoradas instalado se quiser continuar usando suas fichas. O ZIP já contém bancos LevelDB compilados; Node/npm são necessários apenas para desenvolver ou reconstruir os bancos.

## Conteúdo

| Compêndio | Entradas |
| --- | ---: |
| Utensílios | 6 |
| Técnicas Iniciantes | 24 |
| Técnicas Intermediárias | 18 |
| Técnicas Avançadas | 12 |
| Técnicas de Conjunto (Compartilhadas) | 12 |
| Traços | 99 |
| Especialidades | 8 |
| Condições e Referências | 19 |
| Assistentes da Ficha | 4 |
| **Total** | **202** |

Os 99 Itens de Traço representam **77 nomes distintos**: 75 Traços monstruosos e os padrões Brio/Tino. Traços com progressão possuem um Item por nível; mantenha apenas o nível atual na ficha. As técnicas de conjunto são as **Técnicas Compartilhadas**, sempre Intermediárias, da p. 308.

## Usar na ficha

Os botões **Compêndios**, **Utensílio**, **Especialidade** e **Traço / Nível** aparecem nas fichas. Monstros recebem Compêndios e Traço / Nível. Só proprietários da ficha recebem os botões de alteração. A configuração “Mostrar assistentes de compêndio na ficha” pode ocultar essa barra.

Também é possível importar as quatro macros de Assistentes da Ficha para a barra de atalhos. Selecione um único token ou use o personagem associado ao usuário. Tokens independentes são atendidos pelo ator do token selecionado.

- **Utensílio:** escolha o utensílio e uma Técnica Iniciante adicional, além da obrigatória. A prévia apresenta Alcance, Durabilidade e Itens novos. Sem marcar criação, preserva os Estilos e a quantidade de Durabilidade perdida. A opção de criação substitui os Estilos por 3/2/1/1 e restaura a Durabilidade; exige escolher a Técnica adicional. Natureza e Aspiração permanecem escolhas feitas na ficha.
- **Especialidade:** escolhe um Traço dela e outro de qualquer Especialidade. Importa apenas os Traços que a ficha ainda não possui e preserva versões de nível maior. Registra a Especialidade nos metadados da identidade. O monstro importante e os vínculos são escolhas narrativas.
- **Traço / Nível:** importa ou substitui o nível de um Traço após mostrar os Itens que serão retirados. Trocar a versão remove edições locais dos Itens anteriores, informadas na prévia. Para apenas ler ou preservar uma versão personalizada, abra o compêndio.
- **Técnicas:** arraste os Itens à ficha ao aprendê-los. Cada descrição informa requisitos de utensílio, custo, efeito, sessões de treinamento e página. Para recalcular bônus de Durabilidade/Alcance após aprender Utensílio Reforçado, Chicotada, Agulha e Linha ou Lançamento Ricochete, abra novamente Utensílio, mantenha criação desmarcada e escolha “Não importar técnica adicional”. Confirme os valores apresentados. Espeto começa com Sequência de Movimentos; seu alcance adicional depende de aprender Agulha e Linha.

O sistema guarda Utensílio, Alcance e Durabilidade em campos próprios do ator, e não oferece um tipo de Item Utensílio. Por isso o catálogo de utensílios utiliza Journals e o assistente aplica os dados nesses campos, evitando duplicar a Durabilidade em um Item Parte.

## Efeitos e exceções

Os Itens funcionam como **referências de regras**; nenhuma ativação do módulo aplica efeitos ou altera atores. Os assistentes importam conteúdo e preenchem os campos apresentados na prévia. Custos de técnicas/traços, Sucessos, alvos, dano, condições, bônus passivos, manutenção e ações extras continuam sendo resolvidos pela mesa. Os metadados da ficha aprimorada ficam em modo Referência ou Passivo, sem cobrança automática.

Brio é padrão de todas as criaturas; Tino é padrão de humanos. O assistente não oferece Tino a monstros como aquisição padrão. Custos em Sucessos usam somente os extras: nunca o último ou único Sucesso (p. 45).

**Besta Ensanguentada** permite Ferido 4 e desloca os efeitos dos níveis; **Sem Medo da Morte** permite gastar Vigor em Ferido 2. A ficha aprimorada 0.1.0 não automatiza essas exceções. Controle-as manualmente e evite usar sua automação comum de dano/Vigor para Besta Ensanguentada. Essas limitações estão indicadas nas próprias entradas.

## Conferência e arquivos

Veja [docs/DEPURACAO.md](docs/DEPURACAO.md) para a validação realizada e [docs/MODIFICACOES.md](docs/MODIFICACOES.md) para as alterações. A prévia navegável fica em `preview/catalogo.html`; abre em um navegador sem instalar o módulo e usa o conteúdo dos mesmos arquivos de origem.

Para reconstruir: instale Node 20+ e Python 3; execute `npm install`, `npm run generate`, `npm run build`, `npm test` e `npm run preview` na pasta. Para extrair novamente do PDF com Poppler instalado, execute `python3 tools/extract-pdf.py /caminho/Livro-Basico.pdf` antes da geração. A fonte auditada está em `data/catalog.json`; os documentos individuais, em `pack-source/`. O gerador mantém IDs estáveis por nome e nível. Mudanças de nomes exigem revisar referências e migrações antes de atualizar mundos existentes.

## Créditos

Livro Básico e Ficha Editável: PDFs fornecidos pelo usuário no projeto. A nomenclatura principal segue os Apêndices A/B. O código e os ícones SVG originais deste módulo usam a licença MIT em `LICENSE-CODE.txt`. Os textos e regras de Wilderfeast pertencem a seus respectivos titulares; a licença de código não os abrange. Pacote preparado para uso no projeto.
