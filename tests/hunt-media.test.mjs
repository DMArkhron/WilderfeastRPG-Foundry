import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ID,STYLES} from '../scripts/constants.mjs';
import {toolAttacks} from '../scripts/tool-attacks.mjs';
const hooks=new Map(),settings=new Map(),registry=new Map(),messages=[];
globalThis.Hooks={once:(k,f)=>{const a=hooks.get(k)??[];a.push(f);hooks.set(k,a);},on:(k,f)=>{const a=hooks.get(k)??[];a.push(f);hooks.set(k,a);}};
globalThis.foundry={applications:{api:{ApplicationV2:class{render(){this.rendered=true;return this;}},DialogV2:{wait:async()=>null}}}};
globalThis.ui={notifications:Object.fromEntries(['info','warn','error'].map(k=>[k,t=>messages.push(t)]))};
globalThis.game={system:{id:'wilderfeast'},user:{id:'gm',isGM:true},users:{activeGM:{id:'gm'}},modules:new Map([[ID,{api:{}}]]),playlists:[],scenes:[],settings:{register:(_id,key,data)=>{registry.set(key,data);settings.set(key,data.default);},get:(_id,key)=>settings.get(key),set:async(_id,key,value)=>{settings.set(key,value);return value;}}};
const flags=d=>(_namespace,key)=>d.flags?.[ID]?.[key];
let count=0,playlistCreates=0,sceneCreates=0;
const sound=d=>({...d,id:d._id??`sound${++count}`,getFlag:flags(d)});
function scene(d){return {...d,id:d._id??`scene${++count}`,tiles:[],getFlag:flags(d),
  playlist:game.playlists.find(p=>p.id===d.playlist),playlistSound:game.playlists.flatMap(p=>p.sounds).find(s=>s.id===d.playlistSound),
  update:async function(p){Object.assign(this,p);if(p['background.src'])this.background.src=p['background.src'];},
  createEmbeddedDocuments:async function(_type,data){const docs=data.map(d=>({...d,id:`tile${++count}`,getFlag:flags(d)}));this.tiles.push(...docs);return docs;},
  updateEmbeddedDocuments:async function(_type,rows){for(const r of rows)this.tiles.find(t=>t.id===r._id).texture.src=r['texture.src'];}
};}
globalThis.CONFIG={Playlist:{documentClass:{create:async d=>{playlistCreates++;const p={...d,id:`playlist${++count}`,sounds:d.sounds.map(sound),getFlag:flags(d),createEmbeddedDocuments:async function(_type,rows){const s=rows.map(sound);this.sounds.push(...s);return s;}};game.playlists.push(p);return p;}}},Scene:{documentClass:{create:async d=>{sceneCreates++;const s=scene(d);game.scenes.push(s);return s;}}}};
const marker=await import('../scripts/hunt-marker.mjs'),media=await import('../scripts/world-media.mjs');
for(const fn of hooks.get('init'))fn();
function reset(){game.user.isGM=true;game.playlists=[];game.scenes=[];playlistCreates=0;sceneCreates=0;settings.set('huntMarker',0);settings.set('landingImage','');messages.length=0;}

for(const tool of ['Barbante','Cutelo','Espeto','Luvas','Maçarico','Panela'])test(`ataques de ${tool} usam quatro Estilos`,()=>{
  const a={type:'wilder',system:{tool,range:'1 (Golpear)',durability:{value:20}}};const attacks=toolAttacks(a);
  assert.equal(attacks.length,4);assert.deepEqual(attacks.map(a=>a.style),Object.keys(STYLES));assert.ok(attacks.every(a=>a.skill==='strike'&&a.range===1));
  assert.deepEqual(attacks.map(a=>a.actions),[2,2,1,1]);
});
test('alcance adicional ativa Atirar; quebra remove o alcance adicional',()=>{
  const a={type:'wilder',system:{tool:'Panela',range:'1 (Golpear); 2 (Atirar)',durability:{value:50}}};
  assert.equal(toolAttacks(a).length,8);assert.ok(toolAttacks(a).filter(a=>a.skill==='shot').every(a=>a.range===2));
  a.system.durability.value=0;assert.equal(toolAttacks(a).length,4);assert.ok(toolAttacks(a).every(a=>a.range===1&&a.broken));
  a.system.tool='Desconhecido';assert.equal(toolAttacks(a).length,0);a.type='monster';assert.equal(toolAttacks(a).length,0);
});
test('marcador independente limita o preenchimento e preserva dimensões da peça',()=>{
  for(const n of [0,1,2,3,4])assert.equal(marker.markerValue(n),n);
  for(const n of [-1,5,1.5,NaN])assert.throws(()=>marker.markerValue(n),/0 e 4/);
  const tile=marker.markerTile(3,{mode:'linked',width:800,x:120,y:70});assert.ok(tile.texture.src.endsWith('marcador-3.svg'));assert.equal(tile.elevation,-1);assert.equal(tile.locked,true);assert.equal(tile.width/tile.height,480/760);
  assert.ok(marker.markerTile(4).texture.src.endsWith('marcador-posicoes.svg'));
});
test('somente GM altera e insere; cliques concorrentes acumulam sem extrapolar',async()=>{
  reset();await Promise.all([marker.changeMarker({delta:1}),marker.changeMarker({delta:1}),marker.changeMarker({delta:1})]);assert.equal(settings.get('huntMarker'),3);
  await marker.changeMarker({delta:50});assert.equal(settings.get('huntMarker'),4);await marker.changeMarker({delta:-50});assert.equal(settings.get('huntMarker'),0);
  game.user.isGM=false;assert.throws(()=>marker.changeMarker({value:2}),/Guia/);await assert.rejects(marker.placeMarker(),/Guia/);game.user.isGM=true;
});
test('peças vinculadas sincronizam; peças de posição e outros tiles permanecem intactos',async()=>{
  reset();const s=scene({name:'Caçada',width:1600,height:1600,grid:{size:100}});game.scenes.push(s);
  const p=await marker.placeMarker({scene:s,mode:'positions'}),linked=await marker.placeMarker({scene:s,mode:'linked'});
  assert.equal(await marker.placeMarker({scene:s,mode:'linked'}),linked);assert.equal(s.tiles.length,2);
  await marker.syncMarkerTiles(4);assert.ok(linked.texture.src.endsWith('marcador-4.svg'));assert.ok(p.texture.src.endsWith('marcador-posicoes.svg'));
});
test('painel permite leitura aos jogadores e cinco valores ao GM',()=>{
  const view=marker.markerMarkup(2,false);assert.equal((view.match(/data-wfe-marker-value/g)||[]).length,5);assert.equal((view.match(/disabled/g)||[]).length,7);assert.ok(!view.includes('data-wfe-marker-place'));
  assert.ok(marker.markerMarkup(2,true).includes('Peça com preenchimento'));
});
test('Playlist contém o MP3 exato em loop e Cena referencia o som nativo',async()=>{
  reset();const result=await media.ensureWorldMedia({imagePath:'worlds/test/capa.webp'});
  assert.equal(result.sound.repeat,true);assert.equal(result.sound.path,media.MUSIC_PATH);assert.equal(result.scene.playlist.id,result.playlist.id);assert.equal(result.scene.playlistSound.id,result.sound.id);
  assert.equal(result.scene.background.src,'worlds/test/capa.webp');assert.equal(result.scene.active,false);assert.equal(result.scene.grid.type,0);
  assert.equal((await fs.stat(new URL('../assets/media/fogueira-da-floresta.mp3',import.meta.url))).size,4322457);
});
test('repetir instalação não duplica e recupera faixa excluída sem afetar outra Playlist',async()=>{
  reset();await media.ensureWorldMedia();await media.ensureWorldMedia();assert.equal(playlistCreates,1);assert.equal(sceneCreates,1);
  game.playlists[0].sounds=[];await media.ensureWorldMedia();assert.equal(game.playlists[0].sounds.length,1);assert.equal(playlistCreates,1);
});
test('Cena sem capa fica marcada como pendente e aceita vínculo posterior',async()=>{
  reset();const r=await media.ensureWorldMedia({imagePath:''});assert.equal(r.scene.background.src,null);assert.equal(r.scene.flags[ID].awaitingCover,true);
  await media.ensureWorldMedia({imagePath:'worlds/test/final.png'});assert.equal(r.scene.background.src,'worlds/test/final.png');assert.equal(sceneCreates,1);
});
test('configuração de ambiente exige GM e cancelar não altera documentos',async()=>{
  reset();assert.equal(await media.configureLanding(),null);assert.equal(playlistCreates,0);game.user.isGM=false;await assert.rejects(media.ensureWorldMedia(),/Guia/);game.user.isGM=true;
});
test('capa inexistente é recusada antes de criar documentos e dimensão real é preservada',async()=>{
  reset();globalThis.Image=class{set src(_path){queueMicrotask(()=>this.onerror());}};
  await assert.rejects(media.ensureWorldMedia({imagePath:'arquivo-inexistente.png'}),/não foi encontrada/);assert.equal(playlistCreates,0);assert.equal(sceneCreates,0);
  globalThis.Image=class{naturalWidth=3000;naturalHeight=1000;set src(_path){queueMicrotask(()=>this.onload());}};
  const r=await media.ensureWorldMedia({imagePath:'capa.png'});assert.equal(r.scene.width,3000);assert.equal(r.scene.height,1000);delete globalThis.Image;
});
test('controle Foundry 13 usa dicionário de ferramentas e mantém API existente',()=>{
  const controls={tokens:{tools:{select:{name:'select'}}}};for(const f of hooks.get('getSceneControlButtons'))f(controls);assert.ok(controls.tokens.tools['wfe-hunt-marker'].button);assert.ok(controls.tokens.tools.select);
  assert.equal(registry.get('huntMarker').scope,'world');assert.equal(registry.get('huntMarker').default,0);
});

test('capa incluída é padrão e preferência personalizada é mantida',async()=>{
 reset();let r=await media.ensureWorldMedia();assert.equal(r.scene.background.src,media.COVER_PATH);
 settings.set('landingImage','worlds/custom.png');r=await media.ensureWorldMedia();assert.equal(r.scene.background.src,'worlds/custom.png');assert.equal(sceneCreates,1);
});
test('migração das peças troca somente textura e não toca tiles alheios',async()=>{
 reset();const s=scene({width:1600,height:1600,grid:{size:100}});game.scenes.push(s);
 const p=await marker.placeMarker({scene:s}),l=await marker.placeMarker({scene:s,mode:'linked'});
 p.texture.src='old.svg';l.texture.src='old.svg';settings.set('huntMarker',3);
 s.tiles.push({id:'other',texture:{src:'other.png'},getFlag:()=>undefined});
 const before={x:p.x,y:p.y,width:p.width,height:p.height};
 await marker.upgradeMarkerTiles();
 assert.ok(p.texture.src.includes('/hd/'));assert.equal(l.texture.src,marker.markerTexture(3));
 assert.deepEqual({x:p.x,y:p.y,width:p.width,height:p.height},before);assert.equal(s.tiles[2].texture.src,'other.png');
});
test('SVG vetorial possui resolução explícita de textura e proporção consistente',async()=>{
 for(const name of ['0','1','2','3','4','posicoes']){
 const svg=await fs.readFile(new URL('../assets/hunt/hd/marcador-'+name+'.svg',import.meta.url),'utf8');
 assert.match(svg,/width="2400" height="3800"/);assert.match(svg,/viewBox="0 0 480 760"/);assert.ok(!svg.includes('<image'));
 }
});
