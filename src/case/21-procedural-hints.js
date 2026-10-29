
/* Wskazówki proceduralne w aktach śledztwa. Bez zmiany stanu dowodów. */
(function(){'use strict';
 const topbar=document.querySelector('.topbar .right')||document.querySelector('.topbar');
 if(!topbar||typeof showTab!=='function')return;
 const helpText={
  overview:['Przegląd sprawy','Możesz zacząć od akt, rozmów albo oględzin. Gromadź ustalenia w dowolnej kolejności. Wątpliwości weryfikuj w niezależnych źródłach.'],
  evidence:['Akta','Otwieraj zdobyte materiały i oddzielaj zapisane w nich twierdzenia od faktów, które da się niezależnie potwierdzić.'],
  search:['Poszukiwania','Wybierz obszar, następnie opisz własnymi słowami dokument, ślad albo zdarzenie, które chcesz zbadać. Gdy materiał wymaga pracowni, poszukaj go w laboratorium.'],
  interview:['Przesłuchania','Pytaj własnymi słowami. Gdy świadek powołuje się na fakt, zapytaj o źródło. Dowód okazuj dopiero po sprawdzeniu jego pochodzenia i ograniczeń.'],
  timeline:['Oś czasu','Wybierz odkryte zdarzenie. Wskaż ramy czasowe, miejsce i przynajmniej jedno źródło; dopiero potem oceń zgodność z innymi wpisami.'],
  inspection12:['Oględziny','Wybierz strefę i obejrzyj ujęcia. Odkrywaj obiekty, dobieraj metodę badania, interpretuj obserwację i zapisuj własne wnioski.'],
  notebook:['Notatnik','Zapisuj wnioski, obserwacje i pytania wymagające sprawdzenia. Możesz do nich wrócić w dowolnym momencie śledztwa.'],
  labs:['Laboratorium','Wybierz jedną z pięciu pracowni. Etapy analizy i raport końcowy są osobnymi czynnościami. Porównuj wynik z materiałem niezależnym.'],
  deduction:['Dedukcja','Postaw własną hipotezę, oznacz rolę każdego źródła, rozważ kontrargument i sprawdź argumentację. Nie musisz znać jednej z góry narzuconej pary.'],
  final:['Finał','Zbuduj akt z dowodów rzeczywiście zdobytych. Sprawdź trzy filary dochodzenia i odpowiedz na zarzuty obrony. Nierozwiązane sprzeczności mają konsekwencje.']
 };
 const btn=document.createElement('button');btn.type='button';btn.className='ps603-help-button';btn.id='ps603HelpBtn';btn.textContent='?';btn.setAttribute('aria-label','Wskazówki proceduralne');btn.setAttribute('aria-expanded','false');topbar.append(btn);
 const help=document.createElement('aside');help.className='ps603-help';help.id='ps603Help';help.hidden=true;help.setAttribute('aria-label','Wskazówki proceduralne');
 help.innerHTML='<button type="button" class="ps603-help-close" aria-label="Zamknij wskazówki">×</button><div class="eyebrow">PROCEDURA ŚLEDCZA</div><h3 id="ps603HelpTitle"></h3><p id="ps603HelpText"></p><small>Wskazówki wyjaśniają sposób pracy z aktami, ale nie rozstrzygają sprawy.</small>';
 document.body.append(help);
 function helpUpdate(){const tab=STATE.tab||'overview',record=helpText[tab]||helpText.overview;document.getElementById('ps603HelpTitle').textContent=record[0];document.getElementById('ps603HelpText').textContent=record[1];}
 function closeHelp(){help.hidden=true;btn.setAttribute('aria-expanded','false');}
 btn.addEventListener('click',()=>{helpUpdate();help.hidden=!help.hidden;btn.setAttribute('aria-expanded',String(!help.hidden));if(!help.hidden)help.querySelector('.ps603-help-close').focus();});
 help.querySelector('.ps603-help-close').addEventListener('click',()=>{closeHelp();btn.focus();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!help.hidden)closeHelp();});
 registerNavigationHook({name:'procedural-hints',after:()=>{if(!help.hidden)helpUpdate();}});
})();
