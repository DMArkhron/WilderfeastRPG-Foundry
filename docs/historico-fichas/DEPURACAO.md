# Depuração e verificação — 0.1.0

## Resultado executado

| Verificação | Resultado |
|---|---|
| Regras puras, transições e fórmulas | 49 testes aprovados |
| Operações com documentos simulados, permissões e chat | 40 testes aprovados |
| Inicialização, fichas, configurações e integração com hooks | 8 testes aprovados |
| Total de testes Node | **97 aprovados, 0 falhas** |
| Sintaxe dos 6 módulos ES e 6 macros | Válida |
| Manifesto e JSON | Válidos |
| Compilação Handlebars da ficha | Feral/monstro, editável/somente leitura: aprovada |
| Campos repetidos no formulário | Nenhum |
| Prévia em Chromium, 1100 e 580 px | **12 cenários aprovados** |
| Overflow horizontal dos painéis | Nenhum nos cenários testados |
| Imagens faltando e erros de JavaScript na prévia | Nenhum |
| Entradas habilitadas em fichas somente leitura | Zero |
| Sistema original | Diretório git sem modificações |

Os resultados detalhados da interface estão em `preview/ui-checks.json`. Capturas em `preview/*.png`; documentos de exemplo em `preview/*.html`. Os exemplos de personagem/monstro foram criados somente para revisar o layout; não são fichas oficiais nem conteúdo de compêndio.

## Defeitos encontrados e corrigidos durante o desenvolvimento

- O arredondamento de metade do dano foi corrigido para cima.
- Dobro de Poderoso combinado com Exposto foi corrigido para triplo, e não quádruplo; metades são canceladas com dobros um a um.
- A qualidade foi corrigida para zero quando não há sucessos.
- Campos duplicados de pronomes/especialidade foram removidos da segunda aba para impedir valores múltiplos no envio do formulário.
- Mensagens usam `style` e não o antigo campo numérico `type` do ChatMessage.
- A aplicação de dano foi separada da distribuição: o jogador ajusta seus resultados, e a Guia ativa aplica consequências, inclusive em rolagens de jogadores.
- Cancelar a resolução de ataque libera seu bloqueio; um ataque resolvido não pode ser aplicado novamente pelos controles.
- Rolagens cegas delegam o controle à Guia para que a distribuição pós-rolagem continue possível.
- A checagem de confirmação inclui o máximo de Vigor e Durabilidade, além dos valores atuais, para detectar edições intervenientes.
- Custos e cura não podem reduzir Durabilidade através da API de Vigor.
- Restauração de habilidades verifica novamente os valores após a confirmação.
- Harmonia atualiza fichas abertas, incluindo fichas de tokens independentes.
- Convalescente ignora modificadores das outras condições nos controles compatíveis; sua recuperação especial continua manual.

## Limites da validação

**Nenhum mundo real do Foundry foi iniciado neste ambiente.** Os testes simulam documentos e chamadas, usam o código real da extensão e renderizam o template real, mas não exercitam o banco de dados, parser de dados do servidor, licença, editores ProseMirror ou sockets reais do Foundry.

Os testes de fórmulas usam resultados determinísticos nas simulações para verificar o encaminhamento, contagem e armazenamento; não substituem o lançamento físico de dados pelo motor do Foundry. A sintaxe e as APIs utilizadas foram confrontadas com a documentação da versão 13.

O pacote foi deixado sem o campo de manifesto `compatibility.verified`, para não anunciar uma verificação de runtime que ainda não aconteceu.

## Conferência necessária em um mundo real

1. Ativar o módulo em Foundry 13 com Wilderfeast 2.0.0 ou 2.0.1 e abrir ambos os tipos de ficha.
2. Salvar e reabrir identidade, equipamento, comportamento, referência rápida e descrições com links UUID.
3. Arrastar um item de um compêndio para a ficha, abrir/configurar/remover e editar Durabilidade incorporada.
4. Lançar dados com um jogador e uma Guia: pontos, Brio/Tino, visibilidade e finalização.
5. Editar um token não vinculado e conferir que seus valores, speaker e recursos permanecem independentes.
6. Aplicar dano à Parte, desfazer e conferir a atualização persistida no servidor.
7. Conferir barras em tokens existentes e recém-criados.
8. Abrir o mesmo ator em dois clientes para verificar atualização de recursos e evitar edição simultânea.

## Escopo mecânico e exceções

- O máximo efetivo de Vigor inclui Descansado/Fadigado na ficha aprimorada. As barras nativas do token usam o máximo base do sistema; efeitos temporários podem exigir ajuste visual manual.
- Condições não são convertidas em ActiveEffects/status de token. O registro da extensão é um controle específico de níveis, preservado como metadados.
- Envenenado, Revigorado, Confuso, Escondido, Preso, Expandido e Queimado têm registro/lembrete; suas consequências e remoções continuam sob resolução da mesa, exceto sugestões de vantagem explicitamente mostradas.
- Convalescente não usa a operação genérica de Vigor. O estado Ferido 3 não causa morte automática: a Guia resolve se a criatura está caída ou forçando a barra.
- Técnicas que alteram limites de Ferido, alcance, Durabilidade, custo, movimento, alimentação ou fluxo de turno exigem resolução manual. A configuração de custo numérico não interpreta nem executa sua descrição.
- Fichas de monstros preservam todos os itens incorporados. A área principal apresenta Partes e Traços, os tipos usados pela ficha nativa de monstro. Técnicas incorporadas a um monstro seguem acessíveis por API/itens, sem supor que substituam as Partes.
- Dobros e metades são suportados no diálogo de ataque. Outros tipos de modificador, resistências especiais e efeitos de técnica não são inferidos.
- Pernadas e terreno são registros relativos. Não alteram automaticamente régua, token, alvo principal ou deslocamento do mapa.
- A primeira rodada e a alternância feral/monstro continuam manuais. Iniciar turno configura somente os recursos do ator escolhido.
- Treinamento, Banquetes, refeições, inventário de ingredientes e compêndios não foram automatizados nesta etapa.

## Operações concorrentes e falhas

Filas por documento impedem concorrência dentro de um cliente, e a confirmação é recusada se os recursos mudaram. A seleção de uma Guia ativa limita a resolução compartilhada de ataques. Isso não é uma transação distribuída ou um bloqueio atômico do servidor: evite que dois clientes editem o mesmo recurso no mesmo instante.

Atualização da Parte e atualização do ator são operações distintas. Há restauração da Parte se a atualização do ator falhar. Se a própria restauração falhar, uma notificação identifica a necessidade de revisar a Parte.

Se o chat falhar depois de pagar ações, a notificação orienta usar Desfazer. Se o registro final de ataque falhar após atualizar os recursos, o cartão permanece bloqueado para impedir reaplicação pelo controle; confira a ficha e não aplique o dano novamente.

## Fontes técnicas

- ActorSheet v13: https://foundryvtt.com/api/v13/classes/foundry.appv1.sheets.ActorSheet.html
- ChatMessage v13: https://foundryvtt.com/api/v13/classes/foundry.documents.ChatMessage.html
- DialogV2 v13: https://foundryvtt.com/api/v13/classes/foundry.applications.api.DialogV2.html
- Registro de fichas: https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Actors.html
- Seleção de Guia ativa: https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Users.html
