import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import admin from '../api/admin-rc57.js';
import {INTERVIEW_CHAIN} from '../lib/interview-providers-rc24.js';
import {SPECIALIZED_CHAINS} from '../lib/specialized-router-rc33.js';
process.env.RC57_ADMIN_PASSWORD='LocalTestOnlyVeryLongPassword1234!';
process.env.RC57_ADMIN_SECRET='LocalTestOnlyVeryLongIndependentSecret123456789';
const root=path.resolve(import.meta.dirname,'..');
const funcs=readdirSync(path.join(root,'api')).filter(name=>name.endsWith('.js'));
assert.equal(funcs.length,12,`Hobby requires <= 12 functions: ${funcs}`);
assert(!existsSync(path.join(root,'api','status.js')));
assert(!existsSync(path.join(root,'api','admin-rc57-ui.js')));
const config=JSON.parse(readFileSync(path.join(root,'vercel.json')));
for(const [url,view] of [['/api/status','service-status'],['/admin/testy','page']]){
 assert(config.rewrites.some(r=>r.source===url&&r.destination===`/api/admin-rc57?view=${view}`),url);
}
function makeRes(){return {headers:{},status(code){this.code=code;return this;},setHeader(k,v){this.headers[k.toLowerCase()]=v;},getHeader(k){return this.headers[k.toLowerCase()]},json(v){this.payload=v;return this;},send(v){this.html=v;return this;}}}
async function check(req){const res=makeRes();await admin({method:'GET',headers:{host:'example.test'},...req},res);return res;}
const status=await check({query:{view:'service-status'}});
assert.equal(status.code,200);assert(status.payload.ok);assert(!status.payload.providers.some(s=>/gemini/i.test(s)));
const statusPost=makeRes();await admin({method:'POST',query:{view:'service-status'},headers:{}},statusPost);assert.equal(statusPost.code,405);
const page=await check({url:'/api/admin-rc57?view=page'});
assert.equal(page.code,200);assert.match(page.html,/RC57 — Centrum testowania/);assert.match(page.headers['content-security-policy'],/nonce-/);
const privateAPI=await check({url:'/api/admin-rc57'});assert.equal(privateAPI.code,401);
assert(!INTERVIEW_CHAIN.some(name=>/gemini/i.test(name)));
assert(!Object.values(SPECIALIZED_CHAINS).flat(2).some(name=>/google|gemini/i.test(name)));
console.log('PASS RC57 Hobby: 12 functions, preserved routes, private admin login, status, no active Gemini providers');
