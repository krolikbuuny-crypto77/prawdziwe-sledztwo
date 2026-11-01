/* RC57 admin API. Publicly reachable endpoint, but all data/tests protected by signed admin session. */
import {configured,authorized,verifyPassword,loginAllowed,registerLogin,setSession,clearSession,sameOrigin,securityHeaders} from '../lib/admin-rc57-auth.js';
import {runBatch,rc57Info,totalFor} from '../lib/admin-rc57-suite.js';
import adminPage from '../lib/admin-rc57-ui.js';
import publicStatus from '../lib/status-handler.js';
import {runLiveStep,liveAvailable,liveInfo} from '../lib/admin-rc57-live.js';
import {runGameBatch,gameAuditInfo} from '../lib/admin-rc57-whole-game.js';
import {runPlaythroughScenario,playthroughInfo} from '../lib/admin-rc57-playthrough.js';
import {runBlindStage,blindInfo} from '../lib/admin-rc57-blind.js';
const out=(res,status,payload)=>res.status(status).json(payload);
// Hobby-compatible router: 3 logical paths share ONE serverless function.
// Vercel passes the rewrite query param as req.query.view. Parse req.url as fallback.
function viewOf(req){
 const explicit=typeof req.query?.view==='string'?req.query.view:null;
 if(explicit)return explicit;
 try{return new URL(String(req.url||''),'https://local.invalid').searchParams.get('view')||'';}catch{return '';}
}
function bodyOf(req){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});if(Buffer.byteLength(raw,'utf8')>32000)throw Error('too_large');const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_json');return data;}
export default async function handler(req,res){
 const view=viewOf(req);
 if(view==='page')return adminPage(req,res);
 if(view==='service-status')return publicStatus(req,res);
 securityHeaders(res);res.setHeader('Content-Type','application/json; charset=utf-8');
 if(!configured())return out(res,503,{ok:false,error:'panel_not_configured'});
 if(req.method==='GET'){
  if(!authorized(req))return out(res,401,{ok:false,error:'login_required'});
  return out(res,200,{ok:true,info:rc57Info,live:liveAvailable(),liveInfo,gameAudit:gameAuditInfo,playthrough:playthroughInfo,blind:blindInfo,session:'active'});
 }
 if(req.method!=='POST')return out(res,405,{ok:false,error:'method_not_allowed'});
 if(!sameOrigin(req))return out(res,403,{ok:false,error:'origin_rejected'});
 if(String(req.headers?.['content-type']||'').split(';')[0]!=='application/json')return out(res,415,{ok:false,error:'content_type_required'});
 let body;try{body=bodyOf(req);}catch{return out(res,400,{ok:false,error:'invalid_body'});}
 if(body.action==='login'){
  if(!loginAllowed(req))return out(res,429,{ok:false,error:'too_many_attempts'});
  const matched=verifyPassword(body.password);registerLogin(req,matched);
  if(!matched)return out(res,401,{ok:false,error:'invalid_credentials'});
  setSession(res);return out(res,200,{ok:true,info:rc57Info,live:liveAvailable(),liveInfo,gameAudit:gameAuditInfo,playthrough:playthroughInfo,blind:blindInfo});
 }
 if(!authorized(req))return out(res,401,{ok:false,error:'login_required'});
 if(body.action==='logout'){clearSession(res);return out(res,200,{ok:true});}
 if(body.action==='live-step'){
  try{return out(res,200,{ok:true,...await runLiveStep({mode:body.mode,provider:body.provider,offset:body.offset,token:body.token,confirmed:body.confirmed},req)});}
  catch(error){const allowed=new Set(['live_tests_disabled','invalid_live_range','provider_not_configured','unexpected_live_token','explicit_confirmation_required','bad_live_token','bad_live_signature','invalid_live_state','live_step_out_of_order','incomplete_live_history','unknown_witness']);
   return out(res,allowed.has(error?.code)?(error?.status||400):500,{ok:false,error:allowed.has(error?.code)?error.code:'live_test_failed'});}
 }
 if(body.action==='blind-stage'){
  try{return out(res,200,{ok:true,...await runBlindStage({stage:body.stage,provider:body.provider,confirmed:body.confirmed})});}
  catch(error){const allowed=new Set(['blind_tests_disabled','invalid_blind_selection','explicit_confirmation_required','provider_not_configured','blind_source_mismatch','invalid_blind_model_answer','blind_provider_rate_limited','blind_provider_timeout','blind_provider_auth_failed','blind_provider_payload_too_large','blind_provider_failure']);
   return out(res,allowed.has(error?.code)?(error?.status||400):500,{ok:false,error:allowed.has(error?.code)?error.code:'blind_test_failed'});}
 }
 if(body.action==='playthrough-scenario'){
  if(!playthroughInfo.scenarios.some(x=>x.id===body.scenario))return out(res,400,{ok:false,error:'invalid_playthrough_scenario'});
  try{return out(res,200,{ok:true,...runPlaythroughScenario(body.scenario)});}
  catch{return out(res,500,{ok:false,error:'playthrough_execution_failed'});}
 }
 if(body.action==='game-batch'){
  if(!Number.isInteger(body.offset)||body.offset<0||body.offset>=gameAuditInfo.total)return out(res,400,{ok:false,error:'invalid_game_test_range'});
  try{return out(res,200,{ok:true,...runGameBatch({offset:body.offset,limit:20})});}
  catch{return out(res,500,{ok:false,error:'game_audit_execution_failed'});}
 }
 if(body.action==='batch'){
  const mode=String(body.mode||'');const offset=body.offset;
  if(!totalFor(mode)||!Number.isInteger(offset)||offset<0||offset>=totalFor(mode))return out(res,400,{ok:false,error:'invalid_test_range'});
  try{return out(res,200,{ok:true,...runBatch({mode,offset,limit:20})});}
  catch{return out(res,500,{ok:false,error:'test_execution_failed'});}
 }
 return out(res,400,{ok:false,error:'unknown_action'});
}
