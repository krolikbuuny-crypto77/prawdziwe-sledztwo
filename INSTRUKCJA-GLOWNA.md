# Prawdziwe Śledztwo — jedna aktualna instrukcja RC57.10.12

Wersja: **RC57.10.12**. Ten dokument zastępuje historyczne poradniki `INSTRUKCJA-RC...` i `README-PAKIET...`. Dawne wydania znajdują się tylko w `docs/archiwum-instrukcji/`. Gdy treść historyczna jest sprzeczna z tą instrukcją, obowiązuje obecny kod i ten dokument.

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

- **Pełny ZIP:** zalecany, gdy wersja na GitHub nie jest dokładnie RC57.10.11 albo chcesz usunąć stare poradniki z katalogu głównego. Rozpakuj i zamień zawartość odpowiedniego repozytorium. Najpierw zrób kopię/gałąź Preview.
- **ZIP zmian:** wyłącznie do projektu o dokładnie tej samej bazie RC57.10.11; nadpisz pliki zgodnie ze strukturą katalogów. Paczka zmian nie może sama usunąć dawnych plików z repozytorium: ich listę zawiera `USUN-STARE-INSTRUKCJE.txt`. Dla pełnego porządku wybierz pełny ZIP.
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

Nie zmieniono łańcucha dostawców, ilości endpointów Vercel, kluczy, migracji, reguł odblokowania dowodów, kanonu, stanu gracza i werdyktu. Nowe wskazówki psychologiczne nie mają uprawnienia do tworzenia faktów. Historyczna dokumentacja jest archiwalna, a bieżące wyniki testów są w `RAPORT-QA-RC57_10_12.md` (poprzedni RC57.10.11 pozostawiono jako archiwalny).


## RC57.10.12 — poprawki po ręcznym audycie
- Wskazówki intencji rozmowy normalizują polskie znaki i literówki na potrzeby klasyfikacji pomocniczej. Fakty nadal pochodzą wyłącznie z `knowledge.factBank`.
- Kontrola rodzaju rozróżnia własną pierwszoosobową wypowiedź świadka od WYRAŹNIE przypisanego innemu mówcy cytatu; cytaty bez wskazanego autora nadal są kontrolowane.
- Jedynym miejscem tworzenia zasad mówienia i profili świadków jest `lib/interview-prompt-rc57106.js`. Dawne moduły stylu są adapterami/kontekstem, a nie źródłem nowych wytycznych.
- Testy po wdrożeniu: pełny test 72 pytań oraz osobne rozmowy swobodne z każdą postacią. Lokalnie sprawdzana jest logika, nie rzeczywista naturalność dostawcy Apinex.
- Zmiana nie dotyczy bazy Supabase, migracji SQL, sekretów, stanów postępu i dowodów.
