/* RC57.4: isolated sequential playthrough of authoritative game actions.
 * Every scenario begins at initialState. Evidence is earned through public
 * validation actions, never seeded with withDocs or granted directly.
 * No Supabase, AI, filesystem, real browser or side effects.
 */
import rules from './approved-rules.js';
import canon from './server-canon-618.json' with {type:'json'};
import {initialState,validateAction,verifyOfflineTurn,approvedHistory} from './server-state.js';
import {verifyPuzzle,verifyTimeline,fileIndictment,recordDefense,decideVerdict} from './progression-618.js';
import {auditPuzzlePayload,auditTimelineAction,auditSeedIndictment,auditDefenseConfig} from './admin-rc57-whole-game.js';

const AREAS=['med','tech','digital','cctv','admin','lab','bay','workshop','dispatch','audit','office','passage'];
const WITNESSES=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const PUZZLES=['tcms','msg','cctv','forensic','access'];
const MODES={canonical:'Pełna ścieżka prawidłowa',wrong_suspect:'Błędne oskarżenie',resume:'Wznowienie po przerwaniu'};
export const playthroughInfo=Object.freeze({version:'RC57.4-serial-playthrough',scenarios:Object.entries(MODES).map(([id,label])=>({id,label})),
 covered:['start od początkowych dokumentów','12 odwiedzonych obszarów','wyszukiwanie i 29 oględzin z warunkami','5 zagadek w kolejności etapów','20 wpisów chronologii z zatwierdzonych źródeł','6 zeznań offline z ograniczoną pamięcią','oskarżenie, sześć obron, serwerowy werdykt','ścieżka błędnego oskarżenia','symulowane przerwanie i wznowienie stanu'],
 notCovered:['realne klikanie interfejsu gry (wymaga runnera Playwright)','sieć, Supabase, przejęcie sterowania w dwóch prawdziwych przeglądarkach','prawdziwe przesłuchania modeli AI (osobny RC57.2)','autentyczny podpisany plik zapisu SaveManager','automatyczna eksploracja wszystkich alternatywnych decyzji fabularnych']});

export function runPlaythroughScenario(scenario){
 if(!Object.hasOwn(MODES,scenario))throw Object.assign(Error('invalid_playthrough_scenario'),{code:'invalid_playthrough_scenario'});
 let state=initialState(),phase='start';const steps=[];const start=Date.now();
 const saveState=()=>JSON.stringify(state);
 function record(label,ok,detail=''){
  steps.push({id:'P-'+String(steps.length+1).padStart(3,'0'),phase,label,status:ok?'pass':'fail',detail:String(detail||'').slice(0,240),evidenceCount:state.approvedEvidence.length,
   verifiedTimeline:Object.keys(state.verifiedTimeline).length});
  if(!ok)throw Object.assign(Error(label+': '+detail),{code:'playthrough_stopped'});
 }
 function act(label,action,expect='allow',validate=validateAction){
  const before=saveState();let response;try{response=validate(state,action)}catch(e){record(label,false,'Wyjątek w silniku: '+e.message)}
  const expected=expect==='allow',ok=expected?response?.ok===true:response?.ok===false;
  if(!expected && ok){const after=JSON.stringify(response.state??state);if(after!==before)record(label,false,'Odrzucona akcja zmieniła stan');}
  if(ok&&expected)state=response.state;
  record(label,ok,expected?response?.why||'Przyjęto':'Odmowa: '+response?.why);
  return response;
 }
 let final=null;
 try{
  record('Nowe śledztwo z 13 dokumentami',state.approvedEvidence.length===rules.initial.length&&!state.indictment&&!state.verdict, 'Dokumenty: '+state.approvedEvidence.length);
  // A real user must not be able to skip the investigation and ask for a verdict.
  act('Werdykt przed rozpoczęciem zablokowany',{type:'request_verdict'},'reject');
  act('Przedwczesne pozyskanie dokumentu z blokadą odrzucone',{type:'collect_evidence',docId:'EVID_SERVICE_FORM_GAPS',origin:'scene-inspection',spotId:'wrk_gaps',room:'workshop',method:rules.challenges.wrk_gaps.method,answer:rules.challenges.wrk_gaps.correct},'reject');
  phase='exploration';for(const area of AREAS)act('Odwiedziny: '+area,{type:'visit_area',area});
  record('Dostęp do wszystkich 12 obszarów',state.visitedAreas.length===AREAS.length,String(state.visitedAreas.length));
  phase='evidence';
  const tasks=[...Object.entries(rules.spots).map(([id,spot])=>({id,doc:spot.doc,kind:'inspection',spot})),
   ...rules.searchable.map(doc=>({id:doc,doc,kind:'search'}))];
  let pending=tasks;
  for(let pass=0;pass<6&&pending.length;pass++){
   let advanced=0;const rest=[];
   for(const task of pending){
    if(state.approvedEvidence.includes(task.doc))continue;
    if((rules.gates[task.doc]||[]).some(dep=>!state.approvedEvidence.includes(dep))){rest.push(task);continue;}
    const a=task.kind==='inspection'?{type:'collect_evidence',docId:task.doc,origin:'scene-inspection',spotId:task.id,room:task.spot.room,method:rules.challenges[task.id].method,answer:rules.challenges[task.id].correct}:{type:'collect_evidence',docId:task.doc,origin:'area-search',area:rules.documents[task.doc].area};
    act((task.kind==='inspection'?'Oględziny: ':'Wyszukiwanie: ')+task.doc,a);advanced++;
   }
   pending=rest;if(pending.length&&!advanced)break;
  }
  record('Wszystkie dostępne dokumenty pozyskane bez obejścia blokad',pending.length===0,pending.length?'Niezdobyte: '+pending.map(x=>x.doc).join(', '):'Zrealizowano '+tasks.length+' działań pozyskiwania');
  if(scenario==='resume'){
   phase='save_resume';
   const snapshot=saveState();const restored=JSON.parse(snapshot);
   record('Stan śledztwa można odtworzyć z migawki bez zmiany dokumentów',JSON.stringify(restored)===snapshot&&restored.approvedEvidence.length===state.approvedEvidence.length,'Test JSON roundtrip; nie zastępuje podpisanego pliku SaveManager');
   state=restored;
  }
  phase='puzzles';
  for(const puzzle of PUZZLES){
   const missing=canon.puzzles[puzzle].inputs.filter(x=>!state.approvedEvidence.includes(x));
   record('Wymagania analizy '+puzzle+' dostępne',missing.length===0,missing.join(', ')||'Wszystkie źródła obecne');
   act('Przeskoczenie do etapu 3: '+puzzle,{...auditPuzzlePayload(puzzle,2)},'reject',verifyPuzzle);
   for(let stage=0;stage<3;stage++)act('Analiza '+puzzle+' — etap '+(stage+1),auditPuzzlePayload(puzzle,stage),'allow',verifyPuzzle);
   record('Wyniki analizy '+puzzle+' uzyskane',canon.puzzles[puzzle].outputs.every(x=>state.approvedEvidence.includes(x)),canon.puzzles[puzzle].outputs.join(', '));
  }
  record('Wszystkie 78 dokumentów zatwierdzone rzeczywistą drogą',Object.keys(rules.documents).every(x=>state.approvedEvidence.includes(x)),`Zebrano ${state.approvedEvidence.length}/${Object.keys(rules.documents).length}`);
  phase='timeline';for(const event of canon.timeline)act('Oś czasu: '+event.id,auditTimelineAction(event),'allow',verifyTimeline);
  record('Potwierdzono 20 wydarzeń',Object.keys(state.verifiedTimeline).length===canon.timeline.length,String(Object.keys(state.verifiedTimeline).length));
  phase='interviews';
  for(const id of WITNESSES){
   const count=id==='MAREK'?42:3;
   for(let n=1;n<=count;n++)act('Zeznanie offline '+id+' #'+n,{type:'record_local_turn',witnessId:id,question:`Pytanie kontrolne ${n}: jaki dokument trzeba sprawdzić?`,response:`Nie potwierdzam faktu bez sprawdzenia wskazanego dokumentu; wypowiedź testowa ${n}.`},'allow',verifyOfflineTurn);
   const hist=approvedHistory(state,id);
   record('Historia '+id+' oznaczona jako niezweryfikowana',hist.length===Math.min(80,count*2)&&hist.every(x=>x.role!=='witness'||x.narrativeStatus==='offline_unverified'),`Zapisano ${hist.length} pozycji z ograniczeniem 80`);
  }
  phase='indictment';
  act('Akt oskarżenia ze zgromadzonych źródeł',{type:'file_indictment',indictment:auditSeedIndictment({culprit:scenario==='wrong_suspect'?'MAREK':'MAGDALENA'})},'allow',fileIndictment);
  phase='defense';for(const [objection,c] of Object.entries(auditDefenseConfig))act('Obrona: '+objection,{type:'defend_objection',objection,sourceIds:c.sources,reason:'best',strategy:c.strategy},'allow',recordDefense);
  phase='verdict';act('Serwer rozstrzyga werdykt',{type:'request_verdict'},'allow',decideVerdict);
  final=state.verdict;
  const target=scenario==='wrong_suspect'?'returned':'solid';
  record('Werdykt zgodny z przebiegiem i źródłami',final?.serverApproved===true&&final.kind===target,`Oczekiwano ${target}, otrzymano ${final?.kind}; obrony ${final?.defensePassed}/${final?.defenseTotal}`);
  act('Nie można narzucić werdyktu z klienta',{type:'request_verdict',verdict:'solid'},'reject',decideVerdict);
  const before=saveState();act('Ponowne wywołanie werdyktu idempotentne',{type:'request_verdict'},'allow',decideVerdict);
  record('Wynik po ponowieniu jest identyczny',before===saveState(),'Brak zmiany zakończenia');
 }catch(error){if(error?.code!=='playthrough_stopped')record('Błąd nieobsłużony',false,String(error?.message||error));}
 const passed=steps.filter(x=>x.status==='pass').length,failed=steps.length-passed;
 return {version:playthroughInfo.version,scenario,scenarioLabel:MODES[scenario],startedWith:rules.initial.length,steps,summary:{passed,failed,steps:steps.length,completed:failed===0&&!!final,verdict:final?.kind||null,documents:state.approvedEvidence.length,verifiedTimeline:Object.keys(state.verifiedTimeline||{}).length,puzzles:Object.values(state.puzzles||{}).filter(x=>x===3).length,witnesses:WITNESSES.length,elapsedMs:Date.now()-start},limitations:playthroughInfo.notCovered};
}
