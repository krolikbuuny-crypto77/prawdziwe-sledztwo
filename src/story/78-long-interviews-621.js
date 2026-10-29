/* Pakiet 6.21: relacje między tematami w długiej rozmowie.
 * Odnosi się tylko do pytań zapisanych w historii bieżącego świadka.
 * Nie odblokowuje informacji, nie interpretuje winy, nie zmienia zapisu.
 */
(function(){
'use strict';
if(!window.PS620_SCENES||typeof STATE==='undefined')return;
const topics=[
 ['access',/(?:t-17|kart|wejsci|dostep|sesj|log)/,'kart i logów'],
 ['technical',/(?:tw-217|l-2|l-3|protokol|podzespol|warsztat|usterk)/,'wagonu i dokumentacji technicznej'],
 ['chronology',/(?:godzin|kiedy|noc|dyzur|kolejn|po zmian|przed)/,'chronologii nocy'],
 ['lena',/(?:lena|leny|lenie|bhp|ostrzez|wiadom)/,'Leny i ostrzeżeń'],
 ['alibi',/(?:alibi|widział|widzial|obecno|spotkan)/,'obecności i alibi'],
 ['source',/(?:skad|zrod|potwierd|dowod|wiesz|sam widz)/,'źródeł wiedzy'],
 ['responsibility',/(?:zabil|zaboj|wina|klam|przyznaj|ukrywa|odpowiedzial)/,'odpowiedzialności']
];
const norm=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
function analyze(id){
 const entries=(STATE.dialogues?.[id]||[]).filter(x=>x?.role==='player').slice(-48);
 const rows=entries.map(x=>topics.filter(t=>t[1].test(norm(x.text))).map(t=>t[0]));
 const recent=rows.at(-1)||[],previous=rows.slice(0,-1),counts=new Map();
 for(const row of previous)for(const k of new Set(row))counts.set(k,(counts.get(k)||0)+1);
 const returns=recent.filter(k=>(counts.get(k)||0)>0),
  alternatives=[...new Set(rows.slice(-8,-1).flat().filter(k=>!recent.includes(k)))];
 return {count:entries.length,topics:recent,multi:recent.length>1,returns,alternatives,
  long:entries.length>=8,hasDocumentAccess:false};
}
const band=document.createElement('div');band.id='ps621ThreadCue';band.className='ps621-thread-cue';band.hidden=true;band.setAttribute('aria-label','Ciągłość rozmowy');
const tiny=document.createElement('span');tiny.className='ps621-label';tiny.textContent='CIĄGŁOŚĆ ROZMOWY';
const line=document.createElement('p');band.append(tiny,line);
const old=document.getElementById('ps620WitnessBeat');old?.insertAdjacentElement('afterend',band);
function render(){
 const id=STATE.activeChar;if(!old||!id||!STATE.dialogues?.[id]){band.hidden=true;return;}
 const a=analyze(id);
 band.hidden=!(a.long&&(a.returns.length||a.multi));if(band.hidden)return;
 const current=a.returns.slice(0,2).map(k=>topics.find(t=>t[0]===k)?.[2]).filter(Boolean);
 if(current.length)line.textContent='To kolejny powrót do tematu '+current.join(' oraz ')+'. Rozmówca pamięta kierunek rozmowy; wcześniejsze odpowiedzi nie stają się przez to nowymi dowodami.';
 else line.textContent='Pytanie łączy kilka tematów. Świadek powinien odnieść się do każdej części albo jasno określić, czego nie wie.';
}
const prior=typeof simRenderInterrogation==='function'?simRenderInterrogation:null;
if(prior)simRenderInterrogation=function(){const result=prior.apply(this,arguments);render();return result;};
registerNavigationHook({name:'long-interviews-621',after:render});
window.PS621_DIALOGUE=Object.freeze({analyze,render});
render();
})();
