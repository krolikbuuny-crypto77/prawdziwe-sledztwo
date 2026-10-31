/** RC35.1: PRIVATE two-person room text chat. No AI calls. */
import {configured,checkOrigin} from '../lib/server-state.js';
import {assertCoopAccess,coopRest} from '../lib/coop-session-rc35.js';
const reply=(res,status,data)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data);};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const format=(rows,room,memberId)=>rows.map(m=>({
 id:Number(m.id),author:m.sender_member===room.owner_member?'Gospodarz':'Gość',
 own:m.sender_member===memberId,text:m.content,createdAt:m.created_at
}));
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return reply(res,405,{ok:false,error:'method_not_allowed'});
 if(!checkOrigin(req))return reply(res,403,{ok:false,error:'origin_rejected'});
 if(!configured())return reply(res,503,{ok:false,error:'supabase_not_configured'});
 if(req.method==='POST'&&(req.headers?.['content-type']?.split(';')[0]!=='application/json'||req.headers?.['x-ps-client']!=='game'))return reply(res,415,{ok:false,error:'invalid_content_type'});
 try{
  // Read and write are authorized for both participants, including the observer.
  const access=await assertCoopAccess(req);
  if(!access)return reply(res,404,{ok:false,error:'not_in_coop_room'});
  const {room,identity}=access;
  if(req.method==='GET'){
   const url=new URL(req.url||'/', 'https://room.invalid');
   const after=String(url.searchParams.get('after')||'0');
   if(!/^(0|[1-9][0-9]{0,15})$/.test(after)||Number(after)>Number.MAX_SAFE_INTEGER)return reply(res,400,{ok:false,error:'invalid_cursor'});
   const newer=after!=='0';
   const query=`ps_coop_messages?room_id=eq.${room.room_id}&select=id,sender_member,content,created_at&${newer?'id=gt.'+after+'&':''}order=id.${newer?'asc':'desc'}&limit=80`;
   const rows=await coopRest(query);
   return reply(res,200,{ok:true,messages:format(newer?rows:rows.reverse(),room,identity.memberId),hasMore:rows.length===80});
  }
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
  if(Buffer.byteLength(raw,'utf8')>3500)return reply(res,413,{ok:false,error:'message_too_large'});
  const body=JSON.parse(raw);
  if(!body||typeof body.text!=='string'||typeof body.clientId!=='string'||!uuid.test(body.clientId))return reply(res,400,{ok:false,error:'invalid_message'});
  const content=body.text.trim();
  if(!content||content.length>600||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(content))return reply(res,400,{ok:false,error:'invalid_message'});
  const result=await coopRest('rpc/ps_coop_send_chat',{method:'POST',body:JSON.stringify({p_room_id:room.room_id,p_member_id:identity.memberId,p_client_message_id:body.clientId,p_content:content})});
  if(!Array.isArray(result)||result.length!==1)return reply(res,503,{ok:false,error:'chat_storage_unavailable'});
  return reply(res,200,{ok:true,message:format(result,room,identity.memberId)[0]});
 }catch(err){
  if(['invalid_coop_cookie','coop_membership_revoked'].includes(err?.message))return reply(res,403,{ok:false,error:'not_in_coop_room'});
  if(err?.code==='chat_rate_limited')return reply(res,429,{ok:false,error:'chat_rate_limited'});
  if(err?.code==='chat_not_member')return reply(res,403,{ok:false,error:'not_in_coop_room'});
  return reply(res,503,{ok:false,error:'chat_storage_unavailable'});
 }
}
