import test from "node:test";
import assert from "node:assert/strict";
import {remapReference,referencePatch,migrateLegacyReferences} from "../scripts/compendium/migration.mjs";
globalThis.game={user:{isGM:true},actors:[],scenes:[],items:[],journal:[],macros:[]};
globalThis.ui={notifications:{info(){},warn(){}}};
let accepted=true,onConfirm=null;
globalThis.foundry={applications:{api:{DialogV2:{confirm:async()=>{onConfirm?.();return accepted;}}}}};
function document(name="Traço") {
 return {uuid:`Item.${name}`,name,system:{description:'@UUID[Compendium.wilderfeast-compendium.tracos.Item.1234567890123456]{Nadar}'},flags:{"wilderfeast-compendium":{level:3}},async update(patch){this.received=patch;}};
}
test("reencaminha UUID, ícones e macros sem trocar o namespace dos dados",()=>{
 assert.equal(remapReference("Compendium.wilderfeast-compendium.tracos.Item.123"),"Compendium.wilderfeast-enhanced.tracos.Item.123");
 assert.equal(remapReference("modules/wilderfeast-compendium/assets/panela.svg"),"modules/wilderfeast-enhanced/assets/compendium/panela.svg");
 assert.equal(remapReference('game.modules.get("wilderfeast-compendium")?.api'), 'game.modules.get("wilderfeast-enhanced")?.api?.compendium');
 assert.equal(remapReference("wilderfeast-compendium"),"wilderfeast-compendium");assert.equal(remapReference(null),null);
});
test("planejamento só inclui os campos com referências antigas",()=>{
 const d=document(),p=referencePatch(d,["system.description","system.cost","flags.wilderfeast-compendium.level"]);
 assert.deepEqual(Object.keys(p.patch),["system.description"]);assert.equal(d.flags["wilderfeast-compendium"].level,3);
});
test("cancelar atualização mantém documentos intactos",async()=>{
 const d=document();game.items=[d];accepted=false;await migrateLegacyReferences();assert.equal(d.received,undefined);
});
test("atualização confirma referências de Itens e tokens independentes",async()=>{
 accepted=true;const d=document(),t=document("token");game.items=[d];game.scenes=[{tokens:[{actorLink:false,actor:{uuid:"Scene.t.Actor.a",items:[t],system:{}}}]}];
 const result=await migrateLegacyReferences();assert.equal(result.updated,2);assert.match(d.received["system.description"],/wilderfeast-enhanced/);assert.ok(t.received);
 game.items=[];game.scenes=[];
});
test("não sobrescreve alteração concorrente após a prévia",async()=>{
 const d=document();game.items=[d];onConfirm=()=>d.system.description="Texto recém-editado";
 const result=await migrateLegacyReferences();assert.equal(result.updated,0);assert.equal(result.failures.length,1);assert.equal(d.received,undefined);onConfirm=null;game.items=[];
});
test("atualização exige GM",async()=>{game.user.isGM=false;await assert.rejects(migrateLegacyReferences(),/GM/);game.user.isGM=true;});
