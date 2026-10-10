import test from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {ID,ENHANCED,PACKAGE_ID,clone,meta,toolPlan,importData,sameTrait,uniqueNewTechniques,fingerprint} from "../scripts/compendium/plans.mjs";

const root=new URL("../",import.meta.url);
const manifest=JSON.parse(await readFile(new URL("module.json",root),"utf8"));
const source=new Map(),packs=new Map();
for(const p of manifest.packs){
  const docs=[];
  for(const file of await readdir(new URL(`pack-source/${p.name}/`,root))){
    const data=JSON.parse(await readFile(new URL(`pack-source/${p.name}/${file}`,root),"utf8"));
    if(data._key?.startsWith('!folders!'))continue;
    const uuid=`Compendium.${PACKAGE_ID}.${p.name}.${p.type}.${data._id}`;
    const doc={...data,id:data._id,uuid,documentName:p.type,toObject:()=>clone(data)};
    source.set(uuid,doc);docs.push(doc);
  }
  packs.set(`${PACKAGE_ID}.${p.name}`,{collection:`${PACKAGE_ID}.${p.name}`,metadata:p,getDocuments:async()=>docs,render(){this.rendered=true;}});
}
const catalog=JSON.parse(await readFile(new URL("data/catalog.json",root),"utf8"));
const find=(name,kind="technique",level=1)=>[...source.values()].find(d=>meta(d).name===name && meta(d).kind===kind && (kind!=="trait" || meta(d).level===level));
const tool=name=>[...source.values()].find(d=>meta(d).kind==="tool" && d.name===name);
class Items extends Map {filter(fn){return [...this.values()].filter(fn);}}
let sequence=0;
function actor(type="wilder") {
  const a={uuid:`Actor.mock${++sequence}`,name:"Feral de teste",type,isOwner:true,
    system:{tool:"",range:"1 (Golpear)",durability:{value:12,max:20},styles:{mighty:{value:4,max:4},precise:{value:1,max:1},swift:{value:2,max:2},tricky:{value:1,max:1}}},flags:{},items:new Items(),
    toObject(){return clone({type:this.type,system:this.system,flags:this.flags,items:[...this.items.values()].map(d=>d.toObject())});},
    async createEmbeddedDocuments(_type,docs,options={}) {
      if(this.failCreate)throw new Error("Falha de criação simulada");
      return docs.map(data=>{const d=clone(data);d._id=options.keepId?d._id:`new${++sequence}`;
        const doc={...d,id:d._id,toObject:()=>clone(d)};this.items.set(doc.id,doc);return doc;});
    },
    async deleteEmbeddedDocuments(_type,ids){for(const id of ids){this.items.delete(id);if(this.failDelete){this.failDelete=false;throw new Error("Falha de exclusão simulada");}}},
    async update(patch){if(this.failUpdate)throw new Error("Falha de atualização simulada");for(const [key,val] of Object.entries(patch)){const keys=key.split('.');let o=this;for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=clone(val);}return this;}}
  return a;
}
const hooks=new Map(),notifications=[];
globalThis.Hooks={once:(n,f)=>hooks.set(n,f),on:(n,f)=>hooks.set(n,f)};
globalThis.ui={notifications:{info:s=>notifications.push(s),error:s=>notifications.push(s)}};
globalThis.game={system:{id:"wilderfeast"},user:{character:null},packs,modules:new Map([[PACKAGE_ID,{}],[ID,{active:false}]]),settings:{register(){},get(){return true;}}};
globalThis.canvas={tokens:{controlled:[]}};
globalThis.fromUuid=async uuid=>source.get(uuid);
const NativeFormData=globalThis.FormData;
globalThis.FormData=class {constructor(form){this.form=form;}entries(){return Object.entries(this.form);}};
let answers=[],confirmAnswer=true,onConfirm=null,lastPrompt=null;
globalThis.foundry={applications:{api:{DialogV2:{wait:async config=>{lastPrompt=config;const answer=answers.shift();return answer?config.buttons[0].callback(null,{form:answer}):null;},confirm:async()=>{onConfirm?.();return confirmAnswer;}}}}};
const runtime=await import("../scripts/compendium/main.mjs");
function reset(){answers=[];confirmAnswer=true;onConfirm=null;canvas.tokens.controlled=[];game.user.character=null;notifications.length=0;}

test("323 documents with complete PDF catalog counts",()=>{
  assert.equal(source.size,323);assert.equal(catalog.techniques.length,66);assert.equal(catalog.traits.length,99);
  assert.equal(new Set(catalog.traits.map(t=>t.name)).size,77);
  for(const [pack,count] of Object.entries({utensilios:6,iniciantes:24,intermediarias:18,avancadas:12,conjunto:12,tracos:99,especialidades:8,referencias:20,macros:8,partes:109,receitas:6,ambiente:1}))assert.equal(packs.get(`${PACKAGE_ID}.${pack}`).getDocuments instanceof Function,true),assert.equal([...source.keys()].filter(k=>k.includes(`.${pack}.`)).length,count);
  for(const [collection,kind] of [[catalog.techniques,"technique"],[catalog.traits,"trait"],[catalog.tools,"tool"],[catalog.specialties,"specialty"]]) {
    for(const row of collection){const d=[...source.values()].find(d=>meta(d).kind===kind && meta(d).name===row.name && (kind!=="trait" || meta(d).level===row.level));assert.ok(d);
      for(const [key,value] of Object.entries(row))assert.deepEqual(meta(d)[key],value,`${row.name}: divergent ${key}`);
      if(d.documentName==="Item")assert.equal(d.system.cost,row.cost);
    }
  }
});
test("every generated UUID and crosslink resolves, and every icon exists",async()=>{
  let count=0;
  for(const d of source.values()){
    for(const [,uuid] of JSON.stringify(d.toObject()).matchAll(/@UUID\[([^\]]+)\]/g)){assert.ok(source.has(uuid),`${d.name}: broken ${uuid}`);count++;}
    const m=meta(d);for(const uuid of [m.mandatoryUuid,...(m.beginnerUuids??[]),...(m.traitUuids??[])].filter(Boolean))assert.ok(source.has(uuid));
    if(d.img)assert.ok((await readFile(new URL(d.img.replace(`modules/${PACKAGE_ID}/`,""),root))).length);
  }
  assert.ok(count>200);
});
test("six tools have the correct required technique and 4/3/2 progressions",()=>{
  const mandatory={Barbante:"RÉDEA CURTA",Cutelo:"CORTE LIMPO",Espeto:"SEQUÊNCIA DE MOVIMENTOS",Luvas:"DE PERTINHO",Maçarico:"LINHA DE FOGO",Panela:"ESCUDO DE AÇO"};
  for(const [name,required] of Object.entries(mandatory)){
    const m=meta(tool(name));assert.equal(m.mandatory,required);assert.equal(source.get(m.mandatoryUuid).name,required);assert.equal(m.beginnerUuids.length,3);
    for(const [category,n] of [["Iniciante",4],["Intermediária",3],["Avançada",2]])assert.equal(catalog.techniques.filter(t=>!t.shared && t.tool===name && t.category===category).length,n);
  }
});
test("shared requirements never leak into the neighboring rule",()=>{
  for(const t of catalog.techniques.filter(t=>t.shared)){assert.equal(t.category,"Intermediária");assert.equal(t.tools.length,3);assert.doesNotMatch(t.effect,/Você só pode usar essas Técnicas/);}
  assert.deepEqual(find("UTENSÍLIO REFORÇADO").flags[ID].tools,["Cutelo","Luvas","Panela"]);
});
test("fixed levels and standard traits are represented exactly once",()=>{
  const levels={AMEAÇAR:2,BANHA:2,BIOLUMINESCÊNCIA:3,ESCALAR:3,ESCAVAR:3,NADAR:3,"NÃO-ME-TOQUE":5,REGENERAÇÃO:5,VENENO:3,VOAR:3};
  for(const [name,max] of Object.entries(levels))for(let level=1;level<=max;level++){const d=find(name,"trait",level);assert.ok(d);assert.equal(d.flags[ENHANCED].meta.level,level);assert.equal(meta(d).maxLevel,max);}
  assert.equal(catalog.traits.filter(t=>t.standard).length,2);
});
test("costs and timing remain references rather than unsolicited deductions",()=>{
  for(const d of source.values())if(d.documentName==="Item"){assert.notEqual(d.flags[ENHANCED].meta.mode,"costs");assert.equal(d.effects.length,0);if(d.type!=="part")assert.ok(d.system.cost);assert.match(d.system.description,/não aplica efeitos automaticamente/);}
  assert.match(find("TÔ CONTIGO").system.description,/total de 5/);
  assert.match(find("BESTA ENSANGUENTADA").system.description,/limitado a 3/);
  assert.match(find("SEM MEDO DA MORTE").system.description,/ajuste o Vigor manualmente/);
  assert.match(find("CORPO QUENTE","trait").system.description,/Divergência/);
  assert.equal(find("MIGRADOR","trait").system.cost,"Não informado no apêndice");
});
for(const t of catalog.tools)for(const orientation of [0,1])test(`creation distribution ${t.name}, orientation ${orientation}`,()=>{
  const a=actor(),m=meta(tool(t.name)),optional=source.get(m.beginnerUuids[0]);const plan=toolPlan(a.toObject(),m,{optional:optional.toObject(),initialize:true,orientation});
  assert.equal(plan.patch[`system.styles.${m.styles[orientation]}.value`],3);assert.equal(plan.patch[`system.styles.${m.styles[1-orientation]}.value`],2);
  assert.equal(Object.keys(plan.patch).filter(k=>k.startsWith("system.styles") && k.endsWith(".value")).reduce((sum,k)=>sum+plan.patch[k],0),7);
  assert.equal(plan.current,t.name==="Panela"?50:20);
});
test("equipping preserves current styles and damage; ranges and reinforcement are correct",async()=>{
  const a=actor();let p=toolPlan(a.toObject(),meta(tool("Panela")));assert.equal(p.current,42);assert.equal(p.max,50);assert.equal(p.patch["system.styles.mighty.value"],undefined);
  await a.createEmbeddedDocuments("Item",[importData(find("UTENSÍLIO REFORÇADO")),importData(find("LANÇAMENTO RICOCHETE"))]);
  p=toolPlan(a.toObject(),meta(tool("Panela")));assert.equal(p.max,60);assert.match(p.range,/2 \(Atirar\)/);
  assert.equal(toolPlan(a.toObject(),meta(tool("Barbante"))).max,20);
  assert.equal(toolPlan(a.toObject(),meta(tool("Espeto"))).range,"1 (Golpear)");
  assert.equal(toolPlan(a.toObject(),meta(tool("Espeto")),{optional:find("AGULHA E LINHA").toObject()}).range,"1 (Golpear); 2 (Atirar)");
  assert.equal(toolPlan(a.toObject(),meta(tool("Maçarico"))).range,"1 (Golpear); 3 (Atirar)");
});
test("creation requires an additional beginner, and rejects cross-tool choices",()=>{
  assert.throws(()=>toolPlan(actor().toObject(),meta(tool("Luvas")),{initialize:true}),/adicional/);
  assert.throws(()=>toolPlan(actor().toObject(),meta(tool("Luvas")),{optional:find("CHICOTADA").toObject()}),/Iniciante/);
  assert.throws(()=>toolPlan(actor("monster").toObject(),meta(tool("Luvas"))),/feral/);
});
test("source IDs and ownership are stripped on import and techniques don't duplicate",()=>{
  const d=find("CORTE LIMPO"),data=importData(d);assert.equal(data._id,undefined);assert.equal(data._key,undefined);assert.equal(data.ownership,undefined);assert.equal(meta(data).sourceUuid,d.uuid);
  assert.equal(uniqueNewTechniques([data],[d]).length,0);
  assert.equal(uniqueNewTechniques([],[d,d]).length,1);
});
test("normalization recognizes manually named traits",()=>{
  assert.ok(sameTrait({type:"trait",name:"Nadar 3",flags:{}},meta(find("NADAR","trait",2))));
  assert.ok(!sameTrait({type:"trait",name:"Voar",flags:{}},meta(find("NADAR","trait",2))));
  assert.ok(sameTrait({type:"trait",name:"Acelerar",flags:{}},meta(find("VELOCIDADE","trait"))));
  assert.ok(sameTrait({type:"trait",name:"Desorientante",flags:{}},meta(find("DESORIENTAR","trait"))));
  assert.equal(uniqueNewTechniques([{type:"technique",name:"Lançamento Ricocheteante",flags:{}}],[find("LANÇAMENTO RICOCHETE")]).length,0);
});
test("tool cancellation at either dialog or preview leaves actor untouched",async()=>{
  for(const step of [1,2,3]){reset();const a=actor(),before=fingerprint(a.toObject());const m=meta(tool("Panela"));answers=step===1?[null]:step===2?[{tool:tool("Panela").id},null]:[{tool:tool("Panela").id},{optional:source.get(m.beginnerUuids[0]).id,orientation:"0"}];confirmAnswer=false;await runtime.configureTool(a);assert.equal(fingerprint(a.toObject()),before);}
});
test("tool workflow imports and configures once, keeping old content",async()=>{
  reset();const a=actor(),doc=tool("Panela"),optional=source.get(meta(doc).beginnerUuids[0]);
  await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait"))]);
  for(let i=0;i<2;i++){answers=[{tool:doc.id},{optional:optional.id,orientation:"1"}];await runtime.configureTool(a);}
  assert.equal(a.system.durability.max,50);assert.equal(a.items.size,3);assert.equal(a.system.styles.mighty.value,4);assert.equal(a.flags[ID].equipped.name,"Panela");
});
test("a concurrent actor change aborts before any Item import",async()=>{
  reset();const a=actor();answers=[{tool:tool("Espeto").id},{optional:"",orientation:"0"}];onConfirm=()=>a.system.tool="Outra escolha";
  await assert.rejects(runtime.configureTool(a),/mudou/);assert.equal(a.items.size,0);assert.equal(a.system.tool,"Outra escolha");
});
test("permission checks run before and again after the preview",async()=>{
  reset();const a=actor();a.isOwner=false;await assert.rejects(runtime.configureTool(a),/editar/);
  a.isOwner=true;answers=[{tool:tool("Espeto").id},{optional:"",orientation:"0"}];onConfirm=()=>a.isOwner=false;
  await assert.rejects(runtime.configureTool(a),/editar/);assert.equal(a.items.size,0);
});
test("failed actor update removes only newly created Items",async()=>{
  reset();const a=actor();await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait"))]);const before=fingerprint(a.toObject());a.failUpdate=true;
  await assert.rejects(runtime.createThenUpdate(a,[find("CORTE LIMPO")],{"system.tool":"Cutelo"}),/atualização/);
  assert.equal(fingerprint(a.toObject()),before);
});
test("specialty imports allowed traits and preserves higher levels",async()=>{
  reset();const a=actor(),s=[...source.values()].find(d=>meta(d).kind==="specialty" && d.name==="Peixeiro");
  await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait",3))]);
  answers=[{specialty:s.id},{first:find("NADAR","trait").id,second:find("CAMUFLAGEM","trait").id}];await runtime.applySpecialty(a);
  assert.equal(a.items.size,2);assert.equal(a.flags[ENHANCED].identity.specialty,"Peixeiro");assert.ok([...a.items.values()].some(i=>meta(i).level===3));
});
test("specialty rejects duplicate choices before writing",async()=>{
  reset();const a=actor(),s=[...source.values()].find(d=>d.name==="Peixeiro");answers=[{specialty:s.id},{first:find("NADAR","trait").id,second:find("NADAR","trait").id}];
  await assert.rejects(runtime.applySpecialty(a),/distintos/);assert.equal(a.items.size,0);
});
test("trait upgrade replaces old levels; repeating the same level doesn't duplicate",async()=>{
  reset();const a=actor();await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait"))]);
  for(let i=0;i<2;i++){answers=[{trait:find("NADAR","trait",3).id}];await runtime.importTrait(a);}
  assert.equal(a.items.size,1);assert.equal(meta([...a.items.values()][0]).level,3);
});
test("trait preview cancellation preserves local edits",async()=>{
  reset();const a=actor();await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait"))]);const before=fingerprint(a.toObject());answers=[{trait:find("NADAR","trait",2).id}];confirmAnswer=false;
  await runtime.importTrait(a);assert.equal(fingerprint(a.toObject()),before);
});
test("partially failed trait deletion restores the old document and removes the new one",async()=>{
  reset();const a=actor();const [old]=await a.createEmbeddedDocuments("Item",[importData(find("NADAR","trait"))]);a.failDelete=true;
  await assert.rejects(runtime.replaceTrait(a,find("NADAR","trait",3),[old]),/exclusão/);assert.equal(a.items.size,1);assert.equal(meta(a.items.get(old.id)).level,1);
});
test("monster importer doesn't grant Tino by default",async()=>{
  reset();const a=actor("monster");answers=[{trait:find("TINO","trait").id}];await assert.rejects(runtime.importTrait(a),/Tino/);assert.equal(a.items.size,0);
});
test("selectedActor honors the synthetic actor of an independent token",()=>{
  reset();const a=actor(),other=actor();canvas.tokens.controlled=[{actor:a}];game.user.character=other;assert.equal(runtime.selectedActor(),a);
  canvas.tokens.controlled.push({actor:other});assert.throws(runtime.selectedActor,/somente um/);
});
test("bootstrapping only exposes API and never changes world documents",()=>{
  reset();hooks.get("init")();hooks.get("ready")();assert.ok(game.modules.get(PACKAGE_ID).api.compendium.configureTool);assert.equal(typeof game.modules.get(PACKAGE_ID).api.compendium.importTrait,"function");
});
test("every macro compiles as an async script",()=>{
  const AsyncFunction=Object.getPrototypeOf(async()=>{}).constructor;
  for(const d of source.values())if(d.documentName==="Macro")assert.doesNotThrow(()=>new AsyncFunction(d.command));
});
test.after(()=>{globalThis.FormData=NativeFormData;});

test("seleção visual dos seis Utensílios usa ícones originais e cancelamento preserva o ator",async()=>{
 reset();const a=actor(),before=fingerprint(a.toObject());answers=[null];await runtime.configureTool(a);
 assert.equal((lastPrompt.content.match(/type="radio"/g)||[]).length,6);
 assert.equal((lastPrompt.content.match(/-livro.png/g)||[]).length,6);
 assert.match(lastPrompt.content,/wfe-tool-chooser/);assert.ok(lastPrompt.classes.includes("wfe-dialog"));assert.ok(lastPrompt.classes.includes("wfc-dialog"));assert.equal((lastPrompt.content.match(/ checked/g)||[]).length,1);assert.equal(fingerprint(a.toObject()),before);
});

test("Traços podem ser lidos antes de importar e cancelar preserva a ficha",async()=>{
 reset();const a=actor(),before=fingerprint(a.toObject());answers=[null];await runtime.importTrait(a);
 assert.equal((lastPrompt.content.match(/data-wfe-preview-group="trait"/g)||[]).length,99);
 assert.ok(lastPrompt.content.includes(find("NADAR","trait").system.description));assert.equal(typeof lastPrompt.render,"function");assert.equal(fingerprint(a.toObject()),before);
});
test("Especialidades exibem a descrição na escolha sem alterar a ficha",async()=>{
 reset();const a=actor(),before=fingerprint(a.toObject());answers=[null];await runtime.applySpecialty(a);
 assert.equal((lastPrompt.content.match(/data-wfe-preview-group="specialty"/g)||[]).length,8);
 assert.ok(lastPrompt.content.includes([...source.values()].find(d=>meta(d).kind==="specialty").pages[0].text.content));assert.equal(fingerprint(a.toObject()),before);
});
