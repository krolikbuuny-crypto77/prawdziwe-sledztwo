/* RC57.10.3 — deterministic pre-acceptance review of cloud witness dialogue.
 * This is NOT a canon oracle. The existing fact contract, hardGuard and independent
 * semantic audit remain authoritative. No evidence, game progress or saves are
 * created here. A rejected draft can only be regenerated against the same factBank.
 */
import {auditLiveDialogue} from './admin-rc57-claim-audit.js';
import {reviewNaturalSpeech} from './interview-naturalness-rc28.js';

const STOP_CODES=new Set([
 'memory_evasion', 'opening_memory_attribution', 'self_order_contradiction', 'place_self_contradiction',
 'session_as_location', 'self_location_observation', 'memory_answer_without_referent',
 'excluded_topic_repeated', 'overformal_answer', 'speech_typo', 'near_repetition'
]);

function historyFor(scene){
 const h=Array.isArray(scene.approvedThreadHistory)?scene.approvedThreadHistory:scene.memory?.conversation;
 return Array.isArray(h)?h.map(x=>({role:['świadek','witness'].includes(x?.role)?'witness':'player',text:String(x?.text||'')})):[];
}

export function reviewWitnessDraft(scene,answer,selected=[]){
 const audit=auditLiveDialogue({question:scene.question,answer,history:historyFor(scene),witnessId:scene.identity?.id});
 const codes=[...new Set(audit.findings.map(x=>x.code))];
 const style=reviewNaturalSpeech(scene,answer);
 const blocked=codes.filter(x=>STOP_CODES.has(x));
 // A truthful lack of knowledge about a precise minute is not an invitation
 // to invent an alibi. Only demand a known location if an authorised selected
 // fact actually names it; otherwise preserve the semantic verifier's decision.
 if(codes.includes('location_evasion')&&selected.some(f=>
  /\b(?:był[ae]m|przebywał[ae]m|pracował[ae]m|znajdował[ae]m się)\s+(?:w|na|przy)\s+(?:biurze|dyspozytorni|warsztacie|hali|stanowisku|zajezdni)\b/i.test(f?.text||'')))
  blocked.push('location_evasion');
 if(!style.ok&&!blocked.includes('robotic_dialogue'))blocked.push('robotic_dialogue');
 return {ok:blocked.length===0,reason:blocked[0]?'dialogue_'+blocked[0]:null,codes,
  warnings:codes.filter(x=>!blocked.includes(x)),version:'RC57.10.4'};
}
