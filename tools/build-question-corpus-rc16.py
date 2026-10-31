"""Curated regression prompts; no game dialogue templates or automatic API calls."""
from pathlib import Path
import json

groups = [
 ('alibi', 'Zakres alibi', [
 'Masz alibi?', 'Jakie jest pana alibi?', 'Gdzie byłeś w noc zdarzenia?',
 'Czy przez całą noc siedziałeś w biurze?', 'Co robiłeś, kiedy nadzorowałeś zmianę?',
 'Byłeś dostępny z biura czy cały czas w biurze?', 'Czy twoje alibi obejmuje każdą minutę nocy?',
 'Co w twoim alibi jest pewne, a czego nie potwierdzisz?',
 'Czy kierowanie zmianą dowodzi, że nie opuszczałeś biura?', 'Skąd pewność, że twoje alibi jest pełne?'
 ], ['public-alibi','public-witness'], 'Oddziel nadzorowanie zmiany i dostępność od ciągłej fizycznej obecności.',
 ['Nie przedstawiaj pełnego alibi jako udowodnionego.', 'Nie dopisuj godzin ani miejsc wyjścia.']),
 ('person', 'Osobowy świadek obecności', [
 'Kto to potwierdzi?', 'Kto może potwierdzić twoje alibi?', 'Kto cię wtedy widział?',
 'Czy ktoś widział cię w biurze przez całą noc?', 'Podaj osobę, która może poświadczyć twoją obecność.',
 'Masz świadka, a nie tylko rejestr?', 'Czy jest ktoś, kto widział, że nie wychodziłeś?',
 'Kto potwierdzi to osobiście?', 'Czy ktokolwiek obserwował cię przez cały dyżur?',
 'Nie pytam o dokumenty. Który człowiek cię widział?'
 ], ['public-alibi','public-witness'], 'Odpowiedz o osobowej obserwacji; gdy faktów o niej brak, jasno nazwij brak takiego potwierdzenia.',
 ['Nie wymyślaj świadka ani nazwiska.', 'Nie odpowiadaj wyłącznie rejestrami i połączeniami.']),
 ('records', 'Granice rejestru wejść', [
 'Co właściwie potwierdza rejestr wejść?', 'Czy rejestr dowodzi, że ani razu nie wyszedłeś?',
 'Wpis w rejestrze to dowód obecności przez całą noc?', 'Czy sam rejestr wystarczy do potwierdzenia alibi?',
 'Czego rejestr nie pozwala ustalić o twojej obecności?', 'Nie pytam, czy rejestr istnieje. Co z niego wynika?',
 'Czy brak wpisu o wyjściu oznacza, że cały czas siedziałeś w biurze?',
 'Jak odróżniasz zapis wejścia od ciągłej obserwacji osoby?',
 'Czy możemy uznać twoje alibi za pewne tylko na podstawie rejestru?',
 'Dlaczego odsyłasz do rejestru, skoro pytam o całą noc?'
 ], ['public-alibi','public-witness'], 'Wyjaśnij ograniczony charakter zapisu bez dopisywania jego zawartości.',
 ['Nie wymyślaj konkretnych wpisów i godzin.', 'Nie utożsamiaj rejestru z osobowym świadkiem.']),
 ('phone', 'Telefon a miejsce pobytu', [
 'Czy rozmowa telefoniczna dowodzi, że byłeś w biurze?', 'Co potwierdzają połączenia służbowe?',
 'Można było dodzwonić się do ciebie także poza biurem?', 'Czy telefon pokazuje, gdzie fizycznie stałeś?',
 'Byłeś pod telefonem, ale czy to znaczy, że nie wychodziłeś?',
 'Ktoś z tobą rozmawiał czy ktoś cię widział?', 'Czego nie dowiemy się z samych połączeń?',
 'Czy dostępność telefoniczna daje ci pełne alibi?', 'Nie pytam o kontakt. Pytam o twoje położenie.',
 'Czy połączenia potwierdzają całonocną obecność, czy tylko możliwość kontaktu?'
 ], ['public-witness','public-alibi'], 'Oddziel kontakt telefoniczny od ustalenia fizycznego miejsca pobytu.',
 ['Nie dopisuj urządzenia, lokalizacji ani rozmówcy.', 'Nie traktuj połączenia jako dowodu miejsca.']),
 ('relationship', 'Znajomość Leny', [
 'Znałeś ofiarę?', 'Znał pan Lenę Rudnicką?', 'Kim była dla ciebie Lena?',
 'Jakie relacje łączyły cię z tą kobietą?', 'Skąd znałeś zmarłą?',
 'Co was łączyło poza pracą?', 'Czy Lena była twoją podwładną?',
 'Jak ją znałeś jako kierownik zajezdni?', 'Czy szanowałeś Lenę mimo sporów?',
 'Nie pytam o alibi. Pytam, jaka była wasza relacja.'
 ], ['trusted-relationship'], 'Opisz relację zawodową i granice znanej relacji; nie dopowiadaj życia prywatnego.',
 ['Nie opisuj Leny jako mężczyzny.', 'Nie wymyślaj bliskości prywatnej ani wrogości.']),
 ('actor', 'Kto zgłaszał zastrzeżenia', [
 'Kto zgłaszał zastrzeżenia do bezpieczeństwa wagonu?', 'To Lena zgłaszała uwagi czy ty?',
 'Czy to ty zgłaszałeś Lenie zastrzeżenia?', 'Kto komu zwracał uwagę na bezpieczeństwo wagonu?',
 'Czyje były zastrzeżenia, twoje czy Leny?', 'Lena miała uwagi do wagonu czy ty do niej?',
 'Nie odwracaj ról: kto zgłaszał problem?', 'Czy powiedziałeś, że zgłaszałeś jej zastrzeżenia?',
 'Czy zgłaszającą była Lena Rudnicka?', 'Powiedz jednoznacznie, kto zgłaszał uwagi dotyczące bezpieczeństwa.'
 ], ['trusted-relationship','public-motive'], 'Zachowaj kierunek czynności: Lena zgłaszała zastrzeżenia dotyczące bezpieczeństwa wagonu.',
 ['Nie przypisuj tej czynności Markowi.', 'Nie dopisuj adresata konkretnego zgłoszenia.']),
 ('source', 'Źródło i granice wiedzy', [
 'Skąd wiesz, że Lena zgłaszała zastrzeżenia?', 'Co wiesz osobiście, a co wynika z dokumentów?',
 'Czy widziałeś moment zgłoszenia uwag przez Lenę?', 'Czy możesz przytoczyć dokładne słowa Leny?',
 'Czy pamiętasz godzinę, o której zgłosiła problem?', 'Czy masz pewność, komu Lena przekazała zgłoszenie?',
 'Czy znasz treść konkretnego zgłoszenia, czy tylko fakt zastrzeżeń?',
 'Co możesz potwierdzić bez zaglądania do nieokazanego dokumentu?',
 'Czy mówisz o własnej obserwacji, czy o ogólnej wiedzy o Lenie?',
 'Jeżeli nie znasz szczegółu, powiedz którego dokładnie.'
 ], ['trusted-relationship','public-motive'], 'Podaj tylko dostępny zakres wiedzy; nie twórz obserwacji, cytatu ani nieokazanego dokumentu.',
 ['Nie dopisuj godziny, kanału zgłoszenia ani jego adresata.', 'Nie udawaj osobistej obserwacji bez źródła.']),
 ('followup', 'Krótkie pytania z kontekstem', [
 'A kto dokładnie?', 'Osobiście?', 'Przez całą noc?', 'Kto cię widział na własne oczy?',
 'To człowiek czy tylko zapis?', 'I to ma potwierdzać twoją obecność?',
 'A skąd ten ktoś miałby to wiedzieć?', 'Co z przerwami między połączeniami?',
 'Czy to obejmuje każdą chwilę?', 'Czyli nikt nie widział cię cały czas?'
 ], ['public-alibi','public-witness'], 'Rozwiąż odniesienie do poprzedniej odpowiedzi o alibi; nie traktuj jej jako nowego dowodu.',
 ['Nie zmieniaj tematu na Lenę.', 'Nie wymyślaj osoby sugerowanej zaimkiem „ktoś”.']),
 ('negation', 'Przeczenia i korekta założenia', [
 'Nie pytam o rejestr, tylko o osobę, która cię widziała.',
 'Nie twierdzę, że kłamiesz. Chcę wiedzieć, kto potwierdzi twoje alibi.',
 'Nie pytam o Lenę. Pytam, czy ktoś widział cię w biurze.',
 'Nie mówię, że wyszedłeś. Czy masz dowód, że nie wychodziłeś?',
 'Nie chodzi mi o rozmowy telefoniczne, tylko o fizyczną obecność.',
 'Nie pytam, czy zgłaszałeś Lenie uwagi. Czy to ona zgłaszała problem?',
 'Nie przypisuję ci zastrzeżeń Leny. Chcę ustalić, czyje były.',
 'Nie pytam o prywatną znajomość, tylko o relację służbową z Leną.',
 'Nie zakładam, że rejestr jest fałszywy. Pytam, czego nie potwierdza.',
 'Nie żądam nazwiska na siłę. Czy możesz uczciwie wskazać osobowego świadka?'
 ], ['trusted-relationship','public-alibi','public-witness'], 'Odpowiedz na dodatnią część pytania; nie przyjmuj zanegowanego założenia jako faktu.',
 ['Nie reaguj automatycznie jak na oskarżenie.', 'Nie zamieniaj zaprzeczenia w przyznanie faktu.']),
 ('compound', 'Pytania złożone', [
 'Gdzie byłeś i kto może to potwierdzić?', 'Jakie masz alibi i czego ono nie obejmuje?',
 'Kto cię widział i co niezależnie potwierdzają połączenia?',
 'Czy byłeś całą noc w biurze, a jeśli nie wiesz, co możesz potwierdzić?',
 'Znałeś Lenę i jak wyglądała wasza relacja zawodowa?',
 'Kto zgłaszał zastrzeżenia i czego one dotyczyły?',
 'Czyje były uwagi do bezpieczeństwa i czy możesz podać ich dokładną treść?',
 'Co potwierdza rejestr, co telefon, a czego nie potwierdza żadne z nich?',
 'Czy masz osobowego świadka i czy może poświadczyć całą noc?',
 'Czy szanowałeś Lenę i czy wasze spory dowodzą czyjejkolwiek winy?'
 ], ['trusted-relationship','public-alibi','public-witness','public-motive'], 'Odpowiedz na każdą część pytania, podając konkretne ograniczenie tam, gdzie brakuje faktów.',
 ['Nie pomijaj drugiej części pytania.', 'Nie wyprowadzaj winy ze sporu zawodowego.'])
]

alibi_history = [
 {'role':'player','text':'Masz alibi?'},
 {'role':'witness','text':'Nadzorowałem zmianę i byłem dostępny z biura. Nie mam potwierdzenia ciągłej obecności w biurze.','narrativeStatus':'reported_statement'}
]
followup_history = alibi_history + [
 {'role':'player','text':'Co potwierdza twoją wersję?'},
 {'role':'witness','text':'Mojej dostępności mogą dotyczyć połączenia służbowe, ale telefon nie potwierdza, gdzie fizycznie stałem.','narrativeStatus':'reported_statement'}
]
rows=[]
for key,title,questions,sources,requirement,prohibited in groups:
 assert len(questions)==10
 for question in questions:
  history=followup_history if key=='followup' else alibi_history if key in {'person','records','phone','negation','compound'} else []
  rows.append({'id':f'RC16-{len(rows)+1:03}','category':key,'categoryTitle':title,'witnessId':'MAREK',
   'question':question,'approvedHistory':history,'requiredPublicSources':sources,
   'rubric':{'mustAddress':requirement,'mustNot':prohibited,'evaluation':'semantic_review_required'},
   'liveResult':{'status':'not_run','provider':None}})
assert len(rows)==100 and len({r['question'] for r in rows})==100
root=Path(__file__).resolve().parent.parent
fixture=root/'tools/fixtures/interview-questions-rc16.json'
fixture.write_text(json.dumps({'schema':'ps-interview-regression/1','version':'RC16','purpose':'regression_tests_not_dialogue_templates','cases':rows},ensure_ascii=False,indent=2)+'\n')
lines=['# Baza 100 pytań regresyjnych — RC16','','Każdy przypadek dotyczy Marka Nowickiego i publicznych faktów na początku gry. To testy jakości, nie gotowe odpowiedzi świadków. Wyniki rzeczywistych API: nieuruchomione.','']
for key,title,questions,sources,requirement,prohibited in groups:
 lines+=['## '+title,'',requirement,'','Nie dopuszczamy: '+' '.join(prohibited),'']
 for row in [r for r in rows if r['category']==key]:lines.append(f"- **{row['id']}** — {row['question']}")
 lines+=['']
(root/'BAZA-PYTAN-RC16.md').write_text('\n'.join(lines)+'\n')
print('Created 100 unique questions, 10 categories, history, rubric and explicit untested live status')
