/** RC32 — dramaturgia wypowiedzi, nigdy źródło faktów ani postępu śledztwa.
 * Wejście: pytanie i historia zaakceptowana przez serwer dla jednego świadka.
 * Wskazówki są omylne. Fakty, audyt semantyczny i dowody mają pierwszeństwo.
 */
import {foldQuestion} from './question-intent-633.js';

const normalize=s=>foldQuestion(String(s||'')).replace(/\s+/g,' ').trim();
const categories=Object.freeze({
 MAREK:'Powściągliwy kierownik. Na zarzut niejasnej relacji reaguje zwięzłym sprostowaniem, nie wykładem o swojej niewinności.',
 TOMASZ:'Zmęczony dyspozytor. Trzyma się własnych słów, ale bez ciągłego cytowania godzin i zapisów.',
 JANUSZ:'Pracownik warsztatu. Mówi prosto, czasem szorstko; nie używa języka kancelarii.',
 ELZBIETA:'Specjalistka BHP. Uważna, przy temacie Leny bardziej osobista; nie składa bezpodstawnego wyznania.',
 KAMIL:'Technik. Konkretny i rzeczowy, bez automatycznej lekcji o tym, czym są logi.',
 MAGDALENA:'Audytorka. Ostrożna i precyzyjna, lecz nie zastępuje każdej odpowiedzi formalną odmową.'
});

// Detekcja służy wyłącznie do tonu i ukierunkowania odpowiedzi, nie do doboru
// faktów, zmiany znaczenia pytania ani przypisania podejrzenia do kanonu.
export function classifyDialogueMove(question,hasEvidence=false){
 const q=normalize(question);
 if(hasEvidence)return 'shown_evidence';
 if(/\b(?:zabil\w*|zamordow\w*|morder\w*|zaboj\w*|przemoc\w*|pobil\w*|skrzywdzil\w*|ukar\w* za zabojstwo)\b/.test(q))return 'crime_accusation';
 if(/\b(?:ukryw\w*|zataj\w*|krecisz|klamiesz|klamie|sciemniasz|cos przede mna|cos mi nie gra|nie wierze ci|nie wierze panu|nie mowisz wszystkiego)\b/.test(q))return 'suspicion';
 if(/\b(?:dlaczego|czemu|po co)\b/.test(q)&&/\b(?:wczesniej|od razu|nie powiedzial\w*|teraz dopiero|dopiero teraz)\b/.test(q))return 'late_disclosure';
 if(/\b(?:gdzie|dokad|skad wrac|w ktorym miejscu)\b/.test(q))return 'where';
 if(/\b(?:kto|ktos)\b/.test(q)&&/\b(?:potwierdz\w*|poswiadcz\w*|widzial\w*|swiad\w*)\b/.test(q))return 'corroboration';
 if(/\balibi\b/.test(q))return 'alibi';
 if(/\b(?:dlaczego|czemu|po co)\b/.test(q))return 'why';
 return 'general';
}

const actions=Object.freeze({
 alibi:'Zacznij od jednoznacznego tak/nie lub zakresu alibi. Nie definiuj pojęcia „alibi”. Nie kończ automatycznie listą dokumentów.',
 corroboration:'Pytanie dotyczy osoby. Oddziel tych, którzy potwierdzają pojedynczy kontakt, od osoby obserwującej pobyt; nikogo nie dopisuj.',
 where:'Odpowiedz o miejscu pobytu w zakresie znanych faktów. Jeśli brak dokładnej lokalizacji lub godziny, nazwij brak krótko. Nie uciekaj do rejestrów, kiedy gracz wyklucza dokumenty.',
 late_disclosure:'Odpowiedz na pretensję o wcześniejsze sformułowanie. Zanim powiesz „przecież mówiłem”, sprawdź dosłowną historię. Wolno wyjaśnić niejasność bez nowej wersji zdarzeń; nie recytuj całego alibi.',
 suspicion:'To podejrzenie zatajenia, NIE automatycznie zarzut zabójstwa ani przemocy. Odnieś się do nieufności i konkretnej luki; nie broń się przed niepostawionym zarzutem.',
 crime_accusation:'Zarzut czynu dotyczy poważnej sprawy. Reaguj zgodnie z wiedzą, bez automatycznego przyznania się i bez rozwlekłej mowy obronnej.',
 why:'Wyjaśnij przyczynę ostatniej czynności, jeśli masz o niej zatwierdzoną wiedzę. Nie podawaj zamiast przyczyny ponownie opisu czynności.',
 shown_evidence:'Odnieś się do tego, co rzeczywiście okazano; odróżniaj dokument od osobistej obserwacji, bez wprowadzenia innych dowodów.',
 general:'Reaguj na dokładny sens wypowiedzi, bez recytowania pełnego profilu stanowiska i wszystkich zastrzeżeń.'
});

export function dialogueDirection(scene){
 const move=classifyDialogueMove(scene?.question,Boolean(scene?.presentedEvidence));
 const history=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const recent=history.filter(x=>x?.role==='witness'&&x.narrativeStatus!=='offline_unverified').slice(-2);
 const last=normalize(recent.at(-1)?.text);
 const q=normalize(scene?.question);
 const mentionedRecords=/\b(?:rejestr\w*|dokument\w*|zapis\w*|polaczen\w*|log\w*|biling\w*)\b/.test(last);
 const noDocuments=/\b(?:nie pytam o dokument\w*|nie o dokument\w*|bez dokument\w*|nie pytam o rejestr\w*|nie o rejestr\w*)\b/.test(q);
 const reciting=recent.length===2&&recent.every(x=>/rejestr|dokument|zapis|polaczen|log/i.test(normalize(x.text)));
 const priorQuestions=history.filter(x=>x?.role==='player').slice(-8);
 const pushback=priorQuestions.filter(x=>classifyDialogueMove(x.text)==='suspicion'||classifyDialogueMove(x.text)==='crime_accusation').length;
 const pressureCue=pushback>=2?'W tej rozmowie pojawiały się już zarzuty. Możesz odpowiadać bardziej stanowczo i krócej, ale nie tracisz kontroli ani nie przyznajesz nowych faktów.':
   move==='suspicion'?'Zareaguj na nieufność osobiście, bez szablonowej mowy obrończej. Nie musisz brzmieć zdenerwowanie, by zabrzmieć jak człowiek.':'';
 const avoidSources=(noDocuments||mentionedRecords||reciting)&&!['shown_evidence'].includes(move)&&
   !/\b(?:rejestr\w*|dokument\w*|zapis\w*|skad wiesz|na jakiej podstawie|dowod\w*|zrodl\w*)\b/.test(q.replace(/nie pytam o dokument\w*|nie o dokument\w*|nie pytam o rejestr\w*|nie o rejestr\w*/g,''));
 return {
  kind:move,
  status:'interpretation-hint-not-fact',
  character:categories[scene?.identity?.id]||'',
  responseApproach:actions[move],
  ...(pressureCue?{pressureCue}:{}),
  ...(avoidSources?{avoidDefaultCaveat:'Źródła i rejestry zostały już omówione lub są wykluczone w pytaniu. Nie powtarzaj ich domyślnie. Wyjątek: bez takiego zastrzeżenia odpowiedź sugerowałaby nieprawdziwą pewność.'}:{}),
  rhythm:'Zwykle 1–2 krótkie zdania; pytanie złożone może wymagać więcej. Nie powtarzaj słowo w słowo poprzedniej wypowiedzi. Nie dodawaj teatralnych gestów, wymyślonych emocji ani nowych faktów.'
 };
}
