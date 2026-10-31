import {askInterviewProvider,interviewModels,INTERVIEW_CHAIN} from '../lib/interview-providers-rc24.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
import {interviewWirePayload,interviewAnswerSystem,interviewAuditSystem} from '../lib/interview-naturalness-rc28.js';
import {registry} from '../lib/witness-engine-rc22.js';
import {chooseWitnessStrategy} from '../lib/witness-strategy-rc22.js';
import {ledgerContext,witnessRevisionSignature} from '../lib/witness-ledger-rc22.js';
import {buildConversationState} from '../lib/conversation-state-rc21.js';
import {buildPolishPragmatics} from '../lib/polish-pragmatics-rc20.js';
import {randomUUID} from 'node:crypto';
import {signInterviewExcerpt} from '../lib/interview-restore-proof-rc34.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {factContractIssue} from '../lib/interview-fact-contract-rc14.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext,repeatsIrrelevantly} from '../lib/question-context-630.js';
import {reviewInterviewReply,repairCue} from '../lib/interview-quality-635.js';
import {buildDialogueMemory,priorDistinctAnswers} from '../lib/dialogue-memory-636.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
import {spokenStyleGuide,reviewSpokenReply,normalizeWitnessSpeech} from '../lib/spoken-dialogue-623.js';
import {styleForWitness} from '../lib/narrative-voice-619.js';
import {dialogueContinuity} from '../lib/dialogue-continuity-620.js';
import {buildThreadCue} from '../lib/dialogue-threads-621.js';
import {dialogueDirection} from '../lib/dialogue-direction-rc32.js';
import {classifyModelReply} from '../lib/story-consistency.js';
import {configured,sessionId,loadSession,commitSession,appendReportedTurn,approvedHistory,allowInterview} from '../lib/server-state.js';
/* Pakiet 6.7: rozumienie intencji -> dobór udostępnionych faktów -> wypowiedź -> niezależna ocena semantyczna.
 * Stan fabuły i bramki pozostają w silniku lokalnym. Model NIE ma narzędzi do ich modyfikacji.
 * ZAI_API_KEY jest wyłącznie zmienną środowiskową Vercel. */
const IDS=new Set(['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']);
const LIMIT=23_000;
const scrub=(s,n=400)=>typeof s==='string'?s.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n):'';
const fail=(res,status,message)=>res.status(status).json({ok:false,error:message});
// Cloud paraphrases require semantic verification; local fallback uses authorised authored text.
// Safe, per-request diagnostic metadata. Never send API keys, prompts, tokens or raw upstream errors.
const providerModel=id=>interviewModels[id]||(id==='unavailable'?'none':id);
const diagnostics=(provider,reason,requestId,startedAt)=>({provider,model:providerModel(provider),fallbackReason:reason||null,requestId,
 durationMs:Math.max(0,Math.min(300000,Date.now()-startedAt))});
const failureCode=(provider,error)=>{
 const e=String(error?.message||'');
 if(error?.name==='AbortError'||/abort|timeout/i.test(e))return provider+'_timeout';
 if(e==='upstream-429'||e==='upstream_rate_limit')return provider+'_rate_limited';
 if(e==='upstream_authorization'||e==='upstream-401'||e==='upstream-403')return provider+'_authorization_failed';
 if(/^upstream-5\d\d$/.test(e))return provider+'_upstream_unavailable';
 if(e===provider+'_not_configured')return provider+'_not_configured';
 if(e==='upstream_payment_required')return provider+'_payment_required';
 if(e==='upstream_request_too_large')return provider+'_request_too_large';
 if(e==='upstream_unavailable')return provider+'_upstream_unavailable';
 if(e==='upstream_invalid_request')return provider+'_invalid_request';
  if(e==='model_not_available')return provider+'_model_not_available';
 if(e==='provider-not-configured')return provider+'_not_configured';
 return provider+'_request_failed';
};

const list=(v,max,len)=>Array.isArray(v)?v.slice(0,max).map(x=>scrub(x,len)).filter(Boolean):[];
function validated(input){
 if(!input||![2,3].includes(input.version)||!IDS.has(input.witnessId)||!input.context||typeof input.context!=='object')return null;
 if(typeof input.question!=='string'||input.question.trim().length<2||input.question.length>1600||input.question.trim()!==input.question)return null;
 const c=input.context,identity=c.identity||{},k=c.knowledge||{};
 const presentedEvidenceId=input.presentedEvidenceId||null;
 if(presentedEvidenceId!==null&&(typeof presentedEvidenceId!=='string'||!/^[A-Za-z0-9_-]{2,65}$/.test(presentedEvidenceId)))return null;
 if(c.schema!=='ps-witness-context/1'||identity.id!==input.witnessId||
    scrub(input.canonical,1900)!==scrub(k.currentGroundedAnswer,1900))return null;
 if(!Array.isArray(c.memory?.conversation)||c.memory.conversation.length>12||
    (c.memory.longTerm!==undefined&&(!Array.isArray(c.memory.longTerm)||c.memory.longTerm.length>6))||
    !Array.isArray(k.alreadySaid)||k.alreadySaid.length>7||
    !Array.isArray(c.psychology?.contradictions)||c.psychology.contradictions.length>8||
    !Array.isArray(k.groundedOptions)||k.groundedOptions.length>13)return null;
 // Plan z parsera lokalnego jest wskazówką do rozumienia pytania, nie źródłem faktów.
 const p=c.request?.semanticPlan;
 if(p!==undefined&&p!==null){
  if(!p||typeof p!=='object'||!Array.isArray(p.intents)||p.intents.length>5||
   (p.clauses!==undefined&&(!Array.isArray(p.clauses)||p.clauses.length>5||p.clauses.some(part=>!part||typeof part.text!=='string'||part.text.length>500||!Array.isArray(part.intents)||part.intents.length>3)))||
   !Array.isArray(p.aspects)||p.aspects.length>4||
   p.intents.some(x=>typeof x!=='string'||x.length>35)||
   p.aspects.some(x=>typeof x!=='string'||x.length>35))return null;
 }
 const questionPlan=p?{
  primary:scrub(p.primary,35),intents:p.intents.map(x=>scrub(x,35)),
  aspects:p.aspects.map(x=>scrub(x,35)),
  negated:!!p.slots?.negated,compound:!!p.slots?.compound,
  needsClarification:!!p.needsClarification
 }:null;
 const questionParts=(p?.slots?.compound&&Array.isArray(p.clauses)?p.clauses:[])
  .filter(x=>x.intents?.length).slice(0,4).map(x=>({text:scrub(x.text,500),intent:scrub(x.intents[0],35)}));
 const opts=k.groundedOptions;
 if(opts.some(x=>!x||typeof x!=='object'||typeof x.id!=='string'||typeof x.kind!=='string'||typeof x.text!=='string'))return null;
 const options=opts.map(x=>({id:scrub(x.id,36),kind:scrub(x.kind,12),text:scrub(x.text,1900)}));
 if(!options.length||options[0].id!=='turn'||options[0].text!==scrub(input.canonical,1900)||
    options.some(x=>!x.text||!(/^(turn|public-(opening|alibi|what_happened|last_seen|witness)|said-[0-6])$/).test(x.id)||
      !((x.id==='turn'&&x.kind==='current')||(x.id.startsWith('public-')&&x.kind==='public')||(x.id.startsWith('said-')&&x.kind==='said')))||
    new Set(options.map(x=>x.id)).size!==options.length)return null;
 let factBank=null;
 if(k.factBank!==undefined){
  if(!Array.isArray(k.factBank)||k.factBank.length<1||k.factBank.length>36)return null;
  const validOrigin=new Set(['current','public','prior-local']);
  factBank=k.factBank.map((x,i)=>({id:scrub(x?.id,12),text:scrub(x?.text,380),origin:scrub(x?.origin,16),
   source:scrub(x?.source,40),certainty:scrub(x?.certainty,12)}));
  if(factBank.some((x,i)=>x.id!=='f'+i||x.text.length<12||!validOrigin.has(x.origin)||
     !['statement','qualified'].includes(x.certainty)||
     !(x.origin==='current'?x.source==='turn':x.origin==='public'? /^public-(opening|alibi|what_happened|last_seen|witness)$/.test(x.source):/^journal-\d+$/.test(x.source))))return null;
  if(!factBank.some(x=>x.origin==='current'))return null;
 }
 return {
  primaryMode:input.version===3,
  identity:{id:input.witnessId,name:scrub(identity.name,80),role:scrub(identity.role,100)},
  personality:{temperament:scrub(c.personality?.temperament,320),diction:list(c.personality?.diction,3,220),speakingStyle:list(c.personality?.speakingStyle,3,130)},
  knowledge:{currentGroundedAnswer:scrub(input.canonical,1900),alreadySaid:list(k.alreadySaid,7,550),
   groundedOptions:options,factBank,documentsShown:list(k.documentsShown,8,100),limits:list(k.limits,7,220)},
  relations:(Array.isArray(c.relations)?c.relations:[]).slice(0,4).map(x=>({person:scrub(x.person,80),context:'Osoba wspomniana w rozmowie'})),
  emotions:{stress:Math.min(100,Math.max(0,Number(c.emotions?.stress)||0)),trust:Math.min(100,Math.max(0,Number(c.emotions?.trust)||0)),
   fatigue:Math.min(100,Math.max(0,Number(c.emotions?.fatigue)||0)),mood:scrub(c.emotions?.mood,70),stance:scrub(c.emotions?.stance,30)},
  psychology:{phase:scrub(c.psychology?.phase,30),blocked:!!c.psychology?.blocked,
   contradictions:c.psychology.contradictions.slice(0,8).map(x=>scrub(x.topic,100))},
  memory:{turn:Math.max(0,Number(c.memory?.turn)||0),focus:scrub(c.memory?.focus,65),
   conversation:c.memory.conversation.slice(-12).map(x=>({role:x.role==='witness'?'świadek':'śledczy',text:scrub(x.text,420)})),
   longTerm:(Array.isArray(c.memory.longTerm)?c.memory.longTerm:[]).slice(0,6).map(x=>({
    turn:Math.max(0,Math.min(1000000,Number(x?.turn)||0)),topic:scrub(x?.topic,35),
    statement:scrub(x?.statement,520),status:['wcześniejsze zeznanie','sprostowane'].includes(x?.status)?x.status:'wcześniejsze zeznanie'
   }))},
  question:scrub(input.question,1600),questionPlan,questionParts,presentedEvidenceId
 };
}
async function chat(system,scene,maxTokens=650,temperature=0.25,provider='zai',phase='generate'){
 const timeout=phaseTimeout({provider,phase,turnDeadline:scene?._responseDeadline,providerDeadline:scene?._providerDeadline});
 if(!timeout)throw Error('timeout-budget');
 const modelScene=interviewWirePayload(compactInterviewPayload(scene));
 const wireSystem=system;
 const outputLimit=Math.min(maxTokens,phase==='semantic-audit'?900:1200);
 try{
  return await askInterviewProvider({provider,system:wireSystem,payload:modelScene,maxTokens:outputLimit,temperature,timeoutMs:timeout});
 }catch(error){
  if(error&&typeof error==='object')error.diagnostic={...(error.diagnostic||{}),inputCharacters:wireSystem.length+JSON.stringify(modelScene).length,
   inputUtf8Bytes:Buffer.byteLength(wireSystem+JSON.stringify(modelScene),'utf8'),maxOutputTokens:outputLimit};
  throw error;
 }
}
function anchors(text){return [...text.matchAll(/\b\d+(?::\d+)?(?:[.,]\d+)?\b/g)].map(x=>x[0]).sort();}
const uncertainty=/\b(?:nie wiem|nie pamiętam|nie jestem pew|nie mogę potwierdzić|nie potrafię|chyba|może|możliwe|wydaje mi się|prawdopodobnie|według|podobno)\b/i;
const negation=/\b(?:nie|nigdy|nikt|nikogo|niczego|żaden|żadna|bez|brak)\b/i;
const confession=/\b(?:zabiłem|zabiłam|zamordowałem|zamordowałam|przyznaję się|ukryłem ciało|ukryłam ciało|zniszczyłem dowody)\b/i;
function hardGuard(sourceText,text){
 if(!text||text.length>1650||/[<>\u0000-\u0008\u000e-\u001f]/.test(text))return false;
 const nums=anchors(sourceText),next=anchors(text);
 // Nie wymagamy recytowania wszystkich liczb z wybranych faktów.
 // Każda liczba wypowiedziana przez model MUSI jednak pochodzić z dozwolonego tekstu.
 const available=new Map();for(const n of nums)available.set(n,(available.get(n)||0)+1);
 for(const n of next){const left=available.get(n)||0;if(!left)return false;available.set(n,left-1);}
 // Polarity and uncertainty must be verified *in context* by the independent
 // semantic audit. Merely omitting a lexical negation from an unrelated sentence
 // is not proof of a false claim. Literal excerpts may skip AI audit ONLY if
 // they retain the selected source's negation/uncertainty (see fast path below).
 if(confession.test(text)&&!confession.test(sourceText))return false;
 return true;
}
const semanticSystem=interviewAuditSystem;
const answerSystem=interviewAnswerSystem;
const legacySystem=[
 'Jesteś SILNIKIEM ROZUMIENIA PYTAŃ w polskiej grze detektywistycznej. Ustal sens pytania oraz intencję całej wypowiedzi.',
 'Wybierz jedną lub dwie pasujące, już dozwolone wypowiedzi z knowledge.groundedOptions, a potem przeformułuj je bez zmiany faktów.',
 'deliveryGuide i spokenGuide opisują wyłącznie sposób mówienia; nie są źródłem faktów ani odblokowań.',
 'Pisz krótko i potocznie, jak świadek, a nie urzędowy komunikat. Nie stosuj didaskaliów ani prawniczych formułek.',
 'Nie twórz nowych godzin, motywów, dowodów, osób, sprzeczności ani przyznań się do winy.',
 'Zwróć tylko JSON {"decision":"answer" lub "fallback","sourceIds":["turn"],"text":"wypowiedź","prefaceKey":0}.'
].join(' ');

// Fast path is intentionally VERY strict: the generated wording must be
// a literal contiguous excerpt of one authorised fact. No paraphrase is
// auto-approved; all other responses still undergo the independent AI audit.
function fastVerbatimEntailment(scene,selected,proposal){
 if(scene.polishPragmatics?.requireSemanticAudit||selected.length!==1||scene.questionParts?.length||scene.dialogueFocus||scene.presentedEvidence||proposal.length>380||
   (priorDistinctAnswers(scene.dialogueMemory,scene.question).length&&/\b(?:dok[aą]d|sk[aą]d|dlaczego|kto\s+(?:pana|pani[aą]|ci[eę])?\s*widzia[łl]|co\s+dok[łl]adnie|doprecyzuj|a\s+(?:gdzie|kto|czemu|sk[aą]d))\b/i.test(scene.question)))return false;
 const compact=s=>String(s).normalize('NFC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim();
 const source=compact(selected[0].text),answer=compact(proposal);
 return answer.length>=20&&source.includes(answer);
}
// Obaj dostawcy dostają ten sam zestaw instrukcji, faktów i historię świadka.
// Brak kompletnej, zgodnej z faktami odpowiedzi uruchamia następnego dostawcę.
export async function attemptInterview(scene,provider,invoke=chat,trace=null){
 const canonical=scene.knowledge.currentGroundedAnswer;
 scene.polishPragmatics=buildPolishPragmatics(scene.question,scene.approvedThreadHistory||scene.memory?.conversation||[]);
 scene.conversationState=buildConversationState(scene.identity.id,scene.approvedThreadHistory||scene.memory?.conversation||[],scene.question,scene.presentedEvidence);
 if(!scene.witnessStrategy)scene.witnessStrategy=chooseWitnessStrategy(scene.identity.id,null,scene.declarationLedger,scene.question,scene.presentedEvidence);
 if(scene.conversationState.followUpMode!=='answer_current_question')scene.polishPragmatics.requireSemanticAudit=true;
 // RC21: an explicit knowledge limit is an answer, not automatically an open question.
 if(scene.dialogueMemory)scene.dialogueMemory={...scene.dialogueMemory,openQuestions:scene.conversationState.awaitingClarification.map(e=>e.question)};
 // Semantic interpretation belongs to the cloud model. The local question
 // classifier is NOT forwarded to either provider: it may be wrong and should
 // never constrain the model's reading of the original Polish question.
 const modelContext=(payload,phase)=>({
  ...payload, questionPlan:undefined, questionParts:phase==='semantic-audit'?payload.questionParts:undefined,
  dialogueFocus:payload.dialogueFocus?{
   previousQuestion:payload.dialogueFocus.previousQuestion,
   previousAnswer:payload.dialogueFocus.previousAnswer,
   previousAnswerVerified:payload.dialogueFocus.previousAnswerVerified,
   note:payload.dialogueFocus.note
  }:null
 });
 const run=async(system,payload,maxTokens,temp,phase)=>{
  const started=Date.now();
  try{
   const answer=await invoke(system,{...modelContext(payload,phase),_responseDeadline:scene._responseDeadline,
    _providerDeadline:scene._providerDeadline},maxTokens,temp,provider,phase);
   trace?.add(provider,phase,'ok',Date.now()-started,'accepted');
   return answer;
  }catch(e){
   if(e&&typeof e==='object')e.interviewPhase=phase;
   trace?.add(provider,phase,'error',Date.now()-started,/timeout|abort/i.test(String(e?.message||''))?'timeout':'provider_error');
   throw e;
  }
 };
 const reject=(reason)=>{trace?.add(provider,'quality','rejected',0,reason);return null;};
 const reviseOrReject=(reason,proposal,revision)=>{
  trace?.add(provider,'quality','rejected',0,reason);
  if(revision===0){priorDraft=String(proposal||'');repairReason=reason;return true;}
  return false;
 };
 if(!scene.knowledge.factBank){
  const answer=await run(legacySystem,scene,2200,0.25,'generate');
  const ids=Array.isArray(answer.sourceIds)?answer.sourceIds:typeof answer.sourceId==='string'?[answer.sourceId]:[];
  const chosen=ids.map(id=>scene.knowledge.groundedOptions.find(x=>x.id===id));
  if(answer.decision!=='answer'||ids.length<1||ids.length>2||chosen.some(x=>!x)||new Set(ids).size!==ids.length)return reject('bad_fact_ids');
  const grounded=chosen.map(x=>x.text).join(' '), proposed=scrub(answer.text,1650);
  if(!hardGuard(grounded,proposed))return reject('hard_guard');
  if(!reviewSpokenReply(proposed,{compound:scene.questionParts?.length>1||scene.polishPragmatics?.segments?.length>1}).ok)return reject('poor_style');
  return {ok:true,decision:'answer',sourceIds:ids,sourceId:ids[0],factIds:[],text:proposed,prefaceKey:0,semanticVerified:false};
 }
 const previousDistinct=priorDistinctAnswers(scene.dialogueMemory,scene.question);
 const allowedEmotions=new Set(['neutral','focused','uncertain','tense','guarded','surprised','sad','relieved','controlled','irritated']);
 const readEmotion=response=>allowedEmotions.has(response?.emotion)?response.emotion:'neutral';
 let priorDraft='';let repairReason='';
 for(let revision=0;revision<2;revision++){
  const allowedFactIds=scene.knowledge.factBank.map(f=>f.id);
  const contract=''; // The complete contract is maintained once in interviewAnswerSystem.
  const response=await run(answerSystem+contract,{...scene,allowedFactIds,
   ...(revision?{repairInstruction:{...repairCue(scene,priorDraft,repairReason),
    contractIssue:repairReason,allowedFactIds}}:{})},
   2200,0.35,revision?'rewrite':'generate');
  const ids=Array.isArray(response?.factIds)?response.factIds:[];
  const selected=ids.map(id=>scene.knowledge.factBank.find(f=>f.id===id));
  const contractIssue=factContractIssue(response,scene.knowledge.factBank);
  if(contractIssue){
   if(contractIssue==='model_fallback')return reject(contractIssue);
   if(reviseOrReject(contractIssue,response?.text,revision))continue;
   return null;
  }
  const proposal=normalizeWitnessSpeech(scrub(response.text,1650));
  if(!proposal||!reviewSpokenReply(proposal,{compound:scene.questionParts.length>1||scene.polishPragmatics?.segments?.length>1}).ok){
   if(reviseOrReject('poor_style',proposal,revision))continue;
   return null;
  }
  const quality=reviewInterviewReply(scene,proposal,selected);
  if(!quality.ok){
   if(reviseOrReject(quality.reason,proposal,revision))continue;
   return null;
  }
  const grounded=selected.map(f=>f.text).join(' ');
  if(!hardGuard(grounded,proposal)){
   if(reviseOrReject('hard_guard',proposal,revision))continue;
   return null;
  }
  // RC30: styl jest wskazówką generowania, nie warunkiem poprawności zeznania.
  // Nie odrzucaj zgodnej z faktami wypowiedzi tylko za "sztywny" język:
  // ponowna próba zużywa limit i może utracić pierwszą poprawną odpowiedź.
  // Zabezpieczenia faktów, znaczenia i powtarzalności pozostają poniżej.
  // A verbatim *positive fragment* from a statement containing a negation can
  // misleadingly hide its qualification. Such excerpts require semantic audit.
  const polarityPreserved=(!uncertainty.test(grounded)||uncertainty.test(proposal))&&
   (!negation.test(grounded)||negation.test(proposal));
  if(polarityPreserved&&fastVerbatimEntailment(scene,selected,proposal)){
   trace?.add(provider,'quality','ok',0,'accepted');
   return {ok:true,decision:'answer',primaryMode:scene.primaryMode,
    factIds:ids,sourceIds:[],sourceId:'turn',text:proposal,emotion:readEmotion(response),semanticVerified:true,prefaceKey:0};
  }
  const audit=await run(semanticSystem,{
   question:scene.question,questionParts:scene.questionParts,polishPragmatics:scene.polishPragmatics,conversationState:scene.conversationState,declarationLedger:scene.declarationLedger,witnessStrategy:scene.witnessStrategy,
   conversation:scene.memory.conversation.slice(-5),dialogueFocus:scene.dialogueFocus,
   presentedEvidence:scene.presentedEvidence,dialogueDynamics:scene.dialogueDynamics,
   priorReplies:previousDistinct,
   selectedFacts:selected.map(f=>({text:f.text,certainty:f.certainty,origin:f.origin,source:f.source,kind:f.knowledgeKind})),
   proposedAnswer:proposal
  },1100,0.15,'semantic-audit');
  const partsOk=scene.questionParts.length<2||(Array.isArray(audit?.coveredParts)&&
    audit.coveredParts.length===scene.questionParts.length&&audit.coveredParts.every(x=>x===true));
  const semanticallyRepeated=previousDistinct.length>0&&audit?.semanticRepeat===true;
  if(semanticallyRepeated){
   if(reviseOrReject('semantic_repetition',proposal,revision))continue;
   return null;
  }
  if(!partsOk){
   if(reviseOrReject('missing_question_part',proposal,revision))continue;
   return null;
  }
  if(classifyModelReply(audit,true)!=='grounded_reply'){
   const reason=audit?.entailed===false?'not_entailed':audit?.relevant===false?'not_relevant':'not_complete';
   if(reviseOrReject(reason,proposal,revision))continue;
   return null;
  }
  trace?.add(provider,'quality','ok',0,'accepted');
  return {ok:true,decision:'answer',primaryMode:scene.primaryMode,
   factIds:ids,sourceIds:[],sourceId:'turn',text:proposal,emotion:readEmotion(response),semanticVerified:true,prefaceKey:0};
 }
 return null;
}

// A successful Supabase CAS makes the reply durable. After a lost HTTP response,
// replay the exact stored cloud answer, never generate or append another witness turn.
function findInterviewTurn(state,turnId){
 if(!turnId||!state)return null;
 const receipt=state.interviewReceipts?.[turnId];
 if(receipt)return receipt;
 if(!state.witnesses)return null;
 for(const [witnessId,history] of Object.entries(state.witnesses)){
  if(!Array.isArray(history))continue;
  for(let i=history.length-1;i>=1;i--){
   const row=history[i],ask=history[i-1];
   if(row?.role==='witness'&&row.turnId===turnId&&ask?.role==='player')
    return {witnessId,question:ask.text,evidenceId:row.evidenceId||null,text:row.text,
     factIds:row.support||[],provider:row.provider,model:row.model};
  }
 }
 return null;
}
function replayInterview(prior,turnId){
 if(!(Object.hasOwn(interviewModels,prior.provider)||['gemini','groq','mistral'].includes(prior.provider))||typeof prior.text!=='string')return {ok:false,error:'Stored turn not reusable'};
 return {ok:true,decision:'answer',primaryMode:true,serverCanonical:true,semanticVerified:prior.provider!=='local',localVerified:prior.provider==='local',
  sourceIds:[],sourceId:'turn',factIds:prior.factIds,text:prior.text,prefaceKey:0,
  provider:prior.provider,model:prior.model||providerModel(prior.provider),turnId,replayed:true,
  fallbackReason:null,requestId:randomUUID(),durationMs:0,
  turnProof:signInterviewExcerpt({...prior,turnId})};
}

export default async function handler(req,res){
 const startedAt=Date.now(); // Include initial session reads and shared quota in this request budget.
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(res,405,'POST required');}
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return fail(res,403,'Origin rejected');}catch{return fail(res,403,'Origin rejected');}}
 // Server-owned knowledge and a durable session are required for both cloud and local replies.
 const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 if(Buffer.byteLength(raw,'utf8')>LIMIT)return fail(res,413,'Payload too large');
 let input;try{input=JSON.parse(raw)}catch{return fail(res,400,'Invalid JSON')}
 const incoming=validated(input);
 if(!incoming||incoming.psychology.blocked)return fail(res,400,'Invalid witness context');
 const clientTurnId=typeof input.turnId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.turnId)?input.turnId.toLowerCase():null;
 if(!clientTurnId)return fail(res,400,'Valid turn ID required');
 let scene=incoming;
 // Charakterystyka po stronie Vercel jest wspólna dla obu dostawców i nie daje nowych faktów.
 scene.deliveryGuide=styleForWitness(scene.identity.id);
 scene.spokenGuide=spokenStyleGuide(scene.identity.id,scene.question,scene.questionParts);
 // Obie chmury czytają identyczną, zapisową historię. Dialogi nie są dowodem prawdziwości wypowiedzi.
 let stored=null,playerSession=null;
 if(!configured())return fail(res,503,'Server session not configured');
 if(configured()){
  try{
   playerSession=sessionId(req,res);
   stored=await loadSession(playerSession);
   const previous=clientTurnId?findInterviewTurn(stored.state,clientTurnId):null;
   if(previous){
    if(previous.witnessId!==input.witnessId||previous.question!==incoming.question||previous.evidenceId!==(incoming.presentedEvidenceId||null))return fail(res,409,'Turn ID already used for different question');
    return res.status(200).json(replayInterview(previous,clientTurnId));
   }
   scene.approvedThreadHistory=approvedHistory(stored.state,input.witnessId);
   scene.memory.conversation=scene.approvedThreadHistory.slice(-12).map(item=>({role:item.role==='witness'?'świadek':'śledczy',text:item.narrativeStatus==='offline_unverified'?'Odpowiedź lokalna (niezweryfikowana; nie jest źródłem faktów).':item.text}));
   scene.memory.longTerm=[]; // Niezatwierdzone lokalnie wspomnienia nie przechodzą przez zmianę dostawcy.
  }catch{return fail(res,503,'Server testimony history unavailable')}
 }
 // Replace ALL client-provided facts with server-owned material before either AI call.
 const approvedTranscript=stored?approvedHistory(stored.state,input.witnessId):[];
 const verifiedQuestionContext=buildQuestionContext(scene.question,approvedTranscript);
 scene=trustedScene(scene,stored?.state||null,verifiedQuestionContext);
 if(!scene)return fail(res,400,'Unknown witness');
 // No cloud interpretation of a client-supplied document without server ownership.
 if(incoming.presentedEvidenceId&&!scene.presentedEvidence)return fail(res,409,'Evidence not confirmed on server');
 // Distributed quota is checked only after a committed turn has been replayed.
 try{if(!await allowInterview(playerSession,req))return fail(res,429,'Interview rate limit');}
 catch{return fail(res,503,'Shared rate limiter unavailable');}
 // 6.30: reconstruct question semantics from the ORIGINAL question and server-
 // approved transcript AFTER removing all client-authored fact/context hints.
 Object.assign(scene,verifiedQuestionContext);
 if(stored){
  scene.memory.conversation=scene.approvedThreadHistory.slice(-12).map(x=>({role:x.role==='witness'?'świadek':'śledczy',text:x.narrativeStatus==='offline_unverified'?'Odpowiedź lokalna (niezweryfikowana; nie jest źródłem faktów).':x.text}));
  scene.memory.longTerm=[];
 }
 // Pamięć jest odbudowywana z serwerowo zapisanej historii, nie z danych klienta.
 scene.dialogueMemory=buildDialogueMemory(scene.approvedThreadHistory||[],scene.question);
 scene.declarationLedger=ledgerContext(stored?.state||{},input.witnessId,scene.question);
 scene.witnessStrategy=chooseWitnessStrategy(input.witnessId,stored?.state||null,scene.declarationLedger,scene.question,scene.presentedEvidence);
 // RC32: ton i kierunek rozmowy wyłącznie z pytania i zatwierdzonej historii.
 scene.dialogueDynamics=dialogueDirection(scene);
 const canonical=scene.knowledge.currentGroundedAnswer;
 // Zmiana tonu wynika z dialogu, ale nie z autorytatywnych dowodów ani ze stanu postępu.
 // Po włączeniu Supabase korzysta z zatwierdzonej historii, nie z treści dopisanej w przeglądarce.
 const said=scene.memory.conversation.filter(x=>x.role==='śledczy').slice(-10)
   .map(x=>x.text.toLocaleLowerCase('pl'));
 const challenged=said.filter(q=>/(?:kłamiesz|kłamstwo|przyznaj się|zamordował|zabił)/.test(q)).length;
 const verified=said.filter(q=>/(?:skąd wiesz|co potwierdza|czy widział|jak sprawdzić|z jakiego źródła)/.test(q)).length;
 const repeats=said.length>2 && said.at(-1)===said.at(-3);
 const style=challenged>verified+1?'Odpowiada ostrożniej na zarzuty, ale nie traci pamięci ani nie przyznaje winy bez dopuszczalnych faktów.'
  :verified>challenged+1?'Na konkretne pytania odpowiada rzeczowo, bez automatycznego ujawniania nowych faktów.'
  :'Zachowuje powściągliwy, indywidualny ton.';
 scene.deliveryGuide+=' '+style+(repeats?' Śledczy wrócił do wcześniejszego pytania: wolno to zauważyć, nie wolno zmieniać zeznania bez podstaw.':'');
 // Odrębna reżyseria zachowania; tylko zatwierdzona historia, nigdy nowy dowód.
 scene.deliveryGuide+=' '+dialogueContinuity(scene.identity.id,scene.memory.conversation);
 // Tematy z zatwierdzonej historii (do 40 par), identyczne dla obu dostawców; nie są faktami.
 scene.deliveryGuide+=' '+buildThreadCue(scene.identity.id,scene.approvedThreadHistory||scene.memory.conversation,scene.question);
 if(scene.dialogueFocus){scene.deliveryGuide+=' Zwróć uwagę, że śledczy nawiązuje do ostatniej odpowiedzi. Odnieś się do pytania uzupełniającego, nie powtarzaj mechanicznie wcześniejszej wypowiedzi. Nie traktuj tej wypowiedzi jako ustalonego faktu.';}
 // APINEX Luna -> GLM -> DeepSeek -> Z.ai -> authorised local registry. Modele nie mają dostępu do narzędzi zmieniających stan gry.
 const baseWitnessRevision=stored?witnessRevisionSignature(stored.state,input.witnessId):null;
 const requestId=randomUUID();
 scene._responseDeadline=startedAt+INTERVIEW_BUDGET.totalMs;
 const reasons=[],providerFailures=[];
 const trace=makeInterviewTrace();
 if(!process.env.APINEX_API_KEY)reasons.push('apinex_not_configured');
 if(!process.env.ZAI_API_KEY)reasons.push('zai_not_configured');
 const providers=input.localOnly===true?['local']:INTERVIEW_CHAIN.filter(id=>id==='local'||(id==='zai'?!!process.env.ZAI_API_KEY:!!process.env.APINEX_API_KEY));
 if(input.localOnly===true)reasons.push('client_requested_local_fallback');
 let apinexBlocked=false,apinexOutages=0;
 for(const provider of providers){
  if(provider.startsWith('apinex-')&&apinexBlocked){
   trace.add(provider,'generate','skipped',0,'shared_provider_limit');continue;
  }
  // Fixed APINEX deadline from REQUEST start: do not extend the window on each attempt.
  // Every provider also has its own ceiling, preventing one slow model from
  // consuming all remaining retries. Last 25s belongs to local reply + Supabase CAS.
  scene._providerDeadline=provider.startsWith('apinex-')
   ?Math.min(startedAt+INTERVIEW_BUDGET.apinexWindowMs,Date.now()+INTERVIEW_BUDGET.perApinexMs)
   :provider==='zai'?Math.min(startedAt+INTERVIEW_BUDGET.apinexWindowMs+INTERVIEW_BUDGET.zaiWindowMs,Date.now()+INTERVIEW_BUDGET.perZaiMs)
   :scene._responseDeadline-INTERVIEW_BUDGET.commitReserveMs;
  if(provider!=='local'&&Date.now()+INTERVIEW_BUDGET.minCallMs>=scene._providerDeadline){
   reasons.push(provider+'_budget_exhausted');trace.add(provider,'generate','skipped',0,'no_retry_budget');continue;
  }
  try{
   const result=provider==='local'?localInterviewReply(scene):await attemptInterview(scene,provider,chat,trace);
   if(provider==='local')trace.add('local','generate','ok',0,'authored_fallback');
   if(result&&(provider==='local'||!repeatsIrrelevantly(scene.question,result.text,approvedTranscript))){
    if(stored){
     // Zeznanie zachowuje status relacji świadka, nie potwierdzonego faktu fabularnego.
     // Przy nieudanym CAS nie pokazujemy odpowiedzi, której nie zapisano w historii.
     const usedFacts=scene.knowledge.factBank.filter(f=>(result.factIds||[]).includes(f.id));
     const normalizeStatement=s=>String(s).normalize('NFC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim();
     const status=provider==='local'?'local_authored_statement':usedFacts.some(f=>(f.source==='trusted-correction'||f.knowledgeKind==='authorized-personal-correction')&&normalizeStatement(f.text)===normalizeStatement(result.text))?'scripted_correction':'unresolved_statement';
     const meta={documentRefs:[...new Set(usedFacts.filter(f=>f.origin==='document').map(f=>f.source.slice('document-'.length)))].map(id=>({id,revision:registry.documentRevisions[id]})),knowledgeIds:usedFacts.map(f=>f.stableId).filter(Boolean),turnId:clientTurnId,evidenceId:incoming.presentedEvidenceId||null,provider,model:providerModel(provider)};
     const next=appendReportedTurn(stored.state,input.witnessId,scene.question,result.text,result.factIds||[],status,meta);
     let saved=await commitSession(playerSession,stored.revision,next);
     if(!saved){
      stored=await loadSession(playerSession);
      const existing=clientTurnId?findInterviewTurn(stored.state,clientTurnId):null;
      if(existing){
       if(existing.witnessId!==input.witnessId||existing.question!==scene.question||existing.evidenceId!==(incoming.presentedEvidenceId||null))return fail(res,409,'Turn ID already used for different question');
       return res.status(200).json(replayInterview(existing,clientTurnId));
      }
      if(witnessRevisionSignature(stored.state,input.witnessId)!==baseWitnessRevision)return res.status(409).json({ok:false,error:'Rozmowa zmieniła się w trakcie odpowiedzi. Ponów pytanie.',retryable:true});
      saved=await commitSession(playerSession,stored.revision,appendReportedTurn(stored.state,input.witnessId,scene.question,result.text,result.factIds||[],status,meta));
      if(!saved&&clientTurnId){
       stored=await loadSession(playerSession);
       const raced=findInterviewTurn(stored.state,clientTurnId);
       if(raced&&raced.witnessId===input.witnessId&&raced.question===scene.question&&raced.evidenceId===(incoming.presentedEvidenceId||null))return res.status(200).json(replayInterview(raced,clientTurnId));
      }
     }
     if(!saved)return fail(res,503,'Testimony history conflict');
    }
    const info={...diagnostics(provider,reasons.join(';')||null,requestId,startedAt),providerFailures,qualityDiagnostics:trace.summary()};
    console.info('interview-diagnostic',JSON.stringify(info)); // No question, transcript or secrets.
    return res.status(200).json({...result,serverCanonical:true,turnId:clientTurnId,
     turnProof:signInterviewExcerpt({witnessId:input.witnessId,question:scene.question,text:result.text,turnId:clientTurnId,provider,model:providerModel(provider),evidenceId:incoming.presentedEvidenceId||null}),...info});
   }
   trace.add(provider,'post-check','rejected',0,'server_guard');
   reasons.push(provider+'_rejected_by_validation');
  }catch(error){
   const code=failureCode(provider,error);reasons.push(code);
   // APINEX account quotas and credentials are shared by all ten models.
   // A quota/payment/auth failure cannot be repaired by selecting another model.
   if(provider.startsWith('apinex-')){
    if(['upstream_rate_limit','upstream_authorization','upstream_payment_required'].includes(error?.code)||[401,402,403,429].includes(error?.diagnostic?.upstreamStatus))apinexBlocked=true;
    else if(error?.code==='upstream_unavailable'&&++apinexOutages>=2)apinexBlocked=true;
   }
   providerFailures.push({provider,model:providerModel(provider),code,phase:error?.interviewPhase||'unknown',
    ...(error?.diagnostic||{})});
  }
 }

 const retryAfterSeconds=Math.max(0,...providerFailures.filter(x=>!x.code.endsWith('_request_too_large')).map(x=>x.retryAfterSeconds||0));
 if(retryAfterSeconds)res.setHeader('Retry-After',String(retryAfterSeconds));
 const info={...diagnostics('unavailable',reasons.join(';')||'cloud_response_unavailable',requestId,startedAt),providerFailures,
  retryAfterSeconds:retryAfterSeconds||null,qualityDiagnostics:trace.summary()};
 console.info('interview-diagnostic',JSON.stringify(info));
 return res.status(503).json({ok:false,error:'AI chwilowo niedostępne. Ponów pytanie.',retryable:true,...info});
}
