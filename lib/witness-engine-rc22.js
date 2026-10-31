/** One production authority for knowledge. Authoring layers are compiler inputs only. */
import registry from './witness-registry-rc22.json' with {type:'json'};
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const terms=s=>new Set((fold(s).match(/[a-z0-9]{4,}/g)||[]).map(w=>w.length>6?w.slice(0,-2):w));
const normal=s=>fold(s).replace(/[^a-z0-9]+/g,' ').trim();
const byQuestion=new Map(registry.questions.map(row=>[normal(row.question),row]));
const indexed=registry.questions.map(row=>({...row,words:terms(row.question)}));
const topicMatchers={alibi:/alibi|gdzie|pobyt|obecn|wychod/,witness:/swiad|potwierdz|widzial|poswiad/,phone:/telefon|polaczen|biling|wiadom|radio/,identity:/kart|konto|identyf|czytnik|drzwi/,report:/zglosz|zglasz|zastrzez|nadani|odbiorc|projekt/,records:/dokument|log|rejestr|zapis|podpis|wersj/,workshop:/wagon|diagnost|tcms|uster|napraw|test|czesc/,safety:/bhp|ryzyk|bezpieczen|slad|oslon|probk/,authorization:/autoryz|zgod|zatwierdz|odbior|podpis/,finance:/finans|faktur|premi|koszt|dostaw|umow/,memory:/pamie|skad|zrod|pewn|wlasn/,alarm:/alarm|znale|godzin|chronolog/,responsibility:/win|przyzn|zabil|motyw|odpowiedzial/,relationship:/lena|leny|lene|ofiar|relac|znajom/,emotion:/nerw|obaw|emocj|przerw|milcz/,pressure:/nacisk|presj|rozkaz|polecen/};
export function matchRegistryQuestion(question){
 const exact=byQuestion.get(normal(question));if(exact)return {row:exact,method:'exact'};
 const words=terms(question);if(!words.size)return null;
 const ranked=indexed.map(row=>({row,score:[...words].filter(w=>row.words.has(w)).length/Math.sqrt(Math.max(1,words.size*row.words.size))})).sort((a,b)=>b.score-a.score);
 return ranked[0].score>=0.2?{row:ranked[0].row,method:'tentative-word-overlap'}:null;
}
export function permitsKnowledge(fact,approvedEvidence=[]){return fact.disclosure.mode==='public'||fact.disclosure.anyOf.some(g=>g.every(id=>approvedEvidence.includes(id)));}
export function allAuthorisedKnowledge(id,evidence=[]){return (registry.profiles[id]?.facts||[]).filter(f=>permitsKnowledge(f,evidence));}
export function selectRegistryKnowledge(id,question,state=null){
 const owned=state?.approvedEvidence||registry.rules.initial;
 const permitted=allAuthorisedKnowledge(id,owned);
 const q=fold(question),words=terms(question),match=matchRegistryQuestion(question);
 const details=new Set(registry.details.filter(d=>d.owners.includes(id)&&match&&d.questions.includes(match.row.id)).map(d=>d.id));
 const extraTopics=[[/kamer|monitor/,'cameras'],[/rozmaw|zglasz|zglosz/,'riskroute'],[/alarm|znale|wpol.*trzec/,'afteralarm'],[/oprogram|scada|sterownik/,'software'],[/wariant|l.2|l.3|falownik/,'variants']];
 for(const [pattern,key] of extraTopics)if(pattern.test(q))details.add('RC19-D-'+key);
 const foundation=permitted.filter(f=>f.kind==='authored-personal-background'||f.source.startsWith('public-')||f.source.startsWith('trusted-'));
 const professional=permitted.filter(f=>f.source.startsWith('authored-')).map(f=>({f,score:(topicMatchers[f.topic]?.test(q)?8:0)+[...terms(f.text)].filter(w=>words.has(w)).length})).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score);
 const specialist=permitted.filter(f=>details.has(f.authoredId)).slice(0,5);
 const secrets=permitted.filter(f=>f.kind==='authorized-personal-correction');
 const own=professional.filter(x=>!x.f.source.startsWith('authored-COMMON-')).slice(0,6).map(x=>x.f);
 const shared=professional.filter(x=>x.f.source.startsWith('authored-COMMON-')).slice(0,2).map(x=>x.f);
 const selected=[...foundation,...specialist,...secrets,...own,...shared];
 const unique=[...new Map(selected.map(f=>[f.id,f])).values()];
 const rank=f=>/gdzie|alibi|przebyw/.test(q)&&f.source==='public-alibi'?100:
  /alarm|znalaz|znalezien/.test(q)&&f.source==='public-what_happened'?90+(f.text.includes('02:02')?5:0):
  /relac|znales|ofiara|ofiare/.test(q)&&f.source==='trusted-relationship'?90:0;
 unique.sort((a,b)=>rank(b)-rank(a));
 return {facts:unique,match:match?{id:match.row.id,section:match.row.section,method:match.method}:null};
}
export {registry};
