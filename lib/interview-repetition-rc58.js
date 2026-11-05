/** RC58: context-only repetition policy. No story facts, no blocking by style. */
import {foldQuestion} from './question-intent-633.js';
const normalize=s=>foldQuestion(String(s||'')).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(w=>w.length>=4));
const jaccard=(a,b)=>{const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;
 let both=0;for(const t of A)if(B.has(t))both++;return both/(A.size+B.size-both);};
export function repetitionContext(history=[],question=''){
 const rows=Array.isArray(history)?history:[];
 const pairs=[];
 for(let i=1;i<rows.length;i++)if(rows[i-1]?.role==='player'&&rows[i]?.role==='witness'&&rows[i].narrativeStatus!=='offline_unverified')
  pairs.push({question:rows[i-1].text,answer:rows[i].text});
 const related=pairs.filter(x=>jaccard(x.question,question)>=0.7).length;
 const last=pairs.slice(-4);
 const openers=last.map(x=>String(x.answer||'').split(/[.!?]/)[0].trim().slice(0,90)).filter(Boolean);
 return {authority:'style_only_not_fact',sameQuestionCount:related,previousResponses:last,
  openersToAvoid:[...new Set(openers)],
  advice:related>=3?'Podtrzymaj stanowisko krótko; zniecierpliwienie tylko jeśli pozwala charakter i dotychczasowy nacisk.':
   related>=1?'Możesz potwierdzić poprzednią wersję krócej, bez recytacji pełnego alibi.':
   'Odpowiadaj na aktualny zakres pytania. Nie powtarzaj bloku o alibi i dokumentach bez potrzeby.'};
}
export function repetitionReview(context,question,answer){
 const prior=context?.previousResponses||[];
 const exact=prior.filter(p=>normalize(p.answer)===normalize(answer)&&normalize(answer).length>=25);
 if(!exact.length)return {status:'fresh'};
 const requested=prior.some(p=>jaccard(p.question,question)>=0.7);
 return {status:requested?'justified_repeat':'potential_irrelevant_repeat',warning:true};
}
