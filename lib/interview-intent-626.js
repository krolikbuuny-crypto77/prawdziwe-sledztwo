/** Compatibility façade. All scope decisions now originate from 6.33. */
import {analyzeQuestion,foldQuestion} from './question-intent-633.js';
export function questionFocus(question){
 const mode=analyzeQuestion(question).primary;
 return mode==='alarm_report'||mode==='self_alibi'?mode:null;
}
export function relevantForQuestion(question,reply,providedPlan=null){
 const kind=providedPlan?.primary||analyzeQuestion(question).primary,a=foldQuestion(reply);
 if(kind==='alarm_report')return /(?:alarm|zglosz|zawiadom|wezw|znalaz|znalezion|odnalaz|powiadom|02:02)/.test(a)&&
   !(/(?:ostatni\w*\s+(?:raz|razem)|ostatni\w*\s+(?:widzial|spotkal))/.test(a)&&!/alarm|zglosz|02:02/.test(a));
 if(kind==='self_alibi')return /(?:\balibi\b|dyzur|zmian|biur|obecnos|przebyw|miejsce|stanowisk|warsztat|zajezd|prac|dyspozytor|sluzb|sesj|nie\s+(?:wiem|pamietam|potrafie|moge)|nie\s+potwierdz|polozen)/.test(a)&&
   !(/(?:len[ayie]|rudnick)/.test(a)&&!/(?:\bja\b|biur|zmian|dyzur|alibi|obecnosc|przebyw|miejsce|prac|polozen)/.test(a));
 return true;
}
