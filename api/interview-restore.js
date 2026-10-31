import {assertCoopAccess} from '../lib/coop-session-rc35.js';
/** RC34: Restore dialogue continuity from a saved local game without trusting its canon. */
import {configured,sessionId,checkOrigin,loadSession,commitSession,appendReportedTurn} from '../lib/server-state.js';
import {verifyInterviewExcerpt,restoreHash} from '../lib/interview-restore-proof-rc34.js';
const ids=new Set(['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']);
const allowedProvider=new Set(['gemini','zai','groq','mistral','local','apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const safe=s=>typeof s==='string'&&s.length>=2&&!/[<>\u0000-\u0008\u000e-\u001f]/.test(s);
const respond=(res,code,body)=>{res.setHeader('Cache-Control','no-store');return res.status(code).json(body);};
export function parseRestore(body){
 if(!body||!ids.has(body.witnessId)||!Array.isArray(body.turns)||!body.turns.length||body.turns.length>8)return null;
 const turns=[];
 for(const row of body.turns){
  if(!row||!safe(row.question)||row.question.length>1600||!safe(row.text)||row.text.length>1450)return null;
  const turnId=typeof row.turnId==='string'&&uuid.test(row.turnId)?row.turnId.toLowerCase():null;
  const provider=allowedProvider.has(row.provider)?row.provider:'unknown';
  const model=typeof row.model==='string'&&/^[a-zA-Z0-9._:/-]{1,110}$/.test(row.model)?row.model:null;
  const evidenceId=typeof row.evidenceId==='string'&&/^[A-Za-z0-9_-]{2,65}$/.test(row.evidenceId)?row.evidenceId:null;
  const candidate={witnessId:body.witnessId,question:row.question,text:row.text,turnId,provider,model,evidenceId};
  const signed=!!(turnId&&model&&provider!=='unknown'&&verifyInterviewExcerpt(candidate,row.turnProof));
  turns.push({...candidate,signed,hash:restoreHash(body.witnessId,row.question,row.text)});
 }
 return turns;
}
export function applyRestore(state,turns){
 let next=state;let restored=0,verified=0,skipped=0;
 for(const item of turns){
  const history=next.witnesses?.[item.witnessId]||[];
  const alreadyQuoted=history.some((row,i)=>row?.role==='witness'&&row.text===item.text&&history[i-1]?.role==='player'&&history[i-1]?.text===item.question);
  const present=alreadyQuoted||(next.restoredTurnHashes||[]).includes(item.hash)||
   (item.signed&&!!next.interviewReceipts?.[item.turnId]);
  if(present){skipped++;continue;}
  // A signed excerpt establishes provenance, not factual truth or progression.
  // Imported signed responses carry no fact IDs, evidence permissions or corrections.
  next=appendReportedTurn(next,item.witnessId,item.question,item.text,[],
    item.signed?'imported_signed_statement':'offline_unverified',
    item.signed?{turnId:item.turnId,provider:item.provider,model:item.model,evidenceId:null}:{});
  next={...next,restoredTurnHashes:[...(next.restoredTurnHashes||[]),item.hash].slice(-500)};
  restored++;if(item.signed)verified++;
 }
 return {state:next,restored,verified,unverified:restored-verified,skipped};
}
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{ok:false,error:'method_not_allowed'});
 if(!checkOrigin(req))return respond(res,403,{ok:false,error:'origin_rejected'});
 if(!configured())return respond(res,503,{ok:false,error:'state_not_configured'});
 if(req.headers?.['content-type']?.split(';')[0]!=='application/json'||req.headers?.['x-ps-client']!=='game')
  return respond(res,415,{ok:false,error:'invalid_content_type'});
 const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 if(Buffer.byteLength(raw)>36000)return respond(res,413,{ok:false,error:'too_large'});
 let body;try{body=JSON.parse(raw)}catch{return respond(res,400,{ok:false,error:'invalid_json'});}
 const turns=parseRestore(body);if(!turns)return respond(res,400,{ok:false,error:'invalid_turns'});
 try{await assertCoopAccess(req,{write:true});}catch(error){return respond(res,error.status||503,{ok:false,error:error.message||'coop_access_denied'});}
 const session=sessionId(req,res);
 try{
  for(let attempt=0;attempt<3;attempt++){
   const current=await loadSession(session);
   const applied=applyRestore(current.state,turns);
   if(applied.state===current.state)return respond(res,200,{ok:true,...applied,state:undefined});
   if(await commitSession(session,current.revision,applied.state))return respond(res,200,{ok:true,restored:applied.restored,verified:applied.verified,unverified:applied.unverified,skipped:applied.skipped});
  }
  return respond(res,409,{ok:false,error:'restore_conflict'});
 }catch{return respond(res,503,{ok:false,error:'restore_storage_unavailable'});}
}
