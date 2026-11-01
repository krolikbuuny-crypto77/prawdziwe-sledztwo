import assert from 'node:assert/strict';
import {analyzeQuestion} from '../lib/question-intent-633.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
const cases=[
 'gdze byles po polnocy?', 'gdze byłaś po północy?', 'Nei pytam o Lenę, gdzie byłeś?',
 'Kiedyy byłeś w dyspozytorni?', 'Powiedz gdze byles', 'Skąd to wiesz?',
 'Kto potwierdzi twoje alibi?', 'A skąd wiesz, że nie pomyliłeś godzin?',
 'Nie o Lenę pytam, tylko o alibi.', 'Gdzie byłeś, a kto to widział?',
 'Czy pamiętasz tę rozmowę?', 'Dlaczego nie powiedziałeś o tym wcześniej?'
];
for(const q of cases){const a=analyzeQuestion(q);const b=buildQuestionContext(q);assert(a&&b&&b.questionPlan,'parser should not throw: '+q)}
assert.equal(analyzeQuestion('gdze byles po polnocy?').primary,'self_alibi');
assert.equal(analyzeQuestion('Nei pytam o Lenę, gdzie byłeś?').primary,'self_alibi');
const evasion=auditLiveDialogue({question:'Gdzie byłeś po północy?',answer:'Pracowałem przy stanowisku, ale nie mogę podać miejsca pobytu po północy.',history:[]});
assert(evasion.findings.some(x=>x.code==='place_self_contradiction'));
const repeat=auditLiveDialogue({question:'Nie pytam o Lenę, tylko gdzie byłeś?',answer:'Później znalazłem Lenę.',history:[]});
assert(repeat.findings.some(x=>x.code==='excluded_topic_repeated'));
console.log('RC57.10 PASS:',cases.length,'trudnych pytań + negacje + sprzeczności');
