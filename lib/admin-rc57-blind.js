/* RC57.5 — genuinely blind, evidence-only inference. Two independent calls:
 * stage initial: 13 playable starting documents; stage complete: all 78 playable docs.
 * No indictment fixture, culprit key, prior model response, verdict or private knowledge
 * is in the payload. Server-only scorer loaded AFTER model response for full stage.
 * No player data, Supabase, mutation or hidden narrative events.
 */
import crypto from 'node:crypto';
import corpus from './admin-rc57-blind-evidence.json' with {type:'json'};
import rules from './approved-rules.js';
import {askInterviewProvider,interviewModels} from './interview-providers-rc24.js';
const PROVIDERS=Object.freeze(['apinex-luna','apinex-jev']);
const IDS=new Set(corpus.suspects.map(x=>x.id));
const docMap=new Map(corpus.documents.map(x=>[x.id,x]));
const fail=(code,status=400)=>Object.assign(Error(code),{code,status});
const idValid=v=>typeof v==='string'&&IDS.has(v);
export const blindInfo=Object.freeze({version:'RC57.5-evidence-only',stages:[{id:'initial',documents:13,label:'Pierwsze wskazówki'},{id:'complete',documents:78,label:'Po zebraniu wszystkich dokumentów'}],providers:PROVIDERS,
 method:'Dwa niezależne odczyty z dokumentów dostępnych graczowi. AI nigdy nie otrzymuje klucza odpowiedzi, warunków werdyktu ani wcześniejszego typowania.',
 limitations:['Model dostaje teksty dokumentów, ale nie gra sam w interfejsie i nie rozwiązuje ręcznie pięciu minigier.',
 'Test bez rozmów na żywo ze świadkami; zeznania są oceniane w osobnym trybie RC57.2.',
 'Zgodność z kanonem i poprawne identyfikatory dowodów nie dowodzą, że argumentacja jest wystarczająca. RC57.6 sprawdza też źródła w wolnym tekście, wybrane czasy i luki chronologii — to heurystyki do ręcznej kontroli.',
 'Dwa wywołania API mogą zużyć limit lub koszt u dostawcy. Brak globalnego ograniczenia między instancjami Vercel.']});
function verifyCorpus(){
 if(corpus.documents.length!==78||docMap.size!==78||corpus.initialIds.length!==13||
    corpus.suspects.length!==6||IDS.size!==6||
    [...docMap.keys()].some(id=>!Object.hasOwn(rules.documents,id))||
    corpus.initialIds.some(id=>!docMap.has(id))||Object.keys(rules.documents).length!==78)return false;
 return true;
}
export function blindEvidencePacket(stage){
 if(!['initial','complete'].includes(stage))throw fail('invalid_blind_stage');
 if(!verifyCorpus())throw fail('blind_source_mismatch',503);
 const available=stage==='initial'?corpus.initialIds:new Array(...docMap.keys());
 const documents=available.map(id=>docMap.get(id)).map(d=>({...d}));
 return {version:'rc57.5-player-only',phase:stage,suspects:corpus.suspects.map(x=>({...x})),documents};
}
function normalizeDecision(result,available){
 if(!result||typeof result!=='object'||Array.isArray(result))throw fail('invalid_blind_model_answer',502);
 const suspectId=idValid(result.suspectId)?result.suspectId:null;
 const alternativeId=idValid(result.alternativeId)?result.alternativeId:null;
 const ids=Array.isArray(result.evidenceIds)?result.evidenceIds.slice(0,10).filter(x=>typeof x==='string'):[];
 const unknown=ids.filter(id=>!available.has(id));
 // We retain unknown references in report, marking them as invalid rather than silently deleting.
 const ranking=Array.isArray(result.ranking)?result.ranking.slice(0,6).filter(x=>idValid(x)):[];
 const str=(v,max=2000)=>typeof v==='string'?v.slice(0,max):'';
 const certainty=['low','medium','high'].includes(result.certainty)?result.certainty:'unspecified';
 return {suspectId,alternativeId,evidenceIds:ids,unknownEvidenceIds:unknown,ranking,
  certainty,reasoning:str(result.reasoning),counterargument:str(result.counterargument),
  missingProof:str(result.missingProof),canJustifyCharge:result.canJustifyCharge===true};
}
export async function runBlindStage({stage,provider,confirmed},infer=askInterviewProvider){
 if(process.env.RC57_LIVE_TEST_ENABLED!=='true')throw fail('blind_tests_disabled',403);
 if(!PROVIDERS.includes(provider)||!['initial','complete'].includes(stage))throw fail('invalid_blind_selection');
 if(confirmed!==true)throw fail('explicit_confirmation_required',400);
 if(!process.env.APINEX_API_KEY)throw fail('provider_not_configured',503);
 const packet=blindEvidencePacket(stage);const available=new Set(packet.documents.map(x=>x.id));
 const digest=crypto.createHash('sha256').update(JSON.stringify(packet)).digest('hex');
 const system=`Jesteś NIEZALEŻNYM śledczym. Rozwiązujesz fikcyjne śledztwo tylko na podstawie pakietu dokumentów dostępnych zwykłemu graczowi. Nie znasz rozwiązania, warunków gry, ukrytego klucza, wcześniejszych typowań ani danych spoza pakietu. Nie korzystaj z domysłów o autorze gry. Nie traktuj nazwisk w dokumentach, zeznań ani kont użytkownika jako automatycznego potwierdzenia fizycznej obecności. Dopuszczaj brak rozstrzygnięcia: suspectId:null. Oceń konkurencyjny scenariusz i granice wnioskowania. Numeruj przywołane dokumenty wyłącznie rzeczywistymi ID z pakietu. Wynik WYŁĄCZNIE jako JSON o polach: suspectId (ID jednej z sześciu osób lub null), alternativeId (ID lub null), evidenceIds (tablica 3–8 ID), ranking (lista ID od najbardziej prawdopodobnego), certainty ('low'|'medium'|'high'), reasoning (po polsku, rozumowanie po źródłach), counterargument (najsilniejsza alternatywa), missingProof (jakiego dowodu nadal brakuje), canJustifyCharge (boolean). Nie wymyślaj dowodów ani zdarzeń. Jeśli brak podstaw do wskazania osoby, zapisz null zamiast zgadywania.`;
 let response;const began=Date.now();
 try{response=await infer({provider,system,payload:packet,maxTokens:1800,temperature:0.12,timeoutMs:29000,scope:'tester'});}
 catch(error){const code=String(error?.code||error?.message||'provider_error');if(/429|rate.limit/i.test(code))throw fail('blind_provider_rate_limited',429);
  if(/timeout|abort/i.test(code))throw fail('blind_provider_timeout',504);if(/401|403|authoriz/i.test(code))throw fail('blind_provider_auth_failed',503);
  if(/request.too.large|413/i.test(code))throw fail('blind_provider_payload_too_large',413);throw fail('blind_provider_failure',502);}
 const decision=normalizeDecision(response,available);
 // Grading code is imported only after independent inference has finished.
 const qa=(await import('./admin-rc57-claim-audit.js')).auditBlindClaims(decision,{availableIds:available,allDocumentIds:new Set(docMap.keys())});
 const grade=stage==='complete'?(await import('./admin-rc57-blind-grade.js')).evaluateBlindDecision({phase:stage,decision,validIds:available}):
  {graded:false,reason:'Brak oceny kanonicznej na etapie 13 dokumentów.'};
 const integrity={documents:packet.documents.length,sourceHash:digest,allCitedDocumentsKnown:decision.unknownEvidenceIds.length===0,
  citations:decision.evidenceIds.length,unverifiableSemanticClaims:'Wymagają oceny człowieka; same ID dokumentów nie weryfikują rozumowania.'};
 return {release:blindInfo.version,phase:stage,provider,model:interviewModels[provider],elapsedMs:Date.now()-began,
  blind:true,decision,grade,qa,integrity,limitations:blindInfo.limitations};
}
