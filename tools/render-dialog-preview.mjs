import {bindChoicePreviews} from '../scripts/dialogs.mjs';
/** Capture the real module dialog contents; offline framing is a Foundry facsimile. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ID,STYLES,SKILLS} from '../scripts/constants.mjs';
import {meta} from '../scripts/compendium/plans.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),out=path.join(root,'preview/dialogs');await fs.mkdir(out,{recursive:true});
const packs=new Map(),source=new Map();
for(const pack of JSON.parse(await fs.readFile(path.join(root,'module.json'),'utf8')).packs) {
 const docs=[];for(const file of await fs.readdir(path.join(root,'pack-source',pack.name))) {
  const data=JSON.parse(await fs.readFile(path.join(root,'pack-source',pack.name,file),'utf8'));if(data._key?.startsWith('!folders!'))continue;
  const doc={...data,id:data._id,documentName:pack.type,uuid:`Compendium.${ID}.${pack.name}.${pack.type}.${data._id}`,toObject:()=>structuredClone(data)};docs.push(doc);source.set(doc.uuid,doc);
 }packs.set(`${ID}.${pack.name}`,{getDocuments:async()=>docs});
}
let captured=[],answers=[];
globalThis.Hooks={once(){},on(){}};
globalThis.game={packs,user:{isGM:true},settings:{get:(_ns,key)=>key==='rollMode'?'publicroll':true}};
globalThis.foundry={applications:{ux:{TextEditor:{implementation:{enrichHTML:async html=>html.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g,'<a class="content-link" href="#">$2</a>')}}},api:{DialogV2:{wait:async config=>{captured.push(config);return answers.shift()??null;},confirm:async config=>{captured.push({...config,buttons:[{label:'Confirmar'},{label:'Cancelar'}]});return false;}}}}};
globalThis.fromUuid=async uuid=>source.get(uuid);
const actor={uuid:'Actor.preview',name:'Lina, a Feral',type:'wilder',isOwner:true,items:[],flags:{},system:{tool:'Espeto',range:'1 (Golpear)',stamina:{value:17,max:20},durability:{value:12,max:20},styles:Object.fromEntries(Object.keys(STYLES).map(k=>[k,{value:2,max:3}])),skills:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{value:1}]))},getFlag:()=>undefined,toObject(){return {type:this.type,system:structuredClone(this.system),items:[],flags:{}};}};
const {rollDialog}=await import('../scripts/rolls.mjs');const {vigorDialog,configureItem}=await import('../scripts/runtime.mjs');const {configureTool,importTrait,applySpecialty}=await import('../scripts/compendium/main.mjs');
const cases=[];
for(const [name,fn] of [['trait',()=>importTrait(actor)],['specialty',()=>applySpecialty(actor)],['test',()=>rollDialog(actor)],['attack',()=>rollDialog(actor,{attack:true})],['vigor',()=>vigorDialog(actor)],['item',()=>configureItem({name:'Sequência de movimentos',isOwner:true,type:'technique',getFlag:()=>({category:'Iniciante',tool:'Espeto'})})]]) {captured=[];await fn();cases.push([name,captured[0]]);}
captured=[];const tool=(await packs.get(`${ID}.utensilios`).getDocuments()).find(d=>meta(d).name==='Espeto');answers=[{tool:tool.id},{optional:'',orientation:'0'}];await configureTool(actor);
for(const [i,name] of ['utensil','equip','confirm'].entries())cases.push([name,captured[i]]);
captured=[];answers=[{specialty:(await packs.get(`${ID}.especialidades`).getDocuments())[0].id},null];await applySpecialty(actor);cases.push(['specialty-traits',captured[1]]);
const css=(await fs.readFile(path.join(root,'styles/enhanced.css'),'utf8')).replaceAll("../assets/","../../assets/")+'\n'+await fs.readFile(path.join(root,'styles/compendium.css'),'utf8');
for(const [name,config] of cases) {
 if(!config)throw new Error(`Missing ${name}`);
 const content=config.content.replaceAll(`modules/${ID}/`,'../../');
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${config.window.title}</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#c9c3b5;font-family:Arial}.application{width:${config.position.width}px;display:flex;flex-direction:column}.window-header{display:flex;align-items:center;justify-content:space-between}.window-title{margin:0}.window-header button{width:24px;height:24px}.window-content{margin:0}.form-footer button{cursor:pointer} ${css}</style><main class="application dialog ${config.classes.join(' ')}"><header class="window-header"><h1 class="window-title">${config.window.title}</h1><button type="button" aria-label="Fechar">×</button></header><form class="window-content"><div class="dialog-content">${content}</div><footer class="form-footer">${config.buttons.map((b,i)=>`<button type="${i?'button':'submit'}">${b.label}</button>`).join('')}</footer></form></main><script>(${bindChoicePreviews.toString()})(null,{element:document.querySelector('.application')});document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();document.body.dataset.confirmed='true';});</script></html>`;
 await fs.writeFile(path.join(out,`${name}.html`),html);
}
console.log(`${cases.length} janelas capturadas dos assistentes reais para prévia offline.`);
