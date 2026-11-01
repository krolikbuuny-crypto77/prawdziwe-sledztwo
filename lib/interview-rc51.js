import {WITNESS_VOICE_PROFILES,INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
/* RC51 — individual response cadence from approved history; STYLE ONLY.
 * Not a fact bank, no new statement, no emotional state or secret. */
const clean=v=>String(v||'').trim();

export { RC51_DIRECTIVE } from './interview-prompt-rc57106.js';
export function speechCadence(scene){
 const identity=clean(scene?.identity?.id).toUpperCase();
 const question=clean(scene?.question);
 const prior=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const lastReplies=prior.slice(-12).filter(x=>x&&['witness','npc','świadek'].includes(x.role)).map(x=>clean(x.text)).filter(Boolean).slice(-4);
 const long=question.length>160||question.split('?').length>2;
 return Object.freeze({authority:'style_only_not_fact',individualVoice:WITNESS_VOICE_PROFILES[identity]?.voice||'Zachowaj charakter i język postaci.',
  targetLength:long?INTERVIEW_STYLE_CONTEXT.cadence.long:INTERVIEW_STYLE_CONTEXT.cadence.short,
  repeatedOpeners:lastReplies.map(t=>t.split(/\s+/).slice(0,4).join(' ')).filter(Boolean),
  avoid:INTERVIEW_STYLE_CONTEXT.cadence.avoid});
}
