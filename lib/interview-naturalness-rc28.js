/* RC28: warstwa naturalności wypowiedzi. Nie zmienia factBank, walidacji faktów,
 * źródeł dowodowych, audytu semantycznego ani odblokowań postępu.
 * Zachowuje wszystkie dotychczasowe instrukcje RC27/RC26 z interview-wire-rc23.
 */
import {
 interviewWirePayload as existingWirePayload,
 interviewAuditSystem as existingAuditSystem
} from './interview-wire-rc23.js';
import {psychologicalDelivery} from './interview-psychology-rc37.js';
import {analyzeMultiQuestion,RC50_AUDIT} from './interview-rc50.js';
import {speechCadence} from './interview-rc51.js';
import {witnessRelationshipCue} from './interview-rc52.js';
import {interviewAnswerSystem} from './interview-prompt-rc57106.js';
export {interviewAnswerSystem};
// Zachowuje nazwę historycznego eksportu bez dublowania tekstu promptu.
export const naturalConversationDirective=interviewAnswerSystem;

const safeText=(text,max)=>typeof text==='string'?text.replace(/[\u0000-\u001f]+/g,' ').trim().slice(0,max):'';

/** Ta warstwa realizuje wcześniej przygotowane, ale niewysłane wskazówki stylu.
 * Nie umieszczamy tu nowych faktów ani informacji z niezaufanego klienta.
 */
export function interviewWirePayload(scene){
 const previous=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const openingAnswer=previous.find(x=>['witness','świadek'].includes(x?.role)&&typeof x?.text==='string');
 const askOpening=/(?:pami[eę]tasz.{0,55}(?:pocz[aą]tku|pierwsz)|co powiedzia[lł][ae][sś].{0,50}pocz[aą]tku)/i.test(String(scene?.question||''));
 const payload={...existingWirePayload(scene),
  ...(askOpening&&(scene.conversationOpeningAnchor||openingAnswer)?{conversationOpeningAnchor:scene.conversationOpeningAnchor||{kind:'pierwsza zatwierdzona wypowiedź tego świadka, nie początek zmiany',text:safeText(openingAnswer.text,650)}}:{}),
  psychologicalDelivery:psychologicalDelivery(scene),
  rc50QuestionCoaching:analyzeMultiQuestion(scene?.question,scene?.approvedThreadHistory||scene?.memory?.conversation),
  rc51Cadence:speechCadence(scene),
  rc52Relationships:witnessRelationshipCue(scene)};
 // Audyt ocenia sens pytania, a nie teatralność, ale może skorzystać z
 // nieautorytatywnej klasyfikacji rodzaju zarzutu.
 if(!scene?.identity||!scene?.spokenGuide)return scene?.dialogueDynamics?{...payload,dialogueDynamics:scene.dialogueDynamics}:payload;
 const spoken=safeText(scene.spokenGuide,1250);
 const delivery=safeText(scene.deliveryGuide,1800);
 return {
  ...payload,
  witnessSpeech:{
   purpose:'WYŁĄCZNIE STYL, nie fakty ani dowody',
   spokenGuide:spoken,
   deliveryGuide:delivery
  },
  ...(scene.dialogueDynamics?{dialogueDynamics:scene.dialogueDynamics}:{})
 };
}

// RC57.10.6: zasady generowania są zdefiniowane RAZ w
// interview-prompt-rc57106.js. Nie doklejamy RC28/32/50/51/52/57.10.x.
// Te moduły nadal wyliczają dynamiczny kontekst i zachowują kompatybilność API.

export const interviewAuditSystem=existingAuditSystem+"\n"+RC50_AUDIT;

/** Wąski filtr rażąco sztywnych sformułowań. Pozostała prawdziwość wypowiedzi
 * nadal należy do twardych kontroli i niezależnego audytu AI.
 */
export function reviewNaturalSpeech(scene,text){
 const value=String(text||'').trim();
 if(!value)return {ok:false,reason:'empty_speech'};
 const robotic=[
  /\bnie\s+mam\s+alibi\s+w\s+sensie\b/i,
  /\b(?:jedyn(?:e|ym|ymi)|wyłączn(?:e|ym|ymi))\s+(?:obiektywn(?:e|ym|ymi)\s+)?źródł/i,
  /\b(?:źródła|rejestry|materiały|dane),?\s+których\s+nie\s+odtwarzam\b/i,
  /\b(?:odtwarz\w*|rekonstru\w*)\s+każd(?:y|ego)\s+odcinek\b/i,
  /\bw\s+(?:świetle|ramach\s+powyższego|odniesieniu\s+do\s+powyższego)\b/i,
  /\b(?:pragnę\s+zaznaczyć|należy\s+podkreślić|istotne\s+jest\s+wskazanie)\b/i,
  /\b(?:w\s+oparciu\s+o\s+dostępny\s+materiał|w\s+ramach\s+analizy\s+dokumentacji)\b/i
 ];
 if(robotic.some(pattern=>pattern.test(value)))return {ok:false,reason:'robotic_dialogue'};
 const words=value.split(/\s+/u).filter(Boolean).length;
 const question=String(scene?.question||'').trim();
 const shortSimple=question.length<=70&&!/[;\n]/.test(question)&&
  !/\b(?:oraz|jednocześnie|a\s+potem|i\s+dlaczego|i\s+kto|i\s+gdzie)\b/i.test(question);
 const direct=/^(?:czy\b|masz\b|miał(?:eś|aś)\b|był(?:eś|aś)\b|widział(?:eś|aś)\b|pamiętasz\b|zna(?:sz|ł(?:eś|aś))\b)/i.test(question);
 if(shortSimple&&direct&&words>70)return {ok:false,reason:'robotic_dialogue'};
 return {ok:true,reason:'natural_enough'};
}

export const RC28_REPAIR_INSTRUCTION='Powiedz to jeszcze raz jak człowiek w zwykłej rozmowie: zacznij od odpowiedzi na pytanie, nie od definicji ani urzędowej formułki. Użyj krótkich zdań i naturalnego języka tej postaci. Usuń niepotrzebne usprawiedliwienia oraz frazy o „obiektywnych źródłach”, jeśli pytanie ich nie dotyczy. Zachowaj dokładnie wszystkie ograniczenia i niepewność wybranych faktów. Nie twórz nowych faktów.';

