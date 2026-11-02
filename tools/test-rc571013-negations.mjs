import assert from 'node:assert/strict';
import {analyzeMultiQuestion} from '../lib/interview-rc50.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {runBatch} from '../lib/admin-rc57-suite.js';
import {INTERVIEW_STYLE_CONTEXT,interviewAnswerSystem} from '../lib/interview-prompt-rc57106.js';

const scenarios=[
 ['Nie pytam o Lenę. Chodzi mi o to, gdzie byłeś.',true,'lene','gdzie byles'],
 ['Nie o ostatnie spotkanie, tylko o godzinę wyjścia.',true,'ostatnie spotkanie','godzine wyjscia'],
 ['Poprawiam pytanie: chodzi mi o źródło informacji.',false,null,'zrodlo informacji'],
 ['Nie pytam o motyw, tylko o obecność po północy.',true,'motyw','obecnosc po polnocy'],
 ['Nie o warsztat, tylko o godzinę.',true,'warsztat','godzine'],
 ['Nie pytam o oskarżenia, tylko o źródło informacji.',true,'oskarzenia','zrodlo informacji'],
 ['Chodzi mi o to, gdzie byłeś wcześniej.',false,null,'gdzie byles wczesniej'],
 ['Nie o Lenę, tylko o alibi.',true,'lene','alibi'],
 ['Poprawiam pytanie: kiedy dokładnie to było?',false,null,'kiedy dokladnie'],
 ['Nie pytam o dokument, tylko o to, kto potwierdzi twoje słowa.',true,'dokument','kto potwierdzi']
];
for(const [question,negation,exclusion,focus] of scenarios){
 const x=analyzeMultiQuestion(question);
 assert.equal(x.correction,true,question);
 assert.equal(x.explicitNegation,negation,question);
 assert.equal(x.excludedTopic,exclusion,question);
 assert.ok(x.targetTopic?.includes(focus),question+' focus '+x.targetTopic);
 assert.equal(x.negatedScope,negation?INTERVIEW_STYLE_CONTEXT.questions.excluded:INTERVIEW_STYLE_CONTEXT.questions.clarified);
 assert.equal(x.authority,'style_and_completeness_only');
 const p=interviewWirePayload({question,identity:{id:'MAREK'},knowledge:{factBank:[{id:'f0',text:'Byłem w biurze.'}]}});
 assert.deepEqual(p.knowledge.factBank.map(f=>f.text),['Byłem w biurze.'],'factual payload changed');
 assert.equal(p.rc50QuestionCoaching.explicitNegation,negation,'wire negation');
 assert.equal(p.rc50QuestionCoaching.targetTopic,x.targetTopic,'wire target');
}
for(const question of ['Nie pamiętam godziny.','Nie twierdzę, że kłamiesz.','Czy nie było cię po północy?']){
 const x=analyzeMultiQuestion(question);
 assert.equal(x.explicitNegation,false,question);
 assert.equal(x.excludedTopic,null,question);
}
const other=analyzeMultiQuestion('Nie chodzi mi o Lenę, tylko o godzinę.');
assert.equal(other.explicitNegation,true);assert.equal(other.excludedTopic,'lene');assert.equal(other.targetTopic,'godzine');
assert.ok(interviewAnswerSystem.includes('„Nie pytam o X, tylko o Y” wyklucza temat X'));
assert.ok(INTERVIEW_STYLE_CONTEXT.questions.excluded.includes('odrzuć'));
const results=[];
for(let offset=0;offset<600;offset+=20)results.push(...runBatch({mode:'full',offset}).results);
assert.equal(results.length,600);
assert.equal(results.filter(x=>x.group==='negacje').length,60);
assert.deepEqual(results.filter(x=>x.status!=='pass'),[]);
for(const witness of ['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']){
 assert.equal(results.filter(x=>x.witness===witness&&x.group==='negacje'&&x.status==='pass').length,10);
}
console.log('PASS RC57.10.13: 600/600 cases; 60/60 negations; 10 scoped patterns, 3 plain negations, 1 extra variant; production payload preserves factBank.');
