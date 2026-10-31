/** Compatibility boundary. Production reads a single compiled knowledge registry. */
import {registry,selectRegistryKnowledge} from './witness-engine-rc22.js';
import {verifiedExhibit} from './exhibit-context-636.js';
import {buildQuestionContext} from './question-context-630.js';
import {buildWitnessDossier} from './witness-dossiers-rc5.js';
import {questionGuidance} from './question-guidance-rc17.js';
const generic={MAREK:'Nie wiem tego na pewno. Mogę wyjaśnić własne decyzje, nie cudze działania.',TOMASZ:'Nie wiem. Nie byłem świadkiem wszystkiego, co wydarzyło się tej nocy.',JANUSZ:'Nie widziałem tego. Nie chcę zgadywać.',ELZBIETA:'Tego nie wiem. Nie byłam przy tym zdarzeniu.',KAMIL:'Nie potwierdzę tego bez konkretnego zapisu.',MAGDALENA:'Nie potrafię tego potwierdzić z własnej obserwacji.'};
export function trustedScene(input,state=null,context=null){
 const id=input?.identity?.id,profile=registry.profiles[id];if(!profile)return null;
 const question=String(input.question||'').slice(0,1600);
 const selected=selectRegistryKnowledge(id,question,state);
 const owned=state?.approvedEvidence||registry.rules.initial;
 const shown=(Array.isArray(input.knowledge?.documentsShown)?input.knowledge.documentsShown:[]).filter(x=>owned.includes(x)&&registry.documents[x]).slice(0,5);
 const exhibit=state?verifiedExhibit(input.presentedEvidenceId,state):null;
 const facts=[];
 const add=(text,source,origin,stableId,extra={})=>{
  if(!text||facts.some(f=>f.text===text))return;
  facts.push({id:'f'+facts.length,text,source,origin,stableId,certainty:/nie wiem|nie pamiętam|nie potrafię|nie mogę|nie widział|według/i.test(text)?'qualified':'statement',...extra});
 };
 if(exhibit){
  add('Okazano mi '+exhibit.type+' — „'+exhibit.title+'”. Mogę odnieść się do treści tego materiału, ale nie będę przedstawiać jej jako własnej obserwacji zdarzenia.','document-'+exhibit.id,'document','DOC-'+exhibit.id+'-intro');
  const body=registry.documents[exhibit.id].body;
  const sentences=body.replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/u);
  const chunks=[];let chunk='';
  for(const sentence of sentences){
   if(sentence.length>380)throw Error('Document sentence exceeds authored contract');
   if(chunk.length+sentence.length+1>380){chunks.push(chunk);chunk='';}
   chunk+=(chunk?' ':'')+sentence;
  }
  if(chunk)chunks.push(chunk);
  for(const [i,part] of chunks.entries())add(part,'document-'+exhibit.id,'document','DOC-'+exhibit.id+'-'+registry.documentRevisions[exhibit.id].slice(0,14)+'-'+i);
 }
 for(const f of selected.facts)add(f.text,f.source,f.origin,f.id,{certainty:f.certainty,knowledgeKind:f.kind,...(f.authoredId?{knowledgeId:f.authoredId}:{}),...(f.topic?{topic:f.topic}:{})});
 for(const doc of shown)add('Dokument „'+registry.documents[doc].title+'” jest dostępny w aktach. Jego treść trzeba odróżnić od osobistych obserwacji.','document-'+doc,'public','DOC-'+doc+'-available');
 if(!facts.length)add(generic[id],'trusted-scope','public','SCOPE-'+id);
 const dossier=buildWitnessDossier(id,facts,state?.witnesses?.[id]||[]);
 const verifiedContext=context||buildQuestionContext(question,state?.witnesses?.[id]||[]);
 return {
  schema:'ps-witness-context/1',primaryMode:input.primaryMode,
  approvedThreadHistory:input.approvedThreadHistory,
  deliveryGuide:input.deliveryGuide||'',spokenGuide:input.spokenGuide||'',
  identity:profile.identity,question,presentedEvidenceId:input.presentedEvidenceId||null,presentedEvidence:exhibit,
  personality:{temperament:dossier.temperament,diction:dossier.diction,speakingStyle:dossier.speakingStyle},
  knowledge:{factBank:facts,currentGroundedAnswer:facts[0].text,alreadySaid:[],documentsShown:shown,
   groundedOptions:facts.slice(0,7).map((f,i)=>({id:i?'public-'+['opening','alibi','what_happened','last_seen','witness','motive'][i-1]:'turn',kind:i?'public':'current',text:f.text})),
   limits:['Wyłącznie serwerowy rejestr wiedzy. Historia deklaracji i psychologia nie stanowią nowych faktów.','Tajemnice wymagają zatwierdzonych bramek dowodowych.']},
  witnessDossier:dossier,knowledgeCoverage:selected.match,questionGuidance:questionGuidance(question),
  psychology:{phase:dossier.phase,blocked:false,contradictions:[]},emotions:{stress:0,trust:0,fatigue:0,mood:'',stance:''},
  relations:[],memory:{conversation:[],longTerm:[],turn:0,focus:''},
  questionPlan:verifiedContext.questionPlan,questionParts:verifiedContext.questionParts,dialogueFocus:verifiedContext.dialogueFocus,
  serverVerifiedFacts:true
 };
}
export const witnessRefusal=id=>generic[id]||'Nie potrafię tego potwierdzić.';
