
/* Dziennik: ostrożne, wyjaśnialne flagowanie. Mikro-feedback: tylko potwierdzone sukcesy.
   Brak wywołań sieci; nie przyznaje dowodów, nie zmienia zaliczeń ani fabuły. */
(function(){
 'use strict';
 if(typeof STATE==='undefined'||typeof TL_EVENTS==='undefined'||typeof tlAssessment!=='function')return;
 const by=id=>document.getElementById(id);
 const plain=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const qs=(id)=>by(id);
 const seen=x=>STATE.found.has(x);
 const labelDoc=id=>byId[id]?.title||'Materiał w aktach';
 const P='psLoopFeedbackEnabled';
 let on=true;try{on=localStorage.getItem(P)!=='0';}catch(_){}
 let filter='all',reveal=true,refreshQueued=false,hideTimer=0,ctx=null;
 const MAX=14;
 function hasCaution(t){return /(?:nie dowodz|nie potwierdz|nie oznacz|nie przesadz|nie mozna|nie jest pew|bez dowod|tylko|nie wynika|nie wiadomo|hipotez|mozl|nie rozstrzyg|nie mam pewnosci|brak podstaw)/.test(plain(t));}
 function flags(){
  const out=[]; const add=x=>{if(!out.some(y=>y.id===x.id))out.push(x);};
  // Chronologia: działamy wyłącznie na zdarzeniach odblokowanych zdobytymi źródłami.
  for(const e of TL_EVENTS){
   const entry=STATE.timeline11?.entries?.[e.id];
   if(!entry?.at||!e.sources?.some(seen))continue;
   const r=tlAssessment(e,entry);
   if(r.state==='ok'||r.state==='unplaced')continue;
   const reasons=[...(r.bad||[]),...(r.warn||[])];
   const relevant=reasons.filter(t=>/czas|godzin|przedział|źródł|zgodn|lokali|miejsce|osob|przypis|znaczn|zakres|chronolog|zapis|godz/i.test(t));
   if(!relevant.length)continue;
   const available=e.sources.filter(seen);
   add({id:'tl:'+e.id,grade:r.bad?.length?'verified':'review',type:'timeline',
    title:'Sprawdź ustalenie: '+e.title,
    detail:relevant[0], docs:available,action:'timeline',event:e.id, noteId:null});
  }
  // Użytkownik sam oznaczył podejrzenie: nigdy nie potwierdzamy go automatycznie.
  const notes=STATE.scene12?.notes||[];
  for(const n of notes.slice(0,120)){
   const t=String(n.text||'');if(n.kind!=='contradiction')continue;
   const spot=SC_BY_SPOT[n.ref],docs=(spot?.doc&&seen(spot.doc))?[spot.doc]:[];
   add({id:'note:'+n.id,grade:'review',type:'note',noteId:n.id,
    title:'Możliwa sprzeczność w notatce #'+n.id,
    detail:t.slice(0,240),docs,action:'inspection12',event:null,spot:n.ref});
  }
  // Językowe reguły wysokiej pewności: wymagają konkretnych, posiadanych materiałów.
  // Same wypowiedzi NIE stanowią automatycznego dowodu winy ani obecności osoby.
  const statements=[{id:'free',text:STATE.notes||'',where:'Luźne zapiski'}];
  for(const n of notes.slice(0,120))statements.push({id:'n'+n.id,text:n.text||'',where:'Notatka #'+n.id,noteId:n.id});
  for(const [person,dialogue] of Object.entries(STATE.dialogues||{})){
   (dialogue||[]).filter(m=>m.role==='npc').slice(-55).forEach((m,i)=>statements.push({id:person+':'+i,text:m.text||'',where:CONTENT.characters.find(c=>c.id===person)?.name||'Świadek',person}));
  }
  for(const s of statements){
   const t=plain(s.text), caution=hasCaution(s.text);
   // Negacja zdarzenia wprost vs. pozytywny zapis administracyjny.
   // Nie utożsamiamy użycia karty z tożsamością użytkownika.
   if(seen('EVID_T17_DOOR_EVENT')&&/(t.?17|karta)/.test(t)&&/(nie bylo zadnego|nie odnotowano|brak odczytu|nikt nie uzy|nigdy nie uzy)/.test(t)&&/(odczyt|karta|uzy|drzw)/.test(t)){
    add({id:'gate:denial:'+s.id,grade:'verified',type:'witness',person:s.person,noteId:s.noteId,
     title:'Deklaracja o braku użycia karty a rejestr',
     detail:'Wypowiedź kwestionuje istnienie odczytu, który jest zapisany w zdobytej dokumentacji. Potwierdza to zdarzenie przy czytniku, lecz nie identyfikuje człowieka.',docs:['EVID_T17_DOOR_EVENT'],action:'interview'});
   }
   if(seen('EVID_RAW_ENTRY_TIMES')&&/(nie bylo zadnego wejsc|nikt nie wchodzil|brak jakichkolwiek wejsc)/.test(t)){
    add({id:'gate:entries:'+s.id,grade:'review',type:'witness',person:s.person,noteId:s.noteId,
     title:'Oświadczenie o ruchu na bramie a rejestr',
     detail:'Wypowiedź o całkowitym braku wejść wymaga porównania z posiadanym rejestrem. Rejestr może być niepełny i sam nie ustala tożsamości osoby.',docs:['EVID_RAW_ENTRY_TIMES'],action:'interview'});
   }
   if(seen('LAB-08')&&seen('MED-04')&&/(wszystkie|kazde|calosc)/.test(t)&&/(obrazen|uraz)/.test(t)&&/(jeden|jednego|wylacznie)/.test(t)&&/(upad|uderzen|mechanizm)/.test(t)&&!caution){
    add({id:'lab:mechanism:'+s.id,grade:'review',type:'claim',person:s.person,noteId:s.noteId,
     title:'Uogólnienie mechanizmu obrażeń a opinie biegłych',
     detail:'Sprawdź, czy kategoryczne przypisanie wszystkich urazów jednej przyczynie odpowiada zakresowi dwóch zdobytych opinii medyczno-sądowych.',docs:['MED-04','LAB-08'],action:'deduction'});
   }
   if(caution)continue;
   if(seen('TEC-14')&&seen('MED-03')&&/(czujnik|impuls|sygnal)/.test(t)&&/01:44/.test(t)&&/(zgon|smierc|umar|zabila)/.test(t)&&/(dokladnie|na pewno|dowodzi|pewn|bezsporn|moment)/.test(t)){
    add({id:'logic:sensor:'+s.id,grade:'verified',type:'claim',noteId:s.noteId,
     title:'Sygnał urządzenia a moment zgonu',
     detail:'W tej wypowiedzi znacznik czujnika został potraktowany jak jednoznaczny czas śmierci. Porównaj ograniczenia dwóch niezależnych źródeł.',docs:['TEC-14','MED-03'],person:s.person,action:'deduction'});
   }
   if(seen('EVID_T17_DOOR_EVENT')&&/(t.?17|karta|czytnik)/.test(t)&&/(log|odczyt|karta|czytnik)/.test(t)&&/(kto|osob|obecn|identyfik)/.test(t)&&/(na pewno|jednoznacznie|dowodzi|potwierdza|pewne)/.test(t)){
    add({id:'logic:card:'+s.id,grade:'review',type:'claim',noteId:s.noteId,
     title:'Odczyt karty a tożsamość osoby',
     detail:'Rejestruje się użycie identyfikatora, ale sam zapis nie rozstrzyga, kto fizycznie był przy drzwiach. Zweryfikuj osobę w innym źródle.',docs:['EVID_T17_DOOR_EVENT'],person:s.person,action:'deduction'});
   }
   if(seen('EVID_CONFERENCE_SESSION')&&/(wideokonferenc|sesj|transmisj|polaczen)/.test(t)&&/(alibi|fizycz|obecn|caly czas|przez caly czas)/.test(t)&&/(dowodzi|potwierdza|na pewno|jednoznacznie|bez przerwy)/.test(t)){
    add({id:'logic:session:'+s.id,grade:'review',type:'claim',noteId:s.noteId,
     title:'Aktywna sesja a fizyczna obecność',
     detail:'Techniczny zapis połączenia nie musi dowodzić ciągłej obecności uczestnika. Sprawdź tę granicę interpretacji.',docs:['EVID_CONFERENCE_SESSION'],person:s.person,action:'deduction'});
   }
  }
  // Ściśle określone rozbieżności w godzinie zgłoszenia, tylko gdy istnieje właściwy log.
  if(seen('DIG-10')){
   const d=STATE.dialogues?.TOMASZ||[];
   d.filter(m=>m.role==='npc').slice(-80).forEach((m,i)=>{
    const t=plain(m.text);const hit=/(?:zglosilem|zgloszono|zglosilismy|alarm (?:zostal|byl) zgloszon)[^.!?\n]{0,75}?\b(?:o\s*)?([012]?\d:[0-5]\d)\b/.exec(t);
    if(!hit)return;
    const time=hit[1].padStart(5,'0');if(time==='02:02'||hasCaution(m.text))return;
    add({id:'witness:alarm:'+i,grade:'verified',type:'witness',person:'TOMASZ',
     title:'Godzina zgłoszenia alarmu — zeznanie i rejestr',
     detail:'Wypowiedź zawiera godzinę alarmu różną od odczytu w zdobytym rejestrze. Porównaj oba zapisy, zanim postawisz zarzut.',docs:['DIG-10'],action:'interview'});
   });
  }
  return out.slice(0,MAX);
 }
 let current=[];
 function jump(tab,f){if(typeof showTab==='function')showTab(tab);if(f)setTimeout(f,90);}
 function goto(item,mode){
  if(mode==='interview' && item.person){jump('interview',()=>{STATE.activeChar=item.person;renderChat();const doc=(item.docs||[]).find(seen);const attach=by('attachedDoc');if(doc&&attach&&[...attach.options].some(x=>x.value===doc))attach.value=doc;if(by('chatInput')){by('chatInput').value='Wcześniej przedstawiono inną wersję wydarzeń. Jak wyjaśnić tę rozbieżność w kontekście materiału „'+(doc?labelDoc(doc):'zapisanych ustaleń')+'”?';by('chatInput').focus();}});return;}
  if(mode==='source'&&item.docs?.length){const id=item.docs.find(seen);if(!id)return;jump('evidence',()=>{try{activeDoc=id;renderDocs();by('docPaper')?.scrollIntoView({block:'start',behavior:'smooth'});}catch(_){}});return;}
  if(mode==='timeline'){jump('timeline',()=>{if(item.event&&TL_MAP.has(item.event)){STATE.timeline11.selected=item.event;tlRender();by('tlEditor')?.scrollIntoView({block:'start',behavior:'smooth'});}});return;}
  if(mode==='inspection12'){jump('inspection12',()=>{if(item.spot&&SC_BY_SPOT[item.spot]){STATE.scene12.room=SC_BY_SPOT[item.spot].room;STATE.scene12.selected=item.spot;scRender();}});return;}
  jump('deduction',()=>by('threadBoardPanel')?.scrollIntoView({block:'start',behavior:'smooth'}));
 }
 function buildPanel(){const nb=by('notebook');if(!nb||by('conflictPanel'))return;
  const box=document.createElement('section');box.id='conflictPanel';box.setAttribute('aria-label','Punkty konfrontacji');
  box.innerHTML='<div class="cf-head"><div><div class="cf-kicker">ANALIZA DZIENNIKA</div><h3>Punkty konfrontacji</h3></div><span class="cf-count" id="cfCount">0 sygnałów</span></div><p class="cf-intro">Wskazówki do sprawdzenia: możliwe rozbieżności czasowe, ograniczenia źródeł i własne podejrzenia. Zaznaczenie nie rozstrzyga, kto mówi prawdę. Używa tylko zdobytych akt i zapisanych zeznań.</p><div class="cf-actions"><button type="button" class="cf-toggle" id="cfToggle" aria-expanded="true">Zwiń analizę</button><button type="button" class="cf-toggle" id="cfRefresh">Sprawdź ponownie</button></div><div id="cfBody"><div class="cf-filters" role="group" aria-label="Rodzaj punktów"><button type="button" data-cff="all" aria-pressed="true">Wszystkie</button><button type="button" data-cff="verified" aria-pressed="false">Rozbieżności źródeł</button><button type="button" data-cff="review" aria-pressed="false">Do sprawdzenia</button></div><div class="cf-list" id="cfList" aria-live="polite"></div></div>';
  const heading=nb.querySelector('.sectionheading');if(heading)heading.after(box);else nb.prepend(box);
  by('cfToggle').addEventListener('click',()=>{reveal=!reveal;by('cfBody').hidden=!reveal;by('cfToggle').textContent=reveal?'Zwiń analizę':'Rozwiń analizę';by('cfToggle').setAttribute('aria-expanded',String(reveal));});
  by('cfRefresh').addEventListener('click',refresh);
  box.querySelector('.cf-filters').addEventListener('click',e=>{const b=e.target.closest('[data-cff]');if(!b)return;filter=b.dataset.cff;box.querySelectorAll('[data-cff]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));renderList();});
  by('cfList').addEventListener('click',e=>{const b=e.target.closest('button[data-cf-id]');if(!b)return;const item=current.find(x=>x.id===b.dataset.cfId);if(item)goto(item,b.dataset.cfMode);});
 }
 function highlightNotes(){const list=by('scNotebookList');if(!list)return;list.querySelectorAll('.cf-note-flag').forEach(e=>e.remove());
  const ids=new Set(current.filter(x=>x.noteId!=null).map(x=>String(x.noteId)));
  list.querySelectorAll('[data-sc-edit]').forEach(btn=>{const id=btn.dataset.scEdit;if(!ids.has(id))return;const card=btn.closest('.sc-note');if(!card||card.querySelector('.cf-note-flag'))return;const chip=document.createElement('span');chip.className='cf-note-flag';chip.textContent='Punkt konfrontacji · do weryfikacji';card.querySelector('.sc-note-top')?.after(chip);});
 }
 function renderList(){const box=by('cfList');if(!box)return;
  const arr=current.filter(x=>filter==='all'||x.grade===filter);
  box.replaceChildren();if(!arr.length){const e=document.createElement('p');e.className='cf-empty';e.textContent=current.length?'Brak punktów w wybranej kategorii.':'Nie wykryto rozbieżności w aktualnych materiałach. To nie oznacza, że wszystkie zeznania są zgodne — sprawdzaj także własne hipotezy.';box.append(e);return;}
  for(const item of arr){const card=document.createElement('article');card.className='cf-entry cf-'+item.grade;
   const top=document.createElement('div');top.className='cf-meta';top.textContent=item.grade==='verified'?'PORÓWNAJ ZE ŹRÓDŁEM':'WYMAGA WERYFIKACJI';card.append(top);
   const h=document.createElement('h4');h.textContent=item.title;card.append(h);
   const p=document.createElement('p');p.textContent=item.detail;card.append(p);
   if(item.docs?.length){const s=document.createElement('div');s.className='cf-sources';s.textContent='Powiązane akta: '+item.docs.filter(seen).map(labelDoc).join(' · ');card.append(s);}
   const actions=document.createElement('div');actions.className='cf-links';
   const add=(text,mode)=>{const b=document.createElement('button');b.type='button';b.dataset.cfId=item.id;b.dataset.cfMode=mode;b.textContent=text;actions.append(b);};
   if(item.type==='timeline')add('Sprawdź na osi','timeline');
   if(item.type==='note')add(item.spot?'Wróć do punktu':'Oględziny','inspection12');
   if(item.person)add('Przygotuj konfrontację','interview');
   if(item.docs?.some(seen))add('Zobacz akta','source');
   add('Tablica dedukcyjna','deduction');card.append(actions);box.append(card);
  }
 }
 function refresh(){buildPanel();current=flags();by('cfCount')&&(by('cfCount').textContent=current.length+' '+(current.length===1?'sygnał':'sygnałów'));renderList();highlightNotes();}
 function queue(){if(refreshQueued)return;refreshQueued=true;setTimeout(()=>{refreshQueued=false;try{refresh();}catch(e){console.warn('[Dziennik] Aktualizacja niedostępna',e);}},120);}
 // Obserwujemy tylko zakończone operacje. Nie dotykamy stanu dowodów i nie kopiujemy treści nieodkrytych akt.
 function hook(name,after){const old=window[name];if(typeof old!=='function')return;
  window[name]=function(){let before;try{before=after.snapshot?.();}catch(_){}const value=old.apply(this,arguments);try{after(before,arguments);}catch(e){console.warn('[Gameplay loop]',name,e);}return value;};
 }
 const prefKey='psLoopVisualFeedback';let visual=true;let lastEffectKey='',lastEffectAt=0;try{visual=localStorage.getItem(prefKey)!=='0';}catch(_){}
 const prefersReduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function makeSettings(){const menu=by('ps80Settings');if(!menu||by('psmfVisual'))return;
   const lab=document.createElement('label');lab.className='ps80-checkrow';lab.htmlFor='psmfVisual';
   const input=document.createElement('input');input.id='psmfVisual';input.type='checkbox';input.checked=visual;lab.append(input,document.createTextNode(' Animacje potwierdzeń i postępu'));menu.append(lab);
   input.addEventListener('change',()=>{visual=input.checked;try{localStorage.setItem(prefKey,visual?'1':'0');}catch(_){}});
 }
 function feedbackBox(){if(by('psMicroFeedback'))return;const el=document.createElement('div');el.id='psMicroFeedback';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<span class="psmf-seal" aria-hidden="true">OK</span><div><strong></strong><small></small></div>';document.body.append(el);}
 function chime(){if(!by('ps80Effects')?.checked)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ctx)ctx=new A();if(ctx.state==='suspended')return;
  const now=ctx.currentTime;[620,780].forEach((f,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(f,now+i*.085);gain.gain.setValueAtTime(.0001,now+i*.085);gain.gain.exponentialRampToValueAtTime(.018,now+i*.085+.016);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.085+.17);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+i*.085);osc.stop(now+i*.085+.18);});}catch(_){}
 }
 function celebrate(title,detail,kind){if(!visual)return;const key=title+'|'+detail;const now=Date.now();if(lastEffectKey===key&&now-lastEffectAt<2600)return;lastEffectKey=key;lastEffectAt=now;feedbackBox();const el=by('psMicroFeedback');clearTimeout(hideTimer);el.querySelector('strong').textContent=title;el.querySelector('small').textContent=detail;el.hidden=false;el.classList.remove('psmf-on');void el.offsetWidth;el.classList.add('psmf-on');
  if(kind==='timeline'&&!prefersReduce()){const chart=by('tlChart');chart?.classList.remove('psmf-timeline-flash');void chart?.offsetWidth;chart?.classList.add('psmf-timeline-flash');}
  chime();hideTimer=setTimeout(()=>{el.classList.remove('psmf-on');setTimeout(()=>{if(!el.classList.contains('psmf-on'))el.hidden=true;},270);},1900);
 }
 const solved=()=>[!!STATE.tcms?.solved,!!STATE.msg?.solved,!!STATE.cctv?.solved,!!STATE.forensic?.solved,!!STATE.access?.solved];
 const reportNames=['TCMS','Korespondencja','Monitoring','Mikroślady','Analiza dostępu'];
 // Obserwacja prawdziwych ZMIAN STANU po standardowym komunikacie gry.
 // Wykorzystujemy istniejące potwierdzenia, zamiast podpinać się pod stare listenery przycisków.
 const verifiedTimeline=new Set(),verifiedCards=new Set();let knownReports=[];
 function snapshotMilestones(){
  knownReports=solved();verifiedTimeline.clear();verifiedCards.clear();
  for(const e of TL_EVENTS){const x=STATE.timeline11?.entries?.[e.id];if(x?.at&&e.sources.some(seen)&&tlAssessment(e,x).state==='ok')verifiedTimeline.add(e.id);}
  for(const c of STATE.deduction?.cards||[]){try{if(dd7Reasoning(c).ok)verifiedCards.add(c.id);}catch(_){}}
 }
 function checkMilestones(){
  const currentReports=solved();
  for(let i=0;i<currentReports.length;i++){
   if(currentReports[i]&&!knownReports[i])celebrate('ZWERYFIKOWANO','Raport '+reportNames[i]+' został przyjęty do akt.');
  }
  knownReports=currentReports;
  for(const e of TL_EVENTS){const x=STATE.timeline11?.entries?.[e.id];if(!x?.at||!e.sources.some(seen))continue;
   if(tlAssessment(e,x).state==='ok'&&!verifiedTimeline.has(e.id)){
    verifiedTimeline.add(e.id);celebrate('ZAPIS POTWIERDZONY','Zdarzenie uzyskało spójną chronologię.','timeline');
   }
  }
  for(const c of STATE.deduction?.cards||[]){let ok=false;try{ok=!!dd7Reasoning(c).ok;}catch(_){}
   if(ok&&!verifiedCards.has(c.id)){verifiedCards.add(c.id);celebrate('WNIOSEK ZAPISANY','Argumentacja została powiązana ze źródłami.');}
  }
 }
 snapshotMilestones();
 if(typeof toast==='function'){
  const originalToast=toast;
  toast=function(){const result=originalToast.apply(this,arguments);checkMilestones();queue();return result;};
 }
 hook('scRenderNotebook',()=>queue());hook('renderChat',()=>queue());hook('showTab',()=>queue());
 by('notes')?.addEventListener('input',queue);
 hook('applySave',()=>{snapshotMilestones();queue();});hook('simReset',()=>{snapshotMilestones();queue();});hook('scSecure',()=>queue());
 makeSettings();buildPanel();queue();
})();

