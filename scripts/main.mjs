import './document-theme.mjs';
import {ID,SKILLS,STYLES} from "./constants.mjs";
import * as rules from "./rules.mjs";
import {FeralSheet,MonsterSheet} from "./sheets.mjs";
import {rollCheck,rollDialog,bindChat,updateCheck} from "./rolls.mjs";
import {safe,selectedActor,changeVigor,vigorDialog,setCondition,beginTurn,undo,harmonyDialog,configureItem,useItem,repairTokenBars,migrateSkills,restoreSkills,stateOf} from "./runtime.mjs";

Hooks.once("init",()=>{
  if(game.system.id!=="wilderfeast")return;
  game.settings.register(ID,"enhancedSheets",{name:"Usar fichas aprimoradas como padrão",hint:"A ficha original permanece disponível na configuração de cada ator.",scope:"world",config:true,type:Boolean,default:true,requiresReload:true});
  game.settings.register(ID,"enhancedRolls",{name:"Usar testes aprimorados também na ficha original",hint:"Corrige tokens independentes, zero d6, visibilidade e distribuição assistida de pontos. Pode ser desativado para usar a rolagem original.",scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(ID,"trackActions",{name:"Sugerir controle de ações ao atacar",hint:"O diálogo permite resolver exceções manualmente. A iniciativa e a alternância da Caçada continuam sob controle da Guia.",scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(ID,"harmony",{name:"Harmonia da matilha",scope:"world",config:false,type:Object,default:{value:3,max:3},onChange:()=>{for(const app of Object.values(ui.windows??{}))if(app instanceof FeralSheet || app instanceof MonsterSheet)app.render(false);}});
  const actors=foundry.documents.collections.Actors;
  actors.registerSheet(ID,FeralSheet,{types:["wilder"],label:"Wilderfeast — Feral aprimorado",makeDefault:game.settings.get(ID,"enhancedSheets")});
  actors.registerSheet(ID,MonsterSheet,{types:["monster"],label:"Wilderfeast — Monstro aprimorado",makeDefault:game.settings.get(ID,"enhancedSheets")});
  game.modules.get(ID).api={version:"0.8.2",rules,selectedActor,stateOf,roll:rollCheck,rollDialog,updateCheck,changeVigor,vigorDialog,setCondition,beginTurn,undo,harmonyDialog,configureItem,useItem,repairTokenBars,migrateSkills,restoreSkills};
});

Hooks.once("i18nInit",()=>{
  if(game.system.id!=="wilderfeast" || !game.i18n.lang.toLowerCase().startsWith("pt"))return;
  const translations={WILDERFEAST:{LABEL:{background:"História",techniques:"Técnicas",stamina:"Vigor",tool:"Utensílio",range:"Alcance"},SKILLS:Object.fromEntries(Object.entries(SKILLS).map(([key,label])=>[key,{label}]))}};
  foundry.utils.mergeObject(game.i18n.translations,translations);
  for(const [key,label] of Object.entries(SKILLS))if(game.system.CONST?.SKILLS[key])game.system.CONST.SKILLS[key].label=label;
});

Hooks.once("ready",()=>{
  if(game.system.id!=="wilderfeast")return;
  const prototype=CONFIG.Actor.documentClass.prototype,original=prototype.rollAction;
  prototype.rollAction=function(data={}) {
    if(!game.settings.get(ID,"enhancedRolls"))return original.call(this,data);
    return safe(()=>data.askDialog?rollDialog(this,data):rollCheck(this,data));
  };
  prototype.setStyleToMax=function(style) {
    if(!this.isOwner || !STYLES[style])throw new Error("Estilo inválido ou sem permissão.");
    return this.update({[`system.styles.${style}.value`]:this.system.styles[style].max});
  };
  console.info(`${ID} 0.8.2: fichas e regras assistidas carregadas.`);
});

Hooks.on("preCreateActor",(actor,data)=>{
  if(game.system.id!=="wilderfeast" || !["wilder","monster"].includes(actor.type))return;
  const token=actor.toObject().prototypeToken??{},patch={};
  if(!token.bar1?.attribute || ["vitalite","mental"].includes(token.bar1.attribute))patch["prototypeToken.bar1.attribute"]="stamina";
  if(actor.type==="wilder" && (!token.bar2?.attribute || ["vitalite","mental"].includes(token.bar2.attribute)))patch["prototypeToken.bar2.attribute"]="durability";
  if(actor.type==="monster" && ["vitalite","mental"].includes(token.bar2?.attribute))patch["prototypeToken.bar2.attribute"]=null;
  if(Object.keys(patch).length)actor.updateSource(patch);
});

Hooks.on("renderActorSheet",(app,html)=>{
  if(game.system.id!=="wilderfeast" || app instanceof FeralSheet || app instanceof MonsterSheet)return;
  const root=html[0]??html;
  root.querySelectorAll(".skill_val[data-sname]").forEach(node=>node.dataset.group="skills");
  if(game.i18n.lang.toLowerCase().startsWith("pt"))root.querySelectorAll(".skill_name[data-sname]").forEach(node=>{if(SKILLS[node.dataset.sname])node.textContent=SKILLS[node.dataset.sname];});
  if(app._tabs?.[0] && !root.querySelector(".tab.active"))app.activateTab("skills");
});

Hooks.on("renderItemSheet",(app,html)=>{
  if(game.system.id!=="wilderfeast" || !app.item?.isOwner || !["trait","technique","part"].includes(app.item.type))return;
  const root=html[0]??html;if(root.querySelector(".wfe-meta-launch"))return;
  const button=document.createElement("button");button.type="button";button.className="wfe-meta-launch";button.textContent="Configurar nível e custos";
  button.addEventListener("click",event=>{event.preventDefault();safe(()=>configureItem(app.item));});
  (root.querySelector("form")??root).append(button);
});

Hooks.on("renderChatMessageHTML",bindChat);
