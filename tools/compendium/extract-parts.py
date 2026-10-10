from pathlib import Path
import re,json,unicodedata
import subprocess,sys
r=Path(__file__).resolve().parents[2]
pages=subprocess.check_output(['pdftotext','-layout',sys.argv[1],'-'],text=True).split('\f'); rows=[]
for n in [*range(189,268,2),298]:
 intro=pages[n-2]; monster='GIGANTE' if n==298 else intro.strip().splitlines()[0].strip()
 lineage='Aventura' if n==298 else re.search(r'Linhagem dos ([^.]+)',intro,re.I)[1]
 section=re.split(r'^\s*PARTES\s+DURABILIDADE\s*$',pages[n-1],flags=re.M)[1].split('COMPORTAMENTO')[0]
 heads=list(re.finditer(r'^\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ \'’–-]+)\.?[ \t]+(?=Alcance:|Passiva:|Esta PARTE|Essa Parte|Essa PARTE|Esta Parte|Se estiver)',section,re.M))
 assert heads,(n,monster)
 for i,h in enumerate(heads):
  seg=section[h.end():heads[i+1].start() if i+1<len(heads) else len(section)]
  nums=[]; lines=[]
  for line in seg.splitlines():
   m=re.search(r'(?:\s{5,}|^\s*)(\d+)\s*$',line)
   if m: nums.append(int(m[1]));line=line[:m.start()]
   lines.append(line.strip())
  if 'Variável' in seg:
   continue # Copied parts retain the source monster's own durability; documented separately.
  assert len(nums)==1,(n,h[1],nums)
  text=re.sub(r'\s+',' ',' '.join(lines)).strip(); split=re.split(r'◆\s*S\s*e Quebrad[oa]s?:\s*',text)
  assert len(split)==2,(n,h[1],text)
  rows.append(dict(monster=monster,lineage=lineage,name=h[1].strip(),durability=nums[0],normal=split[0].strip(),broken=split[1].strip(),page=n))
(r/'data/parts.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(len(rows),len(set(x['monster'] for x in rows)));
