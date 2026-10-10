import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const manifest=await read('module.json'),parts=await read('data/parts.json');
const docs=await Promise.all((await readdir(new URL('pack-source/partes/',root))).map(p=>read('pack-source/partes/'+p)));
const folders=docs.filter(d=>d._key.startsWith('!folders!')),items=docs.filter(d=>d.type==='part');
test('Partes preservam Durabilidade, regras e origem de 40 espécies e Gigante',()=>{
 assert.equal(parts.length,109);assert.equal(items.length,109);assert.equal(folders.length,41);
 assert.equal(new Set(parts.map(p=>p.monster)).size,41);
 for(const row of parts){
  const item=items.find(d=>d.name===`${row.name} — ${row.monster}`);assert.ok(item);
  assert.deepEqual(item.system.durability,{value:row.durability,max:row.durability});
  assert.deepEqual(item.flags['wilderfeast-compendium'].normal,row.normal);
  assert.deepEqual(item.flags['wilderfeast-compendium'].broken,row.broken);
  assert.equal(item.flags['wilderfeast-compendium'].page,row.page);
  assert.equal(folders.find(d=>d._id===item.folder)?.name,row.monster);
  assert.match(item.system.description,/Parte íntegra/);assert.match(item.system.description,/Se Quebrada/);
  assert.deepEqual(item.effects,[]);
 }
 assert.equal(items.find(d=>d.name==='GELECA — ONAGUNG').system.durability.max,80);
 assert.equal(items.find(d=>d.name==='TEIA — GELARANHA ASIG').system.durability.max,1);
});
test('Cada compêndio pertence a uma única pasta temática',()=>{
 const children=manifest.packFolders[0].folders;
 assert.deepEqual(children.map(f=>f.name),['Personagens','Técnicas','Monstros','Culinária','Referências','Assistentes','Ambiente']);
 const assigned=children.flatMap(f=>f.packs);
 assert.equal(new Set(assigned).size,assigned.length);
 assert.deepEqual([...assigned].sort(),manifest.packs.map(p=>p.name).sort());
});
test('Partes adicionais do Onagung preservam Durabilidade variável sem Item fictício',async()=>{
 assert.equal(items.filter(d=>d.name.startsWith('PARTES ADICIONAIS')).length,0);
 const refs=await Promise.all((await readdir(new URL('pack-source/referencias/',root))).map(p=>read('pack-source/referencias/'+p)));
 const guide=refs.find(d=>d.flags['wilderfeast-compendium'].key==='monster-parts');
 assert.match(guide.pages[0].text.content,/Durabilidade variável/);
 assert.match(guide.pages[0].text.content,/uma Parte de cada um/);
});
