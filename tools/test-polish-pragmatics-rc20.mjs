import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPolishPragmatics} from '../lib/polish-pragmatics-rc20.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {attemptInterview} from '../api/interview.js';
const rows=[];
const add=(category,questions,rubric)=>questions.forEach(question=>rows.push({id:'PL20-'+String(rows.length+1).padStart(3,'0'),category,question,rubric,liveResult:'not_run'}));
add('multiple_requests',[
'Gdzie byłeś, kto cię widział i dlaczego wyszedłeś?',
'Co robiłeś po północy? Kto to potwierdzi? Skąd znasz tę godzinę?',
'Znałeś Lenę i komu przekazałeś jej uwagi?',
'Kto miał kartę, kiedy ją dostał i co właściwie pokazuje czytnik?',
'Czy to ty podpisałeś odbiór? Czy widziałeś część? Dlaczego brakuje pomiaru?',
'Nie pytam o Lenę, tylko gdzie ty byłeś i kto cię widział?',
'Co potwierdza telefon, a co rejestr i czego nie potwierdza żaden?',
'Kiedy ją znalazłeś? Co zobaczyłeś? Kogo wezwałeś?',
'Co powiedziała Lena i co z tym zrobiłaś?',
'Masz alibi? Na cały czas czy na fragment? Osoba czy tylko log?',
'Kto wydał zgodę; kto wykonał test; kto odczytał wynik?',
'Gdzie byłeś? Kto cię widział? Kiedy? Dlaczego? Skąd wiesz? Co zrobiłeś? Kogo zawiadomiłeś? Co potem? I kto to sprawdził?'
], 'Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.');
add('references',[
'A on to widział?', 'To kto mu ją dał?', 'A ta druga osoba?', 'Skąd to wiesz?',
'A tamta godzina?', 'I co z tym zrobiłeś?', 'To było przed tym czy po tym?',
'Czy ona mówiła o nim, czy o tym drugim?', 'Kto z nich tam poszedł?',
'Osobiście?', 'Który z tych dwóch zapisów masz na myśli?', 'A jej kto powiedział?'
], 'Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.');
add('premises_negation',[
'Skoro usunąłeś nagranie, dlaczego wróciłeś do biura?',
'Przecież siedziałeś tam całą noc, choć przed chwilą powiedziałeś, że wychodziłeś.',
'Dlaczego zabiłeś Lenę i kto ci za to zapłacił?',
'Nie mówię, że nie wyszedłeś. Pytam, kto cię widział.',
'Nie twierdzę, że kłamiesz, tylko pytam o źródło tej godziny.',
'Czy brak dowodu, że wyszedłeś, jest dowodem, że zostałeś?',
'Nie zaprzeczasz, że nie widziałeś Leny?',
'Twierdzisz, że nie byłeś w hali, ale mówisz, że widziałeś osłonę. Skąd?',
'Dlaczego sfalsyfikowałeś dokument, skoro go nawet nie podpisywałeś?',
'Czy nie jest nieprawdą, że to Lena zgłaszała zastrzeżenia?',
'Nie o to, kto zadzwonił. O to, kto widział ją żywą.',
'Skoro karta to twoja obecność, to czemu twierdzisz, że nie wiesz kto wszedł?'
], 'Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.');
add('irony_sarcasm',[
'No jasne, karta sama poszła na spacer.',
'Brawo, pełne alibi z jednego telefonu. A kto cię widział?',
'Ta jasne, niewiniątko. To kto podpisał ten protokół?',
'Gratuluję, dokument sam się podpisał, tak?',
'Pewnie duch skasował zapis. Kto miał dostęp?',
'Dobre sobie. Log widział cię na własne oczy?',
'No tak, Lena na pewno wymyśliła ten wagon. Co zgłaszała?',
'Akurat uwierzę, że niczego nie pamiętasz. Co pamiętasz na pewno?',
'Święty człowiek z pana. A po co te korekty?',
'Geniusz. Nie ma wpisu, więc nikt nie wyszedł?',
'Brawo, teraz rozumiem różnicę między kontem a osobą. Co z kartą?',
'No jasne. Dziękuję za wyjaśnienie. Kiedy ruszyła zmiana?'
], 'Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.');
add('colloquial_polish',[
'Nie ściemniaj, kto cię tam widział?', 'Bez kitu, gdzie siedziałeś po północy?',
'Coś mi się to nie klei. Jak było po kolei?', 'Kto to klepnął?',
'Kto dał zielone światło na ten test?', 'No gadaj po ludzku, co ten log pokazuje?',
'Nie rób mnie w balona. Telefon to nie zdjęcie, nie?', 'Co ty kombinowałeś przy tym wagonie?',
'co ty pierdolisz kto to niby potwierdzi', 'kto cie widzial i skad ta godzina bez lania wody',
'Puścił ktoś parę czy tylko zgadujesz?', 'Kręci pan tym pokrętłem w prawo czy w lewo?'
], 'Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.');
assert.equal(rows.length,60);
const history=[
 {role:'player',text:'Kto może potwierdzić twoją obecność?'},
 {role:'witness',text:'Janusz Wójcik potwierdzi rozmowę przy administracji. Tomasz zna moje kontakty z dyspozytornią.'},
 {role:'player',text:'A co potwierdza rejestr?'},
 {role:'witness',text:'Rejestr wejść i rozliczenie czasu to różne zestawienia.'}
];
for(const row of rows){
 const p=buildPolishPragmatics(row.question,history);
 assert.equal(p.authority,'tentative-language-cues-not-facts');
 assert(p.segments.length<=8);assert(p.referenceContext.length<=3);
 assert.equal(row.liveResult,'not_run');
 if(row.category==='multiple_requests')assert(p.requireSemanticAudit,row.question);
 if(row.category==='irony_sarcasm')assert(p.possibleNonliteral,row.question);
}
assert(buildPolishPragmatics(rows[11].question).segmentationIncomplete);
assert.equal(buildPolishPragmatics('A on?',[]).unresolvedReference,true);
assert.equal(buildPolishPragmatics('A on?',history).referenceContext.length,2);
const offline=[{role:'player',text:'Kto?'},{role:'witness',text:'CLIENT_SECRET',narrativeStatus:'offline_unverified'}];
assert(!JSON.stringify(buildPolishPragmatics('A on?',offline)).includes('CLIENT_SECRET'));
assert.equal(buildPolishPragmatics('Kręci pan tym pokrętłem w prawo czy w lewo?').registerHints.some(x=>x.includes('kręcić')),false);
function sceneFor(q){const s=trustedScene({identity:{id:'MAREK'},question:q});Object.assign(s,buildQuestionContext(q));return s;}
// Real pipeline, controlled provider callbacks. The old code stripped questionParts from the auditor.
{
 const q='Gdzie byłeś? Kto to potwierdzi?';const s=sceneFor(q);assert(s.questionParts.length>=2);
 const f=s.knowledge.factBank.find(f=>f.knowledgeId==='RC19-MAREK-S02');let generations=0,audits=0;
 const r=await attemptInterview(s,'groq',async(system,payload,a,b,c,phase)=>{
  if(phase==='generate'||phase==='rewrite'){
   generations++;assert.equal(payload.question,q);assert.equal(payload.questionParts,undefined);
   assert(payload.polishPragmatics.segments.length===2);
   return {decision:'answer',factIds:[f.id],text:f.text};
  }
  if(phase==='semantic-audit'){
   audits++;assert.deepEqual(payload.questionParts,s.questionParts);
   return {relevant:true,entailed:true,complete:false,semanticRepeat:false,coveredParts:s.questionParts.map((_,i)=>i===0)};
  }
 });
 assert.equal(r,null);assert.equal(audits,2);assert.equal(generations,2);
}
// A literal excerpt must not skip semantic review for sarcasm or an ambiguous reference.
for(const q of ['No jasne, geniusz, masz pełne alibi z telefonu.','A on to widział?','Nie ściemniaj, kto cię widział?']){
 const s=sceneFor(q);s.memory.conversation=history.map(r=>({role:r.role==='player'?'śledczy':'świadek',text:r.text}));
 s.polishPragmatics={requireSemanticAudit:false,registerHints:['CLIENT_SECRET']};
 const f=s.knowledge.factBank.find(f=>f.knowledgeId==='RC19-MAREK-S02');let audits=0;
 const r=await attemptInterview(s,'groq',async(system,payload,a,b,c,phase)=>{
  assert(!JSON.stringify(payload.polishPragmatics).includes('CLIENT_SECRET'));
  if(phase==='generate')return {decision:'answer',factIds:[f.id],text:f.text};
  if(phase==='semantic-audit'){audits++;assert(payload.polishPragmatics.requireSemanticAudit);return {relevant:false,entailed:true,complete:false,coveredParts:[],semanticRepeat:false};}
  if(phase==='rewrite')return {decision:'fallback'};
 });assert.equal(r,null);assert.equal(audits,1);
}
// A grounded, specific clarification remains acceptable; ambiguity must not force invention.
{
 const q='A on to widział?';const s=sceneFor(q);s.memory.conversation=history.map(r=>({role:r.role==='player'?'śledczy':'świadek',text:r.text}));
 const f=s.knowledge.factBank.find(f=>f.knowledgeId==='RC19-MAREK-S02');let audits=0;
 const r=await attemptInterview(s,'groq',async(system,payload,a,b,c,phase)=>{
  if(phase==='generate')return {decision:'answer',factIds:[f.id],text:'Czy chodzi o Janusza czy o Tomasza?'};
  if(phase==='semantic-audit'){audits++;assert(payload.polishPragmatics.referenceContext.length===2);return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};}
  throw Error('unexpected '+phase);
 });assert(r?.ok);assert.equal(audits,1);
}
fs.writeFileSync(new URL('./fixtures/polish-pragmatics-rc20.json',import.meta.url),JSON.stringify({schema:'ps-polish-language-regression/1',purpose:'semantic_review_rubrics_not_answer_templates',cases:rows},null,2));
console.log('PASS RC20: 60 language cases; original questions preserved; reference pairs bounded and offline excluded; multi-part audit receives its parts; sarcasm/ambiguity cannot bypass semantic audit. Live AI: not run.');
