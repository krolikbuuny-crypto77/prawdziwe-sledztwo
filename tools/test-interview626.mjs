import assert from 'node:assert/strict';
import {questionFocus,relevantForQuestion} from '../lib/interview-intent-626.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
function scene(id,q){return trustedScene({identity:{id},question:q,knowledge:{currentGroundedAnswer:'IGNORED',documentsShown:[]}},null)}
const q1='Gdzie przebywałeś między 01:30 a 02:05?';
const q2='Kto zgłosił znalezienie Leny i o której godzinie?';
assert.equal(questionFocus(q1),'self_alibi');assert.equal(questionFocus(q2),'alarm_report');
assert.equal(questionFocus('Gdzie była Lena?'),null);
const marek=scene('MAREK',q1);
assert.match(marek.knowledge.currentGroundedAnswer,/Nadzorowałem nocną zmianę/);
assert(!marek.knowledge.currentGroundedAnswer.includes('IGNORED'));
assert(relevantForQuestion(q1,marek.knowledge.currentGroundedAnswer));
assert(!relevantForQuestion(q1,'Ostatnio spotkałem Lenę przy wagonie.'));
const tomasz=scene('TOMASZ',q2);
assert.match(tomasz.knowledge.currentGroundedAnswer,/alarm/);
assert.match(tomasz.knowledge.currentGroundedAnswer,/02:02/);
assert(relevantForQuestion(q2,tomasz.knowledge.currentGroundedAnswer));
assert(!relevantForQuestion(q2,'Nie pamiętam, kiedy ostatnio widziałem ją żywą.'));
for(const id of ['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']){
 const x=scene(id,q1);assert(x?.serverVerifiedFacts);assert(x.knowledge.factBank.every(y=>y.text&&!y.text.includes('IGNORED')));
}
console.log('PASS 6.26 server NLU: alibi vs victim contact, alarm report, authorized canon, six witnesses');
