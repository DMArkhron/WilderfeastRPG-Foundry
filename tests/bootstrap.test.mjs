import test from "node:test";
import assert from "node:assert/strict";
import {ID,SKILLS} from "../scripts/constants.mjs";
const callbacks=new Map(),settings=new Map(),registrations=[];
function mergeObject(a,b,{inplace=true}={}){const out=inplace?a:structuredClone(a);for(const[k,v]of Object.entries(b)){if(v&&typeof v==="object"&&!Array.isArray(v))out[k]=mergeObject(out[k]??{},v);else out[k]=v;}return out;}
globalThis.Hooks={once:(key,fn)=>{const list=callbacks.get(key)??[];list.push(fn);callbacks.set(key,list);},on:(key,fn)=>{const list=callbacks.get(key)??[];list.push(fn);callbacks.set(key,list);}};
globalThis.foundry={utils:{mergeObject},appv1:{sheets:{ActorSheet:class{static get defaultOptions(){return {}}}}},documents:{collections:{Actors:{registerSheet:(id,cls,options)=>registrations.push({id,cls,options})}}}};
globalThis.game={system:{id:"wilderfeast",CONST:{SKILLS:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{label:"errado"}]))}},i18n:{lang:"pt-BR",translations:{}},modules:new Map([[ID,{}]]),settings:{register:(id,key,data)=>settings.set(key,data.default),get:(id,key)=>settings.get(key)},user:{id:"u1",isGM:true}};
globalThis.ui={windows:{},notifications:{error:()=>{}}};
class NativeActor {async rollAction(){return "original";}async update(data){this.change=data;return data;}}
globalThis.CONFIG={Actor:{documentClass:NativeActor}};
await import("../scripts/main.mjs");
await import("../scripts/compendium/main.mjs");
const hook=async key=>{for(const fn of callbacks.get(key)??[])await fn();};
await hook("init");await hook("i18nInit");await hook("ready");
test("inicialização registra duas fichas e expõe API",()=>{assert.equal(registrations.length,2);assert.deepEqual(registrations.map(r=>r.options.types[0]),["wilder","monster"]);assert.ok(game.modules.get(ID).api.roll);assert.equal(settings.get("harmony").max,3);});
test("traduções e constantes apontam para habilidades corretas",()=>{assert.equal(game.i18n.translations.WILDERFEAST.SKILLS.assurance.label,"Assegurar");assert.equal(game.system.CONST.SKILLS.search.label,"Procurar");});
test("encaminhamento de rolagem pode ser desativado",async()=>{settings.set("enhancedRolls",false);const actor=new NativeActor();assert.equal(await actor.rollAction({}),"original");settings.set("enhancedRolls",true);});
test("maximizar estilo escreve no campo nativo correto",async()=>{const actor=new NativeActor();actor.isOwner=true;actor.system={styles:{mighty:{max:4}}};await actor.setStyleToMax("mighty");assert.deepEqual(actor.change,{"system.styles.mighty.value":4});});
test("criação preserva barras personalizadas",()=>{let patch;const actor={type:"wilder",toObject:()=>({prototypeToken:{bar1:{attribute:"custom"},bar2:{attribute:"other"}}}),updateSource:p=>{patch=p;}};callbacks.get("preCreateActor")[0](actor,{});assert.equal(patch,undefined);});
test("criação corrige barras inválidas de feral",()=>{let patch;const actor={type:"wilder",toObject:()=>({prototypeToken:{bar1:{attribute:"vitalite"},bar2:{attribute:"mental"}}}),updateSource:p=>{patch=p;}};callbacks.get("preCreateActor")[0](actor,{});assert.deepEqual(patch,{"prototypeToken.bar1.attribute":"stamina","prototypeToken.bar2.attribute":"durability"});});
test("criação de monstro remove barra secundária inexistente",()=>{let patch;const actor={type:"monster",toObject:()=>({prototypeToken:{bar1:{attribute:"vitalite"},bar2:{attribute:"mental"}}}),updateSource:p=>{patch=p;}};callbacks.get("preCreateActor")[0](actor,{});assert.equal(patch["prototypeToken.bar2.attribute"],null);});
test("seleção padrão da aba é mecânica e listas usam itens incorporados",()=>{assert.equal(registrations[0].cls.defaultOptions.tabs[0].initial,"mechanics");assert.equal(registrations[0].cls.defaultOptions.dragDrop[0].dragSelector,".wfe-item[data-item-id]");});

test("API integrada preserva rolagens e assistentes de compêndio no mesmo módulo",()=>{assert.ok(game.modules.get(ID).api.roll);assert.ok(game.modules.get(ID).api.compendium.configureTool);assert.ok(game.modules.get(ID).api.compendium.importTrait);assert.equal(game.modules.get(ID).api.version,"0.8.1");});
