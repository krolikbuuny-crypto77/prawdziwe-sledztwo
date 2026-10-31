/** Authorial case bible. Retrieval never grants evidence permissions. */
import bible from './witness-bible-rc19.json' with {type:'json'};
import bank from './interview-question-bank-rc17.json' with {type:'json'};
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set(['czy','jak','jaki','jakie','ktory','ktora','pan','pani','sie','nie','jest','byl','byla','byles','bylesmy','twoje','twoj','tym','tego','przez','oraz','tylko','ktos']);
const terms=s=>new Set(fold(s).split(' ').filter(w=>w.length>2&&!stop.has(w)).map(w=>w.length>6?w.slice(0,-2):w));
const grams=s=>{const t=fold(s);return new Set(Array.from({length:Math.max(0,t.length-2)},(_,i)=>t.slice(i,i+3)));};
const index=bank.cases.map(r=>({...r,folded:fold(r.question),terms:terms(r.question),grams:grams(r.question)}));
const exact=new Map(index.map(r=>[r.folded,r]));
const frequency=new Map();for(const row of index)for(const t of row.terms)frequency.set(t,(frequency.get(t)||0)+1);
export function matchQuestionKnowledge(question,history=[]){
 const normalized=fold(question),found=exact.get(normalized);if(found)return {row:found,method:'exact',score:1};
 let text=question;
 if(terms(question).size<3){
  const prior=(Array.isArray(history)?history:[]).filter(r=>r.role==='player'||r.role==='śledczy').slice(-1)[0];
  if(prior)text+=' '+prior.text;
 }
 const q=terms(text),g=grams(text);
 const ranked=index.map(row=>{
  let shared=0;for(const t of q)if(row.terms.has(t))shared+=Math.log(1+index.length/(frequency.get(t)||1));
  let common=0;for(const t of g)if(row.grams.has(t))common++;
  return {row,score:shared/Math.max(2,Math.sqrt(q.size*row.terms.size))+common/Math.max(1,g.size+row.grams.size-common)};
 }).sort((a,b)=>b.score-a.score||a.row.id.localeCompare(b.row.id));
 if(!q.size||ranked[0].score<0.7)return {row:null,method:'unresolved',score:ranked[0]?.score||0};
 return {...ranked[0],method:'lexical-and-character-similarity'};
}
const overrides={Q0003:[8],Q0010:[8],Q0012:[1,8],Q0019:[8],Q0027:[9,8],Q0030:[8],Q0064:[5,2],Q0065:[4],Q0069:[8],Q0180:[1],Q0194:[5],Q0198:[15],Q0199:[13,15],Q0200:[1,4],Q0201:[15],Q0229:[1],Q0230:[8],Q0232:[8],Q0247:[1],Q0275:[3],Q0345:[5],Q0382:[4],Q0401:[5],Q0405:[11],Q0406:[12],Q0424:[6],Q0434:[5],Q0435:[12],Q0436:[12],Q0441:[13],Q0453:[14],Q0502:[5],Q0511:[12],Q0523:[11],Q0524:[12],Q0530:[6],Q0531:[6],Q0532:[6],Q0533:[6],Q0540:[12],Q0548:[6],Q0589:[11],Q0686:[14,10],Q0689:[5,14]};
const bySection=new Map(bible.facts.map(f=>[f.witnessId+'|'+f.section,f]));
function atomize(entry,source,kind){
 return [{text:entry.text,source,kind,knowledgeId:entry.id}];
}
export function selectBibleKnowledge(id,question,state=null){
 const history=state?.witnesses?.[id]||[];
 const match=matchQuestionKnowledge(question,history);
 const sectionNumbers=match.row?overrides[match.row.id]:null;
 const sections=sectionNumbers?sectionNumbers.map(n=>bible.sections[n-1]):match.row?[match.row.section]:[];
 // Resolve short, elliptical questions with the prior approved question as additional context.
 const previous=history.filter(r=>(r.role==='player'||r.role==='śledczy')&&fold(r.text)!==fold(question)).slice(-1)[0];
 if(previous&&(terms(question).size<4||match.row?.section===bible.sections[15])){
  const prior=matchQuestionKnowledge(previous.text);
  if(prior.row&&!sections.includes(prior.row.section))sections.unshift(prior.row.section);
 }
 const selected=[];
 const q=fold(question);
 const detailTopics=[
  [/kamer|monitor/,['cameras']],
  [/zglasza|rozmaw|kontakt.*lena|bezpieczen.*tramwaj/,['riskroute']],
  [/znale|alarm|wpol.*trzec|pol.*trzec|pol.*do.*trzec/,['afteralarm']],
  [/wariant|l.2|l.3|falownik|podzespol/,['variants','physicall2']],
  [/radi|kanal|szyfrow|tr.04/,['radiochannel','radiogap']],
  [/oprogram|scada|sterownik|sum.*kontrol/,['software']],
  [/szatl|przerw|socjal|obchod/,['break']],
  [/godzin.*zmian|poczatek.*zmian/,['shift']]
 ];
 const topicIds=new Set(detailTopics.filter(([pattern])=>pattern.test(q)).flatMap(([,keys])=>keys.map(k=>'RC19-D-'+k)));

 const owned=new Set(state?.approvedEvidence||[]);
 if(match.row){
  for(const detail of bible.details.filter(d=>(d.questions.includes(match.row.id)||topicIds.has(d.id))&&d.owners.includes(id)).slice(0,5)){
   if(detail.documents.every(doc=>owned.has(doc)))selected.push(...atomize(detail,detail.id,detail.kind));
  }
 }
 const secret=bible.secrets[id];
 if(secret&&secret.gates.some(g=>g.every(key=>owned.has(key)))){
  selected.push(...atomize({...secret,id:'RC19-SECRET-'+id},'RC19-SECRET-'+id,'authorized-personal-correction'));
 }
 // The complete personal dossier is always present: retrieval cannot hide a basic memory.
 // Matched sections only change ordering, never which public personal facts are authorized.
 const personal=bible.facts.filter(f=>f.witnessId===id);
 personal.sort((a,b)=>(sections.includes(b.section)?1:0)-(sections.includes(a.section)?1:0));
 for(const f of personal)selected.push(...atomize(f,f.id,f.kind));

 return {match:match.row?{id:match.row.id,section:match.row.section,method:match.method}:null,facts:selected};
}
export function coverageForQuestion(row,id){
 const main=(overrides[row.id]||[bible.sections.indexOf(row.section)+1]).map(n=>bySection.get(id+'|'+bible.sections[n-1])).filter(Boolean);
 const details=bible.details.filter(d=>d.questions.includes(row.id));
 return {questionId:row.id,witnessId:id,personalKnowledgeIds:main.map(f=>f.id),specificKnowledgeIds:details.filter(d=>d.owners.includes(id)).map(d=>d.id),specialistWitnesses:[...new Set(details.flatMap(d=>d.owners))],documentRequirements:[...new Set(details.flatMap(d=>d.documents))],needsConversation:row.section===bible.sections[15]||row.section===bible.sections[14],liveStatus:'not_run'};
}
export {bible};
