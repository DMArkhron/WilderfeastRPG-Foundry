/** Offline preview of the native system template with the module editor theme. */
import fs from 'node:fs/promises';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),out=path.join(root,'preview/editors');await fs.mkdir(out,{recursive:true});
const context={};vm.runInNewContext(await fs.readFile('/tmp/wfe-handlebars/package/dist/handlebars.js','utf8'),context);const h=context.Handlebars;
h.registerHelper('localize',key=>key.endsWith('.cost')?'Custo':'Descrição');h.registerHelper('editor',html=>new h.SafeString(`<div class="editor"><button type="button" class="editor-edit">Editar descrição</button><div class="editor-content">${html}</div><textarea name="system.description" hidden></textarea></div>`));
const template=h.compile(await fs.readFile(path.join(root,'tools/fixtures/native-item.hbs'),'utf8'));
const css=(await fs.readFile(path.join(root,'styles/enhanced.css'),'utf8')).replaceAll('../assets/','../../assets/');
for(const [name,pack] of [['technique','iniciantes'],['trait','tracos'],['recipe','receitas']]) {
 const docs=await Promise.all((await fs.readdir(path.join(root,'pack-source',pack))).map(async f=>JSON.parse(await fs.readFile(path.join(root,'pack-source',pack,f),'utf8'))));
 const item=name==='technique'?docs.find(d=>d.name==='SEQUÊNCIA DE MOVIMENTOS'):docs[0];
 let desc=item.system.description.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g,'<a class="content-link" href="#">$2</a>').replaceAll('modules/wilderfeast-enhanced/','../../');
 const body=template({item,descriptionHTML:desc,cssClass:'editable',owner:true,editable:true});
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#cdc7b9;font-family:Arial}.window-app{width:min(660px,100%);height:760px;margin:auto;display:flex;flex-direction:column}.window-header{padding:8px 12px;flex:none}.window-content{flex:1}input{width:100%}.editor-edit{position:relative;margin:5px}.wfe-meta-launch{width:100%}${css}</style><main class="window-app wilderfeast sheet item wfe-document-sheet"><header class="window-header">${item.name} · Editar</header><div class="window-content">${body}<button class="wfe-meta-launch" type="button">Configurar nível e custos</button></div></main><script>const text=document.querySelector('textarea'),content=document.querySelector('.editor-content');text.value=content.innerHTML;document.querySelector('.editor-edit').onclick=()=>{text.hidden=!text.hidden;content.hidden=!content.hidden;};</script></html>`;
 await fs.writeFile(path.join(out,`${name}.html`),html);
}
console.log('3 editores renderizados com o template nativo e tema do módulo.');
