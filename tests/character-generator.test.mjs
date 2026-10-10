import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ID,STYLES,SKILLS} from '../scripts/constants.mjs';
import {meta} from '../scripts/compendium/plans.mjs';
import {initialDraft,validateStep,buildCharacter} from '../scripts/character-data.mjs';
const root=new URL('../',import.meta.url),packs=new Map(),hooks=new Map(),notifications=[],created=[];
for(const name of ['utensilios','especialidades','iniciantes','tracos']){
  const docs=[];for(const file of await fs.readdir(new URL(`pack-source/${name}/`,root))){
    const data=JSON.parse(await fs.readFile(new URL(`pack-source/${name}/${file}`,root),'utf8'));
    docs.push({...data,id:data._id,uuid:`Compendium.${ID}.${name}.${data._id}`,toObject:()=>structuredClone(data)});
  }packs.set(`${ID}.${name}`,{getDocuments:async()=>docs});
}
let answers=[],pages=[],failCreate=false,revoke=false,rendered=0;
globalThis.Hooks={on:(key,fn)=>hooks.set(key,fn),once:(key,fn)=>hooks.set(key,fn)};
globalThis.game={system:{id:'wilderfeast'},user:{id:'player',isGM:false,can:()=>true},packs,modules:new Map([[ID,{api:{roll:()=>{}}}]])};
globalThis.ui={notifications:Object.fromEntries(['warn','error','info'].map(kind=>[kind,text=>notifications.push({kind,text})]))};
globalThis.CONFIG={Actor:{documentClass:{create:async(data,options)=>{if(failCreate)throw new Error('Falha simulada');created.push({data,options});return {name:data.name,sheet:{render:()=>rendered++}};}}}};
const NativeFormData=globalThis.FormData;globalThis.FormData=class{constructor(data){this.data=data;}entries(){return Object.entries(this.data);}};
globalThis.foundry={applications:{ux:{TextEditor:{implementation:{enrichHTML:async html=>html}}},api:{DialogV2:{wait:async config=>{
  pages.push(config);const answer=answers.shift();if(answer?.revoke)game.user.can=()=>false;
  if(!answer)return null;const button=config.buttons.find(b=>b.action===(answer.nav??'next'));
  assert.ok(button);return button.callback(null,{form:answer.data??{}});
}}}}};
const runtime=await import('../scripts/character-generator.mjs'),catalog=await runtime.loadCharacterCatalog();
const reset=()=>{answers=[];pages=[];notifications.length=0;created.length=0;failCreate=false;revoke=false;rendered=0;game.user.can=()=>true;};
const completed=()=>({...initialDraft(catalog),name:'Lina <da trilha>',upbringing:'Arroz ao fogo',initiation:'Ensopado de monstro',ambition:'Banquete à beira-mar',packName:'Colheres do Sol',appearance:'Escamas azuis'});
const finish=()=>[{},{},{},{},{name:'Lina'}].map(data=>({data}));

for(const tool of catalog.tools)for(const orientation of [0,1])test(`novo feral: ${tool.name}, orientação ${orientation}`,()=>{
  const draft={...completed(),tool:tool.id,[`orientation-${tool.id}`]:String(orientation)},before=structuredClone(draft),data=buildCharacter(draft,catalog,'player');
  assert.equal(data.system.styles[meta(tool).styles[orientation]].value,3);assert.equal(data.system.styles[meta(tool).styles[1-orientation]].value,2);
  assert.deepEqual(Object.values(data.system.styles).map(s=>s.value).sort(),[1,1,2,3]);assert.ok(Object.values(data.system.styles).every(s=>s.max===s.value));
  assert.equal(data.system.stamina.value,20);assert.equal(data.system.durability.max,tool.name==='Panela'?50:20);
  assert.equal(data.items.filter(i=>i.type==='technique').length,2);assert.equal(data.items.filter(i=>i.type==='trait').length,2);
  assert.deepEqual(Object.values(data.system.skills).map(s=>s.value).sort(),[0,0,0,0,0,0,0,0,0,1,1,1]);
  assert.ok(data.items.every(i=>!i._id&&!i.ownership&&!i.folder));assert.deepEqual(data.ownership,{default:0,player:3});assert.deepEqual(draft,before);
});
for(const specialty of catalog.specialties)test(`Traços iniciais válidos: ${specialty.name}`,()=>{
  const draft={...completed(),specialty:specialty.id};
  draft.second=catalog.initialTraits.find(t=>meta(t).baseKey!==meta(specialty.traits[0]).baseKey).id;
  const data=buildCharacter(draft,catalog,'player');assert.equal(data.flags[ID].identity.specialty,specialty.name);
  assert.equal(data.items.find(i=>i.type==='trait').name,specialty.traits[0].name);
});
test('duas Técnicas, três habilidades distintas e dois Traços são obrigatórios',()=>{
  const d=completed();const t=catalog.tools[0],s=catalog.specialties[0];
  assert.throws(()=>validateStep(0,{...d,[`optional-${t.id}`]:catalog.tools[1].beginners[0].id},catalog),/Técnica/);
  assert.throws(()=>validateStep(1,{...d,second:s.traits[0].id},catalog),/distintos/);
  assert.throws(()=>validateStep(2,{...d,ambitionSkill:d.upbringingSkill},catalog),/diferentes/);
  assert.throws(()=>validateStep(2,{...d,upbringingSkill:'__proto__'},catalog),/Habilidade/);
  assert.throws(()=>validateStep(4,{...d,name:'   '},catalog),/nome/);
});
test('bônus de técnicas ajustam Alcance e Durabilidade na criação',()=>{
  const d=completed(),panela=catalog.tools.find(t=>t.name==='Panela'),ricochete=panela.beginners.find(t=>t.name==='LANÇAMENTO RICOCHETE');
  const p=buildCharacter({...d,tool:panela.id,[`optional-${panela.id}`]:ricochete.id},catalog,'p');
  assert.equal(p.system.durability.max,50);assert.match(p.system.range,/2 \(Atirar\)/);
  const espeto=catalog.tools.find(t=>t.name==='Espeto'),agulha=espeto.beginners.find(t=>t.name==='AGULHA E LINHA');
  assert.match(buildCharacter({...d,tool:espeto.id,[`optional-${espeto.id}`]:agulha.id},catalog,'p').system.range,/2 \(Atirar\)/);
});
for(const stop of [0,1,2,3,4])test(`cancelar na página ${stop+1} não cria Ator`,async()=>{
  reset();answers=[...Array.from({length:stop},()=>({data:{}})),null];await runtime.generateCharacter();assert.equal(created.length,0);assert.equal(pages.length,stop+1);
});
test('cada etapa tem uma página separada e criar grava todos os dados de uma vez',async()=>{
  reset();answers=finish();answers[2].data=completed();await runtime.generateCharacter();
  assert.equal(pages.length,5);pages.forEach((p,i)=>{assert.ok(p.content.includes(`data-wfe-generator-step="${i}"`));assert.equal((p.content.match(/data-wfe-generator-step/g)||[]).length,1);});
  assert.equal(created.length,1);assert.equal(rendered,1);assert.equal(created[0].data.items.length,4);assert.equal(created[0].data.flags[ID].identity.packName,'Colheres do Sol');assert.equal(created[0].data.flags[ID].identity.appearance,'Escamas azuis');
});
test('Voltar preserva escolhas e não cria Atores intermediários',async()=>{
  reset();answers=[{data:{nature:'Paciente'}},{nav:'back',data:{importantMonster:'Shim'}},...finish()];await runtime.generateCharacter();
  assert.equal(pages.length,7);assert.match(pages[2].content,/value="Paciente"/);assert.equal(created[0].data.flags[ID].identity.importantMonster,'Shim');assert.equal(created.length,1);
});
test('escolha inválida reabre somente a etapa e não escreve documentos',async()=>{
  reset();answers=[{data:{}},{data:{}},{data:{ambitionSkill:'search'}},{data:{ambitionSkill:'craft'}},{data:{}},{data:{name:'Lina'}}];await runtime.generateCharacter();
  assert.equal(pages.length,6);assert.equal(notifications.filter(n=>n.kind==='warn').length,1);assert.equal(created.length,1);
});
test('permissões são conferidas ao abrir e ao concluir',async()=>{
  reset();game.user.can=()=>false;await assert.rejects(runtime.generateCharacter(),/permissão/);assert.equal(pages.length,0);
  reset();answers=finish();answers[4].revoke=true;await assert.rejects(runtime.generateCharacter(),/removida/);assert.equal(created.length,0);
});
test('falha na criação não reinicia nem duplica o Ator',async()=>{
  reset();failCreate=true;answers=finish();await assert.rejects(runtime.generateCharacter(),/Falha simulada/);assert.equal(created.length,0);
  reset();answers=finish();await Promise.all([runtime.generateCharacter(),runtime.generateCharacter()]);assert.equal(created.length,1);assert.equal(pages.length,5);
});
test('conteúdo digitado fica escapado na prévia e preservado na identidade',()=>{
  const d=completed();d.packName='<img src=x onerror=alert(1)>';const html=runtime.generatorPage(4,d,catalog);
  assert.ok(!html.includes(d.packName));assert.match(html,/&lt;img src=x/);assert.equal(buildCharacter(d,catalog,'p').flags[ID].identity.packName,d.packName);
});
test('compatibilidade inclui a geração verificada e API preserva ações existentes',async()=>{
  const manifest=JSON.parse(await fs.readFile(new URL('module.json',root),'utf8'));assert.equal(manifest.compatibility.verified,'13');assert.ok(manifest.esmodules.includes('scripts/character-generator.mjs'));
  hooks.get('ready')();assert.equal(typeof game.modules.get(ID).api.generateCharacter,'function');assert.equal(typeof game.modules.get(ID).api.roll,'function');
});
test.after(()=>{globalThis.FormData=NativeFormData;});
