/** Compile immutable authored inputs into the sole production knowledge registry. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {trustedScene as legacyScene} from './legacy-scene-source-rc21.mjs';
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
import bible from '../lib/witness-bible-rc19.json' with {type:'json'};
import bank from '../lib/interview-question-bank-rc17.json' with {type:'json'};
import rules from '../lib/approved-rules.js';
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const files=['lib/trusted-witness-canon-624.json','lib/witness-bible-rc19.json','lib/witness-knowledge-rc18.json','lib/approved-rules.js','tools/legacy-scene-source-rc21.mjs','lib/witness-bible-rc19.js','lib/witness-knowledge-rc18.js','lib/witness-dossiers-rc5.js','lib/question-context-630.js','lib/question-intent-633.js','lib/interview-question-bank-rc17.json','tools/build-witness-registry-rc22.mjs'];
const sourceHashes=Object.fromEntries(files.map(file=>[file,digest(fs.readFileSync(new URL('../'+file,import.meta.url)))]));
const profiles={};
for(const id of Object.keys(canon.profiles)){
 const all=new Map(),publicKeys=new Set();
 for(const open of [false,true])for(const row of bank.cases){
  const scene=legacyScene({identity:{id},question:row.question,knowledge:{documentsShown:[]}},open?{approvedEvidence:Object.keys(canon.documents)}:null);
  for(const f of scene.knowledge.factBank){
   const key=f.source+'\0'+f.text;all.set(key,f);if(!open)publicKeys.add(key);
  }
 }
 const facts=[];
 for(const [key,f] of all){
  let gates=[];
  const detail=bible.details.find(d=>d.id===f.knowledgeId);
  if(f.source==='trusted-correction'||f.knowledgeId==='RC19-SECRET-'+id)gates=rules.scriptedCorrections[id].gates;
  else if(detail?.documents.length)gates=[detail.documents];
  else if(!publicKeys.has(key))throw Error('Unclassified disclosure '+id+' '+f.source);
  facts.push({id:'K-'+id+'-'+digest(key).slice(0,14),text:f.text,source:f.source,origin:f.origin,
   certainty:f.certainty,kind:f.knowledgeKind||'authored-public-statement',
   ...(f.knowledgeId?{authoredId:f.knowledgeId}:{}),...(f.topic?{topic:f.topic}:{}),
   disclosure:gates.length?{mode:'evidence-gated',anyOf:gates}:{mode:'public'}});
 }
 // Remove literal excerpts only when an identical-source full authored statement contains them.
 const removed=[];
 const retained=facts.filter(f=>{
  const parent=facts.find(p=>p.id!==f.id&&p.source===f.source&&p.origin===f.origin&&
   JSON.stringify(p.disclosure)===JSON.stringify(f.disclosure)&&p.text.length>f.text.length&&p.text.includes(f.text));
  if(parent){removed.push({id:f.id,coveredBy:parent.id,text:f.text});return false;}return true;
 });
 profiles[id]={identity:{id,name:canon.profiles[id].name,role:canon.profiles[id].role},facts:retained,coveredExcerpts:removed};
}
const artifact={questions:bank.cases,details:bible.details.map(({id,questions,owners,documents})=>({id,questions,owners,documents})),schema:'ps-witness-registry/2',sourceHashes,profiles,documents:canon.documents,documentRevisions:Object.fromEntries(Object.entries(canon.documents).map(([id,d])=>[id,digest(JSON.stringify(d))])),
 rules:{initial:rules.initial,scriptedCorrections:rules.scriptedCorrections},authority:'Compiled authored case facts; dialogue and psychology never create entries'};
fs.writeFileSync(new URL('../lib/witness-registry-rc22.json',import.meta.url),JSON.stringify(artifact,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(profiles).map(([id,p])=>[id,{facts:p.facts.length,public:p.facts.filter(f=>f.disclosure.mode==='public').length,removedExcerpts:p.coveredExcerpts.length}])));
