import assert from 'node:assert/strict';
import crypto from 'node:crypto';
process.env.GAME_SESSION_SECRET='RC351-long-server-secret-012345678901234567890';
process.env.SUPABASE_URL='https://sample.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-secret';
const rooms=new Map(),messages=[],games=new Map();let nextId=1,aiCalls=0,writeCalls=0;
const json=(data,status=200)=>new Response(data===null?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(url,opts={})=>{
 const u=new URL(url),q=u.searchParams,method=opts.method||'GET',body=opts.body?JSON.parse(opts.body):{};
 if(u.pathname.endsWith('/ps_game_sessions')){
  const id=q.get('session_id')?.slice(3);
  if(method==='GET')return json(games.has(id)?[games.get(id)]:[]);
  if(method==='POST'){games.set(body.session_id,{revision:0,approved_state:body.approved_state});return json(null,204);}
 }
 if(u.pathname.endsWith('/rpc/ps_commit_session'))return json(true);
 if(u.pathname.endsWith('/ps_coop_rooms')){
  let data=[...rooms.values()];for(const [k,v] of q){if(k==='select')continue;
   if(v.startsWith('eq.'))data=data.filter(x=>String(x[k])===v.slice(3));
   if(v==='is.null')data=data.filter(x=>x[k]==null);
  }
  if(method==='POST'){rooms.set(body.room_id,body);return json(null,201);}
  if(method==='PATCH'){if(!data.length)return json([]);Object.assign(data[0],body);return json(data);}
  if(method==='DELETE'){for(const r of data){rooms.delete(r.room_id);for(let i=messages.length-1;i>=0;i--)if(messages[i].room_id===r.room_id)messages.splice(i,1);}return json(null,204);}
  return json(data.map(x=>Object.fromEntries((q.get('select')||Object.keys(x).join(',')).split(',').map(k=>[k,x[k]]))));
 }
 if(u.pathname.endsWith('/ps_coop_messages')){
  const roomId=q.get('room_id')?.slice(3);let data=messages.filter(m=>m.room_id===roomId);
  if(q.has('id'))data=data.filter(m=>m.id>Number(q.get('id').slice(3)));
  data.sort((a,b)=>q.get('order')==='id.desc'?b.id-a.id:a.id-b.id);
  return json(data.slice(0,Number(q.get('limit')||80)));
 }
 if(u.pathname.endsWith('/rpc/ps_coop_send_chat')){
  writeCalls++;
  const r=rooms.get(body.p_room_id);
  if(!r||![r.owner_member,r.guest_member].includes(body.p_member_id))return json({message:'chat_not_member'},400);
  const prior=messages.find(m=>m.room_id===r.room_id&&m.sender_member===body.p_member_id&&m.client_message_id===body.p_client_message_id);
  if(prior)return json([prior]);
  if(messages.some(m=>m.room_id===r.room_id&&m.sender_member===body.p_member_id&&Date.now()-new Date(m.created_at).getTime()<1000))return json({message:'chat_rate_limited'},400);
  const record={id:nextId++,room_id:r.room_id,sender_member:body.p_member_id,client_message_id:body.p_client_message_id,content:body.p_content,created_at:new Date().toISOString()};messages.push(record);return json([record]);
 }
 aiCalls++;throw Error('unexpected external AI call: '+u.pathname);
};
const {default:roomsApi}=await import('../api/coop.js');
const {default:chatApi}=await import('../api/coop-chat.js');
function call(handler,method='GET',body=undefined,cookie='',path='/api/coop-chat',origin='https://game.example'){
 const headers={host:'game.example',origin,'x-forwarded-proto':'https',cookie};
 if(method==='POST')Object.assign(headers,{'content-type':'application/json','x-ps-client':'game'});
 const req={method,url:path,headers,body:body===undefined?undefined:JSON.stringify(body)};
 const res={headers:{},status(s){this.code=s;return this;},json(d){this.data=d;return this;},setHeader(n,v){this.headers[n]=v;},getHeader(n){return this.headers[n]}};
 return handler(req,res).then(()=>res);
}
const f={save:{format:'PS_V7_COMPLETE_STAGE14',saveMeta:{checksum:'a'.repeat(64)}},view:{tab:'interview'}};
const host=await call(roomsApi,'POST',{action:'create',frame:f},'','/api/coop');assert.equal(host.code,200);
const hostCookie=host.headers['Set-Cookie'].map(x=>x.split(';')[0]).join('; ');
const guest=await call(roomsApi,'POST',{action:'join',code:host.data.code},'','/api/coop');assert.equal(guest.code,200);
const guestCookie=guest.headers['Set-Cookie'].split(';')[0];
assert.equal((await call(chatApi)).code,404,'non-member cannot see messages');
assert.equal((await call(chatApi,'GET',undefined,hostCookie,'/api/coop-chat','https://evil.example')).code,403);
assert.equal((await call(chatApi,'POST',{text:'abc',clientId:crypto.randomUUID()},guestCookie)).code,200,'observer can chat');
const clientId=crypto.randomUUID();
const first=await call(chatApi,'POST',{text:'Sprawdźmy alibi Marka.',clientId},hostCookie);assert.equal(first.code,200);
assert.equal(first.data.message.author,'Gospodarz');
assert.equal((await call(chatApi,'POST',{text:'Sprawdźmy alibi Marka.',clientId},hostCookie)).data.message.id,first.data.message.id,'idempotent repeated send');
assert.equal((await call(chatApi,'POST',{text:'Drugi raz',clientId:crypto.randomUUID()},hostCookie)).code,429,'rate limited');
assert.equal((await call(chatApi,'POST',{text:'x'.repeat(601),clientId:crypto.randomUUID()},guestCookie)).code,400);
const guestView=await call(chatApi,'GET',undefined,guestCookie);assert.equal(guestView.code,200);
assert.equal(guestView.data.messages.length,2);assert.equal(guestView.data.messages[1].own,false);
const next=await call(chatApi,'GET',undefined,guestCookie,`/api/coop-chat?after=${guestView.data.messages[0].id}`);assert.equal(next.data.messages.length,1);
assert.equal(aiCalls,0,'chat must not call any AI providers');assert.equal(writeCalls,4);
await call(roomsApi,'POST',{action:'leave'},hostCookie,'/api/coop');
assert.equal((await call(chatApi,'GET',undefined,guestCookie)).code,403,'closed room access revoked');
console.log('PASS RC35.1: 2 users, observer send, membership, origin, rate limit, idempotence, cursor, closure, zero AI calls');
