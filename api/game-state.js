import {assertCoopAccess} from '../lib/coop-session-rc35.js';
/** Zatwierdzanie akcji postępu odbywa się TYLKO na serwerze.
 * Nie przyjmujemy importu całego obiektu STATE ani klientowego werdyktu.
 */
import {configured,sessionId,checkOrigin,loadSession,commitSession,validateAction} from '../lib/server-state.js';
const answer=(res,status,body)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body);};
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return answer(res,405,{ok:false,error:'method_not_allowed'});
 if(!checkOrigin(req))return answer(res,403,{ok:false,error:'origin_rejected'});
 if(!configured())return answer(res,503,{ok:false,error:'supabase_not_configured'});
 try{await assertCoopAccess(req,{write:req.method==='POST'});}catch(error){return answer(res,error.status||503,{ok:false,error:error.message||'coop_access_denied'});}
 const id=sessionId(req,res);
 try{
  const current=await loadSession(id);
  if(req.method==='GET')return answer(res,200,{ok:true,revision:current.revision,state:current.state});
  if(req.headers?.['content-type']?.split(';')[0]!=='application/json'||req.headers?.['x-ps-client']!=='game')return answer(res,415,{ok:false,error:'invalid_content_type'});
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
  if(Buffer.byteLength(raw)>65536)return answer(res,413,{ok:false,error:'too_large'});
  const data=JSON.parse(raw);
  if(!Array.isArray(data.actions)||data.actions.length<1||data.actions.length>20)return answer(res,400,{ok:false,error:'invalid_action_batch'});
  if(data.revision!==current.revision)return answer(res,409,{ok:false,error:'version_conflict',revision:current.revision});
  let state=current.state;const decisions=[];
  for(const item of data.actions){
   const result=validateAction(state,item.action);
   decisions.push({id:typeof item.id==='string'?item.id.slice(0,70):'',ok:result.ok,reason:result.why||null});
   if(result.ok)state=result.state;
  }
  if(state!==current.state&&!(await commitSession(id,current.revision,state)))return answer(res,409,{ok:false,error:'version_conflict'});
  return answer(res,200,{ok:true,revision:current.revision+(state!==current.state?1:0),decisions,state});
 }catch{return answer(res,503,{ok:false,error:'state_store_unavailable'});}
}
