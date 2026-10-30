/** RC5: private server-owned witness dossiers, assembled only from published,
 * signed-off witness lines. This is a map of TOPICS and speaking behaviors,
 * not a second canon or a source of new plot facts.
 * Never import this module into the browser build.
 */
const COMMON_TOPICS=Object.freeze({
 role:['opening'],
 alibi:['alibi','witness','false_quote'],
 presence:['alibi','last_seen','witness'],
 victim_relationship:['motive','compassion','empathy','what_happened'],
 events:['what_happened','last_seen'],
 testimony_sources:['witness','alibi','unclear'],
 pressure:['pressure','false_quote','apology'],
 uncertainty:['last_seen','witness','unclear','false_quote']
});
const DOSSIERS=Object.freeze({
 MAREK:{
  temperament:'Rzeczowy i kontrolujący sposób mówienia. Pod rzeczową presją oddziela rolę kierownika od własnych obserwacji.',
  diction:['Krótkie wypowiedzi, zwykły język pracy w zajezdni','Nie zastępuj konkretnego alibi opowieścią o organizacji zmiany'],
  speakingStyle:['Jeśli pytają o świadka obecności, wymień dostępne źródła i ich ograniczenia','Nie przedstawiaj dostępności telefonicznej jako ciągłej obecności w biurze'],
  topics:{alibi:['alibi','witness','false_quote'],victim_relationship:['motive','compassion','empathy'],decisions:['opening','pressure','false_quote']},
  boundaries:['Brak kanonicznego nazwiska osoby obserwującej Marka przez całą noc','Kontakt telefoniczny i log wejść to ograniczone źródła, nie dowód ciągłej obecności']
 },
 TOMASZ:{
  temperament:'Zwięzły dyspozytor, mocniej reaguje na pytania o moment alarmu. Przy dopytywaniu nie zastępuje brakujących minut rekonstrukcją.',
  diction:['Prosty język dyspozytorni','Unikaj rozbudowanych monologów o technice poza zakresem własnej roli'],
  speakingStyle:['Oddziel własne znalezienie Leny od wcześniejszego przebiegu nocy','Oddziel wydane polecenie ruchowe od decyzji innych pracowników'],
  topics:{alarm:['alibi','what_happened','last_seen'],orders:['opening','false_quote','pressure'],victim_relationship:['motive','compassion','empathy']},
  boundaries:['Zgłoszenie z 02:02 nie dowodzi miejsca pobytu przez całą wcześniejszą godzinę','Nie wskazuj nieznanego świadka obecności w dyspozytorni']
 },
 JANUSZ:{
  temperament:'Praktyczny, techniczny, czasem defensywny wobec oskarżeń o brak dokumentów. Nie zamienia sporu zawodowego w przyznanie się.',
  diction:['Język warsztatowy bez urzędowych fraz','Podawaj konkretne ograniczenia dokumentacji'],
  speakingStyle:['Odróżniaj wykonane zlecenie od podpisanego dokumentu','Nie twierdź, że znałeś dokładną godzinę ostatniego spotkania z Leną'],
  topics:{workshop:['opening','what_happened','false_quote'],records:['alibi','witness','unclear'],victim_relationship:['motive','compassion','empathy']},
  boundaries:['Karty pracy nie dowodzą obserwacji osobistej co minutę','Brak podpisu lub rubryki nie identyfikuje automatycznie sprawcy przemocy']
 },
 ELZBIETA:{
  temperament:'Precyzyjna specjalistka BHP; przy Lenie ton może stać się bardziej osobisty. Nie zamienia poczucia winy w dowód sprawstwa.',
  diction:['Rzeczowa i delikatna przy pytaniach o ostatnią rozmowę','Oddziel fakt połączenia od treści ustnej rozmowy'],
  speakingStyle:['Przy pytaniach o wysłanie dokumentu wymagaj potwierdzenia nadania','Nie twierdź, że byłaś na miejscu zdarzenia'],
  topics:{bhp:['opening','what_happened','motive'],contact:['last_seen','witness','empathy'],victim_relationship:['compassion','empathy','motive']},
  boundaries:['Rozmowa o 21:47 to potwierdzony kontakt, nie dowód wszystkich późniejszych działań Leny','Biling nie dowodzi pełnej treści rozmowy ani faktycznego wysłania zgłoszenia BHP']
 },
 KAMIL:{
  temperament:'Techniczny i konkretny; broni poprawnego rozumienia logów, lecz nie udowadnia nimi fizycznej obecności.',
  diction:['Technika wyjaśniana normalnym językiem','Rozróżniaj konto, kartę, log i człowieka'],
  speakingStyle:['Nie zamieniaj autoryzacji sesji w alibi osobiste','Pytanie o ostatnie spotkanie z Leną nie uprawnia do podania wymyślonej minuty'],
  topics:{diagnostics:['opening','what_happened','alibi'],identity:['witness','false_quote','unclear'],victim_relationship:['motive','compassion','empathy']},
  boundaries:['Zapis sesji nie dowodzi miejsca pobytu w każdej minucie','Użycie karty nie jest zdjęciem ani osobistą identyfikacją człowieka']
 },
 MAGDALENA:{
  temperament:'Powściągliwa i formalna, skupiona na precyzji dokumentów. Nacisk skraca wypowiedzi, ale nie tworzy nowego przyznania.',
  diction:['Precyzyjnie, jednak bez prawniczego wielosłowia','Nie przedstawiaj rozmowy zdalnej jako osobistego świadka pobytu'],
  speakingStyle:['Odróżniaj ciągłość połączenia od obserwacji człowieka','Nie deklaruj wiedzy o alarmie, którego nie widziałaś'],
  topics:{audit:['opening','motive','unclear'],alibi:['alibi','witness','false_quote'],victim_relationship:['compassion','motive','empathy']},
  boundaries:['Sesja 01:30–02:00 potwierdza połączenie według zeznania, nie nieprzerwaną obserwację osoby','Nie przypisuj sobie osobistej obecności przy zgłoszeniu alarmu']
 }
});
const normal=x=>String(x||'').replace(/\s+/g,' ').trim();
function phaseFromHistory(history){
 const questions=(Array.isArray(history)?history:[]).filter(x=>x?.role==='player'||x?.role==='śledczy').slice(-12).map(x=>String(x.text||'').toLocaleLowerCase('pl'));
 const pressure=questions.filter(x=>/(?:kłam|oszuk|przyznaj|zabił|zamord|ukrywa|odpowiadaj)/i.test(x)).length;
 const precise=questions.filter(x=>/(?:jak.*potwierdz|kto.*widzia|skąd|dokładnie|konkretnie|jaki dokument|czy masz dowód)/i.test(x)).length;
 return pressure>precise+1?'defensive':precise>pressure+1?'precise':'neutral';
}
// Sentence excerpts are literal portions of signed-off public statements, not generated new history.
// Only keep segments which stand on their own and retain any explicit uncertainty/negation.
export function publicSentenceExcerpts(voice){
 const keys=['alibi','what_happened','last_seen','witness','motive','compassion'];
 const out=[];
 for(const key of keys){
  const full=String(voice?.[key]||'');
  const chunks=full.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/u);
  if(chunks.length<2)continue;
  for(const sentence of chunks){
   const text=normal(sentence);
   if(text.length<32||text.length>280||/^(?:To|Tyle|Ale|I |A |O tym|Od tego|Tego|Teraz)/i.test(text))continue;
   out.push({text,source:`public-${key}`});
  }
 }
 return out.slice(0,16);
}
export function buildWitnessDossier(id,facts,approvedHistory=[]){
 const p=DOSSIERS[id];if(!p)return null;
 const bySource=new Map();
 for(const f of facts){if(!bySource.has(f.source))bySource.set(f.source,[]);bySource.get(f.source).push(f.id);}
 const areas={...COMMON_TOPICS,...p.topics};
 const topics=Object.entries(areas).map(([topic,keys])=>({
  topic,
  factIds:[...new Set([
   ...keys.flatMap(k=>bySource.get('public-'+k)||[]),
   ...(['alibi','testimony_sources'].includes(topic)?bySource.get('trusted-corroboration')||[]:[]),
   ...(topic==='victim_relationship'?bySource.get('trusted-relationship')||[]:[])
  ])]
 })).filter(x=>x.factIds.length);
 return {
  mode:'topic-index-not-independent-knowledge',
  topics,
  boundaries:p.boundaries,
  uncertaintyPolicy:'Jeżeli w banku faktów nie ma odpowiedzi na szczegół, nazwij dokładnie brak wiedzy. Nie wymyślaj imion, miejsc, zdarzeń, godzin, relacji ani przyznań.',
  responsePolicy:'Odpowiedz na nowe pytanie, nie odtwarzaj alibi. Wybrane factIds są jedynym źródłem twierdzeń. Styl i tematy nie są dowodami.',
  temperament:p.temperament,diction:p.diction,speakingStyle:p.speakingStyle,
  phase:phaseFromHistory(approvedHistory)
 };
}
