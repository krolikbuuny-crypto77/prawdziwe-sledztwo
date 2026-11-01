import assert from 'node:assert/strict';
import {analyzeMultiQuestion} from '../lib/interview-rc50.js';
import {runBatch} from '../lib/admin-rc57-suite.js';

// Regressions caught by the 2026-11-01 RC57 report: correction F-012/F-015/F-018
// and pressure F-021/F-022/F-023/F-026/F-028/F-029/F-030 across six witnesses.
const corrected = [
 'Nie pytam o Lenę. Chodzi mi o to, gdzie byłeś.',
 'Nie o ostatnie spotkanie, tylko o godzinę wyjścia.',
 'Poprawiam pytanie: chodzi mi o źródło informacji.',
 'Nie pytam o motyw, tylko o obecność po północy.',
 'Nie o warsztat, tylko o godzinę.',
 'Nie pytam o oskarżenia, tylko o źródło informacji.',
 'Chodzi mi o to, gdzie byłeś wcześniej.',
 'Nie o Lenę, tylko o alibi.',
 'Poprawiam pytanie: kiedy dokładnie to było?',
 'Nie pytam o dokument, tylko o to, kto potwierdzi twoje słowa.',
 'Nie o obecność w dyspozytorni, lecz o godzinę wyjścia.',
 'Nie o to chodzi. Interesuje mnie, kto to widział.',
 'Miałam na myśli źródło, a nie Twoją opinię.'
];
for (const question of corrected) {
 const cue=analyzeMultiQuestion(question);
 assert.equal(cue.correction,true,`Sprostowanie nie rozpoznane: ${question}`);
 assert.match(cue.negatedScope,/odrzuć/);
 assert.equal(cue.authority,'style_and_completeness_only');
}
const challenged = [
 'Kłamiesz! Gdzie byłeś?', 'Oszukujesz nas. Gdzie byłeś?', 'Ukrywasz prawdę!',
 'Przyznaj się, gdzie byłeś?', 'Czy twierdzisz, że jesteś winny?',
 'Kłamiesz! Potwierdź alibi.', 'Zabiłeś ją?', 'Ukrywasz informacje o tym miejscu!',
 'Manipulujesz, dlaczego?', 'Czy oszukujesz nas w kwestii czasu?',
 'Czy zataiłeś ten dokument?', 'Dlaczego kłamałeś?', 'Oskarżam pana o fałszowanie wpisu.'
];
for (const question of challenged) {
 const cue=analyzeMultiQuestion(question);
 assert.equal(cue.challenge,true,`Nacisk nie rozpoznany: ${question}`);
 assert.equal(cue.authority,'style_and_completeness_only');
}
const noCorrection = ['Czy masz alibi?','Nie jestem pewien, gdzie byłeś.','Nie pamiętasz godziny?', 'Interesuje mnie aktualna godzina.', 'Nie o 10:00?'];
for(const question of noCorrection)assert.equal(analyzeMultiQuestion(question).correction,false,`Fałszywe sprostowanie: ${question}`);
const noChallenge = ['Gdzie byłeś?', 'Nie twierdzę, że kłamiesz.', 'Nie sugeruję, że ukrywasz prawdę.', 'Nie oskarżam pana, że zabił pan Lenę.'];
assert.equal(analyzeMultiQuestion('Nie twierdzę, że kłamiesz, ale czy oszukujesz nas w sprawie czasu?').challenge,true);
for(const question of noChallenge)assert.equal(analyzeMultiQuestion(question).challenge,false,`Fałszywy zarzut: ${question}`);
for(const q of [...corrected,...challenged])assert(!JSON.stringify(analyzeMultiQuestion(q)).includes('factBank'),'Analizator zwrócił niedozwolony fakt');
const all=[];for(let offset=0;offset<600;offset+=20)all.push(...runBatch({mode:'full',offset}).results);
assert.equal(all.length,600);
assert.equal(all.filter(r=>r.status==='pass').length,600,`Niezaliczone: ${JSON.stringify(all.filter(r=>r.status!=='pass').slice(0,20))}`);
console.log('PASS RC57.1: 600/600; sprostowania, odmienione naciski, negatywne przypadki, brak wpływu na fakty.');
