import {appendLedgerTurn} from './witness-ledger-rc22.js';
import crypto from 'node:crypto';
import {coopIdentity} from './coop-session-rc35.js';
import rules from './approved-rules.js';
import {validateProgress618} from './progression-618.js';
const key=process.env.GAME_SESSION_SECRET;
const url=process.env.SUPABASE_URL;
const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const WITNESSES=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
export const configured=()=>!!(key&&key.length>=32&&url&&/^https:\/\//.test(url)&&supabaseKey);
export function checkOrigin(req){
 const origin=req.headers?.origin;if(!origin)return true;
 try{return new URL(origin).host===req.headers.host;}catch{return false;}
}
const safeEq=(a,b)=>{const aa=Buffer.from(a||''),bb=Buffer.from(b||'');return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);};
const sign=id=>crypto.createHmac('sha256',key).update('ps-session-v1:'+id).digest('base64url');
export function sessionId(req,res){
 if(!configured())return null;
 const cooperative=coopIdentity(req);if(cooperative)return cooperative.sessionId;
 const cookies=(req.headers?.cookie||'').split(';').map(s=>s.trim());
 const token=cookies.find(s=>s.startsWith('ps_session='))?.slice(11);
 let id=null;
 if(token){const [candidate,signature]=token.split('.');if(/^[0-9a-f-]{36}$/.test(candidate||'')&&signature&&safeEq(signature,sign(candidate)))id=candidate;}
 if(!id){
  id=crypto.randomUUID();const secure=(req.headers?.['x-forwarded-proto']||'').split(',')[0]==='https';
  res.setHeader('Set-Cookie',`ps_session=${id}.${sign(id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure?'; Secure':''}`);
 }
 return id;
}
export function initialState(){return {schema:1,interviewReceipts:{},approvedEvidence:[...rules.initial],visitedAreas:[],witnesses:Object.fromEntries(WITNESSES.map(k=>[k,[]])),verifiedTimeline:{},puzzles:{},indictment:null,defense:{},verdict:null};}
function headers(){return {'apikey':supabaseKey,'Authorization':'Bearer '+supabaseKey,'Content-Type':'application/json'};}
async function rest(path,init={}){
 const response=await fetch(url.replace(/\/$/,'')+'/rest/v1/'+path,{...init,headers:{...headers(),...(init.headers||{})},signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw Error('supabase-'+response.status);
 // PostgREST returns HTTP 201 with an EMPTY body for INSERT requests
 // using Prefer: return=minimal. This is a successful write, not JSON.
 const payload=await response.text();
 if(!payload.trim())return null;
 return JSON.parse(payload);
}
export async function loadSession(id){
 if(!configured()||!id)throw Error('state-not-configured');
 // Najpierw spróbuj odczytać istniejącą sesję. Wstawianie nie nadpisuje rekordu.
 let found=await rest(`ps_game_sessions?session_id=eq.${encodeURIComponent(id)}&select=revision,approved_state`);
 if(!found?.length){
  await rest('ps_game_sessions?on_conflict=session_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({session_id:id,revision:0,approved_state:initialState()})});
  found=await rest(`ps_game_sessions?session_id=eq.${encodeURIComponent(id)}&select=revision,approved_state`);
 }
 if(!found?.[0]||!Number.isInteger(found[0].revision))throw Error('state-load-failed');
 return {revision:found[0].revision,state:found[0].approved_state};
}
export async function commitSession(id,revision,state){
 // Atomowe CAS w bazie. Dane state muszą zostać obliczone na serwerze po walidacji akcji.
 const r=await rest('rpc/ps_commit_session',{method:'POST',body:JSON.stringify({p_session_id:id,p_expected_revision:revision,p_approved_state:state})});
 return r===true;
}
export function validateAction(state,action){
 if(action?.type==='record_local_turn')return verifyOfflineTurn(state,action);
 if(!action||typeof action!=='object'||Array.isArray(action))return {ok:false,why:'invalid_action'};
 if(action.type==='visit_area'){
  const area=String(action.area||'');
  if(!['med','tech','digital','cctv','admin','lab','bay','workshop','dispatch','audit','office','passage'].includes(area))return {ok:false,why:'unknown_area'};
  return {ok:true,state:{...state,visitedAreas:[...new Set([...(state.visitedAreas||[]),area])].slice(-20)}};
 }
 const advanced=validateProgress618(state,action);if(advanced)return advanced;
 if(action.type!=='collect_evidence')return {ok:false,why:'server_rule_not_implemented'};
 const docId=String(action.docId||'');const doc=rules.documents[docId];
 if(!doc||rules.initial.includes(docId))return {ok:false,why:'unknown_or_initial_evidence'};
 const owned=new Set(state.approvedEvidence||[]);
 if(owned.has(docId))return {ok:true,state};
 if(!['oględziny','przed-mg'].includes(doc.acquisition))return {ok:false,why:'requires_lab_or_separate_analysis'};
 if((rules.gates[docId]||[]).some(req=>!owned.has(req)))return {ok:false,why:'prerequisite_missing'};
 const origin=String(action.origin||'');
 if(origin==='area-search'){
  if(!rules.searchable.includes(docId)||action.area!==doc.area)return {ok:false,why:'invalid_search_source'};
 }else if(origin==='scene-inspection'){
  const spot=rules.spots[String(action.spotId||'')];
  const challenge=rules.challenges[String(action.spotId||'')];
  if(!spot||!challenge||spot.doc!==docId||spot.room!==action.room||action.method!==challenge.method||action.answer!==challenge.correct)
   return {ok:false,why:'inspection_not_verified'};
 }else return {ok:false,why:'unknown_provenance'};
 return {ok:true,state:{...state,approvedEvidence:[...owned,docId]}};
}
// Local/offline testimony is a QUOTE of what the browser displayed, not an
// authoritative correction or fact. Never use it as a source in factBank.
export function verifyOfflineTurn(state,action){
 const id=String(action.witnessId||''),q=String(action.question||''),a=String(action.response||'');
 if(!WITNESSES.includes(id)||q.length<2||q.length>1600||a.length<2||a.length>1450||/[<>\u0000-\u0008]/.test(q+a))return {ok:false,why:'invalid_offline_testimony'};
 const history=approvedHistory(state,id);
 if(history.at(-2)?.text===q&&history.at(-1)?.text===a&&history.at(-1)?.narrativeStatus==='offline_unverified')return {ok:true,state};
 return {ok:true,state:appendReportedTurn(state,id,q,a,[],'offline_unverified')};
}
export function approvedHistory(state,witnessId){return WITNESSES.includes(witnessId)?(state?.witnesses?.[witnessId]||[]).slice(-80):[];}
export function appendReportedTurn(state,witnessId,question,text,factIds,narrativeStatus="unresolved_statement",meta={}){
 if(!WITNESSES.includes(witnessId)||typeof question!=='string'||typeof text!=='string')return state;
 if(meta.turnId&&state.interviewReceipts?.[meta.turnId])return state;
 const original=approvedHistory(state,witnessId);
 const next=[...original,{role:'player',text:question.slice(0,1600)},
  {role:'witness',text:text.slice(0,1450),support:factIds.slice(0,4),narrativeStatus,
   ...(meta.turnId?{turnId:meta.turnId,evidenceId:meta.evidenceId||null,provider:meta.provider,model:meta.model}: {})}].slice(-80);
 // Receipts are independent of the bounded conversational context. Never evict
 // identifiers merely because a witness has spoken 40 more times. The session
 // is deleted by the normal session reset mechanism.
 const receipts=meta.turnId?{...(state.interviewReceipts||{}),[meta.turnId]:{
  witnessId,question:question.slice(0,1600),text:text.slice(0,1450),
  evidenceId:meta.evidenceId||null,provider:meta.provider,model:meta.model,
  factIds:factIds.slice(0,4)
 }}:state.interviewReceipts||{};
 const witnessLedgers=narrativeStatus==='offline_unverified'?state.witnessLedgers:{...(state.witnessLedgers||{}),[witnessId]:appendLedgerTurn(state,witnessId,question,text,narrativeStatus,meta)};
 return {...state,...(witnessLedgers?{witnessLedgers}:{}),interviewReceipts:receipts,witnesses:{...state.witnesses,[witnessId]:next}};
}
export {rules};
// Atomic, durable quota in Supabase; no local per-process counter is trusted.
// If migration 002 is not installed, fail closed rather than spend Cloudflare tokens.
export async function allowEvidenceReview(id, req){
 if(!configured()||!id)return false;
 const forwarded=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();
 const address=forwarded||String(req.socket?.remoteAddress||'unknown');
 const ipHash=crypto.createHmac('sha256',key).update('ps-ai-rate-v1:'+address.slice(0,128)).digest('hex');
 const outcome=await rest('rpc/ps_allow_ai_review',{method:'POST',body:JSON.stringify({p_session_id:id,p_ip_hash:ipHash})});
 return outcome===true;
}
// Database-coordinated quota. Migration 003 is required; missing RPC fails closed.
// Replays of already committed turnIds do not consume an additional AI slot.
export async function allowInterview(id,req){
 if(!configured()||!id)return false;
 const raw=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim()||String(req.socket?.remoteAddress||'unknown');
 const ipHash=crypto.createHmac('sha256',key).update('ps-interview-v1:'+raw.slice(0,128)).digest('hex');
 const outcome=await rest('rpc/ps_allow_interview',{method:'POST',body:JSON.stringify({p_session_id:id,p_ip_hash:ipHash})});
 return outcome===true;
}
export async function deleteSession(id){
 if(!configured()||!id)throw Error('state-not-configured');
 await rest(`ps_game_sessions?session_id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
}
export function clearSessionCookie(req,res){
 const secure=(req.headers?.['x-forwarded-proto']||'').split(',')[0]==='https';
 res.setHeader('Set-Cookie',`ps_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`);
}
