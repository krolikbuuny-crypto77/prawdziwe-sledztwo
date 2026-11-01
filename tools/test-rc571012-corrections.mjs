import assert from 'node:assert/strict';
import fs from 'node:fs';
import {interviewStyleCue} from '../lib/interview-style-cue-rc57108.js';
import {witnessGenderIssue} from '../lib/interview-gender-rc571011.js';
import {reviewNaturalSpeech} from '../lib/interview-naturalness-rc28.js';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {spokenStyleGuide} from '../lib/spoken-dialogue-623.js';
import {styleForWitness} from '../lib/narrative-voice-619.js';
import {speechCadence} from '../lib/interview-rc51.js';
import {dialogueContinuity} from '../lib/dialogue-continuity-620.js';
import {psychologicalDelivery} from '../lib/interview-psychology-rc37.js';
import {WITNESS_VOICE_PROFILES,INTERVIEW_STYLE_CONTEXT,interviewLegacySystem,interviewAnswerSystem} from '../lib/interview-prompt-rc57106.js';
const f=q=>interviewStyleCue({question:q}).responseFocus;
for(const [q,expect] of [
 ['Skąd o tym wiesz?','source_of_knowledge'],
 ['Z jakiego źródła pochodzą informacje?','source_of_knowledge'],
 ['Czy to tylko twoje przypuszczenie?','source_of_knowledge'],
 ['Kłamiesz?','pressure'],
 ['Ukrywasz coś?','pressure'],
 ['Nie twierdzę, że kłamiesz. Czy chcesz coś sprostować?','correction'],
 ['Co z twoją obecnością po północy?','whereabouts'],
 ['Gdzie byłaś po północy?','whereabouts'],
 ['Kto może to potwierdzić?','corroboration'],
 ['Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?','whereabouts'],
 ['Czy pamiętasz, co powiedziałeś na początku tej rozmowy?','current_question'] // w pustej historii nie ma czego przypominać
])assert.equal(f(q),expect,q);
const quotes=[
 ['ELZBIETA','Marek powiedział: „Byłem w biurze”.',null],
 ['ELZBIETA','Marek powiedział: "Byłem w biurze".',null],
 ['ELZBIETA','Marek powiedział: «Byłem w biurze».',null],
 ['ELZBIETA','Marek powiedział: “Byłem w biurze”.',null],
 ['MAREK','Elżbieta powiedziała: „Byłam w biurze”.',null],
 ['ELZBIETA','Byłam w biurze. Marek powiedział: „Byłem w dyspozytorni”.',null],
 ['ELZBIETA','Byłem w biurze.','female_speaker_male_verb'],
 ['ELZBIETA','„Byłem w biurze”.','female_speaker_male_verb'],
 ['ELZBIETA','Marek powiedział: „Byłem w biurze”, ale ja byłem na zmianie.','female_speaker_male_verb'],
 ['MAREK','Byłam w warsztacie.','male_speaker_female_verb'],
 ['ELZBIETA','Powiedziałam o ryzyku. Marek mówił: «Widziałem to».',null]
];
for(const [id,answer,expect] of quotes)assert.equal(witnessGenderIssue(id,answer),expect,answer);
const scene={identity:{id:'ELZBIETA'},question:'Co powiedziałaś?',memory:{conversation:[]}};
for(const result of [reviewNaturalSpeech(scene,'Marek powiedział: „Byłem w biurze”.'),reviewWitnessDraft(scene,'Marek powiedział: „Byłem w biurze”.')])assert(result.ok,result.reason);
assert(!auditLiveDialogue({question:'Co powiedziałaś?',answer:'Marek powiedział: „Byłem w biurze”.',history:[],witnessId:'ELZBIETA'}).findings.some(x=>x.code==='witness_gender_mismatch'));
assert.equal(reviewNaturalSpeech(scene,'Byłem w biurze.').reason,'witness_gender_mismatch');
for(const id of ['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']){
 assert.equal(spokenStyleGuide(id),WITNESS_VOICE_PROFILES[id].voice);
 assert.equal(styleForWitness(id),WITNESS_VOICE_PROFILES[id].delivery);
 assert.equal(speechCadence({identity:{id},question:'Jaką rolę pełniłeś?',approvedThreadHistory:[]}).individualVoice,WITNESS_VOICE_PROFILES[id].voice);
 assert.equal(psychologicalDelivery({identity:{id},question:'Czy ukrywasz coś?'}).individual,WITNESS_VOICE_PROFILES[id].delivery);
}
const h=[{role:'player',text:'Kłamiesz?'},{role:'witness',text:'Nie twierdzę, że siedziałem w biurze bez przerwy.'},{role:'player',text:'Skąd to wiesz?'},{role:'player',text:'Kłamiesz?'}];
assert(dialogueContinuity('MAREK',h).includes(WITNESS_VOICE_PROFILES.MAREK.delivery));
assert(dialogueContinuity('MAREK',h).includes(INTERVIEW_STYLE_CONTEXT.continuity.accusation) || dialogueContinuity('MAREK',h).includes(INTERVIEW_STYLE_CONTEXT.continuity.verifying));
assert(interviewLegacySystem.includes('groundedOptions'));
assert(interviewAnswerSystem.includes('WSPÓLNY KONTRAKT'));
for(const file of ['spoken-dialogue-623.js','narrative-voice-619.js','interview-psychology-rc37.js','dialogue-continuity-620.js']){
 const text=fs.readFileSync(new URL('../lib/'+file,import.meta.url),'utf8');
 assert(!text.includes('const VOICES=Object.freeze('),file);
 assert(!text.includes('const temperament=Object.freeze('),file);
}
console.log('PASS RC57.10.12: 11 pytan kontekstowych, 11 przypadkow rodzaju/cytatow, integracja produkcyjnych kontrol, 6 profili, centralizacja promptow.');
