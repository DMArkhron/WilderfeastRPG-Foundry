import {toolbarMarkup} from '../scripts/compendium/toolbar.mjs';
/** Renders the actual sheet template with sample documents, outside Foundry. */
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
import {ID,SKILLS,STYLES} from "../scripts/constants.mjs";
import {conditionLevels} from "../scripts/rules.mjs";
const require=createRequire(import.meta.url),root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let Handlebars;
try {Handlebars=require("handlebars");}catch{
  const context={};vm.runInNewContext(await fs.readFile(process.env.WFE_HANDLEBARS_BUNDLE??"/tmp/wfe-handlebars/package/dist/handlebars.js","utf8"),context);Handlebars=context.Handlebars;
}
function mergeObject(a,b,{inplace=true}={}){const out=inplace?a:structuredClone(a);for(const[k,v]of Object.entries(b)){if(v && typeof v==="object"&&!Array.isArray(v))out[k]=mergeObject(out[k]??{},v);else out[k]=structuredClone(v);}return out;}
globalThis.foundry={utils:{mergeObject},appv1:{sheets:{ActorSheet:class {
  constructor(actor,{editable=true}={}){this.actor=actor;this.isEditable=editable;}
  static get defaultOptions(){return {tabs:[]};}
  async getData(){return {};}
}}},applications:{ux:{TextEditor:{implementation:{enrichHTML:async text=>text??""}}}}};
globalThis.game={settings:{get:()=>({value:3,max:3})}};
const {FeralSheet,MonsterSheet}=await import("../scripts/sheets.mjs");
const {checkCard}=await import("../scripts/rolls.mjs");
const assetData=async name=>`data:image/svg+xml;base64,${Buffer.from(await fs.readFile(path.join(root,"assets",name))).toString("base64")}`;
const images={feral:await assetData("feral.svg"),monster:await assetData("monster-cute.svg")};
function item(id,name,type,description,extra={}) {
  return {id,name,type,img:extra.img??images[type==="part"?"monster":"feral"],system:{cost:extra.cost??"",description,durability:extra.durability??{value:15,max:15}},getFlag:()=>extra.meta??{}};
}
const techniqueSources=await Promise.all((await fs.readdir(path.join(root,'pack-source/iniciantes'))).map(async name=>JSON.parse(await fs.readFile(path.join(root,'pack-source/iniciantes',name),'utf8'))));
const sampleTechnique=techniqueSources.find(d=>d.name==='SEQUÊNCIA DE MOVIMENTOS');
function actor(monster=false) {
  const identity={pronouns:"ela / dela",specialty:"Criaturas aladas",nature:"Metódica",aspiration:"Mais espontânea",familiarBeasts:"As feras que habitam os desfiladeiros.",signatureDish:"Ensopado de raízes com ervas",signatureSeasoning:"Sal de pedra e pimenta",upbringing:"Uma tigela de caldo compartilhada na varanda.",initiation:"O primeiro banquete após uma caçada difícil.",ambition:"A receita que ninguém conseguiu repetir.",connection:"Uma dívida de gratidão com a matilha."};
  const data={name:monster?"Fera dos Desfiladeiros":"Lina, a Feral",type:monster?"monster":"wilder",img:"icons/svg/mystery-man.svg"};
  const system={styles:Object.fromEntries(Object.keys(STYLES).map((k,i)=>[k,{value:[3,2,1,1][i],max:3}])),skills:Object.fromEntries(Object.keys(SKILLS).map((k,i)=>[k,{value:i%3,max:3}])),stamina:{value:monster?36:17,max:monster?50:20},durability:{value:20,max:20},range:"1 (Golpear); 2 (Atirar)",tool:"Espeto",description:"<p>Uma presença marcante nas trilhas da matilha. Este é um personagem de exemplo para a revisão da interface.</p>",equipment:"<p>Utensílio, avental, mochila de ingredientes e uma tigela de cerâmica.</p>",behavior:"<p>Protege o ninho e observa a matilha antes de se aproximar. Quando encurralada, procura uma rota de fuga entre as pedras.</p>",quickref:"<p><strong>Guia:</strong> alterne turnos curtos e completos. As asas quebradas limitam sua mobilidade; resolva a consequência de acordo com a descrição da Parte.</p>"};
  const items=monster?[item("p1","Garras de pedra","part","<p>Uma Parte resistente, usada para ataques próximos.</p>",{durability:{value:18,max:25}}),item("p2","Asas fraturadas","part","<p>A criatura já não consegue alcançar as correntes de ar mais altas.</p>",{durability:{value:0,max:20}}),item("t1","Pele resistente","trait","<p>Um traço passivo de exemplo. A Guia resolve seus efeitos.</p>",{cost:"Passiva",meta:{level:2,mode:"passive"}}),item("t2","Rugido ancestral","trait","<p>O eco da fera reverbera pelo desfiladeiro.</p>",{cost:"3 Vigor",meta:{level:1,mode:"costs",vigorCost:3}})]:[item("s1",sampleTechnique.name,"technique",sampleTechnique.system.description.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g,'<a class="content-link" href="#">$2</a>'),{img:sampleTechnique.img,cost:sampleTechnique.system.cost,meta:sampleTechnique.flags[ID].meta}),item("s2","Técnica de treinamento","technique","<p>Consulte o efeito e confirme as consequências com a Guia.</p>",{cost:"5 Vigor",meta:{category:"Intermediária",tool:"Espeto"}}),item("t1","Visão aguçada","trait","<p>Seus olhos reconhecem detalhes no horizonte.</p>",{cost:"Passiva",meta:{level:1,origin:"Banquete no desfiladeiro"}}),item("t2","Asas","trait","<p>Uma mutação que pode justificar virar o bicho quando fizer sentido.</p>",{cost:"1 Ação",meta:{level:2,origin:"Fera alada"}})];
  const state={conditions:conditionLevels(monster?{exposed:1,injured:1}:{rested:2}),actions:monster?1:3,actionsMax:3,attackStyles:[],distance:2,terrain:monster?"Desfiladeiro":"Chão"};
  return {...data,system,items,isOwner:true,getFlag:(_ns,key)=>key==="state"?state:key==="identity"?identity:undefined,toObject:()=>({...data,system})};
}
Handlebars.registerHelper("checked",value=>value?"checked":"");
Handlebars.registerHelper("editor",(value,opts)=>new Handlebars.SafeString(`<div class="editor"><div class="editor-content">${value??""}</div>${opts.hash.editable?"<p class=\"wfe-muted\">Editor de texto do Foundry</p>":""}</div>`));
const template=Handlebars.compile(await fs.readFile(path.join(root,"templates/actor.hbs"),"utf8"));
const css=await fs.readFile(path.join(root,"styles/enhanced.css"),"utf8")+await fs.readFile(path.join(root,"styles/compendium.css"),"utf8");
const out=path.join(root,"preview");await fs.mkdir(out,{recursive:true});
for(const monster of [false,true])for(const editable of [true,false]) {
  const sample=actor(monster),sheet=new (monster?MonsterSheet:FeralSheet)(sample,{editable}),context=await sheet.getData();
  context.actor.img=images[monster?"monster":"feral"];
  const body=template(context).replace(/(<form[^>]*>)/,`$1${toolbarMarkup({editable,isWilder:!monster})}`).replaceAll(`modules/${ID}/`,"../");assert.ok(body.includes(monster?"wfe-monster":"wfe-feral"));assert.ok(!body.includes("undefined"));
  const card=checkCard({actorType:sample.type,actorName:sample.name,tool:sample.system.tool,style:"mighty",skill:"strike",faces:monster?20:8,action:monster?12:7,pool:[5,4,6],brio:0,tino:[],budget:2,used:0,advantage:"neutral",finalized:false,attack:true,actionsPaid:true}).replaceAll(`modules/${ID}/`,"../");
  const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia ${monster?"Monstro":"Feral"}</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;padding:28px;background:#d9d4ca;font-family:Arial} .window-app{width:min(980px,100%);height:1040px;margin:auto;border-radius:10px;box-shadow:0 14px 40px #262d3033;overflow:hidden}.window-header{height:32px;background:#222a30;color:#f5efdc;font-size:12px;padding:8px 14px}.window-content{height:calc(100% - 32px)}input,textarea{width:100%}a,button{cursor:pointer}.chat-preview{width:350px;margin:24px auto} ${css}</style><main class="window-app wfe-sheet ${monster?"wfe-monster-sheet":""}"><div class="window-header">Wilderfeast — ${monster?"Monstro":"Feral"} aprimorado${editable?"":" · Somente leitura"}</div><div class="window-content">${body}</div></main><aside class="chat-preview">${card}</aside><script>const tabs=document.querySelectorAll('.wfe-tabs a');function activate(tab){document.querySelectorAll('.wfe-body>.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));tabs.forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));}tabs.forEach(el=>el.addEventListener('click',()=>activate(el.dataset.tab)));activate('mechanics');</script></html>`;
  await fs.writeFile(path.join(out,`${monster?"monster":"feral"}${editable?"":"-readonly"}.html`),html);
  const names=[...body.matchAll(/name="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(names).size,names.length,"O formulário não pode ter campos repetidos");
  if(!editable)assert.ok(!body.includes('data-edit="img"'));
}
console.log("Templates compilados, campos únicos e contextos de feral/monstro/editável/somente leitura verificados.");
