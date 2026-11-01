/* RC40: a retrospective report ONLY. No verdict alterations or evidence unlocks. */
(()=>{
 'use strict';const host=document.getElementById('final');if(!host)return;
 const panel=document.createElement('section');panel.id='ps40Epilogue';panel.className='ps40-epilogue';panel.hidden=true;
 const head=document.createElement('h3');head.textContent='Finał 4.0 · konsekwencje śledztwa';
 const summary=document.createElement('p'),weakness=document.createElement('p'),files=document.createElement('p');
 const witnessList=document.createElement('ul');
 const report=document.createElement('button');report.type='button';report.className='btn alt';report.textContent='Pobierz podsumowanie śledztwa (.txt)';
 const note=document.createElement('small');note.textContent='Retrospekcja nie zmienia orzeczenia, dowodów ani odpowiedzi świadków.';
 panel.append(head,summary,weakness,files,witnessList,report,note);host.append(panel);
 const verdicts={
  solid:['Oskarżenie utrzymane','Materiał przeszedł dotychczasowe próby kontroli, lecz nie usuwa konsekwencji błędów proceduralnych z akt.'],
  weak:['Niewystarczające ustalenia','Luki nie są dowodem winy. Zapisane hipotezy zachowują status niezweryfikowanych.'],
  acquittal:['Brak utrzymania oskarżenia','Niedostateczne powiązanie osoby, mechanizmu i źródeł ogranicza konkluzję.'],
  returned:['Akta wymagają uzupełnienia','Wyjaśnienie brakujących ogniw jest ważniejsze niż przyspieszenie decyzji.'],
  excluded:['Uchybienia proceduralne','Nieskutecznie zebrany materiał nie może zastępować poprawnego dowodzenia.'],
  miscarriage:['Ryzyko błędnego oskarżenia','Pomijanie rozbieżności i dowodów odciążających może prowadzić do krzywdzących decyzji.']
 };
 function compute(){const trial=STATE?.sim?.trial||null;if(!trial)return null;
  const kind=typeof trial.kind==='string'?trial.kind:'weak';
  const [title,warning]=verdicts[kind]||verdicts.weak;
  const rows=CONTENT.characters.map(c=>({name:c.name||c.id,turns:Math.max(0,(STATE.dialogues[c.id]||[]).filter(r=>r.role==='player').length)}));
  return {kind,title,warning,docs:STATE.found.size,rows};
 }
 function render(){const s=compute();panel.hidden=!s;if(!s)return;
  summary.textContent='Wynik istniejącej symulacji: '+s.title+'. Finał nie stanowi orzeczenia prawdziwego sądu.';
  weakness.textContent='Wnioski i granice: '+s.warning;
  files.textContent='W lokalnych aktach znajduje się '+s.docs+' odkrytych dokumentów. Sama liczba źródeł nie przesądza o winie.';
  witnessList.replaceChildren();for(const row of s.rows){const li=document.createElement('li');li.textContent=row.name+': '+row.turns+' zadanych pytań. Wypowiedzi należy konfrontować z niezależnymi źródłami.';witnessList.append(li);}
 }
 report.addEventListener('click',()=>{const s=compute();if(!s)return;
  const text=['PRAWDZIWE ŚLEDZTWO — RAPORT RETROSPEKTYWNY RC40','Wynik symulacji: '+s.title,'Granice wniosku: '+s.warning,'Odkryte dokumenty: '+s.docs,
   ...s.rows.map(r=>r.name+': '+r.turns+' pytań'),'Hipotezy i notatki nie stanowią nowych faktów ani dowodów.','Materiał ma charakter fikcyjny.'].join('\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_Podsumowanie_RC40.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 registerNavigationHook({name:'rc40-epilogue-report',after:()=>{if(STATE.tab==='final')render();}});
 window.PS_RC40_FINALE=Object.freeze({snapshot:compute,render});render();
})();
