/** One production authority for knowledge. Authoring layers are compiler inputs only. */
import registry from './witness-registry-rc22.json' with {type:'json'};
import {rankWitnessFacts} from './witness-retrieval-rc48.js';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const terms=s=>new Set((fold(s).match(/[a-z0-9]{4,}/g)||[]).map(w=>w.length>6?w.slice(0,-2):w));
const normal=s=>fold(s).replace(/[^a-z0-9]+/g,' ').trim();
const byQuestion=new Map(registry.questions.map(row=>[normal(row.question),row]));
const indexed=registry.questions.map(row=>({...row,words:terms(row.question)}));
export function matchRegistryQuestion(question){
 const exact=byQuestion.get(normal(question));if(exact)return {row:exact,method:'exact'};
 const words=terms(question);if(!words.size)return null;
 const ranked=indexed.map(row=>({row,score:[...words].filter(w=>row.words.has(w)).length/Math.sqrt(Math.max(1,words.size*row.words.size))})).sort((a,b)=>b.score-a.score);
 return ranked[0].score>=0.2?{row:ranked[0].row,method:'tentative-word-overlap'}:null;
}
export function permitsKnowledge(fact,approvedEvidence=[]){return fact.disclosure.mode==='public'||fact.disclosure.anyOf.some(g=>g.every(id=>approvedEvidence.includes(id)));}
export function allAuthorisedKnowledge(id,evidence=[]){return (registry.profiles[id]?.facts||[]).filter(f=>permitsKnowledge(f,evidence));}
export function selectRegistryKnowledge(id,question,state=null,options={}){
 const owned=state?.approvedEvidence||registry.rules.initial;
 const permitted=allAuthorisedKnowledge(id,owned);
 const q=fold(question),candidate=matchRegistryQuestion(question);
 // Approximate overlap alone must not select an unrelated case-detail pack.
 // E.g. 'Co wiesz o Januszu?' must not map to a diagnostic question
 // merely because both start with 'Co wiesz'. Exact FAQ matches remain exact.

 const match=candidate?.method==='exact'?candidate:null; // approximate FAQ overlap is not authoritative
 const details=new Set(registry.details.filter(d=>d.owners.includes(id)&&match&&d.questions.includes(match.row.id)).map(d=>d.id));
 const extraTopics=[[/kamer|monitor/,'cameras'],[/rozmaw|zglasz|zglosz/,'riskroute'],[/alarm|znalaz|znalezion|znalezien|wpol.*trzec/,'afteralarm'],[/oprogram|scada|sterownik/,'software'],[/wariant|l.2|l.3|falownik/,'variants']];
 for(const [pattern,key] of extraTopics)if(pattern.test(q))details.add('RC19-D-'+key);
 const ranked=rankWitnessFacts({id,question,history:options.approvedHistory||[],permitted,
  detailIds:[...details],maxFacts:options.maxFacts??30});
 return {...ranked,match:match?{id:match.row.id,section:match.row.section,method:match.method}:null};
}

export {registry};
