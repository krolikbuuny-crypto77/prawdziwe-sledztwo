/** Shared-screen coop room: 2 members, one controller, optimistic revisions.
 * IMPORTANT: the room 'frame' is untrusted display state, never server-approved evidence.
 */
import crypto from 'node:crypto';
import {configured,sessionId,loadSession,commitSession,checkOrigin} from '../lib/server-state.js';
import {assertCoopAccess,hasCoopCookie,setCoopCookie,clearCoopCookie,coopRest,roomById,roomByCode,patchRoom,makeCode,codeHash} from '../lib/coop-session-rc35.js';
const reply=(res,status,obj)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(obj);};
const validFrame=frame=>frame&&typeof frame==='object'&&!Array.isArray(frame)&&
 frame.save&&typeof frame.save==='object'&&frame.save.format==='PS_V7_COMPLETE_STAGE14'&&
 typeof frame.save.saveMeta?.checksum==='string'&&/^[a-f0-9]{64}$/.test(frame.save.saveMeta.checksum)&&
 typeof frame.view?.tab==='string'&&/^[a-zA-Z0-9_-]{1,30}$/.test(frame.view.tab);
const sanitizeRoom=(room,identity)=>({roomId:room.room_id,version:Number(room.version),owner:room.owner_member===identity.memberId,
 controller:room.controller_member===identity.memberId,players:room.guest_member?2:1,frame:room.frame||null});
function bodyOf(req){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 if(Buffer.byteLength(raw,'utf8')>1700000)throw Object.assign(Error('body_too_large'),{status:413});
 return JSON.parse(raw);
}
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return reply(res,405,{ok:false,error:'method_not_allowed'});
 if(!checkOrigin(req))return reply(res,403,{ok:false,error:'origin_rejected'});
 if(!configured())return reply(res,503,{ok:false,error:'supabase_not_configured'});
 if(req.method==='POST'&&(req.headers?.['content-type']?.split(';')[0]!=='application/json'||req.headers?.['x-ps-client']!=='game'))return reply(res,415,{ok:false,error:'invalid_content_type'});
 try{
  const body=req.method==='POST'?bodyOf(req):{};
  const action=req.method==='GET'?'status':body.action;
  if(action==='create'){
   if(hasCoopCookie(req))return reply(res,409,{ok:false,error:'leave_existing_room_first'});
   if(!validFrame(body.frame))return reply(res,400,{ok:false,error:'invalid_frame'});
   const original=await loadSession(sessionId(req,res));
   const sharedId=crypto.randomUUID(),roomId=crypto.randomUUID(),owner=crypto.randomUUID();
   const initial=await loadSession(sharedId);
   if(!(await commitSession(sharedId,initial.revision,original.state)))throw Error('coop_initialization_failed');
   const code=makeCode();
   const room={room_id:roomId,session_id:sharedId,code_hash:codeHash(code),owner_member:owner,guest_member:null,controller_member:owner,version:1,frame:body.frame};
   await coopRest('ps_coop_rooms',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(room)});
   setCoopCookie(req,res,roomId,sharedId,owner);
   return reply(res,200,{ok:true,code,...sanitizeRoom(room,{memberId:owner})});
  }
  if(action==='join'){
   if(hasCoopCookie(req))return reply(res,409,{ok:false,error:'leave_existing_room_first'});
   const code=String(body.code||'').replace(/\s+/g,'').toUpperCase();
   if(!/^[A-HJ-NP-Z2-9]{9}$/.test(code))return reply(res,400,{ok:false,error:'invalid_invitation_code'});
   const room=await roomByCode(code);
   if(!room)return reply(res,404,{ok:false,error:'room_not_found'});
   if(room.guest_member)return reply(res,409,{ok:false,error:'room_full'});
   const guest=crypto.randomUUID();
   // Atomic compare-and-set: two guests cannot occupy the last place.
   const updated=await patchRoom(room,{guest_member:guest},null,'&guest_member=is.null');
   if(!updated)return reply(res,409,{ok:false,error:'room_full_or_changed'});
   setCoopCookie(req,res,updated.room_id,updated.session_id,guest);
   return reply(res,200,{ok:true,...sanitizeRoom(updated,{memberId:guest})});
  }
  const session=await assertCoopAccess(req,{write:['frame'].includes(action),includeFrame:req.method==='POST'&&['frame','take','leave'].includes(action)});
  if(!session)return reply(res,404,{ok:false,error:'not_in_coop_room'});
  const {identity,room}=session;
  if(action==='status'){
   const since=Number(new URL(req.url||'/', 'https://coop.invalid').searchParams.get('since'));
   if(Number.isInteger(since)&&since===Number(room.version))return reply(res,200,{ok:true,...sanitizeRoom(room,identity),frame:null});
   const complete=await roomById(room.room_id,true);
   if(!complete)return reply(res,404,{ok:false,error:'room_closed'});
   return reply(res,200,{ok:true,...sanitizeRoom(complete,identity)});
  }
  if(action==='frame'){
   if(!Number.isInteger(body.version)||body.version!==Number(room.version))return reply(res,409,{ok:false,error:'version_conflict'});
   if(!validFrame(body.frame))return reply(res,400,{ok:false,error:'invalid_frame'});
   const updated=await patchRoom(room,{frame:body.frame},identity.memberId);
   if(!updated)return reply(res,409,{ok:false,error:'version_conflict'});
   return reply(res,200,{ok:true,...sanitizeRoom(updated,identity)});
  }
  if(action==='take'){
   const busyView=room.frame?.view;
   if(busyView?.aiBusy===true&&Number.isFinite(Number(busyView.busyAt))&&
    Date.now()-Number(busyView.busyAt)<300000)return reply(res,423,{ok:false,error:'interview_in_progress'});
   const updated=await patchRoom(room,{controller_member:identity.memberId});
   if(!updated)return reply(res,409,{ok:false,error:'version_conflict'});
   return reply(res,200,{ok:true,...sanitizeRoom(updated,identity)});
  }
  if(action==='leave'){
   if(identity.memberId===room.owner_member){
    await coopRest(`ps_coop_rooms?room_id=eq.${room.room_id}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
   }else{
    const updated=await patchRoom(room,{guest_member:null,controller_member:room.owner_member});
    if(!updated)return reply(res,409,{ok:false,error:'version_conflict'});
   }
   clearCoopCookie(req,res);
   return reply(res,200,{ok:true,closed:identity.memberId===room.owner_member});
  }
  return reply(res,400,{ok:false,error:'unknown_action'});
 }catch(err){
  if(['invalid_coop_cookie','coop_membership_revoked'].includes(err?.message))clearCoopCookie(req,res);
  const status=[400,401,403,413,423].includes(err?.status)?err.status:503;
  return reply(res,status,{ok:false,error:status===503?'coop_storage_unavailable':String(err.message||'coop_error')});
 }
}
