
/* Kontekstowa rozmowa — kontrola spójności i zwięzłości odpowiedzi.
   Nie przyznaje dowodów, nie tworzy nowych zdarzeń, nie omija konfrontacji. */
(function(){
 'use strict';
 const priorAnswer=WitnessEngine.snapshotAnswer();
 const priorExport=WitnessEngine.snapshotExport();
 const priorRestore=WitnessEngine.snapshotRestore();
 const LIMIT=16;
 const limits=new Set(['culprit','card','access','messages','cctv','laboratory','risk','last_seen','victim_last','what_happened']);
 const personMarkers=/\b(?:lena|leny|lenie|lene|rudnick|ofiar|jej|nia|niej)\w*\b/;
 const protectedQuestion=/\b(?:przyznal|przyznalas|przyznales|zabil|zabiles|zabilas|morderstw|zabojstw|oskarz|sklamal|klamiesz|falszowal)\w*/;
 const simplify=(text)=>norm(text).replace(/\s+/g,' ').trim();
 const key=(x)=>simplify(x).replace(/[^a-z0-9 ]/g,'').slice(0,180);
 const signatures={
  MAREK:{hold:'Nie mam podstaw, żeby powiedzieć więcej.',none:'W dokumentacji mogą być szczegóły, których nie pamiętam.'},
  TOMASZ:{hold:'Więcej sam nie widziałem.',none:'Tego z pamięci nie odtworzę.'},
  JANUSZ:{hold:'Nie mam innych ustaleń z warsztatu.',none:'Bez zapisów z warsztatu nie podam dokładniej.'},
  ELZBIETA:{hold:'Na tym kończy się moja własna wiedza.',none:'Nie chcę rozszerzać tego ponad ustalone fakty.'},
  KAMIL:{hold:'Nie mam nowego odczytu, który by to zmieniał.',none:'Bez danych źródłowych nie dopowiem szczegółu.'},
  MAGDALENA:{hold:'Nie mam dodatkowego potwierdzenia.',none:'Bez niezależnego źródła nie rozstrzygnę tego.'}
 };
 const safeTopics=new Set(['alibi','time','witness','source','verification','documents','relations','conversation','lena','work','accountability','feeling','archive','observations','inference','hypothesis','location']);
 const followFacts={
  alibi:{after:'location',before:'time',place:'location',time:'time',who:'witness',source:'source',proof:'verify',why:'source',detail:'alibi'},
  location:{after:'location',before:'time',place:'location',time:'time',who:'witness',source:'source',proof:'verify',why:'source',detail:'location'},
  time:{after:'location',before:'time',place:'location',time:'time',who:'witness',source:'source',proof:'verify',why:'source',detail:'time'},
  work:{after:'location',before:'time',place:'location',time:'time',who:'witness',source:'source',proof:'verify',why:'source',detail:'location'},
  witness:{who:'witness',source:'source',proof:'verify',detail:'witness'},
  verification:{who:'witness',source:'source',proof:'verify',detail:'verify'},
  source:{who:'witness',source:'source',proof:'verify',detail:'source'},
  documents:{who:'witness',source:'source',proof:'verify',detail:'verify'},
  observations:{who:'witness',source:'source',proof:'verify',detail:'last'},
  relations:{who:'witness',source:'source',proof:'verify',detail:'relations'},
  conversation:{after:'lastvictim',before:'last',who:'source',source:'source',proof:'verify',detail:'last'},
  lena:{after:'lastvictim',before:'last',who:'source',source:'source',proof:'verify',detail:'last'},
  last_seen:{after:'lastvictim',before:'last',who:'source',source:'source',proof:'verify',detail:'last'},
  victim_last:{after:'lastvictim',before:'last',who:'source',source:'source',proof:'verify',detail:'lastvictim'},
  risk:{why:'responsibility',proof:'verify',source:'source',detail:'responsibility'},
  accountability:{why:'responsibility',proof:'verify',source:'source',detail:'responsibility'},
  feeling:{source:'source',detail:'emotion'},
  archive:{source:'source',proof:'verify',detail:'verify'},
  inference:{source:'source',proof:'verify',detail:'verify'},
  hypothesis:{source:'source',proof:'verify',detail:'verify'}
 };
 function kind(raw){
  const q=simplify(raw);
  if(!q||q.split(' ').length>16)return null;
  if(/^(?:a |i |no )?(?:co (?:bylo|stalo sie|wydarzylo sie) (?:potem|pozniej|dalej|nastepnie)|co (?:potem|dalej|pozniej)|i co dalej|co dalej|a dalej|co zrobil[ae]s potem|a nastepnie|co bylo pozniej|jak to sie skonczylo|i co wtedy)(?:\?)?$/.test(q))return 'after';
  if(/^(?:a |i )?(?:co bylo (?:przedtem|wczesniej)|a wczesniej|co przed tym|co przedtem|i przedtem|a przed tym|co sie dzialo wczesniej)(?:\?)?$/.test(q))return 'before';
  if(/^(?:a |i )?(?:kto to (?:widzial|potwierdzi|wie)|kto (?:jeszcze )?(?:widzial|potwierdzi|moze potwierdzic)|czy ktos to widzial|a swiadkowie|kto przy tym byl|a kto to widzial)(?:\?)?$/.test(q))return 'who';
  if(/^(?:a |i )?(?:skad to wiesz|skad wiesz|skad ta pewnosc|od kogo to wiesz|czy sam to widzial[ae]s|czy to widzial[ae]s|na jakiej podstawie)(?:\?)?$/.test(q))return 'source';
  if(/^(?:a |i )?(?:jak to sprawdzic|jak mozna to sprawdzic|czym to potwierdzisz|czy da sie to potwierdzic|na czym sie opierasz|jakie sa dowody|i jaki jest na to dowod)(?:\?)?$/.test(q))return 'proof';
  if(/^(?:a |i )?(?:o ktorej|o ktorej dokladnie|kiedy to bylo|kiedy dokladnie|jaka godzina|o jakiej godzinie)(?:\?)?$/.test(q))return 'time';
  if(/^(?:a |i )?(?:gdzie|gdzie to bylo|gdzie dokladnie|w ktorym miejscu|a gdzie)(?:\?)?$/.test(q))return 'place';
  if(/^(?:a |i )?(?:dlaczego|czemu|z jakiego powodu|dlaczego tak uwazasz|ale dlaczego)(?:\?)?$/.test(q))return 'why';
  if(/^(?:a |i )?(?:co konkretnie|a konkretnie|mozesz rozwinac|prosze o szczegoly|jakie szczegoly|co masz na mysli|o co ci chodzi)(?:\?)?$/.test(q))return 'detail';
  if(/^(?:a |i )?(?:nie rozumiem|nie rozumiem tego|powiedz to prosciej|powiedz to po ludzku|mozesz to wyjasnic prosciej|innymi slowami|wyjasnij to prosciej|co to znaczy)(?:\?)?$/.test(q))return 'simplify';
  return null;
 }
 const plainProof={
  MAREK:'Trzeba porównać wejścia i połączenia. Sam grafik nie mówi, gdzie byłem przez całą noc.',
  TOMASZ:'Rejestr pokaże, kiedy pracowałem przy konsoli, ale nie to, czy byłem tam bez przerwy.',
  JANUSZ:'Zlecenia i podpisy potwierdzą wykonane prace. Nie pokażą każdego mojego przejścia po warsztacie.',
  ELZBIETA:'Trzeba sprawdzić, czy zgłoszenie zostało wysłane i odebrane. Sam szkic tego nie potwierdza.',
  KAMIL:'Log pokazuje działanie systemu. Nie dowodzi sam z siebie, gdzie stał człowiek.',
  MAGDALENA:'Aktywna sesja mówi o stanie systemu, nie o tym, gdzie fizycznie przebywałam.'
 };
 const plainWitness={
  MAREK:'Nie mam świadka całego dyżuru. Połączenia i rejestr wejść pokazują tylko część moich działań.',
  TOMASZ:'Rejestr potwierdzi moje meldunki, ale nie dowiedzie, że przez cały czas siedziałem przy konsoli.',
  JANUSZ:'Ludzie widywali mnie w warsztacie, ale nie mam świadka każdej minuty.',
  ELZBIETA:'Nie mam osoby, która potwierdzi cały przebieg mojej nocy. Dokumenty pokazują tylko część pracy.',
  KAMIL:'Inni technicy mogli mnie widzieć, ale sam log nie dowodzi, gdzie wtedy stałem.',
  MAGDALENA:'Zapis sesji nie jest świadkiem tego, gdzie fizycznie byłam.'
 };
 const plainAlibi={
  MAREK:'Kierowałem nocną zmianą. Pracowałem głównie w biurze, ale czasami wychodziłem.',
  TOMASZ:'Byłem w dyspozytorni. Później poszedłem do stanowiska trzeciego, gdzie znalazłem Lenę.',
  JANUSZ:'Pracowałem w warsztacie przy naprawach. Nie pamiętam każdej minuty.',
  ELZBIETA:'Zajmowałam się zgłoszeniami BHP. Nie obserwowałam placu przez całą noc.',
  KAMIL:'Prowadziłem diagnostykę TW-217. Nie przebywałem cały czas w jednym miejscu.',
  MAGDALENA:'Sprawdzałam dokumentację. Aktywność sesji nie mówi, gdzie fizycznie byłam.'
 };
 const noContext={
  MAREK:'O który fragment pytasz? Wolę nie odpowiadać na domysł.',
  TOMASZ:'Co konkretnie mam wyjaśnić? Powiem, co sam pamiętam.',
  JANUSZ:'Powiedz, o co dokładnie chodzi. Nie chcę zgadywać.',
  ELZBIETA:'Który fragment mam doprecyzować? Mogę oddzielić moje wspomnienie od dokumentacji.',
  KAMIL:'Który szczegół jest niejasny? Mogę wyjaśnić logi albo samą chronologię.',
  MAGDALENA:'Które ustalenie wymaga wyjaśnienia? Proszę wskazać konkretny zapis.'
 };
 function broadNight(q){return /^(?:(?:co|ile|jak\s+wiele)\s+(?:pamietasz|wiesz)\s+(?:z|o)\s+(?:tej|tamtej)\s+nocy|opowiedz\s+(?:mi\s+)?(?:co\s+sie\s+dzialo|jak\s+wygladala\s+twoja\s+noc)|co\s+(?:robiles|robilas)\s+(?:tej|tamtej)\s+nocy)(?:\?)?$/.test(q);}
 function unverifiedWitness(c,topic){
  if(c.id==='TOMASZ')return 'Widziałem Lenę przy stanowisku trzecim, gdy ją znalazłem. Nie widziałem wcześniejszego ataku.';
  return 'Nie potrafię wskazać innego świadka dalszej drogi Leny.';
 }
 function history(c){const st=NPC4_STATE[c.id];if(!st.npc5||!Array.isArray(st.npc5.recent))st.npc5={anchor:null,recent:[]};return st.npc5;}
 function lastAnchor(c){
  const h=history(c),l=h.anchor;
  if(l&&l.topic)return l;
  const mem=NPC9_MEMORY[c.id];
  return mem.lastFocus?.topic?{topic:mem.lastFocus.topic,question:'',answer:'',focus:''}:null;
 }
 function currentTopic(c,raw,follow,old){
  const q=simplify(raw);
  if(follow&&old?.topic)return old.topic;
  if(personMarkers.test(q)&&/\b(?:gdzie|dokad|poszla|widzian|widzial[ae]s|spotkal|rozmawial|wczesniej|pozniej)\w*/.test(q))return /\b(?:gdzie|dokad|poszla|pozniej)\w*/.test(q)?'victim_last':'last_seen';
  const resolved=window.NPC4_LAST?.id===c.id?window.NPC4_LAST.topic:null;
  return resolved&&resolved!=='social'?resolved:'general';
 }
 function fact(c,topic,queryKind){
  const src=NPC94_FACTS[c.id],selected=followFacts[topic]?.[queryKind];
  if(!src||!selected)return '';
  return String(src[selected]||'').trim();
 }
 function trimFormula(c,text){
  let out=String(text||'').trim();
  const possible=[...(NPC4_TRAITS[c.id]?.voice||[]),...(NPC3_TRANSITIONS[c.id]||[]),...(NPC2_VOICE[c.id]||[])];
  for(let iter=0;iter<3;iter++){
   const prior=out;for(const f of possible)if(f&&out.startsWith(f))out=out.slice(f.length).trimStart();
   if(out===prior)break;
  }
  return out;
 }
 function sentences(t){return (String(t||'').match(/[^.!?]+(?:[.!?]+|$)/g)||[]).map(s=>s.trim()).filter(Boolean);}
 function shorten(c,text){
  const clean=trimFormula(c,text),ss=sentences(clean);
  if(ss.length<=2||clean.length<220)return clean;
  let out=ss[0];if(out.length<70&&ss[1])out+=' '+ss[1];return out.slice(0,560);
 }
 function guarded(c,raw,attached,confronted,base){
  const q=simplify(raw);
  if(attached||confronted||protectedQuestion.test(q))return true;
  if(/\b(?:powtorz|przypomnij|wczesniej (?:zeznal|mowil|powiedzial)|przed chwila (?:mowil|powiedzial))\w*/.test(q))return true;
  if(/\b(?:przepraszam|przykro mi|dziekuje|dzieki)\b/.test(q))return true;
  if(base.startsWith('Nie przyznał')||base.startsWith('Nie przyznałam')||base.startsWith('Nie przyznałem'))return true;
  return false;
 }
 function reply(c,raw,attached){
  const h=history(c),prev=lastAnchor(c),follow=attached?null:kind(raw);
  const mem=NPC9_MEMORY[c.id],before=mem.semantic?.length||0,confronted=mem.confronted?.length||0;
  const base=String(priorAnswer(c,raw,attached)||'').trim();
  let answer=base,mode='original';
  const locked=guarded(c,raw,attached,confronted!==(mem.confronted?.length||0),base);
  const night=!follow&&!attached&&broadNight(simplify(raw));
  const topic=night?'alibi':currentTopic(c,raw,follow,prev);
  const hRecent=h.recent.slice(-LIMIT);
  const exact=hRecent.filter(x=>x.topic===topic&&x.question===key(raw)).length;
  const direct=follow===null;
  const isLong=String(raw).trim().split(/\s+/).length>=12;
  const hasMulti=npc2Split(raw).length>1;
  if(!locked&&!hasMulti){
   if(follow==='simplify'&&(!prev?.answer||prev.topic==='unknown'||prev.topic==='general')){
    answer=noContext[c.id]||'Wskaż, który fragment mam wyjaśnić.';mode='clarification';
   }else if(follow==='simplify'&&prev?.answer){
    answer=prev.focus==='proof'?(plainProof[c.id]||shorten(c,prev.answer)):(prev.focus==='who'?(plainWitness[c.id]||shorten(c,prev.answer)):(prev.topic==='alibi'&&broadNight(prev.question)?(plainAlibi[c.id]||shorten(c,prev.answer)):shorten(c,prev.answer)));
    mode=prev.focus==='proof'?'plain-language-verified':'summary-of-previous';
    if(!answer)answer=prev.answer;
   }else if(follow&&prev?.topic){
    const canonical=fact(c,prev.topic,follow);
    if(follow==='detail'&&prev.topic==='conversation'&&prev.answer){
      const priorQuestion=[...hRecent].reverse().find(x=>x.topic==='conversation'&&x.kind==='direct');
      answer=sentences(priorQuestion?.answer||prev.answer)[0]||prev.answer;mode='conversation-recall';
    }else if(follow==='who'&&['conversation','last_seen','victim_last','lena'].includes(prev.topic)){
      answer=unverifiedWitness(c,prev.topic);mode='limits-of-eyewitness';
    }else if(follow==='why'&&['conversation','last_seen','victim_last','lena'].includes(prev.topic)){
      answer=c.gender==='f'?'Nie wiem, czym kierowała się Lena. Mogę powiedzieć tylko, co pamiętam z naszego kontaktu.':'Nie wiem, czym kierowała się Lena. Mogę powiedzieć tylko, co pamiętam z naszego kontaktu.';mode='no-invented-motive';
    }else if(canonical&&follow!=='simplify'){
     answer=canonical;mode='focused-follow-up';
    }
   }else if(night){
    const f=NPC94_FACTS[c.id];answer=(f.alibi||base).trim();mode='broad-night-grounded';
   }else if(direct&&!limits.has(topic)&&safeTopics.has(topic)){
    const stripped=trimFormula(c,base);
    if(stripped&&stripped!==base){answer=stripped;mode='without-template-intro';}
    // The same question can be acknowledged without fabricating new facts.
    if(exact>=2){
     const core=shorten(c,answer);
     const brief=signatures[c.id]?.hold||'Nie mam nowych informacji.';
     if(core.length>45){answer=(core+' '+brief).slice(0,900);mode='same-facts-shorter';}
    }
   }
  }
  if(!answer)answer=base;
  // Do not add anything to multi-part or evidence-led corrections.
  if(!locked&&mode==='original'&&!hasMulti&&!isLong&&!limits.has(topic)&&!follow){const cleaned=trimFormula(c,answer);if(cleaned.length>32)answer=cleaned;}
  // Never persist an answer that is different from the displayed testimony.
  if(answer!==base){
   const rec=(mem.semantic||[]).slice(before).reverse().find(x=>x.answer===base&&['TESTIMONY','LIMITED_KNOWLEDGE','UNKNOWN','SOCIAL'].includes(x.status));
   if(rec)rec.answer=answer;
   const stmt=(mem.statements||[]).slice(-4).reverse().find(x=>x.text===base&&x.turn===mem.turn);
   if(stmt)stmt.text=answer;
   const r=NPC4_STATE[c.id].recent?.at(-1);if(r)r.answer=simplify(answer).slice(0,1550);
  }
  const metadata={question:key(raw),topic,kind:follow||'direct',answer:answer.slice(0,1400),mode};
  h.recent.push(metadata);if(h.recent.length>LIMIT)h.recent.splice(0,h.recent.length-LIMIT);
  // Explicit substantive questions become the next referent; a short follow-up
  // must not overwrite the topic with the generic 'source' or 'time' class.
  if(!follow&&topic!=='general'&&topic!=='unknown'&&topic!=='recall')h.anchor={topic,question:metadata.question,answer,focus:'direct'};
  else if(follow&&prev?.topic)h.anchor={topic:prev.topic,question:prev.question,answer:follow==='simplify'?prev.answer:answer,focus:follow};
  if(window.NPC4_LAST)window.NPC4_LAST={...window.NPC4_LAST,variant:'conversation-'+mode,contextTopic:topic};
  window.NPC5_LAST={person:c.id,topic,kind:follow||'direct',mode,modified:answer!==base,protected:locked};
  return answer;
 }
 registerWitnessAnswerLayer("01-conversation-consistency",reply);
 const ps3_01_conversation_consistency_npc4Export = function(){const data=priorExport();for(const c of CONTENT.characters){const v=NPC4_STATE[c.id]?.npc5;if(v)data[c.id].npc5={anchor:v.anchor,recent:v.recent.slice(-LIMIT)};}return data;};
registerWitnessExportLayer("01-conversation-consistency",ps3_01_conversation_consistency_npc4Export);
 const ps3_01_conversation_consistency_npc4Restore = function(data){priorRestore(data);
  for(const c of CONTENT.characters){const raw=data?.[c.id]?.npc5;if(!raw||typeof raw!=='object')continue;
   const clean=(obj)=>obj&&typeof obj==='object'&&typeof obj.topic==='string'&&obj.topic.length<65&&typeof obj.answer==='string'&&obj.answer.length<2000?{
    topic:obj.topic,question:typeof obj.question==='string'?obj.question.slice(0,180):'',answer:obj.answer.slice(0,1400),focus:typeof obj.focus==='string'?obj.focus.slice(0,30):'direct',kind:typeof obj.kind==='string'?obj.kind.slice(0,30):'direct',mode:typeof obj.mode==='string'?obj.mode.slice(0,60):'restored'}:null;
   const anchor=clean(raw.anchor),recent=Array.isArray(raw.recent)?raw.recent.map(clean).filter(Boolean).slice(-LIMIT):[];
   NPC4_STATE[c.id].npc5={anchor,recent};
  }
 };
registerWitnessRestoreLayer("01-conversation-consistency",ps3_01_conversation_consistency_npc4Restore);
 window.NPC5_QA={version:'kontrola konwersacji',kind,last:()=>window.NPC5_LAST||null,inspect:id=>NPC4_STATE[id]?.npc5||null,stats:()=>({witnesses:CONTENT.characters.length,preservedEvidenceGates:true})};
})();

