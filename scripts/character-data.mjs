import {ID,STYLES,SKILLS} from './constants.mjs';
import {ID as COMPENDIUM,meta,toolPlan,importData,sameTrait} from './compendium/plans.mjs';

export const STEPS=['Utensílio','Especialidade','Origem','Matilha','Nome'];
export const PACKS=[
  {id:'academica',name:'Acadêmica',purpose:'Estudar a natureza, ensinar aos outros e resolver mistérios.'},
  {id:'juramentada',name:'Juramentada',purpose:'Cumprir promessas, honrar tradições e proteger sua comunidade.'},
  {id:'livre',name:'Livre',purpose:'Proteger seu lar, cuidar dos ermos e viver em meio às feras.'},
  {id:'mercenaria',name:'Mercenária',purpose:'Ficar mais forte, construir uma reputação e conhecer o mundo.'},
  {id:'personalizada',name:'Personalizada',purpose:'Combine com sua matilha o que une vocês e por que caçam.'}
];
export const MEALS=[['upbringing','Criação','A refeição da sua infância'],['initiation','Iniciação','A refeição que fez de você um feral'],['ambition','Ambição','A refeição que você mais deseja']];

export function initialDraft(catalog) {
  const specialty=catalog.specialties[0];
  const first=specialty?.traits[0],second=catalog.initialTraits.find(t=>!sameTrait(t,meta(first??{})));
  const draft={tool:catalog.tools[0]?.id,specialty:specialty?.id,second:second?.id,
    upbringingSkill:'search',initiationSkill:'strike',ambitionSkill:'craft',pack:'livre'};
  for(const t of catalog.tools){draft[`optional-${t.id}`]=t.beginners[0]?.id;draft[`orientation-${t.id}`]='0';}
  for(const s of catalog.specialties)draft[`first-${s.id}`]=s.traits[0]?.id;
  return draft;
}
export function selections(draft,catalog) {
  const tool=catalog.tools.find(d=>d.id===draft.tool),specialty=catalog.specialties.find(d=>d.id===draft.specialty);
  return {tool,specialty,optional:tool?.beginners.find(d=>d.id===draft[`optional-${tool.id}`]),
    first:specialty?.traits.find(d=>d.id===draft[`first-${specialty.id}`]),second:catalog.initialTraits.find(d=>d.id===draft.second),
    orientation:Number(draft[`orientation-${tool?.id}`]),pack:PACKS.find(p=>p.id===draft.pack)};
}
export function validateStep(step,draft,catalog) {
  const {tool,specialty,optional,first,second,orientation,pack}=selections(draft,catalog);
  if(step===0){
    if(!tool||!optional||![0,1].includes(orientation))throw new Error('Escolha seu Utensílio, uma Técnica adicional e o Estilo de nível 3.');
    toolPlan({type:'wilder',system:{durability:{value:20,max:20}},items:[]},meta(tool),{optional,initialize:true,orientation});
  }
  if(step===1){
    if(!specialty||!first||!second)throw new Error('Escolha a Especialidade e dois Traços iniciais.');
    if(sameTrait(first,meta(second)))throw new Error('Escolha dois Traços distintos.');
  }
  if(step===2){
    const keys=MEALS.map(([key])=>draft[`${key}Skill`]);
    if(keys.some(k=>!Object.hasOwn(SKILLS,k)))throw new Error('Escolha uma Habilidade para cada refeição da Origem.');
    if(new Set(keys).size!==3)throw new Error('As três refeições devem conceder +1 em três Habilidades diferentes.');
  }
  if(step===3&&!pack)throw new Error('Escolha um arquétipo de Matilha.');
  if(step===4&&(!String(draft.name??'').trim()||String(draft.name).trim().length>120))throw new Error('Escreva um nome de 1 a 120 caracteres.');
}
const text=(draft,key)=>String(draft[key]??'').trim().slice(0,4000);
function setPath(target,path,value){const keys=path.split('.');let obj=target;for(const key of keys.slice(0,-1))obj=obj[key]??={};obj[keys.at(-1)]=value;}
export function buildCharacter(draft,catalog,userId,ownerLevel=3) {
  for(let step=0;step<STEPS.length;step++)validateStep(step,draft,catalog);
  const {tool,specialty,optional,first,second,orientation,pack}=selections(draft,catalog);
  const data={name:text(draft,'name'),type:'wilder',img:`modules/${ID}/assets/feral.svg`,
    system:{stamina:{value:20,max:20},durability:{value:20,max:20},
      styles:Object.fromEntries(Object.keys(STYLES).map(k=>[k,{value:1,max:1}])),
      skills:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{value:0,max:0}])),equipment:'',description:''},
    flags:{[ID]:{identity:{},generator:{version:1,completed:true}},[COMPENDIUM]:{equipped:{sourceUuid:tool.uuid,name:meta(tool).name,baseDurability:20}}},
    ownership:{default:0,[userId]:ownerLevel},prototypeToken:{actorLink:true,bar1:{attribute:'stamina'},bar2:{attribute:'durability'}},
    items:[tool.mandatory,optional,first,second].map(importData)};
  const plan=toolPlan({type:'wilder',system:data.system,items:[]},meta(tool),{optional,initialize:true,orientation});
  for(const [path,value] of Object.entries(plan.patch))setPath(data,path,value);
  for(const [key] of MEALS){const skill=draft[`${key}Skill`];data.system.skills[skill]={value:1,max:1};}
  const identity=data.flags[ID].identity;
  for(const key of ['nature','aspiration','importantMonster','upbringing','initiation','ambition','connection','signatureDish','signatureSeasoning','packName','packPurpose','den','appearance'])identity[key]=text(draft,key);
  identity.specialty=specialty.name;identity.packType=pack.name;
  return data;
}
