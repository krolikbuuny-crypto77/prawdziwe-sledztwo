# RC18 — rozszerzona wiedza sześciu świadków

Dodano 90 indywidualnych wpisów (po 15 na świadka) oraz 13 wspólnych zasad interpretacji dowodów. To jawne rozszerzenie autorskie na prośbę użytkownika, a nie nowe ustalenia zaczerpnięte z poprzedniego kanonu. Nie dodano nowego sprawcy, czasu przestępstwa ani rozstrzygającego śladu.

## Działanie

Serwer wybiera do 6 indywidualnych wpisów i do 2 zasad na podstawie tematu i słów pytania. Przy krótkich pytaniach zatwierdzone wcześniejsze pytania pomagają ustalić temat. To heurystyczny wybór kontekstu, nie pełne rozumienie języka. Wszystkie dotychczasowe publiczne wypowiedzi pozostają dostępne. Model nadal sam interpretuje pytanie i dobiera identyfikatory faktów. Nowa wiedza jest częścią banku faktów dla generowania i audytu; nie jest wyłącznie instrukcją w prompcie. Nie zwiększono liczby wywołań API.

Wiedza o tym, jak działa procedura, nie upoważnia do potwierdzenia, że wykonano ją tej nocy. Dotychczasowe sprostowania pozostają za bramkami dowodowymi. Okazany zatwierdzony dokument jest nadal odrębnym źródłem. Nie nadano wszystkim świadkom wiedzy o wszystkich wydarzeniach.

## Co to umożliwia

Przykładowo Janusz może wyjaśnić różnicę między objawem, przyczyną i wynikiem naprawy; Kamil odczyt logu i granice identyfikacji konta; Elżbieta różnicę między projektem a skutecznym zgłoszeniem; Magdalena różnicę między fakturą, dostawą a odbiorem. Marek opisuje podział nadzoru i odpowiedzialności, Tomasz kolejność poleceń ruchowych i granice własnej obserwacji.

Pytania zakładające niepotwierdzoną łapówkę, konkretną groźbę czy usunięcie nagrania nadal wymagają źródła. Prawidłowa odpowiedź może kwestionować założenie. Nie dopisano takich zdarzeń tylko po to, aby świadek mógł na nie przytaknąć.

## Sprawdzenia

- 830 pytań × 6 świadków: 4980 kontekstów, z czego 4158 otrzymało co najmniej jeden dodatkowy wpis. To liczba wzbogaconych kontekstów, nie liczba poprawnych odpowiedzi.
- 78 dokumentów × 6 świadków: 468 kontroli zachowania okazanego materiału.
- Wszystkie istniejące kombinacje bramek sprostowań: pozostają zablokowane bez wymaganych dowodów i dostępne po ich uzyskaniu.
- Cztery kontrolowane wywołania wejścia generatora: nowy fakt dotarł do pakietu i przeszedł kontrakt odpowiedzi. To test transportu, nie ocena prawdziwego modelu.
- Kontrole kompilacji, integralności kanonu i dowodów, baza 830 i starsze 100 pytań, kartoteki świadków, awarie dostawców i kontrakt faktów przeszły.

Rzeczywistego API nie uruchamiano. Brak pomiaru jakości i czasu odpowiedzi modeli produkcyjnych. Timeoutów i limitów dostawców ten pakiet nie usuwa.

## Wdrożenie

Zastąp pełną zawartość poprzedniej paczki i wykonaj Redeploy Vercel. `/api/status` powinno wskazać `6.37-WITNESS-KNOWLEDGE-RC18`. Nie opublikowano zmian na Vercel. Baza 830 pytań pozostaje bez zmian. Starsze wypowiedzi zapisane w rozgrywce nie są przepisywane.

## Pełny wykaz nowej wiedzy

### MAREK

- **MAREK-01** — Nadzoruję organizację zmiany i rozliczenie pracy. Zlecenie zadania nie oznacza, że osobiście obserwuję każdy etap jego wykonania.
- **MAREK-02** — Sprawy ruchu omawiam z dyspozytornią, wykonania napraw z warsztatem, a zagrożeń ze specjalistką BHP. To różne zakresy odpowiedzialności.
- **MAREK-03** — Moje wyjścia służbowe przerywały ciągły pobyt w biurze. Nie mogę odtworzyć wszystkich odcinków nocy z pamięci ani nadać im teraz dokładnych godzin.
- **MAREK-04** — Osoba rozmawiająca ze mną przez telefon mogła potwierdzić rozmowę, ale nie widziała przez to, gdzie stałem. Nie wskażę świadka obserwującego mnie przez całą noc.
- **MAREK-05** — Lenę znałem przez pracę w zajezdni. W rozmowach interesowały mnie zgłaszane przez nią sprawy bezpieczeństwa i ich wpływ na pracę zmiany.
- **MAREK-06** — W zastrzeżeniach Leny rozróżniam sam sygnał o zagrożeniu, jego dokładną treść i formalne przekazanie. Wiedza o zastrzeżeniach nie potwierdza adresata każdego zgłoszenia.
- **MAREK-07** — Rozliczenie zmiany zestawia czas i wykonane zadania. Nie zastępuje zapisu każdej trasy pracownika ani osobistej obserwacji jego pobytu.
- **MAREK-08** — Moje polecenie organizacyjne nie jest samo w sobie technicznym odbiorem wagonu. Wykonanie i sprawdzenie pracy trzeba potwierdzić odrębnymi zapisami.
- **MAREK-09** — Potrafię wyjaśnić organizację rozliczeń zmiany. Nie ustalę z samej wysokości premii, kto wykonał konkretną czynność przy wagonie.
- **MAREK-10** — Oczekiwanie wykonania pracy w terminie nie pozwala pomijać sprawdzenia bezpieczeństwa. Nie potwierdzam przez to, że ktoś tej nocy wydał taki nakaz.
- **MAREK-11** — Odpowiadam za własne decyzje kierownicze. Ustalenie mojego zaniedbania i ustalenie, kto spowodował obrażenia Leny, wymagają różnych faktów.
- **MAREK-12** — Nie prowadzę w pamięci minutowego rejestru kontaktów. Gdy nie umiem przypisać spotkania do godziny, wolę porównać dokumenty niż zgadywać.
- **MAREK-13** — Rzeczowy sposób mówienia pomaga mi uporządkować decyzje. Nie oznacza, że śmierć Leny jest mi obojętna.
- **MAREK-14** — O samym zdarzeniu dowiedziałem się po alarmie. Informacji przekazanej mi później nie przedstawię jako tego, co sam widziałem przy stanowisku.
- **MAREK-15** — Powiązanie wpisu z moim kontem i ustalenie, kto wykonał konkretną operację, to osobne pytania. Trzeba porównać zapis operacji z warunkami dostępu.

### TOMASZ

- **TOMASZ-01** — Zajmuję się prowadzeniem ruchu i przekazywaniem poleceń ruchowych. Nie wykonuję z tego tytułu technicznego odbioru podzespołów.
- **TOMASZ-02** — Rozróżniam przyjazd wagonu, skierowanie go na stanowisko i zakończenie pracy warsztatowej. To nie jest jedna czynność jednego pracownika.
- **TOMASZ-03** — Zgłoszenie alarmu o 02:02 jest konkretnym punktem mojej relacji. Nie dowodzi, że przez całą wcześniejszą godzinę nie odchodziłem od konsoli.
- **TOMASZ-04** — Sam znalazłem Lenę przy trzecim stanowisku i wezwałem pomoc. Nie widziałem momentu, w którym powstały jej obrażenia.
- **TOMASZ-05** — Znalezienie poszkodowanej i chwila powstania obrażeń to różne momenty. Nie ustalę czasu urazu wyłącznie z własnego wezwania pomocy.
- **TOMASZ-06** — W łączności rozróżniam próbę wywołania, odebranie komunikatu i potwierdzenie jego wykonania. Sam zapis połączenia nie zawiera całej treści rozmowy.
- **TOMASZ-07** — Dziennik ruchu służy ustalaniu kolejności poleceń i przejazdów. Sam wpis nie potwierdza, że osobiście widziałem wykonanie każdego polecenia.
- **TOMASZ-08** — Z Leną stykałem się w sprawach zajezdni i wagonu. Sporu o wagon nie traktuję jako dowodu, że rozmówca chciał jej śmierci.
- **TOMASZ-09** — O zastrzeżeniach dotyczących wagonu można mówić osobno od tego, kto je formalnie odebrał. Nie podam konkretnego adresata bez podstawy.
- **TOMASZ-10** — Zapis połączeń może pomóc odtworzyć kontakt z konsolą. Osobowy świadek musiałby opisać własne spotkanie ze mną, a nie tylko pracę urządzenia.
- **TOMASZ-11** — Polecenie skierowania wagonu nie zastępuje zgody na test ani podpisu osoby dokonującej odbioru technicznego.
- **TOMASZ-12** — Nie potrafię wskazać pewnej godziny ostatniego spotkania żywej Leny. Godziny alarmu nie przeniosę na wcześniejsze spotkanie.
- **TOMASZ-13** — Moje wezwanie pomocy nie daje mi wiedzy o wszystkich późniejszych czynnościach ratowników i zespołu zabezpieczającego ślady.
- **TOMASZ-14** — Mogę wyjaśnić własne polecenia ruchowe. Wykonanie prac przy podzespołach i ich odbiór trzeba ustalać u wykonawców oraz w dokumentacji.
- **TOMASZ-15** — Przy pytaniach o znalezienie Leny mówię krótko, bo rozdzielam to, co widziałem, od tego, czego nie potrafię odtworzyć.

### JANUSZ

- **JANUSZ-01** — Organizuję kolejkę prac warsztatowych i dokumentację napraw. Przydzielenie pracy, wykonanie i odbiór wymagają rozróżnienia.
- **JANUSZ-02** — Byłem na zmianie w warsztacie. Z karty pracy można ustalać zlecenia, ale nie każdą minutę mojego pobytu przy stanowisku.
- **JANUSZ-03** — Koledzy mogą opisać wspólnie wykonywane zlecenia. Nie znaczy to, że któryś z nich obserwował mnie nieprzerwanie przez całą noc.
- **JANUSZ-04** — Z Leną rozmawiałem o wagonie i spieraliśmy się o jego stan. Taki spór zawodowy nie opisuje sam w sobie żadnej przemocy.
- **JANUSZ-05** — Objaw usterki, rozpoznana przyczyna i wynik naprawy to różne informacje. Kod błędu sam nie zastępuje oględzin ani sprawdzenia po naprawie.
- **JANUSZ-06** — Przy wymianie części znaczenie mają oznaczenie elementu, pochodzenie i zapis wykonania pracy. Numer w karcie trzeba porównać z częścią, a nie przyjmować go bez sprawdzenia.
- **JANUSZ-07** — Test po naprawie może potwierdzać usunięcie sprawdzanego objawu. Nie dowodzi sprawności całego wagonu w każdych warunkach.
- **JANUSZ-08** — Podpis pod odbiorem i wykonanie naprawy to osobne role. Sam podpis nie pozwala przypisać podpisującemu wszystkich czynności przy wagonie.
- **JANUSZ-09** — Brak rubryki w karcie wymaga sprawdzenia właściwego zlecenia i jego wersji. Nie ustalę przyczyny braku wpisu wyłącznie z samej pustej rubryki.
- **JANUSZ-10** — Osłona i wyłączenie zasilania chronią przed różnymi zagrożeniami. O ich rzeczywistym stanie tej nocy trzeba mówić na podstawie oględzin, nie zwyczajów warsztatowych.
- **JANUSZ-11** — Smar może trafić na odzież podczas normalnej pracy. Żeby wiązać go z konkretnym kontaktem, trzeba porównać próbki i warunki ich zabezpieczenia.
- **JANUSZ-12** — Wiedziałem o problemie z TW-217. Nie daje mi to automatycznie wiedzy o każdym zgłoszeniu Leny ani o wszystkich jego odbiorcach.
- **JANUSZ-13** — Potrafię odnieść zapis dostawy do części i zlecenia. Samą fakturą nie potwierdzę, że część zamontowano ani kto zatwierdził rozliczenie.
- **JANUSZ-14** — Pamiętam rozmowy o wagonie, lecz nie podam pewnej minuty ostatniego spotkania z Leną. Nie chcę dopasowywać pamięci do podsuniętej godziny.
- **JANUSZ-15** — O śmierci Leny dowiedziałem się po alarmie. Wiedza warsztatowa nie czyni mnie świadkiem tego, jak doszło do jej obrażeń.

### ELZBIETA

- **ELZBIETA-01** — Zajmuję się ryzykiem i procedurą zgłaszania zagrożeń. Ocena zagrożenia, przekazanie informacji i potwierdzenie odbioru są osobnymi etapami.
- **ELZBIETA-02** — Lena mówiła mi o bezpieczeństwie TW-217. Znam ją z rozmów o tych problemach i traktowałam jej obawy poważnie.
- **ELZBIETA-03** — Zastrzeżenia dotyczące bezpieczeństwa zgłaszała Lena. Moja rozmowa z nią nie oznacza, że ja byłam autorką jej spostrzeżeń.
- **ELZBIETA-04** — Kontakt z Leną o 21:47 potrafię wskazać. Biling może potwierdzić połączenie, ale nie jest zapisem wszystkich słów tej rozmowy.
- **ELZBIETA-05** — Ustna rozmowa o ryzyku i skuteczne formalne wysłanie zgłoszenia to różne rzeczy. Do potwierdzenia wysłania potrzebny jest ślad nadania lub odbioru.
- **ELZBIETA-06** — Sam projekt dokumentu nie potwierdza, że adresat go otrzymał. Trzeba rozróżnić autora, wskazanego adresata i faktycznego odbiorcę.
- **ELZBIETA-07** — Przy opisie ryzyka odróżniam zagrożenie dla ludzi od samej niezgodności w dokumentacji. Nie każda brakująca rubryka opisuje mechanizm obrażeń.
- **ELZBIETA-08** — Stan osłony przed przybyciem pomocy i stan zastany przez zespół oględzin mogą wymagać osobnego ustalenia. Nie byłam tam, żeby sama to porównać.
- **ELZBIETA-09** — Nie widziałam samego zdarzenia. Nie mam dokumentu potwierdzającego każdą minutę mojej nocy i nie zastąpię go godziną rozmowy z Leną.
- **ELZBIETA-10** — Ostatni kontakt, który umiem wskazać, nie musi być dowodem, że późniejszego kontaktu na pewno nie było. Nie mam takiej pewności.
- **ELZBIETA-11** — Informacja o zagrożeniu nie jest zgodą na test ani technicznym odbiorem. Te decyzje wymagają ustalenia ich właściwych autorów.
- **ELZBIETA-12** — Mogę zrelacjonować rozmowę, w której uczestniczyłam. Nie mogę z niej wyprowadzić, gdzie Lena przebywała przez resztę nocy.
- **ELZBIETA-13** — Poczucie, że można było zrobić więcej dla bezpieczeństwa, nie jest wiedzą o sprawcy przemocy. Te kwestie trzeba wyjaśniać oddzielnie.
- **ELZBIETA-14** — Rozmowa o Lenie jest dla mnie trudna. Mogę potrzebować chwili, ale emocje nie zmieniają tego, co potrafię potwierdzić.
- **ELZBIETA-15** — Presja terminu nie zastępuje oceny ryzyka. Nie potwierdzę konkretnego polecenia zignorowania zagrożenia bez wiedzy o takim poleceniu.

### KAMIL

- **KAMIL-01** — Zajmuję się automatyką i diagnostyką TW-217. Wynik testu, jego autoryzacja i odbiór całego wagonu są różnymi rzeczami.
- **KAMIL-02** — Log TCMS zapisuje zdarzenia systemu. Kod może opisywać wykryty objaw, a ustalenie przyczyny wymaga porównania go z warunkami testu.
- **KAMIL-03** — Wcześniejszy błąd zapisany w pamięci i błąd aktywny w danej chwili nie muszą oznaczać tego samego stanu urządzenia.
- **KAMIL-04** — Zgoda na test powinna być rozpatrywana razem z zapisem sesji. Samo uruchomienie sesji nie dowodzi, że wszystkie wymagane zgody były udzielone.
- **KAMIL-05** — Konto, sesja, karta i człowiek to różne elementy. Z identyfikatora w logu nie wyprowadzę automatycznie fizycznej tożsamości osoby przy urządzeniu.
- **KAMIL-06** — Przypisanie karty do osoby w ewidencji nie dokumentuje każdego późniejszego użycia. Czytnik rejestruje nośnik, a nie twarz.
- **KAMIL-07** — Porównując dwa logi, trzeba sprawdzić zgodność czasu systemów. Różnica wskazań nie jest od razu dowodem, że ktoś zmienił przebieg wydarzeń.
- **KAMIL-08** — Zmiana konfiguracji, zapis jej wykonania i rzeczywisty efekt techniczny wymagają rozróżnienia. Samo konto nie tłumaczy intencji operatora.
- **KAMIL-09** — Robiłem diagnostykę TW-217. Log sesji pomaga ustalić czynności systemu, ale nie pokazuje każdej minuty mojego pobytu.
- **KAMIL-10** — Z Leną rozmawiałem o diagnostyce. Moja rola techniczna nie daje mi wiedzy o wszystkich jej kontaktach i prywatnych sprawach.
- **KAMIL-11** — Dostęp do konta na urządzeniu i faktyczne wysłanie wiadomości przez konkretną osobę to dwa ustalenia. Potrzebne jest porównanie kontekstu i zapisów.
- **KAMIL-12** — Nietypowe zdarzenie w teście nie jest samo w sobie opisem wypadku przy stanowisku. Związek z obrażeniami wymaga innych źródeł.
- **KAMIL-13** — Nie pamiętam ostatniego spotkania z Leną z dokładnością do minuty. Znacznika czasu z logu nie przedstawię jako pamięci spotkania.
- **KAMIL-14** — Autoryzacja może dotyczyć sesji. Nie jest osobową relacją kogoś, kto widział mnie przez całą noc przy komputerze.
- **KAMIL-15** — Mogę wyjaśnić znaczenie zapisów diagnostycznych. Nie ustalę z samego kodu błędu, kto spowodował śmierć Leny.

### MAGDALENA

- **MAGDALENA-01** — Zajmuję się zgodnością dokumentacji odbiorowej i umów serwisowych. Porównuję treść dokumentów, ich wersje i podstawy zatwierdzenia.
- **MAGDALENA-02** — Potwierdzenie zgodności dokumentacji nie jest osobistym wykonaniem każdej czynności technicznej. Trzeba wskazać, co dokładnie obejmował odbiór.
- **MAGDALENA-03** — Kopia, projekt i zatwierdzona wersja dokumentu mają różny status. Sam tytuł pliku nie wystarcza do ustalenia, która wersja obowiązywała.
- **MAGDALENA-04** — Data utworzenia pliku, podpisania dokumentu i wykonania opisanej pracy nie muszą być tą samą datą. Znaczenie każdego pola trzeba sprawdzić.
- **MAGDALENA-05** — Umowa, faktura, przyjęcie dostawy i odbiór techniczny potwierdzają różne etapy. Zapłata nie jest sama w sobie dowodem montażu części.
- **MAGDALENA-06** — Rozbieżność w oznaczeniu części wymaga porównania dokumentów z elementem. Nie ustalę jej przyczyny wyłącznie z ogólnego opisu faktury.
- **MAGDALENA-07** — Powiązanie osoby z dostawcą, korzyść finansowa i udział w konkretnej decyzji są odrębnymi ustaleniami. Jedno nie zastępuje pozostałych.
- **MAGDALENA-08** — Sesja audytowa trwała od 01:30 do 02:00 według mojego oświadczenia. Rejestr połączenia nie jest nieprzerwaną obserwacją mojej osoby.
- **MAGDALENA-09** — Ciągłość połączenia i stała obecność przed kamerą nie są tym samym. Sam rejestr nie wskazuje osobowego świadka całego mojego pobytu.
- **MAGDALENA-10** — Moje kontakty z Leną wiązały się ze sprawami zgodności technicznej. Rozbieżności w dokumentach nie są samodzielnym dowodem motywu przemocy.
- **MAGDALENA-11** — Zapis użycia karty trzeba odróżnić od ewidencji jej wydania. Nie wskażę na tej podstawie samej osoby stojącej przy drzwiach.
- **MAGDALENA-12** — Korespondencję trzeba odczytywać w pełnym wątku. Pojedynczy fragment nie określa sam autora czynności ani znaczenia wcześniejszych ustaleń.
- **MAGDALENA-13** — Nie byłam obecna przy zgłoszeniu alarmu. O tym momencie nie będę mówić tak, jakbym sama go obserwowała.
- **MAGDALENA-14** — Nie wskażę pewnej godziny ostatniego spotkania z Leną. Czas sesji audytowej nie jest automatycznie godziną takiego spotkania.
- **MAGDALENA-15** — Ostrożnie dobieram słowa, bo różnica między dokumentem a osobistą obserwacją ma znaczenie. Nie jest to samo w sobie przyznanie się do zarzutu.

### Zasady wspólne

- **COMMON-01** — Osobowy świadek może potwierdzić tylko to, co sam obserwował. Krótkie spotkanie nie potwierdza całej nocy, a rozmowa nie dowodzi ciągłego wspólnego pobytu.
- **COMMON-02** — Nieodebrane połączenie, odebrana rozmowa i odczytanie wiadomości to różne zdarzenia. Sam czas połączenia nie podaje pełnej treści rozmowy ani miejsca pobytu.
- **COMMON-03** — Zapis użycia karty potwierdza zdarzenie z nośnikiem. Sam nie dowodzi, kto go trzymał ani czy przez otwarte drzwi przeszła tylko jedna osoba.
- **COMMON-04** — Brak wpisu ma znaczenie tylko w zakresie, który dany rejestr rzeczywiście obejmuje. Nie jest automatycznym dowodem, że nikt nie przechodził.
- **COMMON-05** — Autor zgłoszenia, osoba przekazująca i odbiorca to różne role. Zapisanie projektu nie potwierdza skutecznego wysłania ani odbioru.
- **COMMON-06** — Własna obserwacja, cudza relacja i późniejsze odczytanie dokumentu mają różne źródła. Nie należy przedstawiać później poznanej informacji jako wspomnienia zdarzenia.
- **COMMON-07** — Godzina znalezienia człowieka, wezwania pomocy i powstania obrażeń to odrębne punkty chronologii. Sam jeden z tych czasów nie ustala pozostałych.
- **COMMON-08** — Wykryty objaw, przyczyna usterki i rezultat naprawy są odrębne. Brak numeru lub podpisu nie ustala sam z siebie sprawcy przemocy.
- **COMMON-09** — Podpisanie dokumentu, wykonanie pracy i sprawdzenie jej wyniku to odrębne czynności. Trzeba ustalić zakres konkretnego potwierdzenia.
- **COMMON-10** — Zgodność rodzaju smaru albo włókna nie jest identyfikacją jednej osoby. Stan miejsca po pomocy może różnić się od stanu sprzed wejścia ratowników.
- **COMMON-11** — Presja terminu i oszczędności mogą być tematem do wyjaśnienia, ale same nie dowodzą wydania niebezpiecznego polecenia ani udziału w przemocy.
- **COMMON-12** — Uprawnienie dostępu, możliwość działania, motyw i wykonanie czynności to różne ustalenia. Żadne pojedyncze nie zastępuje dowodu konkretnego działania.
- **COMMON-13** — Milczenie, zdenerwowanie i ostrożny dobór słów nie ustalają prawdziwości zarzutu. Sprostowanie pomyłki nie musi oznaczać przyznania do sugerowanego czynu.
