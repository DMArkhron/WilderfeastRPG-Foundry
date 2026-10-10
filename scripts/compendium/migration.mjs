import {dialogOptions} from '../dialogs.mjs';
import {ID,PACKAGE_ID,esc} from "./plans.mjs";
export function remapReference(value) {
  if(typeof value!=="string")return value;
  return value.replaceAll(`Compendium.${ID}.`,`Compendium.${PACKAGE_ID}.`)
    .replaceAll(`modules/${ID}/assets/`,`modules/${PACKAGE_ID}/assets/compendium/`)
    .replace(/game\.modules\.get\((["'])wilderfeast-compendium\1\)(?:\?\.|\.)api\b/g,`game.modules.get("${PACKAGE_ID}")?.api?.compendium`);
}
const field=(doc,key)=>key.split('.').reduce((value,key)=>value?.[key],doc);
export function referencePatch(doc,keys) {
  const before={},patch={};
  for(const key of keys){const original=field(doc,key),next=remapReference(original);if(next!==original){before[key]=original;patch[key]=next;}}
  return {before,patch};
}
export async function migrateLegacyReferences() {
  if(!game.user.isGM)throw new Error("A atualização de referências do mundo requer uma Guia com permissão de GM.");
  const plan=[],seen=new Set();
  const add=(doc,keys)=>{if(!doc || seen.has(doc.uuid))return;seen.add(doc.uuid);const change=referencePatch(doc,keys);if(Object.keys(change.patch).length)plan.push({doc,...change});};
  const common=["img",`flags.${ID}.sourceUuid`,"flags.core.sourceId","_stats.compendiumSource"];
  const addActor=actor=>{
    add(actor,[...common,"system.description","system.equipment","system.behavior","system.quickref",`flags.${ID}.equipped.sourceUuid`,`flags.${ID}.specialty.sourceUuid`]);
    for(const item of actor.items ?? [])add(item,[...common,"system.description"]);
  };
  for(const actor of game.actors ?? [])addActor(actor);
  for(const scene of game.scenes ?? [])for(const token of scene.tokens ?? [])if(!token.actorLink && token.actor)addActor(token.actor);
  for(const item of game.items ?? [])add(item,[...common,"system.description"]);
  for(const journal of game.journal ?? [])for(const page of journal.pages ?? [])add(page,["text.content","src"]);
  for(const macro of game.macros ?? [])add(macro,[...common,"command"]);
  if(!plan.length){ui.notifications.info("Nenhuma referência antiga encontrada nos documentos do mundo.");return {updated:0};}
  const accepted=await foundry.applications.api.DialogV2.confirm(dialogOptions("Atualizar referências dos módulos anteriores",`<p>Atualizar links, imagens e chamadas dos assistentes em <strong>${plan.length} documentos</strong> do mundo para o módulo unificado.</p><p>${plan.slice(0,12).map(p=>esc(p.doc.name)).join(", ")}${plan.length>12?", …":""}.</p><p>A atualização inclui atores, Itens, páginas de Journal, macros e atores de tokens independentes. Mensagens antigas do chat não fazem parte desta atualização.</p>`,{compendium:true}));
  if(!accepted)return null;
  if(!game.user.isGM)throw new Error("A permissão de GM mudou durante a confirmação.");
  const failures=[];let updated=0;
  for(const p of plan){
    try{
      if(Object.entries(p.before).some(([key,value])=>field(p.doc,key)!==value))throw new Error("Documento alterado enquanto a prévia estava aberta.");
      await p.doc.update(p.patch);updated++;
    }catch(error){failures.push({name:p.doc.name,error:error.message});console.error(`[${PACKAGE_ID}] Referência não atualizada: ${p.doc.uuid}`,error);}
  }
  if(failures.length)ui.notifications.warn(`${updated} documentos atualizados; ${failures.length} pendentes. Confira o console e execute novamente após resolver as pendências.`);
  else ui.notifications.info(`${updated} documentos tiveram suas referências atualizadas.`);
  return {updated,failures};
}
