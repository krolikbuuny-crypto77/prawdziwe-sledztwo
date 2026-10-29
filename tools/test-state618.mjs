import assert from 'node:assert/strict';
import {initialState,validateAction,rules} from '../lib/server-state.js';
import canon from '../lib/server-canon-618.json' with {type:'json'};
let checks=0;
function ok(state,action){const r=validateAction(state,action);assert.equal(r.ok,true,`${action.type} ${action.puzzle||action.eventId||action.objection||''}: ${r.why}`);checks++;return r.state;}
function no(state,action){const r=validateAction(state,action);assert.equal(r.ok,false,`accepted forbidden action ${JSON.stringify(action)}`);checks++;return r.why;}
const step=(puzzle,stage,form={},sequence=[])=>({type:'verify_puzzle_stage',puzzle,stage,form,sequence});
const a=canon.puzzles;
const cases={
 tcms:[step('tcms',0,{},a.tcms.sequence),step('tcms',1,{'Pakiet pierwotny':a.tcms.packet,'Retransmisja':a.tcms.retry,'Ocena duplikatu':'repeat'}),step('tcms',2,{'Związek rejestrów':'separate','Granica wniosku':'limited','Uzasadnienie':'best'})],
 msg:[step('msg',0,{},a.msg.sequence),step('msg',1,{'Co potwierdzają wskaźniki prev/next?':'chain','Co daje kontrola integralności?':'unchanged'}),step('msg',2,{'Identyfikator konta':'account','Dane urządzenia':'device','Uzasadnienie':'best'})],
 cctv:[step('cctv',0,{'Kamera A: przesunięcie [s]':'160','Kamera B: przesunięcie [s]':'-80','Kamera C: przesunięcie [s]':'50'}),step('cctv',1,{},a.cctv.sequence),step('cctv',2,{'Znaczenie synchronizacji':'order','Nieostry obraz':'limited','Uzasadnienie':'best'})],
 forensic:[step('forensic',0,Object.fromEntries(a.forensic.classes.map((v,i)=>['Ocena pary '+(i+1),v]))),step('forensic',1,{'Znaczenie kontroli':'transfer','Wniosek przy podobnych wektorach':'class'}),step('forensic',2,{'Ocena profilu urazów':'multiple','Granica identyfikacji':'limits','Uzasadnienie':'best'})],
 access:[step('access',0,{'Źródło obrazu':'EVID_CCTV_SYNC','Źródło użycia karty':'EVID_T17_DOOR_EVENT','Weryfikacja źródeł':'independent'}),step('access',1,{'Odcinek 1 [s]':'80','Odcinek 2 [s]':'135','Odcinek 3 [s]':'135','Odcinek 4 [s]':'80'},a.access.sequence),step('access',2,{'Wniosek z trasy':'possible','Wideokonferencja bez kamery':'session','Uzasadnienie':'best'})]
};
let state=initialState();
for(const [k,stages] of Object.entries(cases)){
 const prerequisites=[...new Set(a[k].inputs)];state={...state,approvedEvidence:[...new Set([...state.approvedEvidence,...prerequisites])]} ;
 no(state,step(k,1,stages[1].form,stages[1].sequence));
 no(state,{...stages[0],sequence:['FAKE'],form:Object.keys(stages[0].form).length?{...stages[0].form,[Object.keys(stages[0].form)[0]]:'FAKE'}:stages[0].form});
 state=ok(state,stages[0]);
 state=ok(state,stages[1]);
 state=ok(state,stages[2]);
 assert.equal(state.puzzles[k],3);
 for(const output of a[k].outputs)assert(state.approvedEvidence.includes(output),`Missing server-authorized output ${output}`);
}
no(initialState(),{type:'request_verdict',kind:'solid'});
no(initialState(),{type:'verify_timeline',eventId:'e16',entry:{at:'2026-11-18T01:44',to:'',place:'bay3',sourceIds:['MED-03'],reason:'Na podstawie opinii medycznej.'}});
state={...state,approvedEvidence:[...new Set([...state.approvedEvidence,...Object.keys(rules.documents)])]};
for(const id of ['e16','e17']){
 const event=canon.timeline.find(x=>x.id===id);
 no(state,{type:'verify_timeline',eventId:id,entry:{at:event.at,to:event.to,place:event.place,sourceIds:['FAKE'],reason:'Dane o czasie pochodzą z udokumentowanego źródła.'}});
 state=ok(state,{type:'verify_timeline',eventId:id,entry:{at:event.at,to:event.to,place:event.place,sourceIds:[event.sources[0]],reason:'Zapis potwierdza chronologię, nie wskazuje konkretnego sprawcy.'}});
}
const links=[];
const roleGroups={person:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC'],method:['MED-09','LAB-08'],motive:['EVID_ACCEPTANCE_RECORD','EVID_SERIAL_PHOTO'],alibi:['EVID_CONFERENCE_SESSION','DIG-09','ADM-04']};
for(const [role,ids] of Object.entries(roleGroups))for(const id of ids)links.push({role,id});
const indictment={culprit:'MAGDALENA',method:'two_stage',qualification:'intentional',keystone:'EVID_MESSAGE_THREAD_RECOVERED',alibi:'remote_not_presence',links,reasons:{person:'best',method:'best',proof:'best',alibi:'best'}};
no(initialState(),{type:'file_indictment',indictment});
const incomplete={...state,verifiedTimeline:{},approvedEvidence:[...new Set([...state.approvedEvidence]) ]};
const weakFiled=ok(incomplete,{type:'file_indictment',indictment});
const weakVerdict=ok(weakFiled,{type:'request_verdict'});
assert.notEqual(weakVerdict.verdict.kind,'solid','incomplete argument may finish, but may not be approved as strong');
no(state,{type:'replace_state',state:{verdict:{kind:'solid'}}});
no(state,{type:'file_indictment',indictment:{...indictment,links:[...links,{role:'person',id:'MAGIC'}]}});
state=ok(state,{type:'file_indictment',indictment});
assert.equal(state.verdict,null);no(state,{type:'request_verdict',verdict:'solid'});
for(const [id,route] of Object.entries({
 accident:{route:0,answer:0},contract:{route:0,answer:0},message:{route:0,answer:1},card:{route:0,answer:1},remote:{route:0,answer:2},traces:{route:0,answer:1}
})){
 no(state,{type:'defend_objection',objection:id,mode:'ps54',route:route.route,answer:99,method:'compare'});
 state=ok(state,{type:'defend_objection',objection:id,mode:'ps54',route:route.route,answer:route.answer,method:'compare'});
}
state=ok(state,{type:'request_verdict'});assert.equal(state.verdict.kind,'solid');assert.equal(state.verdict.serverApproved,true);
assert.notEqual(state.verdict.kind,initialState().verdict);
console.log(`PASS 6.18: ${checks} tests; 15 canonical puzzle stages, 5 module awards, timeline anchors, forged-progress rejection, six objections, independent server verdict`);
