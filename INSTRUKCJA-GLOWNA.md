# Prawdziwe Śledztwo — jedna aktualna instrukcja RC57.10.23

Wersja: **RC57.10.23**. Ten dokument zastępuje historyczne poradniki `INSTRUKCJA-RC...` i `README-PAKIET...`. Dawne wydania znajdują się tylko w `docs/archiwum-instrukcji/`. Gdy treść historyczna jest sprzeczna z tą instrukcją, obowiązuje obecny kod i ten dokument.

## 1. Co zmieniono w dialogach

1. **Odpowiedź na aktualną intencję:** bez powtórnego recytowania całego alibi przy każdym pytaniu. Świadek może powtórzyć fakty na wyraźne żądanie podsumowania.
2. **Indywidualny język sześciu świadków:** Marek — rzeczowy; Tomasz — oszczędny; Janusz — praktyczny warsztatowy; Elżbieta — rzeczowa BHP; Kamil — techniczny; Magdalena — precyzyjna. Nacisk wpływa na ton, nigdy nie tworzy nowych faktów ani motywów.
3. **Pamięć pierwszej wypowiedzi:** osobno od pamięci początku zmiany. W testach QA sygnalizowane jest dopisywanie pierwszej turze konkretnych szczegółów z późniejszych zeznań.
4. **Odpowiedź na pytanie i rodzaj gramatyczny:** pytania do Elżbiety/Magdaleny mają właściwą odmianę; odpowiedzi z błędną pierwszoosobową formą są przed zatwierdzeniem kierowane do pojedynczej korekty. Przy nieznanym miejscu pobytu świadek ma powiedzieć o niepewności wprost.
5. **Powtórzenia zależne od kontekstu:** podobne fragmenty zgłaszane są jako ostrzeżenia jakości, a nie zawsze twarde blokady. Wyjątek dla zapytań o wcześniejsze słowa, sprostowania i podsumowania pozostaje aktywny. Kontrola faktów jest nadal obowiązkowa.

## 2. Jedno źródło instrukcji AI

Jedynym źródłem **normatywnych instrukcji generowania i audytu** jest `lib/interview-prompt-rc57106.js`: `interviewAnswerSystem`, `interviewAuditSystem`, mapy `FOCUS_GUIDANCE`, `REPAIR_GUIDANCE`, `WITNESS_VOICE_PROFILES` i powiązane stałe kompatybilności. **Nowe reguły dopisuj w tym pliku**, nie w kolejnych modułach wersjonowanych.

Pozostałe moduły mają inne zadania: `interview-style-cue-rc57108.js` wylicza kontekst pytania i ostatnie zwroty; `interview-naturalness-rc28.js` przekazuje modelowi payload i kontroluje styl; `interview-quality-635.js` sprawdza tekst, `interview-rc57103-gate.js` zarządza kontrolami przed akceptacją, `dialogue-memory-636.js` odczytuje wyłącznie zatwierdzone słowa danego świadka, `interview-gender-rc571011.js` wykonuje wąską kontrolę polskiej odmiany. Żaden z tych modułów nie dodaje wiedzy o zdarzeniu.

Obecne historyczne nazwy importów `RC50_DIRECTIVE`, `RC51_DIRECTIVE`, `RC52_DIRECTIVE` i `RC28_REPAIR_INSTRUCTION` zachowano jako **reeksporty** z głównego pliku — nie są niezależnymi instrukcjami.

## 3. Wgranie plików

- **Pełny ZIP:** zalecany, gdy wersja na GitHub nie jest dokładnie RC57.10.22 albo chcesz usunąć stare poradniki z katalogu głównego. Rozpakuj i zamień zawartość odpowiedniego repozytorium. Najpierw zrób kopię/gałąź Preview.
- **ZIP zmian:** wyłącznie do projektu o dokładnie tej samej bazie RC57.10.22; nadpisz pliki zgodnie ze strukturą katalogów. Paczka zmian nie może sama usunąć dawnych plików z repozytorium: ich listę zawiera `USUN-STARE-INSTRUKCJE.txt`. Dla pełnego porządku wybierz pełny ZIP.
- Nie wrzucaj archiwum ZIP jako pojedynczego pliku do GitHub. Nie wgrywaj `.env` z sekretami ani prywatnych plików JSON raportów.
- Przy używaniu GitHub + Vercel wdrażaj wersję **Preview** i dopiero po sprawdzeniu produkcję. Sama paczka nie zmienia wdrożenia ani zapisów Supabase.

## 4. Konfiguracja w Vercel

Istniejące zmienne (bez zmiany kluczy w tym wydaniu):

- `APINEX_API_KEY` — klucz dostawcy, wyłącznie po stronie serwera.
- `RC57_ADMIN_PASSWORD` (min. 20 znaków) i **inny** `RC57_ADMIN_SECRET` (min. 32 znaki) — dostęp do testera.
- `RC57_LIVE_TEST_ENABLED=true` — tylko gdy uruchamiasz testy; po teście najlepiej `false`.
- `APINEX_SHARED_QUOTA_ENABLED=true` — opcjonalny globalny ogranicznik tylko jeżeli **wcześniej** wdrożono odpowiedni mechanizm SQL (migracja 007). Nie włączaj bez sprawdzenia schematu.

W tej wersji **nie są wymagane nowe migracje SQL**. Kod nie zmienia fabuły, kanonu, systemu dowodowego ani zapisu/werdyktu.

## 5. Testy i kontrola przed produkcją

W katalogu projektu:

```bash
npm run check
npm run build
node tools/test-rc571014-excluded-focus.mjs
node tools/test-rc571013-negations.mjs
node tools/test-rc571012-corrections.mjs
node tools/test-rc571011-natural-interview.mjs
node tools/test-rc571010-testimony-recap.mjs
node tools/test-rc57-whole-game.mjs
node tools/test-rc57-playthrough.mjs
python tools/test-saves.py
```

Następnie test ręczny z prawdziwym dostawcą w panelu administratora: wybierz **72 pytania** i sprawdź po kolei AI-007 (pierwsza wypowiedź), AI-011/012 (podsumowanie), AI-014/026 (powtarzalność), AI-039 (miejsce Elżbiety) oraz AI-043 (reakcja na poprzednie zeznania). Sprawdź także presję i niezamierzone zdradzanie wątków fabuły.

Tester jest sekwencyjny, ograniczony do 7 pytań na minutę w karcie. Jedno pytanie może wymagać kilku wywołań API. `warning` to sygnał do oceny człowieka; `blocked` oznacza brak zatwierdzonej odpowiedzi — nie licz go jako pass. **Eksportuj JSON przed przeładowaniem** — token wznowienia jest tymczasowy. Nie uruchamiaj równoległych testów, aby obchodzić limit.

## 6. Jeśli test znowu się zatrzyma

1. Zapisz numer pytania, `failureDiagnostics` oraz `rejectedChecks` (bez kluczy).
2. Przy HTTP 429 respektuj `Retry-After` i nie uruchamiaj wielu kart. Przy 504 sprawdź fazę `generate`/`rewrite`/`semantic-audit`.
3. Przy `dialogue_memory_evasion`, `dialogue_near_repetition`, `witness_gender_mismatch` sprawdź odpowiedź i zatwierdzoną historię; nie wyłączaj bezmyślnie audytu faktów.
4. Testy lokalne z atrapą dostawcy nie dowodzą skuteczności na prawdziwym Apinex — wynik live zależy od usługi.

## 7. Granice i bezpieczeństwo

Nie zmieniono łańcucha dostawców, ilości endpointów Vercel, kluczy, migracji, reguł odblokowania dowodów, kanonu, stanu gracza i werdyktu. Nowe wskazówki psychologiczne nie mają uprawnienia do tworzenia faktów. Historyczna dokumentacja jest archiwalna, a bieżące wyniki testów są w `RAPORT-QA-RC57_10_14.md` (starsze raporty pozostawiono jako archiwalne).


## RC57.10.12 — poprawki po ręcznym audycie
- Wskazówki intencji rozmowy normalizują polskie znaki i literówki na potrzeby klasyfikacji pomocniczej. Fakty nadal pochodzą wyłącznie z `knowledge.factBank`.
- Kontrola rodzaju rozróżnia własną pierwszoosobową wypowiedź świadka od WYRAŹNIE przypisanego innemu mówcy cytatu; cytaty bez wskazanego autora nadal są kontrolowane.
- Jedynym miejscem tworzenia zasad mówienia i profili świadków jest `lib/interview-prompt-rc57106.js`. Dawne moduły stylu są adapterami/kontekstem, a nie źródłem nowych wytycznych.
- Testy po wdrożeniu: pełny test 72 pytań oraz osobne rozmowy swobodne z każdą postacią. Lokalnie sprawdzana jest logika, nie rzeczywista naturalność dostawcy Apinex.
- Zmiana nie dotyczy bazy Supabase, migracji SQL, sekretów, stanów postępu i dowodów.

## RC57.10.13 — korekta testów negacji

- W poprzedniej wersji test 600 przypadków zwracał **540 pass / 60 fail**: tester szukał dosłownie słowa `odrzuć`, choć wskazówka mówiła „wyklucz temat”. Była to niezgodność kontraktu testowego, nie dowód, że model zignorował 60 pytań.
- `interview-rc50.js` rozróżnia teraz **jawną negację zakresu** (`nie pytam o X, tylko o Y`) od **zwykłego doprecyzowania** (`poprawiam pytanie`, `chodzi mi o`). W payloadzie przekazywane są pola `explicitNegation`, `excludedTopic`, `targetTopic` — wyłącznie jako wskazówki, bez modyfikowania faktów.
- `admin-rc57-suite.js` weryfikuje ten podział semantycznie, bez sprawdzania pojedynczego słowa instrukcji. Zachowuje 600 przypadków: 6 świadków × 10 rodzin × 10 wariantów.
- Tester RC57 jest **deterministyczny**. 600/600 nie oznacza, że prawdziwy model AI poprawnie zrozumie wszystkie polskie negacje — to wymaga testu live.
- Zmiana nie wymaga SQL ani nowych kluczy API i nie dotyka dowodów, fabuły, werdyktu, pamięci zapisów.


## RC57.10.14 — wykluczony temat a faktyczna odpowiedź świadka

- Problem po RC57.10.13: AI-015 dla Tomasza powtarzał `dialogue_excluded_topic_repeated`. Poprzedni warunek odrzucał odpowiedź na pytanie „Nie pytam o Lenę, tylko gdzie byłeś po północy?” za samo pojawienie się imienia Leny — niezależnie od tego, czy świadek podał własne miejsce pobytu. Nie mamy odrzuconych surowych wypowiedzi, więc nie wiemy, czy wszystkie cztery próby były fałszywie odrzucone.
- Nowy mechanizm sprawdza **zakres odpowiedzi**. Gdy świadek mówi o swoim miejscu pobytu i tylko wspomina Lenę, pojawia się nieblokujące ostrzeżenie `excluded_topic_incidental`. Gdy rozmawia wyłącznie o Lenie, ignorując własny pobyt, pozostaje blokada `dialogue_excluded_topic_repeated`. Reguła jest pomocnicza — nie zatwierdza faktów.
- Centralny prompt i niezależny audyt mają tę samą instrukcję: negacja wyklucza rozwijanie danego tematu **zamiast** odpowiedzi, nie zakazuje wszystkich słów związanych z tym tematem.
- Korekta `not_entailed` dokładniej wymaga trzymania się wybranych faktów i odróżniania alarmu od ostatniego kontaktu z Leną. `not_entailed`, `hard_guard` i twarde walidatory **nadal blokują** niepotwierdzone odpowiedzi. Nie usuwano audytów dla poprawienia wyniku.
- Test nowej reguły: `node tools/test-rc571014-excluded-focus.mjs`; pozostałe pełne testy wymieniono wyżej.
- Test prawdziwego Apinex, w tym AI-014 i AI-015 oraz całe 72 pytań, **nie został wykonany** w ramach pakowania. Po Preview wyeksportuj raport JSON, porównaj `blockedAttempts` i `results`; status `warning` nie oznacza błędu faktograficznego.


## RC57.10.15 — wyłącznie wygląd „AKTA ŚLEDCZE”

Motyw wizualny wybrany przez użytkowniczkę: **kartoteka/dossier**, sepiowy papier, ciemnobrązowa skóra, czerwone pieczątki, oliwkowe akcenty, czytelne rozmowy. To nie jest zmiana fabuły. Makieta inspiracyjna zawierała fikcyjne informacje o autobusie; **nie zostały one przeniesione do rzeczywistej gry**. W grze zostają Lena Rudnicka, TW-217 i dotychczasowi świadkowie.

**Źródło wyglądu:** `src/styles/103-dossier-visual-rc571015.css`, podłączony jako ostatni arkusz istniejącej, scalonej sekcji CSS w `src/build-manifest.json`. Nie należy ręcznie wklejać motywu do `index.html` — plik powstaje automatycznie przez `npm run build`.

Zachowano wszystkie istniejące dziesięć modułów, taktyki, okazywanie dowodów, zapis, logikę gry, serwerowe API, audyty i Supabase. W przesłuchaniach nadal wpisuje się **własne pytanie** przez `#chatInput` i wysyła `#chatSend`. Nie dodano pytań sugerowanych, automatycznych wariantów dialogów ani fikcyjnych dowodów. Dostosowano również układ mobilny, ale pozostawiono istniejący mechanizm mobilnego przejścia z listy świadków do rozmowy.

**Wdrożenie:** pełny ZIP RC57.10.15 można rozpakować i wgrać jako zawartość repozytorium (najpierw Preview). Mały ZIP jest tylko dla projektu dokładnie RC57.10.14; nadpisz pliki z zachowaniem katalogów. Nie wrzucaj ZIP jako jednego pliku do GitHub. Nie ma migracji SQL ani nowych zmiennych Vercel.

**Testy interfejsu:** `python tools/test-rc571015-dossier-layout.py` i `python tools/test-rc571015-all-tabs-layout.py`. Drugi test sprawdza brak poziomego overflow strony dla 10 sekcji w rozdzielczościach 390, 768, 1440, 1920 px; nie jest gwarancją wizualnej bezbłędności każdej możliwej kombinacji interakcji i zawartości.

**Ograniczenie:** testowano lokalny zbudowany interfejs, nie rzeczywiste wdrożenie Vercel i nie prawdziwe odpowiedzi API po zmianach (przesłuchania AI nie były edytowane).

## RC57.10.16 — jeden widoczny panel zachowania świadka

- W widoku **Przesłuchania** wskaźniki `Zaufanie`, `Napięcie`, `Zmęczenie`, aktualny nastrój i podpowiedź reakcji zostały zebrane w **jednym panelu** `#npc4Panel`.
- Kartka z animowanym portretem `#witnessStage` zawiera **tylko portret i animacje**; nie zawiera już kopii trzech wskaźników ani podpisu „Sygnały zachowania”.
- Wypowiedzi, postawy `Rzeczowo/Wspierająco/Stanowczo`, wpływ emocji na tekst i mimikę, liczniki, zapis oraz mechaniki śledztwa są bez zmian. Zmiana HTML i kosmetycznego renderowania nie wpływa na API ani kanon.
- **Pełny ZIP:** bezpieczny wybór przy niepewnej wersji źródeł. **Mała poprawka:** tylko na dokładnie RC57.10.15; wgraj jej zawartość z zachowaniem katalogów i przebuduj `index.html` poleceniem `npm run build`, jeśli nie używasz już gotowego z paczki.
- Sprawdzenie: `python tools/test-rc571016-single-behavior-panel.py` (sześciu świadków na 390, 768, 1440 i 1920 px), `npm run check`, a następnie Preview w Vercel.

## RC57.10.17 — fotografie świadków i dopracowana kartoteka

- **Nowa warstwa wizualna:** sześć spójnych fotorealistycznych portretów fikcyjnych postaci, na podstawie zaakceptowanej wizualizacji „Akta Śledcze”. Nie są to fotografie prawdziwych świadków ani dodatkowe postacie fabularne.
- Mapowanie jest dokładne: `MAREK`, `TOMASZ`, `JANUSZ`, `ELZBIETA`, `KAMIL`, `MAGDALENA`; odpowiada im po jednym pliku `assets/portraits/<id>.webp`. Miniatury, portret główny, sceny i finał korzystają z tych samych obrazów.
- **Nie zmieniać:** nazwisk, ról, chronologii, faktów, świadków, liczby dostępnych pytań, blokad dowodów, postępów, werdyktu, wywołań AI ani zapisu Supabase.
- Obrazy są **statycznymi fotografiami**; aktualne emocje nadal sterują istniejącym kontrolerem oraz subtelną reakcją wizualną zdjęcia, lecz fotografia nie porusza osobno ustami i oczami. Istniejące portrety SVG zachowano pod zdjęciami jako zapasową warstwę i dla zgodności dawnych scen/testów.
- **Jedno miejsce stanu:** Zaufanie / Napięcie / Zmęczenie / Reakcja pozostają w jednym panelu. Nie dodano nowych wskaźników ani gotowych pytań.
- **Pełny ZIP** jest zalecany. **Mała poprawka** jest wyłącznie do dokładnej RC57.10.16; koniecznie przenieś wszystkie sześć plików WebP i nie umieszczaj samego ZIP-a w repozytorium.
- Testy: `npm run check`, `npm run build`, `python tools/test-rc571017-photo-dossier.py`, `python tools/test-faces622.py`, `python tools/test-rc571016-single-behavior-panel.py`, `node tools/test-rc57-whole-game.mjs`, `node tools/test-rc57-playthrough.mjs`.
- Jeśli przeglądarka nadal pokazuje narysowane portrety, sprawdź po wdrożeniu obecność `assets/portraits/*.webp`, poprawność ścieżek i cache przeglądarki.


## RC57.10.18 — ostatnie poprawki wizualne przed premierą

- **Otwieranie akt:** stylizowany ekran początkowy widoczny podczas renderowania; bez fałszywych procentów. Jest automatycznie usuwany po gotowości dokumentu.
- **Wysyłanie pytania:** gracz widzi informację „Świadek przygotowuje odpowiedź”; wstrzymanie lub błąd daje konkretną instrukcję ponowienia bez surowych kodów w zwykłym widoku gry. Pytanie jest zachowane zgodnie z dotychczasową logiką.
- **Mobile:** skrócono instrukcję do rozwijanej zakładki, przeniesiono widoczny protokół rozmowy i pole własnego pytania przed pomocnicze analizy (tylko kolejność prezentacji CSS); zachowano istniejący przełącznik „Wybór świadka / Przesłuchanie”.
- **Zdjęcia i wydajność:** już spakowane portrety WebP mają `loading=lazy`, miniatury niski priorytet pobierania, a aktywny portret wysoki. Na urządzeniach z ograniczoną wydajnością lub preferencją redukcji ruchu wyłączono zbędne przejścia interfejsu.
- **Kanon:** wszystkie nazwy, osoby i dostępne zdjęcia pozostają z rzeczywistej sprawy Leny Rudnickiej i TW-217. Przykładowe postacie i autobus z koncepcji graficznych nie zostały dodane. Oryginalne fotografie materiałów śledczych nie zostały stratnie zmniejszone, aby nie pogarszać szczegółów potrzebnych w analizie.
- **Diagnoza techniczna:** tryb `?debugAI=1` zachowuje informacje diagnostyczne w konsoli deweloperskiej, ale podczas zwykłej rozgrywki nie pokazuje kodów HTTP i nazw dostawców w komunikacie. Panel administratora nadal wyświetla diagnostykę.
- **Bez zmian:** ani mechaniki, ani faktów, ani dostępu do dowodów, ani API serwera, ani schematu Supabase, ani werdyktu. Gracz nadal wpisuje tylko własne pytania.

### Dodatkowe kontrole

```bash
python tools/test-rc571018-presentation.py
node tools/test-rc571018-ui.mjs
```

Testy nie zastępują próby na prawdziwym Vercel Preview, w której trzeba przetestować rzeczywistą odpowiedź Apinex i przypadek ograniczenia zapytań. Test integracji HTTP z atrapą dostawcy w lokalnej przeglądarce nie był możliwy w tym środowisku (blokada dostępu do lokalnego serwera); weryfikowano statyczne mapowanie błędów i widok interfejsu.


## RC57.10.21 — Fotokartoteka i kontrola przed publikacją

- Układ przesłuchania inspirowany zatwierdzonym obrazem: duży portret po lewej, protokół i własne pytanie w centrum, kartoteka sześciu świadków po prawej. Na telefonie lista jest przewijana poziomo, a pytanie znajduje się bezpośrednio pod rozmową.
- Nie dodano kategorii gotowych pytań z grafiki; podejście do przesłuchania oraz okazywanie dowodów korzystają z istniejących kontrolek. Wszystkie fakty odnoszą się do sprawy Leny Rudnickiej i TW-217.
- Poprawiono instrukcje naturalności w jedynym centralnym kontrakcie AI. Przełomy i filmowe sceny nadal opierają się wyłącznie na już zatwierdzonym stanie gry.
- Przed publicznym wdrożeniem przetestuj na Vercel Preview prawdziwy model AI, zapisy Supabase, błędy limitu i długie swobodne rozmowy. Lokalny test nie zastępuje testu usług zewnętrznych.

## RC57.10.22 — zgodność układu z zaakceptowanym obrazem

Dopracowano trzykolumnowy widok przesłuchania: duży portret i dane świadka, protokół z polem własnego pytania, kartoteka sześciu świadków po prawej. Istniejące taktyki i przerwy pozostają dostępne pod rozwijaną sekcją w teczce. Makieta była tylko inspiracją wizualną: fakty i miejsce akcji to Lena Rudnicka oraz tramwaj TW-217, nie autobus ani postacie z grafiki.

Przed publikacją przetestuj tę wersję na Vercel Preview: długą rozmowę, rozwijane taktyki, załączenie dowodu, pamięć, zapisy oraz autentyczne API AI.


## RC57.10.23 — układ zgodny z wybraną makietą

- Wdrożono drewniano-pergaminowy interfejs w trzech kolumnach: nawigacja, duży aktywny profil z protokołem i dowodami oraz kartoteka sześciu świadków.
- Profile używają fotograficznych wizerunków fikcyjnych postaci i faktycznych nazw oraz ról z gry. Marek Nowicki jest kierownikiem zajezdni, nie mechanikiem pokazanym na przykładowej ilustracji. Dekoracja przedstawia tramwaj TW-217, a nie autobus z niekanonicznej makiety.
- Karty dowodów pokazują tylko **materiały wcześniej zdobyte i obejrzane**; ich kliknięcie korzysta z istniejącego selektora okazywania dowodów. Nie odblokowują nic samodzielnie.
- Zachowano oryginalne podejścia do przesłuchania, panel zachowania, kontrolki taktyczne, kooperację, zapisy, werdykt i **jedno pole własnego pytania**. Opcje dodatkowe są zwijane, nie usunięte.
- Układ mobilny przechodzi w kolejność pionową, aby nie nakładały się panele i formularz.
- **Test przed wdrożeniem:** `node tools/build.mjs`, `node tools/check.mjs`, `node tools/test-rc57-whole-game.mjs`, `node tools/test-rc57-playthrough.mjs`, `node tools/test-rc571013-negations.mjs`, `python tools/test-saves.py`, `python tools/test-navigation.py`. W Vercel Preview sprawdź ponadto przełączenie sześciu osób, ujawnianie dowodów, realne odpowiedzi Apinex i zapis Supabase.
- Obraz koncepcyjny jest wzorem kompozycji, nie źródłem kanonu. Nie wprowadzono przykładowej rozmowy, fikcyjnych dat, ról, godzin czy dowodów z makiety. Drobne różnice względem statycznej grafiki wynikają z rzeczywistych danych oraz działania UI.
- Nie wykonywano produkcyjnego wdrożenia ani live testu Apinex/Supabase w ramach tej poprawki.


## RC57.10.24 — wygląd według obrazu nr 2

Wgraj pliki z pełnego ZIP do GitHub albo zastosuj małą poprawkę WYŁĄCZNIE do RC57.10.23. Nie trzeba nowych kluczy API, zmian SQL ani migracji zapisów. Wersja zachowuje wszystkie pytania własne i zabezpieczenia dowodów. Sprawdź najpierw Vercel Preview, a szczególnie widok przesłuchania na komputerze i telefonie.


## RC57.10.25 — dopracowanie oprawy zgodnie z zaakceptowanym drugim obrazem

- Wersja bazowa dla małej poprawki: dokładnie **RC57.10.24**. W innych przypadkach użyj pełnego ZIP-a.
- Zmiany dotyczą wyłącznie wyglądu: układ i rozmiar kart, większe zdjęcia świadków, czytelniejsze przyciski nawigacji, cienie, faktury i obramowania, wygląd protokołu oraz formularza własnego pytania.
- Dwa obrazy tekstur są lokalne: `assets/ui/dossier-parchment-rc25.webp` i `assets/ui/dossier-wood-rc25.webp`. Nie wymagają połączeń zewnętrznych.
- Nie dodano gotowych pytań ani nie zmieniono danych świadków, treści dowodów, stanu sprawy, logiki przesłuchań, Apinex, Supabase ani warunków werdyktu.
- Pusty panel dowodów nie pokazuje przedwcześnie dokumentów. Rozmowa początkowo może zawierać tylko rzeczywiste dotychczasowe wypowiedzi — zrzuty z ilustracyjnymi wieloma wiadomościami nie są danymi startowymi gry.
- Komputer: panel świadków po prawej, karta i fotografia nad protokołem, dowody i podejścia w panelu narzędzi. Telefon: dotychczasowa nawigacja świadka i rozmowy, karty przewijane poziomo.
- Zweryfikuj wersję na Vercel Preview przed wdrożeniem produkcyjnym; testy lokalne nie sprawdzają prawdziwych dostawców AI ani Supabase.


## RC57.10.26 — finalny interfejs akt (aktualna wersja)

Poprawki są **tylko prezentacyjne**. Zachowano fabułę Leny Rudnickiej, zajezdnię TW-217, sześciu świadków, własne pytania, trzy podejścia do rozmowy, dostęp do dokumentów według reguł, AI, werdykt oraz zapisy. Nie trzeba SQL ani nowych zmiennych Vercel.

1. Ekran przesłuchania na komputerze ma stałe trzy strefy: nawigacja, karta i protokół, kartoteka po prawej.
2. Protokół ma przewijanie wewnętrzne niezależne od formularza pytania. Test 50 wiadomości obejmuje szerokości od 320 do 1920 px.
3. Pusty panel dowodów ma jeden czytelny komunikat, zamiast fikcyjnych dowodów.
4. W widoku mobilnym formularz znajduje się po protokole, ale nie zakrywa jego treści.
5. Usunięto pusty pas z fotograficznego portretu; ujednolicono kadrowanie postaci, karty i faktury.
6. Animacje są subtelne i wyłączane przy preferencji ograniczonego ruchu.

**Instalacja:** pełną paczkę rozpakuj w katalogu repozytorium i wgraj do GitHub. Małą poprawkę stosuj wyłącznie na bazie dokładnie RC57.10.25. Najpierw testuj w Vercel Preview.

Pamiętaj: fotografie i dowody dostępne w grze są zależne od stanu fabuły; obraz referencyjny pokazuje przykładowe wypełnienie i nie jest stanem startowym gry.


## RC57.10.27 — optymalizacja układu desktop/tablet/telefon (aktualna)

Wersja dotyczy **wyłącznie prezentacji** i nie zmienia reguł, dokumentów, dostępności dowodów, API AI, zapisów ani możliwości zadawania własnych pytań.

- Komputer: proporcje nagłówka, listy sześciu świadków, narzędzi, przewijanego protokołu oraz osobnego formularza dopasowują się do wysokości okna.
- Laptop i tablet: osobny układ dla 1025–1360 px oraz poziomych tabletów 900–1024 px.
- Telefon: wybór świadka i przesłuchanie są dwoma działającymi widokami z istniejącego przełącznika; po wyborze świadka otwiera się rozmowa. Fotografia, stan i protokół są bardziej zwarte, a pytanie zajmuje pełną szerokość.
- Naprawiono konflikt starszego przełącznika mobilnego oraz stylu pola tekstowego, bez dodawania nowej nawigacji.
- Zachowano ograniczone animacje i możliwość skorzystania z klawiatury mobilnej.

**Wdrożenie:** pełną paczkę rozpakuj i wgraj zawartość repozytorium GitHub, najlepiej do gałęzi Vercel Preview. Małą poprawkę stosuj wyłącznie na RC57.10.26; nie usuwaj katalogów `api`, `lib` i `story-bible`. Nie trzeba SQL ani zmian w konfiguracji.
