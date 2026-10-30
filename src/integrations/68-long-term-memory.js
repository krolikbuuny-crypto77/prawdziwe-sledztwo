/* Pakiet 6.8 — pamięć długoterminowa KANONICZNYCH, lokalnych zeznań.
 * Nie jest źródłem prawdy o sprawie. Zapisywane pytania są wypowiedziami gracza,
 * a cytowane odpowiedzi — wcześniej wypowiedzianymi zeznaniami świadka.
 * Faktów i bramek fabularnych nigdy nie zmienia ten moduł. */
const PS68_MEMORY = (() => {
 'use strict';
 const IDS=CONTENT.characters.map(c=>c.id),TOPICS=[
  ['alibi',/\b(?:alibi|gdzie\s+(?:byl\w*|przebywal\w*)|obecnos\w*|dyzur\w*|zmian\w*|widzian\w*|kto\s+potwierdzi\w*)/],
  ['timeline',/\b(?:godzin|kiedy|ktorej|czas|kolejno|potem|wczesniej|przed|po\s+alarm)/],
  ['lena',/\b(?:lena|leny|lene|rudnick|ofiara|ostatni\s+kontakt)/],
  ['work',/\b(?:prac|obowiaz|zadani|stanowisk|kierow|sluzb)/],
  ['safety',/\b(?:bhp|zagrozen|awari|ryzyk|uster|bezpieczen|zgloszen)/],
  ['document',/\b(?:raport|rejestr|karta|dokument|protokol|audyt|akta)/],
  ['technical',/\b(?:tcms|log|wagon|diagnost|kamera|nagran|sesj)/],
  ['relation',/\b(?:relacj|rozmow|znal|spotk|przyjazn|konflikt)/],
  ['action',/\b(?:zrobil|podjal|zareagow|dlaczego|czemu|decyzj)/]
 ];
 const clean=(s,n=580)=>String(s??'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
 const fold=s=>{let v=clean(s,1100).toLocaleLowerCase('pl');try{v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return v.replace(/ł/g,'l');};
 const empty=()=>({turn:0,episodes:[],anchors:{}});
 const data=Object.fromEntries(IDS.map(id=>[id,empty()]));
 const refs=Object.fromEntries(IDS.map(id=>[id,STATE.dialogues[id]]));
 const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE']);
 function checkSession(id){if(refs[id]!==STATE.dialogues[id]){data[id]=empty();refs[id]=STATE.dialogues[id];}}
 function topic(q,base=''){
  const n=fold(q);
  // 6.28: Subject and affirmative intent take precedence over incidental/negated entities.
  // 'Nie pytam o ostatnie spotkanie z Leną, tylko o TWOJE miejsce pobytu' => alibi.
  if(/\b(?:twoj\w*|pana|pani|swoj\w*|twoje|wlasn\w*)\s+(?:miejsce\s+pobyt\w*|pobyt\w*|alibi)\b/.test(n)||
     /\b(?:gdzie|dokad)\s+(?:ty\s+|pan\s+|pani\s+)?(?:byl\w*|przebywal\w*|znajdowal\w*\s+sie)\b/.test(n)||
     /\b(?:gdzie\s+(?:sie\s+)?znajdowal\w*|co\s+(?:ty|pan|pani)\s+robil\w*|potwierdzi\w*\s+(?:twoj\w*|pana|pani)\s+obecnos\w*)\b/.test(n))return 'alibi';
  const withoutRejected=n.replace(/\b(?:nie\s+(?:pytam|chodzi|mowie)\s+o|nie\s+o)\s+[^,.!?;]*(?=[,.!?;]|$)/g,' ');
  const candidates=withoutRejected.trim()||n;
  if(/\bmiejsce\s+pobyt\w*\b/.test(candidates)&&
     !/\bmiejsce\s+pobyt\w*\s+(?:len\w*|rudnick\w*|ofiary|marka|kamila|tomasza|janusza)\b/.test(candidates))return 'alibi';
  const match=TOPICS.find(([,re])=>re.test(candidates));
  if(match)return match[0];
  const known=fold(base);const same=TOPICS.find(([,re])=>re.test(known));
  return same?same[0]:'general';
 }
 function status(id){const m=NPC9_MEMORY?.[id],last=m?.semantic?.at(-1);return PROTECTED.has(last?.status)?last.status:'STATEMENT';}
 function record(id,question,canonical){
  if(!Object.prototype.hasOwnProperty.call(data,id))return;
  checkSession(id);
  const q=clean(question,260),a=clean(canonical,680);
  if(!q||!a||a.length<8||isRecall(q))return;
  const m=data[id],found=STATE.dialogues[id];
  // Zapisujemy wyłącznie zakończoną turę lokalną, nie komunikaty użytkownika bez odpowiedzi.
  if(!Array.isArray(found)||found.at(-1)?.role!=='npc'||found.at(-2)?.role!=='player')return;
  const last=m.episodes.at(-1);
  if(last&&last.q===q&&last.a===a&&last.dialogueLength===found.length)return;
  const turn=++m.turn,kind=status(id),t=topic(q,NPC9_MEMORY?.[id]?.lastFocus?.topic||'');
  const row={turn,topic:t,q,a,canonical:a,kind,dialogueLength:found.length};
  m.episodes.push(row);if(m.episodes.length>80)m.episodes.splice(0,m.episodes.length-80);
  const x=m.anchors[t]||{first:null,last:null,count:0};
  if(!x.first)x.first={turn,a,canonical:a,kind};
  x.last={turn,a,canonical:a,kind};x.count=Math.min(1000000,x.count+1);
  m.anchors[t]=x;
  // Sprostowanie dotyczy danego zagadnienia: starsze twierdzenie nadal jest
  // historią zeznania, ale nie wolno udawać, że jest aktualnym stanowiskiem.
 }
 const recallRE=/\b(?:przypomnij|przypomni|powiedzial\w*\s+(?:pan|pani|mi|wczesniej)|mowil\w*\s+(?:pan|pani|wczesniej)|wspominal\w*\s+(?:pan|pani)|wrocmy\s+do|wracajac\s+do|co\s+(?:pan|pani)\s+(?:mowil|powiedzial)|wczesniejsze\s+zeznani|poprzednie\s+zeznani)\b/;
 const sensitiveRE=/\b(?:dowod|przyznaj|przyznal|zabil|zaboj|morder|szantaz|konfront|oskarz|falszow|klam|zeznan\s+pod\s+przysiega|dokument\s+pokaz|protokol\s+konfront)\b/;
 const isRecall=q=>recallRE.test(fold(q));
 function relevant(id,query,limit=8){
  checkSession(id);
  const m=data[id], t=topic(query),seen=new Set(),result=[];
  const push=r=>{if(!r||!r.a||seen.has(r.turn)||result.length>=limit)return;seen.add(r.turn);result.push({...r});};
  const a=m.anchors[t];
  if(a){push({...a.last,topic:t});if(a.first?.turn!==a.last?.turn)push({...a.first,topic:t});}
  if(t==='general'&&isRecall(query)){
   for(const ep of m.episodes.slice(-12).reverse())push(ep);
  }else{
   for(const ep of m.episodes.slice().reverse())if(ep.topic===t)push(ep);
  }
  return result.slice(0,limit);
 }
 function context(id,question){
  const rows=relevant(id,question,8);
  return rows.map(r=>({turn:r.turn,topic:r.topic,statement:clean(r.a,520),status:r.kind==='CORRECTION_WITH_EVIDENCE'?'sprostowane':'wcześniejsze zeznanie'}));
 }
 function approvedAnchors(id,question,limit=8){
  // Tylko dosłowne lokalne wypowiedzi. Pierwotne, później sprostowane twierdzenia
  // nie stają się samodzielnie używalnymi źródłami odpowiedzi.
  return relevant(id,question,limit).filter(r=>{
   const x=data[id].anchors[r.topic];
   // Domyślnie tylko najnowsza wersja zeznania; cytat starszej wolno
   // przywołać przy wyraźnym pytaniu o historię wypowiedzi.
   if(!isRecall(question)&&x&&x.last.turn!==r.turn)return false;
   return r.kind!=='CONFESSION'&&(!x||x.last?.kind!=='CORRECTION_WITH_EVIDENCE'||x.last.turn===r.turn);
  });
 }
 function canonicalAnchors(id,question,limit=8){
  return approvedAnchors(id,question,limit).map(x=>({...x,a:x.canonical||x.a}));
 }
 function recallReply(id,q){
  if(!isRecall(q)||sensitiveRE.test(fold(q)))return '';
  const rows=relevant(id,q,3);if(!rows.length)return '';
  const first=rows[0];
  // Przy sprostowaniu pokazuj najnowsze stanowisko, a nie wcześniejsze, obalone słowa.
  const current=data[id].anchors[first.topic]?.last;
  const shown=current?.kind==='CORRECTION_WITH_EVIDENCE'?current:first;
  const name=CONTENT.characters.find(c=>c.id===id),female=name?.gender==='f';
  const intro=shown.kind==='CORRECTION_WITH_EVIDENCE'?'Później to sprostowałam: ':'Wcześniej powiedziałam: ';
  return (female?intro:intro.replace('sprostowałam','sprostowałem').replace('powiedziałam','powiedziałem'))+'„'+shown.a+'”';
 }
 const oldAnswer=WitnessEngine.snapshotAnswer();
 registerWitnessAnswerLayer('68-long-term-recall',function(c,q,attached){
  const id=c?.id;const before=id&&WitnessEngine.valid(id)?WitnessEngine.inspectWitness(id):null;
  const oldConfront=NPC9_MEMORY?.[id]?.confronted?.length||0;
  const base=oldAnswer.apply(this,arguments);
  if(!id||attached||before?.psychological?.blocked||NPC9_MEMORY?.[id]?.confronted?.length!==oldConfront||
    PROTECTED.has(NPC9_MEMORY?.[id]?.semantic?.at(-1)?.status)||sensitiveRE.test(fold(q)))return base;
  const output=recallReply(id,q);if(!output||output===base)return base;
  const mem=NPC9_MEMORY?.[id],turn=mem?.turn;
  const semantic=mem?.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===base&&!PROTECTED.has(x.status));
  const statement=mem?.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===base&&!PROTECTED.has(x.status));
  if(semantic){semantic.answer=output;semantic.topic='recall';}
  if(statement){statement.text=output;statement.topic='recall';}
  const s=NPC4_STATE?.[id];if(s?.recent?.length&&s.recent.at(-1).answer===fold(base))s.recent.at(-1).answer=fold(output).slice(0,1550);
  return output;
 });
 const oldSend=WitnessEngine.snapshotSend();
 registerWitnessSendLayer('68-canonical-memory',function(){
  const id=STATE.activeChar,log=STATE.dialogues[id],len=log?.length||0;
  const q=String(document.getElementById('chatInput')?.value||'').trim();
  const result=oldSend.apply(this,arguments);
  if(Array.isArray(log)&&log.length===len+2&&log.at(-1)?.role==='npc'&&log.at(-2)?.role==='player')
   record(id,log.at(-2).text||q,log.at(-1).text);
  return result;
 });
 // Reconcile the pending local draft after the async provider has replied.
 // Keep corrections protected and never alter the game's canonical fact ledger.
 function finalize(id,question,original,displayed,log){
  if(!Object.prototype.hasOwnProperty.call(data,id)||refs[id]!==log)return false;
  const m=data[id],last=m.episodes.at(-1);
  const q=clean(question,260),oldA=clean(original,680),newA=clean(displayed,680);
  if(!last||!newA||last.dialogueLength!==log.length||last.q!==q||last.a!==oldA)return false;
  last.canonical=last.canonical||oldA;last.a=newA;
  const anchor=m.anchors[last.topic];
  if(anchor?.first?.turn===last.turn){anchor.first.canonical=anchor.first.canonical||oldA;anchor.first.a=newA;}
  if(anchor?.last?.turn===last.turn){anchor.last.canonical=anchor.last.canonical||oldA;anchor.last.a=newA;}
  return true;
 }
 // Nie zmieniamy schematu SaveManager. Każda sesja posiada osobny, bounded rejestr.
 registerSaveHook({name:'stage68-long-term-memory',
  build(out){
   out.ps68={version:1,witnesses:Object.fromEntries(IDS.map(id=>{
    checkSession(id);const m=data[id];return [id,{turn:m.turn,
     episodes:m.episodes.map(({turn,topic,q,a,canonical,kind,dialogueLength})=>({turn,topic,q,a,canonical:canonical||a,kind,dialogueLength})),
     anchors:m.anchors}];
   }))};
  },
  apply(raw){
   const incoming=raw?.ps68?.version===1?raw.ps68.witnesses:null;
   for(const id of IDS){
    const v=incoming?.[id],m=empty();
    if(v&&typeof v==='object'){
     const valid=(r)=>r&&Number.isSafeInteger(r.turn)&&r.turn>=1&&r.turn<=1000000&&
       typeof r.a==='string'&&r.a.length<=680&&typeof r.topic==='string'&&['general',...TOPICS.map(x=>x[0])].includes(r.topic)&&
       ['STATEMENT','CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.kind);
     m.episodes=(Array.isArray(v.episodes)?v.episodes:[]).slice(-80).filter(r=>valid(r)&&typeof r.q==='string'&&r.q.length<=260)
       .map(r=>({turn:r.turn,topic:r.topic,q:clean(r.q,260),a:clean(r.a,680),canonical:clean(r.canonical||r.a,680),kind:r.kind,dialogueLength:Math.max(0,Math.min(1000000,Number(r.dialogueLength)||0))}));
     for(const [t,x] of Object.entries(v.anchors&&typeof v.anchors==='object'&&!Array.isArray(v.anchors)?v.anchors:{})){
      if(!['general',...TOPICS.map(y=>y[0])].includes(t)||!x||!valid({...x.first,topic:t})||!valid({...x.last,topic:t}))continue;
      m.anchors[t]={first:{turn:x.first.turn,a:clean(x.first.a,680),canonical:clean(x.first.canonical||x.first.a,680),kind:x.first.kind},
       last:{turn:x.last.turn,a:clean(x.last.a,680),canonical:clean(x.last.canonical||x.last.a,680),kind:x.last.kind},count:Math.max(1,Math.min(1000000,Number(x.count)||1))};
     }
     m.turn=Math.max(m.episodes.at(-1)?.turn||0,...Object.values(m.anchors).map(x=>x.last.turn),0);
     // 6.28: fix older episodes attributed to 'lena' because a *negated*
     // aside mentioned Lena. Rebuild only those affected anchors from original utterances.
     let corrected=false;
     for(const ep of m.episodes){
      const resolved=topic(ep.q);
      if(ep.topic==='lena'&&resolved==='alibi'){ep.topic='alibi';corrected=true;}
     }
     if(corrected){
      m.anchors={};
      for(const ep of m.episodes){
       const a=m.anchors[ep.topic]||{first:null,last:null,count:0};
       const x={turn:ep.turn,a:ep.a,canonical:ep.canonical,kind:ep.kind};
       if(!a.first)a.first={...x};a.last={...x};a.count++;m.anchors[ep.topic]=a;
      }
     }
     // Migrate v6.25 saved sessions: the dialogue already contains the displayed
     // answer while this legacy episode could still contain the local draft.
     const dialogue=STATE.dialogues[id]||[];
     for(const ep of m.episodes){
      const n=ep.dialogueLength;if(n<2||n>dialogue.length)continue;
      const played=dialogue[n-2],spoken=dialogue[n-1];
      if(played?.role!=='player'||spoken?.role!=='npc'||clean(played.text,260)!==ep.q)continue;
      ep.a=clean(spoken.text,680);
      const anchor=m.anchors[ep.topic];
      if(anchor?.first?.turn===ep.turn)anchor.first.a=ep.a;
      if(anchor?.last?.turn===ep.turn)anchor.last.a=ep.a;
     }
    }
    data[id]=m;refs[id]=STATE.dialogues[id];
   }
  }
 });
 return Object.freeze({context,approvedAnchors,canonicalAnchors,recallReply,finalize,inspect:()=>Object.fromEntries(IDS.map(id=>{checkSession(id);return [id,{episodes:data[id].episodes.length,topics:Object.keys(data[id].anchors).length,turn:data[id].turn}];}))});
})();
window.PS68_MEMORY=PS68_MEMORY;
