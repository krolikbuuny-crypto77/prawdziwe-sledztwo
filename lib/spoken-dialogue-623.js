/** RC57.10.12: language review stays here; ALL model instructions are canonical
 * in interview-prompt-rc57106.js. This returns no duplicated long prompt. */
import {WITNESS_VOICE_PROFILES} from './interview-prompt-rc57106.js';
export function spokenStyleGuide(witnessId){return WITNESS_VOICE_PROFILES[witnessId]?.voice||'';}
const BUREAUCRATIC=[
 /wyciąga(?:\s+pan|\s+pani)?\s+z(?:\s+tego|\s+niego)?\s+zbyt\s+daleko\s+idące\s+wnioski/i,
 /w świetle (?:przedstawionych|zgromadzonych|dostępnych) (?:materiałów|dowodów)/i,
 /na podstawie dostępnych (?:mi |nam )?informacji (?:nie |mogę|uważam)/i,
 /pragnę (?:podkreślić|zaznaczyć|wyjaśnić)/i,
 /należy (?:wyraźnie )?zauważyć,? że/i,
 /niniejszym (?:oświadczam|stwierdzam)/i,
 /to zagadnienie wymaga (?:szerszego|dogłębnego|kompleksowego)/i,
 /nie jestem w stanie jednoznacznie (?:stwierdzić|potwierdzić),? (?:że|czy)/i
];
/** To filtr szczególnie sztucznych odpowiedzi, NIE sprawdzenie prawdziwości.
 * Zgodność z faktami sprawdza osobny hardGuard + audyt semantyczny.
 */
export function reviewSpokenReply(text,{compound=false}={}){
 if(typeof text!=='string'||!text.trim())return {ok:false,reason:'empty'};
 const words=text.trim().split(/\s+/).filter(Boolean);
 if(words.length>(compound?130:85))return {ok:false,reason:'overlong'};
 if((text.match(/\?/g)||[]).length>1&&!compound)return {ok:false,reason:'too_many_questions'};
 if(/[<>]/.test(text)||/\*[^*\n]+\*/.test(text)||/^\s*(?:świadek|magdalena|marek|tomasz|elżbieta|janusz|kamil)\s*:/im.test(text))return {ok:false,reason:'stage_directions'};
 if(BUREAUCRATIC.some(x=>x.test(text)))return {ok:false,reason:'bureaucratic'};
 const phrases=text.split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);
 if(!compound&&phrases.length>5)return {ok:false,reason:'lecture'};
 return {ok:true,reason:'spoken'};
}
export const SPOKEN_STYLE_VERSION='6.23';

/** Interpunkcja w mowie świadka, bez ingerowania w fakty, nazwy i liczby. */
export function normalizeWitnessSpeech(text){
 if(typeof text!=='string')return '';
 return text.replace(/\s*;\s*([a-ząćęłńóśźż])/g,(_,letter)=>'. '+letter.toLocaleUpperCase('pl')).replace(/\s*;\s*/g,'. ').replace(/\s+/g,' ').trim();
}
