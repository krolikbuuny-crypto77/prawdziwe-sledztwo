/* RC57.3: isolated, deterministic audit of the full investigation's authoritative
 * mechanics. NEVER connects to Supabase or performs an AI/API request.
 * These checks cover domain functions; live two-browser/real database E2E is separate.
 */
import rules from './approved-rules.js';
import canon from './server-canon-618.json' with {type:'json'};
import {initialState,validateAction,verifyOfflineTurn,approvedHistory,appendReportedTurn,checkOrigin} from './server-state.js';
import {verifyPuzzle,verifyTimeline,fileIndictment,recordDefense,decideVerdict} from './progression-618.js';
import {coopIdentity} from './coop-session-rc35.js';
const W=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const A=['med','tech','digital','cctv','admin','lab','bay','workshop','dispatch','audit','office','passage'];
const f=(ok,message)=>{if(!ok)throw Error(message)};
const clone=o=>JSON.parse(JSON.stringify(o));
const withDocs=(except=[])=>({...initialState(),approvedEvidence:Object.keys(rules.documents).filter(x=>!except.includes(x))});
function timelineAction(e,override={}){return {type:'verify_timeline',eventId:e.id,entry:{at:e.at,to:e.to,place:e.place,sourceIds:[e.sources[0]],reason:'Sprawdzono zarejestrowany wpis źródła w zatwierdzonym wykazie.',...override}};}
function payload(puzzle,stage){const a=canon.puzzles[puzzle];let seq=stage===0&&['tcms','msg'].includes(puzzle)?a.sequence:[],form={};
 if(stage===2)form.Uzasadnienie='best';
 if(puzzle==='tcms'){
  if(stage===1)Object.assign(form,{'Pakiet pierwotny':a.packet,'Retransmisja':a.retry,'Ocena duplikatu':'repeat'});
  if(stage===2)Object.assign(form,{'Związek rejestrów':'separate','Granica wniosku':'limited'});
 }else if(puzzle==='msg'){
  if(stage===1)Object.assign(form,{'Co potwierdzają wskaźniki prev/next?':'chain','Co daje kontrola integralności?':'unchanged'});
  if(stage===2)Object.assign(form,{'Identyfikator konta':'account','Dane urządzenia':'device'});
 }else if(puzzle==='cctv'){
  if(stage===0)Object.assign(form,Object.fromEntries(Object.entries(a.offsets).map(([cam,n])=>['Kamera '+cam+': przesunięcie [s]',String(n)])));
  if(stage===1)seq=a.sequence;
  if(stage===2)Object.assign(form,{'Znaczenie synchronizacji':'order','Nieostry obraz':'limited'});
 }else if(puzzle==='forensic'){
  if(stage===0)a.classes.forEach((v,i)=>{form['Ocena pary '+(i+1)]=v});
  if(stage===1)Object.assign(form,{'Znaczenie kontroli':'transfer','Wniosek przy podobnych wektorach':'class'});
  if(stage===2)Object.assign(form,{'Ocena profilu urazów':'multiple','Granica identyfikacji':'limits'});
 }else if(puzzle==='access'){
  if(stage===0)Object.assign(form,{'Źródło obrazu':'EVID_CCTV_SYNC','Źródło użycia karty':'EVID_T17_DOOR_EVENT','Weryfikacja źródeł':'independent'});
  if(stage===1){seq=a.sequence;seq.slice(0,-1).forEach((x,i)=>{const y=seq[i+1],lim=a.legs[x+'|'+y]??a.legs[y+'|'+x];form['Odcinek '+(i+1)+' [s]']=String(lim)});}
  if(stage===2)Object.assign(form,{'Wniosek z trasy':'possible','Wideokonferencja bez kamery':'session'});
 }
 return {type:'verify_puzzle_stage',puzzle,stage,sequence:seq,form};}
const seedIndictment=({culprit='MAGDALENA',qualification='intentional'}={})=>({culprit,qualification,method:'two_stage',alibi:'remote_not_presence',keystone:'EVID_MESSAGE_THREAD_RECOVERED',links:[
 ...['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC'].map(id=>({role:'person',id})),
 ...['MED-04','MED-09','MED-10','LAB-08','LAB-09'].map(id=>({role:'method',id})),
 ...['EVID_ACCEPTANCE_RECORD','TEC-09','EVID_SERIAL_PHOTO'].map(id=>({role:'motive',id})),
 ...['EVID_CONFERENCE_SESSION','DIG-09','ADM-04'].map(id=>({role:'alibi',id}))],reasons:{person:'best',method:'best',proof:'best',alibi:'best'}});
function verdictFixture(opts={}){const s=withDocs();s.verifiedTimeline.e16={at:'verified'};s.verifiedTimeline.e17={at:'verified'};
 const ind=fileIndictment(s,{type:'file_indictment',indictment:seedIndictment(opts)});f(ind.ok,'Nie można przygotować aktu oskarżenia: '+ind.why);return ind.state;}
const cases=[];function add(group,area,description,run){cases.push({group,area,description,run})}
// 01 — initial contract; 13 starting documents and all 78 registered documents.
for(const id of Object.keys(rules.documents))add('kanon','reguly',`Dokument ${id} ma dozwoloną definicję`,()=>{
 const d=rules.documents[id];f(typeof d.area==='string'&&d.area.length>0,'Brak miejsca dokumentu');f(typeof d.acquisition==='string','Brak drogi pozyskania');
 f(typeof d.family==='string','Brak rodziny źródła');return 'Kanon: '+d.area+' / '+d.acquisition;});
for(const id of rules.initial)add('start','start',`Dokument początkowy ${id}`,()=>{const s=initialState();f(s.approvedEvidence.includes(id),'Nie ma dokumentu startowego');f(s.indictment===null&&s.verdict===null,'Werdykt istnieje przed rozpoczęciem');return 'Dokument startowy obecny';});
for(const area of A)add('eksploracja','nawigacja',`Wejście do obszaru ${area}`,()=>{const s=initialState(),r=validateAction(s,{type:'visit_area',area});f(r.ok&&r.state.visitedAreas.includes(area),'Obszar odrzucony');f(!s.visitedAreas.length,'Zmutowano stan wejściowy');return 'Odwiedzony obszar zapisany w stanie testowym';});
add('eksploracja','nawigacja','Zabronione przejście do nieznanego miejsca',()=>{f(!validateAction(initialState(),{type:'visit_area',area:'api-admin'}).ok,'Nieznane miejsce zatwierdzone');return 'Nieznane miejsce odrzucone';});
// 02 — all searchable documents: positive and invalid acquisition origins.
for(const id of rules.searchable){
 add('dowody','pozyskiwanie',`Wyszukanie ${id} w dozwolonym miejscu`,()=>{const s=withDocs([id]),d=rules.documents[id];
 const r=validateAction(s,{type:'collect_evidence',docId:id,origin:'area-search',area:d.area});f(r.ok,'Poprawne pozyskanie odrzucone: '+r.why);f(r.state.approvedEvidence.includes(id),'Dokument nie przyznany');f(!s.approvedEvidence.includes(id),'Zmutowano stan wejściowy');return 'Zatwierdzono przez reguły serwera';});
 add('dowody','pozyskiwanie',`Nie można znaleźć ${id} w innym obszarze`,()=>{const s=withDocs([id]),r=validateAction(s,{type:'collect_evidence',docId:id,origin:'area-search',area:'__nieistniejacy__'});f(!r.ok,'Obcy obszar odblokował dokument');return r.why;});
}
// 03 — all scene inspection spots and forged inspection proposals.
for(const [spotId,spot] of Object.entries(rules.spots)){
 add('oględziny','scena',`Oględziny miejsca ${spotId}`,()=>{const doc=rules.documents[spot.doc],challenge=rules.challenges[spotId];f(!!challenge,'Brak definicji oględzin');
 const s=withDocs([spot.doc]),r=validateAction(s,{type:'collect_evidence',docId:spot.doc,origin:'scene-inspection',spotId,room:spot.room,method:challenge.method,answer:challenge.correct});
 f(r.ok,'Poprawne oględziny odrzucone: '+r.why+' '+doc?.acquisition);f(r.state.approvedEvidence.includes(spot.doc),'Nie przyznano dowodu');return spot.doc+' zatwierdzony';});
 add('oględziny','scena',`Fałszywe potwierdzenie oględzin ${spotId}`,()=>{const s=withDocs([spot.doc]),challenge=rules.challenges[spotId],r=validateAction(s,{type:'collect_evidence',docId:spot.doc,origin:'scene-inspection',spotId,room:'niewlasciwe',method:challenge?.method,answer:challenge?.correct});f(!r.ok,'Fałszywe miejsce dało dowód');return r.why;});
}
// 04 — gated documents, including unauthorized direct grants.
for(const [id,reqs] of Object.entries(rules.gates))add('blokady','dowody',`Dokument ${id} ma spełnialne, zdefiniowane warunki`,()=>{
 f(reqs.length>0&&reqs.every(x=>rules.documents[x]),'Brak zdefiniowanego warunku');
 f(!rules.initial.includes(id),'Dokument z blokadą początkowo odblokowany');
 const s=initialState(),r=validateAction(s,{type:'collect_evidence',docId:id,origin:'wymuszenie',area:rules.documents[id].area});f(!r.ok,'Dowód odblokowany bez autoryzacji');return `${reqs.length} warunków; odmowa ${r.why}`;});
// 05 — exact canonical chronology and rejection of client-claimed identity.
for(const e of canon.timeline){
 add('chronologia','chronologia',`Zatwierdzenie zdarzenia ${e.id} na podstawie dowodu`,()=>{const s=withDocs(),r=verifyTimeline(s,timelineAction(e));f(r.ok,'Odrzucono poprawny wpis: '+r.why);f(!!r.state.verifiedTimeline[e.id],'Wpis nie został zatwierdzony');return `Źródło ${e.sources[0]}`;});
 add('chronologia','chronologia',`Zablokowanie przypisania sprawcy do ${e.id} bez dowodu`,()=>{const s=withDocs(),r=verifyTimeline(s,timelineAction(e,{actor:'MAGDALENA'}));f(!r.ok,'Zatwierdzono osobę bez dowodu');return r.why;});
 add('chronologia','chronologia',`Zablokowanie błędnej godziny ${e.id}`,()=>{const s=withDocs(),r=verifyTimeline(s,timelineAction(e,{at:'2099-01-01T00:00'}));f(!r.ok,'Fałszywa godzina zatwierdzona');return r.why;});
}
// 06 — each puzzle has three stages, exact valid path and out-of-sequence rejection.
for(const key of Object.keys(canon.puzzles)){
 add('etapy','zagadki',`Przejście wszystkich trzech etapów ${key}`,()=>{let s=withDocs();for(let stage=0;stage<3;stage++){const r=verifyPuzzle(s,payload(key,stage));f(r.ok,`Etap ${stage} odrzucony: ${r.why}`);s=r.state;}f(s.puzzles[key]===3,'Etapy nie zostały zapisane');f(canon.puzzles[key].outputs.every(x=>s.approvedEvidence.includes(x)),'Nie odblokowano wyników');return 'Etapy 1/2/3 i zatwierdzone wyniki';});
 add('etapy','zagadki',`Przedwczesne pominięcie etapu ${key}`,()=>{const r=verifyPuzzle(withDocs(),payload(key,2));f(!r.ok,'Pominięcie etapów przyjęte');return r.why;});
 add('etapy','zagadki',`Fałszywa odpowiedź w etapie ${key}`,()=>{const a=payload(key,0);a.sequence=['BLEDNY'];a.form={'Niepoprawna':'odpowiedz'};const r=verifyPuzzle(withDocs(),a);f(!r.ok,'Nieprawidłowa odpowiedź przyjęta');return r.why;});
}
// 07 — offline witnesses, duplicate idempotency, forbidden markup, narrative isolation.
for(const id of W){
 add('zeznania','offline',`Przesłuchanie offline ${id}`,()=>{const s=initialState(),r=verifyOfflineTurn(s,{type:'record_local_turn',witnessId:id,question:'Gdzie byłeś po północy?',response:'Nie mam tutaj dostępu do rejestrów.'});f(r.ok,'Wpis offline odrzucony');const h=approvedHistory(r.state,id);f(h.at(-1)?.narrativeStatus==='offline_unverified','Wpis offline uznano za dowód');f(r.state.approvedEvidence.length===s.approvedEvidence.length,'Dopisano dowody offline');return 'Zeznanie niezweryfikowane';});
 add('zeznania','offline',`Idempotencja zapisu offline ${id}`,()=>{const a={type:'record_local_turn',witnessId:id,question:'O której godzinie?',response:'Nie potrafię powiedzieć bez dokumentacji.'},r=verifyOfflineTurn(initialState(),a),again=verifyOfflineTurn(r.state,a);f(again.ok&&approvedHistory(again.state,id).length===2,'Zduplikowano zapis');return 'Powtórzenie nie podwaja rozmowy';});
 add('zeznania','offline',`Odrzucenie wstrzykniętego HTML ${id}`,()=>{const r=verifyOfflineTurn(initialState(),{type:'record_local_turn',witnessId:id,question:'Pytanie',response:'<script>alert(1)</script>'});f(!r.ok,'Wstrzyknięcie przyjęte');return r.why;});
 add('zeznania','historia',`Historia autorytatywna ${id} ma limit`,()=>{let s=initialState();for(let i=0;i<60;i++)s=appendReportedTurn(s,id,'Pytanie '+i,'Odpowiedź '+i,[],'unresolved_statement');const h=approvedHistory(s,id);f(h.length===80,'Nie obcięto historii do 80');f(h[0].text==='Pytanie 20','Nieprawidłowa kolejność obcięcia');return '40 ostatnich wymian, starsze usunięte';});
}
// 08 — indictment / defense / verdict are server-owned, never from a UI claim.
for(const id of W)add('werdykt','oskarzenie',`Werdykt nie może zatwierdzić niezweryfikowanego sprawcy ${id}`,()=>{
 let s=verdictFixture({culprit:id});const r=decideVerdict(s,{type:'request_verdict'});f(r.ok&&r.state.verdict.serverApproved,'Brak serwerowego rozstrzygnięcia');if(id!=='MAGDALENA')f(r.state.verdict.kind!=='solid','Błędny sprawca uzyskał pełne potwierdzenie');return r.state.verdict.kind;});
for(const qual of ['intentional','planned','negligence','sabotage','complicity'])add('werdykt','kwalifikacja',`Rozstrzygnięcie kwalifikacji ${qual}`,()=>{
 let s=verdictFixture({qualification:qual});const r=decideVerdict(s,{type:'request_verdict'});f(r.ok&&r.state.verdict.qualification===qual,'Nieprawidłowy rodzaj wyniku');if(qual==='planned')f(r.state.verdict.kind==='returned','Przedwczesny zamiar potraktowany jako dowiedziony');return r.state.verdict.kind;});
add('werdykt','werdykt','Klient nie może wybrać własnego werdyktu',()=>{const r=decideVerdict(verdictFixture(),{type:'request_verdict',verdict:'solid'});f(!r.ok,'Przyjęto narzucony przez klienta werdykt');return r.why;});
add('werdykt','werdykt','Werdykt jest idempotentny',()=>{const s=verdictFixture(),r=decideVerdict(s,{type:'request_verdict'}),again=decideVerdict(r.state,{type:'request_verdict'});f(r.ok&&again.ok&&JSON.stringify(again.state.verdict)===JSON.stringify(r.state.verdict),'Wynik zmienił się przy ponowieniu');return r.state.verdict.kind;});
add('werdykt','oskarzenie','Brak oskarżenia nie daje werdyktu',()=>{const r=decideVerdict(initialState(),{type:'request_verdict'});f(!r.ok,'Werdykt bez oskarżenia');return r.why;});
add('werdykt','oskarzenie','Niezaakceptowany dokument w akcie jest odrzucany',()=>{const s=initialState(),r=fileIndictment(s,{type:'file_indictment',indictment:seedIndictment()});f(!r.ok,'Oskarżenie z niedostępnymi źródłami przyjęte');return r.why;});
const DEF={accident:{sources:['MED-04','MED-09','MED-10','LAB-08'],strategy:1},contract:{sources:['EVID_ACCEPTANCE_RECORD','TEC-09','EVID_SERIAL_PHOTO','EVID_MESSAGE_THREAD_RECOVERED'],strategy:2},message:{sources:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC'],strategy:1},card:{sources:['EVID_T17_DOOR_EVENT','EVID_RESOURCE_HANDOVER','VIS-08'],strategy:3},remote:{sources:['EVID_CONFERENCE_SESSION','DIG-09','ADM-04','EVID_CCTV_SYNC'],strategy:0},traces:{sources:['LAB-07','LAB-09','LAB-10','LAB-08','EVID_MESSAGE_THREAD_RECOVERED'],strategy:1}};
for(const [objection,config] of Object.entries(DEF)){
 add('obrona','obrona',`Prawidłowa odpowiedź na zarzut ${objection}`,()=>{const s=verdictFixture(),r=recordDefense(s,{type:'defend_objection',objection,sourceIds:config.sources,reason:'best',strategy:config.strategy});f(r.ok,'Odrzucono poprawną obronę: '+r.why);f(!!r.state.defense[objection],'Brak zapisu obrony');return 'Odpowiedź zatwierdzona';});
 add('obrona','obrona',`Odrzucenie niepopartej obrony ${objection}`,()=>{const s=verdictFixture(),r=recordDefense(s,{type:'defend_objection',objection,sourceIds:[],reason:'best',strategy:config.strategy});f(!r.ok,'Uznano obronę bez źródeł');return r.why;});
}
add('werdykt','werdykt','Pełna ścieżka obrona → werdykt przy niezależnych źródłach',()=>{let s=verdictFixture();for(const [objection,c] of Object.entries(DEF)){const r=recordDefense(s,{type:'defend_objection',objection,sourceIds:c.sources,reason:'best',strategy:c.strategy});f(r.ok,'Odrzucono obronę '+objection+': '+r.why);s=r.state;}const r=decideVerdict(s,{type:'request_verdict'});f(r.ok&&r.state.verdict.serverApproved,'Nie uzyskano serwerowego werdyktu');f(r.state.verdict.defensePassed===6,'Nie zaliczono sześciu obron');return 'Werdykt: '+r.state.verdict.kind;});
// 09 — forged actors and origin, no request network calls.
const malicious=['ps_coop=forged','ps_coop=','ps_coop=1.2.3.4.5','ps_coop='+('x'.repeat(64)),'ps_coop=a.b.c.d.e.f',''];
for(let i=0;i<30;i++)add('kooperacja','bezpieczenstwo',`Fałszywy token współpracy #${i+1}`,()=>{const token=malicious[i%malicious.length],req={headers:{cookie:token,host:'game.test',origin:i%2?'https://wrong.test':'https://game.test'}};f(coopIdentity(req)===null,'Nieautoryzowany token przyjęty');if(i%2)f(!checkOrigin(req),'Złośliwe pochodzenie zaakceptowane');return 'Odrzucono fałszywą tożsamość';});
for(const type of ['add_evidence','force_unlock','set_culprit','set_verdict','set_progress','end_case','give_admin','overwrite_save'])add('bezpieczenstwo','silnik',`Nieuprawniona akcja klienta ${type}`,()=>{const r=validateAction(initialState(),{type});f(!r.ok,'Nieznana akcja została zatwierdzona');return r.why;});
export const gameAuditInfo=Object.freeze({version:'RC57.3-whole-game-core',total:cases.length,groups:[...new Set(cases.map(x=>x.group))],
 coverage:['start i eksploracja','kanon i katalog dokumentów','przyznawanie dowodów i blokady','oględziny','5 zagadek etapowych','20 wydarzeń osi czasu','6 świadków offline i historie','akt oskarżenia, 6 zarzutów obrony i werdykt','odrzucanie fałszywych tokenów i akcji'],
 notCovered:['prawdziwe pokoje Supabase i zerwanie połączenia w dwóch urządzeniach','pełny klikalny przebieg interfejsu na urządzeniach','jakość odpowiedzi rzeczywistych modeli AI — osobny tryb RC57.2','zapis i odczyt plików w przeglądarce — osobne testy Playwright','realne działanie bazy produkcyjnej']});
export function runGameBatch({offset,limit=20}){if(!Number.isInteger(offset)||offset<0||offset>=cases.length||!Number.isInteger(limit)||limit<1||limit>20)throw Error('invalid_game_test_range');
 const results=[];for(let i=offset;i<Math.min(offset+limit,cases.length);i++){
 const t=cases[i];let status='pass',detail='';try{detail=String(t.run());}catch(e){status='fail';detail=String(e?.message||e).slice(0,220)}
 results.push({id:'G-'+String(i+1).padStart(3,'0'),witness:t.area,group:t.group,description:t.description,status,detail});}
 return {release:gameAuditInfo.version,offset,total:cases.length,count:results.length,results};}

// Reuse the same exact approved puzzle and finale inputs in the RC57.4 serial
// journey. The simulator must never grant documents with a fixture.
export {payload as auditPuzzlePayload,timelineAction as auditTimelineAction,seedIndictment as auditSeedIndictment,DEF as auditDefenseConfig};
