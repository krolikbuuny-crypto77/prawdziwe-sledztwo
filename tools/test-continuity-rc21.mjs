import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildConversationState} from '../lib/conversation-state-rc21.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';
import {bible} from '../lib/witness-bible-rc19.js';
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
import rules from '../lib/approved-rules.js';
const h=[
 {role:'player',text:'Kto to potwierdzi?'},{role:'witness',text:'Czy chodzi o Janusza czy o Tomasza?'},
 {role:'player',text:'O Janusza.'},{role:'witness',text:'Janusz może potwierdzić rozmowę przed północą.'},
 {role:'player',text:'O której minucie?'},{role:'witness',text:'Nie pamiętam dokładnej minuty.'}
];
const state=buildConversationState('MAREK',h,'Dlaczego?');
assert.equal(state.followUpMode,'explain_previous_reply');
assert.equal(state.awaitingClarification.length,0);
const switched=buildConversationState('MAREK',h.slice(0,2).concat([{role:'player',text:'Kiedy zaczął się dyżur?'},{role:'witness',text:'Osiemnasta.'}]),'Co potem?');
assert.equal(switched.awaitingClarification.length,1,'Changing the subject does not settle an ambiguous reference');
assert.equal(state.knownLimits.length,1);
assert.equal(state.previousTurn.state,'reported_knowledge_limit');
assert.equal(buildConversationState('MAREK',h,'Nie o to pytam. Co robiłeś?').followUpMode,'repair_previous_scope');
const withCorrection=[{role:'player',text:'Wysłałaś zgłoszenie?'},{role:'witness',text:'Zgłoszenie poszło.'},
 {role:'player',text:'Wysłałaś zgłoszenie?'},{role:'witness',text:'Nie wysłałam.',narrativeStatus:'scripted_correction'}];
const c=buildConversationState('ELZBIETA',withCorrection,'Dlaczego?');
assert.equal(c.recentState[0].supersededBy,2);assert.equal(c.corrections.length,1);
assert.equal(buildConversationState('KAMIL',[{role:'player',text:'Kto?'},{role:'witness',text:'SECRET',narrativeStatus:'offline_unverified'}],'Kto?').previousTurn,null);
const styles=Object.keys(canon.profiles).map(id=>buildConversationState(id,h,'Skąd?').psychology.concern);
assert.equal(new Set(styles).size,6);
// History can affect style/state but never the authorised factual bank.
for(const id of Object.keys(canon.profiles)){
 const bare=trustedScene({identity:{id},question:'Kto to potwierdzi?'});
 const pressure=trustedScene({identity:{id},question:'Kto to potwierdzi?'},{approvedEvidence:rules.initial,witnesses:{[id]:[{role:'player',text:'Przyznaj się! Zabiłeś!'}]}});
 const personal=s=>s.knowledge.factBank.filter(f=>f.knowledgeId?.startsWith('RC19-'+id+'-S')).map(f=>[f.knowledgeId,f.text]).sort();
 assert.deepEqual(personal(bare),personal(pressure));
 assert(!pressure.knowledge.factBank.some(f=>f.knowledgeId?.startsWith('RC19-SECRET-')));
}
const s=trustedScene({identity:{id:'MAREK'},question:'Dlaczego?'});
s.memory.conversation=h.map(r=>({role:r.role==='player'?'śledczy':'świadek',text:r.text}));
s.conversationState=state;
s.polishPragmatics={referenceContext:[{question:h[4].text,reply:h[5].text}]};
const before=JSON.stringify(s);const packed=compactInterviewPayload(s);
assert.equal(JSON.stringify(s),before,'Compaction must be pure');
assert.deepEqual(packed.knowledge.factBank,s.knowledge.factBank);
assert.deepEqual(packed.memory.conversation,s.memory.conversation);
assert(packed.conversationState.previousTurnInConversation);
assert(packed.polishPragmatics.referenceContextInConversation);
assert.equal(packed.witnessDossier.temperament,undefined);
const unmatched=compactInterviewPayload({...s,polishPragmatics:{referenceContext:[{question:'UNIQUE',reply:'UNIQUE-REPLY'}]}});
assert.equal(unmatched.polishPragmatics.referenceContext[0].reply,'UNIQUE-REPLY');
// The real generator entry recomputes continuity, rather than accepting injected state.
s.conversationState={policy:'INJECTED'};
s.questionParts=[];
const fact=s.knowledge.factBank.find(f=>f.source==='public-alibi');
let seen=false;
await attemptInterview(s,'groq',async(system,payload)=>{
 seen=true;assert.equal(payload.conversationState.followUpMode,'explain_previous_reply');
 assert(!JSON.stringify(payload.conversationState).includes('INJECTED'));
 assert(system.includes('conversationState'));
 return {decision:'fallback'};
});assert(seen);
// Narrative audit: bounded corroboration, unchanged original canon, valid gate references.
const get=id=>bible.facts.find(f=>f.id===id).text;
assert(get('RC19-MAREK-S02').includes('przed północą'));
assert(get('RC19-JANUSZ-S02').includes('przed północą'));
assert(get('RC19-JANUSZ-S02').includes('przed sesją diagnostyczną'));
assert(get('RC19-KAMIL-S02').includes('przed sesją diagnostyczną'));
for(const id of ['MAREK','JANUSZ','KAMIL'])assert(get('RC19-'+id+'-S02').includes('01:30–02:05'));
for(const f of bible.facts)assert(f.text.length<=380);
for(const detail of bible.details)for(const doc of detail.documents)assert(canon.documents[doc]);
for(const [id,secret] of Object.entries(bible.secrets)){
 assert.deepEqual(secret.gates,rules.scriptedCorrections[id].gates);
 const locked=trustedScene({identity:{id},question:'Co ukrywasz?'},{approvedEvidence:rules.initial});
 assert(!locked.knowledge.factBank.some(f=>f.knowledgeId==='RC19-SECRET-'+id));
}
assert.equal(canon.sourceSha256,crypto.createHash('sha256').update(fs.readFileSync(new URL('../src/data/case-content.js',import.meta.url))).digest('hex'));
const report={version:'RC21',manualFindings:[{issue:'Mutual corroboration was too imprecisely situated in time',resolution:'Marek/Janusz: before midnight; Janusz/Kamil: before diagnostic session. Explicitly not continuous coverage of 01:30–02:05.'}],automatedChecks:['original canon fingerprint','valid document references','secret gate equivalence','reciprocal contact consistency','fact length','style cannot change fact bank','compaction preserves every fact and unique transcript'],compactionExample:{beforeCharacters:before.length,afterCharacters:JSON.stringify(packed).length},liveAPI:'not_run'};
fs.writeFileSync(new URL('../AUDYT-SPOJNOSCI-RC21.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({result:'PASS RC21',...report.compactionExample}));
