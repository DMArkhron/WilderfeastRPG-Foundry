import {STYLES,SKILLS} from './constants.mjs';
import {normalized} from './compendium/plans.mjs';
const tools=new Set(['BARBANTE','CUTELO','ESPETO','LUVAS','MACARICO','PANELA']);
/** All four attack styles are legal; the equipped Part determines the skills. */
export function toolAttacks(actor){
  if(actor.type!=='wilder'||!tools.has(normalized(actor.system.tool)))return [];
  const broken=Number(actor.system.durability?.value)===0;
  const reach=broken?'1 (Golpear)':String(actor.system.range??'');
  const ranges=[...reach.matchAll(/(\d+)\s*\(\s*(Golpear|Atirar|Strike|Shot)\s*\)/gi)].map(m=>({range:Number(m[1]),skill:/golpear|strike/i.test(m[2])?'strike':'shot'}));
  const skills=new Map();for(const r of ranges)skills.set(r.skill,Math.max(skills.get(r.skill)??0,r.range));
  if(!skills.size)skills.set('strike',1);
  return [...skills].flatMap(([skill,range])=>Object.entries(STYLES).map(([style,label])=>({style,skill,range,label:`${SKILLS[skill]} ${label}`,actions:['mighty','precise'].includes(style)?2:1,actionsLabel:['mighty','precise'].includes(style)?'2 Ações':'1 Ação',rangeLabel:`${range} ${range===1?'Pernada':'Pernadas'}`,
    effect:{mighty:'[A] × 2 de Dano',precise:'[A] de Dano à Parte',swift:'[A] de Dano',tricky:'[A] de Dano à Parte'}[style],risk:['mighty','tricky'].includes(style)?'Falha: Exposto':'',broken})));
}
