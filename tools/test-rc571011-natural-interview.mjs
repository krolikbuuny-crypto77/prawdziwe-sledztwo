import assert from 'node:assert/strict';
import {interviewAnswerSystem,interviewAuditSystem,WITNESS_VOICE_PROFILES,FOCUS_GUIDANCE,REPAIR_GUIDANCE} from '../lib/interview-prompt-rc57106.js';
import {interviewAnswerSystem as base, interviewAuditSystem as baseAudit} from '../lib/interview-wire-rc23.js';
import {interviewAnswerSystem as live,interviewAuditSystem as liveAudit,interviewWirePayload,reviewNaturalSpeech} from '../lib/interview-naturalness-rc28.js';
import {interviewStyleCue} from '../lib/interview-style-cue-rc57108.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {reviewInterviewReply,repairCue} from '../lib/interview-quality-635.js';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {witnessGenderIssue} from '../lib/interview-gender-rc571011.js';
import {buildDialogueMemory} from '../lib/dialogue-memory-636.js';
import {speechCadence} from '../lib/interview-rc51.js';
import {psychologicalDelivery} from '../lib/interview-psychology-rc37.js';
const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
assert.equal(live,base);assert.equal(live,interviewAnswerSystem);
assert.equal(liveAudit,baseAudit);assert.equal(liveAudit,interviewAuditSystem);
assert.equal((interviewAnswerSystem.match(/WSPÓLNY KONTRAKT/g)||[]).length,1);
assert.equal(Object.keys(WITNESS_VOICE_PROFILES).length,6);
for(const id of ids){
 assert(WITNESS_VOICE_PROFILES[id].voice.length>20);
 const scene={question:'Ukrywasz coś?',identity:{id},memory:{conversation:[]}};
 const payload=interviewWirePayload(scene);
 assert(payload.voiceProfile?.voice===WITNESS_VOICE_PROFILES[id].voice);
 assert(payload.voiceProfile.authority==='style_only_not_fact');
 assert(speechCadence(scene).individualVoice===WITNESS_VOICE_PROFILES[id].voice);
 assert(psychologicalDelivery(scene).individual===WITNESS_VOICE_PROFILES[id].delivery);
 assert(interviewStyleCue(scene).responseFocus==='pressure');
 assert.equal(interviewStyleCue(scene).focusInstruction,FOCUS_GUIDANCE.pressure);
}
assert.equal(witnessGenderIssue('ELZBIETA','Powiedziałem to przed chwilą.'),'female_speaker_male_verb');
assert.equal(witnessGenderIssue('MAGDALENA','Byłem przy konsoli.'),'female_speaker_male_verb');
assert.equal(witnessGenderIssue('MAREK','Byłam przy konsoli.'),'male_speaker_female_verb');
assert.equal(witnessGenderIssue('ELZBIETA','Powiedziałam to przed chwilą.'),null);
assert.equal(witnessGenderIssue('MAREK','Powiedziałem to przed chwilą.'),null);
const badGender={question:'Co powiedziałaś?',identity:{id:'ELZBIETA'},memory:{conversation:[]}};
assert.equal(reviewNaturalSpeech(badGender,'Powiedziałem to przed chwilą.').reason,'witness_gender_mismatch');
assert.equal(reviewWitnessDraft(badGender,'Powiedziałem to przed chwilą.').reason,'dialogue_witness_gender_mismatch');
assert.equal(repairCue(badGender,'Powiedziałem to przed chwilą.','dialogue_witness_gender_mismatch').reason,REPAIR_GUIDANCE.dialogue_witness_gender_mismatch);
const h=[
 {role:'player',text:'Jaką rolę pełniłeś podczas tej zmiany?'},
 {role:'witness',text:'Byłem kierownikiem zajezdni i nadzorowałem nocną zmianę.'},
 {role:'player',text:'Co pamiętasz?'},
 {role:'witness',text:'Później wychodziłem do dyspozytorni i warsztatu. Nie pamiętam dokładnej kolejności.'}
];
const recall='Czy pamiętasz, co powiedziałeś na początku tej rozmowy?';
const invented='Na początku rozmowy powiedziałem, że byłem w dyspozytorni i warsztacie.';
assert(auditLiveDialogue({question:recall,answer:invented,history:h,witnessId:'MAREK'}).findings.some(x=>x.code==='opening_specifics_from_later_turns'));
assert(!auditLiveDialogue({question:recall,answer:'Na początku powiedziałem, że byłem kierownikiem zajezdni.',history:h,witnessId:'MAREK'}).findings.some(x=>x.code==='opening_specifics_from_later_turns'));
const common='Zajmowałem się kartą pracy przy TW-217 w warsztacie i wychodziłem do przejścia przy administracji w sprawach dokumentacji.';
const memory='Na początku byłem w warsztacie. '+common;
const answer='Mogę potwierdzić tyle. '+common;
const prior=[{role:'player',text:'Co robiłeś?'},{role:'witness',text:memory}];
const warnings=auditLiveDialogue({question:'Czy ukrywasz coś?',answer,history:prior,witnessId:'JANUSZ'}).findings.map(x=>x.code);
assert(warnings.includes('long_phrase_repetition')||warnings.includes('near_repetition'));
const recapQ='Wrócę do wcześniejszej odpowiedzi: co jest potwierdzone, a co nie?';
const recapAudit=auditLiveDialogue({question:recapQ,answer,history:prior,witnessId:'JANUSZ'});
assert(!recapAudit.findings.some(x=>['near_repetition','long_phrase_repetition','stock_phrase_repetition'].includes(x.code)));
const scene={identity:{id:'JANUSZ'},question:recapQ,memory:{conversation:prior}};
assert(buildDialogueMemory(prior,recapQ).repeatRequested);
assert(reviewInterviewReply(scene,answer).ok);
assert(reviewWitnessDraft(scene,answer).ok);
const irrelevant={question:'Skąd o tym wiesz?',identity:{id:'JANUSZ'},memory:{conversation:prior}};
assert(!reviewInterviewReply(irrelevant,memory).ok,'exact repeated statement must still be rejected on a different question');
const evasive=auditLiveDialogue({question:'Gdzie byłaś po północy?',answer:'Nie mam dokumentu potwierdzającego każdą minutę.',history:[],witnessId:'ELZBIETA'});
assert(evasive.findings.some(x=>x.code==='document_instead_of_location'));
assert(auditLiveDialogue({question:'Co powiedziałaś?',answer:'Powiedziałem o dokumentacji.',history:[],witnessId:'ELZBIETA'}).findings.some(x=>x.code==='witness_gender_mismatch'));
console.log('RC57.10.11 PASS: canonical prompt/audit, 6 voices, 5 priorities, 3 memory safeguards, gender and repetition context.');
