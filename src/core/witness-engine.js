/* Etap 3 — centralny silnik przesłuchań.
   Kompozycja nazwanych warstw jest jawna i jednokierunkowa; żadna warstwa nie nadpisuje API.
   Profile NPC9 są jedynym źródłem wiedzy, proceduralne bramki pozostają w silniku sprawy. */
const WitnessEngine = (() => {
 'use strict';
 const profiles = new Map(CONTENT.characters.map(c=>[c.id,c]));
 const layers = {answer:[],export:[],restore:[],send:[]};
 const ids = new Set();
 let answer = npc4Answer, exportMemory = npc4Export, restoreMemory = npc4Restore, send = simSendChat;
 let wired = false;
 const claim = (kind,name,fn) => {
  if(typeof fn!=='function'||typeof name!=='string'||!name.trim()||ids.has(kind+':'+name))throw Error('Duplicate or invalid witness layer '+kind+':'+name);
  ids.add(kind+':'+name);layers[kind].push(name);
 };
 const registerAnswer = (name,fn) => {claim('answer',name,fn);answer=fn;};
 const registerExport = (name,fn) => {claim('export',name,fn);exportMemory=fn;};
 const registerRestore = (name,fn) => {claim('restore',name,fn);restoreMemory=fn;};
 const registerSend = (name,fn) => {claim('send',name,fn);send=fn;};
 const snapshotAnswer=()=>answer, snapshotExport=()=>exportMemory, snapshotRestore=()=>restoreMemory, snapshotSend=()=>send;
 const valid=(id)=>profiles.has(id);
 function respond(c,question,attached){
  if(!c||!valid(c.id))throw new Error('Nieznany świadek');
  return answer(c,question,attached);
 }
 function memory(){return exportMemory();}
 function restore(raw){return restoreMemory(raw);}
 function submit(){return send.apply(this,arguments);}
 function inspectWitness(id){
  if(!valid(id))return null;
  const p=NPC9_PROFILES[id],s=NPC4_STATE[id],m=NPC9_MEMORY[id],w=simWitness(profiles.get(id));
  return {id,knowledge:(p?.knowledge||[]).map(x=>({event:x.event,confidence:x.confidence,source:x.source})),
   emotional:{rapport:s.rapport,tension:s.tension,fatigue:s.fatigue,stance:s.stance},
   memory:{turn:m.turn,semantic:m.semantic?.length||0,statements:m.statements?.length||0,confronted:m.confronted?.length||0},
   psychological:{...(typeof ps52Witness==='function'?ps52Witness(profiles.get(id)):{}),blocked:w.blocked},
   breakthrough:window.PS_BREAKTHROUGH?.state(id)||null};
 }
 function installUI(){
  if(wired)return;
  const current=document.getElementById('chatSend');if(!current)return;
  // Core and legacy code attached handlers to earlier nodes. Replace once and attach the stable dispatcher.
  const button=current.cloneNode(true);current.replaceWith(button);
  button.addEventListener('click',submit);
  wired=true;
 }
 function inspect(){return {layers:Object.fromEntries(Object.entries(layers).map(([k,v])=>[k,v.slice()])),witnesses:[...profiles.keys()],uiWired:wired,cloud:window.PS77_AI?.mode||'offline'};}
 return Object.freeze({respond,memory,restore,submit,valid,inspect,inspectWitness,installUI,
  snapshotAnswer,snapshotExport,snapshotRestore,snapshotSend,registerAnswer,registerExport,registerRestore,registerSend});
})();
function registerWitnessAnswerLayer(name,fn){WitnessEngine.registerAnswer(name,fn);}
function registerWitnessExportLayer(name,fn){WitnessEngine.registerExport(name,fn);}
function registerWitnessRestoreLayer(name,fn){WitnessEngine.registerRestore(name,fn);}
function registerWitnessSendLayer(name,fn){WitnessEngine.registerSend(name,fn);}
// Public interfaces remain identity-stable after bootstrap; the registry owns all subsequent layers.
npc4Answer=function witnessAnswer(c,q,doc){return WitnessEngine.respond(c,q,doc);};
npc4Export=function witnessExport(){return WitnessEngine.memory();};
npc4Restore=function witnessRestore(raw){return WitnessEngine.restore(raw);};
simSendChat=function witnessSend(){return WitnessEngine.submit.apply(this,arguments);};
sendChat=simSendChat;
window.PS_WITNESS_ENGINE=WitnessEngine;
