
/* Naprawa P2. Lokalna warstwa ochronna — bez API i bez zmiany treści sprawy.
   Nie zastępuje analizy znaczenia przez model językowy. */
(function(){
'use strict';
if(typeof npc4Answer!=='function'||typeof dd7Reasoning!=='function'||typeof dd2Audit!=='function')return;
const plain=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\s+/g,' ').trim();
const similar=(a,b)=>{
 const aa=new Set(plain(a).split(/[^a-z0-9]+/).filter(x=>x.length>3)),bb=new Set(plain(b).split(/[^a-z0-9]+/).filter(x=>x.length>3));
 if(!aa.size||!bb.size)return 0;let overlap=0;for(const t of aa)if(bb.has(t))overlap++;
 return 2*overlap/(aa.size+bb.size);
};
const p2BaseReply=WitnessEngine.snapshotAnswer();
const safeTopics=new Set(['discovery','digital_limit','feelings','relations','conversation','verify','source','verification','work','time','witness','alibi','location']);
const protectedQuery=/\b(?:sprawc\w*|zabi\w*|zamordow\w*|przyznaj\w*|klam\w*|sprzeczn\w*|konfront\w*|okaz\w*|zataj\w*|groz\w*|falszow\w*|zeznal\w*|powtorz\w*|przypomnij\w*|wczesniej\s+powied\w*)\b/;
const protectedReply=/\b(?:odmawiam|pelnomocnik|nie\s+bede\s+odpowiadac|przerwac\s+przesluchanie|przyznaje\s+sie)\b/;
const factKeys={discovery:['source','witness'],digital_limit:['verify','source'],feelings:['emotion'],relations:['relations','conversation'],conversation:['conversation','source'],verify:['verify','source'],source:['source','verify'],verification:['verify','source'],work:['location','source'],time:['time','source'],witness:['witness','source'],alibi:['witness','alibi'],location:['location','time']};
function p2WitnessAnswer(c,raw,attached){
 const previous=NPC4_STATE[c.id]?.npc89?.recent?.slice(-7).map(x=>({...x}))||[];
 const oldCorrections=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=p2BaseReply(c,raw,attached);
 if(attached||oldCorrections!==(NPC9_MEMORY[c.id]?.confronted?.length||0))return base;
 const q=plain(raw),a=plain(base);
 if(!q||protectedQuery.test(q)||protectedReply.test(a))return base;
 const last=NPC9_MEMORY[c.id]?.semantic?.at(-1);
 if(last&&(['CORRECTION_WITH_EVIDENCE','CONFESSION','RETRACTED_AFTER_EVIDENCE'].includes(last.status)||(last.source_ids||[]).length))return base;
 const topic=window.PS89_QA?.classify(c.id,raw)||'';
 if(!safeTopics.has(topic)||!previous.length)return base;
 // Tylko kiedy wypowiedź po raz kolejny prawie dokładnie powtarza historię.
 const near=previous.filter(r=>r.kind===topic&&(similar(base,r.a)>=.84||plain(base)===plain(r.a)));
 if(!near.length)return base;
 const facts=NPC94_FACTS[c.id]||{};
 let alternative='';
 for(const key of (factKeys[topic]||[])){
  const candidate=String(facts[key]||'').trim();
  if(candidate.length<24||similar(candidate,base)>.78||previous.slice(-5).some(r=>similar(candidate,r.a)>.78))continue;
  alternative=candidate;break;
 }
 // Uczciwie sygnalizuj koniec wiedzy, zamiast wymyślać nowe fakty.
 const repeated=previous.filter(r=>r.kind===topic).length;
 const reminder=c.gender==='f'?'Nie mam dodatkowych pewnych ustaleń ponad to, co już powiedziałam.':'Nie mam dodatkowych pewnych ustaleń ponad to, co już powiedziałem.';
 const out=alternative?alternative:reminder;
 if(out===base)return base;
 const mem=NPC9_MEMORY[c.id];
 const record=[...(mem.semantic||[])].reverse().find(x=>x.turn===mem.turn&&x.answer===base&&['TESTIMONY','LIMITED_KNOWLEDGE','UNKNOWN','SOCIAL'].includes(x.status)&&!(x.source_ids||[]).length);
 if(record)record.answer=out;
 const stmt=[...(mem.statements||[])].reverse().find(x=>x.turn===mem.turn&&x.text===base&&!(x.source_ids||[]).length);
 if(stmt)stmt.text=out;
 const st=NPC4_STATE[c.id];
 if(st.recent?.at(-1)&&plain(st.recent.at(-1).answer)===a)st.recent.at(-1).answer=plain(out).slice(0,1550);
 if(st.npc89?.recent?.at(-1))st.npc89.recent.at(-1).a=out.slice(0,1200);
 if(window.NPC4_LAST)window.NPC4_LAST={...window.NPC4_LAST,variant:alternative?'p2-grounded-alternative':'p2-no-new-facts'};
 return out;
}
registerWitnessAnswerLayer("52-semantic-validation-guards",p2WitnessAnswer);

// Jawne i bardzo wąskie reguły logiczne. Wyłącznie flagują nieuprawnione
// wnioski; nie przyznają graczowi nowych dokumentów lub wiedzy o sprawcy.
function p2RedFlags(d){
 const q=plain(d?.statement||'');const flags=[];
 const caution=/\b(?:nie|nigdy|brak|jedynie|tylko|sam\s+w\s+sobie|mozliw|moze|niepewn|wymaga|bez\s+potwierdz|nie\s+wynika|nie\s+dowodzi|nie\s+oznacza)\b/.test(q);
 if(!caution && /(?:01[:.]44|\b144\b)/.test(q) && /\b(?:czujnik\w*|impuls\w*|alarm\w*|log\w*|sygnal\w*)\b/.test(q) && /\b(?:smier\w*|zgon\w*|zmar\w*|umar\w*)\b/.test(q) && /\b(?:dokladn\w*|wlasnie|na pewno|dowod\w*|udowod\w*|jednoznaczn\w*)\b/.test(q))
  flags.push('Sygnał techniczny z 01:44 nie rozstrzyga dokładnej chwili śmierci. Rozdziel obserwację i wniosek.');
 if(!caution && /\b(?:karta\w*|czytnik\w*|log\w*|sesj\w*|konto\w*|identyfikator\w*)\b/.test(q) && /\b(?:tozsamosc\w*|sprawc\w*|zabil\w*|obecnosc\w*|osob\w*)\b/.test(q) && /\b(?:dowod\w*|jednoznaczn\w*|udowod\w*|potwierdz\w*|na pewno)\b/.test(q))
  flags.push('Karta, czytnik lub sesja potwierdza zdarzenie w systemie, nie identyfikuje samodzielnie człowieka.');
 return flags;
}
const p2PrevReasoning=dd7Reasoning;
dd7Reasoning=function(d){
 const old=p2PrevReasoning(d),red=p2RedFlags(d);
 return {...old,ok:old.ok&&red.length===0,issues:[...old.issues,...red.filter(x=>!old.issues.includes(x))],p2Contradictions:red};
};
const p2PrevAudit=dd2Audit;
dd2Audit=function(d){
 const result=p2PrevAudit(d),red=p2RedFlags(d);
 if(red.length){
  result.score=Math.min(result.score,55);
  result.status='wymaga korekty sprzeczności';
  for(const x of red)if(!result.issues.includes(x))result.issues.push(x);
  result.text=result.text.replace(/^Ocena uzasadnienia:.*?\n/,`Ocena uzasadnienia: ${result.score}/100 (${result.status}).\n`)
     +'\nBłędy logiczne wymagające korekty:\n'+red.map(x=>'• '+x).join('\n');
 }
 return result;
};
window.P2_QA=Object.freeze({version:'P2-2026-10',redFlags:p2RedFlags,similarity:similar,
 witnessMeta:(id)=>({recent:NPC4_STATE[id]?.npc89?.recent?.length||0,variant:window.NPC4_LAST?.id===id?window.NPC4_LAST.variant:null}),
 deduction:(d)=>({score:dd2Audit(d).score,redFlags:p2RedFlags(d),ready:dd7Reasoning(d).ok})});
})();
