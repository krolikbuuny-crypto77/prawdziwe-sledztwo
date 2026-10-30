import assert from 'node:assert/strict';
import fs from 'node:fs';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';

const now=1_000;
assert.equal(INTERVIEW_BUDGET.totalMs,46000);
assert.equal(phaseTimeout({provider:'zai',phase:'generate',now,turnDeadline:now+46000,providerDeadline:now+25000}),18000);
assert.equal(phaseTimeout({provider:'zai',phase:'semantic-audit',now:23500,turnDeadline:47000,providerDeadline:26000}),2500);
assert.equal(phaseTimeout({provider:'zai',phase:'semantic-audit',now:25600,turnDeadline:47000,providerDeadline:26000}),0);
assert.equal(phaseTimeout({provider:'groq',phase:'generate',now:26300,turnDeadline:47000,providerDeadline:45500}),13000);
assert.equal(phaseTimeout({provider:'groq',phase:'semantic-audit',now:45300,turnDeadline:47000,providerDeadline:45500}),0);
assert.equal(phaseTimeout({provider:'groq',phase:'invalid',now}),0);

const api=fs.readFileSync(new URL('../api/interview.js',import.meta.url),'utf8');
assert(api.includes("import {INTERVIEW_BUDGET,phaseTimeout}"));
assert(api.includes('scene._responseDeadline=startedAt+INTERVIEW_BUDGET.totalMs'));
assert(api.includes('scene._providerDeadline=provider==='));
assert(api.includes('invoke(system,{...modelContext(payload),_responseDeadline:scene._responseDeadline'));
assert(api.includes('questionPlan:undefined, questionParts:undefined'), 'Local lexical plan must not override the cloud models');
assert(api.includes('provider,phase)')); // independent audit under same deadline
assert(api.includes("const providers=['zai','groq']"));
assert(api.includes("scene._responseDeadline-INTERVIEW_BUDGET.commitReserveMs"));
assert(api.includes('fastVerbatimEntailment(scene,selected,proposal)'));
const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const blocked=(path)=>config.routes.some(r=>r.status===404&&new RegExp(r.src).test(path));
for(const path of ['/lib/trusted-witness-canon-624.json','/lib/server-canon-618.json','/src/core/case-engine.js','/tools/test-stage3-636.mjs','/README.md','/RAPORT-QA-6.36-ETAP-II.md','/ASSET_MANIFEST.json','/package.json','/.env.example'])assert(blocked(path),path);
for(const path of ['/','/index.html','/assets/cover.webp','/api/interview','/api/game-state'])assert(!blocked(path),path);
const sync=fs.readFileSync(new URL('../src/integrations/75-verified-state-sync.js',import.meta.url),'utf8');
assert(sync.includes('function actorStatusFor(person,local)'));
assert(sync.includes('verifiedVerdict.review?.correctPerson===true'));
assert(sync.includes('verifiedIndictment.culprit!==person'));
assert(sync.includes('verifiedIndictment.method!==local.method'));
assert(sync.includes("return 'pending'"));
for(const path of ['src/core/case-engine.js','src/finale/57-indictment-variants-and-epilogue.js','src/finale/14-adversarial-trial.js']){
 const source=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert(!/(?:culprit|person)\s*!?===?\s*['"]MAGDALENA['"]/.test(source),path+' contains an explicit answer comparison');
}
console.log('PASS stage III: shared phase deadlines, Z.ai first and Groq second, audit inside budget, reserved DB time, 404 source-route policies, no fixed perpetrator comparisons in active finale');
