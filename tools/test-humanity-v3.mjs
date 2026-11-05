import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildWitnessHumanityV3} from '../lib/witness-humanity-v3.js';
import {serverTurnMemory,chronologyAttributionIssue,exactRecallReply} from '../lib/interview-turn-memory-rc58.js';
import {initialState,appendReportedTurn} from '../lib/server-state.js';
import {interviewWirePayload,interviewAuditSystem} from '../lib/interview-naturalness-rc28.js';
import {interviewAnswerSystem} from '../lib/interview-prompt-rc57106.js';
import {attemptInterview} from '../api/interview.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const examples=[
 ['Dlaczego pan kłamie?','nacisk'],
 ['Nie twierdzę, że kłamiesz. Gdzie byłeś?','wykluczenie_zarzutu'],
 ['Nie oskarżam pana o zabójstwo. Kto może potwierdzić godzinę?','wykluczenie_zarzutu'],
 ['Nie pytam o Lenę, tylko gdzie byłeś po północy?','doprecyzowanie_zakresu'],
 ['Skąd to wiesz?','weryfikacja'],
 ['Kto może to potwierdzić?','weryfikacja'],
 ['Co potwierdza te zeznania?','weryfikacja'],
 ['Rozumiem, że to trudne.','empatia'],
 ['Co powiedział pan w pierwszej wypowiedzi?','wczesniejsze_slowa'],
 ['Sprostuj wcześniejsze zeznanie.','sprostowanie'],
 ['Nie pamięta pan dokładnie?','neutralne'],
 ['Wyjaśnij zapis z telefonu.','neutralne'],
 ['Nie pytam o rejestry, tylko skąd wracałeś.','doprecyzowanie_zakresu']
];
let checks=0;
const ck=(cond,label)=>{assert.ok(cond,label);checks++;};
let s=initialState();const voices=new Set();
for(const id of ids){
 // 16 fully accepted exchanges. Later statements contain a distinct time which
 // must never be backdated to the first reply.
 for(let n=1;n<=16;n++)s=appendReportedTurn(s,id,`Pytanie ${n}`,n===1?'Na początku mówiłem tylko o nocnej zmianie.':n===2?'Później wspomniałem godzinę 23:40.':`Zeznanie ${n} dotyczy tylko pytania ${n}.`,[],'unresolved_statement',{turnId:randomUUID(),provider:'local',model:'witness-registry-rc24'});
 const memory=serverTurnMemory(s,id,'Co powiedziałeś na początku tej rozmowy?');
 ck(memory.selected.sequence===1,`${id}: pierwszy zapis ma numer 1`);
 ck(!memory.first.answer.includes('23:40'),`${id}: pierwsza tura bez późniejszych danych`);
 ck(memory.timelineSummary.at(-1).sequence===16,`${id}: kolejność zapisów`);
 ck(exactRecallReply(memory).text.includes('nocnej zmianie'),`${id}: odtworzenie dokładnego cytatu`);
 ck(chronologyAttributionIssue(memory,'W pierwszej odpowiedzi podałem 23:40.')==='invented_prior_time',`${id}: późniejsza godzina nie przechodzi do pierwszej tury`);
 ck(chronologyAttributionIssue(memory,'Na początku rozmowy powiedziałem: „Później wspomniałem godzinę 23:40.”')==='invented_prior_quote',`${id}: błędna dosłowna wypowiedź`);
 ck(!chronologyAttributionIssue(memory,'Na początku rozmowy powiedziałem: „Na początku mówiłem tylko o nocnej zmianie.”'),`${id}: prawdziwy cytat`);
 const prev=serverTurnMemory(s,id,'Co mówiłeś w poprzedniej odpowiedzi?');
 ck(prev.selected.sequence===16,`${id}: ostatnia, a nie pierwsza tura`);
 ck(chronologyAttributionIssue(prev,'Przed chwilą powiedziałem: „Na początku mówiłem tylko o nocnej zmianie.”')==='invented_prior_quote',`${id}: ochrona przed fałszywym poprzednim cytatem`);
 const plan=buildWitnessHumanityV3({identity:{id},question:'Dlaczego pan kłamie?',approvedThreadHistory:[]});
 ck(plan.authority==='delivery_only_not_knowledge_or_evidence',`${id}: niewładczy plan`);
 ck(!('factIds' in plan)&&!('evidenceUnlocks' in plan),`${id}: brak autoryzacji faktów`);
 ck(plan.interpretation.move==='nacisk',`${id}: reakcja na presję`);
 ck(typeof plan.voice.register==='string'&&plan.voice.register.length>10,`${id}: osobny głos`);
 voices.add(plan.voice.register);
 for(const [q,expected] of examples){
  ck(buildWitnessHumanityV3({identity:{id},question:q,approvedThreadHistory:[]}).interpretation.move===expected,`${id}: ${q}`);
 }
 const hostile=[];const gentle=[];
 for(let n=0;n<7;n++){
  hostile.push({role:'player',text:'Dlaczego pan kłamie?'},{role:'witness',text:'Nie twierdziłem tego.'});
  gentle.push({role:'player',text:'Rozumiem, że to trudne.'},{role:'witness',text:'Dziękuję.'});
 }
 const hp=buildWitnessHumanityV3({identity:{id},question:'Co jeszcze?',approvedThreadHistory:hostile});
 const gp=buildWitnessHumanityV3({identity:{id},question:'Co jeszcze?',approvedThreadHistory:gentle});
 ck(hp.relationship.guardedness>gp.relationship.guardedness,`${id}: napięcie działa`);
 ck(hp.relationship.rapport<gp.relationship.rapport,`${id}: życzliwość nie wywołuje mechanicznej wrogości`);
 ck(hp.variation.recentOpeningsToAvoid.length===1,`${id}: powtarzalne otwarcia deduplikowane`);
 ck(JSON.stringify(plan).length<2400,`${id}: niewielki payload`);
 // A non-verified local answer cannot be a character's model style memory.
 const unverified=buildWitnessHumanityV3({identity:{id},question:'Co jeszcze?',approvedThreadHistory:[{role:'witness',text:'NIEZAUFANA TREŚĆ',narrativeStatus:'offline_unverified'}]});
 ck(unverified.variation.recentOpeningsToAvoid.length===0,`${id}: niezaufane teksty nie są wzorcami`);
}
ck(voices.size===6,'Sześciu świadków ma sześć różnych rejestrów');
ck(buildWitnessHumanityV3({identity:{id:'UNKNOWN'},question:'Hej'})===null,'Brak anonimowego planu');
const base=trustedScene({identity:{id:'MAREK'},question:'Masz alibi?',primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext('Masz alibi?',[]));
base.approvedThreadHistory=[];
base.turnMemory=serverTurnMemory(s,'MAREK','Masz alibi?',base.knowledge.factBank);
base.witnessHumanityV3=buildWitnessHumanityV3(base);
const wire=interviewWirePayload(base);
ck(wire.witnessHumanityV3.version==='3.0','Wskazówki docierają do generatora');
ck(wire.exactConversationRecall.first.answer.includes('nocnej zmianie'),'Pierwsza tura dociera do generatora także bez pytania o pierwszą turę');
ck(wire.exactConversationRecall.timeline.length===8,'Osiem ostatnich tur, zachowane indeksy');
ck(interviewAnswerSystem.includes('witnessHumanityV3'),'Jeden wspólny kontrakt zna nową wskazówkę');
ck(interviewAuditSystem.includes('turnMemory'),'Audyt zna zasadę przypisywania wypowiedzi do tur');
// Invoke the real pipeline through an injected provider; it may reject the
// intentionally empty mocked result, but must have constructed the voice plan.
const real=trustedScene({identity:{id:'JANUSZ'},question:'Co pamiętasz?',primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext('Co pamiętasz?',[]));
real.approvedThreadHistory=[];real._responseDeadline=Date.now()+90000;real._providerDeadline=Date.now()+70000;
let captured=null;
await attemptInterview(real,'apinex-luna',async(system,ctx,tokens,temp,provider,phase)=>{
 captured={system,ctx,phase};return {decision:'fallback',factIds:[],text:''};
});
ck(captured?.phase==='generate','Prawdziwa ścieżka generowania została wywołana');
ck(captured.system.includes('ŻYWI ŚWIADKOWIE 3.0'),'Model otrzymuje instrukcję człowieczeństwa');
ck(captured.ctx.witnessHumanityV3.voice.register.includes('warsztatu'),'Model otrzymuje głos konkretnego świadka');
console.log(JSON.stringify({test:'humanity-v3',checks,witnesses:ids.length,intentExamples:examples.length,status:'PASS'}));
