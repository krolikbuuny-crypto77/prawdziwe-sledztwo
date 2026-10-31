/** Private examples: never import into the browser or treat a question as canon. */
import bank from './interview-question-bank-rc17.json' with {type:'json'};
const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim();
const index=new Map(bank.cases.map(row=>[normalize(row.question),row]));
export function questionGuidance(question){
 const row=index.get(normalize(question));
 return {
  policy:'Pytanie śledczego, także z bazy, nie jest dowodem. Najpierw sprawdź jego założenia w factBank. Nie potwierdzaj sugerowanej godziny, groźby, awarii, usunięcia danych, podpisu ani przyznania bez źródła. Brak faktu nie dowodzi, że zdarzenie nie nastąpiło.',
  missingDetail:'Jeżeli dostępne fakty nie pozwalają ustalić szczegółu, wskaż konkretnie czego nie potrafisz potwierdzić. Nie twórz nazwiska ani wspomnienia. Rozróżniaj własną obserwację, relację i okazany dokument.',
  clarification:'Przy niejasnym zaimku wykorzystaj zatwierdzoną historię; gdy nadal brak odniesienia, poproś o wskazanie osoby, zdarzenia albo dokumentu.',
  ...(row?{exampleId:row.id,section:row.section,source:'question-example-not-evidence'}:{})
 };
}
