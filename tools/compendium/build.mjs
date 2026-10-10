import {readFile,readdir,rm,mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const cli=await import(process.env.WFC_CLI_PATH ?? "@foundryvtt/foundryvtt-cli");
const manifest=JSON.parse(await readFile(resolve(root,"module.json"),"utf8"));
for(const pack of manifest.packs){
  const dest=resolve(root,pack.path);await rm(dest,{recursive:true,force:true});
  await cli.compilePack(resolve(root,"pack-source",pack.name),dest);
  // Read back the actual database, including embedded journal pages.
  const back=resolve(root,".verification",pack.name);await rm(back,{recursive:true,force:true});await mkdir(back,{recursive:true});
  await cli.extractPack(dest,back);
  const original=new Map();
  for(const name of await readdir(resolve(root,"pack-source",pack.name))){const d=JSON.parse(await readFile(resolve(root,"pack-source",pack.name,name),"utf8"));original.set(d._id,d);}
  let count=0;
  for(const name of await readdir(back)){const d=JSON.parse(await readFile(resolve(back,name),"utf8"));
    const expected=original.get(d._id);assert.ok(expected,`Unexpected readback document: ${d.name}`);
    // CLI 3 adds the empty journal categories field used by newer cores.
    if(pack.type==="JournalEntry" && d.categories?.length===0 && !expected.categories)delete d.categories;
    assert.deepEqual(d,expected,`Readback mismatch: ${pack.name} / ${d.name}`);count++;
  }
  if(count!==original.size)throw new Error(`Readback count mismatch: ${pack.name}`);
  console.log(`${pack.name}: ${count} documentos, leitura LevelDB idêntica.`);
}
