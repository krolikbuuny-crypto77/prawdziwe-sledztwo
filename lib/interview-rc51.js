/* RC51 — individual response cadence from approved history; STYLE ONLY.
 * Not a fact bank, no new statement, no emotional state or secret. */
const clean=v=>String(v||'').trim();
const patterns=Object.freeze({
 MAREK:'Krótkie, rzeczowe sprostowania; rozdziela obowiązek służbowy od osobistej obecności.',
 TOMASZ:'Potoczna, oszczędna odpowiedź; gdy brak pamięci, mówi wprost bez rozbudowanego referatu.',
 JANUSZ:'Techniczny konkret, nie myli wykonania pracy z wpisem do protokołu.',
 ELZBIETA:'Uważne, spokojne słowa; oddziela zgłoszenie od jego przyjęcia.',
 KAMIL:'Precyzyjna mowa o ograniczeniach danych, bez traktowania identyfikatora jako osoby.',
 MAGDALENA:'Zwięzły opis zakresu dokumentu, bez automatycznego przypisywania intencji.'
});
export const RC51_DIRECTIVE=`RC51 — RYTM ŻYWEJ ROZMOWY: wypowiedź ma zabrzmieć jak reakcja konkretnej postaci na OSTATNIE pytanie. Przy krótkim pytaniu najczęściej jedno zdanie, ewentualnie drugie tylko gdy potrzebna granica wiedzy. Przy złożonym odnieś się do kilku części jasno, bez listy urzędowej. Nie zaczynaj zawsze od „Nie mogę potwierdzić”, „W sensie”, „Z dokumentacji”, „Rozumiem pytanie”; nie kończ każdej odpowiedzi sugestią sprawdzenia rejestru. Jeśli gracz pyta kolejny raz o to samo, rozpoznaj to jednym naturalnym sprostowaniem, ale nie dopisuj nieistniejących szczegółów. Bez didaskaliów, teatralnego wzdychania, improwizowania motywów i emocji. Możesz przyznać brak wiedzy jedynie wtedy, gdy odpowiada on rzeczywistym ograniczeniom w dozwolonych faktach. Wszystkie factIds muszą pozostać ugruntowane.`;
export function speechCadence(scene){
 const identity=clean(scene?.identity?.id).toUpperCase();
 const question=clean(scene?.question);
 const prior=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const lastReplies=prior.slice(-12).filter(x=>x&&['witness','npc','świadek'].includes(x.role)).map(x=>clean(x.text)).filter(Boolean).slice(-4);
 const long=question.length>160||question.split('?').length>2;
 return Object.freeze({authority:'style_only_not_fact',individualVoice:patterns[identity]||'Zachowaj charakter i język postaci.',
  targetLength:long?'2–4 krótkie zdania, o ile jest kilka niezależnych pytań':'zwykle 1–2 krótkie zdania',
  repeatedOpeners:lastReplies.map(t=>t.split(/\s+/).slice(0,4).join(' ')).filter(Boolean),
  avoid:'Wyrównywania długości wypowiedzi i przytaczania całego alibi przy każdej turze.'});
}
