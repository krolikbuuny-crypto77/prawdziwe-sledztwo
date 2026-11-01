import assert from 'node:assert/strict';
import fs from 'node:fs';
import {correctIntentTypos} from '../lib/question-typos-rc578.js';
import {foldQuestion,analyzeQuestion} from '../lib/question-intent-633.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {runLiveStep} from '../lib/admin-rc57-live.js';
import {interviewAnswerSystem} from '../lib/interview-naturalness-rc28.js';
const example=[
 ['gdze byles po polnocy?','gdzie byles po polnocy?','self_alibi'],
 ['gdze byłaś po północy?','gdzie bylas po polnocy?','self_alibi'],
 ['Nie pytam o Lenę, tylko gdze byles po polnocy?','nie pytam o lene, tylko gdzie byles po polnocy?','self_alibi'],
 ['Kiedyy byłeś w dyspozytorni?','kiedy byles w dyspozytorni?','self_alibi'],
 ['Czy potwirdzic możesz alibi?','czy potwierdzic mozesz alibi?','self_alibi'],
 ['Nei pytam o Lenę, tylko gdze byles po polnocy?','nie pytam o lene, tylko gdzie byles po polnocy?','self_alibi']
];
for (const [raw,folded,intent] of example){assert.equal(foldQuestion(raw),folded,raw);assert.equal(analyzeQuestion(raw).primary,intent,raw)}
for (const raw of ['Nie pytam o Lenę, tylko gdze byłeś?','Nie pytam o Lenę, tylko gdzie byłeś?']){
 const p=analyzeQuestion(raw);assert(p.slots.negatedCorrection);assert.equal(p.primary,'self_alibi');
}
const untouched=correctIntentTypos('Kamil MAGDALENA LENA TEC-04 LAB-014 01:35 ZG-41 TW-217 T-17');
assert.equal(untouched.text,'Kamil MAGDALENA LENA TEC-04 LAB-014 01:35 ZG-41 TW-217 T-17');
assert.equal(correctIntentTypos('gdzie gdzies kiedy kiedys byles bylas').text,'gdzie gdzies kiedy kiedys byles bylas');
assert.equal(buildQuestionContext('Gdze byles po północy?').questionPlan.primary,'self_alibi');
const report=auditLiveDialogue({question:'Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?',answer:'Byłem w dyspozytorni, później znalazłem Lenę i wezwałem pomoc.',history:[]});
assert(report.findings.some(f=>f.code==='excluded_topic_repeated'));
assert(auditLiveDialogue({question:'Gdzie byłeś po północy?',answer:'Nie potrafię wskazać swojego miejsca po północy.',history:[]}).findings.some(f=>f.code==='location_evasion'));
assert(auditLiveDialogue({question:'Gdzie byłeś po północy?',answer:'Pracowałem przy stanowisku, ale nie mogę podać miejsca pobytu po północy.',history:[]}).findings.some(f=>f.code==='place_self_contradiction'));
assert(!auditLiveDialogue({question:'Gdzie byłeś?',answer:'Nie pamiętam dokładnej godziny, ale byłem w dyspozytorni.',history:[]}).findings.some(f=>f.code==='location_evasion'));
assert(interviewAnswerSystem.includes('RC57.8 LITERÓWKI'));
process.env.RC57_LIVE_TEST_ENABLED='true';process.env.APINEX_API_KEY='FAKE_KEY';process.env.RC57_ADMIN_SECRET='FAKE_LONG_SECRET_FOR_TESTS___________________';
const req={headers:{cookie:'__Host-ps57=fake-cookie'}};
const fake=async()=>({ok:true,decision:'answer',semanticVerified:true,text:'Zajmowałam się przeglądem dokumentów BHP.',factIds:['f0']});
let token=null,rows=[];
for(let offset=0;offset<18;offset++){
 const r=await runLiveStep({mode:'live-short',provider:'apinex-luna',offset,token,confirmed:offset===0},req,fake);
 rows.push(r.results[0]);token=r.nextToken;
}
assert.equal(rows.length,18);assert(rows[9].question.includes('pełniłaś'));assert(rows[11].question.includes('Gdzie byłaś'));
assert(rows[15].question.includes('pełniłaś'));assert(rows[17].question.includes('Gdzie byłaś'));
assert(rows[0].question.includes('pełniłeś'));assert(rows[2].question.includes('Gdzie byłeś'));
const empty=await runLiveStep({mode:'live-short',provider:'apinex-jev',offset:0,token:null,confirmed:true},req,async()=>null);
assert.equal(empty.results[0].status,'fail');assert.equal(empty.results[0].qa.productionAudit.lastSafeReason,'no_safe_answer');
const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert(page.includes('correctIntentTypos'));assert(!page.includes("import {correctIntentTypos}"));
assert.equal(fs.readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
console.log('RC57.8 PASS: spelling variants, negation, evidence IDs, browser/server shared parser, genders, QA for evasions, diagnostics, 12 Vercel API functions.');
