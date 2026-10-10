# Modificações — versão 0.1.0

## Fichas e identificação visual

1. Duas fichas registradas no Foundry: Feral aprimorado e Monstro aprimorado.
2. Ferais: cabeçalho azul, detalhes laranja e traços em verde, inspirados nas cores da ficha oficial.
3. Monstros: cabeçalho ameixa, detalhes vermelhos e partes com destaque de quebra.
4. Identificação textual FERAL/MONSTRO, evitando depender somente da cor.
5. Retratos SVG padrão distintos quando a ficha não possui imagem personalizada.
6. Layout adaptável, listas expansíveis, botões com nomes e acesso às rolagens pelos estilos/habilidades.
7. Durabilidade do utensílio junto ao utensílio e indicação QUEBRADO em zero.
8. Durabilidade editável por Parte e indicação QUEBRADA em zero.
9. Abas separadas para mecânica, condições, identidade/ecologia e notas.
10. Campos oficiais de pronomes, especialidade, personalidade, aspiração, feras familiares, prato, tempero, Criação, Iniciação, Ambição e Conexão.
11. Exibição e edição dos campos nativos de comportamento, referência rápida e equipamento, ausentes da ficha original.
12. Contadores de ações, Harmonia da matilha, Pernadas, terreno e opção Forçar a barra.
13. Traços mostram nível/origem quando configurados; técnicas mostram categoria e utensílio.
14. Brio e Tino aparecem como lembretes permanentes, sem criar cópias de itens ou duplicar personagens antigos.

## Correções técnicas

15. Correção do mapeamento PT-BR das 12 habilidades, usando Buscar como na ficha enviada.
16. Correção do grupo das células numéricas de habilidades na ficha original.
17. Correção de `setStyleToMax`, que antes escrevia em `valeur` em vez de `value`.
18. Correção assistida da aba inicial da ficha original quando nenhuma aba fica ativa.
19. Valores de token independente usados diretamente no novo fluxo de rolagem.
20. Referência ao ator completo por UUID, incluindo tokens sintéticos.
21. Caso zero d6 tratado sem depender do comportamento de `0d6` do parser.
22. Visibilidade explicitamente escolhida preservada; monstros da Guia continuam privados por padrão.
23. Cartões novos usam o campo `style` do ChatMessage no Foundry 13.
24. Correções de barras para novos atores; ferramenta para ficha/token existente, preservando barras personalizadas na criação.
25. Formulários sem nomes duplicados; recursos de Partes ficam nos itens incorporados.
26. Permissões de edição respeitadas em campos, criação/remoção de itens e operações da API.
27. CSS limitado aos componentes da extensão.

## Mecânicas e automações assistidas

28. Rolagem d8/d20 + pilha de d6, com vantagem/desvantagem.
29. Distribuição de pontos no dado de ação ou nos d6, inclusive acima do máximo natural.
30. Sucessos contados por limiar, separados da soma dos dados.
31. [A] zero quando não há sucesso, conforme a regra.
32. Brio/Tino com gasto de sucessos e proteção do último sucesso.
33. Redistribuição restaura dados originais e remove gastos de Brio/Tino antes de finalizar.
34. Finalização bloqueia alterações nos resultados.
35. Custos, destino e dano dos quatro estilos de ataque.
36. Controle opcional de ações e de repetição de estilo no turno.
37. Resolução de ataque pela Guia ativa após finalização; seleção de Parte e confirmação.
38. Dano e gasto de Vigor separados, com saldo restante tratado corretamente apenas nos custos.
39. Ferido 2 impede novo custo; Ferido 3 impede recuperação e exige decisão da Guia para dano/mortalidade.
40. Dano à Parte atualiza Durabilidade e Vigor, inclusive em Partes já quebradas.
41. Exposto tratado no dano e removido durante a Caçada.
42. Dobros e metades combinados e cancelados um a um; arredondamento para cima.
43. Descansado/Fadigado cancelados e considerados no máximo efetivo; Descansado removido ao ficar Ferido.
44. Amedrontado aplicado à qualidade do teste; vantagem inicial sugerida para Dissonante, Preso e Escondido.
45. Atordoado aplicado ao iniciar o turno e removido conforme turno curto/completo.
46. Todas as condições do Apêndice C identificadas, com níveis e lembretes. Queimado fica na Parte; os demais efeitos sem automação explícita exigem resolução manual.
47. Custos numéricos opcionais de técnicas/traços, sem interpretar texto livre.
48. Desfazer a última operação assistida, com verificação de alterações posteriores.

## Preservação e manutenção

49. Extensão independente: nenhum arquivo do sistema de referência foi alterado.
50. Ficha básica e rolagem original disponíveis por configuração.
51. Reordenação opcional de habilidades antigas, prévia, backup por ficha e restauração protegida.
52. Filas locais para evitar cliques concorrentes; checagem de recursos após confirmação.
53. Rollback de Durabilidade de Parte se a atualização seguinte do ator falhar.
54. Distribuição de pontos limitada ao autor da mensagem, ou à Guia designada em rolagens cegas; consequências reservadas à Guia ativa.
55. Bloqueio de resolução no chat durante a aplicação e depois de concluída.
56. Nomes e texto de Tino escapados no HTML; descrições enviadas ao chat sem conteúdo secreto enriquecido.
57. Seis códigos de macros de Script, API documentada e instruções de instalação manual.
58. Testes de regressão, compilação de templates e prévias de interface incluídos no pacote.

Não foram criados compêndios, fichas oficiais de monstros/NPCs, importadores do PDF, automação completa de técnicas, receitas, Banquetes, treinamento, rastreio da iniciativa ou publicação externa nesta etapa.
