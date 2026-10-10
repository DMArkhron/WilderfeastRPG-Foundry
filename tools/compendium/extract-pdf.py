import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROOT.mkdir(exist_ok=True)
if len(sys.argv) != 2:
    raise SystemExit('Uso: python3 tools/extract-pdf.py /caminho/Livro-Basico.pdf (requer Poppler)')
pages = subprocess.run(['pdftotext', '-layout', sys.argv[1], '-'], capture_output=True, text=True, check=True).stdout.split('\f')

def clean(s):
    lines = [x for x in s.splitlines() if not re.fullmatch(r'\s*\d+\s*', x)]
    return '\n'.join(lines)

def entries(text):
    matches = list(re.finditer(r'^\s*([•◇])\s+(.+)', text, re.M))
    for i,m in enumerate(matches):
        block = text[m.end(1):matches[i+1].start() if i+1<len(matches) else len(text)].strip()
        # Explanatory boxes and headings are separated from the rule by blank lines.
        block = re.split(r'\n\s*\n', block)[0]
        block = re.sub(r'\s+', ' ', block).strip()
        found = re.match(r'(.+?)\.?\s*\(([^)]+)\)\.?\s*(.*)', block)
        if found:
            yield m.group(1), found[1].rstrip('.'), found[2], found[3]
        else:
            name,body=block.split('. ',1)
            yield m.group(1),name,'Não informado no apêndice',body

techniques=[]
for page in [305,306,307]:
    text=clean(pages[page-1])
    chunks=re.split(r'TÉCNICAS DE (BARBANTE|CUTELO|ESPETO|LUVAS|MAÇARICO|PANELA)',text)
    for i in range(1,len(chunks),2):
        tool=chunks[i].title()
        # The vertical category headings interrupt some entries: remove them.
        body=re.sub(r'^\s*(INICIANTE|INTERMEDIÁRIO|AVANÇADO)\s*$', '', chunks[i+1], flags=re.M)
        body=re.sub(r'\n\s*\n', '\n',body)
        rows=list(entries(body))
        assert len(rows)==9,(tool,rows)
        for j,(_,name,cost,effect) in enumerate(rows):
            techniques.append(dict(name=name,cost=cost,effect=effect,page=page,tool=tool,
                category='Iniciante' if j<4 else 'Intermediária' if j<7 else 'Avançada',
                tools=[tool],shared=False))

text=clean(pages[307])
chunks=re.split(r'TÉCNICAS (LIGEIRAS|PODEROSAS|PRECISAS|SAGAZES)',text)
allowed={'LIGEIRAS':['Luvas','Espeto','Barbante'],'PODEROSAS':['Cutelo','Luvas','Panela'],
         'PRECISAS':['Cutelo','Espeto','Maçarico'],'SAGAZES':['Panela','Maçarico','Barbante']}
for i in range(1,len(chunks),2):
    section=re.sub(r'^\s*Você só pode usar essas Técnicas[^\n]+\n?', '', chunks[i+1], flags=re.M)
    rows=list(entries(re.sub(r'\n\s*\n','\n',section)))
    assert len(rows)==3,(chunks[i],rows)
    for _,name,cost,effect in rows:
        techniques.append(dict(name=name,cost=cost,effect=effect,page=308,category='Intermediária',
            tool=' / '.join(allowed[chunks[i]]),tools=allowed[chunks[i]],shared=True,group=chunks[i].title()))

traits=[]
for page in [300,301,302,303]:
    for marker,name,cost,effect in entries(clean(pages[page-1])):
        match=re.match(r'(.+?) (\d)(?: A (\d))?$',name)
        if marker=='◇':
            assert match,name
            base=match[1]
            levels=range(int(match[2]),int(match[3] or match[2])+1)
        else:
            base=name;levels=[1]
        for level in levels:
            traits.append(dict(name=base,level=level,cost=cost,effect=effect,page=page,
                standard=base in ['BRIO','TINO']))

aliases={'VELOCIDADE':['ACELERAR'],'DIGESTÃO LENTA':['DISGESTÃO LENTA'],
         'DESORIENTAR':['DESORIENTANTE']}
for t in traits: t['aliases']=aliases.get(t['name'],[])
for t in techniques:
    t['aliases']={'LANÇAMENTO RICOCHETE':['LANÇAMENTO RICOCHETEANTE'],
                  'DESATOLAR':['DESEMBARAÇADO'],
                  'ESPADA GRANDE PRA CARA***':['ESPADA GRANDE PRA CA***']}.get(t['name'],[])

specialties=[]
names=['Açougueiro','Amontoeiro','Churrasqueiro','Jardineiro','Molheiro','Padeiro','Peixeiro','Pivoteiro']
for page in [21,22,23,24]:
    text=clean(pages[page-1])
    chunks=re.split(r'^\s*('+ '|'.join(names) + r')\s*$',text,flags=re.M)
    for i in range(1,len(chunks),2):
        raw=list(entries(chunks[i+1]))[:3]
        starting=[x[1] for x in raw]
        for canonical,variants in aliases.items(): starting=[canonical if x in variants else x for x in starting]
        paragraph=chunks[i+1].strip().split('\n\n')[0]
        specialties.append(dict(name=chunks[i],page=page,traits=starting,description=re.sub(r'\s+',' ',paragraph)))

tools=[
 dict(name='Barbante',page=14,styles=['swift','tricky'],mandatory='RÉDEA CURTA',personality=['consistente','criativo','flexível','gentil','quieto','sábio'],description='Cordão de arkaicaço usado para puxar, conter e proteger; privilegia Ligeiro e Sagaz.'),
 dict(name='Cutelo',page=15,styles=['mighty','precise'],mandatory='CORTE LIMPO',personality=['audaz','prático','honesto','intenso','confiável','resoluto'],description='Lâmina de arkaicaço para cortes poderosos e precisos; privilegia Poderoso e Preciso.'),
 dict(name='Espeto',page=16,styles=['precise','swift'],mandatory='SEQUÊNCIA DE MOVIMENTOS',personality=[],description='Utensílio de arkaicaço que combina alcance e mobilidade; privilegia Preciso e Ligeiro.'),
 dict(name='Luvas',page=17,styles=['mighty','swift'],mandatory='DE PERTINHO',personality=['corajoso','descontraído','focado','sincero','compreensivo','animado'],description='Proteção de arkaicaço para lutar corpo a corpo; privilegia Poderoso e Ligeiro.'),
 dict(name='Maçarico',page=18,styles=['precise','tricky'],mandatory='LINHA DE FOGO',personality=['controlador','paciente','ardiloso','reservado','estudioso','minucioso'],description='Utensílio de arkaicaço de chama azul que dispensa combustível; privilegia Preciso e Sagaz.'),
 dict(name='Panela',page=19,styles=['mighty','tricky'],mandatory='ESCUDO DE AÇO',personality=['sereno','generoso','líder','popular','determinado','cauteloso'],description='Utensílio de arkaicaço usado como escudo e para grandes refeições; privilegia Poderoso e Sagaz.')
]
# Extract personality lists from the creation chapter rather than inventing them.
for tool in tools:
    text=clean(pages[tool['page']-1])
    mandatory=re.search(r'Você também ganha\s+(.+?)\s+e mais uma Técnica',text,re.S)
    assert mandatory,tool['name']
    tool['mandatory']=re.sub(r'\s+',' ',mandatory[1]).strip()
    match=re.search(r'Por fim, escolha algo.+?:\s*(.+?)\.',text,re.S)
    assert match,tool['name']
    tool['personality']=[x.strip() for x in re.sub(r'\s+',' ',match[1]).split(',')]

assert len(techniques)==66
assert len(specialties)==8
assert len({(t['name'],t['level']) for t in traits})==len(traits)
data=dict(source='Wilderfeast — Livro Básico, PDF fornecido pelo usuário',techniques=techniques,traits=traits,tools=tools,specialties=specialties)
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data/catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Techniques',len(techniques),'Traits',len(traits),'Base traits',len(set(t['name'] for t in traits)))

