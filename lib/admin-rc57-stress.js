/* RC57.10 — reproducible pseudo-random challenge sets. No outside network or
 * game writes. Status describes parser capability, not live model quality. */
import {buildQuestionContext} from './question-context-630.js';
import {auditLiveDialogue} from './admin-rc57-claim-audit.js';
import {correctIntentTypos} from './question-typos-rc578.js';
const W=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const SEEDS=Object.freeze([
 'Gdze byles po polnocy i kto cie widzial?',
 'Nei pytam o Lenę, tylko o alibi. Gdze byles?',
 'Nie o warsztat, tylko o godzinę wyjścia. Kiedy to było?',
 'Znasz osobe ktora uzyla T-17? Czy masz na to dowod?',
 'Przed chwilą mówiłeś o biurze. A później gdzie byłeś?',
 'Skad to wiesz i skad wiesz, ze nie mylisz sie co do godziny?',
 'Czy widzialas Lenę, a jesli nie, kiedy ostatni raz rozmawialyscie?',
 'Kto moze potwirdzic twoje słowa i czy bylo to po polnocy?',
 'Nie twierdzę, że kłamiesz. Dlaczego twoja relacja jest inna?',
 'Potwierdź, skąd pochodzi ten protokół, nie zgaduj.',
 'To nie pytanie o winę. Gdzie byłaś około 01:44?',
 'Kiedy otrzymałeś kartę, komu ją oddałeś i kto potem wszedł?',
 'Co mowiles na początku i czy teraz coś prostujesz?',
 'Czy przechodziłeś w pobliżu niszy N-3 o 01:38?',
 'Przyznałbyś się, gdybyś to zrobił? Nie chodzi o sugestię winy.',
 'Czy mozemy ustalic dokładną godzinę na podstawie dokumentów?',
 'A co działo się wcześniej? Nie o Lenę pytam.',
 'Czy znasz LAB-03? Czy to dowodzi twojej obecności?',
 'Nie pamiętam twoich słów; powtórz co dokładnie powiedziałeś.',
 'Jak oceniasz sprzeczność w zeznaniach innych, jeśli jej nie znasz?'
]);
const pick=(index)=>SEEDS[(index*17+Math.floor(index/6)*3)%SEEDS.length];
export const stressInfo=Object.freeze({version:'RC57.10-stress',total:120,groups:6,seed:'stable-rc5710-v1',limitations:['Bez prawdziwego modelu: analiza heurystyk i zabezpieczeń','Nie wolno traktować poprawnego parsera jako udanego dialogu','Pytania z błędnymi szczegółami nie mogą dostarczyć postaci nowych faktów']});
export function runStressBatch(offset,limit=20){
 if(!Number.isInteger(offset)||offset<0||offset>=stressInfo.total||!Number.isInteger(limit)||limit<1||limit>20)throw Error('invalid_stress_range');
 const results=[];
 for(let i=offset;i<Math.min(offset+limit,stressInfo.total);i++){
  const id=W[Math.floor(i/20)],q=pick(i),history=[{role:'player',text:'Gdzie byłeś?'},{role:'witness',text:'Rozmawiałem z ludźmi, ale nie odtwarzam każdej godziny.'}];
  let status='pass',detail='';
  try{
   const parsed=buildQuestionContext(q,history),intent=parsed.questionPlan.primary;
   const fold=q.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
   const typo=correctIntentTypos(fold);
   if(!intent||typeof intent!=='string')throw Error('intent_missing');
   const expectedIds=(fold.match(/\b(?:lab-\d{2}|t-17|n-3|01:38|01:44)\b/g)||[]);
   if(expectedIds.some(token=>!typo.text.includes(token)))throw Error('identifier_or_time_mutated');
   if(/\bgdze\b/.test(fold)&&!typo.substitutions.some(x=>x.from==='gdze'&&x.to==='gdzie'))throw Error('typo_gdzie_unrecognized');
   if(/\bnei\b/.test(fold)&&!typo.substitutions.some(x=>x.from==='nei'&&x.to==='nie'))throw Error('negation_typo_unrecognized');
   if(/\bnei pytam o lene/.test(fold)&&!(parsed.questionPlan.excludedTopics||[]).some(x=>x.includes('lene')))throw Error('excluded_topic_lost');
   if(/\b(?:nie pytam|nei pytam|ne[i] pytam)\b/i.test(q)&&!parsed.questionPlan)throw Error('negation_context_missing');
   const smoke=auditLiveDialogue({question:q,answer:'Byłem w warsztacie, ale nie pamiętam dokładnej godziny.',history});
   if(!Array.isArray(smoke.findings))throw Error('audit_failed');
   detail='Intencja '+intent+'; wykryte poprawki: '+(typo.substitutions.map(x=>x.from+'→'+x.to).join(', ')||'brak')+'; automatyczne dowody: brak';
  }catch(error){status='fail';detail=String(error.message||error);}
  results.push({id:'ST-'+String(i+1).padStart(3,'0'),witness:id,group:'losowane_trudne_pytania',status,question:q,detail});
 }
 return {release:stressInfo.version,offset,total:stressInfo.total,results,count:results.length};
}
