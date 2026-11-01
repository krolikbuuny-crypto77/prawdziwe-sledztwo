import assert from 'node:assert/strict';
import crypto from 'node:crypto';
process.env.GAME_SESSION_SECRET='RC35-secret-long-enough-to-authenticate-coop-room-012345678';
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-role-not-real';
const rooms=new Map(),games=new Map();
let failNextRoomInsert=false;
const json=(data,status=200)=>new Response(data===null?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(url,options={})=>{
 const u=new URL(url),q=u.searchParams,method=options.method||'GET',data=options.body?JSON.parse(options.body):{};
 if(u.pathname.endsWith('/ps_game_sessions')){
  if(method==='POST'){if(!games.has(data.session_id))games.set(data.session_id,{revision:0,approved_state:data.approved_state});return json(null,201);}
  if(method==='GET'){const id=q.get('session_id')?.slice(3);const row=games.get(id);return json(row?[row]:[]);}
  if(method==='DELETE'){games.delete(q.get('session_id')?.slice(3));return json(null,204);}
 }
 if(u.pathname.endsWith('/rpc/ps_commit_session')){
  const row=games.get(data.p_session_id);if(!row||row.revision!==data.p_expected_revision)return json(false);
  row.revision++;row.approved_state=data.p_approved_state;return json(true);
 }
 if(u.pathname.endsWith('/ps_coop_rooms')){
  let rows=[...rooms.values()];
  for(const [key,value] of q){if(key==='select'||key==='on_conflict')continue;
   if(value.startsWith('eq.'))rows=rows.filter(x=>String(x[key])===value.slice(3));
   else if(value==='is.null')rows=rows.filter(x=>x[key]==null);
  }
  if(method==='POST'){
   if(failNextRoomInsert){failNextRoomInsert=false;return json({code:'PGRST205',message:'Database schema not cached'},404);}
   if([...rooms.values()].some(x=>x.code_hash===data.code_hash))return json({error:'duplicate'},409);
   rooms.set(data.room_id,{...data});return json(null,201);
  }
  if(method==='PATCH'){
   if(!rows.length)return json([]);
   const row=rows[0];Object.assign(row,data);return json([{...row}]);
  }
  if(method==='DELETE'){for(const row of rows)rooms.delete(row.room_id);return json(null,204);}
  const selected=q.get('select');return json(rows.map(x=>Object.fromEntries((selected||Object.keys(x).join(',')).split(',').map(k=>[k,x[k]]))));
 }
 throw Error('unexpected URL '+u.pathname);
};
const {default:handler}=await import('../api/coop.js');
const {default:gameHandler}=await import('../api/game-state.js');
const {coopIdentity,assertCoopAccess}=await import('../lib/coop-session-rc35.js');
function simulate(backend,method='POST',body=null,cookies=''){
 const headers={'host':'game.example','origin':'https://game.example','x-forwarded-proto':'https',cookie:cookies};
 if(method==='POST')Object.assign(headers,{'content-type':'application/json','x-ps-client':'game'});
 const req={method,url:'/api/coop',headers,body:body===null?undefined:JSON.stringify(body)};
 const response={headers:{},status(code){this.code=code;return this;},json(data){this.data=data;return this;},setHeader(name,value){this.headers[name]=value;},getHeader(name){return this.headers[name]}};
 return backend(req,response).then(()=>response);
}
const frame={save:{format:'PS_V7_COMPLETE_STAGE14',saveMeta:{checksum:'a'.repeat(64)}},view:{tab:'interview',activeChar:'MAREK'}};
let host=await simulate(handler,'POST',{action:'create',frame});
assert.equal(host.code,200);assert.match(host.data.code,/^[A-HJ-NP-Z2-9]{9}$/);
let cookies=host.headers['Set-Cookie'];assert.equal(cookies.length,2,'keep personal and cooperative cookies');
const hostCookie=cookies.map(c=>c.split(';')[0]).join('; ');const roomId=host.data.roomId;
assert.equal(host.data.controller,true);
let guest=await simulate(handler,'POST',{action:'join',code:host.data.code});assert.equal(guest.code,200);assert.equal(guest.data.players,2);
const guestCookie=guest.headers['Set-Cookie'].split(';')[0];
assert.equal(coopIdentity({headers:{cookie:guestCookie}}).sessionId,coopIdentity({headers:{cookie:hostCookie}}).sessionId);
assert.equal((await simulate(handler,'GET',null,guestCookie)).data.frame.view.tab,'interview');
let third=await simulate(handler,'POST',{action:'join',code:host.data.code});assert.equal(third.code,409);
let denied=await simulate(handler,'POST',{action:'frame',version:guest.data.version,frame},guestCookie);assert.equal(denied.code,423);
let deniedState=await simulate(gameHandler,'POST',{revision:1,actions:[{id:'x',action:{type:'visit_area',area:'lab'}}]},guestCookie);assert.equal(deniedState.code,423);
// A model generating an answer must finish before the other player takes control.
let lockedFrame={...frame,view:{...frame.view,aiBusy:true,busyAt:Date.now()}};
let locked=await simulate(handler,'POST',{action:'frame',version:guest.data.version,frame:lockedFrame},hostCookie);
assert.equal(locked.code,200);
let blockedTake=await simulate(handler,'POST',{action:'take'},guestCookie);assert.equal(blockedTake.code,423);
let unlocked=await simulate(handler,'POST',{action:'frame',version:locked.data.version,frame},hostCookie);assert.equal(unlocked.code,200);
let takeover=await simulate(handler,'POST',{action:'take'},guestCookie);assert.equal(takeover.code,200);assert.equal(takeover.data.controller,true);
let oldHost=await simulate(handler,'GET',null,hostCookie);assert.equal(oldHost.data.controller,false);
let oldHostWrite=await simulate(handler,'POST',{action:'frame',version:oldHost.data.version,frame},hostCookie);assert.equal(oldHostWrite.code,423);
let newFrame={...frame,view:{...frame.view,tab:'evidence'}};
let saved=await simulate(handler,'POST',{action:'frame',version:takeover.data.version,frame:newFrame},guestCookie);assert.equal(saved.code,200);
assert.equal((await simulate(handler,'GET',null,hostCookie)).data.frame.view.tab,'evidence');
let leave=await simulate(handler,'POST',{action:'leave'},guestCookie);assert.equal(leave.code,200);
let stillHost=await simulate(handler,'GET',null,hostCookie);assert.equal(stillHost.data.players,1);assert.equal(stillHost.data.controller,true);
let reused=await simulate(handler,'GET',null,guestCookie);assert.equal(reused.code,403);
let closed=await simulate(handler,'POST',{action:'leave'},hostCookie);assert.equal(closed.code,200);assert.equal(rooms.size,0);
let zombie=await simulate(handler,'GET',null,hostCookie);assert.equal(zombie.code,403);
failNextRoomInsert=true;
let missingSql=await simulate(handler,'POST',{action:'create',frame});
assert.equal(missingSql.code,503);
assert.equal(missingSql.data.error,'coop_rooms_table_missing_or_cache_stale');
console.log('PASS RC35: room creation, secure code join, 2-player limit, shared server session, frame sync, observer read-only, takeover CAS, leave and token revocation');
