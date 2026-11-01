import assert from 'node:assert/strict';
process.env.GAME_SESSION_SECRET='this-is-a-long-unique-mock-secret-987654321';
process.env.SUPABASE_URL='https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='mock-service-role';
const {default:handler}=await import('../api/game-state.js');
const {rules,initialState}=await import('../lib/server-state.js');
const fetchOld=globalThis.fetch;
let db=null,seenPaths=[];
globalThis.fetch=async(url,opts={})=>{
 const p=new URL(url).pathname;seenPaths.push(p);
 if(p.endsWith('/ps_game_sessions')&&opts.method==='POST'){db=db||{revision:0,approved_state:JSON.parse(opts.body).approved_state};return {ok:true,status:204,json:async()=>null};}
 if(p.endsWith('/ps_game_sessions'))return {ok:true,json:async()=>db?[db]:[]};
 if(p.endsWith('/ps_commit_session')){const pay=JSON.parse(opts.body);if(pay.p_expected_revision!==db.revision)return {ok:true,json:async()=>false};
 db={revision:db.revision+1,approved_state:pay.p_approved_state};return {ok:true,json:async()=>true};}
 throw Error(p);
};
function response(){const headers={};return {headers,setHeader(n,v){headers[n.toLowerCase()]=v;},status(n){this.statusCode=n;return this;},json(obj){this.body=obj;return this;}};}
async function call(method,data,cookie){const req={method,headers:{host:'game.test',origin:'https://game.test',cookie:cookie||'',...(data?{'content-type':'application/json','x-ps-client':'game'}:{})},body:data};const res=response();await handler(req,res);return res;}
try{
 let r=await call('GET');assert.equal(r.body.ok,true);assert.deepEqual(r.body.state.approvedEvidence,initialState().approvedEvidence);
 const cookie=r.headers['set-cookie'].split(';')[0];
 r=await call('POST',{revision:0,actions:[{id:'hack',action:{type:'caseCompleted',verdict:'solid'}}]},cookie);
 assert.equal(r.body.decisions[0].ok,false);assert.equal(db.approved_state.verdict,null);assert.equal(db.revision,0);
 const id=rules.searchable.find(x=>!rules.gates[x]?.length);
 r=await call('POST',{revision:0,actions:[{id:'good',action:{type:'collect_evidence',docId:id,area:rules.documents[id].area,origin:'area-search'}}]},cookie);
 assert.equal(r.body.ok,true);assert.equal(r.body.decisions[0].ok,true);assert.equal(db.revision,1);
 r=await call('POST',{revision:0,actions:[{id:'replay',action:{type:'visit_area',area:'lab'}}]},cookie);
 assert.equal(r.statusCode,409);
 r=await call('GET',null,cookie);assert.equal(r.body.revision,1);assert(r.body.state.approvedEvidence.includes(id));
 assert(seenPaths.some(x=>x.endsWith('ps_commit_session')));
 console.log('PASS 6.17 Supabase mocked: HMAC cookie, initial approved state, rejected forged verdict, server evidence confirmation, CAS conflicts');
}finally{globalThis.fetch=fetchOld;}
