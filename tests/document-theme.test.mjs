import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Hooks={on(){}};globalThis.game={system:{id:'wilderfeast'}};globalThis.innerWidth=1024;globalThis.innerHeight=800;
const {themeDocumentSheet}=await import('../scripts/document-theme.mjs');
function fixture(type){const classes=new Set(),positions=[];return {root:{classList:{add:c=>classes.add(c)}},app:{document:{documentName:type},position:{width:400,height:600},setPosition:p=>positions.push(p)},classes,positions};}
test('Itens e páginas de handouts recebem tema e tamanho limitado à tela',()=>{for(const type of ['Item','JournalEntry','JournalEntryPage']){const f=fixture(type);themeDocumentSheet(f.app,[f.root]);assert.ok(f.classes.has('wfe-document-sheet'));assert.deepEqual(f.positions,[{width:660,height:740}]);}});
test('rerenderizar preserva o tamanho escolhido pelo usuário',()=>{const f=fixture('Item');themeDocumentSheet(f.app,[f.root]);themeDocumentSheet(f.app,[f.root]);assert.equal(f.positions.length,1);});
test('atores e outros sistemas não recebem o tema dos editores',()=>{const f=fixture('Actor');themeDocumentSheet(f.app,[f.root]);assert.equal(f.classes.size,0);game.system.id='other';const item=fixture('Item');themeDocumentSheet(item.app,[item.root]);assert.equal(item.classes.size,0);game.system.id='wilderfeast';});
