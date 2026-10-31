import assert from 'node:assert/strict';
import fs from 'node:fs';
import bank from '../lib/interview-question-bank-rc17.json' with {type:'json'};
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
import {trustedScene} from '../lib/trusted-interview-624.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {questionGuidance} from '../lib/question-guidance-rc17.js';
assert.equal(bank.cases.length,830);
assert.equal(new Set(bank.cases.map(r=>r.question)).size,830);
const sections=new Map();let count=0;
const audit=[];
const tokens=s=>new Set(s.toLocaleLowerCase('pl').match(/[\p{L}\d]{4,}/gu)||[]);
for(const row of bank.cases){
 sections.set(row.section,(sections.get(row.section)||0)+1);
 for(const id of Object.keys(canon.profiles)){
  const scene=trustedScene({identity:{id},question:row.question,knowledge:{documentsShown:[]}});
  assert.equal(scene.questionGuidance.exampleId,row.id);
  assert.equal(scene.question,row.question);
  assert(scene.knowledge.factBank.length>0);
  assert(!scene.knowledge.factBank.some(f=>f.source.startsWith('document-')||f.source==='trusted-correction'));
  assert.deepEqual(compactInterviewPayload(scene).questionGuidance,scene.questionGuidance);
  const original=trustedScene({identity:{id},question:row.question,knowledge:{documentsShown:['LAB-10']}},null);
  assert.deepEqual(original.knowledge.factBank,scene.knowledge.factBank);
  const words=tokens(row.question);
  const candidates=scene.knowledge.factBank.map(f=>({...f,score:[...tokens(f.text)].filter(w=>words.has(w)).length})).filter(f=>f.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
  audit.push({questionId:row.id,witnessId:id,question:row.question,section:row.section,status:candidates.length?'candidate_sources_semantic_review_required':'no_lexical_support_clarification_or_knowledge_limit',candidateSources:candidates.map(f=>({source:f.source,text:f.text})),liveResult:'not_run'});count++;
 }
}
assert.equal(sections.size,17);assert.equal(sections.get('Przypadki techniczne i bezpieczeństwa'),3);
assert.equal([...sections.values()].filter(n=>n===50).length,14);
assert.equal(questionGuidance('Nowe pytanie spoza listy?').exampleId,undefined);
fs.writeFileSync(new URL('../AUDYT-WIEDZY-RC17.json',import.meta.url),JSON.stringify({method:'Conservative lexical candidate discovery, not semantic proof or live AI evaluation',pairs:count,rows:audit},null,2));
console.log(`PASS RC17: 830 questions, 17 sections, ${count} witness/question pairs; private guidance reaches payload; no hidden documents or corrections exposed. Live AI: not run.`);
