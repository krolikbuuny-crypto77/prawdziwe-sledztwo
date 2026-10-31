# RC20 — wielowątkowość i polszczyzna przesłuchań

## Zmiany wykonane w kodzie

1. Naprawiono błąd transportu audytu. Funkcja usuwająca lokalne klasyfikacje przed generowaniem usuwała również `questionParts` z żądania niezależnego audytora. Audytor miał zwracać `coveredParts`, ale nie dostawał listy, do której te wyniki miały się odnosić. Teraz lista trafia do audytu; lokalna klasyfikacja nadal nie narzuca generatorowi interpretacji.
2. Dodano nieautorytatywne wskazówki pragmatyczne: oryginalne segmenty wypowiedzi, możliwą ironię, ryzykowne przesłanki i potoczne wyrażenia. Oryginalnego pytania nie przepisuje się na sztywny szablon.
3. Przy zaimkach i elipsie przekazuje się do trzech ostatnich zatwierdzonych par rozmowy. Poprzednie słowa świadka są relacją, a nie dowodem. Odpowiedzi offline nie stają się kontekstem odniesienia.
4. Dla wskazanych jako trudne wypowiedzi wyłączono automatyczne zatwierdzenie dosłownego cytatu z jednego faktu. Nawet prawdziwe zdanie może nie odpowiadać na ironię lub na wszystkie części pytania; takie wypowiedzi muszą przejść audyt semantyczny.
5. Kontrola długości odpowiedzi dopuszcza istniejący szerszy limit dla wypowiedzi rozpoznanych jako wielosegmentowe, także gdy stary klasyfikator nie wykrył pytania złożonego.
6. Rozszerzono instrukcje generowania, audytu i doprecyzowania: rozdzielanie przesłanek, negacji i żądań, zachowanie zakresu podwójnego przeczenia, konkretne pytanie zwrotne przy równorzędnych odniesieniach, odpowiedź na jednoznaczną część pytania.

## Przykłady oczekiwanego zachowania

- „No jasne, karta sama poszła na spacer” — wyjaśnić użytkownika karty i granice rejestru, nie opowiadać dosłownie o samodzielnej karcie.
- „Brawo, pełne alibi z jednego telefonu. A kto cię widział?” — odpowiedzieć o osobowym potwierdzeniu; nie dziękować za sarkastyczną pochwałę.
- „Skoro usunąłeś zapis, dlaczego wróciłeś?” — sprawdzić oba założenia, nie przyznać się do nich na podstawie pytania.
- „A on?” po wymienieniu Janusza i Tomasza — rozważyć obie osoby; jeśli kontekst nie rozstrzyga, dopytać o konkretną osobę.
- „Kto to klepnął?” — rozważyć sens zatwierdzenia. „Kręci pan pokrętłem” — nie wymuszać metafory kłamstwa.
- Szczere „Brawo, teraz rozumiem” nie musi być sarkazmem. Wskazówki wykrywają możliwość, a nie stwierdzają intencję jako fakt.

## Testy i ich granice

Dodano 60 przykładów w 5 grupach po 12, z kryteriami przeglądu semantycznego. Nie są to gotowe odpowiedzi. `liveResult` pozostaje `not_run`.

Kontrolowane wywołania wejścia generatora i audytora potwierdziły, że: lista części dociera do audytu; odpowiedź pokrywająca tylko jeden wątek jest odrzucana; ironia i niejasne odniesienia nie omijają audytu przez dosłowny cytat; konkretne doprecyzowanie może zostać przyjęte; wskazówki pochodzą z serwerowo odtworzonego kontekstu.

Przeszły również kontrole kompilacji, kanonu, dowodów, wcześniejsze zestawy 830 i 100 pytań, kartoteki świadków, kontrakt faktów, obsługa awarii dostawców i test przekazywania pełnych kartotek RC19.

Nie wykonano rzeczywistych rozmów Gemini/Groq. Te kontrole nie potwierdzają skutecznego rozpoznania każdej ironii ani 60 poprawnych odpowiedzi modelu. Lokalne wskazówki są heurystyczne i mogą się mylić; model oraz audytor muszą samodzielnie ocenić oryginał.

Nie zwiększono maksymalnej liczby prób. Trudne wypowiedzi częściej wymagają istniejącego audytu, co może wydłużyć odpowiedź w stosunku do wcześniejszej ścieżki automatycznej. Nie zmieniono tajemnic, odblokowań, werdyktu ani historii zapisanych zeznań.

## Wdrożenie

Wgraj pełną paczkę zamiast RC19 i wykonaj Redeploy Vercel. `/api/status` powinno wskazywać `6.37-POLISH-DIALOGUE-RC20`. Paczka nie została opublikowana na Vercel.

## Pełna lista nowych przypadków

**PL20-001 — multiple_requests**: Gdzie byłeś, kto cię widział i dlaczego wyszedłeś?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-002 — multiple_requests**: Co robiłeś po północy? Kto to potwierdzi? Skąd znasz tę godzinę?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-003 — multiple_requests**: Znałeś Lenę i komu przekazałeś jej uwagi?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-004 — multiple_requests**: Kto miał kartę, kiedy ją dostał i co właściwie pokazuje czytnik?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-005 — multiple_requests**: Czy to ty podpisałeś odbiór? Czy widziałeś część? Dlaczego brakuje pomiaru?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-006 — multiple_requests**: Nie pytam o Lenę, tylko gdzie ty byłeś i kto cię widział?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-007 — multiple_requests**: Co potwierdza telefon, a co rejestr i czego nie potwierdza żaden?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-008 — multiple_requests**: Kiedy ją znalazłeś? Co zobaczyłeś? Kogo wezwałeś?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-009 — multiple_requests**: Co powiedziała Lena i co z tym zrobiłaś?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-010 — multiple_requests**: Masz alibi? Na cały czas czy na fragment? Osoba czy tylko log?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-011 — multiple_requests**: Kto wydał zgodę; kto wykonał test; kto odczytał wynik?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-012 — multiple_requests**: Gdzie byłeś? Kto cię widział? Kiedy? Dlaczego? Skąd wiesz? Co zrobiłeś? Kogo zawiadomiłeś? Co potem? I kto to sprawdził?
Kryterium: Odpowiedz na wszystkie niezależne żądania; skoryguj błędną przesłankę bez pomijania reszty.

**PL20-013 — references**: A on to widział?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-014 — references**: To kto mu ją dał?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-015 — references**: A ta druga osoba?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-016 — references**: Skąd to wiesz?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-017 — references**: A tamta godzina?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-018 — references**: I co z tym zrobiłeś?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-019 — references**: To było przed tym czy po tym?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-020 — references**: Czy ona mówiła o nim, czy o tym drugim?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-021 — references**: Kto z nich tam poszedł?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-022 — references**: Osobiście?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-023 — references**: Który z tych dwóch zapisów masz na myśli?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-024 — references**: A jej kto powiedział?
Kryterium: Rozważ kilka par historii. Przy równorzędnych odniesieniach dopytaj o konkretną osobę/rzecz; nie twórz nowej.

**PL20-025 — premises_negation**: Skoro usunąłeś nagranie, dlaczego wróciłeś do biura?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-026 — premises_negation**: Przecież siedziałeś tam całą noc, choć przed chwilą powiedziałeś, że wychodziłeś.
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-027 — premises_negation**: Dlaczego zabiłeś Lenę i kto ci za to zapłacił?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-028 — premises_negation**: Nie mówię, że nie wyszedłeś. Pytam, kto cię widział.
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-029 — premises_negation**: Nie twierdzę, że kłamiesz, tylko pytam o źródło tej godziny.
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-030 — premises_negation**: Czy brak dowodu, że wyszedłeś, jest dowodem, że zostałeś?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-031 — premises_negation**: Nie zaprzeczasz, że nie widziałeś Leny?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-032 — premises_negation**: Twierdzisz, że nie byłeś w hali, ale mówisz, że widziałeś osłonę. Skąd?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-033 — premises_negation**: Dlaczego sfalsyfikowałeś dokument, skoro go nawet nie podpisywałeś?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-034 — premises_negation**: Czy nie jest nieprawdą, że to Lena zgłaszała zastrzeżenia?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-035 — premises_negation**: Nie o to, kto zadzwonił. O to, kto widział ją żywą.
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-036 — premises_negation**: Skoro karta to twoja obecność, to czemu twierdzisz, że nie wiesz kto wszedł?
Kryterium: Oddziel zarzut od faktu i zachowaj zakres negacji. Nie przyjmuj winy, zapłaty lub tożsamości karty jako danych.

**PL20-037 — irony_sarcasm**: No jasne, karta sama poszła na spacer.
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-038 — irony_sarcasm**: Brawo, pełne alibi z jednego telefonu. A kto cię widział?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-039 — irony_sarcasm**: Ta jasne, niewiniątko. To kto podpisał ten protokół?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-040 — irony_sarcasm**: Gratuluję, dokument sam się podpisał, tak?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-041 — irony_sarcasm**: Pewnie duch skasował zapis. Kto miał dostęp?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-042 — irony_sarcasm**: Dobre sobie. Log widział cię na własne oczy?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-043 — irony_sarcasm**: No tak, Lena na pewno wymyśliła ten wagon. Co zgłaszała?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-044 — irony_sarcasm**: Akurat uwierzę, że niczego nie pamiętasz. Co pamiętasz na pewno?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-045 — irony_sarcasm**: Święty człowiek z pana. A po co te korekty?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-046 — irony_sarcasm**: Geniusz. Nie ma wpisu, więc nikt nie wyszedł?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-047 — irony_sarcasm**: Brawo, teraz rozumiem różnicę między kontem a osobą. Co z kartą?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-048 — irony_sarcasm**: No jasne. Dziękuję za wyjaśnienie. Kiedy ruszyła zmiana?
Kryterium: Oceń kontekst: możliwa ironia lub szczere podziękowanie. Odpowiedz na treść, nie na pozorną pochwałę; bez dosłownych duchów.

**PL20-049 — colloquial_polish**: Nie ściemniaj, kto cię tam widział?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-050 — colloquial_polish**: Bez kitu, gdzie siedziałeś po północy?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-051 — colloquial_polish**: Coś mi się to nie klei. Jak było po kolei?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-052 — colloquial_polish**: Kto to klepnął?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-053 — colloquial_polish**: Kto dał zielone światło na ten test?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-054 — colloquial_polish**: No gadaj po ludzku, co ten log pokazuje?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-055 — colloquial_polish**: Nie rób mnie w balona. Telefon to nie zdjęcie, nie?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-056 — colloquial_polish**: Co ty kombinowałeś przy tym wagonie?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-057 — colloquial_polish**: co ty pierdolisz kto to niby potwierdzi
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-058 — colloquial_polish**: kto cie widzial i skad ta godzina bez lania wody
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-059 — colloquial_polish**: Puścił ktoś parę czy tylko zgadujesz?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

**PL20-060 — colloquial_polish**: Kręci pan tym pokrętłem w prawo czy w lewo?
Kryterium: Zachowaj oryginał. Odczytaj potoczne znaczenie w kontekście; nie przypisuj metafory literalnemu pokrętłu ani nie karz pytania za wulgaryzm.

