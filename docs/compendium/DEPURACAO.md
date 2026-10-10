# Depuração — Compêndios da Ficha 0.1.0

Verificação concluída em 2 de outubro de 2026. Foram usados os PDFs enviados ao projeto e o código local do sistema Wilderfeast 2.0.1 como referência de campos e tipos.

## Resultado

| Verificação | Resultado |
| --- | --- |
| Testes do módulo de compêndios | 36 aprovados, 0 falhas |
| Regressão do módulo de fichas da entrega anterior | 97 aprovados, 0 falhas |
| Compilação e leitura dos 9 bancos LevelDB | 202 documentos conferidos |
| Referências UUID, páginas incorporadas e ícones | Destinos existentes; conteúdo preservado |
| Prévia de conteúdo no navegador | 8 verificações aprovadas |
| Revisão visual | Catálogo em 1250px e leitura em 390px, sem transbordamento horizontal |
| Código do sistema original | Sem alterações no checkout local |
| Sessão real do Foundry | Não executada neste ambiente |

A leitura dos bancos finais foi feita com a CLI oficial do Foundry 3.0.4. Cada documento foi comparado ao JSON de origem, incluindo páginas dos Journals. A CLI adiciona um campo vazio de categorias de Journal; esse campo vazio não altera o conteúdo e foi desconsiderado na comparação.

Os testes dos assistentes usam documentos e diálogos simulados; não substituem a validação de arrastar/soltar, permissões e renderização em uma instância real do Foundry. As verificações visuais utilizam a prévia HTML criada com os documentos de origem.

## Conteúdo conferido

| Fonte do Livro Básico | Conteúdo |
| --- | --- |
| pp. 14–19 | Utensílios, Estilos iniciais, Técnica obrigatória e Natureza/Aspiração |
| pp. 20–24 | Regras de Especialidade e opções iniciais de Traços |
| p. 45 | Sucessos extras; reserva do último/único Sucesso |
| p. 46 | Brio para todas as criaturas; Tino para humanos |
| p. 63 | Durabilidade, Alcance e utensílio quebrado |
| p. 88 | Treinamento: 2/3/5 sessões e uma vez por Recesso |
| pp. 300–303 | Todos os 77 nomes de Traço e suas progressões, gerando 99 Itens |
| pp. 305–307 | Todas as 54 Técnicas dos seis Utensílios |
| p. 308 | As 12 Técnicas Compartilhadas e seus requisitos |
| pp. 309–310 | As 15 Condições |

Os campos de integração correspondem às fichas e aos modelos nativos:

| Conteúdo | Documento / campo |
| --- | --- |
| Utensílio | Journal de referência → `Actor.system.tool` |
| Alcance | `Actor.system.range` |
| Durabilidade do Utensílio | `Actor.system.durability.value/max` |
| Estilos de criação | `Actor.system.styles.*.value/max`, só ao escolher essa opção |
| Técnicas | `Item`, tipo `technique`, com `system.cost/description` |
| Traços | `Item`, tipo `trait`, com `system.cost/description`; nível em flags da ficha aprimorada |
| Especialidade | Journal de referência → flag `wilderfeast-enhanced.identity.specialty` |
| Condições | Journals de referência; não criam uma segunda reserva de Condições |

## Casos de proteção exercitados

- Cancelar a escolha, o segundo diálogo ou a prévia de Utensílio não escreve na ficha.
- Repetir a configuração não duplica Técnicas já existentes.
- Nomes alternativos do livro reconhecem Itens já preenchidos manualmente.
- Equipar sem criação preserva Estilos e a quantidade de Durabilidade perdida; a prévia informa o resultado.
- As duas distribuições de Estilos dos seis Utensílios geram 3/2/1/1.
- Panela recebe +30 de Escudo de Aço; Utensílio Reforçado soma +10 nos Utensílios compatíveis.
- Alcance de Espeto permanece 1 (Golpear) sem Agulha e Linha; com a Técnica, inclui 2 (Atirar).
- Falta de permissão e mudança concorrente de campos da ficha bloqueiam a aplicação.
- Uma falha na atualização do ator retira somente os Itens recém-importados.
- Especialidade preserva Traços já presentes, inclusive níveis superiores.
- Trocar o nível de um Traço remove sua versão anterior; falha parcial simulada restaura o Item anterior.
- O ator de um token independente é usado diretamente; múltiplos tokens selecionados são rejeitados.
- Tino não é concedido automaticamente a monstros.
- Custos, efeitos e gatilhos não são executados durante a ativação do módulo.

## Ajustes feitos durante a revisão

- Retirados trechos de requisito da Técnica seguinte que a extração do layout havia anexado ao fim de duas Técnicas Compartilhadas.
- Acrescentadas chaves próprias de banco e das páginas de Journal; todos os bancos foram recompilados e lidos de volta.
- Links gerados com UUID completo, incluindo o tipo de documento.
- Corrigida a Técnica inicial do Espeto a partir da p. 16: Sequência de Movimentos. Seu alcance adicional passou a depender de Agulha e Linha.
- Registradas as diferenças de nomenclatura e o conflito de gatilho de Corpo Quente nas próprias entradas.
- Registradas as exceções Besta Ensanguentada e Sem Medo da Morte que a ficha aprimorada 0.1.0 não automatiza.

## Conferência após instalar

Abra uma ficha de teste no seu Foundry, importe uma Técnica e um Traço, configure um Utensílio e confira a prévia. Verifique também a barra de assistentes, os links entre entradas e a troca de nível de um Traço. O pacote foi preparado e validado fora do Foundry; essa conferência ao instalar ainda é necessária para confirmar o comportamento na sua instância.

Os textos de testes completos e da leitura dos bancos acompanham esta pasta. Os resultados visuais estão em `preview/ui-checks.json` e as imagens de referência, em `preview/`.
