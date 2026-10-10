export const ID = "wilderfeast-enhanced";
export const STYLES = { mighty: "Poderoso", precise: "Preciso", swift: "Ligeiro", tricky: "Sagaz" };
export const SKILLS = { grab: "Agarrar", hoard: "Armazenar", assurance: "Assegurar", shot: "Atirar", traversal: "Atravessar", search: "Procurar", call: "Chamar", cure: "Curar", study: "Estudar", display: "Exibir", strike: "Golpear", craft: "Manufaturar" };
export const OLD_SKILLS = {assurance:"grab", call:"hoard", craft:"assurance", cure:"shot", display:"traversal", grab:"call", hoard:"cure", search:"study", shot:"display", strike:"strike", study:"craft", traversal:"search"};
export const CONDITIONS = {
  frightened: {name:"Amedrontado", max:Number.MAX_SAFE_INTEGER, hint:"Reduza [A] pelo nível após o teste."},
  stunned: {name:"Atordoado", max:Number.MAX_SAFE_INTEGER, hint:"Reduza ações no início do turno; remova após aplicar."},
  confused: {name:"Confuso", max:Number.MAX_SAFE_INTEGER, hint:"Usar traços ativos, exceto Brio/Tino, causa dano igual ao nível."},
  convalescent: {name:"Convalescente", max:6, hint:"Somente monstros. Ignora outras condições; recuperação especial por comida."},
  rested: {name:"Descansado", max:Number.MAX_SAFE_INTEGER, hint:"Aumenta o máximo efetivo de Vigor; cancela Fadigado nível por nível."},
  dissonant: {name:"Dissonante", max:1, hint:"Desvantagem nos testes; remova quando a Harmonia superar zero."},
  poisoned: {name:"Envenenado", max:Number.MAX_SAFE_INTEGER, hint:"Dano igual ao nível no início da rodada; resolva pela Guia."},
  hidden: {name:"Escondido", max:1, hint:"Vantagem ao atacar; ataques recebidos com desvantagem. Remova depois de testar."},
  expanded: {name:"Expandido", max:1, hint:"Trate criaturas como uma Pernada mais próximas."},
  exposed: {name:"Exposto", max:1, hint:"Dano recebido dobrado; remova ao sofrer dano na Caçada ou levantar a guarda."},
  fatigued: {name:"Fadigado", max:Number.MAX_SAFE_INTEGER, hint:"Diminui o máximo efetivo de Vigor; cancela Descansado nível por nível."},
  injured: {name:"Ferido", max:3, hint:"2: impede novos gastos de Vigor. 3: Vigor zero; agir exige forçar a barra."},
  trapped: {name:"Preso", max:1, hint:"Impede movimento e concede desvantagem nos testes."},
  burned: {name:"Queimado", max:1, part:true, hint:"Condição de uma Parte: desvantagem ao atacar com ela."},
  invigorated: {name:"Revigorado", max:Number.MAX_SAFE_INTEGER, hint:"Recupere Vigor igual ao nível no início da rodada e remova um nível."}
};
export const IDENTITY = [
  ["pronouns","Pronomes"], ["specialty","Especialidade"], ["nature","Você é"], ["aspiration","Mas você tenta ser"],
  ["familiarBeasts","Feras familiares"], ["importantMonster","Monstro importante"], ["signatureDish","Ingrediente Típico"], ["signatureSeasoning","Tempero Típico"],
  ["upbringing","Criação — a refeição da sua infância"], ["initiation","Iniciação — a refeição que fez de você um feral"],
  ["ambition","Ambição — a refeição que você mais deseja"], ["connection","Conexão"],
  ["packName","Nome da Matilha"], ["packType","Arquétipo da Matilha"], ["packPurpose","Por que vocês caçam?"], ["den","Toca"], ["appearance","Aparência"]
];
