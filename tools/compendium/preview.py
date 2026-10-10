"""Create a standalone, searchable preview of the actual compendium sources."""
import json, re, html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'module.json').read_text())
records=[]
for pack in manifest['packs']:
    if pack['type']=='Macro':continue
    for path in sorted((ROOT/'pack-source'/pack['name']).glob('*.json')):
        d=json.loads(path.read_text())
        if d.get('_key','').startswith('!folders!'):continue
        uuid=f'Compendium.{manifest["id"]}.{pack["name"]}.{pack["type"]}.{d["_id"]}'
        content=d.get('system',{}).get('description') or d['pages'][0]['text']['content']
        content=content.replace('modules/wilderfeast-enhanced/','../../')
        content=re.sub(r'@UUID\[([^\]]+)\]\{([^}]+)\}',lambda m:'<button class="ref" data-uuid="'+html.escape(m[1])+'">'+html.escape(m[2])+'</button>',content)
        metadata=d['flags']['wilderfeast-compendium']
        icon='../../assets/compendium/'+metadata['key'].split(':')[1]+'-livro.png' if metadata.get('kind')=='tool' else d.get('img','modules/wilderfeast-enhanced/assets/compendium/reference.svg').replace('modules/wilderfeast-enhanced/','../../')
        records.append(dict(uuid=uuid,name=d['name'],pack=pack['name'],label=pack['label'],content=content,
                            icon=icon,
                            search=d['name']+' '+pack['label']+' '+json.dumps(d['flags'],ensure_ascii=False)))
dest=ROOT/'preview'/'compendium';dest.mkdir(exist_ok=True)
payload=json.dumps(records,ensure_ascii=False).replace('<','\\u003c')
options=''.join('<option value="'+p['name']+'">'+html.escape(p['label'])+'</option>' for p in manifest['packs'] if p['type']!='Macro')
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wilderfeast — Compêndios da Ficha</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eee8dc;color:#253e38;font:16px/1.6 system-ui,sans-serif}header{background:#193c38;color:#fff5df;padding:26px max(24px,calc((100vw - 1300px)/2));border-bottom:6px solid #cda264}header h1{font-size:30px;margin:2px 0}header small{color:#e5c895;font-weight:700;letter-spacing:.06em}header p{margin:4px 0;font-size:14px}main{max-width:1300px;display:grid;grid-template-columns:330px 1fr;gap:25px;margin:24px auto;padding:0 24px}aside{background:#f9f6ef;padding:16px;border-radius:10px;border:1px solid #cfcec3;align-self:start}input,select{width:100%;padding:9px;font:inherit;border:1px solid #8da69a;border-radius:5px;margin:4px 0 12px;background:#fff}label{font-size:13px;font-weight:700}#list{max-height:63vh;overflow:auto}#list button{display:block;width:100%;padding:10px;border:0;background:transparent;color:#30453a;font:inherit;text-align:left;border-bottom:1px solid #e3e5d9;cursor:pointer;font-size:13px;font-weight:600}#list button:hover,#list button.active{background:#dceadd;color:#193c38}#counter{font-size:12px;margin:0 0 10px;color:#637469}article{background:#fffdf7;border:1px solid #cccfbf;border-radius:12px;padding:30px;min-width:0;box-shadow:0 8px 25px #193c3809}article h2{font-size:26px;line-height:1.3;margin:4px 0 20px;color:#193c38}.card-head{display:flex;gap:15px;align-items:center}.card-head img{width:58px;height:58px;flex:none}.category{font-size:12px;color:#64775b;text-transform:uppercase;font-weight:700;letter-spacing:.07em}#body h3{margin:20px 0 5px}#body p{margin:13px 0}.ref{display:inline;padding:0 2px;background:#edf4e5;border:0;border-bottom:1px solid #98b994;color:#225e4e;font:inherit;cursor:pointer;text-align:left}.ref:hover{background:#dbe8cf}.ref:focus-visible{outline:2px solid #c49044}.wfc-source{font-size:12px;color:#64775b;border-top:1px solid #dedfcd;padding-top:12px}.wfc-manual,.wfc-notes{font-size:13px;background:#faf0da;border-left:3px solid #c79035;padding:10px 14px}.wfc-notes{padding-left:30px}table{border-collapse:collapse;width:100%}td,th{padding:7px;border:1px solid #b8c5b5;text-align:left}footer{max-width:1300px;margin:15px auto;padding:0 24px 30px;color:#687666;font-size:12px}@media(max-width:750px){main{grid-template-columns:1fr;padding:0 12px;gap:14px;margin:14px auto}header{padding:20px}header h1{font-size:23px}#list{max-height:180px}article{padding:20px}article h2{font-size:22px}aside{padding:12px}}</style>
<header><small>WILDERFEAST · LIVRO BÁSICO</small><h1>Compêndios da Ficha</h1><p>6 utensílios · 66 técnicas · 77 traços, com 99 entradas por nível · 8 especialidades · 109 partes de monstros</p></header>
<main><aside><label for="search">Buscar nome, utensílio ou nome alternativo</label><input id="search" placeholder="Ex.: Panela, Nadar, Acelerar"><label for="pack">Categoria</label><select id="pack"><option value="">Todas as categorias</option>OPTIONS</select><p id="counter" aria-live="polite"></p><nav id="list" aria-label="Entradas do catálogo"></nav></aside><article><div class="card-head"><img id="icon" alt=""><div><div id="category" class="category"></div><h2 id="title"></h2></div></div><div id="body"></div></article></main>
<footer>Prévia de conteúdo fora do Foundry. O pacote inclui compêndios nativos e assistentes para preencher a ficha. Efeitos das regras são resolvidos com a Guia.</footer>
<script>const records=PAYLOAD;
const byUuid=new Map(records.map(d=>[d.uuid,d]));const norm=s=>s.normalize('NFD').replace(/\\p{Diacritic}/gu,'').toLowerCase();let selected='';
const list=document.querySelector('#list'),search=document.querySelector('#search'),pack=document.querySelector('#pack');
function renderList(){const q=norm(search.value),rows=records.filter(d=>(!pack.value||d.pack===pack.value)&&norm(d.search).includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));list.replaceChildren();for(const d of rows){const b=document.createElement('button');b.textContent=d.name;b.dataset.uuid=d.uuid;b.classList.toggle('active',d.uuid===selected);b.addEventListener('click',()=>show(d.uuid));list.append(b)}document.querySelector('#counter').textContent=rows.length+' entradas encontradas';}
function show(uuid){const d=byUuid.get(uuid);if(!d)return;selected=uuid;document.querySelector('#title').textContent=d.name;document.querySelector('#category').textContent=d.label;document.querySelector('#icon').src=d.icon;document.querySelector('#body').innerHTML=d.content;for(const b of document.querySelectorAll('#body .ref'))b.addEventListener('click',()=>{search.value='';pack.value='';show(b.dataset.uuid)});renderList();history.replaceState(null,'','#'+encodeURIComponent(uuid));}
search.addEventListener('input',renderList);pack.addEventListener('change',renderList);
show(decodeURIComponent(location.hash.slice(1))||records.find(d=>d.name.startsWith('Comece aqui')).uuid);
</script></html>'''.replace('OPTIONS',options).replace('PAYLOAD',payload)
page=page.replace('</style>',(ROOT/'styles/enhanced.css').read_text()+'</style>')
page=page.replace('</style>','#body article.wfc-reference{border:0;box-shadow:none;padding:0;background:transparent;border-radius:0}</style>')
(dest/'catalogo.html').write_text(page)
print(dest/'catalogo.html')
