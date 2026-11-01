/* RC41 — an automatic, evidence-scoped reconstruction. Presentation only.
 * No writes to STATE, authority, evidence unlocks, verdict or SaveManager.
 * Coop re-renders the panel from the verified mirrored snapshot already in STATE.
 */
(()=>{
 'use strict';
 const host=document.getElementById('timeline');
 const anchor=host?.querySelector('.tl-metrics');
 if(!host||!anchor||typeof TL_EVENTS==='undefined'||typeof STATE==='undefined')return;
 const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
 const root=make('section','ps41-auto');root.id='ps41AutoTimeline';root.setAttribute('aria-label','Automatyczna oś czasu odkrytych wydarzeń');
 const head=make('div','ps41-head');
 const title=make('h3','','Automatyczna oś czasu');
 const intro=make('p','','Oś aktualizuje się na podstawie zdobytych dokumentów i zapisanych przesłuchań. Nie uzupełnia brakujących faktów, nie zmienia ręcznej rekonstrukcji ani werdyktu.');
 const stats=make('div','ps41-stats');stats.setAttribute('role','status');stats.setAttribute('aria-live','polite');
 head.append(title,intro,stats);
 const controls=make('div','ps41-controls');
 const filter=make('select','input');filter.id='ps41Filter';filter.setAttribute('aria-label','Filtr automatycznej osi czasu');
 [['all','Wszystkie źródła'],['document','Zdarzenia z dokumentów'],['witness','Wypowiedzi świadków'],['conflict','Wymagające porównania']].forEach(([v,l])=>{const o=make('option','',l);o.value=v;filter.append(o);});
 const query=make('input','input');query.type='search';query.id='ps41Query';query.maxLength=80;query.placeholder='Szukaj na osi…';query.setAttribute('aria-label','Szukaj na automatycznej osi czasu');
 const refresh=make('button','btn alt','Odśwież oś');refresh.type='button';
 controls.append(filter,query,refresh);
 const caveat=make('p','ps41-caveat','Zdarzenia z akt: godzina podana w odkrytym materiale, bez przypisywania osoby. Zeznania: jedynie dosłowna wzmianka o godzinie, niezweryfikowana i bez potwierdzonej daty. Rozbieżność wymaga oceny śledczego.');
 const output=make('div','ps41-list');output.id='ps41List';
 root.append(head,controls,caveat,output);
 anchor.before(root);
 const DATE_MIN='2026-11-17T18:00',DATE_MAX='2026-11-18T06:00';
 const format=(iso,until)=>{const part=(value)=>value.slice(8,10)+'.11 · '+value.slice(11,16);return part(iso)+(until?' – '+part(until):'');};
 const fold=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const witnessTime=/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;
 const eventRules=[
  ['e16',/\b(?:zgon\w*|smier\w*|zmar\w*|czasu\s+zgonu)\b/],
  ['e17',/\b(?:czujnik\w*\s+(?:stanowisk\w*\s*)?(?:nr\s*)?3|impuls\w*\s+mechaniczn\w*)\b/],
  ['e10',/\b(?:sesj\w*\s+diagnostyczn\w*|test\w*\s+diagnostyczn\w*)\b/],
  ['e18',/\b(?:alarm\w*\s+medyczn\w*|wezwani\w*\s+(?:medyczn\w*|ratunk\w*))\b/]
 ];
 const sameMinute=(a,b)=>a.slice(11,16)===b.slice(11,16);
 function dayForTime(time){ // Presentation-only placement on the night's axis, NOT a confirmed date.
  const hour=Number(time.slice(0,2));
  if(hour>=18)return '2026-11-17T'+time;
  if(hour<=6)return '2026-11-18T'+time;
  return null;
 }
 function extractWitness(c,m,index){
  if(m?.role!=='npc'||typeof m.text!=='string'||index===0)return [];
  const result=[];const text=m.text.slice(0,2500);let match;
  const seen=new Set();
  while((match=witnessTime.exec(text))!==null&&result.length<3){
   const time=match[0].padStart(5,'0');if(seen.has(time))continue;seen.add(time);
   const iso=dayForTime(time);if(!iso||iso<DATE_MIN||iso>DATE_MAX)continue;
   const left=Math.max(0,match.index-125),right=Math.min(text.length,match.index+130);
   const snippet=(left?'…':'')+text.slice(left,right).replace(/\s+/g,' ').trim()+(right<text.length?'…':'');
   const near=fold(text.slice(Math.max(0,match.index-95),Math.min(text.length,match.index+95)));
   const lead=fold(text.slice(Math.max(0,match.index-26),match.index));
   const approximate=/(?:okolo|mniej wiecej|gdzies|przed|po|najpozniej|nie wczesniej niz|chyba|miedzy)\s*$/.test(lead);
   const mentions=[];
   for(const [id,regex] of eventRules){
    if(!regex.test(near))continue;
    const event=TL_EVENTS.find(e=>e.id===id&&e.sources.some(s=>STATE.found.has(s)));
    if(!event)continue;
    const mismatch=event.until?(iso<event.from||iso>event.until):!sameMinute(iso,event.from);
    if(mismatch)mentions.push(event.title);
   }
   result.push({kind:'witness',id:'w:'+c.id+':'+index+':'+time,at:iso,time,source:c.name,char:c.id,turn:index,
    label:'Godzina wspomniana w wypowiedzi: '+time,snippet,until:'',issues:mentions,
    marker:approximate?'Przybliżona relacja świadka · niepotwierdzona data':'Twierdzenie świadka · niepotwierdzona data'});
  }
  witnessTime.lastIndex=0;
  return result;
 }
 function collect(){
  const docs=[];for(const e of TL_EVENTS){const ids=e.sources.filter(id=>STATE.found.has(id)&&byId[id]);if(!ids.length)continue;
   const manual=STATE.timeline11?.entries?.[e.id];
   const diff=!!(manual?.at&&(manual.at!==e.from||(e.until&&manual.to!==e.until)));
   docs.push({kind:'document',id:e.id,at:e.from,until:e.until,label:e.title,
    source:ids.map(id=>byId[id].title||id).join(' · '),ids,place:TL_PLACES[e.place]||'Nieustalone',
    caution:e.caution,issues:diff?['Godzina różni się od Twojej ręcznej rekonstrukcji']:[],
    marker:e.until?'Potwierdzony przedział w źródle':'Znacznik czasu z dokumentu'});
  }
  const claims=[];for(const c of CONTENT.characters){
   const messages=STATE.dialogues?.[c.id]||[];
   for(let i=1;i<messages.length;i++)claims.push(...extractWitness(c,messages[i],i));
  }
  return [...docs,...claims].sort((a,b)=>a.at.localeCompare(b.at)||Number(a.kind==='witness')-Number(b.kind==='witness')||a.id.localeCompare(b.id));
 }
 function openDoc(id){
  if(!STATE.found.has(id)||!byId[id])return;
  const input=document.getElementById('filterDocs'),category=document.getElementById('filterCategory');
  if(input)input.value='';if(category)category.value='';
  if(typeof activeEvidenceType!=='undefined')activeEvidenceType='all';
  activeDoc=id;showTab('evidence');renderDocs();
  document.getElementById('docPaper')?.scrollIntoView({block:'start',behavior:'smooth'});
 }
 function openWitness(char,index){
  const log=STATE.dialogues?.[char]||[];if(!log.length)return;
  STATE.activeChar=char;
  // Restore the requested earlier line in the same scrollable transcript.
  if(typeof CHAT_VISIBLE!=='undefined')CHAT_VISIBLE[char]=Math.max(CHAT_VISIBLE[char]||120,log.length);
  showTab('interview');renderChat();
  requestAnimationFrame(()=>document.querySelectorAll('#chatLog .bubble')[index]?.scrollIntoView({block:'center',behavior:'smooth'}));
 }
 function renderItem(item){
  const row=make('article','ps41-event ps41-'+item.kind+(item.issues.length?' ps41-flag':''));
  row.dataset.kind=item.kind;
  const mark=make('div','ps41-time',format(item.at,item.until));
  const body=make('div','ps41-body');
  const badge=make('small','ps41-status',item.marker);const name=make('strong','',item.label);
  const source=make('p','ps41-source','Źródło: '+item.source);body.append(badge,name,source);
  if(item.kind==='document'){
   body.append(make('p','ps41-note','Zakres zapisu: '+item.place+'. '+item.caution));
   const links=make('div','ps41-links');for(const id of item.ids){const b=make('button','btn subtle','Otwórz '+id);b.type='button';b.addEventListener('click',()=>openDoc(id));links.append(b);}body.append(links);
  }else{
   body.append(make('blockquote','ps41-quote',item.snippet));
   body.append(make('small','ps41-uncertain','Dzień 17/18 XI jest przypisaniem pomocniczym według godziny. Samo zeznanie nie potwierdza daty ani zdarzenia.'));
   const b=make('button','btn subtle','Otwórz wypowiedź');b.type='button';b.addEventListener('click',()=>openWitness(item.char,item.turn));body.append(b);
  }
  if(item.issues.length){const flag=make('p','ps41-warning','Do porównania: '+item.issues.join('; ')+'. Nie przesądza to o kłamstwie.');body.append(flag);}
  row.append(mark,body);return row;
 }
 let lastSignature='',current=[];
 function signature(){return [...STATE.found].sort().join('|')+'~'+CONTENT.characters.map(c=>{const log=STATE.dialogues[c.id]||[];return c.id+':'+log.length+':'+String(log.at(-1)?.text||'').slice(-90);}).join('|')+'~'+TL_EVENTS.map(e=>{const x=STATE.timeline11?.entries?.[e.id];return x?.at+':'+x?.to;}).join('|');}
 function render(force=false){if(STATE.tab!=='timeline'&&!force)return;
  const sig=signature();if(sig!==lastSignature||force){current=collect();lastSignature=sig;}
  const events=current.filter(i=>i.kind==='document').length,claims=current.length-events,flags=current.filter(i=>i.issues.length).length;
  stats.textContent=`${events} odkrytych zdarzeń z akt · ${claims} wzmianek w zeznaniach · ${flags} do porównania`;
  const mode=filter.value,term=fold(query.value.trim());const selected=current.filter(i=>(mode==='all'||mode===i.kind||(mode==='conflict'&&i.issues.length))&&(!term||fold(i.label+' '+i.source+' '+(i.snippet||'')+' '+(i.caution||'')).includes(term)));
  output.replaceChildren();if(!selected.length){output.append(make('p','ps41-empty',current.length?'Brak wyników przy tym filtrze.':'Nie odkryto jeszcze materiałów pozwalających ustalić przebieg nocy. Zdobywaj akta i przesłuchuj świadków.'));return;}
  let day='';for(const item of selected){const newDay=item.at.slice(0,10);if(day!==newDay){day=newDay;output.append(make('h4','ps41-day',newDay==='2026-11-17'?'17 listopada · wieczór':'18 listopada · noc i poranek'));}output.append(renderItem(item));}
 }
 filter.addEventListener('change',()=>render(true));query.addEventListener('input',()=>render(true));refresh.addEventListener('click',()=>render(true));
 registerNavigationHook({name:'rc41-auto-timeline',after:({id})=>{if(id==='timeline')render(true);}});
 if(typeof PS_EVENTS!=='undefined'){
  PS_EVENTS.on('evidenceCollected','rc41-auto-evidence',()=>{if(STATE.tab==='timeline')render();});
  PS_EVENTS.on('laboratoryCompleted','rc41-auto-lab',()=>{if(STATE.tab==='timeline')render();});
 }
 // Co-op snapshots and restored saves already update STATE; this view is derived,
 // not separately persisted or trusted as evidence.
 setInterval(()=>{if(STATE.tab==='timeline'&&!document.hidden&&signature()!==lastSignature)render();},2000);
 window.PS_RC41_TIMELINE=Object.freeze({inspect:()=>current.map(({kind,id,at,until,issues})=>({kind,id,at,until,issues:issues.slice()})),refresh:()=>render(true)});
 render(true);
})();
