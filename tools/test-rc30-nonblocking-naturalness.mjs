import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';
import {reviewNaturalSpeech,interviewWirePayload,interviewAnswerSystem} from '../lib/interview-naturalness-rc28.js';

const sentence='Nie mam alibi w sensie ciągłej obecności. Kierowałem nocną zmianą, ale wychodziłem służbowo i nie mogę potwierdzić każdej minuty.';
const scene=trustedScene({identity:{id:'MAREK'},question:'Masz alibi?',knowledge:{documentsShown:[]}}, {approvedEvidence:[],witnesses:{MAREK:[]}});
assert(scene,'scene exists');
scene.knowledge.factBank=[{id:'f0',text:sentence,origin:'public',source:'test-authorised',certainty:'qualified'}];
scene.knowledge.currentGroundedAnswer=sentence;
scene.memory={conversation:[],longTerm:[],turn:0};
scene.approvedThreadHistory=[];
scene.dialogueMemory={previousPairs:[],repeatRequested:false};
scene.questionParts=[];
scene.dialogueFocus=null;
scene.spokenGuide='Mów jak żywy człowiek, lecz nie dopisuj faktów.';
scene.deliveryGuide='Zaczynaj od odpowiedzi na pytanie.';
assert.equal(reviewNaturalSpeech(scene,sentence).ok,false,'RC28 would have penalized a qualified alibi solely for style');
assert(interviewWirePayload(scene).witnessSpeech?.spokenGuide,'Style guide still reaches the model');
assert(interviewAnswerSystem.includes('DODATKOWA ZASADA DIALOGU RC28'));
let phases=[];
const mock=async (_system,_payload,_maxTokens,_temperature,_provider,phase)=>{
 phases.push(phase);
 if(phase==='generate')return {decision:'answer',factIds:['f0'],text:sentence,emotion:'neutral'};
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
 throw Error('Naturalness caused an unnecessary provider retry: '+phase);
};
const result=await attemptInterview(scene,'apinex-luna',mock);
assert.equal(result?.text,sentence);
assert.deepEqual(phases,['generate'],'A grounded literal answer should be accepted without rewrites');

// A bogus numeric detail must still fail the hard safety guard before any acceptance.
const dangerous='Nie mam alibi w sensie ciągłej obecności. Byłem w warsztacie dokładnie o 03:47.';
let steps=[];
const scene2=structuredClone(scene);
scene2.question='Masz alibi?';
const answer2=await attemptInterview(scene2,'apinex-luna',async(_system,_payload,_max,_temp,_provider,phase)=>{
 steps.push(phase);
 if(phase==='generate')return {decision:'answer',factIds:['f0'],text:dangerous,emotion:'neutral'};
 if(phase==='rewrite')return {decision:'answer',factIds:['f0'],text:sentence,emotion:'neutral'};
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
 throw Error('Unexpected '+phase);
});
assert.equal(answer2.text,sentence);
assert.deepEqual(steps,['generate','rewrite'],'Factual violations still trigger the existing guarded repair');
console.log('PASS RC30: stylistic issue does not create an extra AI call; hardGuard remains active; speech guide still delivered');
