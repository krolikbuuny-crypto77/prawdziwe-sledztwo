import assert from 'node:assert/strict';
import crypto from 'node:crypto';
process.env.GAME_SESSION_SECRET='RC39-private-test-secret-01234567890123';
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
const rooms=new Map(),games=new Map(),collab=[];let index=1,AI=0;
const json=(data,status=200)=>new Response(data===null?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(url,opts={})=>{
 const u=new URL(url),q=u.searchParams,method=opts.method||'GET',payload=opts.body?JSON.parse(opts.body):{};
 if(u.pathname.endsWith('/ps_game_sessions')){
  if(method==='POST'){games.set(payload.session_id,{revision:0,approved_state:payload.approved_state});return json(null,201);}
  if(method==='GET')return json(games.has(q.get('session_id')?.slice(3))?[games.get(q.get('session_id').slice(3))]:[]);
 }
 if(u.pathname.endsWith('/rpc/ps_commit_session'))return json(true);
 if(u.pathname.endsWith('/ps_coop_rooms')){
  let entries=[...rooms.values()];for(const [k,v] of q){if(k==='select')continue;if(v.startsWith('eq.'))entries=entries.filter(x=>String(x[k])===v.slice(3));if(v==='is.null')entries=entries.filter(x=>x[k]==null);}
  if(method==='POST'){rooms.set(payload.room_id,payload);return json(null,201);}
  if(method==='PATCH'){if(!entries.length)return json([]);Object.assign(entries[0],payload);return json(entries);}
  if(method==='DELETE'){for(const r of entries)rooms.delete(r.room_id);return json(null,204);}
  return json(entries.map(row=>Object.fromEntries((q.get('select')||Object.keys(row).join(',')).split(',').map(key=>[key,row[key]]))));
 }
 if(u.pathname.endsWith('/ps_coop_collab')){
  const roomId=q.get('room_id').slice(3);let items=collab.filter(x=>x.room_id===roomId);
  if(q.has('id'))items=items.filter(x=>x.id>Number(q.get('id').slice(3)));
  items.sort((a,b)=>q.get('order')==='id.desc'?b.id-a.id:a.id-b.id);
  return json(items.slice(0,75));
 }
 if(u.pathname.endsWith('/rpc/ps_coop_post_collab')){
  const r=rooms.get(payload.p_room_id);if(!r||![r.owner_member,r.guest_member].includes(payload.p_member_id))return json({message:'collab_not_member'},400);
  const dup=collab.find(x=>x.room_id===r.room_id&&x.sender_member===payload.p_member_id&&x.client_id===payload.p_client_id);
  if(dup)return json([dup]);
  const row={id:index++,room_id:r.room_id,sender_member:payload.p_member_id,client_id:payload.p_client_id,kind:payload.p_kind,content:payload.p_content,created_at:new Date().toISOString()};collab.push(row);return json([row]);
 }
 AI++;throw Error('unexpected AI call '+u.pathname);
};
const {default:coop}=await import('../api/coop.js');const {default:collabApi}=await import('../api/coop-collab.js');
async function invoke(handler,method='GET',body=null,cookie='',path='/api/coop'){
 const headers={host:'case.example',origin:'https://case.example','x-forwarded-proto':'https',cookie};
 if(method==='POST')Object.assign(headers,{'content-type':'application/json','x-ps-client':'game'});
 const req={method,url:path,headers,body:body===null?undefined:JSON.stringify(body)};
 const res={headers:{},status(code){this.code=code;return this;},json(data){this.data=data;return this;},setHeader(name,v){this.headers[name]=v;},getHeader(name){return this.headers[name]}};
 await handler(req,res);return res;
}
const frame={saveJson:JSON.stringify({format:'PS_V7_COMPLETE_STAGE14',saveMeta:{checksum:'a'.repeat(64)}}),view:{tab:'overview'}};
const host=await invoke(coop,'POST',{action:'create',frame});assert.equal(host.code,200);
const a=host.headers['Set-Cookie'].map(x=>x.split(';')[0]).join('; ');
const guest=await invoke(coop,'POST',{action:'join',code:host.data.code});assert.equal(guest.code,200);
const b=guest.headers['Set-Cookie'].split(';')[0];
assert.equal((await invoke(collabApi,'GET',null)).code,404);
assert.equal((await invoke(collabApi,'POST',{kind:'vote',text:'ready',clientId:crypto.randomUUID()},b,'/api/coop-collab')).code,200);
const clientId=crypto.randomUUID();
const first=await invoke(collabApi,'POST',{kind:'question',text:'Czy Marek znał trasę?',clientId},a,'/api/coop-collab');assert.equal(first.code,200);
assert.equal(first.data.item.author,'Gospodarz');
const retry=await invoke(collabApi,'POST',{kind:'question',text:'Czy Marek znał trasę?',clientId},a,'/api/coop-collab');assert.equal(first.data.item.id,retry.data.item.id);
assert.equal((await invoke(collabApi,'POST',{kind:'vote',text:'verdict_guilty',clientId:crypto.randomUUID()},a,'/api/coop-collab')).code,400);
assert.equal((await invoke(collabApi,'POST',{kind:'evidence',text:'x'.repeat(351),clientId:crypto.randomUUID()},a,'/api/coop-collab')).code,400);
const rows=await invoke(collabApi,'GET',null,b,'/api/coop-collab');assert.equal(rows.data.items.length,2);
assert.equal(rows.data.items[1].mine,false);
assert.equal((await invoke(collabApi,'GET',null,b,`/api/coop-collab?after=${rows.data.items[0].id}`)).data.items.length,1);
await invoke(coop,'POST',{action:'leave'},a);
assert.equal((await invoke(collabApi,'GET',null,b,'/api/coop-collab')).code,403);
assert.equal(AI,0);
console.log('PASS RC39: two private members, observer vote, proposals, idempotent retries, bounded input, cursor, revoked access and zero AI calls');
