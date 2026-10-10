import {toolIcon} from './assets.mjs';
import {toolAttacks} from './tool-attacks.mjs';
import {ID,STYLES,SKILLS,CONDITIONS,IDENTITY} from "./constants.mjs";
import {integer,effectiveMax} from "./rules.mjs";
import {safe,esc,stateOf,prompt,confirm,vigorDialog,undo,beginTurn,setCondition,harmonyDialog,configureItem,useItem,repairTokenBars,migrateSkills,restoreSkills,requireOwner} from "./runtime.mjs";
import {rollDialog} from "./rolls.mjs";
export class EnhancedSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions,{classes:["wfe-sheet","sheet","actor"],width:980,height:940,resizable:true,submitOnChange:true,closeOnSubmit:false,tabs:[{navSelector:".wfe-tabs",contentSelector:".wfe-body",initial:"mechanics"}],scrollY:[".wfe-scroll"],dragDrop:[{dragSelector:".wfe-item[data-item-id]",dropSelector:".wfe-body"}]},{inplace:false});
  }
  get template() {return `modules/${ID}/templates/actor.hbs`;}
  async getData(options={}) {
    const context=await super.getData(options),actor=this.actor,state=stateOf(actor),editable=this.isEditable;
    const enrich=(text,doc=actor)=>foundry.applications.ux.TextEditor.implementation.enrichHTML(text??"",{async:true,secrets:actor.isOwner,relativeTo:doc});
    const items=await Promise.all(actor.items.map(async item=>{
      const meta=item.getFlag(ID,"meta") ?? {};
      return {id:item.id,name:item.name,img:item.img,type:item.type,cost:String(item.system.cost??"").replace(/^Custo:\s*|^Custa:\s*/i,""),description:await enrich(item.system.description,item),meta,
        hasLevel:Number.isInteger(meta.level)&&meta.level>0&&!item.name.endsWith(` ${meta.level}`),level:meta.level,category:meta.category??"",part:item.type==="part",durability:item.system.durability,broken:item.type==="part" && item.system.durability.value===0};
    }));
    const identity=actor.getFlag(ID,"identity")??{},actorData=actor.toObject(false);
    if(!actorData.img || actorData.img==="icons/svg/mystery-man.svg" || actor.type==="monster"&&actorData.img===`modules/${ID}/assets/monster.svg`)actorData.img=`modules/${ID}/assets/${actor.type==="monster"?"monster-cute":"feral"}.svg`;
    return {...context,actor:actorData,system:actor.system,editable,owner:actor.isOwner,isMonster:actor.type==="monster",isWilder:actor.type==="wilder",state,
      identity,identityFields:IDENTITY.filter(([key])=>!["pronouns","specialty"].includes(key)).map(([key,label])=>({key,label,value:identity[key]??""})),
      styles:Object.entries(STYLES).map(([key,label])=>({key,label,value:actor.system.styles[key].value})),
      skills:Object.entries(SKILLS).map(([key,label])=>({key,label,value:actor.system.skills[key].value})),
      traits:items.filter(i=>i.type==="trait"),techniques:items.filter(i=>i.type==="technique"&&i.meta.category!=="Receita"),recipes:items.filter(i=>i.type==="technique"&&i.meta.category==="Receita"),parts:items.filter(i=>i.type==="part"),
      conditions:Object.entries(CONDITIONS).filter(([k,c])=>!c.part && (actor.type==="monster" || k!=="convalescent")).map(([key,c])=>({key,...c,level:state.conditions[key],active:state.conditions[key]>0})),
      activeConditions:Object.entries(CONDITIONS).filter(([k])=>state.conditions[k]>0).map(([key,c])=>({...c,level:state.conditions[key]})),
      vigorPercent:Math.max(0,Math.min(100,100*Number(actor.system.stamina.value)/Math.max(1,effectiveMax(actor.system.stamina.max,state.conditions)))),
      vigorValue:Math.max(0,Math.min(Number(actor.system.stamina.value),effectiveMax(actor.system.stamina.max,state.conditions))),
      vigorMax:effectiveMax(actor.system.stamina.max,state.conditions),toolBroken:actor.type==="wilder"&&actor.system.durability.value===0,
      toolPercent:Math.max(0,Math.min(100,100*Number(actor.system.durability?.value??0)/Math.max(1,Number(actor.system.durability?.max??1)))),
      toolValue:Math.max(0,Math.min(Number(actor.system.durability?.value??0),Number(actor.system.durability?.max??1))),
      toolIcon:toolIcon(actor.system.tool),toolAttacks:toolAttacks(actor),harmony:game.settings.get(ID,"harmony"),moduleId:ID,
      description:await enrich(actor.system.description),equipment:await enrich(actor.system.equipment),behavior:await enrich(actor.system.behavior),quickref:await enrich(actor.system.quickref)};
  }
  activateListeners(html) {
    super.activateListeners(html);const root=html[0];
    root.querySelectorAll("[data-wfe-action]").forEach(button=>button.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      if(!this.isEditable && button.dataset.wfeAction!=="harmony")return;
      safe(async()=>{
        button.disabled=true;try {await this._action(button.dataset.wfeAction,button.dataset);}finally {button.disabled=!this.isEditable;}
      });
    }));
    root.querySelectorAll("[data-part-field]").forEach(input=>input.addEventListener("change",event=>{
      event.stopImmediatePropagation();
      safe(async()=>{
        requireOwner(this.actor);const part=this.actor.items.get(input.dataset.itemId);if(!part || !part.isOwner)throw new Error("Parte não editável.");
        const value=integer(input.value),field=input.dataset.partField;
        if(!["value","max"].includes(field))throw new Error("Campo de Parte inválido.");
        await part.update({[`system.durability.${field}`]:value});
      });
    }));
    // Resource input changes use core submission, item fields have no name and stay embedded.
  }
  async _action(action,data) {
    const actor=this.actor,item=actor.items.get(data.itemId);
    switch(action) {
      case "roll":return rollDialog(actor,{style:data.style,skill:data.skill});
      case "tool-configure":return game.modules.get(ID).api.compendium.configureTool(actor);
      case "attack":return rollDialog(actor,{attack:true});
      case "tool-attack": {
        const option=toolAttacks(actor).find(a=>a.style===data.style&&a.skill===data.skill);
        if(!option)throw new Error('Este ataque não está disponível para o Utensílio equipado. Reabra a ficha.');
        return rollDialog(actor,{attack:true,style:option.style,skill:option.skill,broken:option.broken,toolAttack:true});
      }
      case "damage":return vigorDialog(actor,"damage");
      case "spend":return vigorDialog(actor,"spend");
      case "heal":return vigorDialog(actor,"heal");
      case "undo":return undo(actor);
      case "turn": {
        const fields=await prompt("Iniciar turno",`<label>Turno<select name="kind"><option value="full">Completo — 3 ações</option>${actor.type==="monster"?"<option value=\"short\">Curto — 1 ação</option>":"<option value=\"opening\">Primeira rodada com iniciativa — 1 ação</option>"}</select></label><p>Atordoado é aplicado e removido segundo o tipo de turno. Preparar e exceções devem ser somados manualmente. A alternância da Caçada continua sob controle da Guia.</p>`);
        return fields?beginTurn(actor,fields.kind):null;
      }
      case "condition": {
        const before=stateOf(actor).conditions[data.key];return setCondition(actor,data.key,Math.max(0,before+Number(data.delta)));
      }
      case "harmony":return harmonyDialog();
      case "item-open":return item?.sheet.render(true);
      case "item-meta":return configureItem(item);
      case "item-use":return useItem(actor,data.itemId);
      case "item-delete":if(item && await confirm("Remover item",`<p>Remover ${esc(item.name)} da ficha?</p>`))return actor.deleteEmbeddedDocuments("Item",[item.id]);break;
      case "item-create": {
        const type=data.type;if(!["trait","technique","part"].includes(type) || type==="part"&&actor.type!=="monster")throw new Error("Tipo de item inválido.");
        const result=await actor.createEmbeddedDocuments("Item",[{name:{trait:"Novo traço",technique:"Nova técnica",part:"Nova parte"}[type],type}]);return result[0]?.sheet.render(true);
      }
      case "token-bars":return repairTokenBars(actor);
      case "migrate-skills":return migrateSkills(actor);
      case "restore-skills":return restoreSkills(actor);
    }
  }
  async _updateObject(event,formData) {
    requireOwner(this.actor);
    for(const [key,value] of Object.entries(formData)) {
      if(key.startsWith("system.styles.") || key.startsWith("system.skills.") || ["system.stamina.value","system.durability.value",`flags.${ID}.state.actions`,`flags.${ID}.state.distance`].includes(key))formData[key]=integer(value);
      if(key==="system.stamina.max" || key==="system.durability.max")formData[key]=integer(value,1);
    }
    if(formData[`flags.${ID}.state.pushLimit`]!==undefined)formData[`flags.${ID}.state.pushLimit`]=!!formData[`flags.${ID}.state.pushLimit`];
    return super._updateObject(event,formData);
  }
}
export class FeralSheet extends EnhancedSheet {static actorType="wilder";}
export class MonsterSheet extends EnhancedSheet {static actorType="monster";static get defaultOptions(){const options=super.defaultOptions;return {...options,classes:[...options.classes,"wfe-monster-sheet"]};}}
