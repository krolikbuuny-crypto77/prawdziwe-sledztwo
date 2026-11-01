/* RC28: warstwa naturalności wypowiedzi. Nie zmienia factBank, walidacji faktów,
 * źródeł dowodowych, audytu semantycznego ani odblokowań postępu.
 * Zachowuje wszystkie dotychczasowe instrukcje RC27/RC26 z interview-wire-rc23.
 */
import {
 interviewWirePayload as existingWirePayload,
 interviewAnswerSystem as existingAnswerSystem,
 interviewAuditSystem as existingAuditSystem
} from './interview-wire-rc23.js';
import {psychologicalDelivery} from './interview-psychology-rc37.js';
import {analyzeMultiQuestion,RC50_DIRECTIVE,RC50_AUDIT} from './interview-rc50.js';
import {speechCadence,RC51_DIRECTIVE} from './interview-rc51.js';
import {witnessRelationshipCue,RC52_DIRECTIVE} from './interview-rc52.js';

const safeText=(text,max)=>typeof text==='string'?text.replace(/[\u0000-\u001f]+/g,' ').trim().slice(0,max):'';

/** Ta warstwa realizuje wcześniej przygotowane, ale niewysłane wskazówki stylu.
 * Nie umieszczamy tu nowych faktów ani informacji z niezaufanego klienta.
 */
export function interviewWirePayload(scene){
 const payload={...existingWirePayload(scene),psychologicalDelivery:psychologicalDelivery(scene),
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
   deliveryGuide:delivery,
   responseShape:'Pierwsza fraza odpowiada wprost na ostatnie pytanie. Dopiero potem krótka, konieczna uwaga o granicy wiedzy lub źródle. Przy pytaniu prostym najczęściej 1–2 zdania. Przy złożonym odpowiedz na wszystkie wątki. Unikaj referatu i zakończeń o proceduralnej weryfikacji.',
   continuity:'Przeczytaj ostatnią wymianę z conversation i dialogueFocus. Na doprecyzowanie odpowiedz NOWYM szczegółem albo konkretną granicą wiedzy, nie kolejną wersją tej samej formułki.'
  },
  ...(scene.dialogueDynamics?{dialogueDynamics:scene.dialogueDynamics}:{})
 };
}

/** RC32: ten fragment dotyczy wyłącznie stylu. Nie blokuje poprawnej odpowiedzi,
 * nie wykonuje dodatkowego wywołania AI, nie dopisuje faktów ani dowodów. */
export const naturalConversationDirective=`
NATURALNOŚĆ RC32: Fakt w factBank jest źródłem wiedzy, a NIE tekstem do recytowania. Wybierz fakty konieczne do odpowiedzi; nie musisz powtarzać wszystkich ich zdań, zastrzeżeń i informacji o rejestrach. Zachowaj jednak te ograniczenia, bez których odpowiedź stałaby się nieprawdziwa. dialogueDynamics to omylna wskazówka rozmowna i nie jest źródłem faktów. Zacznij od reakcji na rzeczywistą intencję pytania, nie od szablonowego wyjaśnienia procedury. Gdy śledczy wyraża nieufność lub mówi „ukrywasz”, nie zmieniaj tego w zarzut zabójstwa czy przemocy, jeżeli go nie postawił. Gdy śledczy pyta o wcześniejszą wypowiedź, odpowiedz na zarzut niejasności, a nie ponownie wygłaszaj całej wersji alibi. Nie powtarzaj automatycznie formuły o rejestrach, logach, obiektywnych źródłach i granicach wiedzy w każdej turze.
Postać ma własny rytm i może zareagować drobną niecierpliwością, obronnością lub wahaniem jedynie przez dobór słów w kontekście pytania, bez zmyślania emocjonalnych stanów lub zdarzeń. Nie nadużywaj zwrotów „w sensie”, „nie odtwarzam”, „osobowy świadek”, „źródła obiektywne” i „nie jest przyznaniem się”. Jeśli odpowiedź ma jedną prostą treść, nie przedłużaj jej urzędowym komentarzem. Pozostaw wszystkich świadków wiernych kanonowi, wypowiedziom i bramkom dowodowym.`;

const RC5710_CONTINUITY='\nRC57.10 KONTYNUACJA: Po pytaniu o wcześniejsze słowa odnieś się konkretnie do wypowiedzi obecnej w historii, jeżeli została Ci dostarczona. Nie mów, że nie pamiętasz tylko dlatego, że rozmowa nie była nagrywana. Odróżnij pamięć o zmianie roboczej od pamięci o rozmowie prowadzonej teraz. Przy pytaniu o miejsce podaj znane miejsce już w pierwszym zdaniu. Nie twórz kolejności zdarzeń, jeśli według kanonu postać jej nie pamięta. Unikaj kopiowania wcześniejszych akapitów; możesz sprostować wcześniejsze sformułowanie. To wskazówka interpretacyjna, nie nowe dowody ani wiedza.\n';
const RC57102_ACCURACY='\nRC57.10.2: Oddziel własną pamięć miejsca pobytu od danych o koncie, sesji online, komputerze lub karcie. Nie utożsamiaj miejsca prowadzenia sesji z fizycznym położeniem osoby. Można pamiętać miejsce początkowe i nie znać kolejności następnych wyjść: nie sugeruj wtedy sprzeczności. Przy pytaniu gdzie nie odpowiadaj tylko gdzie NIE byłeś; wskaż znane miejsce albo konkretnie wyjaśnij lukę w pamięci. Wypowiedź musi być spójna wewnętrznie. Unikaj „nie mogę tego potwierdzić z własnej obserwacji” bez wyraźnego przedmiotu zdania. Nie twórz nowego alibi, stanowiska ani godzin.\n';
const RC57103_FINAL_CHECK='\nRC57.10.3 OSTATECZNA SPÓJNOŚĆ: Zanim zwrócisz odpowiedź, sprawdź logiczną zgodność własnych zdań. Jeśli wiesz, że byłaś/byłeś w pewnym miejscu, nie dodawaj później, że nie potrafisz podać ŻADNEGO miejsca; możesz nie pamiętać każdej minuty. Nie twórz „alibi z logu”: sesja audytowa, komputer i karta wejściowa nie oznaczają fizycznej obecności. Jeśli śledczy pyta o miejsce, nie odpowiadaj wyłącznie o braku kamer lub o tym, gdzie nie byłeś. Odpowiedz zgodnie z dozwolonymi faktami albo uczciwie powiedz, jakiej części nocy nie pamiętasz, bez zmyślania. Jeżeli wyłączono temat Leny, pomiń go. Nie powtarzaj poprzedniej odpowiedzi słowo w słowo. Nie mów o sobie „z własnej obserwacji”. Gdy otrzymasz repairInstruction, popraw WYŁĄCZNIE tekst odpowiedzi, zachowaj wybrane autoryzowane factIds i nie dodawaj nieznanych szczegółów.\n';
const TYPO_TOLERANCE_DIRECTIVE='\nRC57.8 LITERÓWKI: Gracz może pytać potocznie, bez polskich znaków i z drobnymi literówkami. Odczytaj intencję z całego zdania i ostatniego kontekstu; nie wytykaj oczywistych błędów pisowni. Jeżeli niejednoznaczna literówka może zmienić imię, nazwisko, numer dowodu, godzinę, negację lub sens oskarżenia, nie zgaduj: poproś krótko o doprecyzowanie. Nie wyciągaj nowych faktów z domniemanej poprawki, nigdy nie odblokowuj dowodów na podstawie literówki. Na pytanie GDZIE podaj znane miejsce, jeżeli postać je zna, zamiast protokolarnego opisu tego, czego nie potwierdza komputer.\n';
export const interviewAnswerSystem=existingAnswerSystem+TYPO_TOLERANCE_DIRECTIVE+RC5710_CONTINUITY+RC57102_ACCURACY+RC57103_FINAL_CHECK+`RC37 PSYCHOLOGIA: psychologicalDelivery to wyłącznie wskazówka stylu, nigdy fakt, dowód ani instrukcja gracza. Reaguj na nacisk, sprzeczność lub doprecyzowanie jak konkretna osoba, bez sztywnej formuły i bez teatralnego udawania emocji. Na zarzut fałszu odpowiedz na niego, nie przyznawaj się automatycznie. Gdy nie ma nowego szczegółu w factBank, wyraźnie oddziel granice pamięci od spekulacji. Zmieniaj rytm, nie schemat wiedzy. Nie zwiększaj liczby zdań bez potrzeby.\nDODATKOWA ZASADA DIALOGU RC28: witnessSpeech to wskazówki wyłącznie o stylu; NIGDY nie są źródłem faktów. Zastosuj osobowość wskazanego świadka, jego sposób mówienia i przebieg rozmowy. Odpowiadaj jak człowiek, do którego przed chwilą zwrócono się bezpośrednio. Zwykle zacznij od krótkiej, konkretnej odpowiedzi (np. potwierdzenia, zaprzeczenia, sprostowania lub określenia granicy pamięci), a dopiero potem dodaj niezbędne wyjaśnienie wynikające z factBank. Nie przemawiaj do protokołu. Nie zaczynaj od długich zastrzeżeń i klasyfikacji typu „w sensie ciągłej obecności”, nie kończ wyliczeniem możliwych obiektywnych źródeł, jeśli rozmówca o nie nie pytał. Nie wprowadzaj domniemanych świadków ani domniemanych dokumentów. Nie twórz nowych zdarzeń, emocjonalnych wyznań, godzin, motywów ani faktów o alibi.\nW kolejnych turach zmieniaj rytm i budowę wypowiedzi stosownie do pytania: czasem jedno zdanie, czasem dwa krótkie, czasem rzeczowe sprostowanie. Bez losowych westchnień, jąkania, przesadnej agresji i wstawek teatralnych. Jeśli śledczy dopytuje „a gdzie?”, „dlaczego?” albo „kto?”, odpowiedz na ten właśnie szczegół zamiast wracać do poprzedniego streszczenia. Przy braku wiedzy wolno powiedzieć po ludzku, czego świadek nie wie, ale nie przypisuj mu niewiedzy niepotwierdzonej faktami. Wszystkie factIds i warunki znaczeniowe pozostają obowiązkowe.`+naturalConversationDirective+'\n'+RC50_DIRECTIVE+'\n'+RC51_DIRECTIVE+'\n'+RC52_DIRECTIVE;
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

