"""Generate portable Foundry document sources from the audited catalog."""
import hashlib, html, json, re, shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
ID='wilderfeast-compendium'
PACKAGE_ID='wilderfeast-enhanced'
ENHANCED='wilderfeast-enhanced'
catalog=json.loads((ROOT/'data/catalog.json').read_text())
def uid(key): return hashlib.sha256((ID+':'+key).encode()).hexdigest()[:16]
def slug(s):
    import unicodedata
    return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()).strip('-')
def esc(s):return html.escape(str(s))
def uuid(pack,key):
    typ='Item' if pack in ['iniciantes','intermediarias','avancadas','conjunto','tracos','partes','receitas'] else 'Macro' if pack=='macros' else 'JournalEntry'
    return f'Compendium.{PACKAGE_ID}.{pack}.{typ}.{uid(key)}'
def link(pack,key,name):return '@UUID['+uuid(pack,key)+']{'+name+'}'
def traitkey(name,level=1):return 'trait:'+slug(name)+':'+str(level)
def techkey(name):return 'technique:'+slug(name)
def techpack(t):return 'conjunto' if t['shared'] else {'Iniciante':'iniciantes','Intermediária':'intermediarias','Avançada':'avancadas'}[t['category']]
techlookup={t['name']:(techpack(t),techkey(t['name'])) for t in catalog['techniques']}
def techlink(name):return link(*techlookup[name],name)
def traitlink(name,level=1):return link('tracos',traitkey(name,level),name+(f' {level}' if level>1 else ''))

conditions=[
 ('Amedrontado','X',309,'Após cada Teste, reduza [A] por X. Durante seu turno, você ou um parça podem pagar 3 Vigor para ASSEGURAR com qualquer Estilo; com um Sucesso, removem [A] níveis. Pode repetir enquanto houver Vigor. Recuar remove todos os níveis.'),
 ('Atordoado','X',309,'No começo do turno, receba X Ações a menos. Depois remova 1 nível ao iniciar um turno curto, ou todos ao iniciar um turno completo. Turnos de ferais são completos.'),
 ('Confuso','X',309,'Cada uso de Traço não passivo, exceto Brio e Tino, causa X Dano a você. Técnicas contam como Traços. Um turno curto inteiro sem um uso qualificado remove 1 nível; um turno completo remove todos. Não pode remover no turno em que recebeu a Condição.'),
 ('Convalescente','1 a 6',309,'Só afeta monstros. Ignore outras Condições e não recupere Vigor naturalmente. Com comida, completar o Vigor máximo remove 1 nível. Se continuar Convalescente, o Vigor volta a 0 e você recebe o excedente daquela comida.'),
 ('Descansado','X',309,'Vigor máximo +X. Ferido remove todos os níveis. Descansado e Fadigado cancelam níveis um por um.'),
 ('Dissonante','',309,'Desvantagem em todos os Testes. Remova quando a Harmonia ficar maior que 0.'),
 ('Envenenado','X',309,'No começo de cada rodada, sofra X Dano. Durante seu turno, você ou um parça podem gastar 1 Ação para CURAR com qualquer Estilo; com um Sucesso, removem [A] níveis. Pode repetir enquanto houver Ações.'),
 ('Escondido','',309,'Ataque com Vantagem; criaturas atacam você com Desvantagem. Você não pode se tornar o novo alvo de um Monstro; um alvo anterior continua até nova escolha. A Guia não anuncia o alvo de um Monstro Escondido. Remova depois de qualquer Teste. Exposto e Escondido cancelam ambos. Fora da Caçada, a Guia define os efeitos conforme a situação.'),
 ('Expandido','',309,'Trate criaturas como se estivessem 1 Pernada mais próximas. Gaste 1 Ação em seu turno para remover.'),
 ('Exposto','',310,'Sofra Dano dobrado. Remova ao Levantar a Guarda ou sofrer Dano durante a Caçada. Exposto e Escondido cancelam ambos.'),
 ('Fadigado','X',310,'Vigor máximo −X. Fadigado e Descansado cancelam níveis um por um.'),
 ('Ferido','1 a 3',310,'Nível 1: sinais de fraqueza, sem efeito isolado. Nível 2: não pode gastar Vigor, mas paga o restante do gasto que gerou esse nível. Nível 3: Vigor permanece 0; não pode gastar nem recuperar Vigor. Se permanecer caído, não pode fazer Testes com Ações. Se forçar a barra, pode agir, mas o próximo Dano mata. BESTA ENSANGUENTADA constitui uma exceção explícita.'),
 ('Preso','',310,'Uma Parte o prende e puxa até 0 Pernada. Não pode se Mover; a criatura o carrega ao se Mover. Desvantagem em todos os Testes. Remova se a Parte que o prende sofrer Dano à Parte, ou se você for puxado ou empurrado para longe.'),
 ('Queimado','',310,'Afeta Partes, incluindo Utensílios. Desvantagem ao atacar com a Parte. Remova ao recuperar qualquer Durabilidade nela ou ao estar Debaixo D’água/Subterrâneo. Nesses Terrenos, suas Partes não podem ficar Queimadas.'),
 ('Revigorado','X',310,'No começo da rodada, recupere X Vigor, depois remova 1 nível.')
]
condlookup={name:('referencias','condition:'+slug(name)) for name,_,_,_ in conditions}
crossrefs={name:('tracos',traitkey(name)) for name in {t['name'] for t in catalog['traits']}}
crossrefs.update(techlookup)
pattern=re.compile(r'(?<![\w-])('+'|'.join(re.escape(x) for x in sorted(crossrefs,key=len,reverse=True))+r')(?![\w-])')
def enriched(text,exclude=''):
    # Only uppercase rule names are crosslinked; normal prose remains intact.
    text=esc(text)
    text=pattern.sub(lambda m:link(*crossrefs[m[0]],m[0]) if m[0]!=exclude else m[0],text)
    cp=re.compile(r'(?<![\w-])('+'|'.join(condlookup)+r')(?:a|as|s)?(?![\w-])')
    return cp.sub(lambda m:link(*condlookup[m[1]],m[0]),text)

packdefs=[('utensilios','Utensílios','JournalEntry'),('iniciantes','Técnicas Iniciantes','Item'),
 ('intermediarias','Técnicas Intermediárias','Item'),('avancadas','Técnicas Avançadas','Item'),
 ('conjunto','Técnicas de Conjunto (Compartilhadas)','Item'),('tracos','Traços','Item'),
 ('especialidades','Especialidades','JournalEntry'),('referencias','Condições e Referências','JournalEntry'),
 ('macros','Assistentes da Ficha','Macro'),('partes','Partes dos Monstros','Item'),('receitas','Receitas do Livro','Item')]
docs={name:[] for name,_,_ in packdefs}
def flags(data):return {ID:data}
def journal(pack,key,name,content,data,icon='reference'):
    d={'_id':uid(key),'name':name,'folder':None,'sort':0,'ownership':{'default':2},'flags':flags(data),
       'pages':[{'_id':uid(key+':page'),'name':name,'type':'text','sort':0,'title':{'show':True,'level':1},
                 'text':{'format':1,'content':f'<article class="wfc-reference">{content}</article>'}}]}
    docs[pack].append(d);return d
def source(page):return f'<p class="wfc-source">Livro Básico · p. {page}. PDF fornecido no projeto.</p>'
def manual():return '<p class="wfc-manual">Referência de regra: resolva gatilhos, custos e efeitos com a Guia. Esta entrada não aplica efeitos automaticamente.</p>'
def notes_for(t):
    notes=[]
    if t.get('aliases'):notes.append('Na criação de personagem aparece também como '+', '.join(t['aliases'])+'. O nome principal segue o apêndice; trata-se da mesma regra.')
    if t['name']=='CORPO QUENTE':notes.append('Divergência no PDF: p. 22 diz “no começo de cada turno”; p. 301 diz “no começo de cada rodada”. Esta entrada segue o Apêndice A. A Guia deve definir o gatilho na mesa.')
    if 'Sucesso' in t['cost']:notes.append('Use apenas Sucessos extras; não pode gastar o último ou único Sucesso do Teste (p. 45).')
    if t['name']=='TINO':notes.append('Todos os humanos têm Tino; monstros não o recebem por padrão (p. 46).')
    if t['name']=='BRIO':notes.append('Todas as criaturas têm Brio (p. 46).')
    if t['name']=='BESTA ENSANGUENTADA':notes.append('Na ficha aprimorada v0.2.0, Ferido é limitado a 3. Controle Ferido 4 e os efeitos deslocados manualmente; não use a automação comum de dano/Vigor para resolver esta exceção.')
    if t['name']=='SEM MEDO DA MORTE':notes.append('A ficha aprimorada v0.2.0 bloqueia gastos em Ferido 2. Para esta exceção, ajuste o Vigor manualmente.')
    if t['name']=='MIGRADOR':notes.append('O Apêndice A não informa custo nem etiqueta Passiva para este Traço. O compêndio preserva essa ausência.')
    if t['name']=='TÔ CONTIGO':notes.append('Custo adicional de 3 Vigor ao carregar um monstro: total de 5 Vigor. Não configure apenas 2 Vigor como custo automático para esse caso.')
    if t['name']=='CORRENTES DE PRATA PRENDEM O MUNDO':notes.append('Há um custo inicial condicional a acertar e manutenção de 5 Vigor por rodada. Controle ambos separadamente.')
    if t['name']=='ME DÊ SUA FORÇA, PARÇA':notes.append('Os gastos dos parças e o bônus de Harmonia são resolvidos individualmente, após conferir as escolhas da matilha.')
    if t['name']=='LARGAR A ISCA':notes.append('A perda de Durabilidade desta Técnica não é Dano à Parte; não subtraia Vigor automaticamente por ela.')
    if t['name']=='PRINCÍPIO DA FORMA INCONSTANTE':notes.append('A Guia deve confirmar a Técnica escolhida e a aplicação da exceção ao requisito de Utensílio. Não existe efeito automatizado.')
    return '<ul class="wfc-notes">'+''.join('<li>'+esc(n)+'</li>' for n in notes)+'</ul>' if notes else ''

for t in catalog['techniques']:
    pack=techpack(t);key=techkey(t['name'])
    sessions={'Iniciante':2,'Intermediária':3,'Avançada':5}[t['category']]
    req='Empunhar '+', '.join(t['tools'])+('. Técnicas Compartilhadas são sempre Intermediárias.' if t['shared'] else '.')
    description='<p><strong>'+esc(t['category'])+' · '+esc(t['tool'])+'</strong></p><p><strong>Custo:</strong> '+esc(re.sub(r'^Custo: |^Custa: ','',t['cost']))+'</p><p>'+enriched(t['effect'],t['name'])+'</p><p><strong>Requisito:</strong> '+esc(req)+'</p><p><strong>Treinamento:</strong> '+str(sessions)+' sessões; '+link('referencias','training','Treinar no Recesso')+'.</p>'
    description+=notes_for(t)+manual()+source(t['page'])
    d={'_id':uid(key),'name':t['name'],'type':'technique','img':f'modules/{PACKAGE_ID}/assets/compendium/'+('conjunto' if t['shared'] else slug(t['tool']))+'.svg','system':{'cost':t['cost'],'description':description},'effects':[],'folder':None,'sort':0,'ownership':{'default':2},
       'flags':{ID:{**t,'kind':'technique','key':key,'trainingSessions':sessions},ENHANCED:{'meta':{'category':t['category'],'tool':t['tool'],'origin':f'Livro Básico p. {t["page"]}','mode':'passive' if t['cost'] in ['Passiva','Passive'] else 'reference','actionsCost':0,'vigorCost':0}}}}
    docs[pack].append(d)

maxlevels={n:max(t['level'] for t in catalog['traits'] if t['name']==n) for n in {t['name'] for t in catalog['traits']}}
for t in catalog['traits']:
    key=traitkey(t['name'],t['level']);maxlevel=maxlevels[t['name']]
    name=t['name']+(f' {t["level"]}' if maxlevel>1 else '')
    description=f'<p><strong>{"Traço padrão" if t["standard"] else "Traço monstruoso"} · Nível {t["level"]}</strong></p><p><strong>Custo:</strong> '+esc(re.sub(r'^Custo: |^Custa: ','',t['cost']))+'</p><p>'+enriched(t['effect'],t['name'])+'</p>'
    if maxlevel>1:description+='<p><strong>Outros níveis:</strong> '+' · '.join(traitlink(t['name'],i) for i in range(1,maxlevel+1) if i!=t['level'])+'. Importe apenas o nível atual deste Traço.</p>'
    description+=notes_for(t)+manual()+source(t['page'])
    docs['tracos'].append({'_id':uid(key),'name':name,'type':'trait','img':f'modules/{PACKAGE_ID}/assets/compendium/'+('padrao' if t['standard'] else 'traco')+'.svg','system':{'cost':t['cost'],'description':description},'effects':[],'folder':None,'sort':0,'ownership':{'default':2},
       'flags':{ID:{**t,'key':key,'kind':'trait','maxLevel':maxlevel,'baseKey':traitkey(t['name']).rsplit(':',1)[0]},ENHANCED:{'meta':{'level':t['level'],'category':'','tool':'','origin':f'Livro Básico p. {t["page"]}','mode':'passive' if t['cost'] in ['Passiva','Passive'] else 'reference','actionsCost':0,'vigorCost':0}}}})

for tool in catalog['tools']:
    ts=[t for t in catalog['techniques'] if t['tools']==[tool['name']] and not t['shared']]
    names={key:label for key,label in [('mighty','Poderoso'),('precise','Preciso'),('swift','Ligeiro'),('tricky','Sagaz')]}
    content='<p>'+esc(tool['description'])+'</p><p><strong>Base:</strong> 20 Durabilidade; Alcance 1 (Golpear). '+link('referencias','tools-rules','Utensílios e quebra')+'.</p>'
    content+='<p><strong>Criação:</strong> 3 '+names[tool['styles'][0]]+' e 2 '+names[tool['styles'][1]]+', ou o inverso. Outros Estilos: 1.</p><p><strong>Técnica obrigatória:</strong> '+techlink(tool['mandatory'])+'. Escolha mais uma Técnica Iniciante.</p>'
    if tool['name']=='Panela':content+='<p>Com Escudo de Aço, a Durabilidade máxima inicial é 50 (20 + 30).</p>'
    content+='<p><strong>Natureza / Aspiração:</strong> '+esc(', '.join(tool['personality']))+'. Escolha algo que você é e algo que se esforça para ser.</p>'
    for cat in ['Iniciante','Intermediária','Avançada']:content+='<h3>'+cat+'</h3><ul>'+''.join('<li>'+techlink(t['name'])+'</li>' for t in ts if t['category']==cat)+'</ul>'
    content+='<p><strong>Compartilhadas compatíveis:</strong></p><ul>'+''.join('<li>'+techlink(t['name'])+'</li>' for t in catalog['techniques'] if t['shared'] and tool['name'] in t['tools'])+'</ul>'
    content+='<p>Abra o assistente “Configurar Utensílio” na ficha ou no compêndio Assistentes da Ficha para aplicar esses dados.</p>'+source(tool['page'])
    journal('utensilios','tool:'+slug(tool['name']),tool['name'],content,{**tool,'kind':'tool','key':'tool:'+slug(tool['name']),'mandatoryUuid':uuid(*techlookup[tool['mandatory']]),'beginnerUuids':[uuid(*techlookup[t['name']]) for t in ts if t['category']=='Iniciante' and t['name']!=tool['mandatory']]})

for s in catalog['specialties']:
    content='<p>'+esc(s['description'])+'</p><p>Escolha um Traço desta Especialidade e um segundo Traço de qualquer Especialidade. Outras opções do Apêndice A exigem conversar com a Guia.</p><ul>'+''.join('<li>'+traitlink(n)+'</li>' for n in s['traits'])+'</ul><p>Registre também o relacionamento próximo com um monstro importante; ele tem desejos próprios e não é automaticamente um familiar. Veja as opções narrativas no Livro Básico.</p>'+source(s['page'])
    journal('especialidades','specialty:'+slug(s['name']),s['name'],content,{**s,'kind':'specialty','key':'specialty:'+slug(s['name']),'traitUuids':[uuid('tracos',traitkey(n)) for n in s['traits']]})
for name,level,page,body in conditions:
    journal('referencias','condition:'+slug(name),name+(' '+level if level else ''),'<p>'+enriched(body)+'</p>'+source(page),{'kind':'condition','page':page,'key':'condition:'+slug(name)})
journal('referencias','training','Treinar no Recesso','<p>Custa 1 Ação; no máximo uma vez por Recesso. Escolha uma Técnica do seu Utensílio e marque uma sessão por treinamento.</p><table><tr><th>Categoria</th><th>Sessões</th></tr><tr><td>Iniciante</td><td>2</td></tr><tr><td>Intermediária / Compartilhada</td><td>3</td></tr><tr><td>Avançada</td><td>5</td></tr></table><p>Ao completar o requisito, aprenda a Técnica e apague as sessões marcadas. O assistente de Utensílio importa as Técnicas de criação; aprender técnicas posteriores continua uma decisão da mesa.</p>'+source(88),{'kind':'reference','page':88,'key':'training'})
journal('referencias','tools-rules','Utensílios e quebra','<p>Utensílios são Partes especiais dos ferais. Começam com 20 Durabilidade e Alcance 1 (Golpear). Dano à Parte reduz Durabilidade e Vigor pelo mesmo valor.</p><p>A 0 Durabilidade, o Utensílio quebra: alcance adicional volta a 1 (Golpear) e o Dano é reduzido à metade. Recuperar Durabilidade acima de 0 restaura a descrição normal.</p><p>Técnicas continuam disponíveis com o Utensílio quebrado, salvo exceção explícita. Sem acesso ao Utensílio, não podem ser usadas salvo autorização narrativa da Guia.</p><p>O sistema possui campos próprios para Utensílio, Alcance e Durabilidade na ficha. Por isso o catálogo de Utensílios usa referências e um assistente, evitando criar uma segunda reserva de Durabilidade como Item Parte.</p>'+source(63),{'kind':'reference','page':63,'key':'tools-rules'})
journal('referencias','creation','Criação: checklist da ficha','<ol><li>Escolha Utensílio e distribuição dos Estilos 3/2/1/1. Receba a Técnica obrigatória e mais uma Iniciante.</li><li>Escolha Natureza e Aspiração nas opções do Utensílio.</li><li>Escolha Especialidade: um Traço dela e outro de qualquer Especialidade. Registre o monstro importante.</li><li>Complete Origem, Habilidades, Ingrediente e Tempero típicos, pratos e vínculos usando o capítulo de criação e a Ficha Editável.</li><li>Confirme Vigor, Durabilidade e Alcance; lembre que Brio pertence a todas as criaturas e Tino a humanos.</li></ol><p>Os assistentes preenchem Utensílio/técnicas e Especialidade/traços selecionados. As demais etapas são escolhas narrativas feitas na ficha.</p>'+source('10–25'),{'kind':'reference','page':'10–25','key':'creation'})
index='<p>Conteúdo de apoio à ficha de Wilderfeast em português, baseado no PDF do projeto.</p><ul>'
for tool in catalog['tools']:index+='<li>'+link('utensilios','tool:'+slug(tool['name']),tool['name'])+'</li>'
index+='</ul><p>'+link('referencias','creation','Criação de personagem')+' · '+link('referencias','training','Treinamento')+' · '+link('referencias','tools-rules','Utensílios e quebra')+'</p><p>Arraste Técnicas e Traços do compêndio à ficha. Para trocar nível de um Traço, use o assistente Importar Traço: ele substitui a versão anterior após uma prévia. As Técnicas de Conjunto correspondem às Compartilhadas do livro.</p><p>As descrições e custos são referências. Gatilhos, alvos, dano, bônus, manutenção e exceções não são aplicados automaticamente. Os assistentes nunca alteram um ator durante a ativação do módulo.</p>'
journal('referencias','index','Comece aqui — Compêndios da Ficha',index,{'kind':'reference','key':'index'})

for method,label in [('openCatalog','Abrir Compêndios da Ficha'),('configureTool','Configurar Utensílio'),('applySpecialty','Aplicar Especialidade'),('importTrait','Importar Traço / Trocar Nível'),('migrateLegacyReferences','Atualizar Referências Antigas')]:
    command=f'const api = game.modules.get("{PACKAGE_ID}")?.api?.compendium;\nif (!api) ui.notifications.error("Ative Wilderfeast — Fichas, Mecânicas e Compêndios.");\nelse await api.{method}();'
    docs['macros'].append({'_id':uid('macro:'+method),'name':label,'type':'script','scope':'global','command':command,'img':f'modules/{PACKAGE_ID}/assets/compendium/reference.svg','folder':None,'sort':0,'ownership':{'default':2},'flags':flags({'kind':'macro','key':'macro:'+method})})


journal('referencias','monster-parts','Partes dos monstros — uso e Partes adicionais','<p>Arraste uma Parte do compêndio à ficha do monstro correspondente. Cada Parte mantém sua própria Durabilidade. A 0, use a descrição Se Quebrada; recuperar Durabilidade acima de 0 restaura a descrição normal. Os efeitos especiais e mudanças de Traços/Habilidades são resolvidos manualmente com a Guia.</p><p><strong>Onagung — Partes adicionais (Durabilidade variável):</strong> se estiver digerindo um monstro, possui todas as Partes dele; se estiver digerindo vários, possui uma Parte de cada um. Importe as Partes dos monstros digeridos, com suas próprias regras e Durabilidade. Não existe uma reserva fixa de Durabilidade para esta entrada.</p>'+source('62–63, 225'),{'kind':'reference','key':'monster-parts','page':'62–63, 225'})
parts=json.loads((ROOT/'data/parts.json').read_text())
for t in parts:
    key='part:'+slug(t['monster'])+':'+slug(t['name'])
    folderkey='folder:parts:'+slug(t['monster'])
    description='<p><strong>'+esc(t['monster'])+' · '+esc(t['lineage'])+'</strong></p><p><strong>Durabilidade:</strong> '+str(t['durability'])+'</p><h3>Parte íntegra</h3><p>'+enriched(t['normal'])+'</p><h3>Se Quebrada (0 Durabilidade)</h3><p>'+enriched(t['broken'])+'</p>'+manual()+source(t['page'])
    docs['partes'].append({'_id':uid(key),'name':t['name']+' — '+t['monster'],'type':'part','img':f'modules/{PACKAGE_ID}/assets/compendium/traco.svg','system':{'durability':{'value':t['durability'],'max':t['durability']},'description':description},'effects':[],'folder':uid(folderkey),'sort':0,'ownership':{'default':2},'flags':{ID:{**t,'kind':'part','key':key},ENHANCED:{'meta':{'category':'Parte','origin':f"{t['monster']} · Livro Básico p. {t['page']}",'mode':'reference','actionsCost':0,'vigorCost':0}}}})
for monster in sorted({t['monster'] for t in parts}):
    docs['partes'].append({'_id':uid('folder:parts:'+slug(monster)),'name':monster,'type':'Item','folder':None,'sorting':'a','sort':0,'color':'#285e59','flags':{},'_key':'!folders!'+uid('folder:parts:'+slug(monster))})


for t in json.loads((ROOT/'data/recipes.json').read_text()):
    key='recipe:'+slug(t['name'])
    art='<img class="wfe-recipe-art" src="modules/'+PACKAGE_ID+'/assets/compendium/'+t['image']+'" alt="'+esc(t['name'])+'">'
    content='<article class="wfe-recipe-card"><div class="wfe-recipe-overview"><div class="wfe-recipe-summary"><h3>'+esc(t['name'])+'</h3><p class="wfe-recipe-benefit"><strong>Recupere '+str(t['vigor'])+' de Vigor.</strong> '+enriched(t['effect'])+'</p><h4>Ingredientes</h4><ul class="wfe-recipe-ingredients">'+''.join('<li><strong>'+esc(i['name'])+'</strong><span>'+enriched(i['effect'])+'</span></li>' for i in t['ingredients'])+'</ul></div>'+art+'</div><h4>Modo de preparo</h4><ol>'+''.join('<li>'+enriched(step)+'</li>' for step in t['steps'])+'</ol>'+manual()+source(t['page'])+'</article>' 
    docs['receitas'].append({'_id':uid(key),'name':t['name'],'type':'technique','img':f'modules/{PACKAGE_ID}/assets/compendium/'+t['image'],'system':{'cost':'Referência culinária','description':content},'effects':[],'folder':None,'sort':0,'ownership':{'default':2},'flags':{ID:{**t,'kind':'recipe','key':key},ENHANCED:{'meta':{'category':'Receita','origin':f"Livro Básico p. {t['page']}",'mode':'reference','actionsCost':0,'vigorCost':0}}}})
# The original book illustrations replace the six tool icons, retaining document IDs.
for pack,entries in docs.items():
    for d in entries:
        meta=d.get('flags',{}).get(ID,{})
        tool=meta.get('tool') if meta.get('kind')=='technique' and not meta.get('shared') else meta.get('name') if meta.get('kind')=='tool' else None
        if tool:d['img']=f'modules/{PACKAGE_ID}/assets/compendium/'+slug(tool)+'-livro.png'

for name,label,typ in packdefs:
    dest=ROOT/'pack-source'/name
    if dest.exists():shutil.rmtree(dest)
    dest.mkdir(parents=True)
    collection={'JournalEntry':'journal','Item':'items','Macro':'macros'}[typ]
    for d in docs[name]:
        d.setdefault('_key',f'!{collection}!{d["_id"]}')
        for page in d.get('pages',[]):page['_key']=f'!journal.pages!{d["_id"]}.{page["_id"]}'
        (dest/(d['_id']+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
manifest={'id':ID,'title':'Wilderfeast — Compêndios da Ficha','description':'Utensílios, técnicas, traços, especialidades e referências em português. Conteúdo baseado no Livro Básico fornecido no projeto.','version':'0.1.0','compatibility':{'minimum':'13','maximum':'13'},'authors':[{'name':'DM Arkhron'}],'esmodules':['scripts/main.mjs'],'styles':['styles/compendium.css'],
 'relationships':{'systems':[{'id':'wilderfeast','type':'system','compatibility':{'minimum':'2.0.0','maximum':'2.0.1'}}]},
 'packs':[{'name':name,'label':label,'path':'packs/'+name,'type':typ,**({'system':'wilderfeast'} if typ=='Item' else {}),'ownership':{'PLAYER':'OBSERVER','TRUSTED':'OBSERVER','ASSISTANT':'OWNER'}} for name,label,typ in packdefs],
 'packFolders':[{'name':'Wilderfeast — Ficha','sorting':'m','color':'#285e59','packs':[],'folders':[{'name':label,'sorting':'a','color':'#285e59','packs':names} for label,names in [('Personagens',['utensilios','especialidades','tracos']),('Técnicas',['iniciantes','intermediarias','avancadas','conjunto']),('Monstros',['partes']),('Culinária',['receitas']),('Referências',['referencias']),('Assistentes',['macros'])]]}]}
existing=json.loads((ROOT/'module.json').read_text())
existing['packs']=manifest['packs'];existing['packFolders']=manifest['packFolders']
(ROOT/'module.json').write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/counts.json').write_text(json.dumps({name:sum(not d.get('_key','').startswith('!folders!') for d in ds) for name,ds in docs.items()},indent=2)+'\n')

# Native SVG icons distinguish the six tools without external asset dependencies.
shapes={'barbante':'<path d="M21 24c4-14 27-14 29 1 2 15-21 20-27 10s14-17 20-8c7 11-4 26-12 24"/>',
 'cutelo':'<path d="M18 13h28v29H25zM25 42v13h-9V42"/>',
 'espeto':'<path d="m16 51 32-33M35 11l16 16M40 8l16 16M17 49l-7 7"/>',
 'luvas':'<path d="M19 52V27c0-5 7-5 7 0V14c0-6 7-6 7 0v12-15c0-5 7-5 7 0v15-12c0-5 7-5 7 0v22l6-9c5-5 10 0 7 5L45 52z"/>',
 'macarico':'<path d="M23 53V32h18v21zM30 32V18h16M46 18l8-6M47 25c12-2 10-10 14-13M21 39h22"/>',
 'panela':'<path d="M17 32c0 25 32 25 32 0zM25 23h16M32 18v5M17 36H8M49 36h8"/>',
 'traco':'<path d="M17 46c-4-16 5-26 15-14 10-12 19-2 15 14-4 10-26 10-30 0z"/><circle cx="15" cy="21" r="4"/><circle cx="28" cy="15" r="4"/><circle cx="41" cy="17" r="4"/><circle cx="52" cy="27" r="4"/>',
 'padrao':'<path d="m32 12 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"/>',
 'conjunto':'<circle cx="20" cy="25" r="8"/><circle cx="44" cy="25" r="8"/><path d="M8 50c0-19 24-19 24 0M32 50c0-19 24-19 24 0"/>',
 'reference':'<path d="M12 15c12-4 20 2 20 2s8-6 20-2v34c-12-4-20 2-20 2s-8-6-20-2zM32 17v34"/>'}
(ROOT/'assets'/'compendium').mkdir(exist_ok=True)
for name,shape in shapes.items():
    (ROOT/'assets'/'compendium'/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#193c38"/><g fill="none" stroke="#f5c078" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+shape+'</g></svg>')
print(json.dumps({name:sum(not d.get('_key','').startswith('!folders!') for d in ds) for name,ds in docs.items()},ensure_ascii=False))

# Keep already-imported module icon paths working with the book artwork.
import base64,struct
for tool in ['barbante','cutelo','espeto','luvas','macarico','panela']:
    raw=(ROOT/'assets/compendium'/(tool+'-livro.png')).read_bytes()
    width,height=struct.unpack('>II',raw[16:24])
    data=base64.b64encode(raw).decode()
    (ROOT/'assets/compendium'/(tool+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}"><image width="{width}" height="{height}" href="data:image/png;base64,{data}"/></svg>')
