/** Real wizard markup and interaction bindings, framed outside Foundry. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ID} from '../scripts/constants.mjs';
import {meta} from '../scripts/compendium/plans.mjs';
import {STEPS,initialDraft} from '../scripts/character-data.mjs';
import {bindChoicePreviews} from '../scripts/dialogs.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),out=path.join(root,'preview/generator');await fs.mkdir(out,{recursive:true});
const packs=new Map();
for(const name of ['utensilios','especialidades','iniciantes','tracos']){
  const docs=[];for(const file of await fs.readdir(path.join(root,'pack-source',name))){
    const data=JSON.parse(await fs.readFile(path.join(root,'pack-source',name,file),'utf8'));
    docs.push({...data,id:data._id,uuid:`Compendium.${ID}.${name}.Item.${data._id}`,toObject:()=>structuredClone(data)});
  }packs.set(`${ID}.${name}`,{getDocuments:async()=>docs});
}
globalThis.Hooks={on(){},once(){}};globalThis.game={system:{id:'wilderfeast'},user:{id:'preview',isGM:true},packs};
globalThis.foundry={applications:{ux:{TextEditor:{implementation:{enrichHTML:async html=>html.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g,'<a class="content-link" href="#">$2</a>')}}}}};
const {loadCharacterCatalog,generatorPage,bindGeneratorPage,addGeneratorButton,canGenerate}=await import('../scripts/character-generator.mjs');
const catalog=await loadCharacterCatalog(),espeto=catalog.tools.find(d=>d.name==='Espeto'),peixeiro=catalog.specialties.find(d=>d.name==='Peixeiro');
const draft={...initialDraft(catalog),tool:espeto.id,specialty:peixeiro.id,second:catalog.initialTraits.find(d=>meta(d).name==='CAMUFLAGEM').id,
  name:'Lina, a Feral',nature:'Paciente',aspiration:'Corajosa',importantMonster:'Um saltaling curioso que me acompanha até o rio.',
  upbringing:'Peixe salgado, dividido no convés com a minha família.',initiation:'Ensopado da primeira caçada, preparado para toda a matilha.',ambition:'Um banquete sob as estrelas da Costa Sen.',
  signatureDish:'Arroz da costa',signatureSeasoning:'Ervas do mar',connection:'Dividi minha primeira caçada com meu parça.',pack:'livre',packName:'Colheres do Sol',packPurpose:'Cuidar dos ermos e proteger nossa comunidade.',den:'Uma antiga cozinha de pedra, junto ao rio.',appearance:'Escamas azuis, lenço laranja e um sorriso curioso.'};
const css=(await fs.readFile(path.join(root,'styles/enhanced.css'),'utf8')).replaceAll('../assets/','../../assets/')+'\n'+await fs.readFile(path.join(root,'styles/compendium.css'),'utf8');
const names=['tool','specialty','origin','pack','name'];
for(const [step,name] of names.entries()){
  const content=generatorPage(step,draft,catalog).replaceAll(`modules/${ID}/`,'../../');
  const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gerar personagem — ${STEPS[step]}</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#c9c3b5;font-family:Arial}.application{width:680px;display:flex;flex-direction:column}.window-header{display:flex;align-items:center;justify-content:space-between}.window-title{margin:0}.window-header button{width:24px;height:24px}.window-content{margin:0}.form-footer button{cursor:pointer} ${css}</style><main class="application dialog wfe-dialog wfc-dialog wfe-generator-dialog"><header class="window-header"><h1 class="window-title">Gerar personagem — ${STEPS[step]}</h1><button type="button" aria-label="Fechar">×</button></header><form class="window-content"><div class="dialog-content"><div class="wfe-dialog-body">${content}</div></div><footer class="form-footer">${step?'<button type="button">← Voltar</button>':''}<button type="submit">${step===4?'Criar personagem':'Próxima etapa →'}</button><button type="button">Cancelar</button></footer></form></main><script>${bindChoicePreviews.toString()} (${bindGeneratorPage.toString()})(null,{element:document.querySelector('.application')});document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();document.body.dataset.confirmed='true';});</script></html>`;
  await fs.writeFile(path.join(out,`generator-${name}.html`),html);
}
const directory=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gerador no diretório de Atores</title><style>*{box-sizing:border-box}body{margin:0;padding:20px;min-height:100vh;background:#c9c3b5;font:14px Arial;display:grid;place-items:center}.actors-sidebar{width:320px;max-width:100%;padding:15px;background:#18171f;color:#ddd;border:2px solid #666}.actors-sidebar button{min-height:32px;padding:6px 9px;background:#2b2933;color:#ddd;border:1px solid #777;border-radius:4px}.header-actions{display:flex;gap:5px;flex-wrap:wrap}.header-actions>button{flex:1}.directory-header input{width:100%;margin:18px 0 14px;padding:8px;background:#2b2933;border:1px solid #777;color:#ddd}.directory-list{list-style:none;padding:0;margin:0}.directory-item{display:flex;align-items:center;gap:12px;margin:10px 0;padding:8px 0;border-bottom:1px solid #444}.directory-item img{width:48px;height:48px;object-fit:cover}.fas.fa-seedling:before{content:'✦'} ${css}</style><main class="actors-sidebar"><header class="directory-header"><div class="header-actions"><button type="button">＋ Criar Ator</button><button type="button">▣ Criar Pasta</button></div><input placeholder="Pesquisar atores"></header><ul class="directory-list"><li class="directory-item"><img src="../../assets/feral.svg" alt=""><strong>Cleitinho</strong></li><li class="directory-item"><img src="../../assets/monster.svg" alt=""><strong>Monstro</strong></li></ul></main><script>const game={system:{id:'wilderfeast'},user:{isGM:true}};${canGenerate.toString()}function openCharacterGenerator(){document.body.dataset.generatorOpened='true'}(${addGeneratorButton.toString()})(null,document.querySelector('.actors-sidebar'));</script></html>`;
await fs.writeFile(path.join(out,'generator-button.html'),directory);
console.log('5 páginas reais do gerador e botão preparados para prévia offline.');
