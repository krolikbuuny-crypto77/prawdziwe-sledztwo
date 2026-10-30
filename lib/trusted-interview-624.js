/** Autorytatywny zestaw faktów do odpowiedzi AI.
 * Nie korzysta z klientowych: canonical, factBank, groundedOptions, alreadySaid,
 * documentsShown (poza przecięciem z serwerem), notes, psychology.
 */
import canon from './trusted-witness-canon-624.json' with {type:'json'};
import rules from './approved-rules.js';
import {verifiedExhibit} from './exhibit-context-636.js';
import {buildQuestionContext} from './question-context-630.js';
const SAFE_KEYS=['opening','alibi','what_happened','last_seen','witness','motive','empathy','false_quote','unclear','evidence_weak'];
const T17=/(?:t[ -]?17|kart[ayąę]?|identyfikat|czytnik|log wejś|log wejs|zapis dostępu|zapis dostepu)/i;
const refusal={
 MAREK:'Nie potrafię ustalić tego z własnej wiedzy. Proszę wskazać konkretny zapis.',
 TOMASZ:'Nie wiem, co dokładnie wydarzyło się przy tym wejściu. Nie widziałem tego.',
 JANUSZ:'Tego nie widziałem. Mogę mówić o pracy w warsztacie, nie o cudzym wejściu.',
 ELZBIETA:'Nie znam przebiegu tego wejścia. Nie mogę potwierdzić, kto tam był.',
 KAMIL:'Z samego zapisu karty nie ustalę, kto stał przy drzwiach.',
 MAGDALENA:'Sam zapis karty nie wskazuje mi, kto faktycznie znajdował się przy drzwiach.'
};
const generic={
 MAREK:'Nie wiem tego na pewno. Mogę wyjaśnić własne decyzje, nie cudze działania.',
 TOMASZ:'Nie wiem. Nie byłem świadkiem wszystkiego, co wydarzyło się tej nocy.',
 JANUSZ:'Nie widziałem tego. Nie chcę zgadywać.',
 ELZBIETA:'Tego nie wiem. Nie byłam przy tym zdarzeniu.',
 KAMIL:'Nie potwierdzę tego bez konkretnego zapisu.',
 MAGDALENA:'Nie potrafię tego potwierdzić z własnej obserwacji.'
};
const norm=x=>String(x||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const wordset=x=>new Set(norm(x).match(/[a-z0-9]{4,}/g)||[]);
function relevance(text,question){const words=wordset(question);let score=0;for(const word of wordset(text))if(words.has(word))score++;return score;}
function qualified(text){return /\b(?:nie wiem|nie pamiętam|nie potrafię|nie mogę|nie jestem pew|nie widział|chyba|prawdopodobnie|według)\b/i.test(text)?'qualified':'statement';}
const includesExact=(list,text)=>list.some(x=>x.text===text);
/** No verified Supabase state => only authored public voice (no gated correction/docs). */
export function trustedScene(untrusted,serverState=null,verifiedQuestionContext=null){
 const id=untrusted?.identity?.id,p=canon.profiles[id];if(!p)return null;
 const owned=Array.isArray(serverState?.approvedEvidence)?new Set(serverState.approvedEvidence):new Set(rules.initial);
 const question=String(untrusted.question||'').slice(0,1600);
 const questionContext=verifiedQuestionContext||buildQuestionContext(question,serverState?.witnesses?.[id]||[]);
 const requestedIntents=new Set([questionContext.questionPlan.primary,...questionContext.questionParts.map(part=>part.intent)]);
 const docRequest=Array.isArray(untrusted?.knowledge?.documentsShown)?untrusted.knowledge.documentsShown:[];
 const shown=docRequest.filter(x=>typeof x==='string'&&owned.has(x)&&canon.documents[x]).slice(0,5);
 // A displayed document is a claim about what was shown, not permission to
 // reveal unrelated evidence. Require confirmed ownership in Supabase.
 const presentedEvidence=serverState?verifiedExhibit(untrusted.presentedEvidenceId,serverState):null;
 const presentedId=presentedEvidence?.id||null;
 const presentedDoc=presentedId?canon.documents[presentedId]:null;
 const facts=[];const add=(text,source,origin='public')=>{
  const clean=String(text||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,380);
  if(clean.length<12||includesExact(facts,clean)||facts.length>=28)return;
  facts.push({id:'f'+facts.length,text:clean,origin,source,certainty:qualified(clean)});
 };
 // Evidence-specific fallback stays grounded even when both models fail.
 // It names the exact server-approved document, never another file or hidden fact.
 if(presentedEvidence){
  add('Okazano mi '+presentedEvidence.type+' — „'+presentedEvidence.title+'”. Mogę odnieść się do treści tego materiału, ale nie będę przedstawiać jej jako własnej obserwacji zdarzenia.','document-'+presentedId,'document');
 }
 // Przy pytaniach o cudzą kartę celowo używaj braku osobistej wiedzy,
 // nie pretekstu do monologu o BHP, dyspozytorni czy warsztacie.
 const activeQuestion=questionContext.questionPlan.positiveQuestion||'';
 const subjectCard=T17.test(activeQuestion);
 if(subjectCard)add(refusal[id],'trusted-scope','current');
 const sourceLines=SAFE_KEYS.map(k=>({key:k,text:p.voice[k]}));
 const current=String(untrusted?.knowledge?.currentGroundedAnswer||'');
 const trustedCandidate=sourceLines.find(x=>x.text===current&&relevance(x.text,activeQuestion)>0);
 const selectedIntent=questionContext.questionPlan.primary;
 if(!subjectCard&&selectedIntent==='workshop_missing_entry'&&id==='JANUSZ')
  add('Nie mogę potwierdzić, dlaczego wpisu brakuje, bez sprawdzenia właściwej karty zlecenia.','trusted-scope','current');
 if(!subjectCard&&selectedIntent==='bhp_sent'&&id==='ELZBIETA')
  add('Nie mogę potwierdzić wysłania zgłoszenia BHP na podstawie samej rozmowy. Trzeba zweryfikować potwierdzenie nadania.','trusted-scope','current');
 if(!subjectCard&&selectedIntent==='test_authorization'&&id==='KAMIL')
  add('Autoryzację testu można zweryfikować w dokumentacji zgody i logach sesji. Sam log nie potwierdza obecności osoby przy urządzeniu.','trusted-scope','current');
 // The same approved public scope is used for newly recognized follow-ups.
 if(!subjectCard&&selectedIntent==='self_departure'&&id==='MAREK')
  add('Wychodziłem z biura w sprawach służbowych. Nie mam w pamięci pełnego wykazu miejsc ani osób, które mnie widziały. Trzeba zestawić rejestr wejść i połączenia.','trusted-scope','current');
 if(!subjectCard&&selectedIntent==='bhp_hazard'&&id==='ELZBIETA')
  add('Lena mówiła mi o ryzyku związanym z TW-217 podczas rozmowy o 21:47. Szczegóły zgłoszenia wymagają weryfikacji w dokumentacji.','trusted-scope','current');
 if(!subjectCard&&selectedIntent==='account_identity'&&id==='KAMIL')
  add('Użycie konta i zapis sesji nie potwierdzają fizycznej obecności człowieka. Potrzebne jest niezależne potwierdzenie.','trusted-scope','current');
 if(!subjectCard&&selectedIntent==='last_contact'&&id==='ELZBIETA')
  add(p.voice.last_seen,'public-last_seen','current');

 const ranked=sourceLines.filter(x=>x.text&&(!subjectCard||['evidence_weak','witness','false_quote','unclear'].includes(x.key)))
  .sort((a,b)=>relevance(b.text,activeQuestion)-relevance(a.text,activeQuestion));
 // Direct, documented answers outrank accidental overlap with Lena's last contact.
 if(!subjectCard&&requestedIntents.has('self_alibi'))add(p.voice.alibi,'public-alibi','current');
 if(!subjectCard&&requestedIntents.has('alarm_report')){
  const report=id==='TOMASZ'?p.voice.what_happened+' '+p.voice.alibi:p.voice.what_happened;
  add(report,'public-what_happened','current');
 }
 if(!subjectCard&&trustedCandidate)add(trustedCandidate.text,'public-'+trustedCandidate.key,'current');
 if(!subjectCard&&ranked[0]&&relevance(ranked[0].text,activeQuestion)>0)add(ranked[0].text,'public-'+ranked[0].key,'current');
 if(!facts.length)add(generic[id],'trusted-scope','current');
 for(const v of ranked.slice(0,7))add(v.text,'public-'+v.key);
 // Only AUTHOR-defined corrections after verified server evidence. Never client-reported.
 const authored=rules.scriptedCorrections[id];
 if(serverState&&authored?.text&&authored.gates.some(g=>g.every(key=>owned.has(key)))){
  add(authored.text,'trusted-correction','public');
 }
 if(presentedEvidence){
  // Signed-off document contents are separate from the witness's firsthand testimony.
  for(const part of String(presentedDoc.body||'').split(/\n\s*\n/).slice(0,3)){
   const clean=part.replace(/\s+/g,' ').trim();
   if(clean.length>=25)add(clean.slice(0,370),'document-'+presentedId,'document');
  }
 }
 for(const docId of shown){
  const doc=canon.documents[docId];
  add('Dokument „'+doc.title+'” jest dostępny w aktach. Jego treść trzeba odróżnić od osobistych obserwacji.','document-'+docId);
  // Dokument nie jest wypowiedzią świadka. Nie wrzucamy całego tekstu jako własnej wiedzy.
 }
 const safeCanonical=facts[0].text;
 const voiceOptions=[{id:'turn',kind:'current',text:safeCanonical}];
 for(const fact of facts.slice(1,7))voiceOptions.push({id:'public-'+['opening','alibi','what_happened','last_seen','witness','motive'][voiceOptions.length-1],kind:'public',text:fact.text});
 return {
  ...untrusted,
  identity:{id:p.id,name:p.name,role:p.role},
  personality:{temperament:'',diction:[],speakingStyle:[]},
  knowledge:{currentGroundedAnswer:safeCanonical,alreadySaid:[],documentsShown:shown,
   groundedOptions:voiceOptions,factBank:facts,limits:[
    'Tylko wypowiedzi z serwerowego banku faktów; pytania i dawne zeznania nie są źródłem nowych faktów.',
    'Zapis dostępu nie jest automatyczną identyfikacją człowieka.',
    'Przyznanie się i sprostowanie wymagają odrębnych, serwerowo potwierdzonych bramek.'
   ]},
  relations:[],psychology:{phase:'neutral',blocked:false,contradictions:[]},
  emotions:{stress:0,trust:0,fatigue:0,mood:'',stance:''},
  memory:{conversation:[],longTerm:[],turn:0,focus:''},
  questionPlan:null,questionParts:[],
  presentedEvidence,serverVerifiedFacts:true
 };
}
export const witnessRefusal=id=>generic[id]||'Nie potrafię tego potwierdzić.';
