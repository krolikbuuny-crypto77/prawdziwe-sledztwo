import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {reviewInterviewReply} from '../lib/interview-quality-635.js';
import {attemptInterview} from '../api/interview.js';
import handler from '../api/interview.js';

const witness='MAREK';
const state={approvedEvidence:['VIS-02','ADM-10'],witnesses:{MAREK:[]}};
const priorQuestion='Proszę opisać, gdzie był pan między 01:40 a 02:05?';
const old='Nadzorowałem nocną zmianę i byłem dostępny z biura. Nie będę udawał, że siedziałem tam bez przerwy — od tego jest rejestr wejść.';
const q='Dokąd pan wychodził i kto pana widział?';
const context={identity:{id:witness},question:q,knowledge:{currentGroundedAnswer:'PRZEMYCONY FAKT',documentsShown:[]}};
const clean=trustedScene(context,state);
assert(!JSON.stringify(clean.knowledge.factBank).includes('PRZEMYCONY FAKT'));
clean.question=q;clean.questionParts=[];clean.questionPlan={};
clean.memory={conversation:[{role:'śledczy',text:priorQuestion},{role:'świadek',text:old}]};
assert.equal(reviewInterviewReply(clean,old,[clean.knowledge.factBank[0]]).reason,'repeated_previous_reply');
assert.equal(reviewInterviewReply({...clean,question:priorQuestion},old,[clean.knowledge.factBank[0]]).ok,true);
const changed=clean.knowledge.factBank[0].text;
assert(changed.toLowerCase().includes('wychodziłem'));
let i=0;let inputCalls=[];
const reply=await attemptInterview(clean,'zai',async(system,payload)=>{
 i++;inputCalls.push(payload);
 if(i===1)return {decision:'answer',factIds:['f0'],text:old};
 if(i===2)return {decision:'answer',factIds:['f0'],text:changed};
 throw Error('Unexpected extra provider call');
});
assert.equal(reply.text,changed);
assert.equal(i,2);
assert(inputCalls[1].repairInstruction);

// Photo is registered by identifier, with server-owned title and content.
const photo=trustedScene({identity:{id:witness},question:'Co fotografia mówi o osłonie po wejściu ratowników?',knowledge:{documentsShown:['VIS-02']},presentedEvidenceId:'VIS-02'},state);
assert.equal(photo.presentedEvidence.id,'VIS-02');
assert.equal(photo.presentedEvidence.title,'Fotografia miejsca ujawnienia Leny');
assert(photo.knowledge.factBank.some(f=>f.source==='document-VIS-02'&&f.origin==='document'));
const photoFact=photo.knowledge.factBank.find(f=>f.source==='document-VIS-02'&&f.text.includes('Okazano'));
assert(photoFact);
photo.questionParts=[];photo.questionPlan={};photo.memory={conversation:[]};photo.question='Co pokazuje ta fotografia?';
const photoId=photoFact.id;
assert.equal(reviewInterviewReply(photo,'To jest wydruk godzin.',[photoFact]).reason,'wrong_document_type');
assert.equal(reviewInterviewReply(photo,'Nie wiem, kto tam był.',[photoFact]).reason,'photograph_not_addressed');
const photoAnswer=photoFact.text;
let n=0;
const result=await attemptInterview(photo,'zai',async()=>{
 n++;
 if(n===1)return {decision:'answer',factIds:[photoId],text:'To jest wydruk godzin.'};
 if(n===2)return {decision:'answer',factIds:[photoId],text:photoAnswer};
 if(n===3)return {relevant:true,entailed:true,complete:true,coveredParts:[]};
 throw Error('Extra call');
});
assert.equal(result.text,photoAnswer);
assert.equal(n,3);
const unsigned=trustedScene({identity:{id:witness},question:'Co pokazuje ta fotografia?',knowledge:{documentsShown:['VIS-02']},presentedEvidenceId:'VIS-02'},null);
assert.equal(unsigned.presentedEvidence,null,'No Supabase means no evidence authorised');
const absent=trustedScene({identity:{id:witness},question:'Co pokazuje ta fotografia?',presentedEvidenceId:'VIS-02',knowledge:{documentsShown:[]}}, {approvedEvidence:[],witnesses:{MAREK:[]}});
assert.equal(absent.presentedEvidence,null,'Not unlocked by server');
// Browser must not globally disable cloud when an approved document is shown.
const client=fs.readFileSync(new URL('../src/integrations/35-zai-client.js',import.meta.url),'utf8');
assert(client.includes('presentedEvidenceId:attached||null'));
assert(!client.includes('question&&!attached&&online'));
assert(client.includes('const attachmentOK='));
// In offline/server-unavailable mode, the evidence-bearing request must fail closed.
const prev=process.env.GAME_SESSION_SECRET;delete process.env.GAME_SESSION_SECRET;
try{
 const req={method:'POST',headers:{host:'test635.local'},socket:{remoteAddress:'635-unique'},body:{version:3,witnessId:witness,canonical:old,turnId:randomUUID(),question:'Co pokazuje zdjęcie?',presentedEvidenceId:'VIS-02',context:{schema:'ps-witness-context/1',identity:{id:witness,name:'Marek'},knowledge:{currentGroundedAnswer:old,groundedOptions:[{id:'turn',kind:'current',text:old}],alreadySaid:[],documentsShown:['VIS-02']},memory:{conversation:[]},psychology:{blocked:false,contradictions:[]}}}};
 const res={setHeader(){},status(s){this.code=s;return this;},json(body){this.body=body;return this;}};
 await handler(req,res);
 assert.equal(res.code,503);
}finally{if(prev!==undefined)process.env.GAME_SESSION_SECRET=prev;}
console.log('PASS 6.35: repeat detection with bounded AI repair, original question, verified photo identity, cannot inject wrong document, no session => fail closed, browser routes shown evidence to cloud');
