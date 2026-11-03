import assert from 'node:assert/strict';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
const mk=(question,bank,extra={})=>({
  question,identity:{id:'MAREK'},knowledge:{factBank:bank},questionParts:[],
  approvedThreadHistory:[],...extra
});
const fact=(id,text,source='public-alibi',origin='public')=>({id,text,source,origin,knowledgeKind:'authored-personal-background'});
const bank=[
 fact('f0','Na początku zmiany byłem w biurze kierownika, a po północy wychodziłem służbowo do dyspozytorni i warsztatu. Nie pamiętam dokładnych godzin wyjść.'),
 fact('f1','Byłem kierownikiem zajezdni i nadzorowałem nocną zmianę.','public-opening'),
 fact('f2','Janusz Wójcik może potwierdzić rozmowę o karcie pracy przed północą, ale nie całą noc.','public-witness'),
 fact('f3','Sam zapis wejść nie rozstrzyga, kto był w rejonie stanowiska nr 3.','document-13','document')
];
const cases=[
 ['Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?','f0','authored_location'],
 ['Gdzie byłeś po północy?','f0','authored_location'],
 ['Jaką rolę pełniłeś podczas tej zmiany?','f1','authored_role'],
 ['Kto może potwierdzić to, co powiedziałeś?','f2','authored_corroboration']
];
for(const [q,id,kind] of cases){
 const r=localInterviewReply(mk(q,bank));
 assert.equal(r.ok,true,q);
 assert.equal(r.semanticVerified,false);
 assert.equal(r.localVerified,true);
 assert.equal(r.localKind,kind,q);
 assert.deepEqual(r.factIds,[id]);
 assert.equal(r.text,bank.find(f=>f.id===id).text,'authored fallback must be verbatim');
}
const empty=localInterviewReply(mk('Gdzie byłeś po północy?',[]));
assert.deepEqual(empty.factIds,[]);
assert(!/dyspozytorni|warsztacie|biurze/i.test(empty.text),'must not invent a place');
const noWitness=localInterviewReply(mk('Kto może to potwierdzić?',[]));
assert.deepEqual(noWitness.factIds,[]);
assert(!/Nowicki|Wójcik|Krawczyk|Zięba/i.test(noWitness.text),'must not invent a person');
const compound=localInterviewReply(mk('Gdzie byłeś i dlaczego?',bank,{questionParts:[{text:'Gdzie?',intent:'alibi'},{text:'Dlaczego?',intent:'motive'}]}));
assert.equal(compound.localKind,'clarification');
const shown=localInterviewReply(mk('Co jest na tym dokumencie?',bank,{presentedEvidence:{id:'TEC-01'}}));
assert.equal(shown.localKind,'clarification');
assert.deepEqual(shown.factIds,[]);
const quoted=localInterviewReply(mk('Przyznasz się do zabójstwa?',bank));
assert.deepEqual(quoted.factIds,[]);
assert.equal(quoted.localVerified,true);
const prior=localInterviewReply(mk('Gdzie byłeś?', [fact('f0','Raport przy biurku nie dowodzi niczego.','document-22','document')]));
assert.deepEqual(prior.factIds,[],'never use document as personal memory');
const negativeOnly=localInterviewReply(mk('Gdzie byłeś po północy?', [fact('f0','Nie byłem w biurze. Nie byłem w dyspozytorni.') ]));
assert.deepEqual(negativeOnly.factIds,[],'negative-only location is not a whereabouts answer');
const negAndPositive=localInterviewReply(mk('Gdzie byłeś po północy?', [fact('f0','Nie byłem w biurze, tylko w warsztacie.') ]));
assert.deepEqual(negAndPositive.factIds,['f0'],'affirmative location after a correction is still permitted');
console.log('RC57.10.44 PASS — 12 exact fallback behaviors, authored provenance, no fictional location/person, document and accusation guards');
