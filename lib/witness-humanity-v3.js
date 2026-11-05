/**
 * Żywi świadkowie 3.0 — serwerowa warstwa sposobu ODPOWIEDZI, nie treści faktów.
 * Źródła: tylko zatwierdzony wątek danego świadka i bieżące pytanie.
 * Nie korzysta z podanych przez klienta ocen emocji, jego pamięci ani z
 * zeznań innych świadków. Nie zmienia żadnego warunku odblokowywania gry.
 */

const VOICES=Object.freeze({
 MAREK:Object.freeze({register:'Powściągliwy przełożony',cadence:'Zaczyna od krótkiej odpowiedzi; doprecyzowuje tylko potrzebną lukę.',defence:'Oddziela własny zakres odpowiedzialności od przypisywanej mu winy; nie wygłasza przemówień.',avoid:'urzędowe wykazy czynności i automatyczne powtarzanie rejestrów'}),
 TOMASZ:Object.freeze({register:'Zmęczony, konkretny dyspozytor',cadence:'Raczej krótkie zdania. Prostuje szczegół bez opowiadania całej nocy od początku.',defence:'Na nacisk odpowiada ostrożniej, ale nie wymyśla dodatkowych godzin.',avoid:'szablonowe tłumaczenie, czym są dokumenty i logi'}),
 JANUSZ:Object.freeze({register:'Pracownik warsztatu, bezpośredni',cadence:'Proste słowa i krótkie zdania; nie zamienia się w rzecznika prasowego.',defence:'Gdy kwestionuje się jego słowa, może odpowiedzieć stanowczo, a następnie konkretnie.',avoid:'formalny język przesłuchań i wieloczłonowe definicje'}),
 ELZBIETA:Object.freeze({register:'Uważna i empatyczna specjalistka BHP',cadence:'Precyzyjnie rozróżnia własną obserwację, zgłoszenie i ocenę.',defence:'Na trudne pytanie odpowiada rzeczowo, bez sztucznego chłodu i nieuzasadnionych wyznań.',avoid:'automatyczne formuły z protokołu i deklarowanie nieznanych uczuć'}),
 KAMIL:Object.freeze({register:'Technik, oszczędny w słowach',cadence:'Najpierw konkret, potem tylko potrzebne zastrzeżenie o źródle.',defence:'Nie traktuje każdego pytania jak okazji do wykładu o systemach.',avoid:'bezwiedne wymienianie sprzętu, logów i procedur'}),
 MAGDALENA:Object.freeze({register:'Audytorka, uważna na niuanse',cadence:'Ścisłe rozróżnienie faktu od wniosku, ale naturalnym językiem.',defence:'Nie zastępuje odpowiedzi formalną odmową; otwarcie mówi o granicy wiedzy.',avoid:'nadmiar zastrzeżeń i bezosobowe sformułowania'})
});
const FOLD=s=>String(s||'').toLocaleLowerCase('pl').replace(/ł/g,'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const starts=txt=>String(txt||'').replace(/\s+/g,' ').trim().split(/\s+/u).slice(0,8).join(' ').slice(0,100);
const negatedCharge=q=>/(?:\bnie (?:oskarzam|twierdze|uwazam|mowie|sugeruje|zarzucam)\b.{0,65}\b(?:klam|zabil|zabojst|ukryw|zataj|oszuk|morder))/.test(q);
const accusation=q=>/(?:\b(?:klamiesz|klamie|klamiesz mi|oklamujesz|zatailes|zatailas|ukrywasz|krecisz|oszukujesz|nie wierze ci|nie wierze panu|nie wierze pani)\b|\b(?:zabiles|zabilas|zamordowales|zamordowalas)\b)/.test(q);
const questions=history=>history.filter(x=>x?.role==='player'&&typeof x.text==='string').slice(-18);
const answers=history=>history.filter(x=>x?.role==='witness'&&x.narrativeStatus!=='offline_unverified'&&typeof x.text==='string').slice(-5);
function move(question,exhibit){
 const q=FOLD(question);
 if(exhibit)return 'okazany_dowod';
 if(/\b(?:co powiedzial|przypomnij|powtorz|pierwsz[aey]|poprzedni[aey]|na poczatku rozmowy)\b/.test(q)&&/\b(?:powiedzial|odpowied|zeznan|rozmow|wypowied|slowa)\b/.test(q))return 'wczesniejsze_slowa';
 if(/\b(?:sprostuj|sprostowanie|przed chwila|zmieniles|zmienilas|popraw swoj)\b/.test(q))return 'sprostowanie';
 if(/\b(?:rozumiem|przykro mi|nie chce naciskac|nie naciskam|spokojnie|dziekuje za szczerosc)\b/.test(q))return 'empatia';
 if(negatedCharge(q))return 'wykluczenie_zarzutu';
 if(accusation(q))return 'nacisk';
 if(/\b(?:skad (?:to |o tym )?wiesz|co potwierdz\w*|na jakiej podstawie|jak to sprawdzic|kto (?:moze (?:to )?)?potwierdz\w*|zrodl\w*)\b/.test(q))return 'weryfikacja';
 if(/\b(?:nie pytam o|nie interesuje mnie|nie chodzi mi o)\b.{0,120}\b(?:tylko|lecz|ale)\b/.test(q))return 'doprecyzowanie_zakresu';
 return 'neutralne';
}
const COACH=Object.freeze({
 okazany_dowod:'Odnieś się do FAKTYCZNIE okazanego dowodu; nie przypisuj mu informacji, których nie ma w zatwierdzonej wiedzy.',
 wczesniejsze_slowa:'Jeśli przytaczasz wcześniejszą wypowiedź, porównaj jej dosłowny zapis i numer tury. Nie przenoś późniejszej informacji do pierwszej odpowiedzi.',
 sprostowanie:'Najpierw sprawdź własne zatwierdzone słowa. Jeśli zarzut nie wynika z ich treści, zakwestionuj go bez wymyślania sprzeczności.',
 empatia:'Możesz odpowiedzieć nieco swobodniej, nadal w granicach wiedzy. Nie przypisuj sobie niepotwierdzonych uczuć z nocy zdarzenia.',
 wykluczenie_zarzutu:'Gracz jawnie wykluczył zarzut. Nie odpowiadaj jak na oskarżenie o zabójstwo ani nie wypieraj się czynu, o który nie zapytano.',
 nacisk:'Odnieś się do konkretnego zarzutu, możesz być stanowczy. Sam nacisk nie dowodzi winy ani nie zmienia faktów.',
 weryfikacja:'Odpowiedz skąd wiesz lub kto to potwierdzi, rozróżniając obserwację, relację i zapis. Nie przedstawiaj samego rejestru jako świadka.',
 doprecyzowanie_zakresu:'Odpowiedz przede wszystkim na żądany temat po „tylko”, nie wracaj bez potrzeby do wykluczonego tematu.',
 neutralne:'Zacznij od odpowiedzi na aktualne pytanie. Nie wygłaszaj całego alibi bez potrzeby.'
});
/** Dane obliczeniowe ograniczone do 18 pytań i 5 wcześniejszych odpowiedzi. */
export function buildWitnessHumanityV3(scene){
 const id=scene?.identity?.id;
 if(!VOICES[id])return null;
 const history=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const qs=questions(history),as=answers(history);
 const active=move(scene?.question,Boolean(scene?.presentedEvidence));
 const pressure=qs.filter(x=>move(x.text,false)==='nacisk').length;
 const empathy=qs.filter(x=>move(x.text,false)==='empatia').length;
 const verification=qs.filter(x=>move(x.text,false)==='weryfikacja').length;
 // Stany opisują dynamikę rozmowy, NIE prawdziwe emocje, motywacje lub winę.
 const guarded=clamp(18+pressure*9-empathy*5,0,85);
 const rapport=clamp(45+empathy*8+verification*2-pressure*5,10,85);
 const fatigue=clamp(Math.max(0,history.length-20)/4,0,60);
 const lastOpenings=[...new Set(as.slice(-3).map(x=>starts(x.text)).filter(Boolean))];
 const last=FOLD(as.at(-1)?.text);
 const avoidRecords=/\b(?:rejestr\w*|dokument\w*|zapis\w*|log\w*)\b/.test(last)&&
  !/\b(?:rejestr\w*|dokument\w*|zapis\w*|log\w*|zrodl\w*|dowod\w*)\b/.test(FOLD(scene?.question));
 return {
  version:'3.0',authority:'delivery_only_not_knowledge_or_evidence',
  interpretation:{move:active,confidence:'heuristic_not_fact',responseApproach:COACH[active]},
  relationship:{guardedness:Math.round(guarded),rapport:Math.round(rapport),fatigueCue:Math.round(fatigue),
   note:'Liczby są wskaźnikami rytmu rozmowy, NIE dowodem rzeczywistych uczuć świadka, a ich źródłem nie jest klient.'},
  voice:{...VOICES[id]},
  variation:{recentOpeningsToAvoid:lastOpenings,avoidUnpromptedRecords:avoidRecords,
   lengthHint:fatigue>40?'Najpierw krótka odpowiedź; dołącz ograniczenia wiedzy tylko gdy są istotne.':'Zwykle 1–3 naturalne zdania; więcej, jeśli pytanie jest złożone.',
   rule:'Różnicuj konstrukcję zdań, nie powtarzaj gotowych formułek. Nie dodawaj „yyy”, gestów ani nowych faktów wyłącznie dla naturalności.'},
  integrity:'Plan nie może ujawniać faktów spoza factBank, zmieniać postępu ani autoryzować kłamstwa. Zaakceptowane cytaty są HISTORIĄ wypowiedzi, nie prawdą fabularną.'
 };
}
