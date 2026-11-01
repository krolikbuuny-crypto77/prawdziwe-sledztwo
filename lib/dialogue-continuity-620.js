/* Wyłącznie reżyseria stylu. Nie źródło faktów ani ocena uczciwości świadka. */
const normalize=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
import {WITNESS_VOICE_PROFILES,INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
const continuity=INTERVIEW_STYLE_CONTEXT.continuity;
export function dialogueContinuity(witnessId,history){
 if(!WITNESS_VOICE_PROFILES[witnessId]||!Array.isArray(history))return '';
 const qs=history.filter(t=>t&&['player','śledczy'].includes(t.role)).slice(-12).map(t=>normalize(t.text));
 if(!qs.length)return '';
 const accusation=qs.filter(q=>/\b(?:przyznaj sie|przyznajesz sie|zabiles|zabilas|zamordowales|zamordowalas|klamiesz)\b/.test(q)).length;
 const verifying=qs.filter(q=>/(?:skad wiesz|jakie zrod|co potwierdz|co widzial|co widziala|nie mam pewnosci)/.test(q)).length;
 const keys=qs.map(q=>['alibi','godzin','kart','protokol','lena','ostrzez','odbior','obecn','wiadom'].find(x=>q.includes(x))||'');
 const repeats=keys.at(-1)&&keys.slice(0,-1).includes(keys.at(-1));
 let cue=WITNESS_VOICE_PROFILES[witnessId].delivery;
 if(accusation>verifying+1)cue+=' ' +continuity.accusation;
 else if(verifying>accusation)cue+=' ' +continuity.verifying;
 if(repeats)cue+=' ' +continuity.repeated;
 const last=qs.at(-1)||'';
 const clarified=/(?:nie o to pytam|pytam o cos innego|konkretnie|a gdzie|a kto|a skad|skad wiesz|chodzi mi o|doprecyzuj|powiedz wprost)/.test(last);
 const witnessAnswers=history.filter(t=>t&&['witness','świadek'].includes(t.role)).slice(-4)
  .map(t=>normalize(t.text));
 const evasions=witnessAnswers.filter(a=>/(?:nie wiem|nie pamietam|nie potrafie|nie moge potwierdzic|nie widzialem|nie widzialam)/.test(a)).length;
 if(clarified)cue+=' ' +continuity.clarification;
 if(evasions>=2)cue+=' ' +continuity.limitedKnowledge;
 if(qs.length>=8&&accusation>0&&verifying>0)cue+=' ' +continuity.longTalk;

 return cue;
}
