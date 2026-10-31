/** RC35: member-bound shared game sessions. Only Vercel's service-role client can read rooms.
 * Shared screen snapshots are PRESENTATION only; they never certify case evidence.
 */
import crypto from 'node:crypto';
const endpoint=()=>String(process.env.SUPABASE_URL||'').replace(/\/$/,'')+'/rest/v1/';
const secret=()=>process.env.GAME_SESSION_SECRET;
const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cookieHeader=req=>String(req.headers?.cookie||'').split(';').map(s=>s.trim());
const cookieValue=req=>cookieHeader(req).find(s=>s.startsWith('ps_coop='))?.slice(8)||null;
const mac=s=>crypto.createHmac('sha256',secret()).update('ps-coop-v1:'+s).digest('base64url');
function same(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
export function coopIdentity(req){
 const token=cookieValue(req);if(!token)return null;
 if(!secret()||secret().length<32)return null;
 const [roomId,sessionId,memberId,expires,sig,...extra]=token.split('.');
 if(extra.length||![roomId,sessionId,memberId].every(s=>UUID.test(s||''))||!/^\d{10,13}$/.test(expires||''))return null;
 const payload=[roomId,sessionId,memberId,expires].join('.');
 if(!sig||!same(sig,mac(payload))||Number(expires)<Date.now())return null;
 return {roomId,sessionId,memberId};
}
export function hasCoopCookie(req){return !!cookieValue(req);}
export function setCoopCookie(req,res,roomId,sessionId,memberId){
 const expires=Date.now()+1000*60*60*24*7;
 const body=[roomId,sessionId,memberId,expires].join('.');
 const secure=String(req.headers?.['x-forwarded-proto']||'').split(',')[0]==='https';
 const prior=res.getHeader?.('Set-Cookie');
 const coop=`ps_coop=${body}.${mac(body)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure?'; Secure':''}`;
 res.setHeader('Set-Cookie',prior?[...(Array.isArray(prior)?prior:[prior]),coop]:coop);
}
export function clearCoopCookie(req,res){
 const secure=String(req.headers?.['x-forwarded-proto']||'').split(',')[0]==='https';
 res.setHeader('Set-Cookie',`ps_coop=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`);
}
export async function coopRest(path,init={}){
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),9500);
 try{
  const response=await fetch(endpoint()+path,{...init,headers:{apikey:serviceKey(),Authorization:'Bearer '+serviceKey(),'Content-Type':'application/json',...(init.headers||{})},signal:ctrl.signal});
  if(!response.ok){
   // Whitelist server-defined chat errors; do not expose raw Supabase details.
   const fail=await response.json().catch(()=>({}));
   const code=['chat_rate_limited','chat_not_member','chat_invalid_content'].includes(fail?.message)?fail.message:null;
   const err=Error('coop_db_'+response.status);err.status=response.status;err.code=code;throw err;
  }
  if(response.status===204||init.headers?.Prefer?.includes('return=minimal'))return null;
  const text=await response.text();return text?JSON.parse(text):null;
 }finally{clearTimeout(timeout);}
}
export const codeHash=code=>crypto.createHmac('sha256',secret()).update('ps-coop-code:'+code).digest('hex');
export const makeCode=()=>Array.from(crypto.randomBytes(9),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
const select='room_id,session_id,owner_member,guest_member,controller_member,version,frame,updated_at';
export async function roomById(id,includeFrame=true){const fields=includeFrame?select:select.replace(',frame','');const rows=await coopRest(`ps_coop_rooms?room_id=eq.${id}&select=${fields}`);return rows?.[0]||null;}
export async function roomByCode(code){const rows=await coopRest(`ps_coop_rooms?code_hash=eq.${codeHash(code)}&select=${select}`);return rows?.[0]||null;}
export async function assertCoopAccess(req,{write=false,includeFrame=false}={}){
 if(!hasCoopCookie(req))return null;
 const id=coopIdentity(req);
 if(!id){const err=Error('invalid_coop_cookie');err.status=401;throw err;}
 const room=await roomById(id.roomId,includeFrame);
 if(!room||room.session_id!==id.sessionId||![room.owner_member,room.guest_member].includes(id.memberId)){
  const err=Error('coop_membership_revoked');err.status=403;throw err;
 }
 if(write&&room.controller_member!==id.memberId){const err=Error('coop_observer_readonly');err.status=423;throw err;}
 return {identity:id,room};
}
export async function patchRoom(room,changes,member,extra=''){
 const params=`room_id=eq.${room.room_id}&version=eq.${room.version}${member?`&controller_member=eq.${member}`:''}${extra}&select=${select}`;
 const result=await coopRest('ps_coop_rooms?'+params,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...changes,version:Number(room.version)+1,updated_at:new Date().toISOString()})});
 return result?.[0]||null;
}
