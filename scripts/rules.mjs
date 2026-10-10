import { CONDITIONS, STYLES, SKILLS, OLD_SKILLS } from "./constants.mjs";
export const clone = value => structuredClone(value);
export function integer(value, min=0, max=Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`Valor inválido: ${value}. Use um inteiro entre ${min} e ${max}.`);
  return n;
}
export function conditionLevels(input={}) {
  return Object.fromEntries(Object.entries(CONDITIONS).map(([k,c])=>[k, integer(input[k] ?? 0, 0, c.max)]));
}
export function changeCondition(input, key, level) {
  if (!CONDITIONS[key]) throw new Error("Condição desconhecida.");
  const c = conditionLevels(input); c[key] = integer(level,0,CONDITIONS[key].max);
  if (key === "rested" || key === "fatigued") { const cancel=Math.min(c.rested,c.fatigued); c.rested-=cancel; c.fatigued-=cancel; }
  if ((key === "hidden" || key === "exposed") && c.hidden && c.exposed) { c.hidden=0; c.exposed=0; }
  return c;
}
export function effectiveMax(base, conditions={}) {
  const c=conditionLevels(conditions);
  if(c.convalescent)return integer(base,1);
  return Math.max(0, integer(base,1) + c.rested - c.fatigued);
}
/** Pure transition. No implicit mortality, expenditure exceptions or round effects. */
export function vigorTransition({value, max, conditions={}, mode, amount, exposed=false, inHunt=true}) {
  const c=conditionLevels(conditions); let current=integer(value), base=integer(max,1); amount=integer(amount);
  if (!["damage","spend","heal"].includes(mode)) throw new Error("Operação de Vigor desconhecida.");
  if (c.convalescent) throw new Error("Convalescente exige resolução manual da recuperação e das condições.");
  if (mode === "spend" && c.injured >= 2 && amount) throw new Error("Ferido 2 ou 3 impede novos gastos de Vigor. Exceções de técnicas exigem resolução manual.");
  let injury=false, ignored=0; const limit=effectiveMax(base,c);
  if (!amount) return {value:current, conditions:c, injury, ignored, max:limit};
  if(limit===0 && mode!=="heal")throw new Error("O máximo efetivo de Vigor é zero. Resolva esse caso com a Guia antes de aplicar dano ou gasto.");
  if (c.injured === 3) {
    if (mode === "damage") throw new Error("Ferido 3: a Guia deve resolver se a criatura está caída ou forçando a barra e as consequências do dano.");
    if (mode === "heal") throw new Error("Ferido 3 impede recuperar Vigor.");
  }
  if (mode === "heal") current=Math.min(limit,current+amount);
  else if (mode === "damage") {
    const damage=amount * (exposed && c.exposed ? 2 : 1);
    if (damage >= current) { ignored=damage-current; c.injured=Math.min(3,c.injured+1); c.rested=0; injury=true; current=c.injured===3 ? 0 : effectiveMax(base,c); }
    else current-=damage;
    if (inHunt && c.exposed) c.exposed=0;
  } else {
    let remaining=amount;
    while (remaining >= current) {
      remaining-=current; c.injured=Math.min(3,c.injured+1); c.rested=0; injury=true;
      if (c.injured===3) { current=0; remaining=0; break; }
      current=effectiveMax(base,c);
      if (remaining===0) break;
    }
    current-=remaining;
  }
  return {value:current,conditions:c,injury,ignored,max:effectiveMax(base,c)};
}
export function damagePart(durability, amount) { return Math.max(0,integer(durability)-integer(amount)); }
export function attackSpec(style, action, {broken=false, bonus=0,targetExposed=false,extraDoubles=0,extraHalves=0}={}) {
  if (!STYLES[style]) throw new Error("Estilo desconhecido.");
  const costs={mighty:2,precise:2,swift:1,tricky:1};
  const doubles=(style === "mighty" ? 1:0)+(targetExposed?1:0)+integer(extraDoubles);
  const halves=(broken?1:0)+integer(extraHalves),net=doubles-halves;
  const factor=net>=0?1+net:1/(1-net);
  const damage=Math.max(0,Math.ceil(integer(action)*factor)+integer(bonus));
  return {actions:costs[style], damage, part:["precise","tricky"].includes(style), exposeOnFailure:["mighty","tricky"].includes(style)};
}
export function rollConfig(actor, {style="mighty",skill="strike",goWild=false,advantage="neutral"}={}) {
  if (!STYLES[style] || !SKILLS[skill]) throw new Error("Estilo ou habilidade inválidos.");
  if (!["neutral","advantage","disadvantage"].includes(advantage)) throw new Error("Vantagem inválida.");
  const styleValue=integer(actor.system.styles[style].value), budget=integer(actor.system.skills[skill].value);
  const wild=actor.type === "wilder" && !!goWild;
  return {style,skill,goWild:wild,advantage,budget,styleValue,faces:actor.type === "monster" || wild ? 20 : 8,count:Math.max(0,styleValue-(wild ? 1 : 0))};
}
export function countSuccesses(results, advantage="neutral") { const threshold={neutral:5,advantage:4,disadvantage:6}[advantage]; if (!threshold) throw new Error("Vantagem inválida."); return results.filter(v=>v>=threshold).length; }
export function quality(state) { return successes(state)>0?Math.max(0,state.action + state.brio - (state.frightened ?? 0)):0; }
export function successes(state) { return countSuccesses(state.pool,state.advantage) - state.brio - (state.tino?.length ?? 0); }
export function alterCheck(state, operation, index, detail="") {
  const next=clone(state);
  if (next.finalized) throw new Error("Teste finalizado. Seus resultados estão bloqueados.");
  if (operation === "point") {
    if (next.used >= next.budget) throw new Error("Todos os pontos de habilidade já foram distribuídos.");
    if (index === "action") next.action++;
    else { const i=integer(index,0,next.pool.length-1); next.pool[i]++; }
    next.used++;
  } else if (operation === "reset") { next.action=next.rawAction; next.pool=[...next.rawPool]; next.used=0; next.brio=0; next.tino=[]; }
  else if (operation === "brio" || operation === "tino") {
    if (successes(next)<=1) throw new Error("É necessário preservar o último sucesso.");
    if (operation === "brio") next.brio++;
    else { if (!detail.trim()) throw new Error("Descreva o detalhe estabelecido com Tino."); next.tino.push(detail.trim()); }
  } else if (operation === "finalize") next.finalized=true;
  else throw new Error("Operação de teste desconhecida.");
  return next;
}
export function skillMigration(skills) {
  const updates={}; for (const [oldKey,newKey] of Object.entries(OLD_SKILLS)) updates[newKey]=clone(skills[oldKey]); return updates;
}
