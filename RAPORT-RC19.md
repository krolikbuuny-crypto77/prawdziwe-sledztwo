# RC19 — kartoteki i pokrycie pytań

## Co zmieniono

Dodano 102 bloki indywidualnej wiedzy (17 działów dla każdego z 6 świadków), 44 szczegółowe rozstrzygnięcia dotyczące zdarzeń i założeń pytań oraz 6 kart informacji wymagających konfrontacji. Zachowano wcześniejszą wiedzę zawodową RC18 i pierwotny kanon. Nowe elementy są rozszerzeniem autorskim zleconym przez użytkownika. Nie należy przedstawiać ich jako wcześniej istniejących dowodów.

Każde z 830 pytań ma w `AUDYT-POKRYCIA-RC19.json` przypisane źródła dla sześciu świadków (4980 par), właściwych specjalistów i wymagane dokumenty. Przypisanie źródła nie jest oceną poprawności wygenerowanej odpowiedzi.

## Konkretne nowe wspomnienia

- Marek i Janusz pamiętają wzajemnie tę samą rozmowę o karcie pracy w przejściu między warsztatem a administracją we wcześniejszej części zmiany. Nie nadano jej wymyślonej dokładnej minuty i nie uczyniono z niej pełnego alibi.
- Marek i Tomasz opisują robocze kontakty z dyspozytornią. Janusz i Kamil opisują roboczy kontakt dotyczący diagnostyki.
- Kartoteki rozdzielają własną czynność, osobę mogącą potwierdzić fragment, dokument, ostatni kontakt z Leną i poznane później wiadomości.
- Szczegółowe pytania o kamerę nr 4, fikcyjny reset prądu, rozbiórkowe części, nieistniejący wspólny patrol lub rzekome łapówki otrzymały konkretne rozstrzygnięcia autorskie. Nie dodano całej listy sugerowanych przestępstw do rozwiązania sprawy.

## Najważniejsza zmiana w przekazywaniu wiedzy

W RC18 dobór według słów mógł nie przesłać potrzebnego faktu. Test pięciu ręcznie wybranych parafraz wykazał takie pominięcia. W RC19 wszystkie 17 podstawowych bloków aktualnego świadka trafia do modelu przy każdym pytaniu. Dopasowanie pytania zmienia ich kolejność, nie usuwa ich z kontekstu. Dotychczasowe publiczne wypowiedzi również pozostają dostępne.

Osobno dobieranych jest do 5 szczegółowych bloków, z uwzględnieniem dokładnego pytania, podobieństwa słów i znaków oraz wskazówek tematycznych. Ten dobór jest heurystyczny: nie gwarantuje poprawnej interpretacji dowolnej parafrazy. Model otrzymuje oryginalne pytanie i zatwierdzoną historię, żeby samodzielnie je zrozumieć. Podstawowej kartoteki ten mechanizm już nie odcina.

Zwiększono limit serwerowego banku z 40 do 64 faktów. Przykładowe pakiety dla pytania o potwierdzenie alibi zawierały 40–43 fakty i około 13–15 tys. znaków całej struktury kontekstu. Nie zmieniono limitu wyjścia ani liczby prób. Więcej wiedzy oznacza większy kontekst; nie obiecuje to krótszego czasu API.

## Co oznacza możliwość odpowiedzi

Świadek ma podstawę do przedstawienia własnej relacji, nazwania właściwego źródła, odniesienia się do okazanej treści albo skorygowania błędnego założenia. Nie oznacza to, że każdy widział każde zdarzenie. Pytanie o nieznanego poprzedniego przełożonego Leny lub o prywatny schowek nie zamienia ich w jego osobiste wspomnienie. Na pytanie o fikcyjny sekret programu świadek nie otrzymuje prawdziwego sekretu.

Wiadomości, karta T-17, niewysłane zgłoszenie i pozostałe sprostowania nadal wymagają serwerowo potwierdzonych dowodów. Kartoteka rozdziela wiedzę postaci od wiedzy dozwolonej do ujawnienia w danym stanie rozgrywki. Nowa wiedza nie zastępuje bramek postępu ani werdyktu.

## Weryfikacja

- 830 pytań × 6 świadków: sprawdzono przekazanie wszystkich 17 bloków, źródeł przypisanych do pytania oraz brak ujawnienia dokumentów i sprostowań przed uprawnieniem.
- 830 mechanicznych parafraz: sprawdzono odnalezienie przykładu i zachowanie szczegółowego obszaru wiedzy. Nie jest to 830 niezależnych testów językowych.
- Pięć ręcznie wybranych parafraz: sprawdzono obecność wskazanych faktów, których starsza selekcja nie dostarczała.
- Sprawdzono wszystkie kombinacje istniejących bramek sprostowań oraz kontrolowane przejście nowego wspomnienia do wejścia generatora.
- Przeszły kontrole składni, kompilacji i integralności bazowego kanonu/dowodów, starsze testy baz 830 i 100 pytań, kartotek, nowej wiedzy RC18, awarii dostawców i kontraktu identyfikatorów faktów.

Nie uruchamiano rzeczywistych Gemini/Groq. Nie twierdzimy, że wykonano 4980 poprawnych odpowiedzi API lub pełną semantyczną ocenę każdej odpowiedzi. W audycie zachowano `liveStatus: not_run`. Testy sprawdzają dostarczoną wiedzę i uprawnienia.

## Wdrożenie

Wgraj pełną zawartość paczki zamiast RC18 i wykonaj Redeploy Vercel. `/api/status` ma wskazywać `6.37-COMPLETE-KNOWLEDGE-RC19`. Paczka nie została opublikowana na Vercel. Istniejące zapisane rozmowy pozostają bez zmian; kolejne pytania korzystają z nowych faktów.

## Nowe kartoteki — pełny tekst

### MAREK

**Obecność alibi i przebieg zmiany** — Na początku zmiany byłem w biurze kierownika. Porządkowałem obsadę, sprawy przyjęcia TW-217 i rozliczenie zadań. Później wychodziłem służbowo do dyspozytorni i w rejon warsztatu; nie odtwarzam ich kolejności co do minuty.

**Osobowi świadkowie i potwierdzenie alibi** — Janusz Wójcik może potwierdzić naszą rozmowę o karcie pracy w przejściu między warsztatem a administracją we wcześniejszej części zmiany. Tomasz zna moje kontakty z dyspozytornią. Żaden nie siedział ze mną przez całą noc.

**Telefon wiadomości i łączność** — W sprawach zmiany kontaktowałem się z dyspozytornią i warsztatem. Byłem osiągalny także poza biurkiem. Nie prowadziłem własnego nagrania tych rozmów; rejestr kontaktów trzeba oddzielić od ich treści.

**Karty dostępu rejestry i monitoring** — Nie prowadziłem osobistej obserwacji południowych drzwi ani użytkowników T-17. Moje wyjścia wewnątrz budynku nie zawsze wymagały karty. Rejestr rozliczenia pracy i surowy rejestr przejść to dwa różne zestawienia.

**Relacja z Leną i ostatnie kontakty** — Lena była motorniczą TW-217, pracującą w kierowanej przeze mnie zajezdni. Łączyły nas sprawy zawodowe. Rozmawiałem z nią o bezpieczeństwie i organizacji pracy, ale nie potrafię wskazać pewnej godziny naszego ostatniego spotkania.

**Zastrzeżenia Leny i kierunek zgłoszeń** — O zastrzeżeniach wiedziałem z kontaktów służbowych dotyczących TW-217. Rozróżniałem sprawdzenie techniczne zlecane diagnostyce i sprawdzenie dokumentacji. Nie byłem odbiorcą każdej rozmowy Leny z BHP lub audytem.

**Źródła wiedzy pewność i pamięć** — Pamiętam własny nadzór i rozmowy o pracy. Informację o znalezieniu Leny otrzymałem z dyspozytorni po alarmie, a nie z własnej obserwacji urazu. Godziny podane w dokumentach odróżniam od pamięci moich rozmów.

**Chronologia alarm i odnalezienie Leny** — Zmiana zaczęła się o 18:00. Nadzorowałem zadania do chwili alarmu z dyspozytorni o 02:02; po nim sprawy dotyczące pomocy i wyjaśnienia zdarzenia przerwały zwykły tok pracy. Nie widziałem samego urazu.

**Wagon podzespoły i diagnostyka** — W sprawie TW-217 odpowiadałem za organizację zadań, nie za samodzielny pomiar automatyki ani laboratoryjne badanie części. Zlecenie diagnostyczne kierowano do Kamila, a dokumentację warsztatową prowadził Janusz.

**Dokumentacja odbiory i autoryzacja** — W mojej pracy rozliczenie zmiany powstaje na podstawie danych o obsadzie i zadaniach. Nie jest kopią wszystkich przejść przez drzwi. Odbiór podzespołu, kartę naprawy i ewidencję czasu prowadzono oddzielnie.

**BHP miejsce zdarzenia i ślady** — Po alarmie nie wydawałem polecenia zmycia stanowiska ani wyrzucania rzeczy Leny. Zwykłą pracę podporządkowano pomocy i zabezpieczeniu miejsca. Nie byłem osobą pobierającą próbki lub wykonującą sekcję.

**Finanse dostawcy i presja organizacyjna** — Interesowało mnie wykonanie i rozliczenie zmiany. Nie obiecywałem nikomu zapłaty za milczenie i nie zlecałem sprawdzania zwolnień Leny. Nie znam tajnego procentu od kontraktów ani umowy o opłacaniu świadków.

**Konfrontacja sprzeczności i zatajanie informacji** — Mogę porównać swoją wypowiedź z konkretnym zapisem. Nie twierdziłem, że całą noc spałem, piłem kawę z dyspozytorem lub siedziałem bez przerwy w biurze. Wychodzenie w sprawach służbowych nie jest nowym przyznaniem do przemocy.

**Odpowiedzialność zarzuty i motyw** — Odpowiadam za organizację i rozliczenia, a nie za każde cudze działanie. Nie widziałem, kto spowodował uraz Leny. Oddzielam wyjaśnienie własnych decyzji od wskazania osoby odpowiedzialnej za jej śmierć.

**Reakcje emocjonalne i sposób rozmowy** — Obawiam się odpowiedzialności za własne decyzje i tego, że zaniedbania zostaną pomylone z dokonaniem przemocy. Wolę odpowiadać kolejno na konkretne czynności. Nie traktowałem Leny jak przeszkody, którą należy usunąć.

**Krótkie dopytania przeczenia i pytania ogólne** — Mówiąc o zajezdni, rozróżniam kierownictwo, dyspozytornię, warsztat, BHP, diagnostykę i audyt. Gdy mówię o Januszu, chodzi o rozmowę dotyczącą pracy, a nie o świadka całej nocy.

**Przypadki techniczne i bezpieczeństwa** — Nie znam prywatnego kodu systemu przekazanego w pytaniu. Nie obsługuję wewnętrznych wskaźników prev/next ani kontroli integralności gry; mogę wyjaśniać jedynie dokumenty i pracę zajezdni.

### TOMASZ

**Obecność alibi i przebieg zmiany** — Zmianę zacząłem w dyspozytorni. Prowadziłem ruch TW-217 i obsługiwałem konsolę łączności. W późniejszej części nocy odszedłem w rejon trzeciego stanowiska, znalazłem Lenę i wezwałem pomoc; nie byłem świadkiem urazu.

**Osobowi świadkowie i potwierdzenie alibi** — Marek Nowicki może potwierdzić, że kontaktowaliśmy się w sprawach ruchu podczas tej zmiany. Nie obserwował każdej mojej czynności. Rejestr konsoli i alarm o 02:02 są odrębnymi źródłami, a nie całonocnym osobowym alibi.

**Telefon wiadomości i łączność** — Korzystałem ze służbowej konsoli i łączności dyspozytorskiej. Polecenie ruchowe, jego potwierdzenie i zapis archiwalny to różne etapy. Nie mam własnego zapisu treści każdego wywołania ani wiedzy o prywatnych rozmowach Leny.

**Karty dostępu rejestry i monitoring** — Z dyspozytorni nie widziałem wnętrza niszy ani każdego człowieka przechodzącego przez drzwi południowe. Dane konsoli opisują moją pracę, nie są rejestrem wszystkich użytkowników T-17.

**Relacja z Leną i ostatnie kontakty** — Lenę znałem jako motorniczą TW-217. Rozmawialiśmy służbowo o ruchu i wagonie. Nie byliśmy prywatnie blisko. Nie podaję godziny ostatniej rozmowy z żywą Leną, ponieważ nie pamiętam jej pewnie.

**Zastrzeżenia Leny i kierunek zgłoszeń** — Zastrzeżenia Leny dotyczyły wagonu i sprawdzenia jego stanu. Moim zadaniem było prowadzenie ruchu, nie przyjęcie za BHP formalnego zgłoszenia ani zatwierdzanie oznaczenia części w umowie.

**Źródła wiedzy pewność i pamięć** — Z własnej obserwacji znam znalezienie Leny i wezwanie pomocy. Nie widziałem wcześniejszego momentu urazu. Zapis ruchu nie daje mi wspomnienia cudzych czynności przy podzespołach.

**Chronologia alarm i odnalezienie Leny** — TW-217 rozpoczął kurs o 18:26; zgłoszenie diagnostyczne nastąpiło o 19:11. Potem prowadzono sprawy warsztatowe. Lenę znalazłem przed wezwaniem pomocy przyjętym o 02:02. To porządek zdarzeń, nie ustalenie minuty urazu.

**Wagon podzespoły i diagnostyka** — Dyspozycja ruchowa dotyczy skierowania wagonu. Nie przeprowadzałem próby hamulców, nie kalibrowałem czujników i nie wykonywałem audytu wózka. Nie zlecałem Lenie osobistego nocnego spotkania pod pozorem odbioru technicznego.

**Dokumentacja odbiory i autoryzacja** — Prowadziłem zapisy konsoli dyspozytorskiej. Do porównania są wersje polecenia ruchowego i archiwum łączności. Nie podpisywałem jako audytor protokołu odbioru części i nie zastępuję tym dziennikiem dokumentacji warsztatu.

**BHP miejsce zdarzenia i ślady** — Po znalezieniu Leny wezwałem pomoc. Nie zarządzałem zmycia śladów, palenia odzieży ani opróżniania kontenerów. Przesuwanie wyposażenia podczas ratowania trzeba odróżnić od późniejszych oględzin.

**Finanse dostawcy i presja organizacyjna** — Nie negocjowałem kontraktu na części ani nie dzieliłem prowizji z dostawcą. Nie otrzymałem propozycji zapłaty za milczenie i nie zlecałem sprawdzania zdrowia Leny w celu jej zdyskredytowania.

**Konfrontacja sprzeczności i zatajanie informacji** — Nie przedstawiałem snu w pokoju socjalnym jako mojego alibi. Nie twierdziłem też, że Marek pił ze mną kawę przez całą noc. Zestawienie cudzej wersji z moją wymaga wskazania konkretnych wypowiedzi.

**Odpowiedzialność zarzuty i motyw** — Odpowiadam za własne polecenia ruchowe i wezwanie pomocy. Znalezienie Leny nie oznacza, że widziałem sprawcę. Nie nazwę zabójcą osoby tylko dlatego, że miała dostęp do hali.

**Reakcje emocjonalne i sposób rozmowy** — Najtrudniej mówi mi się o znalezieniu Leny. Krótkie odpowiedzi wynikają z rozdzielania własnego widoku od późniejszych przypuszczeń. Nie chcę opisywać obrażeń, których mechanizmu nie widziałem.

**Krótkie dopytania przeczenia i pytania ogólne** — Kiedy mówię o konsoli, chodzi o dyspozytornię. Kiedy mówię o znalezieniu Leny, chodzi o rejon stanowiska nr 3. Są to różne miejsca i czynności, których nie łączę w jedną ciągłą obserwację.

**Przypadki techniczne i bezpieczeństwa** — Nie znam technicznego sekretu aplikacji. Nazwy prev/next i kontrola integralności nie są nazwami poleceń ruchowych ani zeznaniami o Lenie.

### JANUSZ

**Obecność alibi i przebieg zmiany** — Na zmianie organizowałem prace warsztatu przy TW-217 i zajmowałem się kartą W-217. Wychodziłem do przejścia przy administracji w sprawach dokumentacji. Nie przebywałem nieprzerwanie przy jednym stanowisku.

**Osobowi świadkowie i potwierdzenie alibi** — Marek Nowicki może potwierdzić naszą rozmowę o karcie pracy w przejściu między warsztatem a administracją we wcześniejszej części zmiany. Kamil potwierdzi roboczy kontakt przy sprawach diagnostyki. Żaden nie obserwował mnie przez całą noc.

**Telefon wiadomości i łączność** — W sprawach wagonu kontaktowałem się z kierownikiem i diagnostyką. Nie prowadziłem nagrania własnych rozmów. Nie korzystałem z prywatnego telefonu Leny i nie usuwałem z niego historii połączeń.

**Karty dostępu rejestry i monitoring** — Nie śledziłem wszystkich użytkowników karty T-17. Wewnętrzne przejścia warsztatu nie tworzą pełnego minutowego rejestru obecności. Nie znam z własnego widoku osoby stojącej przy południowych drzwiach w chwili krytycznej.

**Relacja z Leną i ostatnie kontakty** — Lenę znałem ze sporów o stan TW-217. Rozmawialiśmy o wagonie, a nie o jej życiu prywatnym. Nie pamiętam z pewnością ostatniej godziny naszego osobistego spotkania.

**Zastrzeżenia Leny i kierunek zgłoszeń** — Wiedziałem, że Lena chce sprawdzenia bezpieczeństwa i zgodności części. Jej uwagi wymagały kontroli technicznej, a nie zastąpienia wyniku samym zamknięciem formularza. Nie byłem odbiorcą całej jej korespondencji z audytem i BHP.

**Źródła wiedzy pewność i pamięć** — Z własnej pracy znam obsługę warsztatu i rozmowy o TW-217. O śmierci Leny usłyszałem po alarmie z dyspozytorni. Nie widziałem, jak powstały jej obrażenia.

**Chronologia alarm i odnalezienie Leny** — Obsługę warsztatową TW-217 zarejestrowano o 20:54. Diagnostyka była osobnym zadaniem Kamila. Wzywanie pomocy nastąpiło o 02:02, więc okres 02:00–02:30 nie jest w całości czasem sprzed znalezienia Leny.

**Wagon podzespoły i diagnostyka** — Zadanie warsztatu obejmowało oględziny i sprawdzenie oznaczenia części. Kamil zajmował się sygnałem pomiarowym. Ostrzeżenie TCMS i wstrząs czujnika hali to różne instalacje; nie wykonywałem kalibracji czujnika hali w tę noc.

**Dokumentacja odbiory i autoryzacja** — Karta W-217 i formularz zakończenia obsługi opisują pracę warsztatu, nie odbiór umowy przez audyt. Zlecenie, pomiar i zamknięcie formularza nie są tą samą czynnością.

**BHP miejsce zdarzenia i ślady** — Nie zlecałem wywozu części, zmywania stanowiska ani palenia ubrań po alarmie. Nie prowadziłem badań DNA, włókien ani linii papilarnych. Używanie narzędzia w zwykłej pracy nie ustala chwili późniejszego śladu.

**Finanse dostawcy i presja organizacyjna** — Nie zawierałem umów dostawczych i nie zatwierdzałem prowizji od kontraktu. Nie obiecywano mi zapłaty za milczenie. Wykonanie zadań w kolejce nie uprawniało do uznania niedokończonego pomiaru za wynik dodatni.

**Konfrontacja sprzeczności i zatajanie informacji** — Nie twierdziłem, że całą noc spałem ani że trzymałem wartę nad wszystkimi drzwiami. Karta pracy i obecność w hali wymagają osobnego wyjaśnienia. Nie obciążę Leny wymyślonym naruszeniem procedur, żeby zastąpić brakujący wynik.

**Odpowiedzialność zarzuty i motyw** — Mogę odpowiadać za sposób prowadzenia dokumentacji warsztatowej. Nie widziałem zabójstwa i nie potrafię przypisać urazu konkretnej osobie. Zaniechanie kontroli oraz przemoc to różne ustalenia.

**Reakcje emocjonalne i sposób rozmowy** — Denerwuje mnie utożsamianie braków formularza z dokonaniem zabójstwa. Mogę wyjaśniać rubryki i czynności kolejno. Nie uważam śmierci Leny za zwykłą statystykę.

**Krótkie dopytania przeczenia i pytania ogólne** — Mówiąc o karcie, mogę mieć na myśli W-217, a nie identyfikator T-17. Kiedy mówię o zamknięciu, chodzi o formularz obsługi, a nie o zamknięcie drzwi lub rozwiązanie sprawy.

**Przypadki techniczne i bezpieczeństwa** — Nie znam sekretów programu ani wskaźników interfejsu. W warsztacie kontrola zgodności oznacza sprawdzenie dokumentu i części, a nie automatyczne wykrycie sprawcy.

### ELZBIETA

**Obecność alibi i przebieg zmiany** — Zajmowałam się sprawami BHP i pracą przy dokumentacji zagrożeń. Nie wykonywałam nocnych napraw TW-217 ani osobistej obserwacji niszy stanowiska nr 3. Moja relacja o Lenie dotyczy przede wszystkim rozmowy o ryzyku.

**Osobowi świadkowie i potwierdzenie alibi** — Lena była bezpośrednią uczestniczką naszej rozmowy o 21:47. Dziś nie może jej potwierdzić; pozostaje biling i moja relacja. Nie wskażę innej osoby, która słyszała całą rozmowę lub obserwowała mnie przez całą noc.

**Telefon wiadomości i łączność** — Rozmawiałam z Leną przez służbowe połączenie o 21:47. Mówiła o bezpieczeństwie TW-217, nie o swoim zdrowiu. Nie mam nagrania; opowiadam sens rozmowy własnymi słowami, bez udawania dosłownego cytatu.

**Karty dostępu rejestry i monitoring** — Nie obserwowałam południowych drzwi i nie uczestniczyłam w wydaniu lub przekazaniu T-17. Rozmowa telefoniczna z Leną nie dawała mi widoku jej późniejszej trasy przez zajezdnię.

**Relacja z Leną i ostatnie kontakty** — Znałam Lenę zawodowo przez sprawy bezpieczeństwa. W rozmowie o 21:47 zwróciła się do mnie bezpośrednio. Nie spotkałyśmy się osobiście podczas tego telefonu, a późniejszego kontaktu nie umiem potwierdzić.

**Zastrzeżenia Leny i kierunek zgłoszeń** — Lena opisywała ryzyko związane z TW-217 i potrzebę sprawdzenia niezgodności. To ona zgłaszała obawy, ja ich słuchałam. Rozmowa ustna ze mną i skutecznie przyjęty formalny formularz są osobnymi sprawami.

**Źródła wiedzy pewność i pamięć** — Treść rozmowy znam jako uczestniczka. Godzinę mogę zestawić z bilingiem. O znalezieniu Leny dowiedziałam się po alarmie, a nie dlatego, że byłam przy urazie. Późniejszych ustaleń śledczych nie nazywam własnym wspomnieniem.

**Chronologia alarm i odnalezienie Leny** — Pewnym punktem mojego kontaktu z Leną jest 21:47. Alarm nastąpił później, o 02:02. Nie przebywałam przy stanowisku w momencie powstania obrażeń i nie nadaję godzinie alarmu znaczenia godziny urazu.

**Wagon podzespoły i diagnostyka** — Moja rola dotyczyła ryzyka dla ludzi i drogi zgłoszenia. Nie wykonywałam próby hamulców, kalibracji ani odbioru części. Zastrzeżenia do bezpieczeństwa nie są diagnozą konkretnego uszkodzonego czujnika.

**Dokumentacja odbiory i autoryzacja** — Rozróżniam rozmowę, zapis roboczy zgłoszenia i potwierdzenie przyjęcia przez właściwy system. Podpis lub zapisanie pliku nie jest dowodem wysłania. Treść projektu można porównać z potwierdzeniem nadania.

**BHP miejsce zdarzenia i ślady** — Nie byłam świadkiem położenia osłony przed pomocą. W sprawach bezpieczeństwa znaczenie mają osłony, dostęp do stanowiska i odłączenie źródeł zagrożenia; stan zastany przez ratowników trzeba ustalać oddzielnie.

**Finanse dostawcy i presja organizacyjna** — Nie rozliczałam dostaw części ani nie otrzymałam pieniędzy za milczenie. Nie zlecałam badania zwolnień Leny i nie obiecywałam awansu za zmianę relacji. Mój obowiązek BHP pozostawał niezależny od terminu odbioru.

**Konfrontacja sprzeczności i zatajanie informacji** — Nie będę twierdziła, że sama widziałam śmierć Leny lub że biling potwierdza wysłanie zgłoszenia. Mogę porównać treść własnego opisu z okazanym dokumentem i jasno oddzielić te dwie sprawy.

**Odpowiedzialność zarzuty i motyw** — Własny obowiązek reagowania na ryzyko odróżniam od wiedzy o tym, kto spowodował obrażenia. Nie znam sprawcy z osobistej obserwacji. Poczucie winy po śmierci Leny nie czyni mnie świadkiem jej zabójstwa.

**Reakcje emocjonalne i sposób rozmowy** — Najbardziej obawiam się, że zlekceważenie sygnału o ryzyku mogło mieć konsekwencje. Rozmowa o Lenie jest trudna; wolę omówić osobno to, co powiedziała, i to, co później zrobiono z informacją.

**Krótkie dopytania przeczenia i pytania ogólne** — Mówiąc o rozmowie, mam na myśli kontakt o 21:47. Mówiąc o formalnym zgłoszeniu, mam na myśli obieg dokumentu BHP. Nie są to synonimy i nie należy zastępować jednego drugim.

**Przypadki techniczne i bezpieczeństwa** — Nie znam fikcyjnego sekretu z pytania i nie zajmuję się kodem gry. Zasady integralności danych nie potwierdzają, że wykonałam obowiązek wysłania dokumentu.

### KAMIL

**Obecność alibi i przebieg zmiany** — Na zmianie zajmowałem się diagnostyką TW-217 według zlecenia DIAG-217/N. Pracowałem przy stanowisku diagnostycznym i kontaktowałem się z warsztatem. Sesja systemu nie obejmuje wszystkich moich wyjść.

**Osobowi świadkowie i potwierdzenie alibi** — Janusz Wójcik może potwierdzić roboczy kontakt przy sprawach diagnostyki tej zmiany. Nie obserwował mnie co minutę. Log sesji i autoryzacja są niezależnymi zapisami czynności systemu, a nie relacją osobowego świadka całej nocy.

**Telefon wiadomości i łączność** — Posługiwałem się stanowiskiem diagnostycznym i służbowymi zapisami sesji. Nie obsługiwałem prywatnego telefonu Leny. Numer konta i urządzenia trzeba odróżnić od osoby, która w danej chwili je obsługuje.

**Karty dostępu rejestry i monitoring** — Karta jest nośnikiem uprawnień, a nie biometrycznym świadkiem. Nie wykonywałem całonocnej obserwacji południowych drzwi. Odczyt T-17 nie zastępuje ustalenia, w czyjej ręce była wtedy karta.

**Relacja z Leną i ostatnie kontakty** — Znałem Lenę zawodowo i rozmawiałem z nią o diagnostyce wagonu. Nie znam jej prywatnych notatników i poprzedniego przełożonego. Nie pamiętam dokładnej minuty naszego ostatniego osobistego spotkania.

**Zastrzeżenia Leny i kierunek zgłoszeń** — Lena zgłaszała zastrzeżenia do wagonu. Moje zlecenie dotyczyło niespójności sygnału pomiarowego, a sprawdzenie wariantu części wymagało osobnego porównania dokumentów z elementem.

**Źródła wiedzy pewność i pamięć** — Potrafię opisać własną diagnostykę i odczytać zapis systemowy. Czas z logu nie staje się pamięcią spotkania z Leną. O jej śmierci dowiedziałem się po alarmie; nie obserwowałem chwili urazu.

**Chronologia alarm i odnalezienie Leny** — Diagnostyka miała podstawę w zleceniu DIAG-217/N z 19:46. Samo zlecenie poprzedza wykonanie próby. Alarm o znalezieniu Leny nastąpił o 02:02 i jest odrębny od zapisu diagnostycznego.

**Wagon podzespoły i diagnostyka** — WARN-MEASURE dotyczy spójności pomiaru w TCMS. Czujnik wstrząsu stanowiska należy do hali, nie do systemu tramwaju. Nie wykonywałem tej nocy aktualizacji oprogramowania sterownika jazdy ani celowego mostkowania przekaźników.

**Dokumentacja odbiory i autoryzacja** — Pracę diagnostyczną trzeba porównać z autoryzacją i przebiegiem sesji. Zakończenie testu nie jest podpisaniem odbioru wariantu części ani dowodem poprawności wszystkich pól formularza warsztatu.

**BHP miejsce zdarzenia i ślady** — Nie zlecałem wywozu podzespołów, odłączania kamer, zmywania śladów ani palenia ubrań. Nie usuwałem programowo czujników ruchu w korytarzu. Analiza śladów ludzi wymaga odrębnego badania.

**Finanse dostawcy i presja organizacyjna** — Nie zawierałem umowy na dostawę części ani nie dzieliłem prowizji kontraktowych. Nie otrzymałem zapłaty za milczenie. Rozbieżność L-2/L-3 wymaga odrębnego sprawdzenia, nie wyprowadzenia kwoty z błędu TCMS.

**Konfrontacja sprzeczności i zatajanie informacji** — Nie twierdziłem, że całą noc spałem albo że autoryzacja dowodzi mojej nieprzerwanej obecności. Własne czynności i tożsamość użytkownika karty to różne pytania.

**Odpowiedzialność zarzuty i motyw** — Odpowiadam za własne czynności diagnostyczne i sposób posługiwania się uprawnieniami. Nie znam sprawcy śmierci z osobistej obserwacji. Ostrzeżenie systemu nie wskazuje człowieka, który zranił Lenę.

**Reakcje emocjonalne i sposób rozmowy** — Obawiam się, że zapis techniczny zostanie odczytany jako dowód czynu, którego nie opisuje. Mogę wyjaśniać pola logu krok po kroku. Sama irytacja nie jest przyznaniem się do przemocy.

**Krótkie dopytania przeczenia i pytania ogólne** — Kiedy mówię o sesji, chodzi o diagnostykę TW-217; kiedy o czujniku stanowiska, o instalację hali. Rozróżniam też konto, kartę, urządzenie i fizycznego użytkownika.

**Przypadki techniczne i bezpieczeństwa** — Wskaźniki prev/next łączą rekordy w strukturze danych, a kontrola integralności może wykazać niezgodność zapisu. Same nie potwierdzają tożsamości człowieka ani prawdziwości zdania. Nie znam sekretu podanego wyłącznie przez klienta.

### MAGDALENA

**Obecność alibi i przebieg zmiany** — Pracowałam nad zgodnością dokumentacji odbiorowej i umów. Podtrzymuję, że od 01:30 do 02:00 trwała moja sesja audytowa. Nie przedstawiam samego połączenia jako pełnego zapisu mojego fizycznego położenia.

**Osobowi świadkowie i potwierdzenie alibi** — Uczestnicy sesji mogą potwierdzić połączenie i udostępnianie materiału. Nie traktuję tego jako osobistej obserwacji mojej osoby przez cały czas. Nie wskazuję nazwiska człowieka, który śledził każdą minutę mojego pobytu.

**Telefon wiadomości i łączność** — Posługiwałam się służbowym środowiskiem audytu i dokumentacją ZG-41. Aktywne konto oraz wysłanie konkretnej wiadomości są odrębnymi ustaleniami. Proszę rozpatrywać pełny wątek zamiast pojedynczych inicjałów.

**Karty dostępu rejestry i monitoring** — Zapis karty i sesja audytowa wymagają osobnej interpretacji. Nie byłam osobą rejestrującą wszystkie przejścia innych pracowników. Sam wpis ewidencji nie jest zdjęciem użytkownika przy drzwiach.

**Relacja z Leną i ostatnie kontakty** — Lenę znałam w związku ze zgodnością części i dokumentów odbiorowych. Nie byłyśmy prywatnymi przyjaciółkami. Nie podaję pewnej minuty naszego ostatniego spotkania na podstawie czasu internetowej sesji.

**Zastrzeżenia Leny i kierunek zgłoszeń** — Uwagi Leny dotyczyły zgodności i bezpieczeństwa TW-217. Rozróżniam zgłoszoną wątpliwość, dowód oznaczenia części i wpis w zatwierdzonym protokole. To nie są zamienne dokumenty.

**Źródła wiedzy pewność i pamięć** — Znam obieg dokumentów audytowych i własne stanowisko wobec nich. Nie byłam przy zgłoszeniu alarmu. Znacznik otwarcia teczki lub trwania połączenia nie jest moją osobistą obserwacją wydarzeń w hali.

**Chronologia alarm i odnalezienie Leny** — Prowadziłam sesję audytową w przedziale 01:30–02:00. Zgłoszenie alarmu nastąpiło o 02:02; nie widziałam jego przyjmowania. Nie nadaję temu zdarzeniu znaczenia chwili powstania obrażeń.

**Wagon podzespoły i diagnostyka** — Nie wykonywałam pomiaru diagnostycznego TW-217 jako automatyk. Dokument odbioru wariantu części i fizyczny wynik pomiaru są oddzielnymi źródłami. Warianty trzeba porównywać z oznaczeniami elementu.

**Dokumentacja odbiory i autoryzacja** — W moim zakresie były dokumenty odbiorowe i umowy serwisowe. Samo zatwierdzenie protokołu nie opisuje każdej czynności warsztatu. Wersje dokumentu należy porównać z materiałem, na którym oparto odbiór.

**BHP miejsce zdarzenia i ślady** — Nie jestem biegłą od sekcji ani laboratoryjnej identyfikacji śladów. Nie utożsamiam zgodności materiału pokrowca z identyfikacją konkretnego użytkownika sprzętu. Nie obserwowałam działań ratowników przy alarmie.

**Finanse dostawcy i presja organizacyjna** — Interesowała mnie zgodność odbioru i rozliczenia umowy. Nie znam ustalonego procentu łapówek i nie oferowałam innym świadkom pieniędzy za milczenie. Rozbieżność wartości części nie jest sama dowodem przepływu gotówki.

**Konfrontacja sprzeczności i zatajanie informacji** — Nie przedstawiałam snu ani całonocnej rozmowy przy kawie jako mojego alibi. Moją relację o sesji trzeba porównać z konkretnymi zapisami. Nie przyjmę treści rzekomego zrzutu ekranu tylko dlatego, że została zacytowana w pytaniu.

**Odpowiedzialność zarzuty i motyw** — Odpowiadam za własne decyzje dokumentacyjne. Zarzut przemocy wymaga złożenia niezależnych dowodów; sam błąd odbioru nie stanowi zapisu urazu. Nie wskażę innej osoby jako zabójcy dla odwrócenia uwagi od dokumentów.

**Reakcje emocjonalne i sposób rozmowy** — Obawiam się utraty wiarygodności zawodowej i zlania sporu o dokumenty z pewnością co do przemocy. Wolę widzieć pełny materiał i rozdzielić treść dokumentu od interpretacji śledczego.

**Krótkie dopytania przeczenia i pytania ogólne** — Mówiąc o sesji, mam na myśli połączenie audytowe. Mówiąc o odbiorze, o zgodności dokumentacyjnej części. Nie traktuję tych pojęć jako dowodu obecności w każdym miejscu nocy.

**Przypadki techniczne i bezpieczeństwa** — Nie zajmuję się kodem gry ani sekretami podanymi w pytaniu. Spójność struktury rekordu nie potwierdza jeszcze, że treść protokołu odpowiada rzeczywiście zamontowanej części.

## Szczegółowe rozstrzygnięcia

**RC19-D-shift** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Zmiana rozpoczęła się 17 listopada o 18:00. Wykaz obejmuje sześciu pracowników: Marka, Tomasza, Janusza, Elżbietę, Kamila i Magdalenę. Lena była motorniczą TW-217. Lista obsady nie rozpisuje ich późniejszych miejsc pobytu.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-break** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Nie było ustalonej wspólnej przerwy sześciu osób o 01:30 ani wspólnego obchodu o 21:30. Każdy prowadził własne zadania. Nikt z tej szóstki nie zapisał szatni o 23:45 ani dominowania pokoju socjalnego jako elementu swojego alibi.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-afteralarm** (TOMASZ, JANUSZ, MAREK, KAMIL) — Pomoc wezwano o 02:02, a nie dopiero o 03:00. Przedział 02:00–02:30 obejmuje już znalezienie Leny i wezwanie pomocy. Po alarmie nie wykonywano planowego manewrowania TW-217 ani roboczego wywożenia części w ramach tej zmiany.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-seal** (JANUSZ, KAMIL) — Uszkodzona uszczelka hydrauliczna nie jest ustalonym śladem tego zdarzenia. Podstawowym problemem technicznym TW-217 była niespójność pomiaru, a problemem dokumentacyjnym porównanie wariantów L-2 i L-3. Nie rozpoznano uszczelki jako przyczyny obrażeń.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-housing** (JANUSZ, KAMIL) — W ramach obsługi W-217 nie zdemontowano i nie wywieziono zniszczonej obudowy sterownika, nie przełożono części z rozbitego wagonu i nie skierowano instalacji TW-217 do kontenera na złom. Zadanie dotyczyło oględzin, pomiaru i sprawdzenia oznaczeń.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-mobbing** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Żadna z sześciu przesłuchiwanych osób nie składała skargi o mobbing do kadr w związku z tą zmianą. Konflikty znane tej szóstce dotyczyły wagonu, dokumentacji i odpowiedzialności za wykonane zadania.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-privatecar** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Żaden z sześciu świadków nie obserwował prywatnego samochodu wywożącego torbę ze stanowiska ani nie pakował do niego części. Nie ma przypisanego do tej historii transportu dowodów prywatnym autem o 02:20.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-notebook** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Świadkowie nie znali prywatnego schowka Leny, tajnego archiwum ani jej poprzedniego przełożonego. Zawodowo znali ją jako motorniczą TW-217, zgłaszającą zastrzeżenia. Zdjęcie tabliczki części należy odróżnić od wymyślonej historii prywatnego notatnika.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-lever** (JANUSZ, KAMIL) — Stanowisko nr 3 nie wymagało opisanego w pytaniu wspólnego pociągnięcia dźwigni przez dyżurnego, mechanika i ochronę. Nie było tak przydzielonej trójki wykonawców. Czujnik wstrząsu mierzył sygnał infrastruktury hali.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-quarrel** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Żaden ze świadków nie słyszał opisanej groźby „skrócenia kariery” lub „pożałowania wtrącania się” ani nie rozpoznał głosu kłótni z godziny 01:40. Spory zawodowe o wagon nie są zapamiętanym przez nich aktem grożenia Lenie.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-brakes** (JANUSZ, KAMIL) — Ta obsługa nie dotyczyła montażu niecertyfikowanego modułu hamowania, zablokowania hamulca w pozycji zwolnionej ani wyjęcia głównego bezpiecznika przed oględzinami Leny. Zlecono diagnostykę niespójności sygnału TCMS, nie potwierdzono w ten sposób awarii powodującej jej uraz.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-radiochannel** (TOMASZ) — Ruch TW-217 prowadzono przez służbowy kanał dyspozytorski. Tomasz używał konsoli, nie rozpoznawał wszystkich rozmówców wzrokowo. Nie zmieniano w tej obsłudze szyfrowania kanału i nie przydzielono TR-04 jako osobnego narzędzia zdarzenia; rozkazu „wstrzymać manewry” przed północą świadkowie nie pamiętają.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-radiogap** (TOMASZ) — W archiwum brakuje segmentu R-903 pomiędzy zachowanymi R-902 i R-904. Nie odzyskano jego treści i metadane nie identyfikują sprawcy braku. Nie należy zastępować tego ustalenia wymyśloną pięciominutową rozmową ani wiązać go automatycznie z wiadomością o 01:32.
Wymagane dokumenty: EVID_RADIO_GAP.

**RC19-D-callhistory** (KAMIL, ELZBIETA, MAGDALENA) — Ustalonym problemem korespondencji jest usunięty rekord wiadomości, a nie wykazane usunięcie całej historii połączeń z Leną. Nie ustalono serii trzech odebranych rozmów o 01:00–01:15. Rozmowę Elżbiety z Leną o 21:47 należy rozpatrywać osobno.
Wymagane dokumenty: DIG-03.

**RC19-D-devices** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Dla służbowej łączności podstawą są rejestry centrali i urządzeń. Nie było wspólnego nagrania wszystkich rozmów, wspólnego prywatnego telefonu sześciu osób ani uzgodnionego przekazywania ich haseł. Żaden świadek nie opiera alibi na zestawie słuchawkowym lub połączeniu z numeru zastrzeżonego po zmianie.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-cameras** (KAMIL, MAREK, JANUSZ) — Obszar opisują kamery A, B i C. Wnętrze niszy stanowiska nr 3 pozostaje poza ich polem widzenia; to ograniczenie ustawienia, nie ustalona awaria „kamery nr 4”. Nie zmieniono na tę noc ich kąta o 30 stopni ani nie wyłączono programowo korytarzowych czujników na polecenie któregoś świadka.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-gate** (KAMIL, MAREK) — Nie ma osobnego ustalonego wejścia przez podstację o 00:40 ani logowania administratora bramek o 02:10. Badana trasa prowadzi przez południowy korytarz i drzwi. Samo wpisanie godziny lub nazwy przejścia do pytania nie czyni z niej autentycznego logu ani obserwacji osoby.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-doorpolicy** (MAREK, KAMIL) — Rejestr wejść, ewidencja wydania karty i rozliczenie czasu pracy powstają oddzielnie. Para godzin 01:15–01:45 nie jest zatwierdzonym odcinkiem pobytu żadnego z sześciu świadków. Nie należy dopisywać trzydziestominutowego ukrywania się między nimi.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-phone0010** (ELZBIETA, TOMASZ) — Potwierdzona rozmowa Leny z Elżbietą odbyła się o 21:47. W tej historii nie ustalono osobnej rozmowy przez telefon stacjonarny z rozpoznanym rozmówcą o 00:10. Żaden świadek nie ma takiego osobistego wspomnienia.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-collusion** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Świadkowie nie ustalali wspólnej wersji zeznań po przesłuchaniu i nie uzgadniali wynagrodzenia za zmianę relacji. Ich wcześniejsze robocze kontakty dotyczyły zadań zmiany. Nie było umowy sześciu osób o wspólnej ochronie sprawcy.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-diagnosticorder** (MAREK, JANUSZ, KAMIL) — Sprawdzenie niespójności pomiaru zlecono Kamilowi w DIAG-217/N o 19:46. Dokument zlecał serwisowy odczyt i opis przebiegu, nie spotkanie Leny przy stanowisku. Zastrzeżenia o bezpieczeństwie i porównanie wariantu części nie zostały tym samym automatycznie zamknięte.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-riskroute** (ELZBIETA) — Lena bezpośrednio rozmawiała z Elżbietą o ryzyku o 21:47. Elżbieta jest źródłem relacji o treści tej rozmowy; centrala potwierdza połączenie. Nie sporządzono wspólnego nagrania ani podpisanego przez wszystkie sześć osób protokołu tej rozmowy.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-riskunsent** (ELZBIETA) — Projekt zgłoszenia pozostał niewysłany. W dzienniku przyjęć brak odpowiadającego mu potwierdzenia, mimo przyjmowania innych przesyłek. Nie był to formalnie odebrany alarm BHP i brak wysyłki nie wynika z potwierdzonej ogólnej awarii systemu.
Wymagane dokumenty: EVID_BHP_DRAFT, EVID_OUTBOX_MISSING_SUBMISSION.

**RC19-D-keys** (MAREK, JANUSZ) — Nie było w tej historii udokumentowanego dorabiania kluczy magazynowych, zgłoszonego zaginięcia klucza do szafy tydzień przed zmianą ani fałszywej karty pobrania narzędzi przypisanej świadkowi. Klucz pasujący do zamka nie rejestruje osoby używającej go tej nocy.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-returntime** (TOMASZ, MAREK, JANUSZ) — Dziennik potwierdza rozpoczęcie kursu o 18:26, zgłoszenie diagnostyczne o 19:11 i wpis warsztatowy o 20:54. Nie oznacza to powrotu bez zgłoszenia o 20:00, nakazu o 20:45 ani potwierdzonego przenoszenia rzeczy przez Lenę o 19:15.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-dispatch** (TOMASZ) — Polecenie TD-217 zmieniono o 23:14 ze standardowego przyjęcia na niestandardowe skierowanie. Dotyczyło trasy tramwaju. Nie zawierało zaproszenia Leny do osobistego spotkania przy stanowisku nr 3.
Wymagane dokumenty: EVID_DISPATCH_REVISION.

**RC19-D-lights** (KAMIL, JANUSZ, ELZBIETA) — W tej historii nie doszło do ustalonego zaniku zasilania hali o 01:15, ręcznego resetu o 01:18 ani zatrzymania zegara o 02:14. Nie zidentyfikowano tajemniczego poboru 50 kW. Świadkowie nie opisują niesprawnych od tygodnia świateł awaryjnych i przeterminowanych gaśnic jako tła tej zmiany.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-hotwork** (MAREK, TOMASZ, JANUSZ, KAMIL) — Do obsługi TW-217 nie zamawiano nocnego palnika ani wizyty oznaczonej „Serwis Zewnętrzny” o 23:10. Sześciu świadków nie otrzymało zadania obchodu podstacji o 01:00. Ich zadania dotyczyły ruchu, warsztatu, BHP, diagnostyki i audytu.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-software** (KAMIL, JANUSZ) — TCMS-217/N zapisuje niespójność pomiaru. W ramach tej obsługi nie instalowano nowego sterownika, nie wykonywano zdalnej aktualizacji jazdy i nie zgłoszono błędów sum kontrolnych terminalu. SCADA oraz wymiana całego systemu rejestracji usterek nie są odrębnymi ustalonymi awariami tej sprawy.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-tools** (JANUSZ, KAMIL) — Żadnemu świadkowi nie przypisano indywidualnie rozpoznanego śrubokręta, klucza dynamometrycznego lub odcisku dłoni jako dowodu urazu Leny. Narzędzia warsztatowe bywały współużytkowane. Ślad materiału wymaga porównania, a nie obietnicy wyniku przyszłego badania DNA.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-inspections** (JANUSZ, KAMIL, ELZBIETA) — W tej sprawie nie wprowadzono skrócenia przeglądu z ośmiu godzin do 45 minut, nocnej kalibracji pneumatyki ani zdjęcia instrukcji awaryjnej. Nie ustalono uszkodzonej plomby zastąpionej taśmą, wygasłego certyfikatu falownika lub fałszywego odczytu niesprawnego manometru.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-variants** (JANUSZ, KAMIL, MAGDALENA) — L-2 i L-3 oznaczają warianty podzespołu, a nie dwa niezależnie udowodnione sabotaże. Różnią się dopuszczeniem i wartością. Problemem jest porównanie oznaczenia fizycznej części z dokumentacją, nie ustalona historia falownika pochodzącego z rozbiórki.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-physicall2** (JANUSZ, KAMIL, MAGDALENA) — Ewidencja magazynowa i fotografia tabliczki wskazują L-2. Podpisany przez Magdalenę protokół wpisuje L-3. To konkretna rozbieżność wariantu i odbioru; nie ustalono na tej podstawie tajnego rejestru Leny ani kwoty defraudacji.
Wymagane dokumenty: TEC-07, EVID_SERIAL_PHOTO, EVID_ACCEPTANCE_RECORD.

**RC19-D-bayplan** (JANUSZ, KAMIL) — Plan stanowiska nr 3 rozróżnia niszę N-3, pomieszczenie pomiarowe P-3, stanowisko S-3 i południowy korytarz K-P. Nie wskazuje osobnego potwierdzonego miejsca wyjęcia bezpiecznika. Przebiegu drogi nie należy zastępować wymyślonym przejściem podziemnym.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-previousaccident** (MAREK, JANUSZ, ELZBIETA, MAGDALENA) — Nie przypisano tej historii zatajenia podobnego śmiertelnego wypadku sześć miesięcy wcześniej, zakleszczenia drzwi, brakującego przeglądu z poprzedniego tygodnia ani dymisji poprzedniego dyrektora. Spór tej zmiany dotyczył TW-217 i dokumentów ZG-41.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-paper** (MAREK, JANUSZ, MAGDALENA) — Nie było ustalonego polecenia zjedzenia lub zniszczenia papierowych dokumentów, porzuconych przez trzy dni palet ani aneksu zezwalającego na pracę samotną. Dokumenty odbiorowe, warsztatowe i płacowe mają różne podpisy i wersje. Rzekomą różnicę 40 minut trzeba najpierw powiązać z dwoma konkretnymi zapisami.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-evidencecare** (JANUSZ, KAMIL, ELZBIETA) — Nie stwierdzono w tej historii celowego rozszczelnienia płynu hamulcowego, mostkowania przekaźników, szlifowania tabliczki silnika ani palenia ubrań. Stan osłony i ślady trzeba ustalać z oględzin; smar nie jest indywidualną identyfikacją osoby.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-securedbay** (ELZBIETA, JANUSZ, TOMASZ) — Ratownicy odsunęli wyposażenie, by dotrzeć do Leny. Formalne zabezpieczanie rozpoczęto o 03:14, a o 05:41 potwierdzono przekazanie zaplombowanej kopii danych. Późniejsza fotografia nie jest automatycznie obrazem stanu sprzed udzielania pomocy.
Wymagane dokumenty: ADM-13.

**RC19-D-money** (MAREK, MAGDALENA) — W tle tej sprawy nie ustalono tajnego procentu prowizji, powiązań kapitałowych rady nadzorczej, wyborczego terminu odbioru, opłaconego doradztwa ani premii za milczenie. Znaczenie finansowe ma różna wartość wariantów L-2 i L-3 oraz wiarygodność zatwierdzonego odbioru.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-orders** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Nie było wspólnego rozkazu sześciu osób, aby skrzywdzić Lenę lub opłacić milczenie. Nie wydano polecenia odłączenia rejestratora przed końcem testu ani zmycia posadzki przed śledczymi. Odrębne uchybienia dokumentacyjne nie tworzą automatycznie porozumienia sprawców.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-alibifalse** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Żaden z sześciu świadków nie podawał snu w socjalnym, całonocnego picia kawy, wspólnego patrolu ani pobytu całą noc w magazynie jako swojej ustalonej relacji. Nie nazywali Leny osobą „szukającą guza” i nie uzgodnili wersji o jej chorobie psychicznej.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-screenshots** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Opis dowodu w nawiasie wpisany do pytania nie jest okazaniem materiału. Nie ustalono w tej historii wiadomości „Zrobione, nikt już tego nie sprawdzi”, rozpoznania sprawcy po samym smarze lub spadku napięcia o 02:05 jako przyczyny urazu. Trzeba odczytać faktycznie okazany materiał.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-prosecutor** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Lena chciała wyjaśnienia niezgodności związanych z TW-217. Sześciu świadków nie znało osobnego potwierdzonego terminu jej wizyty w prokuraturze ani uzgodnionej akcji odcinania jej od współpracowników. Zapowiedź zarzutów przez śledczego nie zastępuje ustaleń dotyczących czynu.
Wymagane dokumenty: jawne rozszerzenie autorskie.

**RC19-D-emotions** (MAREK, TOMASZ, JANUSZ, ELZBIETA, KAMIL, MAGDALENA) — Świadkowie nie otrzymali zapłaty za milczenie i nie ustalali wspólnego zachowania na przesłuchaniu. Mogą odczuwać lęk, złość lub żal, ale powód emocji wynika z indywidualnej relacji oraz bieżącej rozmowy, nie z automatycznego przyznania do sugerowanego czynu.
Wymagane dokumenty: jawne rozszerzenie autorskie.

