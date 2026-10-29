
/* Ostatnia karta akt: podsumowanie wyłącznie z faktycznych decyzji gracza.
   Wybrany akcent wpływa tylko na słowa zakończenia, nigdy na ocenę dowodów. */
(function(){
'use strict';
if(typeof STATE==='undefined'||!window.PS70_ARC||!window.PS69_STORY||typeof simRenderHearing!=='function')return;
const by=id=>document.getElementById(id);
const lenses={facts:'To, co potwierdzone',doubts:'To, czego nie ustalono',people:'Ludzie poza aktami'};
const headings={solid:'Ciężar decyzji',weak:'Nie wszystko można nazwać dowodem',acquittal:'Granice oskarżenia',returned:'Jeszcze nie ostatni tom',excluded:'Cena proceduralnego skrótu',miscarriage:'Dwie krzywdy',other:'Po ostatniej decyzji'};
const intros={
 solid:'Akt został utrzymany. To nie znaczy, że noc w zajezdni da się sprowadzić do jednej kartki. Każdy potwierdzony szczegół musiał wytrzymać pytanie: skąd to wiemy?',
 weak:'Sprawa nie utrzymała ciężaru oskarżenia. Fragmenty tej nocy pozostają w dokumentach, ale między podejrzeniem a pewnym wnioskiem wciąż jest odległość.',
 acquittal:'Oskarżenie nie wystarczyło do przypisania odpowiedzialności. Pozostają zeznania, rozbieżności i granica, której nie wolno przekroczyć samą intuicją.',
 returned:'Akta wróciły do uzupełnienia. Nie jest to odpowiedź, na którą wszyscy czekali, ale brak pewności nie przestaje mieć znaczenia, kiedy kończy się posiedzenie.',
 excluded:'Procedura przesądziła o możliwości wykorzystania części materiału. To, co budzi podejrzenie, nie zawsze wolno uznać za udowodnione.',
 miscarriage:'Zapadło krzywdzące rozstrzygnięcie. Pominięte sprzeczności nie zniknęły; do niewyjaśnionej śmierci Leny doszła odpowiedzialność za błędne oskarżenie.',
 other:'Decyzja zapadła. W aktach pozostały zarówno ustalenia, jak i pytania, którym nie udało się nadać pewnej odpowiedzi.'
};
const endings={
 solid:{facts:'Zamykasz akta tam, gdzie kończą się źródła. W tej sprawie udało się zbudować argumentację, która oparła się kontrargumentom; żadna wygrana nie usprawiedliwia jednak pomijania wątpliwości.',doubts:'W dopisku zostają granice wiedzy: to, co dokumenty ustaliły, i to, czego nie potwierdzają. Mocny akt nie wymaga udawania wszechwiedzy.',people:'Przez chwilę widzisz nie paragrafy, lecz osoby, które musiały opowiedzieć o tej nocy. Przedmiotem postępowania pozostaje śmierć Leny, nie sam sukces śledczego.'},
 weak:{facts:'Ostatnia karta nie zamienia słabych powiązań w pewne fakty. Pozostawiasz wyraźną granicę między materiałem a przypuszczeniem.',doubts:'W aktach zapisujesz to, co wymaga dalszego sprawdzenia, nie obiecując rozstrzygnięcia. Niewygodna niepewność jest uczciwsza niż pozorna odpowiedź.',people:'Zamknięcie tej próby oskarżenia nie zamyka znaczenia śmierci Leny. Po drugiej stronie każdej nieudowodnionej tezy są również czyjeś życie i reputacja.'},
 acquittal:{facts:'Nie wystarczy wskazać kogoś, wokół kogo gromadzą się podejrzenia. Dokumenty pozostają dokumentami, nie dowodem ponad swój rzeczywisty zakres.',doubts:'Otwarta wątpliwość pozostaje w aktach bez dopisanego nazwiska. Ta decyzja ma znaczenie właśnie dlatego, że odmawia udawania pewności.',people:'Za słowem „uniewinnienie” stoi człowiek, którego nie wolno osądzać domysłami. Za nierozwiązaną sprawą nadal stoi Lena.'},
 returned:{facts:'W spisie materiałów oddzielasz rzeczy sprawdzone od tych, do których trzeba wrócić. Akta nie są jeszcze kompletną odpowiedzią.',doubts:'Ostatnia strona zamienia się w listę pytań, nie obietnic. Kolejna decyzja musi oprzeć się na źródłach, których dziś zabrakło.',people:'Powrót akt nie ukoi bólu, ale pochopna pewność mogłaby go tylko pogłębić. Czasem najtrudniej powiedzieć: jeszcze nie wiemy.'},
 excluded:{facts:'W aktach pozostaje ślad błędów proceduralnych. Żadne przekonanie śledczego nie usuwa ograniczeń materiału.',doubts:'Nie wiadomo, jaki byłby wynik bez uchybień. Na ostatniej stronie zostawiasz tę niewiedzę bez wygodnego dopowiedzenia.',people:'Proceduralny skrót nie jest abstrakcyjny. Uderza w wiarygodność postępowania i w ludzi oczekujących sprawiedliwego rozstrzygnięcia.'},
 miscarriage:{facts:'Dopiero teraz widoczny jest koszt uznania poszlak za rozstrzygający dowód. Zapisujesz, które ograniczenia zostały zignorowane.',doubts:'Pytania, które odsunięto, wracają po rozstrzygnięciu. Każde z nich ma większy ciężar, gdy konsekwencje poniósł niewinny człowiek.',people:'W tej wersji wydarzeń śledztwo nie ochroniło ani prawdy o Lenie, ani niewinnie oskarżonej osoby. To nie jest triumfalny koniec sprawy.'}
};
function fresh(){return {lens:'facts'};}
function state(){const s=STATE.sim.final72 ||= fresh();if(!Object.prototype.hasOwnProperty.call(lenses,s.lens))s.lens='facts';return s;}
const after=by('ps70Afterword');if(!after)return;
const last=document.createElement('section');last.id='ps72Last';last.hidden=true;last.setAttribute('aria-label','Ostatnia karta akt');
last.innerHTML='<div class="eyebrow">OSTATNIA KARTA AKT</div><h4 id="ps72Title"></h4><p class="ps72-lead" id="ps72Lead"></p><div class="ps72-facts"><div class="ps72-fact"><b>Wnioski, które przetrwały sprawdzenie</b><p id="ps72Established"></p></div><div class="ps72-fact"><b>Ślad rozmów</b><p id="ps72Human"></p></div></div><p class="ps72-choice-label">Na czym zatrzymasz ostatnią myśl?</p><div class="ps72-choices" role="group" aria-label="Ostatni akcent opowieści"><button type="button" data-ps72="facts">To, co potwierdzone</button><button type="button" data-ps72="doubts">To, czego nie ustalono</button><button type="button" data-ps72="people">Ludzie poza aktami</button></div><p class="ps72-outro" id="ps72Outro" aria-live="polite"></p>';
after.appendChild(last);
last.querySelectorAll('[data-ps72]').forEach(btn=>btn.addEventListener('click',()=>{state().lens=btn.dataset.ps72;render();}));
function available(){return new Set(window.PS69_STORY.available());}
function evidenceLine(){
 const a=available(),titles=window.PS69_STORY.chapters.filter(c=>a.has(c.id)).map(c=>c.title);
 const checks=typeof fcChecks==='function'?fcChecks():[];
 if(titles.length){const lead=titles.slice(0,2).join(' oraz ');return 'Zweryfikowano powiązanie: '+lead+'. To punkty oparcia rekonstrukcji, lecz same nie przesądzają o całym przebiegu zdarzenia.';}
 const solid=checks.filter(x=>x.ok);
 if(solid.length)return 'Utrwalono: '+solid.map(x=>x.label.toLowerCase()).slice(0,2).join(' oraz ')+'. Te czynności nie zastępują brakującej identyfikacji ani oceny wszystkich źródeł.';
 return 'W aktach są materiały, ale nie odtworzono wystarczającej liczby niezależnych powiązań, by wyprowadzić z nich pełną rekonstrukcję.';
}
function voiceLine(){
 const a=available(),heard=window.PS69_STORY.state().heard||[];
 const valid=heard.filter(tag=>{if(typeof tag!=='string')return false;const [beat,id]=tag.split('/');return a.has(beat)&&CONTENT.characters.some(c=>c.id===id);});
 if(valid.length){const [beat,id]=valid.at(-1).split('/'),person=CONTENT.characters.find(c=>c.id===id),chapter=window.PS69_STORY.chapters.find(c=>c.id===beat);return 'W przesłuchaniu '+person.name+' powrócił temat „'+(chapter?.title||'połączonych ustaleń')+'”. Reakcja świadka jest częścią historii, nie samodzielnym dowodem winy.';}
 const spoken=CONTENT.characters.filter(c=>(STATE.dialogues?.[c.id]||[]).some(m=>m.role==='player'));
 if(spoken.length)return 'Przesłuchano '+(spoken.length===1?'jedną osobę':'kilka osób')+'. Relacje zostały zapisane, lecz żadne połączone ustalenie nie zostało im przedstawione w tej części dochodzenia.';
 return 'Nie przeprowadzono przesłuchania, które można by przywołać w końcowej relacji. Cisza świadków nie jest dowodem.';
}
function render(){
 const trial=STATE.sim?.trial||null;
 last.hidden=!trial||after.hidden;
 if(!trial||after.hidden)return;
 const kind=Object.prototype.hasOwnProperty.call(headings,trial.kind)?trial.kind:'other',lens=state().lens;
 by('ps72Title').textContent=headings[kind];
 by('ps72Lead').textContent=intros[kind];
 by('ps72Established').textContent=evidenceLine();
 by('ps72Human').textContent=voiceLine();
 const baseline=(endings[kind]||endings.weak)[lens];
 by('ps72Outro').textContent=baseline;
 last.querySelectorAll('[data-ps72]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ps72===lens)));
}
function beforeDecision(){
 const area=by('simHearingDetail');if(!area)return;
 const button=area.querySelector('[data-sim-continue]');if(!button)return;
 let box=by('ps72Before');if(!box){box=document.createElement('aside');box.id='ps72Before';box.setAttribute('aria-label','Przed decyzją');box.innerHTML='<h4>Zanim zamkniesz przewód</h4><p id="ps72BeforeText"></p>';}
 button.closest('.formline')?.before(box);
 const verdict=STATE.sim?.trial;
 box.hidden=!!verdict;
 if(verdict)return;
 const d=typeof simDefendEvaluation==='function'?simDefendEvaluation():null;
 const unpassed=d?.responses?.filter(x=>!x.passed)?.length||0;
 const ignored=STATE.sim?.ignoredTimeline;
 by('ps72BeforeText').textContent=ignored?'Wskazano pominięcie sprzeczności chronologii. Decyzja podjęta bez ich rozstrzygnięcia może mieć poważne skutki.':unpassed?'Nie wszystkie zarzuty obrony zostały odparte. Możesz jeszcze wrócić do źródeł albo przyjąć odpowiedzialność za niepełne oskarżenie.':'Zarzuty obrony zostały omówione. Pozostaje rozstrzygnąć, czy wszystkie ustalenia wytrzymują ciężar przedstawionego oskarżenia.';
}
// Wyłącznie istniejące zdarzenia: brak automatycznej sekwencji, nowych zasobów i nowych warunków zakończenia.
const oldHearing=simRenderHearing;
simRenderHearing=function(){const out=oldHearing.apply(this,arguments);beforeDecision();render();return out;};
const oldArc=window.PS70_ARC.render;
window.PS70_ARC.render=function(){const out=oldArc.apply(this,arguments);render();return out;};
registerNavigationHook({name:'last-case-page',after:render});

/* SaveManager: buildSave hook. */
registerSaveHook({name:"32-last-case-page-save1", build(__save){const out=__save;if(out.investigationSim)out.investigationSim.final72={lens:state().lens};return out;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"32-last-case-page-load1", apply(data){const out=undefined;const lens=data?.investigationSim?.final72?.lens;STATE.sim.final72={lens:Object.prototype.hasOwnProperty.call(lenses,lens)?lens:'facts'};beforeDecision();render();return out;}});
const oldReset=simReset;
simReset=function(){const out=oldReset.apply(this,arguments);STATE.sim.final72=fresh();beforeDecision();render();return out;};
state();beforeDecision();render();
})();
