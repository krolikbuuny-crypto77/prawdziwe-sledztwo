/** 6.36 II — jedna, serwerowa projekcja okazanego materiału.
 * Nigdy nie przyjmuj treści, nazwy ani typu z przeglądarki.
 * Wymaga zatwierdzenia w approvedEvidence bieżącej sesji.
 */
import canon from './trusted-witness-canon-624.json' with {type:'json'};
import rules from './approved-rules.js';
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export const exhibitType=(id,title='')=>{
 const t=String(title).toLocaleLowerCase('pl');
 if(/fotografi|zdjęci|zdjec|kadr|klatka/.test(t))return 'fotografia';
 if(/rejestr|wydruk|log|dziennik|wykaz|zapis|księga|ksiega/.test(t))return 'rejestr';
 if(/wiadomoś|wiadomos|korespondenc|list|mail/.test(t))return 'korespondencja';
 if(/raport|protokół|protokol|opinia|sprawozdani|badani/.test(t))return 'raport';
 if(/ślad|slad|próbk|probk|włókn|wlokn/.test(t))return 'ślad rzeczowy';
 return 'dokument';
};
export function verifiedExhibit(id,state){
 if(typeof id!=='string'||!hasOwn(canon.documents,id)||!hasOwn(rules.documents,id)||
  !Array.isArray(state?.approvedEvidence)||!state.approvedEvidence.includes(id))return null;
 const doc=canon.documents[id];
 return Object.freeze({id,title:doc.title,family:doc.family||rules.documents[id].family||'inne',
  type:exhibitType(id,doc.title),summary:String(doc.body||'').slice(0,1200),
  interpretationLimit:'Materiał potwierdza wyłącznie zapisane w nim ustalenia. Nie jest osobistą obserwacją świadka, nie identyfikuje samodzielnie sprawcy.'});
}
export function listExhibitRegistry(){return Object.keys(canon.documents).filter(id=>hasOwn(rules.documents,id));}
