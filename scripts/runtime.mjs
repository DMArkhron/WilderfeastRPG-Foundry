import {dialogOptions} from './dialogs.mjs';
import {toolIcon} from './assets.mjs';
import {ID,CONDITIONS,SKILLS,STYLES} from "./constants.mjs";
import {clone,integer,conditionLevels,changeCondition,effectiveMax,vigorTransition,damagePart,skillMigration} from "./rules.mjs";
export const esc = value => String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const queues=new Map();
export async function serial(key, fn) {
  const previous=queues.get(key) ?? Promise.resolve();
  const run=previous.catch(()=>{}).then(fn); queues.set(key,run);
  try { return await run; } finally { if(queues.get(key)===run) queues.delete(key); }
}
export function requireOwner(actor) { if(!actor || !actor.isOwner || !["wilder","monster"].includes(actor.type)) throw new Error("Selecione uma ficha de Wilderfeast sobre a qual você tenha permissão de edição."); }
export function selectedActor() {
  const controlled=globalThis.canvas?.tokens?.controlled ?? [];
  if(controlled.length>1) throw new Error("Selecione somente um token.");
  const actor=controlled[0]?.actor ?? game.user.character; requireOwner(actor); return actor;
}
export function stateOf(actor) {
  const data=clone(actor.getFlag(ID,"state") ?? {});
  return {...data,conditions:conditionLevels(data.conditions),actions:integer(data.actions ?? 3),actionsMax:integer(data.actionsMax ?? 3),attackStyles:data.attackStyles ?? [],distance:integer(data.distance ?? 2),terrain:data.terrain ?? "Chão"};
}
export function prompt(title, content, label="Confirmar") {
  return foundry.applications.api.DialogV2.wait({...dialogOptions(title,content),
    buttons:[{action:"ok",label,default:true,callback:(_e,b)=>Object.fromEntries(new FormData(b.form).entries())},{action:"cancel",label:"Cancelar",callback:()=>null}]});
}
export function confirm(title, content) { return foundry.applications.api.DialogV2.confirm(dialogOptions(title,content)); }
export async function safe(fn) { try { return await fn(); } catch(error) { console.error(`[${ID}]`,error); ui.notifications.error(error.message); return null; } }
function snapshot(actor, part) {
  return {vigor:actor.system.stamina.value,vigorMax:actor.system.stamina.max,state:stateOf(actor),durability:actor.type==="wilder"?actor.system.durability.value:null,durabilityMax:actor.type==="wilder"?actor.system.durability.max:null,part:part?{id:part.id,value:part.system.durability.value,max:part.system.durability.max}:null};
}
function same(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
export async function commit(actor,before,after,label,{part=null,confirmChange=true}={}) {
  requireOwner(actor);
  if(confirmChange) {
    const summary=`<p><strong>${esc(actor.name)}</strong> — ${esc(label)}</p><p>Vigor: ${before.vigor} → ${after.vigor}. Ferido: ${before.state.conditions.injured} → ${after.state.conditions.injured}.</p>${part?`<p>${esc(part.name)}: Durabilidade ${before.part.value} → ${after.part.value}.</p>`:after.durability!==null && before.durability!==after.durability?`<p>Durabilidade: ${before.durability} → ${after.durability}.</p>`:""}<p>Ações: ${before.state.actions} → ${after.state.actions}.</p>`;
    if(!await confirm("Aplicar alteração",summary)) return null;
  }
  if(!same(before,snapshot(actor,part))) throw new Error("A ficha mudou enquanto a confirmação estava aberta. Refaça a operação para usar os valores atuais.");
  const actorChange={"system.stamina.value":after.vigor,[`flags.${ID}.state`]:after.state,[`flags.${ID}.lastOperation`]:{before,after,label}};
  if(after.durability!==null) actorChange["system.durability.value"]=after.durability;
  let changedPart=false;
  try {
    if(part && before.part.value!==after.part.value) {await part.update({"system.durability.value":after.part.value});changedPart=true;}
    await actor.update(actorChange);
  } catch(error) {
    if(changedPart && part.system.durability.value===after.part.value) {
      try {await part.update({"system.durability.value":before.part.value});} catch(rollbackError) {ui.notifications.error("Falha ao restaurar Durabilidade após erro. Confira a Parte manualmente.");console.error(rollbackError);}
    }
    throw error;
  }
  return after;
}
export async function changeVigor(actor,mode,amount,{partId=null,tool=false,inHunt=true,applyExposed=true,confirmChange=true,actionsCost=0}={}) {
  requireOwner(actor);
  if(mode!=="damage" && (partId || tool))throw new Error("Durabilidade só pode ser afetada por esta função ao aplicar dano à Parte.");
  return serial(actor.uuid,async()=>{
    const part=partId ? actor.items.get(partId) : null;
    if(partId && (!part || part.type!=="part")) throw new Error("Parte inválida.");
    if(tool && actor.type!=="wilder") throw new Error("Somente ferais possuem esse campo de utensílio.");
    const before=snapshot(actor,part),after=clone(before);
    const cost=integer(actionsCost); if(cost>before.state.actions) throw new Error("Ações insuficientes.");
    const result=vigorTransition({value:before.vigor,max:actor.system.stamina.max,conditions:before.state.conditions,mode,amount,exposed:applyExposed,inHunt});
    after.vigor=result.value; after.state.conditions=result.conditions; after.state.actions-=cost;
    // Exposto doubles damage once for both durability and vigor.
    const partDamage=integer(amount)*(applyExposed && before.state.conditions.exposed ? 2:1);
    if(part) after.part.value=damagePart(before.part.value,partDamage);
    if(tool) after.durability=damagePart(before.durability,partDamage);
    return commit(actor,before,after,`${{damage:"Dano",spend:"Gasto de Vigor",heal:"Recuperação"}[mode]}: ${amount}${part||tool?" à Parte":""}`,{part,confirmChange});
  });
}
export async function setCondition(actor,key,level,{confirmChange=false}={}) {
  requireOwner(actor);
  if(CONDITIONS[key]?.part) throw new Error("Queimado deve ser controlado nos metadados de uma Parte, não na criatura inteira.");
  if(key==="convalescent" && actor.type!=="monster") throw new Error("Convalescente só afeta monstros.");
  return serial(actor.uuid,async()=>{
    const before=snapshot(actor),after=clone(before); after.state.conditions=changeCondition(before.state.conditions,key,level);
    if(after.state.conditions.injured===3) after.vigor=0;
    else after.vigor=Math.min(before.vigor,effectiveMax(actor.system.stamina.max,after.state.conditions));
    return commit(actor,before,after,`${CONDITIONS[key].name}: ${level}`,{confirmChange});
  });
}
export async function undo(actor) {
  requireOwner(actor);
  return serial(actor.uuid,async()=>{
    const operation=actor.getFlag(ID,"lastOperation"); if(!operation) throw new Error("Não há alteração mecânica para desfazer.");
    const part=operation.after.part ? actor.items.get(operation.after.part.id):null;
    if(operation.after.part && !part) throw new Error("A Parte da operação foi removida.");
    if(!same(operation.after,snapshot(actor,part))) throw new Error("Os recursos mudaram depois da última operação. A restauração foi bloqueada para preservar as alterações recentes.");
    const result=await commit(actor,operation.after,operation.before,`Desfazer: ${operation.label}`,{part});
    if(result) await actor.unsetFlag(ID,"lastOperation");
    return result;
  });
}
export async function beginTurn(actor,kind="full") {
  requireOwner(actor);
  return serial(actor.uuid,async()=>{
    const before=snapshot(actor),after=clone(before);
    const base=kind==="opening" || (actor.type==="monster" && kind==="short")?1:3;
    after.state.actions=Math.max(0,base-(before.state.conditions.convalescent?0:before.state.conditions.stunned)); after.state.actionsMax=base;
    after.state.attackStyles=[];
    if(!before.state.conditions.convalescent)after.state.conditions.stunned=kind==="short"?Math.max(0,before.state.conditions.stunned-1):0;
    return commit(actor,before,after,`Iniciar turno: ${kind==="short"?"curto":kind==="opening"?"abertura":"completo"}`);
  });
}
export async function consumeActions(actor,amount,style=null) {
  requireOwner(actor);
  return serial(actor.uuid,async()=>{
    const before=snapshot(actor),after=clone(before); integer(amount);
    if(!after.state.conditions.convalescent && after.state.conditions.injured===3 && !after.state.pushLimit) throw new Error("Ferido 3: indique Forçar a barra para agir. A Guia resolve as consequências.");
    if(amount>after.state.actions) throw new Error("Ações insuficientes. Inicie o turno ou ajuste o contador.");
    if(style && after.state.attackStyles.includes(style)) throw new Error("Esse estilo já foi usado para atacar neste turno. Para uma exceção de técnica, desmarque o controle de estilos no diálogo.");
    after.state.actions-=amount; if(style) after.state.attackStyles.push(style);
    return commit(actor,before,after,`Gastar ${amount} Ação(ões)`,{confirmChange:false});
  });
}
export async function vigorDialog(actor=selectedActor(),mode="damage") {
  requireOwner(actor);
  const partOptions=[`<option value="">Vigor da criatura</option>`,...(actor.type==="wilder"?[`<option value="tool">Utensílio</option>`]:actor.items.filter(i=>i.type==="part").map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`))].join("");
  const fields=await prompt("Vigor e Durabilidade",`<label>Operação<select name="mode"><option value="damage" ${mode==="damage"?"selected":""}>Sofrer dano</option><option value="spend" ${mode==="spend"?"selected":""}>Pagar Vigor</option><option value="heal" ${mode==="heal"?"selected":""}>Recuperar Vigor</option></select></label><label>Quantidade<input name="amount" type="number" min="1" step="1" value="1" required></label><label>Destino do dano<select name="part">${partOptions}</select></label><label><input name="hunt" type="checkbox" checked> Na Caçada (remove Exposto ao sofrer dano)</label><label><input name="exposed" type="checkbox" checked> Aplicar o dobro de Exposto ao dano informado</label><p>Para recuperação de Durabilidade, edite a Parte ou o utensílio. Custos e recuperação de Vigor não afetam Durabilidade.</p>`);
  if(!fields)return null;
  return changeVigor(actor,fields.mode,Number(fields.amount),{partId:fields.mode==="damage" && fields.part && fields.part!=="tool"?fields.part:null,tool:fields.mode==="damage" && fields.part==="tool",inHunt:!!fields.hunt,applyExposed:!!fields.exposed});
}
export async function harmonyDialog() {
  const h=game.settings.get(ID,"harmony");
  if(!game.user.isGM) {ui.notifications.info(`Harmonia da matilha: ${h.value}/${h.max}. A Guia pode ajustar esse recurso.`);return null;}
  const data=await prompt("Harmonia da matilha",`<label>Atual<input type="number" name="value" value="${h.value}" min="0" required></label><label>Máxima<input type="number" name="max" value="${h.max}" min="1" required></label>`);
  if(!data)return null;const max=integer(data.max,1),value=integer(data.value,0,max);
  await game.settings.set(ID,"harmony",{value,max});
}
export async function configureItem(item) {
  if(!item?.isOwner)throw new Error("Sem permissão para configurar este item.");
  const meta=item.getFlag(ID,"meta") ?? {};
  const data=await prompt(`Configurar: ${item.name}`,`<label>Nível do traço<input type="number" name="level" min="0" max="99" value="${meta.level??0}"></label><label>Categoria<select name="category">${["","Iniciante","Intermediária","Avançada"].map(v=>`<option ${meta.category===v?"selected":""}>${v}</option>`).join("")}</select></label><label>Utensílio / origem<input name="tool" value="${esc(meta.tool)}"></label><label>Origem da mutação<input name="origin" value="${esc(meta.origin)}"></label><label>Uso<select name="mode">${[["reference","Referência (sem gasto automático)"],["costs","Pagar custos estruturados"],["passive","Passivo"]].map(([v,n])=>`<option value="${v}" ${meta.mode===v?"selected":""}>${n}</option>`).join("")}</select></label><label>Custo em ações<input name="actionsCost" type="number" min="0" value="${meta.actionsCost??0}"></label><label>Custo em Vigor<input name="vigorCost" type="number" min="0" value="${meta.vigorCost??0}"></label>${item.type==="part"?`<label><input name="burned" type="checkbox" ${meta.burned?"checked":""}> Parte Queimada</label>`:""}<p>A descrição permanece a referência para efeitos e exceções. Nenhum custo é deduzido do texto automaticamente.</p>`);
  if(!data)return null;
  const next={...meta,level:integer(data.level,0,99),category:data.category,tool:data.tool,origin:data.origin,mode:data.mode,actionsCost:integer(data.actionsCost),vigorCost:integer(data.vigorCost),burned:!!data.burned};
  await item.setFlag(ID,"meta",next);return next;
}
export async function useItem(actor,itemId) {
  requireOwner(actor);const item=actor.items.get(itemId);if(!item)throw new Error("Item não encontrado.");
  const meta=item.getFlag(ID,"meta") ?? {};
  if(meta.mode==="costs" && (meta.actionsCost || meta.vigorCost)) {
    if(meta.vigorCost) {if(!await changeVigor(actor,"spend",meta.vigorCost,{actionsCost:meta.actionsCost??0}))return null;}
    else {
      if(!await confirm("Usar habilidade",`<p>${esc(item.name)}: gastar ${integer(meta.actionsCost)} ações?</p>`))return null;
      await consumeActions(actor,meta.actionsCost);
    }
  }
  const description=await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description,{async:true,secrets:false,relativeTo:item});
  const chatData={speaker:ChatMessage.getSpeaker({actor}),content:`<article class="wfe-card wfe-item-chat">${toolIcon(meta.tool||actor.system.tool)?`<img class="wfe-chat-tool" src="${toolIcon(meta.tool||actor.system.tool)}" alt="Utensílio">`:""}<div class="wfe-eyebrow">${esc(meta.category==="Receita"?"Receita":item.type==="technique"?"Técnica":item.type==="part"?"Parte":"Traço")}</div>${meta.category==="Receita"?"":`<h3>${esc(item.name)}</h3><p>${esc(item.system.cost)}</p>`}${description}<p class="wfe-muted">${meta.mode==="costs"?"Custos estruturados pagos. Resolva os efeitos e exceções com a Guia.":"Consulte e resolva o efeito com a Guia."}</p></article>`};
  const mode=actor.type==="monster"&&game.user.isGM?"gmroll":game.settings.get("core","rollMode");ChatMessage.applyRollMode(chatData,mode);return ChatMessage.create(chatData);
}
export async function repairTokenBars(actor=selectedActor()) {
  requireOwner(actor);
  if(!await confirm("Corrigir barras",`<p>Configurar Vigor${actor.type==="wilder"?" e Durabilidade":""} no token ${actor.isToken?"selecionado":"padrão da ficha"} de ${esc(actor.name)}?</p>`))return null;
  const changes={"bar1.attribute":"stamina","bar2.attribute":actor.type==="wilder"?"durability":null};
  if(actor.isToken)return actor.token.update(changes);
  return actor.update(Object.fromEntries(Object.entries(changes).map(([k,v])=>[`prototypeToken.${k}`,v])));
}
export async function migrateSkills(actor=selectedActor()) {
  requireOwner(actor);
  if(actor.getFlag(ID,"skillMigration"))throw new Error("Esta ficha já possui uma migração registrada. Não execute novamente.");
  const before=clone(actor.system.skills),after=skillMigration(before);
  const table=Object.entries(SKILLS).map(([key,label])=>`<tr><td>${label}</td><td>${before[key].value}</td><td>${after[key].value}</td></tr>`).join("");
  if(!await confirm("Reordenar valores pela tradução antiga",`<p>Use somente se os valores foram preenchidos pelos nomes incorretos da ficha antiga. Fichas importadas por chaves corretas não precisam desta operação.</p><table><thead><tr><th>Habilidade correta</th><th>Atual</th><th>Após reordenação</th></tr></thead><tbody>${table}</tbody></table><p>Um registro dos valores anteriores será guardado na ficha.</p>`))return null;
  if(!same(before,clone(actor.system.skills)))throw new Error("As habilidades mudaram durante a confirmação.");
  const changes={};for(const key of Object.keys(SKILLS)){changes[`system.skills.${key}.value`]=after[key].value;changes[`system.skills.${key}.max`]=after[key].max;}
  changes[`flags.${ID}.skillMigration`]={before,after,at:new Date().toISOString()};await actor.update(changes);
}
export async function restoreSkills(actor=selectedActor()) {
  requireOwner(actor);const backup=actor.getFlag(ID,"skillMigration");if(!backup)throw new Error("Não há migração para desfazer.");
  for(const key of Object.keys(SKILLS))if(actor.system.skills[key].value!==backup.after[key].value || actor.system.skills[key].max!==backup.after[key].max)throw new Error("As habilidades mudaram desde a migração. Restauração automática bloqueada.");
  if(!await confirm("Restaurar habilidades",`<p>Restaurar os valores anteriores à migração de ${esc(actor.name)}?</p>`))return null;
  for(const key of Object.keys(SKILLS))if(actor.system.skills[key].value!==backup.after[key].value || actor.system.skills[key].max!==backup.after[key].max)throw new Error("As habilidades mudaram durante a confirmação.");
  const changes={};for(const key of Object.keys(SKILLS)){changes[`system.skills.${key}.value`]=backup.before[key].value;changes[`system.skills.${key}.max`]=backup.before[key].max;}
  changes[`flags.${ID}.-=skillMigration`]=null;return actor.update(changes);
}
