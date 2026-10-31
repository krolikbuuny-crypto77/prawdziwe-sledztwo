/** Deterministic fallback: verbatim authorised registry text, never model output or client canon. */
import {witnessRefusal} from './trusted-interview-624.js';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const words=s=>new Set((fold(s).match(/[a-z]{4,}/g)||[]).filter(x=>!['jest','tego','ktory','ktora','pana','pani','mnie','moze','bylo','teraz','prosze'].includes(x)).map(x=>x.slice(0,Math.min(x.length,6))));
export function localInterviewReply(scene){
 const q=fold(scene.question),bank=scene.knowledge.factBank||[],parts=scene.questionParts||[];
 const answer=(text,facts=[],kind='scope')=>({ok:true,decision:'answer',primaryMode:true,text,factIds:facts.map(f=>f.id),sourceIds:[],sourceId:'turn',prefaceKey:0,
  semanticVerified:false,localVerified:true,localKind:kind});
 if(scene.presentedEvidence)return answer('Proszę wskazać konkretny fragment okazanego materiału i zapytać o jedną rzecz. Oddzielę jego treść od tego, co samodzielnie pamiętam.',[],'clarification');
 if(parts.length>1||scene.questionPlan?.slots?.compound)return answer('Proszę zadawać te pytania pojedynczo. Chcę odpowiedzieć dokładnie na każdą część.',[],'clarification');
 const follow=/^(?:a )?(?:kto|co|jak|kiedy|gdzie|dlaczego)?\s*(?:to|on|ona|oni|tam|wtedy)\b/.test(q)||/kto.*potwierdz/.test(q);
 const prior=scene.dialogueFocus?.previousQuestion||scene.dialogueMemory?.lastQuestion||[...(scene.approvedThreadHistory||[])].reverse().find(x=>x.role==='player')?.text||'';
 const alibiContext=/alibi|biur|pobyt|gdzie|obecn|zmian/.test(fold(prior));
 if(/kto.*potwierdz|kto.*poswiadcz/.test(q)&&alibiContext){
  const f=bank.find(f=>f.source?.endsWith('-S02')&&f.knowledgeKind==='authored-personal-background');
  if(f&&f.text.length<=1450)return answer(f.text,[f],'authored');
 }
 if(follow)return answer('Proszę doprecyzować, o którą osobę, wypowiedź lub sytuację chodzi.',[],'clarification');
 // Do not confirm presuppositions, quoted accusations or ironic formulations through keyword matching.
 if(/dlaczego|czemu|skoro|przeciez|podobno|rzekomo|czyli|zabil|morder|zamord|przyzn|klam|ukryl|usun|grozil|"|„|”/.test(q))return answer(witnessRefusal(scene.identity.id));
 let source=null;
 if(/alibi|gdzie.*(?:byl|przebyw)/.test(q))source='public-alibi';
 else if(/(?:znal|znasz|relac|laczyl).*(?:ofiar|len)|(?:ofiar|len).*(?:znal|relac|laczyl)/.test(q))source='trusted-relationship';
 else if(/ostatni.*wid|kiedy.*wid/.test(q))source='public-last_seen';
 else if(/co sie (?:stalo|wydarzylo)|co wiesz.*zdarzen/.test(q))source='public-what_happened';
 if(source){const f=bank.find(f=>f.source===source);if(f&&f.text.length<=1450)return answer(f.text,[f],'authored');}
 const qw=words(q);
 const ranked=bank.filter(f=>f.origin!=='document'&&f.knowledgeKind!=='general-principle-not-case-event'&&f.knowledgeKind!=='authorized-personal-correction'&&f.text.length<=1450)
  .map(f=>({f,hits:[...qw].filter(w=>words(f.text).has(w)).length})).sort((a,b)=>b.hits-a.hits);
 // Conservative lexical retrieval: require multiple anchors and an unambiguous lead.
 const top=ranked[0];
 if(qw.size>=3&&top?.hits>=3&&top.hits/qw.size>=0.65&&top.hits>(ranked[1]?.hits||0))return answer(top.f.text,[top.f],'authored');
 return answer(witnessRefusal(scene.identity.id));
}
