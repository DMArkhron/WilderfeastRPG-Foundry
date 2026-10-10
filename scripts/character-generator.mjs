import {ID,STYLES,SKILLS} from './constants.mjs';
import {esc,meta} from './compendium/plans.mjs';
import {toolIcon} from './assets.mjs';
import {dialogOptions,bindChoicePreviews} from './dialogs.mjs';
import {STEPS,PACKS,MEALS,initialDraft,selections,validateStep,buildCharacter} from './character-data.mjs';

export function canGenerate(){return game.system.id==='wilderfeast' && !!(game.user.isGM||game.user.can?.('ACTOR_CREATE'));}
async function documents(name){const pack=game.packs.get(`${ID}.${name}`);if(!pack)throw new Error(`Compêndio indisponível: ${name}. Confira a instalação do módulo.`);return pack.getDocuments();}
export async function loadCharacterCatalog(){
  const [tools,specialties,beginners,traits]=await Promise.all(['utensilios','especialidades','iniciantes','tracos'].map(documents));
  const all=new Map();
  for(const [pack,docs] of [['iniciantes',beginners],['tracos',traits]])for(const d of docs){
    all.set(d.uuid,d);all.set(`Compendium.${ID}.${pack}.Item.${d.id}`,d);
  }
  const item=uuid=>{const d=all.get(uuid);if(!d)throw new Error('Uma Técnica ou um Traço de criação não foi encontrado. Confira os compêndios.');return d;};
  const reference=d=>({id:d.id,name:d.name,uuid:d.uuid,flags:d.flags});
  const catalog={tools:tools.map(t=>({...reference(t),mandatory:item(meta(t).mandatoryUuid),beginners:meta(t).beginnerUuids.map(item)})),
    specialties:specialties.map(s=>({...reference(s),traits:meta(s).traitUuids.map(item)})),
    initialTraits:[...new Set(specialties.flatMap(s=>meta(s).traitUuids))].map(item),html:new Map()};
  catalog.tools.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));catalog.specialties.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));catalog.initialTraits.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const enrich=foundry.applications.ux?.TextEditor?.implementation?.enrichHTML;
  await Promise.all([...beginners,...catalog.initialTraits].map(async d=>{
    const html=d.system?.description??'';
    catalog.html.set(d.uuid,enrich?await enrich(html,{async:true,secrets:false,relativeTo:d}):html);
  }));
  if(catalog.tools.length!==6||catalog.specialties.length!==8)throw new Error('O catálogo de criação está incompleto. Reinstale o módulo atualizado.');
  return catalog;
}
const options=(docs,value)=>docs.map(d=>`<option value="${esc(d.id)}" ${d.id===value?'selected':''}>${esc(d.name)}</option>`).join('');
const input=(draft,key,label,placeholder='')=>`<label>${esc(label)}<input name="${key}" value="${esc(draft[key])}" maxlength="${key==='name'?120:240}" placeholder="${esc(placeholder)}"></label>`;
const area=(draft,key,label,placeholder='')=>`<label>${esc(label)}<textarea name="${key}" maxlength="4000" placeholder="${esc(placeholder)}">${esc(draft[key])}</textarea></label>`;
const ruleCard=(doc,catalog)=>`<article class="wfe-choice-card"><h3>${esc(doc.name)}</h3>${catalog.html.get(doc.uuid)??''}</article>`;
function choice(key,label,docs,draft,catalog){return `<label>${esc(label)}<select name="${key}" data-wfe-preview-select="${key}">${options(docs,draft[key])}</select></label><div class="wfe-choice-previews">${docs.map(d=>`<div data-wfe-preview-group="${key}" data-wfe-preview-id="${d.id}" ${d.id===draft[key]?'':'hidden'}>${ruleCard(d,catalog)}</div>`).join('')}</div>`;}

export function generatorPage(step,draft,catalog){
  const progress=`<ol class="wfe-generator-progress" aria-label="Etapas de criação">${STEPS.map((s,i)=>`<li class="${i===step?'active':i<step?'done':''}" ${i===step?'aria-current="step"':''}><b>${i<step?'✓':i+1}</b><span>${s}</span></li>`).join('')}</ol>`;
  let content='';
  if(step===0){
    content=`<p>Escolha seu companheiro de caçada. Você começa com a Técnica obrigatória e mais uma Técnica Iniciante.</p><fieldset class="wfe-tool-chooser"><legend>Seu Utensílio</legend>${catalog.tools.map(t=>`<label><input type="radio" name="tool" value="${t.id}" ${t.id===draft.tool?'checked':''}><span><img src="${toolIcon(meta(t).name)}" alt=""><strong>${esc(t.name)}</strong></span></label>`).join('')}</fieldset>`;
    for(const t of catalog.tools){const m=meta(t),orientation=draft[`orientation-${t.id}`];content+=`<section data-wfe-generator-tool="${t.id}" ${t.id===draft.tool?'':'hidden'}><div class="wfe-generator-feature"><img src="${toolIcon(m.name)}" alt=""><div><h3>${esc(t.name)}</h3><p>${esc(m.description)}</p></div></div><label>Estilo com nível 3<select name="orientation-${t.id}"><option value="0" ${orientation==='0'?'selected':''}>${STYLES[m.styles[0]]} 3 · ${STYLES[m.styles[1]]} 2</option><option value="1" ${orientation==='1'?'selected':''}>${STYLES[m.styles[1]]} 3 · ${STYLES[m.styles[0]]} 2</option></select></label><p>Os outros dois Estilos começam em 1.</p><details class="wfe-generator-required"><summary>Técnica obrigatória · ${esc(t.mandatory.name)}</summary>${ruleCard(t.mandatory,catalog)}</details>${choice(`optional-${t.id}`,'Sua segunda Técnica',t.beginners,draft,catalog)}<p>Sugestões de personalidade: ${esc(m.personality.join(', '))}.</p></section>`;}
    content+=`<div class="wfe-generator-columns">${input(draft,'nature','Você é','Sua natureza')}${input(draft,'aspiration','Mas você tenta ser','Sua aspiração')}</div>`;
  }
  if(step===1){
    content=`<p>Escolha um Traço da sua Especialidade e outro de qualquer Especialidade. Leia os efeitos antes de decidir.</p><label>Especialidade<select name="specialty" data-wfe-generator-specialty>${options(catalog.specialties,draft.specialty)}</select></label>`;
    for(const s of catalog.specialties)content+=`<section data-wfe-generator-specialty-panel="${s.id}" ${s.id===draft.specialty?'':'hidden'}><article class="wfe-choice-card"><h3>${esc(s.name)}</h3><p>${esc(meta(s).description)}</p></article>${choice(`first-${s.id}`,'Traço da sua Especialidade',s.traits,draft,catalog)}</section>`;
    content+=choice('second','Segundo Traço · qualquer Especialidade',catalog.initialTraits,draft,catalog)+area(draft,'importantMonster','Seu monstro importante','Quem é ele? Como vocês se conheceram?');
  }
  if(step===2){
    content=`<p>Conte sua história em três pratos. Cada refeição concede +1 em uma Habilidade diferente; as demais começam em 0.</p>`;
    for(const [key,label,hint] of MEALS)content+=`<section class="wfe-generator-meal"><h3>${label}</h3>${area(draft,key,hint,'Descreva o prato e o que ele significa para você.')}<label>Habilidade · +1<select name="${key}Skill">${options(Object.entries(SKILLS).map(([id,name])=>({id,name})),draft[`${key}Skill`])}</select></label></section>`;
    content+=`<div class="wfe-generator-columns">${input(draft,'signatureDish','Ingrediente Típico')}${input(draft,'signatureSeasoning','Tempero Típico')}</div>${area(draft,'connection','Conexão com outro parça','Qual dessas refeições conecta suas histórias?')}`;
  }
  if(step===3){
    content=`<p>Conversem como grupo. O arquétipo da Matilha expressa por que vocês caçam monstros.</p><fieldset class="wfe-generator-pack"><legend>Arquétipo da Matilha</legend>${PACKS.map(p=>`<label><input type="radio" name="pack" value="${p.id}" ${p.id===draft.pack?'checked':''}><span><strong>${p.name}</strong><small>${esc(p.purpose)}</small></span></label>`).join('')}</fieldset>${input(draft,'packName','Nome da Matilha')}${area(draft,'packPurpose','Por que vocês caçam?','Um objetivo, promessa ou desejo em comum.')}${area(draft,'den','Sua Toca','Onde a matilha se reúne, descansa e cozinha?')}`;
  }
  if(step===4){
    const s=selections(draft,catalog),data=buildCharacter({...draft,name:draft.name?.trim()||'Seu feral'},catalog,'preview');
    content=`${input(draft,'name','Nome do personagem','Como a trilha vai conhecer você?')}${area(draft,'appearance','Aparência','Descreva suas feições, roupas e marcas ferais.')}<section class="wfe-generator-review"><h3>Seu feral está quase pronto</h3><div class="wfe-generator-feature"><img src="${toolIcon(meta(s.tool).name)}" alt=""><div><strong>${esc(s.tool.name)} · ${esc(s.specialty.name)}</strong><p>Vigor 20/20 · Durabilidade ${data.system.durability.max}/${data.system.durability.max}</p><p>Alcance ${esc(data.system.range)}</p></div></div><dl><dt>Estilos</dt><dd>${Object.entries(STYLES).map(([key,label])=>`${label} ${data.system.styles[key].value}`).join(' · ')}</dd><dt>Técnicas</dt><dd>${esc(s.tool.mandatory.name)}<br>${esc(s.optional.name)}</dd><dt>Traços</dt><dd>${esc(s.first.name)} · ${esc(s.second.name)}</dd><dt>Origem</dt><dd>${MEALS.map(([key,label])=>`${label}: ${esc(draft[key])||'a definir'} · ${SKILLS[draft[`${key}Skill`]]} +1`).join('<br>')}</dd><dt>Matilha</dt><dd>${esc(draft.packName)||'Nome a definir'} · ${s.pack.name}<br>${esc(draft.packPurpose)||esc(s.pack.purpose)}</dd></dl><p>Ao criar, as escolhas serão registradas em uma nova ficha. Você pode completar os detalhes narrativos depois.</p></section>`;
  }
  return `<div class="wfe-generator" data-wfe-generator-step="${step}">${progress}<header class="wfe-generator-heading"><span>Criação de personagem · ${step+1} de 5</span><h2>${STEPS[step]}</h2></header>${content}</div>`;
}

export function bindGeneratorPage(event,dialog){
  bindChoicePreviews(event,dialog);const root=dialog.element;if(!root)return;
  for(const button of root.querySelectorAll('.form-footer button'))button.classList.toggle('wfe-generator-next',button.dataset.action==='next'||/^(Próxima etapa|Criar personagem)/.test(button.textContent.trim()));
  const show=(selector,id,dataset)=>{for(const panel of root.querySelectorAll(selector)){panel.hidden=panel.dataset[dataset]!==id;for(const input of panel.querySelectorAll('input,select,textarea'))input.disabled=panel.hidden;}};
  const updateTool=()=>show('[data-wfe-generator-tool]',root.querySelector('input[name="tool"]:checked')?.value,'wfeGeneratorTool');
  for(const radio of root.querySelectorAll('input[name="tool"]'))radio.addEventListener('change',updateTool);updateTool();
  const specialty=root.querySelector('[data-wfe-generator-specialty]');
  if(specialty){const update=()=>show('[data-wfe-generator-specialty-panel]',specialty.value,'wfeGeneratorSpecialtyPanel');specialty.addEventListener('change',update);update();}
  root.querySelector('input[name="name"]')?.focus();
}
let running=null;
async function runGenerator(){
  if(!canGenerate())throw new Error('Você precisa da permissão de criar Atores para usar o gerador.');
  const catalog=await loadCharacterCatalog();let draft=initialDraft(catalog),step=0;
  while(step<STEPS.length){
    const capture=nav=>(_event,button)=>({nav,data:Object.fromEntries(new FormData(button.form).entries())});
    const config=dialogOptions(`Gerar personagem — ${STEPS[step]}`,generatorPage(step,draft,catalog),{compendium:true});
    config.classes.push('wfe-generator-dialog');config.position.width=680;config.render=bindGeneratorPage;
    config.buttons=[...(step?[{action:'back',label:'← Voltar',callback:capture('back')}]:[]),
      {action:'next',label:step===4?'Criar personagem':'Próxima etapa →',default:true,callback:capture('next')},
      {action:'cancel',label:'Cancelar',callback:()=>null}];
    const answer=await foundry.applications.api.DialogV2.wait(config);if(!answer)return null;
    draft={...draft,...answer.data};if(answer.nav==='back'){step--;continue;}
    try{validateStep(step,draft,catalog);}catch(error){ui.notifications.warn(error.message);continue;}
    if(step<4){step++;continue;}
    if(!canGenerate())throw new Error('A permissão de criar Atores foi removida. Nenhuma ficha foi criada.');
    const actor=await (globalThis.CONFIG?.Actor?.documentClass??globalThis.Actor).create(buildCharacter(draft,catalog,game.user.id,globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER??3),{renderSheet:false});
    if(!actor)throw new Error('A criação foi interrompida. Nenhuma ficha foi confirmada.');
    ui.notifications.info(`${actor.name} está pronto para a trilha.`);actor.sheet?.render(true);return actor;
  }
}
export async function generateCharacter(){
  if(running)return running;
  running=runGenerator();try{return await running;}finally{running=null;}
}
export async function openCharacterGenerator(){try{return await generateCharacter();}catch(error){console.error(`[${ID}]`,error);ui.notifications.error(error.message);return null;}}
export function addGeneratorButton(app,html){
  if(!canGenerate())return;
  const root=html?.[0]??html??app?.element;if(!root?.querySelector||root.querySelector('[data-wfe-generate-character]'))return;
  const anchor=root.querySelector('.directory-header .header-actions,.directory-header .action-buttons,.header-actions');
  if(!anchor)return;
  const button=document.createElement('button');button.type='button';button.className='wfe-generator-button';button.dataset.wfeGenerateCharacter='';
  button.innerHTML='<i class="fas fa-seedling" aria-hidden="true"></i> Gerar personagem';
  button.addEventListener('click',event=>{event.preventDefault();openCharacterGenerator();});
  anchor.style.flexWrap='wrap';anchor.append(button);
}
Hooks.on('renderActorDirectory',addGeneratorButton);
Hooks.once('ready',()=>{if(game.system.id!=='wilderfeast')return;game.modules.get(ID).api??={};game.modules.get(ID).api.generateCharacter=openCharacterGenerator;});
