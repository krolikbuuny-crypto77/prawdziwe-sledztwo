import assert from 'node:assert/strict';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {REPAIR_GUIDANCE,interviewAnswerSystem,interviewAuditSystem} from '../lib/interview-prompt-rc57106.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {attemptInterview} from '../api/interview.js';

const qM='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?';
const qF='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłaś?';
const clearAnswers=[
 ['TOMASZ',qM,'Po północy byłem przy konsoli w dyspozytorni. Później znalazłem Lenę i wezwałem pomoc.'],
 ['MAREK',qM,'Byłem w rejonie warsztatu, ale nie pamiętam dokładnych godzin. Nie widziałem Leny.'],
 ['JANUSZ',qM,'W warsztacie, przy TW-217. O Lenie mówiłem już wcześniej.'],
 ['ELZBIETA',qF,'Nie potrafię wskazać miejsca po północy. O Lenie wiem tylko z wcześniejszej rozmowy.'],
 ['KAMIL',qM,'Pracowałem w warsztacie przy TW-217. Lenę widziałem wcześniej.'],
 ['MAGDALENA',qF,'Byłam w biurze. Nie wiem, gdzie była Lena.']
];
for(const [witnessId,question,answer] of clearAnswers){
 const qa=auditLiveDialogue({question,answer,witnessId});
 assert(!qa.findings.some(x=>x.code==='excluded_topic_repeated'),JSON.stringify([witnessId,qa.findings]));
 assert(qa.findings.some(x=>x.code==='excluded_topic_incidental'),witnessId);
 const approved=reviewWitnessDraft({identity:{id:witnessId},question,memory:{conversation:[]}},answer);
 assert.equal(approved.ok,true,JSON.stringify({witnessId,approved}));
}
const diverted=[
 ['TOMASZ',qM,'Widziałem Lenę przed alarmem, potem ją znalazłem i wezwałem pomoc.'],
 ['MAREK',qM,'Nie byłem w dyspozytorni. Lenę widziałem po południu.'],
 ['JANUSZ',qM,'Lenę ostatnio widziałem wieczorem.'],
 ['ELZBIETA',qF,'Nie mam dokumentu. Lenę widziałam wieczorem.']
];
for(const [witnessId,question,answer] of diverted){
 const qa=auditLiveDialogue({question,answer,witnessId});
 assert(qa.findings.some(x=>x.code==='excluded_topic_repeated'),JSON.stringify([witnessId,qa.findings]));
 const result=reviewWitnessDraft({identity:{id:witnessId},question,memory:{conversation:[]}},answer);
 assert.equal(result.ok,false,JSON.stringify(result));
 assert.equal(result.reason,'dialogue_excluded_topic_repeated');
}
for(const q of [qM,qF]){
 const qa=auditLiveDialogue({question:q,answer:'Byłem w dyspozytorni. Nie widziałem Leny.',witnessId:'MAREK'});
 assert(qa.findings.some(x=>x.code==='excluded_topic_incidental'));
}
// A fact-grounded answer containing the victim's name must travel through
// the real production gate without a forced rewrite. The semantic checker is
// mocked, not bypassed.
const approvedScene=trustedScene({identity:{id:'TOMASZ'},question:qM,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(qM,[]));
approvedScene._responseDeadline=Date.now()+60000;approvedScene._providerDeadline=Date.now()+45000;
approvedScene.approvedThreadHistory=[];
const phases=[];
const approved=await attemptInterview(approvedScene,'apinex-luna',async(system,payload,limit,temp,provider,phase)=>{
 phases.push(phase);
 if(phase==='generate')return {decision:'answer',factIds:['f14'],text:'Zmianę zacząłem w dyspozytorni. Prowadziłem ruch TW-217 i obsługiwałem konsolę łączności. W późniejszej części nocy odszedłem w rejon trzeciego stanowiska, znalazłem Lenę i wezwałem pomoc; nie byłem świadkiem urazu.'};
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[],reason:'ok'};
 throw Error('Unexpected rewrite: '+phase);
});
assert(approved?.ok,'Fact-grounded answer rejected: '+JSON.stringify({approved,phases}));
assert(!phases.includes('rewrite'),'A relevant incidental reference must not force rewrite');

// The change must leave strict fact verification intact: semantic 'not_entailed'
// is still rejected after a revision, never converted to a successful answer.
const scene=trustedScene({identity:{id:'TOMASZ'},question:qM,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(qM,[]));
scene._responseDeadline=Date.now()+60000;scene._providerDeadline=Date.now()+45000;
scene.approvedThreadHistory=[];
let calls=[];
const failed=await attemptInterview(scene,'apinex-luna',async (system,payload,limit,temp,provider,phase)=>{
 calls.push(phase);
 if(phase==='semantic-audit')return {relevant:true,entailed:false,complete:true,semanticRepeat:false,coveredParts:[],reason:'not_entailed'};
 return {decision:'answer',factIds:['f0'],text:'Byłem w dyspozytorni. Nie widziałem Leny.'};
});
assert.equal(failed,null,'Non-entailed answer must not be accepted');
assert(calls.includes('semantic-audit'),JSON.stringify(calls));
assert.equal(calls.filter(x=>x==='generate').length,1);
assert(calls.filter(x=>x==='rewrite').length,1);
assert(REPAIR_GUIDANCE.dialogue_excluded_topic_repeated.includes('miejsce'));
assert(interviewAnswerSystem.includes('krótkiej niezbędnej wzmianki'));
assert(interviewAuditSystem.includes('sama obecność imienia Leny'));
console.log('RC57.10.14 PASS: 6 witnesses permitted with incidental mention, 4 genuine diversions blocked, strict non-entailment unchanged.');
