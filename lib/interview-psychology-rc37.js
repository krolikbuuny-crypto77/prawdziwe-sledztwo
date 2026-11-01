import {WITNESS_VOICE_PROFILES,INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
/** RC42/47 — deterministic, bounded style guidance only. Never a case fact, identity or unlock. */
const text=(value,max=90)=>String(value||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,max);
const fold=s=>text(s,900).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function psychologicalDelivery(scene){
 const action=text(scene?.witnessStrategy?.action,80),stage=text(scene?.witnessStrategy?.stage,48),goal=text(scene?.witnessStrategy?.goal,80);
 const prior=Array.isArray(scene?.dialogueMemory?.previousPairs)?scene.dialogueMemory.previousPairs.slice(-24):[];
 const question=fold(scene?.question);
 const repeated=!!scene?.dialogueMemory?.repeatRequested;
 const pressure=/(klam|oszuk|ukryw|przecz|przyznaj|zabil)/.test(question)&&!/nie (?:twierdze|mowie|uwazam|oskarzam).{0,40}(?:klam|ukryw)/.test(question);
 const correction=/(przed chwila|wczesniej|cofn|sprost|popraw|powiedziales)/.test(question);
 const sourced=/(dowod|dokument|log|zapis|rejestr|potwierd)/.test(question);
 const count=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory.filter(x=>['witness','świadek'].includes(x?.role)).length:prior.length;
 const phase=count>=14?'dluga_rozmowa':count>=5?'pogłębienie':'początek';
 const witnessId=String(typeof scene?.identity==='string'?scene.identity:scene?.identity?.id||'').toUpperCase();
 const C=INTERVIEW_STYLE_CONTEXT.psychology;
 const individual=WITNESS_VOICE_PROFILES[witnessId]?.delivery||'Zachowaj odrębny styl postaci zgodnie z dossier.';
 return Object.freeze({authority:'style_only_not_fact',action,goal,stage,phase,individual,
  pressure:pressure?C.pressure:'zwykły kontakt',
  continuity:correction?C.correction:repeated?C.repeat:count>=4?'kontynuuj dłuższą rozmowę':'odpowiedz na ostatnie pytanie',
  tension:pressure?C.pressure:sourced?C.sourced:'zwykłe pytanie',
  trustSignal:correction?C.correctionTrust:repeated?C.repeatedTrust:C.none,
  fatigueCue:count>15?C.fatigue:'naturalny rytm',
  cadence:C.cadence,
  limitation:C.limitation});
}
