import {toolbarMarkup} from './toolbar.mjs';
import {dialogOptions} from '../dialogs.mjs';
import {toolIcon} from '../assets.mjs';
import {ID,ENHANCED,PACKAGE_ID,styles,esc,clone,meta,fingerprint,toolPlan,importData,uniqueNewTechniques,sameTrait} from "./plans.mjs";
import {migrateLegacyReferences} from "./migration.mjs";

const packNames=["utensilios","iniciantes","intermediarias","avancadas","conjunto","tracos","especialidades","referencias","macros","partes","receitas","ambiente"];
const queues=new Map();
export async function serial(key,fn) {
  const previous=queues.get(key) ?? Promise.resolve();
  const run=previous.catch(()=>{}).then(fn);queues.set(key,run);
  try{return await run;}finally{if(queues.get(key)===run)queues.delete(key);}
}
export async function safe(fn) {try{return await fn();}catch(error){console.error(`[${ID}]`,error);ui.notifications.error(error.message);return null;}}
function owned(actor) {
  if(!actor?.isOwner || !["wilder","monster"].includes(actor.type))throw new Error("Selecione uma ficha de Wilderfeast que você possa editar.");
  return actor;
}
export function selectedActor() {
  const tokens=globalThis.canvas?.tokens?.controlled ?? [];
  if(tokens.length>1)throw new Error("Selecione somente um token.");
  return owned(tokens[0]?.actor ?? game.user.character);
}
async function documents(name) {
  const pack=game.packs.get(`${PACKAGE_ID}.${name}`);
  if(!pack)throw new Error(`Compêndio indisponível: ${name}. Confirme que o módulo está ativo.`);
  return pack.getDocuments();
}
async function resolve(uuid) {
  const doc=await fromUuid(uuid);
  if(!doc || doc.documentName!=="Item")throw new Error("Uma referência de Item não foi encontrada. Confira a instalação dos compêndios.");
  return doc;
}
function options(docs,selected) {return docs.map(d=>`<option value="${esc(d.id)}" ${d.id===selected?"selected":""}>${esc(d.name)}</option>`).join("");}
async function readableChoice(field,label,docs) {
  const enrich=foundry.applications.ux?.TextEditor?.implementation?.enrichHTML;
  const previews=await Promise.all(docs.map(async(d,i)=>{
    const html=d.system?.description??Array.from(d.pages??[]).map(p=>p.text?.content??'').join('');
    const description=enrich?await enrich(html,{async:true,secrets:false,relativeTo:d}):html;
    return `<article class="wfe-choice-card" data-wfe-preview-group="${esc(field)}" data-wfe-preview-id="${esc(d.id)}" ${i?'hidden':''}><h3>${esc(d.name)}</h3><div>${description}</div></article>`;
  }));
  return `<label>${esc(label)}<select name="${esc(field)}" data-wfe-preview-select="${esc(field)}">${options(docs)}</select></label><div class="wfe-choice-previews">${previews.join('')}</div>`;
}
function prompt(title,content,label="Continuar") {
  return foundry.applications.api.DialogV2.wait({...dialogOptions(title,content,{compendium:true}),
    buttons:[{action:"ok",label,default:true,callback:(_event,button)=>Object.fromEntries(new FormData(button.form).entries())},
      {action:"cancel",label:"Cancelar",callback:()=>null}]});
}
function confirm(title,content) {return foundry.applications.api.DialogV2.confirm(dialogOptions(title,content,{compendium:true}));}
function checkSnapshot(actor,before) {owned(actor);if(fingerprint(actor.toObject())!==before)throw new Error("A ficha mudou enquanto o assistente estava aberto. Reabra-o para usar os valores atuais.");}

export async function openCatalog() {
  const packs=packNames.map(name=>game.packs.get(`${PACKAGE_ID}.${name}`)).filter(Boolean);
  const data=await prompt("Compêndios da Ficha",`<p>Abra uma categoria. Técnicas e Traços podem ser arrastados à ficha; Utensílios e Especialidades possuem assistentes.</p><label>Categoria<select name="pack">${packs.map(p=>`<option value="${esc(p.collection)}">${esc(p.metadata.label)}</option>`).join("")}</select></label>`,"Abrir");
  if(data)game.packs.get(data.pack)?.render(true);
}

// Only created Items are rolled back; existing documents are never overwritten here.
export async function createThenUpdate(actor,newDocs,patch) {
  const toCreate=newDocs.map(importData);
  let created=[];
  try {
    if(toCreate.length)created=await actor.createEmbeddedDocuments("Item",toCreate);
    await actor.update(patch);
    return created;
  }catch(error){
    if(created.length)try{await actor.deleteEmbeddedDocuments("Item",created.map(d=>d.id));}
    catch(rollback){console.error(rollback);ui.notifications.error("Não foi possível retirar os Itens recém-importados após a falha. Confira a ficha.");}
    throw error;
  }
}

export async function configureTool(actor=selectedActor()) {
  owned(actor);if(actor.type!=="wilder")throw new Error("Utensílios pertencem a ferais.");
  return serial(actor.uuid,async()=>{
    const before=fingerprint(actor.toObject());
    const tools=await documents("utensilios");
    const first=await prompt("Configurar Utensílio",`<p>Feral: <strong>${esc(actor.name)}</strong>. Atual: ${esc(actor.system.tool || "sem utensílio")}. Escolha a referência que será aplicada.</p><fieldset class="wfe-tool-chooser"><legend>Escolha seu Utensílio</legend>${tools.map((d,i)=>`<label><input type="radio" name="tool" value="${esc(d.id)}" ${(actor.system.tool===meta(d).name||!tools.some(t=>meta(t).name===actor.system.tool)&&i===0)?"checked":""} required><span><img src="${toolIcon(meta(d).name)}" alt=""><strong>${esc(meta(d).name)}</strong></span></label>`).join("")}</fieldset>`);
    if(!first)return null;
    const doc=tools.find(d=>d.id===first.tool);if(!doc)throw new Error("Utensílio inválido.");
    const tool=meta(doc),mandatory=await resolve(tool.mandatoryUuid);
    const beginners=await Promise.all(tool.beginnerUuids.map(resolve));
    const choice=await prompt(`Equipar ${tool.name}`,`<p>A Técnica obrigatória é <strong>${esc(mandatory.name)}</strong>. Técnicas já existentes são preservadas.</p><label>Outra Técnica Iniciante<select name="optional"><option value="">Não importar técnica adicional</option>${options(beginners)}</select></label><label class="wfc-check"><input type="checkbox" name="initialize"> Aplicar criação: Estilos 3/2/1/1 e restaurar Durabilidade</label><label>Se aplicar criação: Estilo com nível 3<select name="orientation"><option value="0">${styles[tool.styles[0]]}</option><option value="1">${styles[tool.styles[1]]}</option></select></label><p>Sem aplicar criação, os Estilos atuais e a quantidade de Durabilidade perdida são preservados. Panela recebe o bônus de Escudo de Aço. A prévia abaixo mostrará os valores finais.</p>`,"Ver prévia");
    if(!choice)return null;
    const optional=beginners.find(d=>d.id===choice.optional) ?? null;
    if(choice.optional && !optional)throw new Error("Técnica adicional inválida.");
    const plan=toolPlan(actor.toObject(),tool,{optional:optional?.toObject(),initialize:!!choice.initialize,orientation:Number(choice.orientation)});
    const additions=uniqueNewTechniques(actor.toObject().items,[mandatory,...(optional?[optional]:[])]);
    const old=actor.system.durability;
    const summary=`<p><strong>${esc(actor.name)} → ${esc(tool.name)}</strong></p><p>Alcance: ${esc(plan.range)}. Durabilidade: ${old.value}/${old.max} → ${plan.current}/${plan.max}.</p><p>Importar: ${additions.map(d=>esc(d.name)).join(", ") || "nenhuma Técnica nova"}.</p>${plan.initialize?`<p>Estilos: ${Object.entries(styles).map(([key,label])=>`${label} ${plan.patch[`system.styles.${key}.value`]}`).join("; ")}. Esta opção substitui os níveis atuais.</p>`:"<p>Preservar Estilos atuais.</p>"}<p>Natureza e Aspiração: escolha na ficha entre ${esc(tool.personality.join(", "))}.</p>`;
    if(!await confirm("Aplicar Utensílio à ficha",summary))return null;
    checkSnapshot(actor,before);
    plan.patch[`flags.${ID}.equipped`]={sourceUuid:doc.uuid,name:tool.name,baseDurability:20};
    await createThenUpdate(actor,additions,plan.patch);
    ui.notifications.info(`${tool.name} configurado em ${actor.name}.`);return plan;
  });
}

export async function applySpecialty(actor=selectedActor()) {
  owned(actor);if(actor.type!=="wilder")throw new Error("Especialidades de criação pertencem a ferais.");
  return serial(actor.uuid,async()=>{
    const before=fingerprint(actor.toObject()),specialties=await documents("especialidades");
    const first=await prompt("Aplicar Especialidade",`${await readableChoice("specialty","Especialidade",specialties)}<p>Escolha um Traço desta Especialidade e um de qualquer Especialidade. O monstro importante e as demais decisões narrativas são registrados na ficha.</p>`);
    if(!first)return null;
    const specialty=specialties.find(d=>d.id===first.specialty);if(!specialty)throw new Error("Especialidade inválida.");
    const own=await Promise.all(meta(specialty).traitUuids.map(resolve));
    const allUuids=[...new Set(specialties.flatMap(s=>meta(s).traitUuids))];
    const all=await Promise.all(allUuids.map(resolve));all.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
    const choice=await prompt(specialty.name,`${await readableChoice("first","Traço da Especialidade",own)}${await readableChoice("second","Segundo Traço, de qualquer Especialidade",all)}<p>Selecione dois Traços distintos. Traços que a ficha já possui serão preservados.</p>`,"Ver prévia");
    if(!choice)return null;
    const a=own.find(d=>d.id===choice.first),b=all.find(d=>d.id===choice.second);
    if(!a || !b || a.id===b.id)throw new Error("Selecione dois Traços distintos entre as opções permitidas.");
    const additions=[a,b].filter(d=>!actor.toObject().items.some(i=>sameTrait(i,meta(d))));
    if(!await confirm("Aplicar Especialidade à ficha",`<p><strong>${esc(actor.name)} → ${esc(specialty.name)}</strong></p><p>Escolhidos: ${esc(a.name)}, ${esc(b.name)}.</p><p>Importar: ${additions.map(d=>esc(d.name)).join(", ") || "nenhum Traço novo"}. Os Traços atuais serão preservados.</p>`))return null;
    checkSnapshot(actor,before);
    await createThenUpdate(actor,additions,{[`flags.${ENHANCED}.identity.specialty`]:specialty.name,[`flags.${ID}.specialty`]:{name:specialty.name,sourceUuid:specialty.uuid}});
    ui.notifications.info(`Especialidade ${specialty.name} aplicada.`);return additions;
  });
}

export async function replaceTrait(actor,doc,existing) {
  const old=existing.map(d=>d.toObject());let created=[];
  try {
    created=await actor.createEmbeddedDocuments("Item",[importData(doc)]);
    if(existing.length)await actor.deleteEmbeddedDocuments("Item",existing.map(d=>d.id));
    return created;
  }catch(error){
    if(created.length)try{await actor.deleteEmbeddedDocuments("Item",created.map(d=>d.id));}catch(rollback){console.error(rollback);ui.notifications.error("Falha ao retirar o novo Traço. Confira a ficha.");}
    const missing=old.filter(d=>!actor.items.get(d._id));
    if(missing.length)try{await actor.createEmbeddedDocuments("Item",missing,{keepId:true});}catch(rollback){console.error(rollback);ui.notifications.error("Falha ao restaurar um Traço anterior. Confira a ficha.");}
    throw error;
  }
}
export async function importTrait(actor=selectedActor()) {
  owned(actor);
  return serial(actor.uuid,async()=>{
    const before=fingerprint(actor.toObject());
    const traits=await documents("tracos");
    const choice=await prompt("Importar Traço / Trocar Nível",`${await readableChoice("trait","Traço e nível",traits.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")))}<p>Importe somente o nível atual. Ao trocar o nível, os Itens anteriores deste mesmo Traço serão substituídos após a prévia.</p>`,"Ver prévia");
    if(!choice)return null;
    const doc=traits.find(d=>d.id===choice.trait);if(!doc)throw new Error("Traço inválido.");
    const data=meta(doc);
    if(actor.type==="monster" && data.name==="TINO")throw new Error("Monstros não recebem Tino por padrão. Uma exceção da Guia pode ser importada manualmente pelo compêndio.");
    const existing=actor.items.filter(i=>sameTrait(i,data));
    if(existing.length===1 && meta(existing[0]).key===data.key){ui.notifications.info("A ficha já possui este Traço nesse nível.");return null;}
    if(!await confirm("Aplicar Traço",`<p><strong>${esc(doc.name)}</strong> em ${esc(actor.name)}.</p><p>${existing.length?"Substituir: "+existing.map(d=>esc(d.name)).join(", ")+". Isso remove edições locais desses Itens.":"Adicionar novo Traço."}</p><p>Custo: ${esc(doc.system.cost)}. O efeito permanece uma referência de regra.</p>`))return null;
    checkSnapshot(actor,before);
    const result=await replaceTrait(actor,doc,existing);
    ui.notifications.info(`${doc.name} aplicado.`);return result;
  });
}

Hooks.once("init",()=>{
  if(game.system.id!=="wilderfeast")return;
  game.settings.register(PACKAGE_ID,"sheetToolbar",{name:"Mostrar assistentes de compêndio na ficha",hint:"Adiciona botões para abrir os compêndios e aplicar escolhas à ficha.",scope:"client",config:true,type:Boolean,default:true,requiresReload:true});
});
Hooks.once("ready",()=>{
  if(game.system.id!=="wilderfeast")return;
  const api={version:"0.8.0",openCatalog:()=>safe(openCatalog),configureTool:actor=>safe(()=>configureTool(actor)),applySpecialty:actor=>safe(()=>applySpecialty(actor)),importTrait:actor=>safe(()=>importTrait(actor)),migrateLegacyReferences:()=>safe(migrateLegacyReferences)};
  game.modules.get(PACKAGE_ID).api ??={};
  game.modules.get(PACKAGE_ID).api.compendium=api;
  const legacy=game.modules.get(ID);
  if(legacy && !legacy.active)legacy.api=api;
  if(legacy?.active)ui.notifications.warn("Desative Wilderfeast — Compêndios da Ficha separado: seu conteúdo já está integrado neste módulo.");
});
Hooks.on("renderActorSheet",(app,html)=>{
  if(game.system.id!=="wilderfeast" || !game.settings.get(PACKAGE_ID,"sheetToolbar"))return;
  const actor=app.actor;if(!actor || !["wilder","monster"].includes(actor.type))return;
  const root=html[0] ?? html;if(root.querySelector(".wfc-toolbar"))return;
  const holder=document.createElement("div");holder.innerHTML=toolbarMarkup({editable:actor.isOwner,isWilder:actor.type==="wilder"});const toolbar=holder.firstElementChild;
  const actions={catalog:openCatalog,tool:()=>configureTool(actor),specialty:()=>applySpecialty(actor),trait:()=>importTrait(actor)};
  toolbar.querySelectorAll('[data-wfc-assistant]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();safe(actions[button.dataset.wfcAssistant]);}));
  (root.querySelector("form") ?? root).prepend(toolbar);
});
