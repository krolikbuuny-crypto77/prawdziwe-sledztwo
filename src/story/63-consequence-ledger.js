/* Pakiet 6.4 — następstwa śledztwa.
 * Tylko ustalenia zweryfikowane przez PS69/PS85 oraz pytania naprawdę wysłane.
 * Dziennik nie przyznaje dowodów, nie zmienia emocji NPC, hipotez ani werdyktu.
 */
(function(){
 'use strict';
 if(!window.PS85_STORY||!window.PS69_STORY||!window.PS_WITNESS_ENGINE||typeof STATE==='undefined')return;
 const $=id=>document.getElementById(id);
 const persons=new Map(CONTENT.characters.map(c=>[c.id,c.name]));
 const threads=[
  {id:'work',title:'Nocna decyzja a stan wagonu',consequence:'Odpowiedzialność za ruch i dokumentację warsztatową trzeba ocenić oddzielnie. Jedna decyzja nie wyjaśnia tragedii Leny.',
   prompts:[['MAREK','Co wyjaśnia zestawienie dyspozycji kursu wagonu z dokumentacją warsztatu?'],['JANUSZ','Co wynika z różnicy między kartą warsztatu a decyzją o kursie wagonu?']]},
  {id:'warning',title:'Ostrzeżenie i formalny odbiór',consequence:'Ślad obawy nie oznacza formalnego przyjęcia zgłoszenia, a zatwierdzony odbiór nie rozstrzyga, kto znał ostrzeżenie.',
   prompts:[['ELZBIETA','Dlaczego zgłoszenie BHP i dokument odbioru pokazują różne informacje?'],['MAGDALENA','Jak wyjaśnisz rozbieżności między zgłoszeniem BHP a protokołem odbioru?']]},
  {id:'access',title:'Alibi z systemów elektronicznych',consequence:'Rejestr karty i sesja konta są śladami operacji, a nie fotografią osoby. Zgodność czasu nie potwierdza tożsamości.',
   prompts:[['KAMIL','Dlaczego karta T-17 i sesja audytu nie mogą potwierdzić alibi jednej osoby?'],['MAGDALENA','Co wynika z zestawienia karty dostępu i sesji audytu dla twojego alibi?']]},
  {id:'lastcontact',title:'Kolejność kursu i wiadomości',consequence:'Między dyspozycją a kontaktem z Leną zostaje luka, której nie wolno wypełniać domysłem o obecności.',
   prompts:[['TOMASZ','Czy powrót wagonu i późniejsza wiadomość do Leny mają wspólną chronologię?'],['MAREK','Jaki związek ma decyzja o powrocie kursu z późniejszą wiadomością Leny?']]},
  {id:'mechanism',title:'Kontakt a mechanizm obrażeń',consequence:'Rekonstrukcja urazów wymaga własnych źródeł. Ostatnia wiadomość nie identyfikuje osoby, która była przy Lenie.',
   prompts:[['ELZBIETA','Co wiadomo z ostatniej wiadomości Leny i analizy obrażeń, a czego nadal nie wiemy?'],['MAGDALENA','Czy ostatni kontakt z Leną i charakter obrażeń potwierdzają przebieg zdarzenia?']]},
  {id:'faultline',title:'Dwa obiegi, dwa zaniedbania',consequence:'Warsztat i procedury BHP wskazują możliwe odrębne zaniedbania. Ich suma nadal nie stanowi dowodu przemocy.',
   prompts:[['MAREK','Czy dyspozycja kursu i protokół warsztatu były znane mimo wcześniejszego zgłoszenia BHP?'],['ELZBIETA','Jak zgłoszenie BHP łączy się z warsztatem i zatwierdzeniem odbioru wagonu?']]},
  {id:'presence',title:'Alibi a ostatni kontakt',consequence:'Dwa zgodne zegary nie opisują automatycznie tej samej osoby. Potrzebna jest niezależna identyfikacja.',
   prompts:[['KAMIL','Czy karta T-17 i późniejsza wiadomość do Leny mogą ustalić czyjąś obecność?'],['MAGDALENA','Czy sesja audytu oraz późniejszy kontakt z Leną potwierdzają alibi?']]},
  {id:'boundary',title:'Granica rekonstrukcji',consequence:'Najbardziej spójna opowieść musi ustąpić granicom dokumentów i zeznań; kontakt nie jest dowodem sprawstwa.',
   prompts:[['MAGDALENA','Czy kolejność wiadomości do Leny i analiza obrażeń mogą ustalić odpowiedzialność za śmierć?'],['ELZBIETA','Co mówi ostatni kontakt z Leną i opinia o obrażeniach, a czego nie potwierdza?']]}
 ];
 const byId=new Map(threads.map(t=>[t.id,t]));
 const clean=s=>String(s||'').normalize('NFC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim().replace(/[?!.]+$/,'');
 function availability(){return new Set(window.PS85_STORY.available());}
 function spoken(id,question){
  const log=STATE.dialogues?.[id]||[];
  for(let i=0;i<log.length;i++){
   const msg=log[i];if(msg?.role!=='player')continue;
   const actual=String(msg.text||'').split('\n[Okazano:')[0];
   if(clean(actual)!==clean(question))continue;
   const reply=log[i+1];
   return {asked:true,answered:reply?.role==='npc'&&!!String(reply.text||'').trim()};
  }
  return {asked:false,answered:false};
 }
 const panel=document.createElement('section');
 panel.id='ps64Consequences';panel.className='surface padded ps64-panel';panel.hidden=true;
 panel.setAttribute('aria-label','Następstwa śledztwa');
 panel.innerHTML='<div class="ps64-title"><div><div class="eyebrow">PO ODKRYCIU</div><h3>Dziennik następstw</h3><p>Sprawdzaj, jak zmienia się znaczenie faktów po rozmowach z różnymi osobami. Zapis pytania nie oznacza potwierdzenia tezy.</p></div><strong id="ps64Count" aria-live="polite"></strong></div><div id="ps64Items" class="ps64-items"></div><details id="ps64More" hidden><summary>Pozostałe zweryfikowane wątki</summary><div id="ps64Rest" class="ps64-items"></div></details>';
 // Mount outside the collapsed advanced tools container; otherwise this panel stays invisible.
 const advanced=$('ux4Advanced');
 if(advanced)advanced.insertAdjacentElement('afterend',panel);else $('deduction')?.append(panel);
 const teaser=document.createElement('section');
 teaser.id='ps64Teaser';teaser.className='ps64-teaser';teaser.hidden=true;
 teaser.innerHTML='<div><strong id="ps64TeaserHeading">Następstwa śledztwa</strong><p id="ps64TeaserText"></p></div><button class="btn alt" type="button" id="ps64TeaserGo">Otwórz dziennik</button>';
 const pulse=$('ps85Pulse')||$('ps70Pulse');
 if(pulse)pulse.insertAdjacentElement('afterend',teaser);else $('overview')?.append(teaser);
 $('ps64TeaserGo').addEventListener('click',()=>{showTab('deduction');$('ps64Consequences')?.scrollIntoView({block:'start',behavior:'auto'});});
 function promptFor(id,who){const t=byId.get(id);return t?.prompts.find(([c])=>c===who)?.[1]||'';}
 function ask(id,who){
  const available=availability(),question=promptFor(id,who),field=$('chatInput');
  if(!available.has(id)||!persons.has(who)||!question||!field)return;
  if(field.value.trim()&&clean(field.value)!==clean(question)){
   showTab('interview');
   if(typeof toast==='function')toast('W polu jest już przygotowane pytanie. Wyślij je lub wyczyść przed wybraniem następnego.');
   field.focus();return;
  }
  STATE.activeChar=who;showTab('interview');
  window.PS_MOBILE_WORKSPACES?.setInterviewView('chat');
  field.value=question;renderChat();field.focus({preventScroll:true});
 }
 function makeCard(t){
  const row=document.createElement('article');row.className='ps64-item';
  const reached=t.prompts.map(([who,q])=>[who,spoken(who,q)]);
  const done=reached.filter(([,s])=>s.answered).length;
  const header=document.createElement('div');header.className='ps64-cardtop';
  const name=document.createElement('h4');name.textContent=t.title;
  const count=document.createElement('span');count.className='ps64-status';count.textContent=done===2?'Porównano dwie odpowiedzi':done===1?'Jedna rozmowa w aktach':'Dalsze pytania otwarte';
  header.append(name,count);
  const why=document.createElement('p');why.textContent=t.consequence;
  const actions=document.createElement('div');actions.className='ps64-actions';
  for(const [who,question] of t.prompts){
   const state=spoken(who,question);const button=document.createElement('button');button.className='btn alt';button.type='button';
   button.textContent=state.answered?`Ponów rozmowę: ${persons.get(who)}`:`Zapytaj: ${persons.get(who)}`;
   button.setAttribute('aria-label',button.textContent+'; pytanie zostanie przygotowane, nie wysłane');
   button.dataset.ps64Thread=t.id;button.dataset.ps64Witness=who;
   const status=document.createElement('small');status.className='ps64-route';status.textContent=state.answered?'Pytanie i odpowiedź zapisane':state.asked?'Pytanie zapisane, bez odpowiedzi':'Nie zadano proponowanego pytania';
   const wrap=document.createElement('div');wrap.append(button,status);actions.append(wrap);
  }
  const foot=document.createElement('p');foot.className='ps64-foot';
  foot.textContent=done===2?'Dwie odpowiedzi można teraz porównać w aktach. Ich zgodność nie stanowi samodzielnego dowodu.':done===1?'Po jednej rozmowie pozostaje druga perspektywa. Oceniaj zeznania w granicach dostępnych źródeł.':'Wybór jedynie przygotuje pytanie w przesłuchaniu. Każdą odpowiedź ocenisz samodzielnie.';
  row.append(header,why,actions,foot);return row;
 }
 function render(){
  const open=availability(),known=threads.filter(x=>open.has(x.id));
  panel.hidden=!known.length;teaser.hidden=!known.length;
  if(!known.length)return;
  let asked=0,total=0;
  for(const t of known)for(const [who,q] of t.prompts){total++;if(spoken(who,q).answered)asked++;}
  $('ps64Count').textContent=asked+' / '+total+' odpowiedzi';
  $('ps64TeaserHeading').textContent=known.length===1?'Pojawiło się nowe następstwo':'Następstwa zweryfikowanych odkryć';
  $('ps64TeaserText').textContent=`${known.length} ${known.length===1?'wątek jest dostępny':'wątków jest dostępnych'}, ${asked} z ${total} proponowanych rozmów zapisano. Dziennik nie zastępuje oceny dowodów.`;
  const primary=$('ps64Items'),rest=$('ps64Rest');primary.replaceChildren();rest.replaceChildren();
  // Unasked angles rise to the top. Already examined cases remain reachable without scrolling through them first.
  const sorted=known.slice().sort((a,b)=>{
   const aDone=a.prompts.filter(([who,q])=>spoken(who,q).answered).length;
   const bDone=b.prompts.filter(([who,q])=>spoken(who,q).answered).length;
   return aDone-bDone||threads.indexOf(a)-threads.indexOf(b);
  });
  for(const [index,t] of sorted.entries())(index<2?primary:rest).append(makeCard(t));
  $('ps64More').hidden=sorted.length<=2;
 }
 panel.addEventListener('click',event=>{
  const b=event.target.closest('button[data-ps64-thread][data-ps64-witness]');
  if(!b)return;ask(b.dataset.ps64Thread,b.dataset.ps64Witness);
 });
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 registerNavigationHook({name:'package-64-consequences',after:schedule});
 for(const type of ['evidenceCollected','hypothesisEvaluated','witnessBreakthrough','caseCompleted']){
  PS_EVENTS.on(type,'package-64-'+type,schedule);
 }
 const send=WitnessEngine.snapshotSend();
 registerWitnessSendLayer('package-64-consequence-journal',function(){const result=send.apply(this,arguments);schedule();return result;});
 // Derived from already-persisted sources and chat transcripts; no extra mutable or migratable save structure.
 registerSaveHook({name:'package-64-consequences-save-cycle',apply:schedule});
 window.PS64_CONSEQUENCES=Object.freeze({available:()=>threads.filter(t=>availability().has(t.id)).map(t=>t.id),
  status:id=>{const t=byId.get(id);if(!t||!availability().has(id))return null;return t.prompts.map(([who,q])=>({witness:who,...spoken(who,q)}));},
  prompt:promptFor,render,prepare:ask});
 render();
})();
