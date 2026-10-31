import assert from 'node:assert/strict';
import fs from 'node:fs';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {bible,coverageForQuestion,selectBibleKnowledge,matchQuestionKnowledge} from '../lib/witness-bible-rc19.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {attemptInterview} from '../api/interview.js';
import bank from '../lib/interview-question-bank-rc17.json' with {type:'json'};
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
import rules from '../lib/approved-rules.js';
assert.equal(bible.facts.length,102);assert.equal(bible.details.length,44);
for(const f of [...bible.facts,...bible.details])assert(f.text.length<=380,f.id+' truncation');
const ids=Object.keys(canon.profiles),coverage=[];
let pairCount=0,paraphraseCount=0;
for(const row of bank.cases){
 assert.equal(matchQuestionKnowledge(row.question).row?.id,row.id);
 for(const id of ids){
  const plan=coverageForQuestion(row,id);coverage.push(plan);
  assert(plan.personalKnowledgeIds.length>0,row.id+id);
  const scene=trustedScene({identity:{id},question:row.question,knowledge:{documentsShown:['EVID_CCTV_SYNC']}});
  assert.equal(scene.knowledge.factBank.filter(f=>f.knowledgeId?.startsWith('RC19-'+id+'-S')).length,17);
  for(const ref of plan.personalKnowledgeIds)assert(scene.knowledge.factBank.some(f=>f.knowledgeId===ref),row.id+id+' missing '+ref);
  for(const f of scene.knowledge.factBank){
   if(f.knowledgeId?.startsWith('RC19-SECRET-'))assert.fail('Secret in locked scene');
  }
  assert(scene.knowledge.factBank.length<=64);
  assert(!scene.knowledge.factBank.some(f=>f.source.startsWith('document-')||f.source==='trusted-correction'));
  assert.deepEqual(compactInterviewPayload(scene).knowledge.factBank,scene.knowledge.factBank);
  const allowedState={approvedEvidence:Object.keys(canon.documents)};
  const open=trustedScene({identity:{id},question:row.question},allowedState);
  for(const ref of plan.specificKnowledgeIds)assert(open.knowledge.factBank.some(f=>f.knowledgeId===ref),row.id+id+' missing detail '+ref);
  pairCount++;
 }
 // Mechanical paraphrase perturbation checks retrieval stability, not semantic language quality.
 const paraphrase='Proszę odpowiedzieć własnymi słowami: '+row.question.replace(/[?!.,]/g,'').toLocaleLowerCase('pl');
 const matched=matchQuestionKnowledge(paraphrase);
 assert(matched.row,row.id+' paraphrase unresolved');
 const expectedDetails=bible.details.filter(d=>d.questions.includes(row.id)).map(d=>d.id);
 const received=bible.details.filter(d=>d.questions.includes(matched.row.id)).map(d=>d.id);
 // Same section is sufficient for generic wording; detail-specific queries must retain a detail.
 if(expectedDetails.length)assert(received.some(ref=>expectedDetails.includes(ref))||matched.row.id===row.id,row.id+' paraphrase detail changed to '+matched.row.id);
 paraphraseCount++;
}
// Individually chosen semantic paraphrases: must bring the specified concrete knowledge.
const cases=[
 ['MAREK','Jaki człowiek widział cię w pracy tej nocy?','RC19-MAREK-S02'],
 ['JANUSZ','Kto może zaświadczyć o twojej obecności na nocnym dyżurze?','RC19-JANUSZ-S02'],
 ['KAMIL','Czy awaria czwartej kamery ukryła zdarzenie?','RC19-D-cameras'],
 ['TOMASZ','Dlaczego znaleziono Lenę dopiero po wpół do trzeciej?','RC19-TOMASZ-S08'],
 ['ELZBIETA','Z kim i kiedy rozmawiałaś o bezpieczeństwie tramwaju?','RC19-ELZBIETA-S05']
];
const semanticDiagnostics=[];
for(const [id,q,expected] of cases){
 const selection=selectBibleKnowledge(id,q);
 assert(selection.facts.some(f=>f.knowledgeId===expected),q+' missing '+expected);
 semanticDiagnostics.push({id,q,expected,matched:selection.match,available:selection.facts.map(f=>f.knowledgeId)});
}
// Demonstrate the actual generator receives a new concrete fact, including its limitation.
const scene=trustedScene({identity:{id:'MAREK'},question:'Kto to potwierdzi?'});scene.questionParts=[];
const fact=scene.knowledge.factBank.find(f=>f.knowledgeId==='RC19-MAREK-S02');assert(fact);
const result=await attemptInterview(scene,'groq',async(system,payload,a,b,c,phase)=>{
 if(phase==='generate'){
  assert(payload.knowledge.factBank.some(f=>f.text===fact.text));
  return {decision:'answer',factIds:[fact.id],text:fact.text};
 }
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
 throw Error('unexpected '+phase);
});assert(result?.ok);
for(const id of ids)for(const gate of rules.scriptedCorrections[id].gates){
 const locked=trustedScene({identity:{id},question:'Co ukrywasz?'},{approvedEvidence:rules.initial});
 assert(!locked.knowledge.factBank.some(f=>f.knowledgeId==='RC19-SECRET-'+id));
 const open=trustedScene({identity:{id},question:'Co ukrywasz?'},{approvedEvidence:[...rules.initial,...gate]});
 assert(open.knowledge.factBank.some(f=>f.knowledgeId==='RC19-SECRET-'+id));
}
fs.writeFileSync(new URL('../AUDYT-POKRYCIA-RC19.json',import.meta.url),JSON.stringify({method:'Source delivery and authorial mapping; not a live answer-quality evaluation',questionCount:830,pairCount,paraphraseCount,semanticDiagnostics,coverage},null,2));
console.log(JSON.stringify({result:'PASS RC19',questions:830,pairCount,paraphraseCount,semanticDiagnostics,liveAPI:'not_run'}));
