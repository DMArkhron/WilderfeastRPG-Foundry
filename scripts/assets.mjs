import {ID} from './constants.mjs';
const TOOLS={barbante:'barbante',cutelo:'cutelo',espeto:'espeto',luvas:'luvas',macarico:'macarico',panela:'panela'};
export function toolIcon(name='') {
 const key=String(name).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
 return TOOLS[key]?`modules/${ID}/assets/compendium/${TOOLS[key]}-livro.png`:'';
}
