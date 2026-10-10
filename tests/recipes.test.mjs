import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {toolIcon} from '../scripts/assets.mjs';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const rows=await read('data/recipes.json');
const docs=await Promise.all((await readdir(new URL('pack-source/receitas/',root))).map(f=>read('pack-source/receitas/'+f)));
test('Seis receitas são Itens nativos de referência com conteúdo e páginas corretas',()=>{
 assert.equal(docs.length,6);assert.deepEqual(rows.map(r=>r.page),[79,80,81,82,83,84]);
 assert.deepEqual(rows.map(r=>r.vigor),[1,5,8,5,10,4]);
 for(const row of rows){const doc=docs.find(d=>d.name===row.name);assert.ok(doc);assert.equal(doc.type,'technique');assert.equal(doc.flags['wilderfeast-enhanced'].meta.category,'Receita');assert.equal(doc.flags['wilderfeast-enhanced'].meta.mode,'reference');assert.equal(doc.flags['wilderfeast-enhanced'].meta.vigorCost,0);assert.deepEqual(doc.flags['wilderfeast-compendium'].ingredients,row.ingredients);assert.match(doc.system.description,/Modo de preparo/);assert.match(doc.system.description,/não aplica efeitos automaticamente/);}
});
test('Receitas preservam efeitos condicionais, raros e Temperos sem somar efeitos alternativos',()=>{
 assert.match(rows[2].effect,/VOAR.*não é aplicado/);assert.match(rows[2].effect,/máximo de 5/);
 assert.match(rows[3].steps[0],/Marcantes/);assert.match(rows[4].ingredients[0].name,/5 de Vigor/);assert.match(rows[4].ingredients[1].name,/3 de Vigor/);
 assert.match(rows[5].steps[0],/dobra uma única vez/);
});
test('Ícones dos seis Utensílios usam imagens reais e rejeitam nomes arbitrários',async()=>{
 for(const name of ['Barbante','Cutelo','Espeto','Luvas','Maçarico','Panela']){const path=toolIcon(name);assert.match(path,/-livro\.png$/);assert.ok((await readFile(new URL(path.replace('modules/wilderfeast-enhanced/',''),root))).length>10000);}
 assert.equal(toolIcon('<script>'), '');assert.equal(toolIcon(''), '');
});
