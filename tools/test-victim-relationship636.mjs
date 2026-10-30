import assert from 'node:assert/strict';
import {analyzeQuestion} from '../lib/question-intent-633.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {reviewInterviewReply} from '../lib/interview-quality-635.js';
import {attemptInterview} from '../api/interview.js';

const questions=[
 'Kim była dla ciebie ofiara?',
 'Kim była dla pana ofiara?',
 'Kim dla ciebie była Lena?',
 'Co dla ciebie znaczyła ofiara?',
 'Co was łączyło z ofiarą?',
 'Jak znałeś ofiarę?',
 'Jakie były twoje relacje z Leną?'
];
for(const question of questions){
 const parsed=analyzeQuestion(question);
 assert.equal(parsed.primary,'relationship',question);
 assert.equal(parsed.subject,'victim',question);
 assert.equal(parsed.needsClarification,false,question);
}
assert.equal(analyzeQuestion('Kto zgłosił alarm po znalezieniu ofiary?').primary,'alarm_report');
const q=questions[0];
for(const id of ['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']){
 const scene=trustedScene({identity:{id},question:q,knowledge:{documentsShown:[]}},null);
 assert(scene.knowledge.factBank.some(f=>f.text.includes('Lena')));
 if(id==='MAREK')assert(scene.knowledge.factBank.some(f=>f.text.includes('pracownicą zajezdni')));
}
const scene=trustedScene({identity:{id:'MAREK'},question:q,knowledge:{documentsShown:[]}},null);
Object.assign(scene,buildQuestionContext(q,[]));
scene.memory.conversation=[];
scene.dialogueMemory={previousPairs:[],openQuestions:[],corrections:[],earlierRelated:[]};
const bad='Nie wiem, kim była dla mnie ofiara.';
assert.equal(reviewInterviewReply(scene,bad,scene.knowledge.factBank.slice(0,1)).reason,'relationship_nonanswer');
const good=scene.knowledge.factBank[0].text;
assert.equal(reviewInterviewReply(scene,good,scene.knowledge.factBank.slice(0,1)).ok,true);
let calls=0;
const answer=await attemptInterview(scene,'zai',async(_system,payload)=>{
 calls++;
 if(calls===1)return {decision:'answer',factIds:['f0'],text:bad};
 if(calls===2){assert.equal(payload.repairInstruction.reason,'Odpowiedź nie określa relacji z Leną, mimo zatwierdzonych faktów o niej.');return {decision:'answer',factIds:['f0'],text:good};}
 throw Error('Unexpected request');
});
assert.equal(calls,2);
assert.equal(answer.text,good);
assert.equal(answer.ok,true);
console.log('PASS 6.36 RC2: 7 victim relation phrasings, 6 witness facts, repair of tautological AI reply, canonical answer and regression of alarm intent');
