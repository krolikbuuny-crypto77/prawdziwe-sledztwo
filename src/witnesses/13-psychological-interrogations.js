/* Prawdziwe Śledztwo — etap 5.2.
   Psychologiczne przesłuchania na faktach NPC9. Nie tworzy dowodów ani przyznań do winy.
   Korekty wypowiedzi wymagają pełnego, niezależnego łańcucha rzeczywiście zdobytych źródeł. */
const PS52_THREADS = Object.freeze({
 MN_PAYROLL:{title:'Ewidencja obecności',tokens:/ewidenc|grafik|godzin|rozlicz|płac|korekt|obecno|wpisów/i,
   partial:'Tabelę obecności trzeba porównać z zapisem wejść. Nie będę potwierdzał na tej podstawie czyjejś obecności w konkretnym miejscu.',
   reveal:'Tak, zestawienie zawiera ręczne korekty. Wcześniej przedstawiłem je zbyt prosto. Przyjmuję, że trzeba oddzielić rozliczenie zmiany od rzeczywistych przejść.'},
 TK_RADIO:{title:'Dyspozycja i korespondencja radiowa',tokens:/radio|łączno|dyspozycj|nagran|powrot|przekier|TW.217|polecen/i,
   partial:'Mogę mówić o dyspozycji ruchowej. Brak fragmentu nagrania trzeba wyjaśnić osobno, nie przez domysły na temat Leny.',
   reveal:'Powrót TW-217 nie przebiegł standardowo. Zmieniłem dyspozycję, a w korespondencji jest luka, której wcześniej nie wyjaśniłem. To nie znaczy, że wysłałem Lenie wiadomość.'},
 JW_SERVICE:{title:'Dokumentacja przeglądu',tokens:/serwis|warsztat|przegl|protok|zleceni|test|napraw|podzesp|częśc/i,
   partial:'W warsztacie dokument i wykonana praca to nie zawsze to samo. Trzeba sięgnąć do zlecenia i autoryzacji testu.',
   reveal:'Nie powinienem był nazywać tej karty kompletną. Części pozycji nie ujęto, a zlecenie i autoryzacja wymagają zestawienia. O przemocy wobec Leny niczego z tego nie wiem.'},
 EZ_HAZARD:{title:'Zgłoszenie zagrożenia',tokens:/bhp|zgłosz|zagroż|raport|wysł|niewysł|bezpiecz|procedur/i,
   partial:'Projekt zgłoszenia i potwierdzenie jego doręczenia to dwa różne dokumenty. Muszę je od siebie oddzielić.',
   reveal:'Tak, to zgłoszenie pozostało projektem i nie trafiło formalnym kanałem. Wcześniej uogólniłam, mówiąc, że wszystkie sygnały zostały przekazane prawidłowo. Nie byłam świadkiem zdarzenia.'},
 KB_CARD:{title:'Karta dostępu T-17',tokens:/kart|t.17|przekaz|dostęp|czytnik|wejś|drzwi|uprawnien/i,
   partial:'Odczyt karty nie mówi sam w sobie, kto ją fizycznie trzymał. W tej sprawie istnieje zapis przekazania.',
   reveal:'Przekazałem kartę T-17 Magdalenie o 00:39. Powiedziałem zbyt dużo, nazywając ją stale będącą pod moją kontrolą. Zdarzenia czytnika nie są fotografią osoby.'},
 KB_TEST:{title:'Test diagnostyczny TW-217',tokens:/tcms|test|diagnost|alarm|sesj|autoryzac|wag(on|onu)|log/i,
   partial:'Proszę nie mieszać diagnostycznego alarmu z mechanizmem obrażeń. Trzeba sprawdzić zapis sesji i uprawnienie do testu.',
   reveal:'Test diagnostyczny miał określoną autoryzację. Mogę wskazać, do czego odnosi się zapis TCMS, lecz sam log nie opisuje sposobu śmierci Leny.'},
 MK_SESSION:{title:'Alibi transmisji audytowej',tokens:/alibi|transmis|konferenc|sesj|01.30|02.00|pokoju|audyt|kamer|obecno/i,
   partial:'Sesja systemowa potwierdza aktywność konta, nie nieprzerwaną obecność osoby. Proszę przedstawić niezależną chronologię.',
   reveal:'Nie mogę już utrzymywać, że aktywna transmisja dowodzi, iż przez cały ten czas byłam fizycznie w pokoju. Rozróżnijmy połączenie, zapis przejścia i to, co widać na kamerach.'},
 MK_INVITATION:{title:'Kontakt z Leną',tokens:/sms|wiadomo|spotkan|telefon|nadawc|korespondenc|len|zaproszen/i,
   partial:'Treść wiadomości należy zestawić z metadanymi urządzenia. Sama wiadomość nie mówi jeszcze, z jakim zamiarem ktoś działał.',
   reveal:'Te materiały nie pozwalają mi dalej kategorycznie wykluczać kontaktu z Leną. Zgadzam się, że wymaga on wyjaśnienia. Proszę jednak nie utożsamiać wiadomości z dowodem zamiaru przemocy.'},
 MK_ACCEPTANCE:{title:'Odbiór podzespołu L-2/L-3',tokens:/odbior|protok|podzesp|l.2|l.3|oznaczen|zgodn|numer.*ser/i,
   partial:'Oznaczenie na części i zapis w protokole muszą się zgadzać. Proszę porównać oryginalne materiały.',
   reveal:'Między udokumentowanym odbiorem a oznaczeniem fizycznej części jest rozbieżność. Nie powinnam była twierdzić, że dokumentacja jednoznacznie potwierdza stan podzespołu.'}
});
const PS52_PROFILE = {
 MAREK:{threshold:83,sensitivity:1.05,uncertainty:'Dla mnie kluczowa jest różnica między rozliczeniem zmiany a obecnością fizyczną.'},
 TOMASZ:{threshold:86,sensitivity:.94,uncertainty:'Muszę oddzielić dyspozycję z konsoli od odtworzenia tamtej nocy.'},
 JANUSZ:{threshold:88,sensitivity:1.10,uncertainty:'Bez zlecenia i protokołu nie będę niczego dopowiadał.'},
 ELZBIETA:{threshold:84,sensitivity:.90,uncertainty:'Proszę zapisać dokładnie, co pamiętam, a czego nie jestem w stanie poświadczyć.'},
 KAMIL:{threshold:84,sensitivity:1.15,uncertainty:'To jest zapis techniczny; niech go pan nie zmienia w oskarżenie bez podstaw.'},
 MAGDALENA:{threshold:80,sensitivity:1.23,uncertainty:'Proszę przedstawić źródło i określić, do jakiego twierdzenia się odnosi.'}
};
function ps52Fresh(){return {witnesses:{},violations:[],history:[],version:2};}
STATE.sim.psych52=ps52Fresh();
function ps52Witness(c){const store=(STATE.sim.psych52||=ps52Fresh()).witnesses;
 return store[c.id]||(store[c.id]={tactic:'free',issues:{},questions:0,invalid:0,recess:0});}
function ps52Issue(c,id){const w=ps52Witness(c);return w.issues[id]||(w.issues[id]={baseline:'',seen:[],resolved:false,conflict:false,candidates:0,lastReaction:''});}
function ps52EvidenceValid(id){
 if(!STATE.found.has(id)||STATE.sim.auditJudgments?.[id]?.status==='overclaim')return false;
 // A red herring may still corroborate a narrow procedural fact (e.g. payroll edits),
 // but never becomes evidence of guilt in the graph: simQuality remains unchanged.
 if(SIM_NOISE.has(id))return sim51Audited(id)&&STATE.sim.auditJudgments?.[id]?.status==='accepted';
 return simQuality(id)>=.8;
}
function ps52Independence(ids,count){return new Set(ids.map(id=>byId[id]?.family||id)).size>=count;}
function ps52Threads(c){return (NPC9_PROFILES[c.id]?.confrontations||[]).filter(x=>PS52_THREADS[x.id]);}
function ps52SelectThreads(c,q,attached){const threads=ps52Threads(c);
 if(attached){const words=norm(q);const evidenceMatched=threads.filter(t=>t.evidence.includes(attached)&&(PS52_THREADS[t.id].tokens.test(words)||/wyjas|sprzeczn|dokum|zapis|skad|potwierdz|co z tym|co wynika|jak pan|jak pani|jak to|wobec tego|odnies|przyznaj|czytnik|przejsc|bramk|kart|rejestr|autoryzac|test|log|numer|protok|rozbiezn|czas|godzin|obecn|metadane/.test(words)));if(evidenceMatched.length)return evidenceMatched;}
 return threads.filter(t=>PS52_THREADS[t.id].tokens.test(norm(q)));
}
function ps52StateRecord(c,type,summary,issue=''){
 const st=STATE.sim.psych52;st.history.push({id:c.id,type,issue,summary:String(summary).slice(0,200)});if(st.history.length>100)st.history.shift();
}
function ps52Violation(c,type,issue){const s=STATE.sim.psych52;s.violations.push({id:c.id,type,issue});if(s.violations.length>70)s.violations.shift();ps52Witness(c).invalid++;ps52StateRecord(c,'risk',type,issue);}
function ps52ReplyStyle(c,text){const st=NPC4_STATE[c.id];if(st.tension>=68)return text;
 // Keep every substantive claim; only add natural transition after composed responses.
 return text;
}
function ps52Pause(){const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);if(!c)return;
 const w=simWitness(c),psych=ps52Witness(c),st=NPC4_STATE[c.id];if(STATE.sim.time<3)return toast('Brakuje czasu na przerwę.');
 simTime(3,0,'Przerwa proceduralna: '+c.name);psych.recess++;
 st.tension=npc4Clamp(st.tension-(w.blocked?29:18));st.fatigue=npc4Clamp(st.fatigue-12);
 st.rapport=npc4Clamp(st.rapport+(psych.recess===1?6:psych.recess===2?3:0));
 w.blocked=false;STATE.dialogues[c.id].push({role:'npc',text:psych.recess===1?'Możemy wrócić do rzeczowych pytań. Proszę oddzielać ustalenia od sugestii.':'Kontynuujmy, ale proszę nie ponawiać tych samych zarzutów bez nowych podstaw.'});
 ps52StateRecord(c,'break','Przerwa proceduralna');renderChat();
}
function ps52Reaction(c,t,iss,attached,excess){const p=PS52_THREADS[t.id],st=NPC4_STATE[c.id],need=t.evidence;
 if(attached&&need.includes(attached)&&ps52EvidenceValid(attached)&&!iss.seen.includes(attached))iss.seen.push(attached);
 const valid=need.filter(id=>iss.seen.includes(id)&&ps52EvidenceValid(id));
 const independent=ps52Independence(valid,t.min_independent_families||2);
 if(iss.resolved)return '';
 if(valid.length===need.length&&independent){
  if(st.tension>=90 || st.rapport<15){iss.lastReaction='deferred';return 'W tych warunkach nie podejmę się kolejnego oświadczenia. Proszę odnotować przedstawione materiały i wrócić do sprawy po przerwie.';}
  iss.resolved=true;iss.conflict=!!iss.baseline;iss.lastReaction='corrected';
  ps52StateRecord(c,'correction','Skorygowano zakres wcześniejszej wypowiedzi · '+p.title,t.id);
  return ps52ReplyStyle(c,p.reveal);
 }
 if(attached&&need.includes(attached)){
  if(iss.lastReaction==='partial')return '';
  iss.lastReaction='partial';
  return p.partial;
 }
 return '';
}
function ps52Say(c,text){const log=STATE.dialogues[c.id];log.push({role:'npc',text});if(log.length>1600)log.splice(0,log.length-1600);}
function ps52Ask(){const input=$('chatInput'),q=input.value.trim().slice(0,2000);if(!q)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);if(!c)return;
 const attached=$('attachedDoc').value,w=simWitness(c),psych=ps52Witness(c),st=NPC4_STATE[c.id],log=STATE.dialogues[c.id];
 if(STATE.sim.time<=0)return toast('Wyczerpano czas śledczy. Złóż wniosek o przedłużenie albo przejdź do oceny finału.');
 const qnorm=norm(q);const hostile=npc9Tone(q)==='pressure'||/przyznaj sie|na pewno klamiesz|areszt|groze|zamkne cie|morderc/i.test(qnorm);
 const specificAccusation=/\b(?:to\s+ty|to\s+pan|to\s+pani|ty)\s+(?:zabil|zabila|zamordowal|zamordowala)|jestes\s+morderc|byles\s+sprawca|bylas\s+sprawca/.test(qnorm);
 const tactic=psych.tactic;
 log.push({role:'player',text:q+(attached?'\n[Okazano: '+docName(attached)+']':'')});psych.questions++;
 if(w.blocked){ps52Say(c,'Podtrzymuję odmowę dalszych odpowiedzi do czasu przerwy. Proszę odnotować to w protokole.');simTime(1,-1,'Pytanie mimo odmowy: '+c.name);input.value='';renderChat();return;}
 if(attached&&!ps52EvidenceValid(attached)){
  st.tension=npc4Clamp(st.tension+11);st.rapport=npc4Clamp(st.rapport-10);
  ps52Violation(c,'Niezweryfikowany materiał w konfrontacji',attached);
  simError('Świadek zakwestionował pochodzenie lub kompletność okazanego materiału.',4,6);
  ps52Say(c,'Nie mogę potwierdzić wniosku z tego materiału bez sprawdzenia jego źródła. Proszę przedstawić kompletny dokument albo wyniki kontroli.');
  input.value='';renderChat();simRenderHearing();return;
 }
 const threshold=PS52_PROFILE[c.id].threshold;
 if((hostile&&st.tension>=66)||(st.tension>=threshold&&st.rapport<28)){
  st.tension=npc4Clamp(st.tension+9);st.rapport=npc4Clamp(st.rapport-9);w.blocked=true;
  ps52Violation(c,'Przekroczenie granicy presji','');simError('Przesłuchanie przerwane z powodu presji. Zeznania wymagają oceny proceduralnej.',4,8);
  ps52Say(c,'Nie będę dalej odpowiadać w tej formie. Proszę umożliwić przerwę i konsultację z pełnomocnikiem.');input.value='';renderChat();simRenderHearing();return;
 }
 const matched=ps52SelectThreads(c,q,attached);
 if(specificAccusation&&(!attached||!matched.length||!matched.some(t=>t.evidence.includes(attached)))){
  st.tension=npc4Clamp(st.tension+14);st.rapport=npc4Clamp(st.rapport-15);
  ps52Violation(c,'Bezpodstawne oskarżenie świadka',matched[0]?.id||'');simError('Bezpodstawne oskarżenie w przesłuchaniu obniża wiarygodność uzyskanych zeznań.',4,6);
  ps52Say(c,'Nie odpowiem na przypisywanie mi zabójstwa bez ustalonych podstaw. Proszę zadać pytanie o fakty, które mogę znać.');
  input.value='';renderChat();simRenderHearing();return;
 }
 // The existing NPC engine still owns factual answers, context and the provenance checks.
 const answer=npc4Answer(c,q,attached);const profile=PS52_PROFILE[c.id];
 const evidencePressure=attached?(tactic==='confront'?11:tactic==='precise'?6:4):0;
 const badTone=hostile?Math.round(10*profile.sensitivity):0;
 const rapportChange=hostile?-Math.round(7*profile.sensitivity):tactic==='free'&&!attached?2:tactic==='precise'&&!attached?1:attached?-3:0;
 st.tension=npc4Clamp(st.tension+evidencePressure+badTone-(tactic==='free'&&!hostile?2:0));
 st.rapport=npc4Clamp(st.rapport+rapportChange);
 // Dialogue transcript is the authoritative record of what was ACTUALLY said, not a scripted claim.
 let appended='';
 for(const t of matched){const iss=ps52Issue(c,t.id);
  if(!iss.baseline&&!attached){iss.baseline=String(answer).slice(0,450);ps52StateRecord(c,'statement','Utrwalono wypowiedź o: '+PS52_THREADS[t.id].title,t.id);}
  const supplement=ps52Reaction(c,t,iss,attached,matched.length>1);if(supplement)appended+=(appended?'\n\n':'\n\n')+supplement;
 }
 if(attached&&tactic==='confront'&&!matched.length){appended+='\n\n'+profile.uncertainty;}
 if((hostile&&st.tension>=threshold)||(st.tension>=94&&st.rapport<31)){
  w.blocked=true;ps52Violation(c,'Przesłuchanie zakończone pod presją',matched[0]?.id||'');
  appended+='\n\nProszę zakończyć ten etap przesłuchania. Potrzebuję przerwy i możliwości konsultacji.';
 }
 ps52Say(c,answer+appended);
 if(window.stage3)window.stage3.onQuestion(c.id,q,attached);
 if(hostile&&attached){ps52Violation(c,'Agresywna konfrontacja',matched[0]?.id||'');simTime(2,-3,'Konfrontacja prowadzona agresywnie');}
 else if(hostile){simTime(2,-2,'Presja bez materiału dowodowego');}
 else simTime(attached&&tactic==='confront'?2:1,0,'Przesłuchanie: '+c.name);
 input.value='';renderChat();simRenderHearing();
}
const ps52BaseInterrogation=simRenderInterrogation;
simRenderInterrogation=function(){ps52BaseInterrogation();const root=document.getElementById('simInterrogation');if(!root)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);if(!c)return;const psych=ps52Witness(c),st=NPC4_STATE[c.id],w=simWitness(c);
 const visible=ps52Threads(c).filter(t=>psych.issues[t.id]?.baseline||psych.issues[t.id]?.seen?.length||t.evidence.some(id=>STATE.found.has(id)));
 const tactics=[['free','Swobodnie'],['precise','Doprecyzuj'],['confront','Konfrontuj']];
 root.insertAdjacentHTML('afterbegin',`<div class="ps52"><div class="ps52-eyebrow">PROTOKÓŁ PRZESŁUCHANIA</div><div class="ps52-tactics" role="group" aria-label="Strategia prowadzenia rozmowy">${tactics.map(([id,label])=>`<button type="button" data-psy-tactic="${id}" aria-pressed="${psych.tactic===id}">${label}</button>`).join('')}</div><p class="small muted">Wybór taktyki zmienia reakcję świadka. Pytania nadal formułujesz samodzielnie. Konfrontacja wymaga okazania dowodu w polu poniżej.</p><div class="ps52-state"><span>Wypowiedzi: <b>${psych.questions}</b></span><span>Udokumentowane korekty: <b>${Object.values(psych.issues).filter(x=>x.resolved).length}</b></span><span>${w.blocked?'Przesłuchanie przerwane':st.tension>=72?'Świadek wyraźnie spięty':'Czynność trwa'}</span></div>${visible.length?`<details class="ps52-cases"><summary>Weryfikowane wątki (${visible.length})</summary>${visible.map(t=>{const x=ps52Issue(c,t.id);return `<div class="ps52-case"><b>${esc(PS52_THREADS[t.id].title)}</b><small>${x.resolved?'Zeznanie doprecyzowane źródłami':x.baseline?'Wypowiedź odnotowana':'Wymaga rozmowy'} · ${x.seen.length}/${t.evidence.length} materiałów skonfrontowanych</small>${x.baseline?`<small class="ps52-quote">Zapis wcześniejszej odpowiedzi: „${esc(x.baseline.slice(0,180))}…”</small>`:''}</div>`;}).join('')}</details>`:''}</div>`);
 root.querySelector('[data-sim-break]').textContent='Zarządź przerwę (3 czasu)';
};
const ps52BaseHearing=simRenderHearing;
simRenderHearing=function(){ps52BaseHearing();const a=document.querySelector('#simHearingDetail');if(!a)return;
 const issues=Object.values(STATE.sim.psych52?.witnesses||{}).reduce((sum,w)=>sum+Object.values(w.issues||{}).filter(x=>x.resolved).length,0);
 const violations=STATE.sim.psych52?.violations?.length||0;
 a.querySelector('#ps52Hearing')?.remove();a.insertAdjacentHTML('afterbegin',`<div id="ps52Hearing" class="ps52-hearing"><b>Protokół świadków</b><span>${issues} wątków doprecyzowanych na podstawie źródeł · ${violations} uchybień przesłuchania. Korekty zeznań same nie są dowodami sprawstwa.</span></div>`);
};
const ps52BaseAssessment=simCaseAssessment;
simCaseAssessment=function(){const a=ps52BaseAssessment();const v=STATE.sim.psych52?.violations||[];
 const penalty=Math.min(15,v.length*3);if(penalty){a.strength=Math.max(0,a.strength-penalty);a.psychPenalty=penalty;a.weakReasons.push('Zeznania wymagają oceny pod kątem '+v.length+' uchybień w technice przesłuchań (korekta oceny: −'+penalty+' pkt).');}
 const supported=Object.values(STATE.sim.psych52?.witnesses||{}).reduce((sum,w)=>sum+Object.values(w.issues||{}).filter(x=>x.resolved).length,0);
 // Limited procedural reward: never makes an unsubstantiated hypothesis ready.
 const bonus=Math.min(3,supported);if(bonus&&a.complete&&a.coherence){a.strength=Math.min(100,a.strength+bonus);a.psychBonus=bonus;}
 return a;
};

/* SaveManager: buildSave hook. */
registerSaveHook({name:"13-psychological-interrogations-save1", build(__save){const data=__save;data.investigationSim.psych52=JSON.parse(JSON.stringify(STATE.sim.psych52));return data;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"13-psychological-interrogations-load1", apply(data){undefined;const saved=data?.investigationSim?.psych52;STATE.sim.psych52=ps52Fresh();
 if(saved&&typeof saved==='object'){
  const dest=STATE.sim.psych52;
  dest.violations=(Array.isArray(saved.violations)?saved.violations:[]).filter(v=>v&&CONTENT.characters.some(c=>c.id===v.id)&&typeof v.type==='string').slice(-70).map(v=>({id:v.id,type:v.type.slice(0,90),issue:String(v.issue||'').slice(0,40)}));
  dest.history=(Array.isArray(saved.history)?saved.history:[]).filter(x=>x&&CONTENT.characters.some(c=>c.id===x.id)&&typeof x.type==='string').slice(-100).map(x=>({id:x.id,type:x.type.slice(0,30),issue:String(x.issue||'').slice(0,40),summary:String(x.summary||'').slice(0,200)}));
  for(const c of CONTENT.characters){const raw=saved.witnesses?.[c.id];if(!raw||typeof raw!=='object')continue;
   const w=ps52Witness(c);w.tactic=['free','precise','confront'].includes(raw.tactic)?raw.tactic:'free';w.questions=Math.max(0,Math.min(10000,Number(raw.questions)||0));w.invalid=Math.max(0,Math.min(10000,Number(raw.invalid)||0));w.recess=Math.max(0,Math.min(10000,Number(raw.recess)||0));
   for(const thread of ps52Threads(c)){const x=raw.issues?.[thread.id];if(!x||typeof x!=='object')continue;const iss=ps52Issue(c,thread.id);
    iss.baseline=String(x.baseline||'').slice(0,450);
    iss.seen=[...new Set((Array.isArray(x.seen)?x.seen:[]).filter(id=>thread.evidence.includes(id)&&ps52EvidenceValid(id)))];
    iss.resolved=!!x.resolved&&thread.evidence.every(id=>iss.seen.includes(id))&&ps52Independence(iss.seen,thread.min_independent_families||2);
    iss.conflict=!!x.conflict&&iss.resolved;iss.lastReaction=iss.resolved?'corrected':'';
   }
  }
 }
 simRenderInterrogation();simRenderHearing();
}});
const ps52PrevReset=simReset;
simReset=function(){ps52PrevReset();STATE.sim.psych52=ps52Fresh();simRenderInterrogation();simRenderHearing();};
const ps52Root=document.getElementById('simInterrogation');
ps52Root?.addEventListener('click',e=>{const t=e.target.closest('[data-psy-tactic]');if(!t)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);if(!c)return;const w=ps52Witness(c);w.tactic=t.dataset.psyTactic;
 NPC4_STATE[c.id].stance=w.tactic==='free'?'neutral':w.tactic==='precise'?'firm':'firm';
 simRenderInterrogation();});
// All active input paths (button and Enter) now use the same guarded game mechanic.
registerWitnessSendLayer("ps52-psychological-interrogation",ps52Ask);simBreak=ps52Pause;
const ps52SendOld=document.getElementById('chatSend');const ps52SendNew=ps52SendOld.cloneNode(true);
ps52SendOld.replaceWith(ps52SendNew);ps52SendNew.addEventListener('click',ps52Ask);
renderChat();simRenderHearing();
window.PS52_QA={threads:PS52_THREADS,profiles:PS52_PROFILE,threadList:id=>{const c=CONTENT.characters.find(x=>x.id===id);return c?ps52Threads(c):[];},state:()=>STATE.sim.psych52,valid:ps52EvidenceValid,ask:ps52Ask,reset:()=>{STATE.sim.psych52=ps52Fresh();},counts:()=>({witnesses:CONTENT.characters.length,arcs:CONTENT.characters.reduce((n,c)=>n+ps52Threads(c).length,0)})};
/* Prawdziwe Śledztwo 5.3 — sieć wątków i konsekwencji fabularnych.
   Wnioski NIE dodają dokumentów, NIE wymuszają przyznania i NIE zastępują dowodów.
   Wszystkie źródła pochodzą z istniejących akt gry. */
const PS53_ARCS = [
 {id:'pressure',layer:'I. Napięcia w zajezdni',title:'Wagon gotowy czy tylko dopuszczony?',
  tagline:'Marek, Janusz i Tomasz mają odmienne interesy w ocenie stanu TW-217.',people:['MAREK','JANUSZ','TOMASZ'],
  paths:[['EVID_WORK_ORDER_RAW','EVID_DISPATCH_REVISION'],['TEC-04','TEC-02']],
  clue:'Zapis obsługi technicznej i harmonogram ruchu można porównać. Presja organizacyjna nie jest dowodem zamiaru zabójstwa.',
  hazard:'Pomylenie konfliktu o dostępność tramwaju z dowodem sprawstwa.',
  keywords:/wagon|warsztat|kurs|presj|dopuszc|zlecen|dyspozycj|stan.*technicz|tw 217/i,
  reactions:{MAREK:'Mogę odpowiadać za decyzje organizacyjne. Nie będę ich utożsamiał z wiedzą o zdarzeniu przy stanowisku.',JANUSZ:'Zlecenie warsztatowe i plan ruchu opisują różne obowiązki. Proszę zachować to rozróżnienie.',TOMASZ:'Dyspozycja dotyczy ruchu wagonu. O stanie części odpowiada dokumentacja techniczna.'}},
 {id:'radio',layer:'I. Napięcia w zajezdni',title:'Niestandardowy powrót i luka radiowa',
  tagline:'Tomasz tłumaczy zmianę dyspozycji, ale nie każde pominięcie w łączności.',people:['TOMASZ','MAREK'],
  paths:[['EVID_RADIO_GAP','TEC-02'],['EVID_DISPATCH_REVISION','ADM-04']],
  clue:'Różne rejestry opisują zmianę przebiegu nocnego powrotu. Luka radiowa pozostaje osobnym problemem źródłowym.',
  hazard:'Przypisanie Tomaszowi wysłania wiadomości do Leny wyłącznie na podstawie luki.',
  keywords:/radio|powrot|luka|dyspozycj|tras|nagran|lacznosc/i,
  reactions:{TOMASZ:'Potwierdzę to, co wynika z dyspozycji. Brak zapisu rozmowy nie dowodzi, z kim później rozmawiałem.',MAREK:'Wiem o organizacji powrotu, lecz szczegóły radiowe powinien potwierdzić dyspozytor.'}},
 {id:'bhp',layer:'I. Napięcia w zajezdni',title:'Zgłoszenie, którego zabrakło w obiegu',
  tagline:'Elżbieta znała obawy Leny; status formalnej wysyłki wymaga osobnego sprawdzenia.',people:['ELZBIETA','MAREK'],
  paths:[['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],['EVID_BHP_DRAFT','DIG-16']],
  clue:'Istnienie projektu nie jest równoznaczne z przyjęciem formalnego zawiadomienia. Tylko kontrola wysyłki pozwala wnioskować o kanale doręczenia.',
  hazard:'Wniosek, że samo niewysłanie dokumentu dowodzi udziału Elżbiety w śmierci Leny.',
  keywords:/bhp|zgłosz|bezpiecze|projekt|sygnal|ostrzeż|procedur/i,
  reactions:{ELZBIETA:'Pamiętam rozmowę o ryzyku. Formalny status dokumentu trzeba odczytać z bramki wysyłkowej, nie z moich emocji.',MAREK:'Ustalmy, co wpłynęło oficjalną drogą, a czego nie zarejestrowano. To nie jest jeden i ten sam fakt.'}},
 {id:'service',layer:'II. Ślady ukrywania i dostęp',title:'Komu odpowiadał niepełny protokół?',
  tagline:'Janusz i Kamil inaczej rozumieją zakres przeprowadzonej diagnostyki.',people:['JANUSZ','KAMIL','MAGDALENA'],
  paths:[['EVID_WORK_ORDER_RAW','EVID_SERVICE_FORM_GAPS'],['TEC-09','EVID_ACCEPTANCE_RECORD']],
  clue:'Wersje protokołu i pierwotne zlecenie pozwalają odróżnić wykonaną czynność od późniejszego opisu.',
  hazard:'Automatyczne obarczenie mechanika odpowiedzialnością za rozbieżność w audycie i śmierć motorniczej.',
  keywords:/protok|warsztat|serwis|zlecen|przeglad|diagnost|autoryzac|poprawk/i,
  reactions:{JANUSZ:'Wykonanie pracy i późniejsze uzupełnienie protokołu to dwa osobne etapy. Nie przypisujmy brakom treści, których nie zawierają.',KAMIL:'Mogę objaśnić autoryzację testu. Nie wiem z samego logu, kto później edytował każdy zapis.',MAGDALENA:'Kontrolę zgodności dokumentów należy oddzielić od twierdzeń o intencjach osób.'}},
 {id:'acceptance',layer:'II. Ślady ukrywania i dostęp',title:'L-2, L-3 i odpowiedzialność za odbiór',
  tagline:'Oznaczenie podzespołu, protokół i historia zatwierdzeń nie tworzą jednej wersji.',people:['MAGDALENA','JANUSZ'],
  paths:[['EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD'],['TEC-15','TEC-09']],
  clue:'Rozbieżność między oznaczeniem a dokumentacją można wykazać dwoma metodami. Sama nie identyfikuje osoby odpowiedzialnej za przemoc.',
  hazard:'Zamiana problemu odbioru podzespołu w gotowy dowód zabójstwa.',
  keywords:/l 2|l 3|podzespol|odbior|zg 41|oznaczen|numer ser|niezgodn/i,
  reactions:{MAGDALENA:'Rozbieżność techniczna wymaga audytu historii zatwierdzeń. Nie potwierdzę zamiaru na podstawie numeru części.',JANUSZ:'Zdjęcie części mówi o oznaczeniu; protokół o tym, co zatwierdzono. Trzeba je porównać.'}},
 {id:'card',layer:'II. Ślady ukrywania i dostęp',title:'Kto miał kartę T-17?',
  tagline:'Przekazanie uprawnienia i otwarcie drzwi to dwa niezależne zdarzenia.',people:['KAMIL','MAGDALENA'],
  paths:[['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],['ADM-07','VIS-09']],
  clue:'Karta mogła zostać przekazana. Numer identyfikuje użyte uprawnienie, nie automatycznie człowieka przechodzącego przez drzwi.',
  hazard:'Skazanie formalnego posiadacza karty bez sprawdzenia przekazania.',
  keywords:/t 17|kart|klucz|dostep|drzwi|wydani|przekaz|czytnik/i,
  reactions:{KAMIL:'Przekazałem kartę w trybie służbowym. Sam odczyt nie pokazuje, kto trzymał ją w dłoni.',MAGDALENA:'Rejestr użycia karty nie jest nagraniem twarzy. To należy ustalać innymi źródłami.'}},
 {id:'invitation',layer:'III. Spotkanie i rekonstrukcja',title:'Kto zaprosił Lenę na rozmowę?',
  tagline:'Treść wiadomości i metadane jej nadania nie przesądzają o fizycznej obecności.',people:['MAGDALENA','ELZBIETA'],
  paths:[['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA'],['DIG-04','DIG-05']],
  clue:'Kanał kontaktu można analizować niezależnie od rekonstrukcji drogi na miejsce spotkania. Ustalenie konta nie jest identyfikacją nadawcy.',
  hazard:'Uznanie jednego SMS-a za bezpośredni dowód osoby i motywu.',
  keywords:/sms|wiadomosc|zaproszen|spotkan|telefon|nadaw|korespondenc|lena/i,
  reactions:{MAGDALENA:'Proszę porównać odzyskaną treść z metadanymi. Wypowiedź o spotkaniu to nie to samo, co dowód jego przebiegu.',ELZBIETA:'Rozmawiałam z Leną wcześniej. Nie byłam świadkiem tego, kto później kontaktował się z nią w zajezdni.'}},
 {id:'alibi',layer:'III. Spotkanie i rekonstrukcja',title:'Sesja audytowa a fizyczna obecność',
  tagline:'Aktywność konta Magdaleny nie rozstrzyga, gdzie znajdowała się przez całą noc.',people:['MAGDALENA','KAMIL'],
  paths:[['EVID_CONFERENCE_SESSION','DIG-09'],['EVID_CCTV_SYNC','ADM-04']],
  clue:'Aktywność sesji i możliwość przemieszczania się to dwa różne twierdzenia. Trzeba zderzyć zapis konta z chronologią.',
  hazard:'Przyjęcie elektronicznego alibi za niepodważalne lub odwrotnie — potraktowanie luki jako dowodu winy.',
  keywords:/alibi|audyt|sesj|obecnos|kamera|01 30|komputer|transmis|pokoj/i,
  reactions:{MAGDALENA:'Sesja dowodzi aktywności połączenia, nie każdego mojego ruchu. Nie należy przy tym z samej luki wyciągać wniosku o winie.',KAMIL:'W systemie widoczna jest aktywność konta. Fizyczne przejścia trzeba badać osobno.'}},
 {id:'injury',layer:'III. Spotkanie i rekonstrukcja',title:'Urazy przed upadkiem czy tylko upadek?',
  tagline:'Opinia medyczna i badania kontaktowe ograniczają liczbę spójnych rekonstrukcji.',people:['JANUSZ','ELZBIETA'],
  paths:[['MED-04','LAB-08'],['MED-10','LAB-05']],
  clue:'Dwa rodzaje specjalistycznych analiz pozwalają sprawdzić mechanizm urazów. Nawet zgodny mechanizm nie identyfikuje sprawcy.',
  hazard:'Wykorzystanie wspólnego smaru lub podobnego włókna jako niepodważalnego oznaczenia osoby.',
  keywords:/uraz|obrazen|upad|uderzen|smar|wł[oó]kn|kontakt|mechanizm|sekcj/i,
  reactions:{JANUSZ:'Nie jestem biegłym medycyny sądowej. Stanowisko ma elementy, które należy porównać z opinią.',ELZBIETA:'Nie widziałam zdarzenia. W zakresie obrażeń opierajmy się na opinii, nie na moim przekonaniu.'}},
 {id:'payroll',layer:'I. Napięcia w zajezdni',title:'Poprawki ewidencji: motyw czy szum?',
  tagline:'Ręczne rozliczenia obciążają organizację zmiany, lecz nie identyfikują sprawcy.',people:['MAREK','TOMASZ'],
  paths:[['EVID_PAYROLL_MANUAL_EDIT','EVID_RAW_ENTRY_TIMES'],['ADM-01','EVID_RAW_ENTRY_TIMES']],
  clue:'Zestawienie ewidencji i danych dostępu pozwala zbadać rozliczenie obecności, ale nie dowodzi miejsca przebywania przez całą noc.',
  hazard:'Zrobienie z uchybienia w rozliczeniu dowodu zabójstwa.',
  keywords:/grafik|rozlicze|plac|obecnos|ewidenc|korekt.*godzin/i,
  reactions:{MAREK:'Ewidencja służy rozliczeniom. Jej korekty nie zastąpią rzeczywistego rejestru przejść.',TOMASZ:'Nie sporządzałem zestawienia płac. Dla przebiegu kursu liczą się zapisy dyspozycji.'}}
];
const PS53_MAP = new Map(PS53_ARCS.map(a=>[a.id,a]));
const PS53_LINKS = [
 {a:'pressure',b:'service',title:'Naciski na kursy a protokół serwisowy',meaning:'Presja czasu objaśnia kontekst dokumentowania prac. Nie pozwala wskazać zabójcy.'},
 {a:'bhp',b:'acceptance',title:'Zagrożenie techniczne a formalny odbiór',meaning:'Dwa tory dokumentacji wyjaśniają, dlaczego rozbieżność mogła pozostać nierozpoznana.'},
 {a:'card',b:'alibi',title:'Dostęp do strefy a alibi transmisji',meaning:'Karta i sesja nie identyfikują samodzielnie człowieka; wspólnie pozwalają kontrolować chronologię.'},
 {a:'radio',b:'invitation',title:'Powrót tramwaju a późniejsza korespondencja',meaning:'Zmianę dyspozycji i kontakt z Leną trzeba analizować osobno, aby nie tworzyć fałszywego ciągu przyczyn.'},
 {a:'invitation',b:'injury',title:'Kontakt a mechanizm śmierci',meaning:'Spotkanie i rodzaj obrażeń wymagają osobnych przesłanek, zanim zbudują spójną rekonstrukcję.'}
];
function ps53Fresh(){return {arcs:{},heard:[],journal:[],version:1};}
STATE.sim.story53=ps53Fresh();
function ps53Entry(id){const state=(STATE.sim.story53 ||= ps53Fresh());return (state.arcs[id] ||= {choice:'',path:-1,changes:0});}
function ps53GoodEvidence(id){return !!byId[id]&&STATE.found.has(id)&&STATE.sim.auditJudgments?.[id]?.status!=='overclaim' && (simQuality(id)>=.8 || (SIM_NOISE.has(id)&&sim51Audited(id)&&STATE.sim.auditJudgments?.[id]?.status==='accepted'));}
function ps53PathReady(arc,index){const path=arc?.paths[index];return !!path&&path.every(ps53GoodEvidence)&&new Set(path.map(id=>byId[id]?.family||id)).size>=2;}
function ps53Discovered(a){return a.paths.some(p=>p.some(id=>STATE.found.has(id)));}
function ps53CrossLinks(){return PS53_LINKS.filter(l=>ps53Entry(l.a).choice==='careful'&&ps53Entry(l.b).choice==='careful');}
function ps53Risk(){const over=PS53_ARCS.filter(a=>ps53Entry(a.id).choice==='overreach');const skipped=PS53_ARCS.filter(a=>ps53Entry(a.id).choice==='dismiss');
 const critical=new Set(['card','alibi','injury','invitation','acceptance']);
 const active=new Set([...fcAllDocs(),...Object.values(STATE.sim.links||{}).flatMap(x=>x.filter(y=>y.role==='supports').map(y=>y.id))]);
 const criticallyOmitted=skipped.filter(a=>critical.has(a.id)&&a.paths.flat().some(id=>active.has(id)));
 return {over,skipped,criticallyOmitted,careful:PS53_ARCS.filter(a=>ps53Entry(a.id).choice==='careful'),cross:ps53CrossLinks()};}
const ps53Root=document.createElement('section');ps53Root.id='ps53Narrative';ps53Root.className='surface padded ps53-root';
ps53Root.innerHTML=`<div class="ps53-head"><div><div class="eyebrow">REKONSTRUKCJA ZALEŻNOŚCI</div><h3>Sieć intryg</h3><p class="small muted">Od decyzji organizacyjnych po ostatnie spotkanie Leny. Odkrywaj wątki w dowolnej kolejności; dwa niezależne sposoby kontroli każdego z nich. Ustalenie tła nie oznacza automatycznego udowodnienia zabójstwa.</p></div><div id="ps53Stats" class="ps53-stats"></div></div><div class="ps53-shell"><div id="ps53List" class="ps53-list"></div><div id="ps53Detail" class="ps53-detail" aria-live="polite"></div></div><div id="ps53Links" class="ps53-links"></div>`;
(document.querySelector('#simAudit51')||document.querySelector('#simGraph'))?.insertAdjacentElement('afterend',ps53Root);
const ps53Jump=document.createElement('button');ps53Jump.type='button';ps53Jump.className='btn alt ps53-jump';ps53Jump.textContent='Przejdź do sieci intryg';
ps53Jump.addEventListener('click',()=>document.getElementById('ps53Narrative')?.scrollIntoView({behavior:'smooth',block:'start'}));
document.querySelector('#deduction .dd-head')?.appendChild(ps53Jump);
let ps53Selected='';
function ps53Card(a){const seen=ps53Discovered(a),e=ps53Entry(a.id);if(!seen)return `<div class="ps53-hidden">Nieodkryty wątek · zbierz powiązane materiały</div>`;
 const label=e.choice==='careful'?'Zbadano źródła':e.choice==='overreach'?'Wniosek nadmierny':e.choice==='dismiss'?'Odłożony':'Do zbadania';
 return `<button type="button" data-ps53-arc="${a.id}" aria-pressed="${ps53Selected===a.id}" class="ps53-card ${e.choice||''} ${ps53Selected===a.id?'selected':''}"><strong>${esc(a.title)}</strong><small>${esc(a.tagline)}</small><span>${esc(label)}</span></button>`;}
function ps53Render(){if(!document.getElementById('ps53Narrative'))return;
 const discovered=PS53_ARCS.filter(ps53Discovered);if(!ps53Selected||!PS53_MAP.has(ps53Selected)||!ps53Discovered(PS53_MAP.get(ps53Selected)))ps53Selected=discovered[0]?.id||'';
 const risk=ps53Risk();document.getElementById('ps53Stats').innerHTML=`<b>${risk.careful.length} / ${PS53_ARCS.length}</b><span>zweryfikowanych wątków</span>`;
 const list=document.getElementById('ps53List');let parts=[];
 for(const layer of [...new Set(PS53_ARCS.map(x=>x.layer))]){parts.push(`<h4>${esc(layer)}</h4>`);parts.push(PS53_ARCS.filter(x=>x.layer===layer).map(ps53Card).join(''));}list.innerHTML=parts.join('');
 ps53RenderDetail();document.getElementById('ps53Links').innerHTML='<h4>Związki między ustaleniami</h4><p class="small muted">Wspólna interpretacja powstaje tylko z dwóch rzetelnie zbadanych wątków. Nie jest nowym dowodem.</p>'+PS53_LINKS.map(l=>`<div class="ps53-link ${ps53Entry(l.a).choice==='careful'&&ps53Entry(l.b).choice==='careful'?'active':''}"><b>${esc(l.title)}</b><small>${ps53Entry(l.a).choice==='careful'&&ps53Entry(l.b).choice==='careful'?esc(l.meaning):'Porównaj dwa powiązane wątki bez nadinterpretacji.'}</small></div>`).join('');
}
function ps53RenderDetail(){const host=document.getElementById('ps53Detail');if(!host)return;const a=PS53_MAP.get(ps53Selected);
 if(!a||!ps53Discovered(a)){host.innerHTML='<p class="muted small">W pierwszej kolejności zdobądź dokumenty sprawy.</p>';return;}
 const e=ps53Entry(a.id);const opts=a.paths.map((p,i)=>`<label class="ps53-route ${ps53PathReady(a,i)?'ready':''}"><input type="radio" name="ps53Path" value="${i}" ${i===(e.path>=0?e.path:0)?'checked':''}><span><b>Metoda ${i?'B':'A'} · ${ps53PathReady(a,i)?'kompletna':'wymaga kontroli'}</b>${p.map(id=>`<small>${STATE.found.has(id)?esc(docName(id))+(ps53GoodEvidence(id)?' ✓':' · do sprawdzenia'):'Niepozyskany materiał'}</small>`).join('')}</span></label>`).join('');
 const already=e.choice;host.innerHTML=`<div class="eyebrow">NOTATKA ŚLEDCZA</div><h3>${esc(a.title)}</h3><p>${esc(a.tagline)}</p><div class="ps53-people">Osoby powiązane: ${a.people.map(id=>esc(CONTENT.characters.find(c=>c.id===id)?.name||id)).join(' · ')}</div><h4>Dwie ścieżki dowodowe</h4><div class="ps53-routes">${opts}</div><div class="ps53-observation"><b>Zakres rzetelnego ustalenia</b><p>${esc(a.clue)}</p></div><label class="ps53-choice-label" for="ps53Choice">Decyzja śledczego</label><select id="ps53Choice"><option value="">— wybierz sposób postępowania —</option><option value="careful" ${already==='careful'?'selected':''}>Zestaw źródła i zachowaj ograniczenia wniosku</option><option value="overreach" ${already==='overreach'?'selected':''}>Uznaj trop za bezsporne obciążenie osoby</option><option value="dismiss" ${already==='dismiss'?'selected':''}>Odłóż wątek bez uwzględnienia jego znaczenia</option></select><button type="button" class="btn" data-ps53-decide>Odnotuj decyzję</button><div class="ps53-feedback">${already?`Aktualna decyzja: <b>${already==='careful'?'weryfikacja ostrożna':already==='overreach'?'nadinterpretacja':'pominięcie'}</b>. Możesz zmienić ocenę po ponownej analizie, ale wcześniejsze koszty błędu pozostaną.`:'Rzetelne ustalenie wymaga kompletu źródeł w co najmniej jednej metodzie. Błędne wnioski mają konsekwencje procesowe.'}</div><p class="small muted">Ryzyko: ${esc(a.hazard)}</p>`;
}
function ps53Commit(){const a=PS53_MAP.get(ps53Selected);if(!a||!ps53Discovered(a))return;
 const choice=document.getElementById('ps53Choice')?.value;const path=Number(document.querySelector('[name="ps53Path"]:checked')?.value||0);
 if(!['careful','overreach','dismiss'].includes(choice))return toast('Wybierz ocenę wątku.');
 if(choice==='careful'&&!ps53PathReady(a,path))return toast('Przed uznaniem ustalenia zweryfikuj wszystkie dokumenty wybranej drogi.');
 const e=ps53Entry(a.id);if(choice===e.choice&&path===e.path)return toast('Ta decyzja jest już zapisana.');
 const cost=choice==='overreach'?3:choice==='careful'?2:1;if(STATE.sim.time<cost)return toast('Brak czasu śledczego na tę decyzję.');
 const prev=e.choice;e.choice=choice;e.path=path;e.changes=Math.min(100,e.changes+1);
 if(choice==='overreach')simError('Nadmierny wniosek z wątku „'+a.title+'”. '+a.hazard,3,6);
 else simTime(cost,0,choice==='careful'?'Porównanie materiałów: '+a.title:'Odłożenie wątku: '+a.title);
 STATE.sim.story53.journal.push({id:a.id,choice,path,previous:prev});if(STATE.sim.story53.journal.length>80)STATE.sim.story53.journal.shift();
 STATE.sim.trial=null;ps53Render();simRenderHearing();toast(choice==='careful'?'Utrwalono ostrożny, źródłowy wniosek.':choice==='dismiss'?'Wątek odłożono — może osłabić ocenę akt.':'Odnotowano ryzykowną interpretację w aktach.');
}
ps53Root.addEventListener('click',e=>{const b=e.target.closest('[data-ps53-arc],[data-ps53-decide]');if(!b)return;
 if(b.hasAttribute('data-ps53-arc')){ps53Selected=b.dataset.ps53Arc;ps53Render();}
 else ps53Commit();});
const ps53BaseGraph=simRenderGraph;
simRenderGraph=function(){ps53BaseGraph();ps53Render();};
const ps53BaseChat=ps52Ask;
function ps53Ask(){const c=CONTENT.characters.find(c=>c.id===STATE.activeChar),q=String(document.getElementById('chatInput')?.value||''),log=c&&STATE.dialogues[c.id],old=log?.length||0;
 const matching=c?PS53_ARCS.filter(a=>a.people.includes(c.id)&&a.keywords.test(norm(q))&&ps53Entry(a.id).choice):[];
 ps53BaseChat();if(!c||!matching.length||!log||log.length<old+2)return;
 const last=log[log.length-1];if(!last||last.role!=='npc'||simWitness(c).blocked)return;
 if(/Podtrzymuj[eę] odmowę|Nie mogę potwierdzić wniosku z tego materiału|Nie będę dalej odpowiadać/.test(last.text))return;
 for(const a of matching){const entry=ps53Entry(a.id),tag=a.id+'/'+c.id+'/'+entry.choice;
  if(STATE.sim.story53.heard.includes(tag))continue;
  let extra='';if(entry.choice==='careful'&&ps53PathReady(a,entry.path)){extra=a.reactions[c.id]||'';}
  else if(entry.choice==='overreach'){extra='Wyciąga pan/pani z tego wątku wniosek, którego przedstawione materiały nie potwierdzają. Proszę nie utożsamiać podejrzenia z ustaleniem.';}
  else if(entry.choice==='dismiss'){extra='To pominięcie pozostawia nierozwiązane pytania. Nie chcę opierać odpowiedzi na niepełnym obrazie.';}
  if(!extra)continue;
  STATE.sim.story53.heard.push(tag);if(STATE.sim.story53.heard.length>150)STATE.sim.story53.heard.shift();
  last.text+='\n\n'+extra;
  const st=NPC4_STATE[c.id];if(entry.choice==='overreach'){st.tension=npc4Clamp(st.tension+5);st.rapport=npc4Clamp(st.rapport-4);}
  else if(entry.choice==='careful'){st.tension=npc4Clamp(st.tension-2);st.rapport=npc4Clamp(st.rapport+2);}
  break;
 }
 renderChat();
}
registerWitnessSendLayer("ps53-story-arc-dialogue",ps53Ask);
const ps53BaseAssess=simCaseAssessment;
simCaseAssessment=function(){const a=ps53BaseAssess(),r=ps53Risk();
 const penalty=Math.min(25,r.over.length*5+r.criticallyOmitted.length*6);
 if(penalty){a.strength=Math.max(0,a.strength-penalty);a.weakReasons.push('Nierozliczone skutki decyzji fabularnych: '+r.over.length+' nadinterpretacji, '+r.criticallyOmitted.length+' pominiętych istotnych tropów.');}
 if(r.criticallyOmitted.length)a.badKey=true;
 const gain=Math.min(5,Math.floor(r.careful.length/2)+Math.floor(r.cross.length/2));
 if(gain&&a.complete&&a.coherence&&a.rolesReady&&a.keyLinked&&!a.badKey&&!a.timelineIssues.length)a.strength=Math.min(100,a.strength+gain);
 a.story53={careful:r.careful.length,over:r.over.length,skipped:r.skipped.length,cross:r.cross.length,penalty,bonus:gain};return a;
};
function ps53Epilogue(){const r=ps53Risk(),lines=[];
 if(r.careful.some(a=>a.id==='bhp')&&r.careful.some(a=>a.id==='acceptance'))lines.push('Przebieg zgłoszenia BHP zestawiono z historią odbioru podzespołu; odpowiedzialność za procedury pozostała osobnym zagadnieniem.');
 if(r.careful.some(a=>a.id==='card')&&r.careful.some(a=>a.id==='alibi'))lines.push('Chronologia karty T-17 została odróżniona od elektronicznej aktywności konta audytowego.');
 if(r.careful.some(a=>a.id==='invitation')&&r.careful.some(a=>a.id==='injury'))lines.push('Kontakt z Leną nie zastąpił opinii o mechanizmie obrażeń; oba ogniwa sprawdzono niezależnie.');
 if(r.over.length)lines.push('Obrona zakwestionowała nadinterpretacje w '+r.over.length+' wątkach; wcześniejsze koszty pozostają w protokole.');
 if(r.criticallyOmitted.length)lines.push('W materiałach końcowych zabrakło wyjaśnienia '+r.criticallyOmitted.length+' istotnych wątków związanych z aktem.');
 if(!lines.length)lines.push('Nie wykazano wystarczającej liczby niezależnie rozpatrzonych zależności, by zbudować dodatkową rekonstrukcję tła.');
 return lines.slice(0,5);
}
const ps53BaseHearing=simRenderHearing;
simRenderHearing=function(){ps53BaseHearing();const host=document.getElementById('simHearingDetail');if(!host)return;
 const r=ps53Risk(),s=STATE.sim.trial;host.querySelector('#ps53Process')?.remove();
 const el=document.createElement('div');el.id='ps53Process';el.className='ps53-process';el.innerHTML=`<h4>Powiązania fabularne i ryzyko wniosku</h4><p class="small muted">${r.careful.length} wątków udokumentowanych · ${r.cross.length} zależności między wątkami · ${r.over.length} nadinterpretacji · ${r.skipped.length} odłożonych. Wątki opisują kontekst, nie zastępują aktu.</p>${s?`<details open><summary>Konsekwencje fabularne rozstrzygnięcia</summary><ul>${ps53Epilogue().map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:''}`;
 host.appendChild(el);
};

/* SaveManager: buildSave hook. */
registerSaveHook({name:"13-psychological-interrogations-save2", build(__save){const d=__save;d.investigationSim.story53=JSON.parse(JSON.stringify(STATE.sim.story53));return d;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"13-psychological-interrogations-load2", apply(d){undefined;STATE.sim.story53=ps53Fresh();const raw=d?.investigationSim?.story53;
 if(raw&&typeof raw==='object'){
  for(const a of PS53_ARCS){const ent=raw.arcs?.[a.id];if(!ent||typeof ent!=='object')continue;
   const choice=['careful','overreach','dismiss'].includes(ent.choice)?ent.choice:'';
   const path=Number(ent.path);const validPath=[0,1].includes(path)?path:-1;
   if(choice==='careful'&&!ps53PathReady(a,validPath))continue;
   const e=ps53Entry(a.id);e.choice=choice;e.path=validPath;e.changes=Math.min(100,Math.max(0,Number(ent.changes)||0));
  }
  const tags=new Set(PS53_ARCS.flatMap(a=>a.people.flatMap(id=>['careful','overreach','dismiss'].map(c=>a.id+'/'+id+'/'+c))));
  STATE.sim.story53.heard=(Array.isArray(raw.heard)?raw.heard:[]).filter(x=>typeof x==='string'&&tags.has(x)).slice(-150);
  STATE.sim.story53.journal=(Array.isArray(raw.journal)?raw.journal:[]).filter(x=>x&&PS53_MAP.has(x.id)&&['careful','overreach','dismiss'].includes(x.choice)).slice(-80).map(x=>({id:x.id,choice:x.choice,path:[0,1].includes(x.path)?x.path:-1,previous:String(x.previous||'').slice(0,10)}));
 }
 ps53Render();simRenderHearing();}});
const ps53BaseReset=simReset;
simReset=function(){ps53BaseReset();STATE.sim.story53=ps53Fresh();ps53Selected='';ps53Render();simRenderHearing();};
ps53Render();simRenderHearing();
window.PS53_QA={arcs:PS53_ARCS,links:PS53_LINKS,ready:ps53PathReady,good:ps53GoodEvidence,risk:ps53Risk,state:()=>STATE.sim.story53,commit:ps53Commit,counts:()=>({arcs:PS53_ARCS.length,paths:PS53_ARCS.reduce((n,a)=>n+a.paths.length,0),links:PS53_LINKS.length})};

