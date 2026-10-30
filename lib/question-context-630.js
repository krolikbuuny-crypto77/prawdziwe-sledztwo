/** 6.33: sole interpretation source for server dialogue semantics.
 * History is used only to resolve references, never as verified case facts.
 */
import {analyzeQuestion,foldQuestion,classifyQuestionPart} from './question-intent-633.js';
const clean=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,' ').trim().slice(0,1600);
const anaphora=/(?:\b(?:to|tego|temu|tym|o tym|tak|stamtad|wtedy|w tamtej chwili|w tym czasie|nia|nim|niej|ona|on)\b|\b(?:a skad|skad pan to|skad pani to|skad to|a dlaczego|dlaczego tak|co ma pan na mysli|co ma pani na mysli)\b)/;
export function classifyClause(input){return analyzeQuestion(input).primary;}
function lastTurnPair(history){
 const rows=Array.isArray(history)?history:[];
 for(let i=rows.length-1;i>=1;i--)if(rows[i]?.role==='witness'&&rows[i-1]?.role==='player'){
  return {previousQuestion:clean(rows[i-1].text),previousAnswer:clean(rows[i].text),
   previousAnswerVerified:rows[i]?.narrativeStatus!=='offline_unverified'};
 }
 return null;
}
export function buildQuestionContext(question,approvedTranscript=[]){
 const q=clean(question),plan=analyzeQuestion(q),pair=lastTurnPair(approvedTranscript);
 const hasReferent=anaphora.test(foldQuestion(q))&&!/(?:\balibi\b|\b0?\d[:.]\d\d\b|\blena\b|\bleny\b|\bkarte\b|\bprotokol\b)/.test(foldQuestion(q));
 const focus=pair&&hasReferent?{previousQuestion:pair.previousQuestion,
  previousAnswer:pair.previousAnswerVerified?pair.previousAnswer:'Wcześniejsza odpowiedź offline nie została zweryfikowana.',
  previousAnswerVerified:pair.previousAnswerVerified,referencedTopic:classifyClause(pair.previousQuestion),
  note:'Poprzednia wypowiedź jest relacją świadka, a nie potwierdzonym dowodem.'}:null;
 const effectivePrimary=focus&&plan.primary==='clarification'?focus.referencedTopic:plan.primary;
 return {questionPlan:{version:plan.version,primary:effectivePrimary,intents:plan.intents,aspects:plan.aspects,
  subject:plan.subject,time:plan.time,excludedTopics:plan.excludedTopics,positiveQuestion:plan.positiveQuestion,
  slots:{compound:plan.slots.compound,negated:plan.slots.negated,anaphoric:!!focus},
  needsClarification:plan.needsClarification&&!focus},
  questionParts:plan.parts.length>1?plan.parts.map(({text,intent})=>({text,intent})):[],
  dialogueFocus:focus};
}
export function repeatsIrrelevantly(question,answer,approvedTranscript=[]){
 const pair=lastTurnPair(approvedTranscript);if(!pair)return false;
 const normalize=s=>foldQuestion(s).replace(/[^a-z0-9]+/g,' ').trim();
 const current=normalize(answer),previous=normalize(pair.previousAnswer),asked=normalize(question),older=normalize(pair.previousQuestion);
 if(current.length<35||current!==previous||asked===older)return false;
 const mode=classifyClause(question),before=classifyClause(pair.previousQuestion);
 return mode!==before||/\b(?:nie pytam|skad|ale|chodzi mi|doprecyzuj|wlasnie|konkretnie)\b/.test(foldQuestion(question));
}
