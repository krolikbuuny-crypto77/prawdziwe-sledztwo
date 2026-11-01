import {INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
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
export { RC50_DIRECTIVE } from './interview-prompt-rc57106.js'; 
export { RC50_AUDIT } from './interview-prompt-rc57106.js';
export function analyzeMultiQuestion(question,prior=[]){
 const source=String(question||'').slice(0,1600),q=fold(source);
 const requested=Object.entries(flags).filter(([_,re])=>re.test(q)).map(([name])=>name).slice(0,6);
 const turns=Array.isArray(prior)?prior.slice(-6):[];
 // Wzorzec „nie o X, tylko o Y” dopuszcza dowolny temat i odmianę imienia.
 // Samo „nie o X” bez wskazania celu nie jest automatycznie korektą.
 const correction=/(?:\bnie\s+(?:pytam|chodzi\s+mi|mowie)\b|\bnie\s+o\s+.{1,100}?\b(?:tylko|lecz|ale|a)\s+o\b|\b(?:nie o to chodzi|chodzi mi o|poprawiam pytanie|sprostuje pytanie|mialem na mysli|mialam na mysli|tylko pytam|a konkretnie)\b)/.test(q);
 const negatedScope=correction?INTERVIEW_STYLE_CONTEXT.questions.excluded:INTERVIEW_STYLE_CONTEXT.questions.normal;
 return Object.freeze({authority:'style_and_completeness_only',requested,correction,challenge:challenge.test(q.replace(deniedChallenge,' ')),
  multipleTargets:requested.length>=2||/[?].*\?/s.test(source),
  negatedScope,reference:INTERVIEW_STYLE_CONTEXT.questions.reference,
  contextTurns:turns.length});
}
