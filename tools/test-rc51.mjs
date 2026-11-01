import assert from 'node:assert/strict';
import {speechCadence} from '../lib/interview-rc51.js';
import {interviewWirePayload,interviewAnswerSystem} from '../lib/interview-naturalness-rc28.js';
const scene={identity:{id:'KAMIL'},question:'Masz alibi?',approvedThreadHistory:[{role:'witness',text:'Nie pamiętam, co było potem.'},{role:'witness',text:'Widziałem zapis sesji.'}],knowledge:{factBank:[{id:'f0',text:'Karta nie identyfikuje człowieka.'}]}};
const result=interviewWirePayload(scene);
assert.match(speechCadence(scene).individualVoice,/identyfikatora/);assert.equal(result.rc51Cadence.repeatedOpeners.length,2);
assert.equal(result.rc51Cadence.authority,'style_only_not_fact');assert.ok(interviewAnswerSystem.includes('RC51'));
assert.deepEqual(result.knowledge.factBank.map(f=>f.text),['Karta nie identyfikuje człowieka.']);
console.log('RC51 PASS: individual cadence and no new facts');
