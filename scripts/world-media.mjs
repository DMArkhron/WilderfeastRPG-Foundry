import {ID} from './constants.mjs';
import {safe,serial,prompt,esc} from './runtime.mjs';
import {openHuntMarker} from './hunt-marker.mjs';
export const COVER_PATH=`modules/${ID}/assets/media/capa-wilderfeast.png`;
export const MUSIC_PATH=`modules/${ID}/assets/media/fogueira-da-floresta.mp3`;
export function playlistData(){return {name:'Wilderfeast — Fogueira da Floresta',mode:0,playing:false,flags:{[ID]:{media:'forest-playlist'}},sounds:[{name:'Fogueira da Floresta',path:MUSIC_PATH,volume:0.35,repeat:true,playing:false,flags:{[ID]:{media:'forest-track'}}}]};}
export function landingData(playlist,sound,image='',dimensions={width:1920,height:1080}){
  return {name:'Capa — Wilderfeast',width:dimensions.width,height:dimensions.height,padding:0,background:{src:image||null},grid:{type:0,size:100},
    tokenVision:false,fogExploration:false,navigation:true,active:false,playlist:playlist.id,playlistSound:sound.id,ownership:{default:2},flags:{[ID]:{media:'landing-scene',awaitingCover:!image}}};
}
export async function imageDimensions(path){
  if(!path||typeof Image==='undefined')return undefined;
  return new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>reject(new Error('A imagem da capa não respondeu. Confira o caminho.')),10000);
    image.onload=()=>{clearTimeout(timer);resolve({width:image.naturalWidth,height:image.naturalHeight});};
    image.onerror=()=>{clearTimeout(timer);reject(new Error('A imagem da capa não foi encontrada. Escolha um arquivo existente no Foundry.'));};image.src=path;
  });
}
function requireGM(){if(!game.user.isGM)throw new Error('Somente a Guia pode configurar a Cena e a Playlist.');}
export async function ensureWorldMedia({imagePath=game.settings.get(ID,'landingImage')||COVER_PATH}={}){
  requireGM();return serial('world-media',async()=>{
    requireGM();const dimensions=await imageDimensions(imagePath);let playlist=game.playlists.find(p=>p.getFlag(ID,'media')==='forest-playlist');
    if(!playlist)playlist=await (CONFIG.Playlist?.documentClass??Playlist).create(playlistData());
    if(!playlist)throw new Error('A criação da Playlist foi interrompida.');
    let sound=playlist.sounds.find(s=>s.getFlag(ID,'media')==='forest-track');
    if(!sound)[sound]=await playlist.createEmbeddedDocuments('PlaylistSound',playlistData().sounds);
    if(!sound)throw new Error('A faixa da Playlist não foi criada.');
    let scene=game.scenes.find(s=>s.getFlag(ID,'media')==='landing-scene');
    if(!scene){
      scene=await (CONFIG.Scene?.documentClass??Scene).create(landingData(playlist,sound,imagePath,dimensions));
    }else if(scene.playlist?.id!==playlist.id||scene.playlistSound?.id!==sound.id||imagePath&&scene.background.src!==imagePath){
      const patch={playlist:playlist.id,playlistSound:sound.id};if(imagePath){patch['background.src']=imagePath;patch[`flags.${ID}.awaitingCover`]=false;if(dimensions&&scene.background.src!==imagePath)Object.assign(patch,dimensions);}
      await scene.update(patch);
    }
    if(!scene)throw new Error('A criação da Cena foi interrompida.');return {playlist,sound,scene};
  });
}
export async function configureLanding(){
  requireGM();let selected=game.settings.get(ID,'landingImage')||COVER_PATH;
  const data=await prompt('Capa e música de Wilderfeast',`<p>A Cena de capa utiliza a Playlist <strong>Fogueira da Floresta</strong>, com repetição contínua. Ela toca ao ativar a Cena.</p><label>Imagem da capa<input name="image" value="${esc(selected)}" placeholder="worlds/seu-mundo/imagens/capa.webp"></label><button type="button" data-wfe-cover-picker>Escolher imagem nos arquivos do Foundry</button><p>Use a capa panorâmica escolhida para o projeto. Salvar não troca a Cena ativa nem interrompe a música atual.</p>`,'Salvar Cena');
  if(!data)return null;selected=String(data.image??'').trim();if(!selected)throw new Error('Escolha uma imagem para a capa.');
  const result=await ensureWorldMedia({imagePath:selected});await game.settings.set(ID,'landingImage',selected);ui.notifications.info('Cena e Playlist prontas. Ative Capa — Wilderfeast para ouvir a música em loop.');return result;
}
Hooks.on('renderDialogV2',(app,html)=>{
  const root=html?.[0]??html??app.element;if(!root?.querySelector)return;
  root.querySelector('[data-wfe-cover-picker]')?.addEventListener('click',()=>{
    const Picker=foundry.applications.apps?.FilePicker?.implementation??globalThis.FilePicker;
    if(!Picker){ui.notifications.error('O seletor de arquivos não está disponível. Informe o caminho da imagem.');return;}
    const picker=new Picker({type:'image',current:root.querySelector('[name="image"]').value,callback:path=>{root.querySelector('[name="image"]').value=path;}});
    picker.render(picker instanceof foundry.applications.api.ApplicationV2?{force:true}:true);
  });
});
Hooks.once('init',()=>{if(game.system.id==='wilderfeast')game.settings.register(ID,'landingImage',{name:'Imagem da Cena de capa',hint:'Caminho da capa panorâmica no Foundry. Também pode ser escolhido pelo botão Capa e música na aba Cenas.',scope:'world',config:true,type:String,default:COVER_PATH});});
Hooks.once('ready',()=>{
  if(game.system.id!=='wilderfeast')return;game.modules.get(ID).api??={};Object.assign(game.modules.get(ID).api,{ensureWorldMedia:options=>safe(()=>ensureWorldMedia(options)),configureLanding:()=>safe(configureLanding)});
  if(game.user.isGM&&(!game.users?.activeGM||game.users.activeGM.id===game.user.id))safe(()=>ensureWorldMedia());
});
Hooks.on('renderSceneDirectory',(app,html)=>{
  if(game.system.id!=='wilderfeast')return;const root=html?.[0]??html??app.element,header=root?.querySelector('.directory-header');if(!header||header.querySelector('.wfe-world-tools'))return;
  const tools=document.createElement('div');tools.className='wfe-world-tools';tools.innerHTML=`${game.user.isGM?'<button type="button" data-wfe-world-media>Capa e música</button>':''}<button type="button" data-wfe-world-marker>Marcador da Caçada</button>`;
  tools.querySelector('[data-wfe-world-media]')?.addEventListener('click',()=>safe(configureLanding));tools.querySelector('[data-wfe-world-marker]').addEventListener('click',()=>openHuntMarker());header.append(tools);
});
