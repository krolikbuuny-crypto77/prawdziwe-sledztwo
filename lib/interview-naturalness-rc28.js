/* RC28: warstwa naturalności wypowiedzi. Nie zmienia factBank, walidacji faktów,
 * źródeł dowodowych, audytu semantycznego ani odblokowań postępu.
 * Zachowuje wszystkie dotychczasowe instrukcje RC27/RC26 z interview-wire-rc23.
 */
import {
 interviewWirePayload as existingWirePayload,
 interviewAnswerSystem as existingAnswerSystem,
 interviewAuditSystem as existingAuditSystem
} from './interview-wire-rc23.js';

const safeText=(text,max)=>typeof text==='string'?text.replace(/[\u0000-\u001f]+/g,' ').trim().slice(0,max):'';

/** Ta warstwa realizuje wcześniej przygotowane, ale niewysłane wskazówki stylu.
 * Nie umieszczamy tu nowych faktów ani informacji z niezaufanego klienta.
 */
export function interviewWirePayload(scene){
 const payload=existingWirePayload(scene);
 // Audyt faktów nie potrzebuje instrukcji teatralnych ani dodatkowych tokenów.
 if(!scene?.identity||!scene?.spokenGuide)return payload;
 const spoken=safeText(scene.spokenGuide,1250);
 const delivery=safeText(scene.deliveryGuide,1800);
 return {
  ...payload,
  witnessSpeech:{
   purpose:'WYŁĄCZNIE STYL, nie fakty ani dowody',
   spokenGuide:spoken,
   deliveryGuide:delivery,
   responseShape:'Pierwsza fraza odpowiada wprost na ostatnie pytanie. Dopiero potem krótka, konieczna uwaga o granicy wiedzy lub źródle. Przy pytaniu prostym najczęściej 1–2 zdania. Przy złożonym odpowiedz na wszystkie wątki. Unikaj referatu i zakończeń o proceduralnej weryfikacji.',
   continuity:'Przeczytaj ostatnią wymianę z conversation i dialogueFocus. Na doprecyzowanie odpowiedz NOWYM szczegółem albo konkretną granicą wiedzy, nie kolejną wersją tej samej formułki.'
  }
 };
}

export const interviewAnswerSystem=existingAnswerSystem+`\nDODATKOWA ZASADA DIALOGU RC28: witnessSpeech to wskazówki wyłącznie o stylu; NIGDY nie są źródłem faktów. Zastosuj osobowość wskazanego świadka, jego sposób mówienia i przebieg rozmowy. Odpowiadaj jak człowiek, do którego przed chwilą zwrócono się bezpośrednio. Zwykle zacznij od krótkiej, konkretnej odpowiedzi (np. potwierdzenia, zaprzeczenia, sprostowania lub określenia granicy pamięci), a dopiero potem dodaj niezbędne wyjaśnienie wynikające z factBank. Nie przemawiaj do protokołu. Nie zaczynaj od długich zastrzeżeń i klasyfikacji typu „w sensie ciągłej obecności”, nie kończ wyliczeniem możliwych obiektywnych źródeł, jeśli rozmówca o nie nie pytał. Nie wprowadzaj domniemanych świadków ani domniemanych dokumentów. Nie twórz nowych zdarzeń, emocjonalnych wyznań, godzin, motywów ani faktów o alibi.\nW kolejnych turach zmieniaj rytm i budowę wypowiedzi stosownie do pytania: czasem jedno zdanie, czasem dwa krótkie, czasem rzeczowe sprostowanie. Bez losowych westchnień, jąkania, przesadnej agresji i wstawek teatralnych. Jeśli śledczy dopytuje „a gdzie?”, „dlaczego?” albo „kto?”, odpowiedz na ten właśnie szczegół zamiast wracać do poprzedniego streszczenia. Przy braku wiedzy wolno powiedzieć po ludzku, czego świadek nie wie, ale nie przypisuj mu niewiedzy niepotwierdzonej faktami. Wszystkie factIds i warunki znaczeniowe pozostają obowiązkowe.`;
export const interviewAuditSystem=existingAuditSystem;

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
