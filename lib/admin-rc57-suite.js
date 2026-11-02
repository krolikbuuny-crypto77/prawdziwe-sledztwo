/* RC57 v1: real isolated function-level regression suite, not AI model responses.
   No Supabase writes, no outbound requests and no real game/coop sessions.
   6 witnesses * 10 families * 10 variants = 600 reproducible cases. */
import {analyzeMultiQuestion} from './interview-rc50.js';
import {INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
import {speechCadence} from './interview-rc51.js';
import {witnessRelationshipCue} from './interview-rc52.js';
import {initialState,validateAction,verifyOfflineTurn,approvedHistory} from './server-state.js';
import {coopIdentity} from './coop-session-rc35.js';
import {checkOrigin} from './server-state.js';
import rules from './approved-rules.js';

const WITNESSES=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const FAMILIES=['wiele_watkow','negacje','nacisk','powtorki','dluga_rozmowa','relacje','izolacja_wiedzy','blokady_dowodow','tryb_offline','bezpieczenstwo_coop'];
const NAMES=['Nowicki','Krawczyk','Wójcik','Zięba','Brzozowski','Kaczmarek'];
const CASES_PER_WITNESS=100;
const QUESTIONS={
 multi:[
 'Gdzie byłeś po północy i kto może potwierdzić twoją obecność?',
 'Kiedy wyszedłeś z dyspozytorni i dlaczego wcześniej mówiłeś inaczej?',
 'Gdzie się znajdowałeś, o której godzinie i kto to widział?',
 'Dlaczego nie ma potwierdzenia i skąd wiesz, że tak było?',
 'Czy masz alibi i jakie dokumenty mogą je potwierdzić?',
 'Kiedy ostatni raz byłeś w warsztacie i kto może to potwierdzić?',
 'Czy potwierdzasz swoje słowa i dlaczego podajesz inny czas?',
 'Gdzie byłeś, kiedy skończyła się zmiana i kto widział wyjście?',
 'Czemu twierdzisz inaczej niż wcześniej i skąd bierzesz tę godzinę?',
 'Kiedy wróciłeś, gdzie byłeś przedtem i kto może to potwierdzić?'],
 correction:[
 'Nie pytam o Lenę. Chodzi mi o to, gdzie byłeś.',
 'Nie o ostatnie spotkanie, tylko o godzinę wyjścia.',
 'Poprawiam pytanie: chodzi mi o źródło informacji.',
 'Nie pytam o motyw, tylko o obecność po północy.',
 'Nie o warsztat, tylko o godzinę.',
 'Nie pytam o oskarżenia, tylko o źródło informacji.',
 'Chodzi mi o to, gdzie byłeś wcześniej.',
 'Nie o Lenę, tylko o alibi.',
 'Poprawiam pytanie: kiedy dokładnie to było?',
 'Nie pytam o dokument, tylko o to, kto potwierdzi twoje słowa.']
};
const FULL=600, QUICK=60;
export const rc57Info=Object.freeze({version:'RC57.10.14-suite',quick:QUICK,full:FULL,witnesses:WITNESSES,families:FAMILIES,
 disclaimer:'Testy deterministyczne funkcji gry. Bez prawdziwego dostawcy AI, bez pełnego testu przeglądarkowego i bez zapisu do Supabase.'});
export function totalFor(mode){return mode==='quick'?QUICK:mode==='full'?FULL:0;}
const ensure=(check,message)=>{if(!check)throw Error(message);};
function historyFor(witness,turns){const out=[];for(let i=0;i<turns;i++){out.push({role:'player',text:`Pytanie nr ${i+1} o obecność`});out.push({role:'witness',text:`Odpowiedź nr ${i+1}: zakres obowiązków.`});}return out;}
function execute(witness,family,v){
 const prior=historyFor(witness,Math.min(40,4+v*4));let q='',detail='';
 switch(family){
 case 0:{q=QUESTIONS.multi[v];const x=analyzeMultiQuestion(q,prior);ensure(x.requested.length>=2,'Złożone pytanie nie zostało rozdzielone');ensure(x.multipleTargets,'Nie rozpoznano wielu wątków');ensure(x.authority==='style_and_completeness_only','Przekroczono uprawnienia analizatora');detail=x.requested.join(', ');break;}
 case 1:{q=QUESTIONS.correction[v];const x=analyzeMultiQuestion(q,prior);ensure(x.correction,'Nie rozpoznano jawnego sprostowania');
   // Test the semantic distinction, not one hard-coded word in the prompt.
   const exclusionExpected=[true,true,false,true,true,true,false,true,false,true][v];
   ensure(x.explicitNegation===exclusionExpected,'Niepoprawne rozpoznanie zakresu negacji');
   ensure(x.authority==='style_and_completeness_only','Wskazówka negacji dostała uprawnienia faktograficzne');
   if(exclusionExpected){ensure(Boolean(x.excludedTopic),'Brak wskazanego tematu wykluczonego');
     ensure(Boolean(x.targetTopic),'Brak nowego zakresu pytania');
     ensure(x.negatedScope===INTERVIEW_STYLE_CONTEXT.questions.excluded,'Brak wskazówki respektowania negacji');}
   else {ensure(x.excludedTopic===null,'Fałszywa negacja w doprecyzowaniu');
     ensure(x.negatedScope===INTERVIEW_STYLE_CONTEXT.questions.clarified,'Doprecyzowanie błędnie potraktowano jak negację');}
   detail=exclusionExpected?`Wyłączono: ${x.excludedTopic}; pytanie o: ${x.targetTopic}`:'Doprecyzowanie bez wykluczania tematu';break;}
 case 2:{q=['Kłamiesz! Gdzie byłeś?','Oszukujesz nas. Gdzie byłeś?','Ukrywasz prawdę!','Przyznaj się, gdzie byłeś?','Czy twierdzisz, że jesteś winny?','Kłamiesz! Potwierdź alibi.','Zabiłeś ją?','Ukrywasz informacje o tym miejscu!','Manipulujesz, dlaczego?','Czy oszukujesz nas w kwestii czasu?'][v];const x=analyzeMultiQuestion(q,prior);ensure(x.authority==='style_and_completeness_only','Nacisk zmienił poziom uprawnień');
   // Explicit warning for missed hostility classification, never a fact or proof of guilt.
   if(!x.challenge)return {status:'warning',detail:'Słowa nacisku nie zostały rozpoznane jako challenge; sprawdź dialog ręcznie.'};detail='Sygnał nacisku rozpoznany';break;}
 case 3:{q=['Gdzie byłeś?','Kiedy wróciłeś?','Co potwierdza obecność?','Dlaczego?','Skąd wiesz?','Czy rozumiesz pytanie?','Kto to widział?','Pamiętasz dokładną godzinę?','Powtórz miejsce pobytu.','A wcześniej?'][v];const c=speechCadence({identity:{id:witness},question:q,approvedThreadHistory:prior});ensure(c.authority==='style_only_not_fact','Opis stylu podaje fakty');ensure(c.individualVoice.length>15,'Brak stylu postaci');ensure(c.targetLength.includes('1–2'),'Niepoprawna długość krótkiej odpowiedzi');detail=c.individualVoice;break;}
 case 4:{q='Gdzie byłeś po północy, kto może to potwierdzić i dlaczego poprzednio mówiłeś inaczej?';const history=historyFor(witness,40+v*4);const x=analyzeMultiQuestion(q,history),c=speechCadence({identity:{id:witness},question:q,approvedThreadHistory:history});ensure(x.contextTurns===6,'Przekroczono zakres kontekstu analizy');ensure(c.repeatedOpeners.length<=4,'Nieograniczone powtórki otwarć');detail=`Historia ${40+v*4} wymian, analiza 6 tur`;break;}
 case 5:{const other=NAMES[(WITNESSES.indexOf(witness)+v+1)%6];q=`Co wiesz o ${other}?`;const rel=witnessRelationshipCue({identity:{id:witness},question:q,approvedThreadHistory:prior,knowledge:{documentsShown:['TEC-01']}});ensure(rel.authority==='conversation_reference_only_not_fact','Relacje zyskują nieuprawnioną wiedzę');ensure(rel.persons.length<=4,'Zbyt szeroka lista osób');ensure(rel.evidencePresented===null,'Wymyślono okazany dokument');detail=`Osoba ${other}, bez automatycznych faktów`;break;}
 case 6:{q='Czy wiesz, co twierdzi Zięba?';const rel=witnessRelationshipCue({identity:{id:witness},question:q,approvedThreadHistory:[{role:'player',text:'Zięba powiedziała, że zna prawdę.'},{role:'witness',text:'Nie potrafię potwierdzić.'}],knowledge:{documentsShown:['TEC-01']}});
   ensure(!rel.persons.some(p=>p.previouslyMentionedByWitness),'Przejęto wiedzę z pytania gracza');ensure(!JSON.stringify(rel).includes('zna prawdę'),'Wyciek treści cudzej wypowiedzi');detail='Historia gracza nie staje się wiedzą świadka';break;}
 case 7:{const gated=Object.keys(rules.gates),id=gated[(v+WITNESSES.indexOf(witness))%gated.length];const state=initialState();const attempt=validateAction(state,{type:'collect_evidence',docId:id,origin:'arbitrary',area:rules.documents[id]?.area});ensure(!attempt.ok,'Niedozwolone źródło odblokowało dokument');ensure(!state.approvedEvidence.includes(id),'Stan wejściowy został zmieniony');detail=`Dokument ${id}, przyczyna ${attempt.why}`;break;}
 case 8:{q=`Czy to działa bez internetu? (próba ${v+1})`;const state=initialState();const next=verifyOfflineTurn(state,{type:'record_local_turn',witnessId:witness,question:q,response:'Offline: cytat lokalny niepotwierdzony.'});ensure(next.ok,'Nie zapisano rozmowy offline');const saved=approvedHistory(next.state,witness);ensure(saved.at(-1).narrativeStatus==='offline_unverified','Offline uznany za wiarygodne zeznanie');ensure(next.state.approvedEvidence.length===state.approvedEvidence.length,'Tryb offline zmienił dowody');detail='Lokalna wypowiedź nie jest dowodem';break;}
 case 9:{const invalid=[`ps_coop=${'x'.repeat(v+1)}`,'ps_coop=','','ps_coop=malformed.cookie.value','ps_coop=invalid'][v%5];ensure(coopIdentity({headers:{cookie:invalid}})===null,'Sfałszowany token dał dostęp do współpracy');ensure(checkOrigin({headers:{origin:'https://forged.example',host:'game.example'}})===false,'Cudzy origin dopuszczony');detail='Sfałszowany token i cross-origin odrzucone (bez bazy)';break;}
 default:throw Error('unknown_family');}
 return {status:'pass',detail};
}
export function caseDescriptor(index,mode='full'){
 const total=totalFor(mode);if(!Number.isInteger(index)||index<0||index>=total)throw Error('invalid_test_index');
 const mapped=mode==='quick'?index*10:index;const w=Math.floor(mapped/CASES_PER_WITNESS),within=mapped%100;
 return {index,id:`${mode==='quick'?'Q':'F'}-${String(index+1).padStart(3,'0')}`,witness:WITNESSES[w],family:FAMILIES[Math.floor(within/10)],familyIndex:Math.floor(within/10),variant:within%10};
}
export function runBatch({mode,offset,limit=20}){
 const total=totalFor(mode);if(!total)throw Error('invalid_test_mode');
 if(!Number.isInteger(offset)||offset<0||offset>=total||!Number.isInteger(limit)||limit<1||limit>20)throw Error('invalid_test_range');
 const rows=[];for(let i=offset;i<Math.min(total,offset+limit);i++){
  const descriptor=caseDescriptor(i,mode);let evaluation;
  try{evaluation=execute(descriptor.witness,descriptor.familyIndex,descriptor.variant);}
  catch(error){evaluation={status:'fail',detail:String(error?.message||'test_failed').slice(0,240)};}
  rows.push({id:descriptor.id,witness:descriptor.witness,group:descriptor.family,status:evaluation.status,detail:evaluation.detail.slice(0,240)});
 }
 return {mode,total,offset,count:rows.length,results:rows,release:rc57Info.version};
}
