/* RC57.2 — real, isolated AI interrogation audit. No database or player-state writes.
 * The same production cloud attempt+semantic audit runs on server-authored, non-secret canon.
 * Token carries only a signed, bounded synthetic history for ONE witness, never player data.
 * Calls consume external provider quota. A single browser run is sequential; with no durable
 * store the server cannot enforce a global daily quota across serverless instances/replays. */
import crypto from 'node:crypto';
import {deflateRawSync,inflateRawSync} from 'node:zlib';
import {attemptInterview} from '../api/interview.js';
import {trustedScene} from './trusted-interview-624.js';
import {buildQuestionContext} from './question-context-630.js';
import {buildDialogueMemory} from './dialogue-memory-636.js';
import {ledgerContext} from './witness-ledger-rc22.js';
import {chooseWitnessStrategy} from './witness-strategy-rc22.js';
import {dialogueDirection} from './dialogue-direction-rc32.js';
import {styleForWitness} from './narrative-voice-619.js';
import {spokenStyleGuide} from './spoken-dialogue-623.js';
import {reviewNaturalSpeech} from './interview-naturalness-rc28.js';
import {interviewModels} from './interview-providers-rc24.js';
import {auditLiveDialogue} from './admin-rc57-claim-audit.js';
import {makeInterviewTrace} from './interview-observability-636.js';

const IDS=Object.freeze(['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']);
const TURNS=Object.freeze({'live-short':3,'live-long':12,'live-stress':3});
const PROVIDERS=Object.freeze(['apinex-luna','apinex-jev']);
const QUESTIONS=Object.freeze([
 'Jaką rolę pełniłeś podczas tej zmiany?',
 'Co możesz potwierdzić na podstawie własnej pamięci?',
 'Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?',
 'Kto może potwierdzić to, co powiedziałeś przed chwilą?',
 'Skąd o tym wiesz i co jest tylko twoim przypuszczeniem?',
 'Nie twierdzę, że kłamiesz. Czy chcesz sprostować wcześniejszą odpowiedź?',
 'Czy pamiętasz, co powiedziałeś na początku tej rozmowy?',
 'Ukrywasz coś? Powiedz konkretnie, czego jesteś pewien.',
 'Nie pytam o winę. Chodzi o godzinę i miejsce. Co wiesz na pewno?',
 'Czym różni się twoje wspomnienie od tego, co można ustalić z dokumentów?',
 'Wrócę do wcześniejszej odpowiedzi: co jest potwierdzone, a co nie?',
 'Proszę podsumować, jakie granice swojej wiedzy wskazałeś w trakcie rozmowy.'
]);
const KEY=()=>process.env.RC57_ADMIN_SECRET||'';
const HASH=txt=>crypto.createHmac('sha256',KEY()).update(txt).digest('base64url');
const SESSION=req=>String(req.headers?.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-ps57='))||'';
const seal=object=>{const b=deflateRawSync(Buffer.from(JSON.stringify(object),'utf8'),{level:6}).toString('base64url');return b+'.'+HASH('rc57-live-v2:'+b)};
const goodSignature=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const createError=(code,status=400)=>Object.assign(new Error(code),{code,status});
const sessionId=req=>HASH('rc57-live-session:'+SESSION(req));
export const liveInfo=Object.freeze({modes:[{id:'live-short',turns:18,perWitness:3},{id:'live-long',turns:72,perWitness:12},{id:'live-stress',turns:18,perWitness:3}],providers:PROVIDERS,
 notes:'Prawdziwe odpowiedzi jednego modelu, oceniane przez istniejącą produkcyjną kontrolę semantyczną. Bez bazy danych i bez prawdziwej sesji gracza. Nie obejmuje kooperacji ani rzeczywistego zapisu. Dostawca może wykonać więcej niż jedno wywołanie API na pytanie.'});
export function liveEnabled(){return process.env.RC57_LIVE_TEST_ENABLED==='true'}
export function liveAvailable(){return {enabled:liveEnabled(),providers:PROVIDERS.filter(()=>!!process.env.APINEX_API_KEY)}};
function parseToken(token,req){
 if(typeof token!=='string'||token.length>28000)throw createError('bad_live_token');
 const parts=token.split('.');if(parts.length!==2||!goodSignature(parts[1]||'',HASH('rc57-live-v2:'+parts[0])))throw createError('bad_live_signature');
 let v;try{v=JSON.parse(inflateRawSync(Buffer.from(parts[0],'base64url'),{maxOutputLength:40000}).toString('utf8'));}catch{throw createError('bad_live_token');}
 if(v?.v!==2||v.session!==sessionId(req)||v.issued>Date.now()||Date.now()-v.issued>120*60*1000||!TURNS[v.mode]||!PROVIDERS.includes(v.provider)||
   !Number.isInteger(v.next)||v.next<1||v.next>=TURNS[v.mode]*6||!Array.isArray(v.history)||v.history.length>2*TURNS[v.mode]||
   v.history.some(x=>!x||!['player','witness'].includes(x.role)||typeof x.text!=='string'||x.text.length>1650))throw createError('invalid_live_state');
 return v;
}
function chooseQuestion(index,mode){const steps=TURNS[mode],wi=Math.floor(index/steps),turn=index%steps;
 // 3-turn mode checks role, memory and correction; deep mode covers all patterns.
 const qi=steps===3?[0,1,2][turn]:turn;
 const id=IDS[wi],female=id==='ELZBIETA'||id==='MAGDALENA';
 const femaleWords={0:'Jaką rolę pełniłaś podczas tej zmiany?',
  3:'Kto może potwierdzić to, co powiedziałaś przed chwilą?',
  6:'Czy pamiętasz, co powiedziałaś na początku tej rozmowy?',
  2:'Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłaś?',
  5:'Nie twierdzę, że kłamiesz. Czy chcesz sprostować wcześniejszą odpowiedź?',
  7:'Ukrywasz coś? Powiedz konkretnie, czego jesteś pewna?',
  11:'Proszę podsumować, jakie granice swojej wiedzy wskazałaś w trakcie rozmowy.'};
 const stressQuestions=[
  'Gdze byles po polnocy? Wymien tylko to, co pamietasz.',
  'Potwirdz skad to wiesz. Czy to twoja pamiec czy dokument?',
  'Nei pytam o Lenę. Gdze byles i kto moze to potwierdzic?'
 ];
 const stressFemale=[
  'Gdze bylas po polnocy? Wymien tylko to, co pamietasz.',
  'Potwirdz skad to wiesz. Czy to twoja pamiec czy dokument?',
  'Nei pytam o Lenę. Gdze bylas i kto moze to potwierdzic?'
 ];
 return {id,question:mode==='live-stress'?(female?stressFemale:stressQuestions)[turn]:female&&femaleWords[qi]!==undefined?femaleWords[qi]:QUESTIONS[qi],index:turn,witnessIndex:wi};
}
function textMsg(error){
 const code=String(error?.code||error?.message||'provider_error');
 const status=Number(error?.diagnostic?.upstreamStatus||error?.status);
 if(status===402||/payment.required|insufficient.quota/i.test(code))return 'provider_quota_exhausted';
 if([401,403].includes(status)||/authoriz|401|403/i.test(code))return 'provider_authorization_failed';
 if(status===404||/model.not.available|model.not.found/i.test(code))return 'provider_model_unavailable';
 if([400,413,422].includes(status)||/invalid.request|request.too.large/i.test(code))return 'provider_invalid_request';
 if(status===429||/rate.limit|429/i.test(code))return 'provider_rate_limited';
 if([408,504].includes(status)||/timeout|abort/i.test(code))return 'provider_timeout';
 if(/not.configured/i.test(code))return 'provider_not_configured';
 if((status>=500&&status<=599)||/upstream.{0,12}(?:5\d\d|unavailable)|\b50[234]\b/i.test(code))return 'provider_upstream_unavailable';
 return 'provider_error';
}
// RC57.10.7: report only allowlisted failure metadata to the authenticated
// tester. Never expose provider raw messages, prompts, request bodies or keys.
function safeFailureDiagnostic(error,trace){
 const d=error?.diagnostic||{};
 const summary=trace.summary();
 const status=Number(d.upstreamStatus??error?.status);
 const retry=Number(d.retryAfterSeconds);
 const allowedPhases=new Set(['generate','rewrite','semantic-audit']);
 const attempted=summary.attempts.filter(x=>x.result==='error'&&allowedPhases.has(x.phase)).at(-1);
 const phase=allowedPhases.has(error?.interviewPhase)?error.interviewPhase:attempted?.phase||'unknown';
 const kinds=new Set(['local_requests_per_minute','requests_per_minute','tokens_per_minute','requests_daily','tokens_daily','insufficient_quota']);
 return {code:textMsg(error),phase,
  upstreamStatus:Number.isInteger(status)&&status>=400&&status<=599?status:null,
  retryAfterSeconds:Number.isFinite(retry)&&retry>0?Math.min(300,Math.ceil(retry)):null,
  quotaKind:kinds.has(d.quotaKind)?d.quotaKind:null,
  requestDispatched:d.requestDispatched===true,
  providerCalls:summary.providerCalls,
  rejectedChecks:summary.rejectedChecks};
}
function makeScene(id,question,history){
 const context=buildQuestionContext(question,history);
 const scene=trustedScene({identity:{id},question,primaryMode:true,knowledge:{documentsShown:[]}},null,context);
 if(!scene)throw createError('unknown_witness');
 scene._rc57Tester=true;
 scene.approvedThreadHistory=history;
 scene.memory.conversation=history.slice(-12).map(x=>({role:x.role==='witness'?'świadek':'śledczy',text:x.text}));
 scene.memory.longTerm=[];
 scene.dialogueMemory=buildDialogueMemory(history,question);
 scene.declarationLedger=ledgerContext({},id,question);
 scene.witnessStrategy=chooseWitnessStrategy(id,null,scene.declarationLedger,question,null);
 scene.dialogueDynamics=dialogueDirection(scene);
 scene.deliveryGuide=styleForWitness(id);
 scene.spokenGuide=spokenStyleGuide(id,question,scene.questionParts||[]);
 scene._responseDeadline=Date.now()+54000;
 scene._providerDeadline=Date.now()+45000;
 return scene;
}
// Optional invoke allows transport-free tests. Production uses the SAME attemptInterview as /api/interview.
export async function runLiveStep({mode,provider,offset,token,confirmed},req,invoke=attemptInterview){
 if(!liveEnabled())throw createError('live_tests_disabled',403);
 if(!TURNS[mode]||!PROVIDERS.includes(provider)||!Number.isInteger(offset)||offset<0||offset>=TURNS[mode]*6)throw createError('invalid_live_range');
 if(!process.env.APINEX_API_KEY)throw createError('provider_not_configured',503);
 let prior;
 if(offset===0){if(token!==null&&token!==undefined)throw createError('unexpected_live_token');if(confirmed!==true)throw createError('explicit_confirmation_required');
  prior={v:2,mode,provider,next:0,issued:Date.now(),session:sessionId(req),history:[]};
 }else{prior=parseToken(token,req);if(prior.mode!==mode||prior.provider!==provider||prior.next!==offset)throw createError('live_step_out_of_order');}
 const current=chooseQuestion(offset,mode),steps=TURNS[mode];
 const history=current.index===0?[]:prior.history;
 if(current.index>0&&history.length!==current.index*2)throw createError('incomplete_live_history');
 const scene=makeScene(current.id,current.question,history);
 const start=Date.now();let answer='',status='pass',detail='',safeFactIds=[],stopReason=null,failureDiagnostics=null,qa={findings:[],requiresManualReview:false};
 const trace=makeInterviewTrace();
 try{
  const result=invoke===attemptInterview?await attemptInterview(scene,provider,undefined,trace):await invoke(scene,provider);
  if(!result?.ok||result.decision!=='answer'||!result.semanticVerified||typeof result.text!=='string'){
   const audit=trace.summary();
   const rejected=audit.attempts.filter(x=>x.result==='rejected').map(x=>({phase:x.phase,code:x.code}));
   // Only allowlisted codes, never raw model text, API response or prompt.
   qa={version:'RC57.10.11-production-audit',findings:[],requiresManualReview:true,
    productionAudit:{providerCalls:audit.providerCalls,correctiveCalls:audit.correctiveCalls,
     rejectedChecks:rejected.slice(-6),lastSafeReason:rejected.at(-1)?.code||'no_safe_answer'}};
   // This question was NOT answered: do not poison the signed conversation with
   // a fabricated '[Brak bezpiecznej odpowiedzi]' witness turn. Manual retry only.
   status='blocked';stopReason='answer_quality_rejected';
   detail='Model nie uzyskał zatwierdzonej wypowiedzi. Kod kontroli: '+qa.productionAudit.lastSafeReason+'. Spróbuj ponownie po sprawdzeniu przyczyny.';
  }else{
   answer=result.text.slice(0,1650);safeFactIds=Array.isArray(result.factIds)?result.factIds.slice(0,4):[];
   qa=auditLiveDialogue({question:current.question,answer,history,witnessId:current.id});
   if(!reviewNaturalSpeech(scene,answer).ok){status='warning';detail='Wypowiedź sztywna językowo — sprawdź ją ręcznie.';}
   else if(history.some(x=>x.role==='witness'&&x.text.toLocaleLowerCase('pl').trim()===answer.toLocaleLowerCase('pl').trim())){
    status='warning';detail='Odpowiedź dosłownie powtarza wcześniejszą wypowiedź.';
   }else{detail='Odpowiedź przeszła produkcyjny audyt faktów i wstępną kontrolę stylu; naturalność wymaga oceny człowieka.';}
   if(status==='pass'&&qa.requiresManualReview){status='warning';detail=qa.findings.map(x=>x.detail).join(' ');}
   if(status==='pass'&&current.index===2&&/\blen(?:a|e|ę|y|ie)\b/i.test(answer)){
    status='warning';detail='Pytanie wyklucza temat Leny; model go wspomina. Zweryfikuj ręcznie, czy to zbędna dygresja.';
   }
  }
 }catch(error){
  // Transport failures are NOT bad testimony. Hold the offset and signed history.
  failureDiagnostics=safeFailureDiagnostic(error,trace);
  detail=failureDiagnostics.code;status='blocked';stopReason=detail;
 }
 const item={id:'AI-'+String(offset+1).padStart(3,'0'),witness:current.id,group:current.index===0?'otwarcie':current.index===2?'negacja':current.index>=6?'pamiec_i_nacisk':'kontynuacja',
  status,detail,question:current.question,answer,provider,model:interviewModels[provider],turn:current.index+1,elapsedMs:Date.now()-start,factIds:safeFactIds,qa,
  ...(failureDiagnostics?{failureDiagnostics}:{})};
 const total=steps*6,next=offset+1;
 // A blocked provider did NOT answer: keep the same offset and signed prior token.
 // The UI can retry manually without counting it as a failed witness response.
 if(status==='blocked')return {mode,offset,total,results:[item],nextToken:token||null,
  retryOffset:offset,retryable:!['provider_authorization_failed','provider_not_configured','provider_model_unavailable','provider_invalid_request','provider_quota_exhausted'].includes(stopReason)&&!['requests_daily','tokens_daily','insufficient_quota'].includes(failureDiagnostics?.quotaKind),
  suggestedPauseSeconds:stopReason==='provider_rate_limited'?Math.max(60,failureDiagnostics?.retryAfterSeconds||0):stopReason==='answer_quality_rejected'?10:20,
  complete:false,stopped:stopReason,release:'RC57.10.11-live'};
 const nextHistory=[...history,{role:'player',text:current.question},{role:'witness',text:answer||'[Brak bezpiecznej odpowiedzi modelu]'}];
 const nextToken=next<total?seal({...prior,next,history:current.index===steps-1?[]:nextHistory}):null;
 return {mode,offset,total,results:[item],nextToken,complete:next===total,stopped:null,release:'RC57.10.11-live'};
}
