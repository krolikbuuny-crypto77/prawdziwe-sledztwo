/* Pakiet 6.22: wspólny silnik mimiki dla sześciu portretów SVG.
 * Reżyseria wizualna, NIE analiza prawdomówności, sprawstwa ani nowa pamięć.
 * Nie odblokowuje materiałów, nie czyta kluczy API i nie zmienia GameState.
 */
(function(){
'use strict';
if(typeof npc8PortraitSvg!=='function'||typeof STATE==='undefined'||typeof CONTENT==='undefined')return;
const IDS=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const CHARACTER=Object.fromEntries(CONTENT.characters.filter(c=>IDS.includes(c.id)).map(c=>[c.id,c]));
const PROFILES={
 MAREK:{baseline:'controlled',tension:58,emphasis:'guarded',gaze:0},
 TOMASZ:{baseline:'uncertain',tension:49,emphasis:'uncertain',gaze:-1},
 JANUSZ:{baseline:'focused',tension:61,emphasis:'guarded',gaze:1},
 ELZBIETA:{baseline:'focused',tension:59,emphasis:'sad',gaze:-1},
 KAMIL:{baseline:'focused',tension:69,emphasis:'focused',gaze:1},
 MAGDALENA:{baseline:'controlled',tension:70,emphasis:'controlled',gaze:0}
};
const LABELS={neutral:'neutralność',focused:'skupienie',uncertain:'niepewność',tense:'napięcie',guarded:'defensywność',surprised:'zaskoczenie',sad:'smutek',relieved:'ulga',controlled:'kontrolowany spokój',irritated:'irytacja'};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const blame=/(?:klamiesz|klamala|klamal|zabil[ae]|zamordowal|przyznaj sie|twoja wina|jestes winna)/;
const detail=/(?:skad wiesz|co potwierdza|jaki dowod|jakie zrodlo|czy widziales|czy widzialas|chronolog|o ktorej)/;
const lena=/(?:lena|leny|lenie|ostrzezen|smierc)/;
const apology=/(?:przepraszam|wybacz|cofam zarzut)/;
function derive(id, options={}){
 const p=PROFILES[id];if(!p)return {emotion:'neutral',gaze:0,speaking:false};
 const st=typeof NPC4_STATE!=='undefined'?NPC4_STATE?.[id]:null;
 const raw=(STATE.dialogues?.[id]||[]).slice(-3),questions=raw.filter(x=>x?.role==='player');
 const latestQuestion=options.question??questions.at(-1)?.text??'';
 const q=normalize(latestQuestion);
 const attached=options.attachedEvidence || /\[Okazano: ([A-Z0-9_.-]+)\]/.exec(latestQuestion)?.[1] || '';
 const evidencePresent=!!(attached && STATE.found?.has?.(attached));
 const tension=Math.max(0,Math.min(100,Number(st?.tension)||0));
 const fatigue=Math.max(0,Math.min(100,Number(st?.fatigue)||0));
 const reaction=typeof window.PS620_SCENES?.signals==='function'?window.PS620_SCENES.signals(id):null;
 const pressure=blame.test(q)||(reaction?.stage==='pressure');
 const evidenceShock=evidencePresent&&tension>=p.tension;
 const speaking=raw.at(-1)?.role==='npc' || raw.at(-1)?.role==='witness';
 let emotion=p.baseline;
 if(fatigue>=72)emotion='uncertain';
 if(evidenceShock)emotion='surprised';
 else if(pressure&&tension>=p.tension)emotion=id==='MAGDALENA'?'controlled':id==='KAMIL'?'irritated':'tense';
 else if(pressure)emotion=p.emphasis==='sad'?'guarded':p.emphasis;
 else if(lena.test(q)&&(id==='ELZBIETA'||id==='TOMASZ')&&tension>=40)emotion='sad';
 else if(detail.test(q))emotion='focused';
 else if(apology.test(q)&&tension<60)emotion='relieved';
 else if(tension>=p.tension+12)emotion='guarded';
 return {emotion,gaze:p.gaze, speaking:!!speaking, reason:evidenceShock?'documented-confrontation':pressure?'question-pressure':detail.test(q)?'factual-question':'baseline'};
}
const MOUTH={
 neutral:'M143 192Q159 191 176 192',focused:'M144 193Q159 191 175 193',
 uncertain:'M144 193Q159 197 175 193',tense:'M145 193Q159 190 174 193',
 guarded:'M143 193Q159 193 175 192',surprised:'M149 193Q160 200 171 193',
 sad:'M144 194Q159 199 176 194',relieved:'M144 192Q159 197 175 192',
 controlled:'M145 193Q159 192 174 193',irritated:'M146 192Q159 190 173 192'
};
function animate(root,id,opts={}){
 if(!root||!PROFILES[id])return null;
 const data=derive(id,opts);root.dataset.ps622Emotion=data.emotion;
 root.style.setProperty('--ps622-gaze',String(data.gaze)+'px');
 root.classList.toggle('ps622-speaking',Boolean(data.speaking));
 // SVG elements remain the same characters across every emotional state.
 root.querySelectorAll('.wp-mouth-curve').forEach(path=>path.setAttribute('d',MOUTH[data.emotion]||MOUTH.neutral));
 if(root.matches('.wp-stage')){
  const picture=root.querySelector('.wp-picture');
  if(picture)picture.setAttribute('aria-label','Portret: '+CHARACTER[id].name+'. Mimika: '+LABELS[data.emotion]+'. Emocja nie jest dowodem winy.');
 }
 return data;
}
function refreshCurrent(){
 const id=STATE.activeChar,stage=document.querySelector('#witnessStage .wp-stage');
 if(!stage||!IDS.includes(id))return;
 animate(stage,id);
}
// Portraits appear only for witnesses attached to an existing, already unlocked breakthrough.
const SCENES={
 'Kurs, który wyprzedził papier':['MAREK','JANUSZ'],
 'Ostrzeżenie, które nie zatrzymało obiegu':['ELZBIETA','MAGDALENA'],
 'Przepustka nie ma twarzy':['KAMIL','MAGDALENA'],
 'Między powrotem a wiadomością':['TOMASZ','MAREK'],
 'Kontakt to nie opis śmierci':['ELZBIETA','MAGDALENA'],
 'Nie jeden błąd, lecz dwa łańcuchy':['MAREK','ELZBIETA'],
 'Alibi złożone z cudzych zegarów':['KAMIL','MAGDALENA'],
 'Ostatnia wiadomość nie ma sprawcy':['MAGDALENA','ELZBIETA']
};
function card(id,emotion){
 const c=CHARACTER[id];if(!c)return null;
 const card=document.createElement('figure');card.className='ps622-face-card';card.dataset.witness=id;
 const view=document.createElement('div');view.className='ps622-face-view';view.innerHTML=npc8PortraitSvg(c,false,{cls:'is-neutral'});
 const caption=document.createElement('figcaption');caption.textContent=c.name;
 card.append(view,caption);animate(card,id,{question:''});
 if(emotion){card.dataset.ps622Emotion=emotion;card.querySelectorAll('.wp-mouth-curve').forEach(x=>x.setAttribute('d',MOUTH[emotion]||MOUTH.neutral));}
 return card;
}
function renderStory(){
 const curtain=document.getElementById('ps85Curtain');if(!curtain||curtain.hidden)return;
 const title=document.getElementById('ps85FilmTitle')?.textContent||'';
 const people=SCENES[title]||[];const stage=curtain.querySelector('.ps85-stage');if(!stage)return;
 let area=document.getElementById('ps622SceneFaces');
 if(!area){area=document.createElement('div');area.id='ps622SceneFaces';area.className='ps622-face-row';area.setAttribute('aria-label','Reakcje postaci');
 const actions=document.getElementById('ps85FilmActions');actions?.insertAdjacentElement('beforebegin',area);}
 if(area.dataset.scene===title)return;
 area.replaceChildren();area.dataset.scene=title;
 people.forEach((id,i)=>{const x=card(id,i?'guarded':'focused');if(x)area.append(x);});
}
function renderFinale(){
 const trial=STATE.sim?.trial;const root=document.getElementById('psFinalEpilogue')||document.getElementById('simHearingDetail');
 if(!root||!trial)return;
 let area=document.getElementById('ps622FinalFaces');
 if(!area){area=document.createElement('section');area.id='ps622FinalFaces';area.className='ps622-finale-faces';
 const h=document.createElement('h4');h.textContent='Reakcje po zakończeniu śledztwa';area.append(h);
 const row=document.createElement('div');row.className='ps622-face-row';area.append(row);root.append(area);}
 const row=area.querySelector('.ps622-face-row');if(!row||row.childElementCount)return;
 // No guilty-looking facial shortcut: same neutral, restrained reaction regardless of verdict.
 for(const id of ['ELZBIETA','MAGDALENA']){const x=card(id,'controlled');if(x)row.append(x);}
}
// App's rendering function is the only place that may replace the main portrait.
// Scene listeners are intentionally passive: no state mutations or evidence events.
const curtain=document.getElementById('ps85Curtain');
if(curtain){
 const observer=new MutationObserver(renderStory);
 observer.observe(curtain,{attributes:true,attributeFilter:['hidden']});
 const heading=document.getElementById('ps85FilmTitle');
 if(heading)observer.observe(heading,{subtree:true,characterData:true,childList:true});
}
if(typeof simRenderHearing==='function'){
 const prior=simRenderHearing;
 simRenderHearing=function(){const result=prior.apply(this,arguments);renderFinale();return result;};
}
const prefers=window.matchMedia?.('(prefers-reduced-motion: reduce)');
window.PS622_FACES=Object.freeze({derive,animate,refreshCurrent,renderStory,renderFinale,
 sceneTitles:Object.freeze(Object.keys(SCENES)),profiles:Object.freeze(PROFILES),
 reducedMotion:()=>!!prefers?.matches});
refreshCurrent();
})();
