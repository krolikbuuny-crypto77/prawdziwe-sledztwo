/* RC50 — semantic multi-part coaching, computed server-side from the exact question.
 * NOT a source of knowledge, allowed facts, evidence unlocks or verdict signals.
 * The cloud provider must interpret the original question independently. */
const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const flags=Object.freeze({
  location:/\b(?:gdzie|dokad|skad|miejsce|byles|bylas|obecnos\w*|alibi)/,
  time:/\b(?:kiedy|ktorej|godzin\w*|przed|pozniej|po polnocy|wczesniej)/,
  source:/\b(?:skad wiesz|zrod|potwierdz\w*|dowod\w*|swiadek|kto widzial|kto moze)/,
  cause:/\b(?:dlaczego|czemu|powod\w*|po co|motyw|jak to wyjasn)/,
  discrepancy:/\b(?:sprzecz\w*|wczesniej powied|zmienil|inaczej|rozbiezn\w*|nie zgadza|sprostuj)/,
  action:/\b(?:zrobil|zrobilas|wykonal|polecil|podpisal|zatwierdzil|odpowiadal|przekazal)\b/
});
// RC57.1: Dopasuj odmiany fleksyjne, a nie wyłącznie rdzeń zakończony granicą wyrazu.
// To tylko wskazówka tonu rozmowy; nie dowodzi kłamstwa ani winy świadka.
const challenge=/(?:\b(?:klam\w*|oklam\w*|oszuk\w*|ukryw\w*|zataj\w*|zatai\w*|manipul\w*|przyznaj\w*|przyznac\w*|winny|winna|winne|zabil\w*|zabij\w*|zamordow\w*|sfalszow\w*|falszow\w*|oskarz\w*)\b)/;
// Gracz może przytoczyć lub zanegować zarzut bez faktycznego nacisku.
const deniedChallenge=/\b(?:nie twierdze|nie mowie|nie uwazam|nie sugeruje|nie oskarzam)\b.{0,50}?\b(?:klam\w*|oszuk\w*|ukryw\w*|winny|winna|zabil\w*)\b/g;
export const RC50_DIRECTIVE=`RC50 — ZŁOŻONE PYTANIE: interpretuj oryginalny tekst, a nie samo streszczenie; negacja „nie pytam o X, tylko o Y” wyklucza X z tematu odpowiedzi. Rozróżnij: alibi / miejsce i czas / to, kto mógł potwierdzić / rozbieżność wcześniejszej wypowiedzi. Odpowiedz osobno na każde rzeczywiste żądanie, ale krótko i naturalnie. Wyzwanie „dlaczego teraz inaczej?” wymaga porównania z własnymi rzeczywiście zapisanymi słowami; gdy brak cytatu, poproś o wskazanie i NIE potwierdzaj domniemanego kłamstwa. Pytanie wielowątkowe nie upoważnia do dopisywania faktów, godzin ani świadków. Cytat rozmówcy to zarzut, nie nowy fakt.`; 
export const RC50_AUDIT=`RC50 KONTROLA: przed uznaniem complete sprawdź, czy odpowiedź objęła wszystkie bezpośrednie pytania (miejsce, czas, źródło, wyjaśnienie i jawny zarzut), z szacunkiem dla negacji i korekty założenia. Gdy brak szczegółu w factBank, konkretne przyznanie granicy wiedzy jest poprawne; ogólnik albo odwrócenie pytania nie są poprawne. Nie oceniaj tonu jako dowodu.`;
export function analyzeMultiQuestion(question,prior=[]){
 const source=String(question||'').slice(0,1600),q=fold(source);
 const requested=Object.entries(flags).filter(([_,re])=>re.test(q)).map(([name])=>name).slice(0,6);
 const turns=Array.isArray(prior)?prior.slice(-6):[];
 // Wzorzec „nie o X, tylko o Y” dopuszcza dowolny temat i odmianę imienia.
 // Samo „nie o X” bez wskazania celu nie jest automatycznie korektą.
 const correction=/(?:\bnie\s+(?:pytam|chodzi\s+mi|mowie)\b|\bnie\s+o\s+.{1,100}?\b(?:tylko|lecz|ale|a)\s+o\b|\b(?:nie o to chodzi|chodzi mi o|poprawiam pytanie|sprostuje pytanie|mialem na mysli|mialam na mysli|tylko pytam|a konkretnie)\b)/.test(q);
 const negatedScope=correction?'Odczytaj część po „tylko / chodzi mi o” jako cel; odrzuć temat wyłączony przez negację.':'Brak jawnej korekty zakresu.';
 return Object.freeze({authority:'style_and_completeness_only',requested,correction,challenge:challenge.test(q.replace(deniedChallenge,' ')),
  multipleTargets:requested.length>=2||/[?].*\?/s.test(source),
  negatedScope,reference:'Powiąż zaimki i „wcześniej” z rzeczywistą zatwierdzoną historią; przy braku jednoznaczności dopytaj.',
  contextTurns:turns.length});
}
