/* RC53 — evidence provenance: read-only classification of documents and witness statements.
 * No evidence IDs are added or exposed before discovery; no causal independence is inferred. */
(()=>{
 'use strict';
 if(typeof STATE==='undefined'||typeof CONTENT==='undefined'||typeof dedAvailable!=='function')return;
 const host=document.getElementById('notebook');if(!host)return;
 const panel=document.createElement('section');panel.id='ps53Provenance';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Wiarygodność źródeł 2.0 · pochodzenie';
 const intro=document.createElement('p');intro.textContent='Klasyfikacja informuje, skąd pochodzi zapis — nie rozstrzyga, czy jest prawdziwy. Dwa dokumenty z tego samego obiegu nie są niezależnymi potwierdzeniami.';
 const summary=document.createElement('p');summary.setAttribute('role','status');
 const filter=document.createElement('select');filter.setAttribute('aria-label','Typ źródła');
 [['all','Wszystkie dostępne źródła'],['doc','Odkryte dokumenty'],['say','Zeznania świadków']].forEach(([v,label])=>{const opt=document.createElement('option');opt.value=v;opt.textContent=label;filter.append(opt);});
 const search=document.createElement('input');search.type='search';search.placeholder='Znajdź źródło…';search.maxLength=75;search.setAttribute('aria-label','Szukaj źródła');
 const output=document.createElement('div');output.id='ps53ProvenanceList';panel.append(title,intro,summary,filter,search,output);
 host.append(panel);
 const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const norm=s=>String(s||'').slice(0,320);
 function inspect(){
  const sources=[...dedAvailable().values()];
  const families=new Map();
  for(const s of sources){const family=s.type==='doc'?'D:'+String(byId[s.docId]?.family||s.docId):'Z:'+String(s.charId||'');
   families.set(family,(families.get(family)||0)+1);}
  return sources.map(s=>{
   const family=s.type==='doc'?'D:'+String(byId[s.docId]?.family||s.docId):'Z:'+String(s.charId||'');
   return {key:s.key,type:s.type,label:s.label,category:s.type==='doc'?'Zapis dokumentowy':'Relacja świadka',family,
    otherFromFamily:Math.max(0,(families.get(family)||1)-1),
    caveat:s.type==='doc'?'Dokument potwierdza własną treść i zakres rejestracji; nie dowodzi automatycznie osoby, motywu ani przyczyny.':'Zapis potwierdza, że świadek to powiedział — nie potwierdza prawdziwości zdarzenia.'};
  });
 }
 function render(){if(STATE.tab!=='notebook')return;const rows=inspect();summary.textContent=`Dostępne: ${rows.filter(x=>x.type==='doc').length} dokumentów, ${rows.filter(x=>x.type==='say').length} wypowiedzi. Rodzina źródła ≠ liczba niezależnych potwierdzeń.`;
  output.replaceChildren();let displayed=0;const q=fold(search.value);
  for(const item of rows){if(filter.value!=='all'&&filter.value!==item.type)continue;if(q&&!fold(item.label).includes(q))continue;if(++displayed>24)break;
   const section=document.createElement('div');section.className='ps-next-row ps53-source';
   const desc=document.createElement('div');const top=document.createElement('strong');top.textContent=norm(item.label);const cap=document.createElement('p');cap.textContent=item.category+' · '+(item.otherFromFamily?`W tym samym obiegu / u tego świadka: ${item.otherFromFamily} innych zapisów.`:'Brak innych zapisów z tej rodziny.');const limit=document.createElement('small');limit.textContent=item.caveat;desc.append(top,cap,limit);
   const btn=document.createElement('button');btn.type='button';btn.className='btn subtle';btn.textContent='Otwórz źródło';btn.addEventListener('click',()=>{const source=dedAvailable().get(item.key);if(source)dedSourceOpen(source);});
   section.append(desc,btn);output.append(section);
  }
  if(!displayed){const p=document.createElement('p');p.textContent='Brak pasujących, odkrytych źródeł.';output.append(p);}
 }
 filter.addEventListener('change',render);search.addEventListener('input',render);
 registerNavigationHook({name:'rc53-provenance',after:render});
 window.PS_RC53=Object.freeze({inspect,render});render();
})();
