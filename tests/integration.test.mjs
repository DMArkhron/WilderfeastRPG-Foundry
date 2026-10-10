import test from "node:test";
import assert from "node:assert/strict";
import {ID,STYLES,SKILLS} from "../scripts/constants.mjs";
import {conditionLevels} from "../scripts/rules.mjs";
import {changeVigor,setCondition,undo,beginTurn,consumeActions,migrateSkills,restoreSkills,repairTokenBars,serial,useItem,selectedActor} from "../scripts/runtime.mjs";
import {rollCheck,updateCheck,checkCard} from "../scripts/rolls.mjs";

function assign(root,key,value) {
  const path=key.split("."),last=path.pop();let parent=root;
  for(const p of path)parent=parent[p]??= {};
  if(last.startsWith("-="))delete parent[last.slice(2)];else parent[last]=structuredClone(value);
}
let confirmResult=true,confirmHook=null,createdMessages=[],uid=0,promptResult=null;
const actorsByUuid=new Map();
globalThis.ui={notifications:{error:()=>{},info:()=>{},warn:()=>{}}};
globalThis.game={user:{id:"author",isGM:true,targets:new Set()},users:{activeGM:{id:"author"}},settings:{get:(_ns,key)=>key==="rollMode"?"publicroll":true},actors:new Map()};
globalThis.canvas={tokens:{controlled:[]}};
globalThis.CONST={CHAT_MESSAGE_STYLES:{ROLL:5}};
globalThis.foundry={applications:{api:{DialogV2:{confirm:async()=>{await confirmHook?.();return confirmResult;},wait:async()=>promptResult}},ux:{TextEditor:{implementation:{enrichHTML:async(text,options)=>{assert.equal(options.secrets,false);return text;}}}}}};
globalThis.fromUuid=async uuid=>actorsByUuid.get(uuid);
class FakePart {
  constructor(id="part",value=5){this.id=id;this.type="part";this.isOwner=true;this.name="Garra";this.system={durability:{value,max:5}};this.flags={};}
  getFlag(namespace,key){return this.flags[namespace]?.[key];}
  async update(data){for(const [key,value] of Object.entries(data))assign(this,key,value);return this;}
}
class FakeActor {
  constructor({type="wilder",value=20,conditions={},uuid=null}={}) {
    this.type=type;this.uuid=uuid??`Actor.${++uid}`;this.id=`${uid}`;this.name=type==="monster"?"Monstro teste":"Feral teste";this.isOwner=true;this.flags={[ID]:{state:{conditions:conditionLevels(conditions),actions:3,actionsMax:3,attackStyles:[],distance:2,terrain:"Chão"}}};
    this.system={stamina:{value,max:20},durability:{value:20,max:20},styles:Object.fromEntries(Object.keys(STYLES).map(k=>[k,{value:3,max:3}])),skills:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{value:2,max:2}]))};
    this.items=[];this.items.get=id=>this.items.find(i=>i.id===id);
    actorsByUuid.set(this.uuid,this);
  }
  getFlag(ns,key){return this.flags[ns]?.[key];}
  async update(data){if(this.failUpdate)throw new Error("Falha de persistência");for(const [key,value] of Object.entries(data))assign(this,key,value);return this;}
  async unsetFlag(ns,key){delete this.flags[ns]?.[key];}
}
class FakeRoll {
  constructor(formula){this.formula=formula;}
  async evaluate(){const [_,faces,count]=this.formula.match(/^1d(8|20)(?: \+ (\d+)d6)?$/);this.dice=[{faces:Number(faces),results:[{result:7}]}];if(count)this.dice.push({faces:6,results:Array.from({length:Number(count)},()=>({result:5}))});return this;}
}
class FakeMessage {
  constructor(data){Object.assign(this,structuredClone({...data,rolls:[]}));this.uuid=`ChatMessage.${++uid}`;this.isContentVisible=true;}
  getFlag(ns,key){return this.flags[ns]?.[key];}
  canUserModify(user){return user.id===this.flags[ID].check.authorId || user.isGM;}
  async update(data){for(const [key,value] of Object.entries(data))assign(this,key,value);return this;}
}
globalThis.Roll=FakeRoll;
globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,token:actor.isToken?"independent-token":null}),applyRollMode:(data,mode)=>{data.rollMode=mode;},create:async data=>{createdMessages.push(data);return new FakeMessage(data);}};

test.beforeEach(()=>{confirmResult=true;confirmHook=null;createdMessages=[];promptResult=null;game.user.id="author";game.user.isGM=true;game.user.targets=new Set();game.users.activeGM={id:"author"};canvas.tokens.controlled=[];});
test("aplicação de dano atualiza Vigor e Parte",async()=>{const a=new FakeActor({type:"monster",value:20});const p=new FakePart();a.items.push(p);await changeVigor(a,"damage",8,{partId:p.id,confirmChange:false});assert.equal(a.system.stamina.value,12);assert.equal(p.system.durability.value,0);});
test("Parte já quebrada continua causando dano ao Vigor",async()=>{const a=new FakeActor({type:"monster"});a.items.push(new FakePart("part",0));await changeVigor(a,"damage",8,{partId:"part",confirmChange:false});assert.equal(a.system.stamina.value,12);});
test("Exposto dobra Durabilidade e Vigor uma única vez",async()=>{const a=new FakeActor({conditions:{exposed:1}});await changeVigor(a,"damage",4,{tool:true,confirmChange:false});assert.equal(a.system.stamina.value,12);assert.equal(a.system.durability.value,12);});
test("cancelar confirmação não modifica recursos",async()=>{const a=new FakeActor();confirmResult=false;const r=await changeVigor(a,"damage",5);assert.equal(r,null);assert.equal(a.system.stamina.value,20);});
test("permissão ausente bloqueia alterações",async()=>{const a=new FakeActor();a.isOwner=false;await assert.rejects(()=>changeVigor(a,"damage",5),/permissão/);});
test("confirmação com Vigor alterado é recusada",async()=>{const a=new FakeActor();confirmHook=()=>{a.system.stamina.value=17;};await assert.rejects(()=>changeVigor(a,"damage",5),/mudou/);assert.equal(a.system.stamina.value,17);});
test("confirmação com máximo alterado é recusada",async()=>{const a=new FakeActor();confirmHook=()=>{a.system.stamina.max=25;};await assert.rejects(()=>changeVigor(a,"damage",5),/mudou/);});
test("falha na atualização da ficha restaura a Parte",async()=>{const a=new FakeActor({type:"monster"});const p=new FakePart();a.items.push(p);a.failUpdate=true;await assert.rejects(()=>changeVigor(a,"damage",3,{partId:p.id,confirmChange:false}),/persistência/);assert.equal(p.system.durability.value,5);assert.equal(a.system.stamina.value,20);});
test("desfazer restaura Vigor, condições e Durabilidade",async()=>{const a=new FakeActor({value:3});await changeVigor(a,"damage",8,{tool:true,confirmChange:false});await undo(a);assert.equal(a.system.stamina.value,3);assert.equal(a.system.durability.value,20);assert.equal(a.getFlag(ID,"state").conditions.injured,0);assert.equal(a.getFlag(ID,"lastOperation"),undefined);});
test("desfazer não sobrescreve edição posterior",async()=>{const a=new FakeActor();await changeVigor(a,"damage",4,{confirmChange:false});a.system.stamina.value=19;await assert.rejects(()=>undo(a),/mudaram/);assert.equal(a.system.stamina.value,19);});
test("desfazer restaura Parte de monstro",async()=>{const a=new FakeActor({type:"monster"});const p=new FakePart();a.items.push(p);await changeVigor(a,"damage",4,{partId:p.id,confirmChange:false});await undo(a);assert.equal(p.system.durability.value,5);});
test("Atordoado reduz e é removido no turno completo",async()=>{const a=new FakeActor({conditions:{stunned:2}});await beginTurn(a,"full");assert.equal(a.getFlag(ID,"state").actions,1);assert.equal(a.getFlag(ID,"state").conditions.stunned,0);});
test("turno curto remove somente um nível de Atordoado",async()=>{const a=new FakeActor({type:"monster",conditions:{stunned:3}});await beginTurn(a,"short");assert.equal(a.getFlag(ID,"state").actions,0);assert.equal(a.getFlag(ID,"state").conditions.stunned,2);});
test("repetir estilo no turno é bloqueado",async()=>{const a=new FakeActor();await consumeActions(a,1,"swift");await assert.rejects(()=>consumeActions(a,1,"swift"),/já foi usado/);assert.equal(a.getFlag(ID,"state").actions,2);});
test("novo turno reinicia estilos usados",async()=>{const a=new FakeActor();await consumeActions(a,1,"swift");await beginTurn(a);assert.deepEqual(a.getFlag(ID,"state").attackStyles,[]);});
test("operações simultâneas no mesmo cliente são serializadas",async()=>{const a=new FakeActor();await Promise.all([changeVigor(a,"damage",4,{confirmChange:false}),changeVigor(a,"damage",5,{confirmChange:false})]);assert.equal(a.system.stamina.value,11);});
test("filas independentes não se bloqueiam",async()=>{let order=[];await Promise.all([serial("a",async()=>{await new Promise(r=>setTimeout(r,10));order.push("a");}),serial("b",async()=>{order.push("b");})]);assert.deepEqual(order,["b","a"]);});
test("Ferido 3 exige forçar a barra para ações",async()=>{const a=new FakeActor({conditions:{injured:3},value:0});await assert.rejects(()=>consumeActions(a,1),/Forçar/);});
test("Convalescente é bloqueado em feral",async()=>{await assert.rejects(()=>setCondition(new FakeActor(),"convalescent",1),/monstros/);});
test("Queimado não pode ser aplicado à criatura inteira",async()=>{await assert.rejects(()=>setCondition(new FakeActor(),"burned",1),/Parte/);});
test("condição Ferido 3 coloca Vigor em zero",async()=>{const a=new FakeActor();await setCondition(a,"injured",3);assert.equal(a.system.stamina.value,0);});
test("migração é reversível e não permite repetição",async()=>{const a=new FakeActor();let n=0;for(const s of Object.values(a.system.skills))s.value=n++;const before=structuredClone(a.system.skills);await migrateSkills(a);await assert.rejects(()=>migrateSkills(a),/registrada/);await restoreSkills(a);assert.deepEqual(a.system.skills,before);});
test("restauração da migração preserva progresso posterior",async()=>{const a=new FakeActor();await migrateSkills(a);a.system.skills.grab.value=99;await assert.rejects(()=>restoreSkills(a),/mudaram/);});
test("barras de token independente atualizam somente o token",async()=>{const a=new FakeActor();a.isToken=true;let update;a.token={update:async data=>{update=data;}};await repairTokenBars(a);assert.deepEqual(update,{"bar1.attribute":"stamina","bar2.attribute":"durability"});});
test("seleção ambígua é recusada",()=>{canvas.tokens.controlled=[{actor:new FakeActor()},{actor:new FakeActor()}];assert.throws(()=>selectedActor(),/somente um/);});
test("rolagem usa dados do token sintético, sem consultar ator do mundo",async()=>{const a=new FakeActor({uuid:"Scene.scene.Token.token.Actor.base"});a.isToken=true;a.system.styles.mighty.value=1;const r=await rollCheck(a,{goWild:true,rollMode:"selfroll"});assert.equal(r.roll.formula,"1d20");assert.equal(r.message.getFlag(ID,"check").actorUuid,a.uuid);assert.equal(createdMessages[0].speaker.token,"independent-token");});
test("visibilidade explicitamente escolhida é respeitada",async()=>{await rollCheck(new FakeActor({type:"monster"}),{rollMode:"publicroll"});assert.equal(createdMessages[0].rollMode,"publicroll");});
test("monstro da Guia é privado por padrão",async()=>{await rollCheck(new FakeActor({type:"monster"}));assert.equal(createdMessages[0].rollMode,"gmroll");});
test("mensagem usa style do schema do Foundry 13",async()=>{await rollCheck(new FakeActor());assert.equal(createdMessages[0].style,5);assert.equal(createdMessages[0].type,undefined);});
test("ataque paga ações e registra estilo",async()=>{const a=new FakeActor();const r=await rollCheck(a,{attack:true,trackActions:true,style:"precise"});assert.equal(a.getFlag(ID,"state").actions,1);assert.deepEqual(a.getFlag(ID,"state").attackStyles,["precise"]);assert.equal(r.message.getFlag(ID,"check").actionsPaid,true);});
test("autor distribui pontos e finaliza",async()=>{const r=await rollCheck(new FakeActor());await updateCheck(r.message,"point","action");await updateCheck(r.message,"finalize");assert.equal(r.message.getFlag(ID,"check").action,8);assert.equal(r.message.getFlag(ID,"check").finalized,true);await assert.rejects(()=>updateCheck(r.message,"brio"),/finalizado/);});
test("outro usuário e até outra Guia não redistribuem pontos do autor",async()=>{const r=await rollCheck(new FakeActor());game.user.id="other";await assert.rejects(()=>updateCheck(r.message,"point",0),/Somente/);});
test("conteúdo do chat escapa nomes e Tino",()=>{const html=checkCard({actorType:"wilder",actorName:"<script>bad</script>",style:"mighty",skill:"strike",faces:8,action:8,pool:[5,5,5],brio:0,tino:["<img onerror=bad>"],budget:0,used:0,advantage:"neutral",finalized:false});assert.ok(html.includes("&lt;script&gt;"));assert.ok(html.includes("&lt;img"));assert.ok(!html.includes("<script>"));});
test("consultar item não envia conteúdo secreto para o chat",async()=>{const a=new FakeActor();const item=new FakePart();item.system.description="Descrição pública";a.items.push(item);await useItem(a,item.id);assert.equal(createdMessages.length,1);});
test("custo ou cura não podem debitar Durabilidade pela API",async()=>{const a=new FakeActor();await assert.rejects(()=>changeVigor(a,"spend",2,{tool:true}),/Durabilidade/);assert.equal(a.system.durability.value,20);});
test("Guia ativa aplica ataque finalizado de outro autor",async()=>{
  const source=new FakeActor(),target=new FakeActor({type:"monster",value:50,conditions:{exposed:1}});target.system.stamina.max=50;
  const r=await rollCheck(source,{attack:true,style:"mighty"});await updateCheck(r.message,"finalize");
  game.user.id="gm";game.users.activeGM={id:"gm"};game.user.targets.add({actor:target});promptResult={exposed:"on",doubles:"0",halves:"0",bonus:"0"};
  await updateCheck(r.message,"resolve");assert.equal(target.system.stamina.value,29);assert.equal(r.message.getFlag(ID,"check").resolved,true);
});
test("cancelar resolução libera o bloqueio e preserva recursos",async()=>{
  const r=await rollCheck(new FakeActor(),{attack:true});await updateCheck(r.message,"finalize");const target=new FakeActor({type:"monster"});game.user.targets.add({actor:target});
  await updateCheck(r.message,"resolve");assert.equal(r.message.getFlag(ID,"check").resolving,false);assert.equal(r.message.getFlag(ID,"check").resolved,false);assert.equal(target.system.stamina.value,20);
});
test("ataque resolvido não pode ser aplicado duas vezes",async()=>{
  const r=await rollCheck(new FakeActor(),{attack:true,style:"swift"});await updateCheck(r.message,"finalize");const target=new FakeActor({type:"monster"});game.user.targets.add({actor:target});promptResult={doubles:"0",halves:"0",bonus:"0"};
  await updateCheck(r.message,"resolve");await assert.rejects(()=>updateCheck(r.message,"resolve"),/Finalize/);assert.equal(target.system.stamina.value,13);
});
test("jogador não aplica consequência automática de ataque",async()=>{const r=await rollCheck(new FakeActor(),{attack:true});await updateCheck(r.message,"finalize");game.user.isGM=false;await assert.rejects(()=>updateCheck(r.message,"resolve"),/Guia/);});
test("rolagem cega delega os pontos à Guia sem permitir ajustes pelo autor",async()=>{
  game.users.activeGM={id:"gm"};game.user.isGM=false;const r=await rollCheck(new FakeActor(),{rollMode:"blindroll"});
  await assert.rejects(()=>updateCheck(r.message,"point",0),/Somente/);game.user.id="gm";game.user.isGM=true;await updateCheck(r.message,"point",0);assert.equal(r.message.getFlag(ID,"check").used,1);
});
