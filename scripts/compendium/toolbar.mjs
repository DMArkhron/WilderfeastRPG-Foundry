export function toolbarMarkup({editable,isWilder}) {
 const buttons=[['catalog','◈','Compêndios',false,false],['tool','✦','Utensílio',true,true],['specialty','◭','Especialidade',true,true],['trait','◆','Traços / Níveis',true,false]];
 return `<nav class="wfc-toolbar" aria-label="Compêndios da Ficha"><span class="wfc-toolbar-title">Caderno da matilha</span><div>${buttons.filter(([, , ,owned,feral])=>(!owned||editable)&&(!feral||isWilder)).map(([key,icon,label])=>`<button type="button" data-wfc-assistant="${key}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</div></nav>`;
}
