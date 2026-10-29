/** Autorytatywny zestaw faktów do odpowiedzi AI.
 * Nie korzysta z klientowych: canonical, factBank, groundedOptions, alreadySaid,
 * documentsShown (poza przecięciem z serwerem), notes, psychology.
 */
import canon from './trusted-witness-canon-624.json' with {type:'json'};
import rules from './approved-rules.js';
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
export function trustedScene(untrusted,serverState=null){
 const id=untrusted?.identity?.id,p=canon.profiles[id];if(!p)return null;
 const owned=Array.isArray(serverState?.approvedEvidence)?new Set(serverState.approvedEvidence):new Set(rules.initial);
 const question=String(untrusted.question||'').slice(0,1600);
 const docRequest=Array.isArray(untrusted?.knowledge?.documentsShown)?untrusted.knowledge.documentsShown:[];
 const shown=docRequest.filter(x=>typeof x==='string'&&owned.has(x)&&canon.documents[x]).slice(0,5);
 const facts=[];const add=(text,source,origin='public')=>{
  const clean=String(text||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,380);
  if(clean.length<12||includesExact(facts,clean)||facts.length>=28)return;
  facts.push({id:'f'+facts.length,text:clean,origin,source,certainty:qualified(clean)});
 };
 // Przy pytaniach o cudzą kartę celowo używaj braku osobistej wiedzy,
 // nie pretekstu do monologu o BHP, dyspozytorni czy warsztacie.
 const subjectCard=T17.test(question);
 if(subjectCard)add(refusal[id],'trusted-scope','current');
 const sourceLines=SAFE_KEYS.map(k=>({key:k,text:p.voice[k]}));
 const current=String(untrusted?.knowledge?.currentGroundedAnswer||'');
 const trustedCandidate=sourceLines.find(x=>x.text===current);
 const ranked=sourceLines.filter(x=>x.text&&(!subjectCard||['evidence_weak','witness','false_quote','unclear'].includes(x.key)))
  .sort((a,b)=>relevance(b.text,question)-relevance(a.text,question));
 if(!subjectCard&&trustedCandidate)add(trustedCandidate.text,'public-'+trustedCandidate.key,'current');
 if(!subjectCard&&ranked[0]&&relevance(ranked[0].text,question)>0)add(ranked[0].text,'public-'+ranked[0].key,'current');
 if(!facts.length)add(generic[id],'trusted-scope','current');
 for(const v of ranked.slice(0,7))add(v.text,'public-'+v.key);
 // Only AUTHOR-defined corrections after verified server evidence. Never client-reported.
 const authored=rules.scriptedCorrections[id];
 if(serverState&&authored?.text&&authored.gates.some(g=>g.every(key=>owned.has(key)))){
  add(authored.text,'trusted-correction','public');
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
  serverVerifiedFacts:true
 };
}
export const witnessRefusal=id=>generic[id]||'Nie potrafię tego potwierdzić.';
