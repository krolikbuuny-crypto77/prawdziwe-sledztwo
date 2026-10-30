
(function(){
 'use strict';
 const root=document.getElementById('deduction'),work=root?.querySelector('.dd-work'),editor=root?.querySelector('.dd-editor-panel'),sources=root?.querySelector('.dd-source-panel');
 if(!root||!work||!editor||!sources||document.getElementById('ux4Guide'))return;
 const get=id=>document.getElementById(id),field=id=>get(id).closest('.dd-field');
 const firstField=field('dedTitle'),head=editor.querySelector('.dd-panel-head'),actions=get('dedSave').closest('.dd-editor-actions');
 const guide=document.createElement('section');guide.id='ux4Guide';guide.className='ux4-guide';guide.setAttribute('aria-label','Dedukcja krok po kroku');
 guide.innerHTML='<div class="ux4-guide-title"><div><div class="eyebrow">WARSZTAT DEDUKCJI</div><h3>Ułóż własne rozumowanie</h3><p>Trzy kroki porządkują pracę. Możesz wracać i zmieniać zdanie; żadna odpowiedź nie jest uzupełniana automatycznie.</p></div><span class="ux4-count" id="ux4DraftCount">0 źródeł</span></div><nav class="ux4-steps" aria-label="Kroki budowania hipotezy"><button type="button" class="ux4-step-button" data-ux4-step="1"><span class="ux4-step-number">1</span><span class="ux4-step-copy"><strong>Hipoteza</strong><small>Co podejrzewasz?</small></span></button><button type="button" class="ux4-step-button" data-ux4-step="2"><span class="ux4-step-number">2</span><span class="ux4-step-copy"><strong>Dowody</strong><small>Co ją potwierdza?</small></span></button><button type="button" class="ux4-step-button" data-ux4-step="3"><span class="ux4-step-number">3</span><span class="ux4-step-copy"><strong>Kontrargument</strong><small>Co może ją podważyć?</small></span></button></nav><p class="ux4-step-help" id="ux4StepHelp" role="status" aria-live="polite"></p><div class="ux4-nav" id="ux4TopNav"></div>';
 root.querySelector('.dd-head').insertAdjacentElement('afterend',guide);
 const wrap=(id,label)=>{const n=document.createElement('div');n.id=id;n.className='ux4-step-section';n.innerHTML='<h4 class="ux4-panel-heading">'+label+'</h4>';return n;};
 const step1=wrap('ux4Step1','Krok 1 · Zapisz swoją hipotezę'),step2=wrap('ux4Step2','Krok 2 · Wybierz i oceń źródła'),step3=wrap('ux4Step3','Krok 3 · Sprawdź konkurencyjne wyjaśnienie');
 editor.insertBefore(step1,firstField);
 for(const id of ['dedTitle','dedKind','dedStatement'])step1.appendChild(field(id));
 editor.insertBefore(step2,actions);
 step2.insertAdjacentHTML('beforeend','<p class="ux4-section-note">Dodaj zgromadzone dokumenty lub wypowiedzi z listy po lewej. Wybierz rolę każdego źródła i napisz, dlaczego ma znaczenie. Bez dowodów nie zapiszesz karty.</p>');
 step2.appendChild(head);
 const linksDescription=get('dedLinks').previousElementSibling;if(linksDescription)step2.appendChild(linksDescription);
 step2.appendChild(get('dedLinks'));
 editor.insertBefore(step3,actions);
 step3.insertAdjacentHTML('beforeend','<p class="ux4-section-note">Rozważ, co może obalić tezę i jak to sprawdzić. Wcześniejsze kroki pozostają do edycji; system nadal ocenia jakość rozumowania według dotychczasowych zasad.</p>');
 for(const id of ['dedAlternative','dedTest'])step3.appendChild(field(id));
 const rivalDetails=document.createElement('details');rivalDetails.className='ux4-optional';rivalDetails.innerHTML='<summary>Powiąż z inną hipotezą (opcjonalnie)</summary>';rivalDetails.appendChild(field('dedRival'));step3.appendChild(rivalDetails);
 const navBottom=document.createElement('div');navBottom.id='ux4BottomNav';navBottom.className='ux4-nav';editor.insertBefore(navBottom,actions);
 const tip=document.createElement('details');tip.id='ux4Guidance';tip.className='ux4-disclosure';tip.innerHTML='<summary>Zasady pracy i stan analiz</summary>';
 for(const node of [get('cross3DedPrompt'),root.querySelector('.dd-note'),get('dedMetrics')])if(node)tip.appendChild(node);
 guide.insertAdjacentElement('afterend',tip);
 const advanced=document.createElement('details');advanced.id='ux4Advanced';advanced.className='ux4-disclosure';advanced.innerHTML='<summary>Zaawansowana sieć powiązań i analizy dodatkowe</summary>';
 for(const id of ['simGraph','simAudit51','ps53Narrative','ps69Breakthroughs','ps85Stories'])if(get(id))advanced.appendChild(get(id));
 const board=document.createElement('details');board.id='ux4Board';board.className='ux4-disclosure';board.innerHTML='<summary>Moje zapisane karty <span id="ux4BoardCount">0 kart</span></summary>';
 const boardHead=root.querySelector('.dd-board-head'),boardBody=get('dedBoard'),boardFoot=boardBody.nextElementSibling;
 if(boardHead)board.appendChild(boardHead);if(boardBody)board.appendChild(boardBody);if(boardFoot?.tagName==='P')board.appendChild(boardFoot);
 work.after(board);board.after(advanced);
 const storyShortcut=root.querySelector('.ps53-jump');if(storyShortcut)advanced.appendChild(storyShortcut);
 let step=1;
 const explain={1:'Sformułuj, co wynika z materiałów. Nie trzeba od razu znać odpowiedzi ani wskazywać sprawcy.',2:'Połącz hipotezę z faktycznie zdobytymi materiałami. Oznacz, co wspiera, ogranicza lub podważa wniosek.',3:'Rozważ inną interpretację i sposób weryfikacji. Następnie zapisz kartę i sprawdź argumentację.'};
 function navHTML(){return '<button type="button" class="btn alt" data-ux4-nav="back" '+(step===1?'disabled':'')+'>Wstecz</button><button type="button" class="btn" data-ux4-nav="next" '+(step===3?'data-ux4-final="1"':'')+'>'+({1:'Do dowodów',2:'Do kontrargumentu',3:'Do zapisu / oceny'})[step]+'</button><small>Możesz też wybrać krok u góry. Edycja nie usuwa wcześniej wpisanych danych.</small>';}
 function refresh(){
   for(const el of [step1,step2,step3])el.hidden=el.id!=='ux4Step'+step;
   sources.hidden=step!==2;work.classList.toggle('ux4-one-column',step!==2);
   actions.hidden=step!==3;get('dedFeedback').hidden=step!==3;get('dd2Review').hidden=step!==3||get('dd2Review').innerHTML==='';
   get('ux4StepHelp').textContent=explain[step];
   const draft=STATE.deduction?.draft||{links:[]};
   get('ux4DraftCount').textContent=psCount((draft.links||[]).length,'źródło','źródła','źródeł')+' w hipotezie';
   get('ux4BoardCount').textContent=psCount((STATE.deduction?.cards||[]).length,'karta','karty','kart');
   guide.querySelectorAll('[data-ux4-step]').forEach(b=>{const a=Number(b.dataset.ux4Step)===step;b.setAttribute('aria-current',a?'step':'false');b.setAttribute('aria-pressed',String(a));});
   get('ux4TopNav').innerHTML=navHTML();navBottom.innerHTML=navHTML();
 }
 function selectStep(n,{scroll=false}={}){const next=Math.max(1,Math.min(3,Number(n)||1));step=next;refresh();if(scroll)guide.scrollIntoView({behavior:'instant',block:'start'});}
 root.addEventListener('click',e=>{
  const action=e.target.closest('[data-ux4-step],[data-ux4-nav]');
  if(action&&root.contains(action)){
    if(action.dataset.ux4Step)selectStep(action.dataset.ux4Step,{scroll:true});
    if(action.dataset.ux4Nav==='next'){if(step===3){get('dedSave').scrollIntoView({behavior:'smooth',block:'center'});}else selectStep(step+1,{scroll:true});}
    if(action.dataset.ux4Nav==='back')selectStep(step-1,{scroll:true});
  }
  // Istniejące skróty do sieci intryg muszą otwierać zwiniętą sekcję.
  if(e.target.closest('.ps53-jump'))advanced.open=true;
 },true);
 // Zachowujemy oryginalne funkcje zapisu/odczytu, walidacji i oceny.
 const earlierRender=dedRender;
 dedRender=function(){earlierRender();refresh();};
 const earlierSelect=dedSelect;
 dedSelect=function(id){earlierSelect(id);selectStep(1);};
 const earlierAdd=dedAddSource;
 dedAddSource=function(key){earlierAdd(key);refresh();};
 root.addEventListener('input',e=>{if(e.target.closest('.dd-editor-panel'))get('ux4DraftCount').textContent=psCount((STATE.deduction?.draft?.links||[]).length,'źródło','źródła','źródeł')+' w hipotezie';});
 get('dedSave').addEventListener('click',()=>{if(STATE.deduction.selected&&!STATE.deduction.dirty){board.open=true;refresh();}},false);
 // Otwierając zapisany wniosek, gracz trafia do jego pierwszego kroku.
 root.addEventListener('click',e=>{if(e.target.closest('[data-dd-edit]'))selectStep(1);},false);
 refresh();
 window.UX4_DEDUCTION={go:selectStep,state:()=>({step,advancedOpen:advanced.open,boardOpen:board.open,cardCount:STATE.deduction.cards.length})};
})();
