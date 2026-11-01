import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {attemptInterview} from '../api/interview.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';

const qMemory='Co możesz potwierdzić na podstawie własnej pamięci?';
const qM='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?';
const qF='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłaś?';
const rejected=[
 ['MAREK',qM,'Najpierw byłem w biurze, potem w dyspozytorni, ale nie pamiętam, w jakiej kolejności odwiedziłem te miejsca.','self_order_contradiction'],
 ['KAMIL',qM,'Byłem przy stanowisku diagnostycznym, ale nie mogę podać miejsca, w którym byłem.','place_self_contradiction'],
 ['MAGDALENA',qF,'Byłam przy stanowisku, gdzie prowadziłam sesję audytową, ale nie potrafię tego potwierdzić z własnej obserwacji.','session_as_location'],
 ['MAGDALENA',qMemory,'Z własnej obserwacji nie mogę tego potwierdzić. Prowadziłam sesję audytową.','memory_answer_without_referent'],
 ['ELZBIETA',qF,'Nie pytam o dokument. Lenę ostatnio widziałam wieczorem.','excluded_topic_repeated'],
 ['JANUSZ',qM,'Byłem w dyspozyorni.','speech_typo']
];
for(const [witnessId,question,answer,code] of rejected){
 const output=reviewWitnessDraft({identity:{id:witnessId},question,approvedThreadHistory:[]},answer);
 assert.equal(output.ok,false,`${witnessId}: ${code}`);
 assert(output.codes.includes(code),JSON.stringify(output));
}
const acceptable=[
 ['MAREK',qM,'Po północy byłem w zajezdni. Wychodziłem służbowo, ale nie pamiętam dokładnych godzin.'],
 ['TOMASZ',qM,'Byłem w dyspozytorni przy konsoli. Dokładnych godzin wszystkich wyjść nie pamiętam.'],
 ['JANUSZ',qM,'Pracowałem przy TW-217 w warsztacie. Dokładnych godzin wyjść nie pamiętam.'],
 ['ELZBIETA',qF,'Nie potrafię wskazać dokładnego miejsca po północy. Nie pamiętam tej części nocy z taką dokładnością.'],
 ['KAMIL',qM,'Zajmowałem się diagnostyką TW-217. Nie potrafię odtworzyć, gdzie byłem w każdej minucie po północy.'],
 ['MAGDALENA',qF,'Od 01:30 do 02:00 trwała moja sesja audytowa. To nie oznacza, że przez cały czas byłam przy komputerze.']
];
for(const [witnessId,question,answer] of acceptable){
 const output=reviewWitnessDraft({identity:{id:witnessId},question,approvedThreadHistory:[]},answer);
 assert(output.ok,`${witnessId}: ${output.codes.join(',')}`);
}
// Actually exercise production answer path with fake model transport. The rejected
// draft must trigger a bounded rewrite before semantic verification and never get approved.
const scene=trustedScene({identity:{id:'MAGDALENA'},question:qF,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(qF,[]));
scene.approvedThreadHistory=[];
scene._responseDeadline=Date.now()+100000;
scene._providerDeadline=Date.now()+80000;
let steps=[];
const valid=await attemptInterview(scene,'apinex-luna',async (system,payload,maxTokens,temp,provider,phase)=>{
 steps.push(phase);
 if(phase==='generate')return {decision:'answer',factIds:['f0','f1'],text:'Byłam przy stanowisku, gdzie prowadziłam sesję audytową, ale nie potrafię tego potwierdzić z własnej obserwacji.'};
 if(phase==='rewrite'){
  assert.equal(payload.repairInstruction.contractIssue,'dialogue_session_as_location');
  return {decision:'answer',factIds:['f0'],text:'Od 01:30 do 02:00 trwała moja sesja audytowa. Samo połączenie nie mówi, gdzie wtedy byłam.'};
 }
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[],reason:'ok'};
 throw Error('Unexpected phase: '+phase);
});
assert(valid?.ok,JSON.stringify(valid));
assert.equal(valid.semanticVerified,true);
assert.deepEqual(steps,['generate','rewrite','semantic-audit']);
assert.equal(auditLiveDialogue({question:qF,answer:valid.text,witnessId:'MAGDALENA'}).findings.length,0);
// Both unusable generations should fail closed; never silently mark them passing.
const broken=trustedScene({identity:{id:'MAGDALENA'},question:qF,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(qF,[]));
broken.approvedThreadHistory=[];broken._responseDeadline=Date.now()+100000;broken._providerDeadline=Date.now()+80000;
let badCalls=0;
const fail=await attemptInterview(broken,'apinex-luna',async(system,payload,limit,temp,provider,phase)=>{
 badCalls++;return {decision:'answer',factIds:['f0','f1'],text:'Byłam przy stanowisku, gdzie prowadziłam sesję audytową, ale nie potrafię tego potwierdzić z własnej obserwacji.'};
});
assert.equal(fail,null);assert.equal(badCalls,2);
assert.equal(readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
console.log('RC57.10.3 PASS: rejected bad drafts, accepted natural uncertainty, production rewrite with semantic audit, no false pass on double failure, 12 Vercel API files.');
