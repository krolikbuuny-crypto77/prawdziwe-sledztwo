# RC21 — ciągłość, psychologia, kontekst i spójność

## 3. Ciągłość rozmów
Dodano serwerowy stan dyskursu odtwarzany z maksymalnie 24 par zatwierdzonej rozmowy. Rozróżnia odpowiedź, zadeklarowaną granicę wiedzy, prośbę o doprecyzowanie i zapisane sprostowanie. Przy tej samej treści pytania zapisane sprostowanie oznacza wcześniejszą relację jako zastąpioną — nie zamienia jej w fakt.

Krótkie „dlaczego?” uruchamia wyjaśnienie poprzedniej wypowiedzi. Korekta „nie o to pytam” kieruje na naprawę zakresu. Te tryby wymagają audytu semantycznego, żeby samo dosłowne powtórzenie faktu nie omijało oceny trafności. Jawne ograniczenie pamięci nie jest automatycznie oznaczane jako pytanie pozostawione bez odpowiedzi. Doprecyzowanie zostaje odnotowane jako podjęte, gdy kolejny temat odpowiada wyborowi; zmiana tematu nie zamyka go automatycznie. Są to omylne wskazówki o przebiegu rozmowy, nie pełny analizator znaczenia.

## 4. Psychologia
Sześć odrębnych profili obejmuje obawę zawodową, sposób reakcji i sposób uporządkowania odpowiedzi po okazaniu dokumentu. Nacisk i rzeczowe pytania mogą zmienić ostrożność i formę wypowiedzi. Nie zmieniają faktów, pamięci o zdarzeniach, dostępu do tajemnic, reguł winy ani werdyktu. Profile nie upoważniają modelu do dodawania wspomnień lub uznawania nerwowości za dowód.

## 5. Usunięcie powtórzeń
Usuwane są wyłącznie identyczne dane powtórzone w kilku miejscach pakietu: temperament i cechy mowy występujące już w profilu osobowości, pary odniesień obecne w pełnej rozmowie oraz duplikat poprzedniej wymiany. Pełny bank faktów z ID i kolejnością oraz cała unikalna historia pozostają niezmienione. Nie skrócono kartotek na podstawie zgadywanego tematu.

Przykładowy pakiet testowy: 17681 → 15103 znaków, czyli około 14,6% mniej. To jeden przykład, nie średnia produkcyjna, pomiar tokenów ani gwarancja szybszego API.

## 6. Przegląd spójności
Znaleziono ryzyko zbyt szerokiego odczytania nowych wzajemnych potwierdzeń. Doprecyzowano:
- Marek i Janusz: rozmowa o karcie pracy w przejściu między warsztatem a administracją przed północą.
- Janusz i Kamil: roboczy kontakt przed sesją diagnostyczną.
- Te kontakty nie stanowią ciągłego potwierdzenia pobytu w przedziale 01:30–02:05.

Jest to doprecyzowanie autorskiego rozszerzenia RC19. Nie dodano nowego niezależnego dokumentu potwierdzającego te rozmowy. Wzajemne relacje nie powinny być liczone jako całonocna obserwacja ani jako dwa niezależne zapisy urządzeń.

Sprawdzono zgodność odniesień do dokumentów, identyczność kombinacji bramek tajemnic z zatwierdzonymi regułami, długość faktów (bez ucięcia), wzajemność wskazanych kontaktów i niezmieniony odcisk pierwotnego kanonu. Audyt techniczny nie jest dowodem braku wszystkich możliwych sprzeczności semantycznych.

## Testy
Przeszły nowe testy stanu rozmowy, odróżniania ograniczeń wiedzy od dopytań, zastępowania relacji zapisanym sprostowaniem, zachowania otwartego dopytania po zmianie tematu, sześciu stylów, niezmienności osobistych faktów pod naciskiem, czystego pakowania bez modyfikacji źródła i zachowania wszystkich faktów oraz unikalnej historii.

Przeszły również wcześniejsze kontrole kompilacji, kanonu i dowodów, 830 i 100 pytań, 60 przypadków polszczyzny, kartotek świadków, awarii dostawców i przekazywania pełnej wiedzy RC19. `AUDYT-SPOJNOSCI-RC21.json` zawiera ustalenia i pomiar przykładu kompresji.

Nie wykonano rzeczywistych rozmów Gemini/Groq. Nie zmierzono poprawy naturalności, skuteczności psychologii ani czasu odpowiedzi API. Maksymalna liczba prób nie została zwiększona.

## Wgranie
Ta paczka zastępuje RC20. Wgraj pełną zawartość i wykonaj Redeploy Vercel. `/api/status` powinno wskazać `6.37-CONTINUITY-COHERENCE-RC21`. Zmiany nie zostały opublikowane na Vercel. Nowy raport ma pierwszeństwo przed opisami wcześniejszych wersji. Dotychczasowe zapisane wypowiedzi nie są przepisywane; kolejne odpowiedzi korzystają z poprawionych kartotek.
