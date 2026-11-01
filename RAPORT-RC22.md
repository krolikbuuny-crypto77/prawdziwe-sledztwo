# 6.38 RC22 — przebudowa rdzenia przesłuchań

## Wynik
Przebudowano serwerowe źródło wiedzy, trwałą pamięć deklaracji, reguły reakcji i sprawdzanie spójności. To zmiana architektury przesłuchań. Nie jest deklaracją potwierdzonej jakości odpowiedzi prawdziwego Gemini/Groq.

## Jedna produkcyjna władza nad wiedzą
`witness-registry-rc22.json` jest skompilowanym rejestrem używanym przez przesłuchania i kontekst okazywanego materiału. Zawiera stałe identyfikatory zależne od treści, pochodzenie wpisów, warunki ujawnienia, dokumenty oraz wersje ich treści i metadanych.

Starsze pliki autorskie zachowano jako wejście kompilatora i materiał migracyjny. Produkcja nie składa już wiedzy przez dawny łańcuch kolejnych selektorów RC18/RC19. `legacy-scene-source-rc21.mjs` jest wyłącznie wejściem kompilacji, nie silnikiem obsługującym żądanie. Zmiana wejścia bez przebudowania rejestru powoduje błąd kontroli jego aktualności. `npm run build` odtwarza rejestr i sprawdza pochodzenie przed zbudowaniem klienta.

Każdy świadek nadal otrzymuje komplet 17 podstawowych bloków osobistych. Dodatkowa wiedza zawodowa i szczegółowe rozstrzygnięcia są wybierane z tego samego rejestru. Dopasowanie jest heurystyczne i nie stanowi samodzielnego rozumienia polszczyzny. Utrzymano sprawdzanie całego oryginalnego pytania i audyt odpowiedzi.

Nie dodano nowych wydarzeń do rozwiązania zagadki. Rejestr ujednolica istniejące wpisy, w tym wcześniej zaakceptowane rozszerzenia autorskie.

## Trwały dziennik deklaracji
Nowe `witnessLedgers` w istniejącym serwerowym `approved_state` przechowuje dziennik niezależny od ostatnich 24 wymian. Wpis ma identyfikator, kolejność, status, użyte stałe identyfikatory źródeł i wersję okazanego dokumentu. Tekst jest odczytywany z istniejącego pokwitowania odpowiedzi zamiast kopiowany drugi raz. Dla dawnych wypowiedzi bez pokwitowania zachowywany jest tekst dostępnej relacji.

Dziennik i odpowiedź są zapisywane tym samym atomowym CAS. Ponowienie tego samego identyfikatora nie dopisuje wpisu. Gdy w trakcie generowania zmieni się rozmowa tego samego świadka, spóźniona odpowiedź nie jest dopisywana do nowego kontekstu — serwer zwraca możliwość ponowienia. Zmiana innego stanu sesji nie wymaga automatycznego odrzucenia przy niezmienionej rozmowie.

W kontekście modelu znajdują się ostatnie deklaracje, wybrane dawne wypowiedzi związane z aktualnym pytaniem i źródła sprostowań. Cały dziennik jest trwały, lecz nie wysyła się go w całości przy każdym pytaniu. Wyszukiwanie dawnych wypowiedzi pozostaje oparte na podobieństwie słów.

Dziennik opisuje to, co powiedziano, NIE nowe fakty fabuły. Wskazanie źródła sprostowania nie oznacza automatycznie wypowiedzenia całej treści tego źródła. Automatyczne zastąpienie starszej deklaracji ograniczono do tej samej treści pytania i dosłownego, dozwolonego sprostowania. Parafraza nadal pozostaje zachowaną wypowiedzią do oceny semantycznej, bez zgadywania jej pełnego zakresu.

## Migracja istniejących rozgrywek
Wykorzystano obecną tabelę sesji i JSONB. Nie potrzeba nowej migracji SQL ani zmiany kluczy. Dziennik jest inicjowany z zachowanej historii i pokwitowań i utrwalany przy zapisie kolejnej zaakceptowanej odpowiedzi.

Stare identyfikatory f0/f1 nie mają trwałego znaczenia, więc nie przypisuje się im na siłę nowych źródeł. Starsze pokwitowania bez czasu lub numeru kolejnego zachowują nieznaną kolejność. Nie można odzyskać wypowiedzi, które wcześniej usunięto i których nie ma już w żadnym pokwitowaniu. Odpowiedzi offline nie stają się deklaracjami autoryzowanymi.

## Reguły psychologii i ujawniania
Sześć indywidualnych celów jest połączonych z programowo wybieraną strategią odpowiedzi. Silnik rozróżnia zwykłe wyjaśnienie, reakcję na rzeczywiście okazany materiał, powrót do wcześniejszej deklaracji i wyjaśnianie zapisanego sprostowania. Uwzględnia wykorzystane źródła i dostępność wymaganych dowodów.

Strategia jest przekazywana generatorowi i audytorowi. Nie nadaje faktów ani uprawnień. Sam nacisk, wstyd lub liczba pytań nie odblokowuje tajemnicy. Użycie źródła w przeszłości nie zamienia jego całej treści w przyznanie. Model ma odczytać faktyczny cytat.

Psychologia nie jest pełną symulacją ludzkich emocji. Jej skuteczność językowa zależy od generowania i niezależnej oceny odpowiedzi; nie została zmierzona na prawdziwym API.

## Kontekst i dokumenty
Usunięto 45 dosłownych fragmentów dublujących pełne wypowiedzi z tego samego źródła i z tymi samymi uprawnieniami. Ich treść pozostaje w pełnym źródle. Nie usuwano unikalnych faktów przez ocenę podobieństwa znaczenia. Zachowano bezstratne usuwanie duplikatów profilu i historii z RC21.

Dziennik korzysta z pokwitowań, więc nie dubluje pełnego trwałego zapisu. W pakiecie dla modelu cytat obecny już w rozmowie może być zastąpiony odwołaniem do odpowiednich wierszy.

Okazany dokument jest dzielony na kompletne zdania mieszczące się w kontrakcie faktu. Zakończono ucinanie treści po 370 znakach. Kontrola sprawdza odtworzenie całej treści wszystkich 78 dokumentów. W dzienniku zapisuje się wersję dokumentu, nie sam jego identyfikator.

Większy trwały dziennik i szerszy kontekst mogą zwiększać rozmiar sesji i żądań. Nie obiecuje się mniejszego czasu odpowiedzi ani usunięcia limitów dostawców.

## Spójność
`AUDYT-CHRONOLOGII-RC22.json` zawiera 18 punktów lub przedziałów czasu powiązanych z dokumentami i kontrolowane relacje kolejności. Przedział zgonu 01:41–01:49 nie jest redukowany do zapisu wstrząsu 01:44. Kontakty Marka i Janusza przed północą oraz Janusza i Kamila przed sesją diagnostyczną nie tworzą ciągłego alibi na przedział krytyczny.

Kontrole pochodzenia, długości, bramek, wzajemnych potwierdzeń i chronologii są wykonywane przez `npm run check`. Nie dowodzą braku wszystkich możliwych sprzeczności semantycznych w każdym dialogu.

## Weryfikacja
Przeszły:
- kompilacja i kontrola rejestru, zgodność bazowego kanonu i dowodów;
- 60 kolejnych wymian, ponowny odczyt stanu i przywołanie deklaracji poza oknem 24 wymian;
- migracja starych zapisów, nieznana kolejność i brak zgadywania dawnych źródeł;
- ponawianie zaakceptowanego turnId, atomowy zapis oraz odrzucenie odpowiedzi przy równoległej zmianie rozmowy;
- blokady tajemnic wobec presji, dziennika i danych klienta;
- sześć strategii i warunki konfrontacji;
- komplet treści 78 dokumentów i weryfikacja ich wersji;
- wcześniejsze zestawy 830 pytań (4980 kontekstów), 100 przypadków, kartoteki, 60 przypadków polszczyzny, ograniczenia pamięci, kontrakt faktów i awarie dostawców.

Stary test trwałego ponawiania odwoływał się do nieużywanego Z.ai. Zaktualizowano jego kontrolowanego dostawcę do Groq i dodano przypadek konfliktu równoległej rozmowy. Testy korzystają z kontrolowanych odpowiedzi lub stanu, nie są pomiarem prawdziwego Gemini/Groq ani rzeczywistą próbą zapisu w produkcyjnym Supabase.

## Wdrożenie
Wgraj pełną zawartość paczki zamiast RC21 i wykonaj Redeploy Vercel. `/api/status` powinno wskazywać `6.38-WITNESS-ENGINE-RC22`. Paczka zawiera skompilowany rejestr. Nie opublikowano jej na Vercel. Zachowano zgodność dotychczasowego klienta, zapisów i istniejącego mechanizmu sesji. Ten raport ma pierwszeństwo przed opisami starszych wydań.
