import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {runGameBatch,gameAuditInfo} from '../lib/admin-rc57-whole-game.js';
import admin from '../api/admin-rc57.js';
import {authorized} from '../lib/admin-rc57-auth.js';
process.env.RC57_ADMIN_PASSWORD='TestOnlyRC57WholeGameLongPassword0123456';
process.env.RC57_ADMIN_SECRET='TestOnlyRC57WholeGameSecret0123456789abcdefghijklmnopqrstuvwxyz';
let outgoing=0;globalThis.fetch=async()=>{outgoing++;throw Error('external_request_forbidden')};
const suite=[];for(let offset=0;offset<gameAuditInfo.total;offset+=20){const result=runGameBatch({offset});assert.equal(result.offset,offset);assert.equal(result.results.length,Math.min(20,gameAuditInfo.total-offset));suite.push(...result.results)}
assert.equal(suite.length,gameAuditInfo.total);assert.equal(new Set(suite.map(x=>x.id)).size,suite.length);
const fails=suite.filter(x=>x.status!=='pass');assert.deepEqual(fails,[],JSON.stringify(fails.slice(0,12)));
for(const group of ['kanon','start','eksploracja','dowody','oględziny','blokady','chronologia','etapy','zeznania','werdykt','obrona','kooperacja','bezpieczenstwo'])assert(suite.some(x=>x.group===group),'missing '+group);
assert.equal(readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
assert.equal(outgoing,0,'must have no Supabase or model calls');
const mkres=()=>({headers:{},status(n){this.code=n;return this},setHeader(k,v){this.headers[k.toLowerCase()]=v},getHeader(k){return this.headers[k.toLowerCase()]},json(v){this.payload=v;return this},send(v){this.html=v;return this}});
const request=(method,body={},cookie='',origin='https://game.example')=>({url:'/api/admin-rc57',method,headers:{host:'game.example','x-forwarded-proto':'https',origin,cookie,...(method==='POST'?{'content-type':'application/json'}:{})},body});
const call=async r=>{const response=mkres();await admin(r,response);return response};
const unauthorized=await call(request('POST',{action:'game-batch',offset:0}));assert.equal(unauthorized.code,401);
const login=await call(request('POST',{action:'login',password:process.env.RC57_ADMIN_PASSWORD}));assert.equal(login.code,200);const cookie=login.headers['set-cookie'].split(';')[0];assert(authorized(request('GET',undefined,cookie)));
const overview=await call(request('GET',{},cookie));assert.equal(overview.code,200);assert.equal(overview.payload.gameAudit.total,gameAuditInfo.total);
const response=await call(request('POST',{action:'game-batch',offset:0},cookie));assert.equal(response.code,200);assert.equal(response.payload.count,20);
for(const offset of [-1,gameAuditInfo.total,0.5,NaN]){const resp=await call(request('POST',{action:'game-batch',offset},cookie));assert.equal(resp.code,400)}
const forbidden=await call(request('POST',{action:'game-batch',offset:0},cookie,'https://bad.example'));assert.equal(forbidden.code,403);
assert.equal(outgoing,0,'server API unexpectedly fetched external data');
const code=readFileSync(new URL('../lib/admin-rc57-ui.js',import.meta.url),'utf8');assert(code.includes('game-batch'));assert(code.includes("fetch('/',{cache:'no-store',credentials:'omit'})"));
console.log('PASS RC57.3 full game core: '+suite.length+' unique real rule checks in '+gameAuditInfo.groups.length+' groups, isolated/no Supabase, admin authentication, 12 Vercel functions, browser smoke integration.');
