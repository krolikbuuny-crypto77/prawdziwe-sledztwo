import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runBatch,caseDescriptor,rc57Info} from '../lib/admin-rc57-suite.js';
import api from '../api/admin-rc57.js';
import ui from '../lib/admin-rc57-ui.js';
import {authorized} from '../lib/admin-rc57-auth.js';

process.env.RC57_ADMIN_PASSWORD='TestOnlyPasswordWithAtLeast24Chars!000';
process.env.RC57_ADMIN_SECRET='TestOnlyRC57IndependentPrivateSecretLongEnough-456';
let calls=0;globalThis.fetch=async()=>{calls++;throw Error('external_fetch_prohibited_in_rc57_tests')};
function req(method='GET',body=undefined,cookie='',origin='https://game.example'){
 const headers={host:'game.example','x-forwarded-proto':'https',origin,cookie,...(method==='POST'?{'content-type':'application/json'}:{})};
 return {method,headers,url:'/api/admin-rc57',body};
}
function res(){return {headers:{},status(n){this.code=n;return this;},setHeader(k,v){this.headers[k.toLowerCase()]=v;},getHeader(k){return this.headers[k.toLowerCase()]},json(o){this.data=o;return this;},send(o){this.html=o;return this;}};}
async function call(handler,r){const s=res();await handler(r,s);return s;}
let before=await call(api,req());assert.equal(before.code,401);assert.equal(before.data.error,'login_required');
let forbidden=await call(api,req('POST',{action:'login',password:process.env.RC57_ADMIN_PASSWORD},'','https://evil.example'));assert.equal(forbidden.code,403);
let wrong=await call(api,req('POST',{action:'login',password:'x'.repeat(30)}));assert.equal(wrong.code,401);
let good=await call(api,req('POST',{action:'login',password:process.env.RC57_ADMIN_PASSWORD}));assert.equal(good.code,200);let cookie=good.headers['set-cookie'].split(';')[0];assert.match(cookie,/^__Host-ps57=/);assert.match(good.headers['set-cookie'],/HttpOnly; Secure; SameSite=Strict/);
let signed=await call(api,req('GET',undefined,cookie));assert.equal(signed.code,200);assert.equal(signed.data.info.full,600);assert.equal(authorized(req('GET',undefined,cookie)),true);
let forged=await call(api,req('GET',undefined,cookie.replace(/.$/,'z')));assert.equal(forged.code,401);
let invalid=await call(api,req('POST',{action:'batch',mode:'full',offset:600},cookie));assert.equal(invalid.code,400);
let batch=await call(api,req('POST',{action:'batch',mode:'quick',offset:0},cookie));assert.equal(batch.code,200);assert.equal(batch.data.results.length,20);
let leave=await call(api,req('POST',{action:'logout'},cookie));assert.equal(leave.code,200);assert.match(leave.headers['set-cookie'],/Max-Age=0/);
let view=await call(ui,req());assert.equal(view.code,200);assert.match(view.html,/RC57 — Centrum testowania/);assert.match(view.headers['content-security-policy'],/script-src 'nonce-/);assert.ok(!view.html.includes(process.env.RC57_ADMIN_PASSWORD));
const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));assert.ok(vercel.rewrites.some(x=>x.source==='/admin/testy'&&x.destination==='/api/admin-rc57?view=page'));
const full=[];for(let offset=0;offset<600;offset+=20){const b=runBatch({mode:'full',offset});assert.equal(b.results.length,20);full.push(...b.results)}
assert.equal(full.length,600);assert.equal(new Set(full.map(x=>x.id)).size,600);
for(const witness of rc57Info.witnesses)assert.equal(full.filter(x=>x.witness===witness).length,100);
for(const family of rc57Info.families)assert.equal(full.filter(x=>x.group===family).length,60);
assert.equal(caseDescriptor(0,'quick').witness,'MAREK');assert.equal(caseDescriptor(59,'quick').witness,'MAGDALENA');
assert.equal(calls,0,'RC57 must never contact AI or Supabase');
const counts={pass:0,warning:0,fail:0};for(const x of full)counts[x.status]++;
console.log('RC57 PASS: admin auth, origin, httpOnly cookie, logout, 404/401 behavior, 600 unique deterministic cases, no external calls, CSP, private route.');
assert.deepEqual(counts,{pass:600,warning:0,fail:0},'RC57 deterministic regression must not introduce new parser failures');
console.log('RC57 diagnostic results:',JSON.stringify(counts),'(deterministic test suite; not actual AI replies)');
