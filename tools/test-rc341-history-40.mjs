import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialState,appendReportedTurn,approvedHistory} from '../lib/server-state.js';
import {buildDialogueMemory} from '../lib/dialogue-memory-636.js';
import {buildConversationState} from '../lib/conversation-state-rc21.js';
import {parseRestore,applyRestore} from '../api/interview-restore.js';

const witnessIds=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
let state=initialState();
for(const id of witnessIds){
 for(let i=1;i<=40;i++){
  const q=`Pytanie numer ${i} do ${id}: co wiesz o tej sprawie?`;
  const a=`Zeznanie numer ${i} świadka ${id}: nie potrafię potwierdzić szczegółu.`;
  state=appendReportedTurn(state,id,q,a,[],'unresolved_statement');
 }
 assert.equal(approvedHistory(state,id).length,80);
 assert.match(approvedHistory(state,id)[0].text,/numer 1 do/);
 assert.match(approvedHistory(state,id).at(-1).text,/numer 40 świadka/);
 assert.equal(buildDialogueMemory(approvedHistory(state,id),'Co wiesz o pytaniu numer 1?').totalPairs,40);
 assert.equal(buildConversationState(id,approvedHistory(state,id)).recentState.length,4);
}
assert.deepEqual(state.approvedEvidence,initialState().approvedEvidence);
assert.equal(state.verdict,null);
const q41='Pytanie numer 41 do MAREK?'; const a41='Odpowiedź numer 41 do MAREK';
state=appendReportedTurn(state,'MAREK',q41,a41,[],'unresolved_statement');
assert.equal(approvedHistory(state,'MAREK').length,80);
assert.match(approvedHistory(state,'MAREK')[0].text,/numer 2 do/);
assert.equal(buildDialogueMemory(approvedHistory(state,'MAREK')).totalPairs,40);
assert.equal(approvedHistory(state,'JANUSZ').length,80);

// RC34 restore endpoint retains batches of at most eight; forty pairs are five batches.
let imported=initialState();
for(let offset=0;offset<40;offset+=8){
 const turns=Array.from({length:8},(_,i)=>{
  const n=offset+i+1;
  return {question:`Pytanie archiwalne nr ${n}: co zauważyłeś?`,text:`Niezweryfikowana wypowiedź nr ${n}: nie wiem.`};
 });
 const parsed=parseRestore({witnessId:'JANUSZ',turns});
 assert(parsed && parsed.length===8);
 const result=applyRestore(imported,parsed);
 assert.equal(result.restored,8);
 imported=result.state;
 const replay=applyRestore(imported,parsed);
 assert.equal(replay.restored,0);
 assert.equal(replay.skipped,8);
}
assert.equal(approvedHistory(imported,'JANUSZ').length,80);
assert.match(approvedHistory(imported,'JANUSZ')[0].text,/nr 1:/);
assert.match(approvedHistory(imported,'JANUSZ').at(-1).text,/nr 40:/);
assert.equal(imported.approvedEvidence.length,initialState().approvedEvidence.length);
assert.equal(imported.verdict,null);
assert.equal(buildDialogueMemory(approvedHistory(imported,'JANUSZ')).totalPairs,40);
assert.equal(buildDialogueMemory(approvedHistory(imported,'JANUSZ')).previousPairs.at(-1).answer,'[Odpowiedź lokalna niezweryfikowana]');
const client=fs.readFileSync(new URL('../src/integrations/75-verified-state-sync.js',import.meta.url),'utf8');
assert(client.includes('pairs.slice(-40)'));
assert(client.includes('for(let i=0;i<turns.length;i+=8)'));
console.log('PASS RC34.1: 40 pairs × 6 witnesses; 41st evicts oldest; five 8-pair import batches; idempotency; no evidence/decision grants; short prompt memory');
