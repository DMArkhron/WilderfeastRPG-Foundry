export const ID = "wilderfeast-compendium";
export const ENHANCED = "wilderfeast-enhanced";
export const PACKAGE_ID = ENHANCED;
export const styles = {mighty:"Poderoso",precise:"Preciso",swift:"Ligeiro",tricky:"Sagaz"};
export const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const clone = value => structuredClone(value);
const aliases={"ACELERAR":"VELOCIDADE","DISGESTAO LENTA":"DIGESTAO LENTA","DESORIENTANTE":"DESORIENTAR","LANCAMENTO RICOCHETEANTE":"LANCAMENTO RICOCHETE","ESPADA GRANDE PRA CA***":"ESPADA GRANDE PRA CARA***","DESEMBARACADO":"DESATOLAR"};
export function normalized(value) {
  const text=String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu,"").toUpperCase().trim();
  return aliases[text] ?? text;
}
export function meta(doc) { return doc.flags?.[ID] ?? {}; }
export function sameTechnique(item,name) { return item.type==="technique" && normalized(meta(item).name ?? item.name)===normalized(name); }
export function sameTrait(item,data) { return item.type==="trait" && (meta(item).baseKey===data.baseKey || normalized(meta(item).name ?? item.name.replace(/ \d+$/,""))===normalized(data.name)); }
export function fingerprint(actor) {
  // Ignore unrelated edits, but detect resource/content changes before a dialog commits.
  return JSON.stringify({tool:actor.system.tool,range:actor.system.range,durability:actor.system.durability,
    styles:actor.system.styles,specialty:actor.flags?.[ENHANCED]?.identity?.specialty,
    items:(actor.items ?? []).map(i=>({id:i._id,name:i.name,type:i.type,flags:i.flags})),equipped:actor.flags?.[ID]?.equipped});
}
export function toolPlan(actor,tool,{optional=null,initialize=false,orientation=0}={}) {
  if(actor.type!=="wilder") throw new Error("Utensílios são configurados na ficha de um feral.");
  if(tool.kind!=="tool" || !Array.isArray(tool.styles) || tool.styles.length!==2) throw new Error("Referência de utensílio inválida.");
  if(![0,1].includes(orientation)) throw new Error("Distribuição de Estilos inválida.");
  if(initialize && !optional) throw new Error("Para aplicar a criação, escolha uma Técnica Iniciante adicional.");
  if(optional && (meta(optional).category!=="Iniciante" || meta(optional).shared || meta(optional).tools?.[0]!==tool.name || optional.name===tool.mandatory)) throw new Error("Escolha uma Técnica Iniciante adicional do utensílio.");
  const items=actor.items ?? [];
  const knows=name=>sameTechnique(optional ?? {},name) || name===tool.mandatory || items.some(i=>sameTechnique(i,name));
  const reinforced=["Cutelo","Luvas","Panela"].includes(tool.name) && knows("UTENSÍLIO REFORÇADO");
  const max=20+(tool.name==="Panela"?30:0)+(reinforced?10:0);
  const previous=actor.system.durability;
  const missing=Math.max(0,Number(previous.max)-Number(previous.value));
  const current=initialize?max:Math.max(0,max-missing);
  let range="1 (Golpear)";
  if(tool.name==="Barbante" && knows("CHICOTADA"))range="2 (Golpear)";
  if(tool.name==="Espeto" && knows("AGULHA E LINHA"))range+="; 2 (Atirar)";
  if(tool.name==="Maçarico")range+="; 3 (Atirar)";
  if(tool.name==="Panela" && knows("LANÇAMENTO RICOCHETE"))range+="; 2 (Atirar)";
  const patch={"system.tool":tool.name,"system.range":range,"system.durability.value":current,"system.durability.max":max};
  if(initialize) {
    for(const key of Object.keys(styles)) {
      const value=key===tool.styles[orientation]?3:key===tool.styles[1-orientation]?2:1;
      patch[`system.styles.${key}.value`]=value;patch[`system.styles.${key}.max`]=value;
    }
  }
  return {patch,max,current,range,initialize,mandatory:tool.mandatory,optional:optional?.name ?? null};
}
export function importData(doc) {
  const data=typeof doc.toObject==="function"?doc.toObject():clone(doc);
  delete data._id;delete data._key;delete data.folder;delete data.ownership;delete data._stats;
  data.flags ??={};data.flags[ID] ??={};data.flags[ID].sourceUuid=doc.uuid ?? null;
  return data;
}
export function uniqueNewTechniques(items,docs) {
  const output=[];
  for(const d of docs) if(!items.some(i=>sameTechnique(i,d.name)) && !output.some(i=>sameTechnique(i,d.name))) output.push(d);
  return output;
}
