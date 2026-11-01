/* RC57 admin API. Publicly reachable endpoint, but all data/tests protected by signed admin session. */
import {configured,authorized,verifyPassword,loginAllowed,registerLogin,setSession,clearSession,sameOrigin,securityHeaders} from '../lib/admin-rc57-auth.js';
import {runBatch,rc57Info,totalFor} from '../lib/admin-rc57-suite.js';
import adminPage from '../lib/admin-rc57-ui.js';
import publicStatus from '../lib/status-handler.js';
const out=(res,status,payload)=>res.status(status).json(payload);
// Hobby-compatible router: 3 logical paths share ONE serverless function.
// Vercel passes the rewrite query param as req.query.view. Parse req.url as fallback.
function viewOf(req){
 const explicit=typeof req.query?.view==='string'?req.query.view:null;
 if(explicit)return explicit;
 try{return new URL(String(req.url||''),'https://local.invalid').searchParams.get('view')||'';}catch{return '';}
}
function bodyOf(req){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});if(Buffer.byteLength(raw,'utf8')>4096)throw Error('too_large');const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_json');return data;}
export default async function handler(req,res){
 const view=viewOf(req);
 if(view==='page')return adminPage(req,res);
 if(view==='service-status')return publicStatus(req,res);
 securityHeaders(res);res.setHeader('Content-Type','application/json; charset=utf-8');
 if(!configured())return out(res,503,{ok:false,error:'panel_not_configured'});
 if(req.method==='GET'){
  if(!authorized(req))return out(res,401,{ok:false,error:'login_required'});
  return out(res,200,{ok:true,info:rc57Info,session:'active'});
 }
 if(req.method!=='POST')return out(res,405,{ok:false,error:'method_not_allowed'});
 if(!sameOrigin(req))return out(res,403,{ok:false,error:'origin_rejected'});
 if(String(req.headers?.['content-type']||'').split(';')[0]!=='application/json')return out(res,415,{ok:false,error:'content_type_required'});
 let body;try{body=bodyOf(req);}catch{return out(res,400,{ok:false,error:'invalid_body'});}
 if(body.action==='login'){
  if(!loginAllowed(req))return out(res,429,{ok:false,error:'too_many_attempts'});
  const matched=verifyPassword(body.password);registerLogin(req,matched);
  if(!matched)return out(res,401,{ok:false,error:'invalid_credentials'});
  setSession(res);return out(res,200,{ok:true,info:rc57Info});
 }
 if(!authorized(req))return out(res,401,{ok:false,error:'login_required'});
 if(body.action==='logout'){clearSession(res);return out(res,200,{ok:true});}
 if(body.action==='batch'){
  const mode=String(body.mode||'');const offset=body.offset;
  if(!totalFor(mode)||!Number.isInteger(offset)||offset<0||offset>=totalFor(mode))return out(res,400,{ok:false,error:'invalid_test_range'});
  try{return out(res,200,{ok:true,...runBatch({mode,offset,limit:20})});}
  catch{return out(res,500,{ok:false,error:'test_execution_failed'});}
 }
 return out(res,400,{ok:false,error:'unknown_action'});
}
