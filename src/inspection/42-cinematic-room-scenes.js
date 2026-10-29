
/* Oprawa wizualna 8.7. Nie zmienia dowodów, odpowiedzi, kosztów ani rozstrzygnięć. */
(function(){
'use strict';
if(typeof STATE==='undefined'||typeof NPC8_PORTRAITS==='undefined')return;
const by=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let motionWanted=true;
try{motionWanted=localStorage.getItem('ps87-visual-motion')!=='off';}catch(e){}
let activeIssue=0,focusView=true,pendingQuestion=null,pendingDecision=null,pendingTrial=null,dialogTrial=null;
const lastReplies=new Map(CONTENT.characters.map(c=>[c.id,(STATE.dialogues[c.id]||[]).at(-1)]));
const currentCard=()=>by('ps54Hearing')?.querySelectorAll('.ps54-issue')[activeIssue];
const quiet=()=>!motionWanted||motionQuery.matches;
function motionSync(){
 document.body.classList.toggle('ps87-still',quiet());
 document.querySelectorAll('[data-ps87-motion]').forEach(btn=>{
  btn.textContent=motionQuery.matches?'Ruch ograniczony':motionWanted?'Animacje: włączone':'Animacje: wyłączone';
  btn.setAttribute('aria-pressed',String(!quiet()));btn.disabled=motionQuery.matches;
  btn.title=motionQuery.matches?'Zgodnie z ustawieniami ograniczenia ruchu w urządzeniu':'Włącz lub wyłącz ruch tła i animacje scen';
 });
}
function pageSync(){document.body.classList.toggle('ps87-tab-away',STATE.tab!=='interview');document.body.classList.toggle('ps87-page-hidden',document.hidden);}
function scrollTo(el){el?.scrollIntoView({block:'start',behavior:quiet()?'instant':'smooth'});}
function flash(el,cls){if(!el||quiet())return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);el.addEventListener('animationend',()=>el.classList.remove(cls),{once:true});}
function roomArt(svg){
 if(svg.querySelector('.ps87-room-art'))return;
 const group=document.createElementNS(svgNS,'g');group.setAttribute('class','ps87-room-art');group.setAttribute('aria-hidden','true');
 group.innerHTML='<path d="M247 40H310V245H247Z" fill="#102332" opacity=".55"/><path d="M252 45H305V239H252Z" fill="#8eacb0" opacity=".1"/><g class="ps87-wall-shadow" stroke="#071219" stroke-width="9" opacity=".45"><path d="M249 69H309M249 91H309M249 113H309M249 135H309M249 157H309M249 179H309M249 201H309M249 223H309"/></g><path d="M249 43V240M307 43V240" stroke="#729394" opacity=".2"/><path d="M77 0V35" stroke="#090f13" stroke-width="3"/><path d="M53 53L65 35Q77 28 89 35L101 53Z" fill="#131b1e" stroke="#b2a17a" stroke-opacity=".4"/><path d="M55 54H99" stroke="#e9d3a1" stroke-width="2" opacity=".75"/><path class="ps87-lamp-glow" d="M56 56L6 275H206L98 56Z" fill="#e5cc9c" opacity=".3" style="mix-blend-mode:soft-light"/><path d="M0 285H320V340H0Z" fill="#08131b" opacity=".14"/>';
 svg.querySelector('.wp-figure')?.before(group);
}
function enhanceRoom(){
 const chat=document.querySelector('#interview .chat');if(!chat)return;
 if(!by('ps87RoomToolbar')){
  const bar=document.createElement('div');bar.id='ps87RoomToolbar';bar.className='ps87-room-toolbar';
  bar.innerHTML='<span class="ps87-room-title"><i aria-hidden="true"></i>NOCNA ZMIANA · PRZESŁUCHANIE</span><button type="button" class="ps87-motion" data-ps87-motion aria-label="Animacje sali i scen finałowych"></button>';
  chat.prepend(bar);
 }
 const stage=by('witnessStage')?.querySelector('.wp-stage'),picture=stage?.querySelector('.wp-picture'),svg=picture?.querySelector('svg');
 if(!stage||!picture||!svg)return;
 roomArt(svg);
 if(!picture.querySelector('.ps87-light')){
  const layer=document.createElement('div');layer.className='ps87-light';layer.setAttribute('aria-hidden','true');picture.append(layer);
  const rim=document.createElement('div');rim.className='ps87-rim';rim.setAttribute('aria-hidden','true');picture.append(rim);
  const dust=document.createElement('div');dust.className='ps87-dust';dust.setAttribute('aria-hidden','true');
  dust.innerHTML=[[18,52,13,-4],[30,36,17,-10],[43,61,15,-7],[62,43,19,-2],[72,74,16,-12]].map(([x,y,d,t])=>`<i style="--x:${x}%;--y:${y}%;--duration:${d}s;--delay:${t}s"></i>`).join('');picture.append(dust);
 }
 const id=STATE.activeChar,last=(STATE.dialogues[id]||[]).at(-1),prior=lastReplies.get(id);
 if(last&&last!==prior&&last.role==='npc'){
  flash(by('chatLog')?.querySelector('.bubble.npc:last-child')||document.querySelector('#interview .chatlog .bubble.npc:last-child'),'ps87-new-reply');
  if(pendingQuestion&&pendingQuestion.id===id&&last!==pendingQuestion.last){
   const correction=(STATE.sim?.psych52?.history||[]).findLast(h=>h.id===id&&h.type==='correction'&&!pendingQuestion.history.has(h));
   if(correction){
    const cue=document.createElement('div');cue.className='ps87-room-cue';cue.setAttribute('role','status');
    const tag=document.createElement('b');tag.textContent='Zeznanie doprecyzowane';
    const text=document.createElement('span');text.textContent=PS52_THREADS[correction.issue]?.title||'Wyjaśnienie zapisano w protokole.';
    cue.append(tag,text);stage.append(cue);flash(stage,'ps87-impact');
   }
   pendingQuestion=null;
  }
 }
 lastReplies.set(id,last);motionSync();pageSync();
}
function captureQuestion(){
 const input=by('chatInput');if(!input?.value.trim())return;
 pendingQuestion={id:STATE.activeChar,last:(STATE.dialogues[STATE.activeChar]||[]).at(-1),history:new Set(STATE.sim?.psych52?.history||[])};
}
function applyFocus(scroll=false){
 const root=by('ps54Hearing');if(!root)return;
 const cards=[...root.querySelectorAll('.ps54-issue')];if(!cards.length)return;
 activeIssue=Math.min(cards.length-1,Math.max(0,activeIssue));
 cards.forEach((card,i)=>{card.hidden=focusView&&i!==activeIssue;card.classList.toggle('ps87-current',i===activeIssue);});
 root.querySelectorAll('[data-ps87-step]').forEach((btn,i)=>{if(i===activeIssue)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');});
 const toggle=root.querySelector('[data-ps87-view]');if(toggle){toggle.textContent=focusView?'Pokaż wszystkie zarzuty':'Skup widok na jednym zarzucie';toggle.setAttribute('aria-pressed',String(focusView));}
 const prev=root.querySelector('[data-ps87-prev]'),next=root.querySelector('[data-ps87-next]');if(prev)prev.disabled=activeIssue===0;
 if(next)next.textContent=activeIssue===cards.length-1?'Przejdź do decyzji →':'Następny zarzut →';
 const count=by('ps87StepCount');if(count)count.textContent=String(activeIssue+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
 if(scroll){scrollTo(cards[activeIssue]);cards[activeIssue].querySelector('.ps54-issuehead b')?.focus({preventScroll:true});}
}
function enhanceFinal(){
 const root=by('ps54Hearing');if(!root)return;
 if(!root.querySelector('.ps87-final-hero')){
  const cards=[...root.querySelectorAll('.ps54-issue')],passed=cards.filter(c=>c.classList.contains('passed')).length;
  const hero=document.createElement('div');hero.className='ps87-final-hero';
  hero.innerHTML=`<div class="ps87-final-eyebrow">OSTATNI KURS / KONFRONTACJA FINAŁOWA</div><h3>Niech przemówią akta.</h3><p>Sześć zarzutów. Każdy wymaga odpowiedzi, która wytrzyma porównanie ze źródłami.</p><div class="ps87-final-meta"><div class="ps87-final-score"><b>${passed} / ${cards.length}</b><span>zarzutów odpartych</span><small>· Zaufanie ${Number(STATE.sim?.trust)||0}%</small></div><button type="button" class="ps87-view-toggle" data-ps87-view></button></div>`;
  const nav=document.createElement('nav');nav.className='ps87-steps';nav.setAttribute('aria-label','Zarzuty finałowej konfrontacji');
  const labels=['Mechanizm','Motyw','Wiadomość','Dostęp','Alibi','Ślady'];
  cards.forEach((card,i)=>{
   const issue=PS54_ISSUES[i];card.id='ps87Issue_'+issue.id;card.dataset.ps87Issue=issue.id;
   const title=card.querySelector('.ps54-issuehead b');if(title){title.id='ps87IssueTitle_'+issue.id;title.tabIndex=-1;card.setAttribute('aria-labelledby',title.id);}
   const btn=document.createElement('button');btn.type='button';btn.className='ps87-step'+(card.classList.contains('passed')?' passed':'');btn.dataset.ps87Step=String(i);btn.setAttribute('aria-controls',card.id);
   btn.setAttribute('aria-label',(title?.textContent||labels[i])+(card.classList.contains('passed')?' — argument zabezpieczony':' — do rozpatrzenia'));
   btn.innerHTML=`<span>${String(i+1).padStart(2,'0')}<em aria-hidden="true">${card.classList.contains('passed')?'✓':'·'}</em></span>${labels[i]}`;nav.append(btn);
   const entry=STATE.sim?.process54?.arguments?.[issue.id],feedback=card.querySelector('.ps54-feedback');
   if(entry?.last&&feedback){const tag=document.createElement('b');tag.className='ps87-decision-tag';tag.textContent=card.classList.contains('passed')?'Argument utrwalony':'Argument wymaga ponownej oceny';feedback.prepend(tag);}
  });
  root.prepend(hero,nav);
  const controls=document.createElement('div');controls.className='ps87-step-controls';controls.innerHTML='<button type="button" data-ps87-prev>← Poprzedni zarzut</button><span id="ps87StepCount"></span><button type="button" data-ps87-next>Następny zarzut →</button>';
  root.querySelector('.ps54-procedure')?.before(controls);
 }
 applyFocus();
 const result=document.querySelector('#simHearingDetail .sim-trial-result');
 if(result&&!result.querySelector('[data-ps87-replay]')){
  const replay=document.createElement('button');replay.type='button';replay.className='btn alt ps87-replay';replay.dataset.ps87Replay='';replay.textContent='Odtwórz finałowy kadr';result.append(replay);
 }
 if(pendingDecision){
  const request=pendingDecision;pendingDecision=null;
  const list=STATE.sim?.process54?.decisions||[],last=list.at(-1);
  if(last&&last!==request.previous&&last.id===request.id){
   activeIssue=Math.max(0,PS54_ISSUES.findIndex(x=>x.id===last.id));applyFocus();const card=currentCard();flash(card,'ps87-reveal');
   const feedback=card?.querySelector('.ps54-feedback');if(feedback){feedback.tabIndex=-1;feedback.focus({preventScroll:true});}
  }
 }
 if(dialogTrial&&STATE.sim?.trial!==dialogTrial)by('ps87Verdict')?.close();
}
const dialog=document.createElement('dialog');dialog.id='ps87Verdict';dialog.setAttribute('aria-labelledby','ps87VerdictTitle');dialog.setAttribute('aria-describedby','ps87VerdictText');
dialog.innerHTML='<div class="ps87-verdict-scene"><button type="button" class="ps87-verdict-close" data-ps87-close aria-label="Zamknij finałowy kadr">×</button><div class="ps87-verdict-content"><div class="ps87-verdict-kicker">PRAWDZIWE ŚLEDZTWO / OSTATNI KURS</div><i class="ps87-verdict-rule" aria-hidden="true"></i><h2 id="ps87VerdictTitle" tabindex="-1"></h2><p id="ps87VerdictText"></p><div id="ps87VerdictDefense"></div><div class="ps87-verdict-actions"><button type="button" class="btn" data-ps87-reason>Przeczytaj uzasadnienie</button><button type="button" class="btn subtle" data-ps87-close>Wróć do akt</button></div></div></div>';
document.body.append(dialog);
function showVerdict(trial){
 if(!trial||trial!==STATE.sim?.trial||typeof dialog.showModal!=='function')return;
 dialogTrial=trial;by('ps87VerdictTitle').textContent=trial.title||'Rozstrzygnięcie sprawy';by('ps87VerdictText').textContent=trial.text||'';by('ps87VerdictDefense').textContent=trial.defense||'';
 if(!dialog.open)dialog.showModal();document.body.classList.add('ps87-dialog-open');by('ps87VerdictTitle').focus({preventScroll:true});
}
dialog.addEventListener('close',()=>{document.body.classList.remove('ps87-dialog-open');dialogTrial=null;const result=document.querySelector('#simHearingDetail .sim-trial-result h4');if(result){result.tabIndex=-1;result.focus({preventScroll:true});}});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.id==='chatSend')captureQuestion();
 if(target.hasAttribute('data-ps54-check')){
  pendingDecision={id:target.dataset.ps54Check,previous:(STATE.sim?.process54?.decisions||[]).at(-1)};
  setTimeout(()=>{enhanceFinal();pendingDecision=null;},0);
 }
 if(target.hasAttribute('data-sim-continue')){
  pendingTrial=STATE.sim?.trial;
  setTimeout(()=>{const trial=STATE.sim?.trial;enhanceFinal();if(trial&&trial!==pendingTrial)showVerdict(trial);pendingTrial=null;},0);
 }
},true);
document.addEventListener('keydown',e=>{if(e.target.id==='chatInput'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing)captureQuestion();},true);
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.hasAttribute('data-ps87-motion')){motionWanted=!motionWanted;try{localStorage.setItem('ps87-visual-motion',motionWanted?'on':'off');}catch(err){}motionSync();}
 if(target.hasAttribute('data-ps87-step')){activeIssue=Number(target.dataset.ps87Step);applyFocus(true);}
 if(target.hasAttribute('data-ps87-view')){focusView=!focusView;applyFocus();}
 if(target.hasAttribute('data-ps87-prev')){activeIssue--;applyFocus(true);}
 if(target.hasAttribute('data-ps87-next')){
  if(activeIssue>=PS54_ISSUES.length-1){const procedure=by('ps54Hearing')?.querySelector('.ps54-procedure');scrollTo(procedure);by('ps54Disclosure')?.focus({preventScroll:true});}
  else{activeIssue++;applyFocus(true);}
 }
 if(target.hasAttribute('data-ps87-replay'))showVerdict(STATE.sim?.trial);
 if(target.hasAttribute('data-ps87-close'))dialog.close();
 if(target.hasAttribute('data-ps87-reason')){dialog.close();scrollTo(document.querySelector('#simHearingDetail .sim-trial-result'));}
});
// Obserwacja gotowych widoków: logika gry zachowuje własną kolejność i walidację.
if(by('witnessStage'))new MutationObserver(enhanceRoom).observe(by('witnessStage'),{childList:true});
if(by('simHearingDetail'))new MutationObserver(enhanceFinal).observe(by('simHearingDetail'),{childList:true});
const interview=by('interview');if(interview)new MutationObserver(pageSync).observe(interview,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',pageSync);motionQuery.addEventListener('change',motionSync);
enhanceRoom();enhanceFinal();motionSync();pageSync();
})();

