import {ID} from './constants.mjs';
import {safe,serial,esc} from './runtime.mjs';
export function markerValue(value){const n=Number(value);if(!Number.isInteger(n)||n<0||n>4)throw new Error('O marcador deve estar entre 0 e 4 Pernadas.');return n;}
export const markerTexture=value=>`modules/${ID}/assets/hunt/hd/marcador-${markerValue(value)}.svg`;
function requireGM(){if(!game.user.isGM)throw new Error('Somente a Guia pode alterar o marcador ou inserir a peça.');}
export function markerMarkup(value,isGM){
  value=markerValue(value);
  return `<div class="wfe-dialog-body wfe-hunt-marker"><p>Controle independente · ${value} de 4 Pernadas</p><img src="${markerTexture(value)}" alt="Marcador preenchido até ${value} de 4"><div class="wfe-marker-values">${[0,1,2,3,4].map(n=>`<button type="button" data-wfe-marker-value="${n}" aria-pressed="${n===value}" ${isGM?'':'disabled'}>${n}</button>`).join('')}</div><p>As faixas representam a distância em relação ao monstro. Este controle não altera a posição dos atores.</p></div><footer class="form-footer wfe-marker-footer"><button type="button" data-wfe-marker-delta="-1" ${isGM&&value>0?'':'disabled'}>− Diminuir</button><button type="button" data-wfe-marker-delta="1" ${isGM&&value<4?'':'disabled'}>+ Aumentar</button></footer>${isGM?'<div class="wfe-marker-map-buttons"><button type="button" data-wfe-marker-place="positions">Peça de posições no mapa</button><button type="button" data-wfe-marker-place="linked">Peça com preenchimento</button></div>':''}`;
}
export function markerTile(value,{mode='positions',x=0,y=0,width=960}={}){
  markerValue(value);if(!['positions','linked'].includes(mode))throw new Error('Modo de peça inválido.');
  if(![x,y,width].every(Number.isFinite)||width<240||width>5000)throw new Error('Dimensões da peça inválidas.');
  return {texture:{src:mode==='linked'?markerTexture(value):`modules/${ID}/assets/hunt/hd/marcador-posicoes.svg`},x,y,width,height:width*760/480,
    elevation:-1,sort:0,alpha:0.9,hidden:false,locked:true,rotation:0,flags:{[ID]:{huntMarker:{mode}}}};
}
export async function syncMarkerTiles(value){
  requireGM();value=markerValue(value);
  for(const scene of game.scenes){const tiles=scene.tiles.filter(t=>t.getFlag(ID,'huntMarker')?.mode==='linked');
    if(tiles.length)await scene.updateEmbeddedDocuments('Tile',tiles.map(t=>({_id:t.id,'texture.src':markerTexture(value)})));
  }
}
export async function upgradeMarkerTiles(){
  requireGM();
  const value=markerValue(game.settings.get(ID,'huntMarker'));
  for(const scene of game.scenes){
    const updates=[];
    for(const tile of scene.tiles){
      const mode=tile.getFlag(ID,'huntMarker')?.mode;
      if(!['positions','linked'].includes(mode))continue;
      const src=markerTile(value,{mode}).texture.src;
      if(tile.texture.src!==src)updates.push({_id:tile.id,'texture.src':src});
    }
    if(updates.length)await scene.updateEmbeddedDocuments('Tile',updates);
  }
}
export function changeMarker({value,delta}={}){
  requireGM();return serial('hunt-marker-value',async()=>{
    requireGM();const current=markerValue(game.settings.get(ID,'huntMarker'));
    const next=value===undefined?Math.max(0,Math.min(4,current+Number(delta))):markerValue(value);
    return game.settings.set(ID,'huntMarker',markerValue(next));
  });
}
export async function placeMarker({mode='positions',scene=globalThis.canvas?.scene}={}){
  requireGM();if(!scene)throw new Error('Abra uma Cena antes de inserir o marcador.');
  return serial(`hunt-marker-tile:${scene.id}`,async()=>{
    requireGM();const existing=scene.tiles.find(t=>t.getFlag(ID,'huntMarker')?.mode===mode);
    if(existing){ui.notifications.info('Esta Cena já possui uma peça desse marcador. Ela pode ser desbloqueada nas configurações do Tile.');return existing;}
    const size=Number(scene.grid?.size)||100,width=Math.max(240,Math.min(size*8,(Number(scene.width)||960)*0.9,(Number(scene.height)||1600)*480/760*0.9));
    const dims=scene.dimensions??{sceneX:0,sceneY:0,sceneWidth:scene.width,sceneHeight:scene.height};
    const x=(dims.sceneX??0)+Math.max(0,((dims.sceneWidth??scene.width)-width)/2),y=(dims.sceneY??0)+Math.max(0,((dims.sceneHeight??scene.height)-width*760/480)/2);
    const [tile]=await scene.createEmbeddedDocuments('Tile',[markerTile(game.settings.get(ID,'huntMarker'),{mode,x,y,width})]);
    ui.notifications.info('Marcador inserido sob os tokens. Use a camada Tiles para desbloquear, mover ou redimensionar.');return tile;
  });
}
export function bindMarkerContent(content){
  for(const b of content.querySelectorAll('[data-wfe-marker-value]'))b.addEventListener('click',()=>safe(()=>changeMarker({value:Number(b.dataset.wfeMarkerValue)})));
  for(const b of content.querySelectorAll('[data-wfe-marker-delta]'))b.addEventListener('click',()=>safe(()=>changeMarker({delta:Number(b.dataset.wfeMarkerDelta)})));
  for(const b of content.querySelectorAll('[data-wfe-marker-place]'))b.addEventListener('click',()=>safe(()=>placeMarker({mode:b.dataset.wfeMarkerPlace})));
}
const Base=foundry.applications.api.ApplicationV2;
export class HuntMarker extends Base{
  static DEFAULT_OPTIONS={id:'wfe-hunt-marker',classes:['wfe-dialog','wfe-hunt-marker-window'],position:{width:450,height:'auto'},window:{title:'Marcador da Caçada',resizable:true}};
  async _renderHTML(){return markerMarkup(game.settings.get(ID,'huntMarker'),game.user.isGM);}
  _replaceHTML(html,content){content.innerHTML=html;bindMarkerContent(content);}
}
let markerApp;
export function openHuntMarker(){markerApp??=new HuntMarker();markerApp.render({force:true});return markerApp;}
Hooks.once('init',()=>{
  if(game.system.id!=='wilderfeast')return;
  game.settings.register(ID,'huntMarker',{name:'Preenchimento do marcador da Caçada',scope:'world',config:false,type:Number,default:0,onChange:()=>{
    if(markerApp?.rendered)markerApp.render({force:true});
    if(game.user.isGM&&(!game.users?.activeGM||game.users.activeGM.id===game.user.id))safe(()=>serial('hunt-marker-sync',()=>syncMarkerTiles(game.settings.get(ID,'huntMarker'))));
  }});
});
Hooks.once('ready',()=>{if(game.system.id==='wilderfeast'){game.modules.get(ID).api??={};Object.assign(game.modules.get(ID).api,{openHuntMarker,changeMarker,placeMarker});if(game.user.isGM&&(!game.users?.activeGM||game.users.activeGM.id===game.user.id))safe(()=>serial('hunt-marker-sync',upgradeMarkerTiles));}});
Hooks.on('getSceneControlButtons',controls=>{
  if(game.system.id!=='wilderfeast')return;
  const tool={name:'wfe-hunt-marker',title:'Marcador da Caçada',icon:'fas fa-bullseye',button:true,visible:true,order:90,onChange:()=>openHuntMarker(),onClick:()=>openHuntMarker()};
  if(Array.isArray(controls)){const tokens=controls.find(c=>c.name==='token');if(tokens&&!tokens.tools.some(t=>t.name===tool.name))tokens.tools.push(tool);}
  else if(controls.tokens){controls.tokens.tools??={};controls.tokens.tools[tool.name]=tool;}
});
