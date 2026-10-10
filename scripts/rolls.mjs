import {toolIcon} from './assets.mjs';
import {ID,STYLES,SKILLS} from "./constants.mjs";
import {clone,integer,rollConfig,alterCheck,successes,quality,attackSpec} from "./rules.mjs";
import {toolAttacks} from "./tool-attacks.mjs";
import {esc,prompt,safe,requireOwner,selectedActor,stateOf,consumeActions,changeVigor,setCondition,serial,confirm} from "./runtime.mjs";
export function checkCard(state) {
  const success=successes(state),a=quality(state),spec=state.attack?attackSpec(state.style,a,{broken:state.broken}):null;
  const threshold={neutral:5,advantage:4,disadvantage:6}[state.advantage];
  const icon=toolIcon(state.tool);
  const point=(index,value,label)=>`<button class="wfe-die ${index==="action"?"wfe-action-die":value>=threshold?"wfe-success-die":""}" type="button" data-wfe-check="point" data-index="${index}" ${state.finalized?"disabled":""} title="Adicionar um ponto de habilidade a ${label}"><span>${label}</span><strong>${value}</strong><small>${index==="action"?"AÇÃO":value>=threshold?"SUCESSO":"D6"}</small></button>`;
  return `<article class="wfe-card wfe-roll-card ${state.actorType==="monster"?"wfe-monster-card":""}"><header class="wfe-chat-header">${icon?`<img class="wfe-chat-tool" src="${icon}" alt="${esc(state.tool)}">`:""}<div><div class="wfe-eyebrow">${state.attack?"ATAQUE":"TESTE"} · ${state.finalized?"FINALIZADO":"DISTRIBUA OS PONTOS"}</div><h3>${esc(state.actorName)}</h3></div></header><div class="wfe-chat-tags"><span>${STYLES[state.style]}</span><span>${SKILLS[state.skill]}</span><span>d${state.faces}</span><span>${threshold}+${state.advantage==="neutral"?"":state.advantage==="advantage"?" · Vantagem":" · Desvantagem"}</span></div><div class="wfe-dice">${point("action",state.action,"[A]")}${state.pool.map((v,i)=>point(i,v,`d6 ${i+1}`)).join("") || "<span>Sem d6 neste teste</span>"}</div><div class="wfe-result"><div><small>SUCESSOS</small><strong>${success}</strong></div><div><small>QUALIDADE [A]</small><strong>${a}</strong></div><div><small>PONTOS USADOS</small><strong>${state.used}<span> / ${state.budget}</span></strong></div></div>${state.frightened?`<p>Amedrontado: −${state.frightened} em [A].</p>`:""}${state.brio?`<p>Brio: +${state.brio} em [A].</p>`:""}${(state.tino??[]).map(t=>`<p>Tino: ${esc(t)}</p>`).join("")}${spec?`<div class="wfe-chat-damage"><span>${success>0?spec.part?"DANO À PARTE":"DANO":"RESULTADO"}</span><strong>${success>0?spec.damage:"FALHA"}</strong><small>${success<=0&&spec.exposeOnFailure?"Exposto ao resolver a falha · ":""}${spec.actions} ações${state.actionsPaid?" pagas":" · controle manual"}</small></div><p class="wfe-muted">Dano antes de modificadores do alvo e técnicas.</p>`:""}<div class="wfe-chat-controls">${!state.finalized?`<button type="button" data-wfe-check="brio">Brio</button><button type="button" data-wfe-check="tino">Tino</button><button type="button" data-wfe-check="reset">Redistribuir</button><button type="button" data-wfe-check="finalize">Finalizar teste</button>`:spec&&!state.resolved?`<button type="button" data-wfe-check="resolve">${success>0?"Aplicar ao alvo marcado":"Resolver falha"}</button>`:state.resolved?"<span>Consequência aplicada</span>":""}</div></article>`;
}
export async function rollDialog(actor=selectedActor(),options={}) {
  requireOwner(actor);
  const state=stateOf(actor);let initialAdv=options.advantage ?? "neutral";
  if(!state.conditions.convalescent) {
    if(state.conditions.dissonant || state.conditions.trapped) initialAdv="disadvantage";
    else if(options.attack && state.conditions.hidden)initialAdv="advantage";
  }
  const fields=await prompt(options.attack?"Atacar":"Teste de Wilderfeast",`<label>Estilo<select name="style">${Object.entries(STYLES).map(([k,v])=>`<option value="${k}" ${(options.style??"mighty")===k?"selected":""}>${v} (${actor.system.styles[k].value})</option>`).join("")}</select></label><label>Habilidade<select name="skill">${Object.entries(SKILLS).filter(([key])=>!options.toolAttack||toolAttacks(actor).some(a=>a.skill===key)).map(([k,v])=>`<option value="${k}" ${(options.skill??"strike")===k?"selected":""}>${v} (${actor.system.skills[k].value})</option>`).join("")}</select></label><label>Vantagem<select name="advantage">${[["neutral","Normal (5+)"],["advantage","Vantagem (4+)"],["disadvantage","Desvantagem (6+)"]].map(([k,v])=>`<option value="${k}" ${initialAdv===k?"selected":""}>${v}</option>`).join("")}</select></label>${actor.type==="wilder"?`<label><input name="goWild" type="checkbox" ${options.goWild?"checked":""}> Virar o bicho (d20 e um d6 a menos)</label><p>Ao virar o bicho, justifique um traço monstruoso à Guia.</p>`:""}<label>Visibilidade<select name="rollMode">${[["publicroll","Pública"],["gmroll","Privada para a Guia"],["blindroll","Cega"],["selfroll","Só para mim"]].map(([k,v])=>`<option value="${k}" ${(options.rollMode ?? (actor.type==="monster"&&game.user.isGM?"gmroll":game.settings.get("core","rollMode")))===k?"selected":""}>${v}</option>`).join("")}</select></label>${options.attack?`<label><input name="trackActions" type="checkbox" ${game.settings.get(ID,"trackActions")?"checked":""}> Pagar ações e impedir repetição do estilo</label><label><input name="broken" type="checkbox" ${actor.type==="wilder" && actor.system.durability.value===0?"checked":""}> Parte / utensílio quebrado (metade do dano)</label>`:""}<p class="wfe-muted">Condições sugerem a vantagem inicial. Ajuste quando a situação ou uma técnica criar uma exceção.</p>`,"Rolar");
  if(!fields)return null;
  return rollCheck(actor,{...options,...fields,goWild:!!fields.goWild,trackActions:!!fields.trackActions,broken:!!fields.broken});
}
export async function rollCheck(actor=selectedActor(),options={}) {
  requireOwner(actor);
  if(options.askDialog)return rollDialog(actor,{...options,askDialog:false});
  if(options.toolAttack){const choice=toolAttacks(actor).find(a=>a.style===options.style&&a.skill===options.skill);if(!choice)throw new Error("O ataque não está disponível no Utensílio atual.");options={...options,broken:choice.broken};}
  const cfg=rollConfig(actor,options),actorState=stateOf(actor);
  if(!actorState.conditions.convalescent && actorState.conditions.injured===3 && !actorState.pushLimit)throw new Error("Ferido 3: indique Forçar a barra para realizar testes.");
  const spec=options.attack?attackSpec(cfg.style,0):null;
  if(spec && options.trackActions) {
    if(spec.actions>actorState.actions)throw new Error("Ações insuficientes para esse ataque.");
    if(actorState.attackStyles.includes(cfg.style))throw new Error("Esse estilo já foi usado neste turno.");
  }
  const formula=`1d${cfg.faces}${cfg.count?` + ${cfg.count}d6`:""}`;
  const roll=await new Roll(formula).evaluate();
  const action=roll.dice.find(d=>d.faces===cfg.faces)?.results[0]?.result;
  const pool=cfg.count ? roll.dice.find(d=>d.faces===6)?.results.map(d=>d.result) ?? [] : [];
  if(!Number.isInteger(action) || pool.length!==cfg.count)throw new Error("A rolagem não retornou os dados esperados.");
  const rollMode=options.rollMode ?? (actor.type==="monster"&&game.user.isGM?"gmroll":game.settings.get("core","rollMode"));
  if(rollMode==="blindroll" && !game.users?.activeGM)throw new Error("Uma rolagem cega exige uma Guia ativa para distribuir os pontos sem revelar os dados.");
  const state={...cfg,actorUuid:actor.uuid,actorName:actor.name,actorType:actor.type,tool:actor.system.tool??"",action,pool,rawAction:action,rawPool:[...pool],used:0,brio:0,tino:[],frightened:actorState.conditions.convalescent?0:actorState.conditions.frightened,attack:!!options.attack,broken:!!options.broken,finalized:false,resolved:false,resolving:false,actionsPaid:false,authorId:game.user.id,controllerId:rollMode==="blindroll"?game.users.activeGM.id:game.user.id};
  if(spec && options.trackActions) {await consumeActions(actor,spec.actions,cfg.style);state.actionsPaid=true;}
  const data={speaker:ChatMessage.getSpeaker({actor}),rolls:[roll],content:checkCard(state),flags:{[ID]:{check:state}},style:CONST.CHAT_MESSAGE_STYLES.ROLL};
  ChatMessage.applyRollMode(data,rollMode);
  let message;
  try { message=await ChatMessage.create(data); } catch(error) { if(state.actionsPaid)ui.notifications.warn("O chat falhou após pagar ações. Use Desfazer na ficha para restaurar os recursos.");throw error; }
  // These values are an initial snapshot. Read message.getFlag(ID,'check') after finalization.
  return {message,roll,data:{...state,success:successes(state),actionDiceResult:quality(state),styleDiceResult:state.pool,skillvalue:state.budget,skillvalueUsed:state.used},get success(){return successes(state);}};
}
export async function updateCheck(message,operation,index,detail="") {
  return serial(message.uuid,async()=>{
    const state=message.getFlag(ID,"check"); if(!state)throw new Error("Mensagem sem teste aprimorado.");
    const resolver=game.user.isGM && (!game.users?.activeGM || game.users.activeGM.id===game.user.id);
    if(operation==="resolve") {
      if(!resolver || !message.canUserModify(game.user,"update"))throw new Error("A Guia ativa deve aplicar as consequências deste ataque.");
      if(state.resolving)throw new Error("Este ataque já está sendo resolvido pela Guia.");
      const locked={...clone(state),resolving:true};await message.update({content:checkCard(locked),[`flags.${ID}.check`]:locked});
      try {
        const result=await resolveAttack(message,locked);
        if(!result){const unlocked={...state,resolving:false};await message.update({content:checkCard(unlocked),[`flags.${ID}.check`]:unlocked});}
        return result;
      } catch(error) {
        if(!error.wfeApplied){const unlocked={...state,resolving:false};await message.update({content:checkCard(unlocked),[`flags.${ID}.check`]:unlocked});}
        else ui.notifications.warn("Os recursos já foram alterados, mas o registro do chat falhou. Não aplique novamente; confira a ficha e use Desfazer se necessário.");
        throw error;
      }
    }
    if((state.controllerId??state.authorId)!==game.user.id || !message.canUserModify(game.user,"update"))throw new Error("Somente quem criou a rolagem pode distribuir seus pontos. Rolagens cegas delegam essa tarefa à Guia ativa no momento da criação.");
    const next=alterCheck(state,operation,index,detail);
    await message.update({content:checkCard(next),[`flags.${ID}.check`]:next});
    return next;
  });
}
export async function resolveAttack(message,state) {
  if(!state.finalized || !state.attack || state.resolved)throw new Error("Finalize o ataque antes de aplicar suas consequências.");
  const actor=await fromUuid(state.actorUuid);requireOwner(actor);
  if(successes(state)<=0) {
    if(attackSpec(state.style,quality(state)).exposeOnFailure) {
      if(!await confirm("Resolver falha",`<p>${esc(actor.name)} ficará Exposto?</p>`))return null;
      await setCondition(actor,"exposed",1);
    }
  } else {
    const targets=[...game.user.targets];if(targets.length!==1)throw new Error("Marque exatamente um alvo no mapa.");
    const target=targets[0].actor;requireOwner(target);const targetState=stateOf(target);
    const base=attackSpec(state.style,quality(state),{broken:state.broken});
    const choices=target.type==="wilder"?`<option value="tool">Utensílio</option>`:target.items.filter(i=>i.type==="part").map(i=>`<option value="${esc(i.id)}">${esc(i.name)} (${i.system.durability.value}/${i.system.durability.max})</option>`).join("");
    if(base.part && !choices)throw new Error("O alvo não tem uma Parte disponível.");
    const fields=await prompt(`Dano em ${target.name}`,`${base.part?`<label>Parte atingida<select name="part">${choices}</select></label>`:""}<label><input name="exposed" type="checkbox" ${targetState.conditions.exposed?"checked":""}> Incluir Exposto do alvo no cálculo</label><label>Outros efeitos de dobrar o dano<input name="doubles" type="number" min="0" value="0"></label><label>Outros efeitos de reduzir à metade (ex.: guarda)<input name="halves" type="number" min="0" value="0"></label><label>Dano adicional após multiplicadores<input name="bonus" type="number" min="0" value="0"></label><p>Dois efeitos de dobrar resultam em triplicar; dois efeitos de metade dividem por três. Dobros e metades cancelam um a um. Técnicas com outras exceções devem ser resolvidas pela Guia. Arredonde para cima.</p>`,"Calcular");
    if(!fields)return null;
    const damage=attackSpec(state.style,quality(state),{broken:state.broken,targetExposed:!!fields.exposed && !!targetState.conditions.exposed,extraDoubles:integer(fields.doubles),extraHalves:integer(fields.halves),bonus:integer(fields.bonus)}).damage;
    const result=await changeVigor(target,"damage",damage,{partId:base.part&&fields.part!=="tool"?fields.part:null,tool:base.part&&fields.part==="tool",applyExposed:false});
    if(!result)return null;
  }
  const next={...clone(state),resolved:true,resolving:false};
  try {await message.update({content:checkCard(next),[`flags.${ID}.check`]:next});}catch(error){error.wfeApplied=true;throw error;}
  return next;
}
export function bindChat(message,html) {
  const root=html instanceof HTMLElement?html:html[0];if(!root || !message.isContentVisible)return;
  const state=message.getFlag(ID,"check");if(!state)return;
  const author=(state.controllerId??state.authorId)===game.user.id && message.canUserModify(game.user,"update");
  const resolver=game.user.isGM && (!game.users?.activeGM || game.users.activeGM.id===game.user.id) && message.canUserModify(game.user,"update");
  root.querySelectorAll("[data-wfe-check]").forEach(button=>{
    const allowed=button.dataset.wfeCheck==="resolve"?resolver:author;
    button.disabled=button.disabled || !allowed || !!state.resolving;
    button.addEventListener("click",async event=>{
      event.preventDefault();event.stopPropagation();if(!allowed || button.disabled)return;
      button.disabled=true;
      try {
        let detail="";
        if(button.dataset.wfeCheck==="tino") {const fields=await prompt("Tino","<label>Detalhe estabelecido<textarea name=\"detail\" required></textarea></label>");if(!fields)return;detail=fields.detail;}
        await safe(()=>updateCheck(message,button.dataset.wfeCheck,button.dataset.index,detail));
      } finally {button.disabled=state.finalized&&button.dataset.wfeCheck!=="resolve" || !allowed || !!state.resolving;}
    });
  });
}
