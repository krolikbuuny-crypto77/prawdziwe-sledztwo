# RC58 — audyt i naprawa produkcyjnego systemu przesłuchań

Wydanie techniczne: **RC57.10.59 / Inteligentne Przesłuchania RC58**. Baza: RC57.10.58. Data: 2026-11-04.

## Status i zakres wiarygodności

Zmiany wprowadzono do **rzeczywistego serwerowego endpointu `api/interview.js`**, budowania kontekstu, trwałego zapisu zeznań, integracji dostawców i mechanizmu ponowień. Przeprowadzono testy lokalne endpointu HTTP z imitacją Supabase i lokalnym silnikiem oraz testy z wstrzykiwanymi odpowiedziami dostawcy. **Nie przeprowadzono 72 odpowiedzi rzeczywistego modelu APINEX na Vercel.** Nie dysponowano potwierdzonym limitem konta APINEX ani aktywnymi produkcyjnymi kluczami. Nie wykonano migracji bazy na prawdziwym Supabase. Produkcyjne kryteria jakości i niezawodności nie są jeszcze ostatecznie potwierdzone.

## Przyczyny źródłowe — stan przed zmianami

| Priorytet | Przyczyna i mechanizm | Działanie RC58 |
|---|---|---|
| P0 — pamięć | Skrócona historia i późniejsze streszczenia mogły być traktowane jako równoważnik pierwszej odpowiedzi; brak konsekwentnego, trwałego numeru tury. | Serwerowa chronologia zaakceptowanych pytań i odpowiedzi; dokładny cytat pierwszej, poprzedniej lub numerowanej wypowiedzi z `witnessLedgers`/`interviewReceipts`, bez odpytywania LLM. Przy nierozpoznawalnej kolejności starszego zapisu kontrolowane 409, nigdy rekonstrukcja z ogólnej wiedzy. |
| P1 — powtórzenia | Wielokrotne odpowiedzi o dokumentach i alibi były oceniane również przez sztywne reguły stylistyczne, co mogło skutkować płatną kolejną generacją. | Kontekst ostatnich wypowiedzi i powtórzonych pytań; uzasadnione powtórzenie faktu jest dozwolone, powtórzenia stylistyczne raportowane bez automatycznej blokady; ograniczenie nadmiernej obronności. |
| P1 — intencja | Kontekst fabularny i obronne reguły dialogu mogły odciągać rozmowę od pytania; podejrzenie kłamstwa mogło aktywować obronę przed zarzutem przemocy. | Do modelu trafia pełne pytanie i ograniczenia zakresu, wyraźna negacja tematu, a walidator odrzuca niewywołaną pytaniem obronę przed zarzutem zabójstwa; incydentalna niezbędna wzmianka nie stanowi automatycznego błędu. |
| P1 — limity | Jedno pytanie mogło uruchomić generację, korektę i niezależny audyt, następnie kolejnych dostawców bez jednego łącznego budżetu. Błąd 429 i `not_entailed` prowadziły do niepotrzebnych kolejnych prób. | Limit **4 prób modelowych łącznie na odpowiedź**, licząc audyty i korekty; 429 bez ponowienia tego samego żądania; 502/503 co najwyżej jeden ograniczony retry; `not_entailed` kończy próbę aktualnego modelu bez bezsensownego powtarzania; jawna diagnostyka faz. |
| Vercel — współbieżność | Pamięć procesu nie zapewnia wspólnego tempa dla kilku instancji serwerowych. | Opcjonalny, współdzielony harmonogram Supabase: migracja `008_...sql`, `SELECT FOR UPDATE`, RPC rezerwacji slotu, propagacja `Retry-After`; **nieaktywny domyślnie** aż do wykonania migracji i podania rzeczywistego limitu. |

## Macierz wymaganych przypadków

| Przypadek | Przed | Po (lokalnie) | Zastrzeżenie |
|---|---|---|---|
| AI-007 — Marek, pierwsza wypowiedź | Nieprecyzyjne odtwarzanie w zgłoszonym raporcie | PASS — oryginalny pierwszy cytat i ID, bez informacji z dalszych tur | Test serwerowej pamięci, nie rozmowa live |
| AI-019 — Tomasz, pierwsza wypowiedź | To samo | PASS | Test serwerowej pamięci |
| AI-031 — Janusz, pierwsza wypowiedź | To samo | PASS | Test serwerowej pamięci |
| AI-015 — pytanie z wykluczeniem Leny | Historyczny test `test-rc571014-excluded-focus.mjs` nie przechodzi (`Unexpected rewrite: rewrite`) | PASS dla poprawnego kanonicznego źródła pobytu f15, bez nadmiarowej korekty | **Historyczny test nadal FAIL** z niezgodnym źródłem f14: fakt o logach TCMS nie uzasadnia deklaracji miejsca pobytu. To nie jest regresja; ochrony faktów nie poluzowano. |
| AI-006 — brak zarzutu przemocy | Nadmiarowa obrona w zgłoszonym raporcie | PASS — nieuzasadnione „Nie zabiłem Leny” odrzucane na pytanie o kłamstwo | Test walidatora |
| AI-043 — `not_entailed` | Ryzyko pętli ponownych generacji | PASS — 1 generacja + 1 audyt, 0 rewrites, kandydat odrzucony | Wstrzyknięty wynik audytu, nie żywy model |

## Zrealizowane testy

| Test | Wynik | Co naprawdę sprawdzono |
|---|---|---|
| `tools/test-rc58-intelligence.mjs` | **91/91 PASS** | Sześć świadków × 24 tury, później 65 tur Marka, cytat pierwszej/poprzedniej/numerowanej wypowiedzi, powtórzenia, negacja, AI-006, AI-015, AI-043, 429/502, limit prób i forma rodzaju gramatycznego. |
| `tools/test-rc58-provider.mjs` | PASS | Klasyfikacja sztucznych HTTP 429 i 502, `Retry-After: 8`, metryki tokenów, 8 symulowanych rezerwacji wspólnej kolejki. |
| `tools/test-rc58-endpoint.mjs` | **72/72 żądania PASS** | Faktyczny handler `api/interview.js`, symulowane Supabase/CAS, lokalny silnik świadków; +24 dodatkowe tury, pierwsza wypowiedź, idempotentny replay, 100 zapisów. **Zero zapytań zewnętrznych, nie jest to 72 odpowiedzi APINEX.** |
| Test 72 żądań — średni / maks. czas | **9 ms / 71 ms** | Zmierzony tylko na lokalnym mocku, wliczając handler i fikcyjną bazę; nie są to czasy Vercel ani sieci APINEX. |
| Test 72 żądań — poprawne / błędy / blokady | **72 / 0 / 0** | Dotyczy wyłącznie żądań z mockiem, nie semantycznej jakości 72 odpowiedzi modelu. |
| Diagnostyka 100 zapisanych odpowiedzi mock | 0 stylowych ostrzeżeń, 0 krytycznych odrzuceń, 0 zewnętrznych wywołań | Odczytane z 100 wpisów `interview-diagnostic`; mock lokalny nie generował audytów zewnętrznych. |
| AI-043 — pojedyncza próba wstrzyknięta | 2 wywołania | Generowanie + audyt; 1 krytyczne odrzucenie jako `not_entailed`; bez `rewrite`. |
| 502 — pojedyncza próba wstrzyknięta | 3 wywołania | Pierwszy 502, druga generacja, jeden audyt. |
| 429 — pojedyncza próba wstrzyknięta | 1 wywołanie | Brak bezpośredniego retry; `Retry-After` zachowany. |
| `node tools/test-rc571048-retrieval.mjs` | 2228 PASS | Wiedza i wyszukiwanie faktów. |
| `node tools/test-rc571046-relationships.mjs` | 1325 PASS | Relacje sześciu świadków. |
| `node tools/test-rc571047-humanity.mjs` | 8419 PASS | 12 obszarów wiedzy i psychologii. |
| `python tools/test-saves.py` | PASS | Zapis, migracja, eksport/import. |
| `npm run check`, `npm run build` | PASS | Integralność skryptów, zasobów, synchronizacja kanonu, budowa `index.html`. |
| `node tools/test-rc571014-excluded-focus.mjs` | **FAIL** | Historyczna próbka wymaga uznania opisu pobytu za wynik faktu f14 o logach TCMS; surowy walidator słusznie wymaga odpowiedniego źródła. |
| 72 odpowiedzi APINEX / test Vercel produkcja / współbieżne instancje Vercel | **NIE WYKONANO** | Wymagane rzeczywiste połączenie i środowisko, znany limit oraz wdrożenie migracji. |

## Zmodyfikowane funkcje i pliki

- `api/interview.js`: `attemptInterviewCore`/`attemptInterview`, obsługa pamięci przed generacją, globalny budżet prób 4, ograniczony retry, klasyfikacja i fazy audytu, liczniki `qualityDiagnostics`, bezpieczna odpowiedź i idempotentny zapis.
- `lib/interview-turn-memory-rc58.js` **nowy**: `serverTurnMemory`, `recallReference`, `exactRecallReply`, `chronologyAttributionIssue`; cytaty z zatwierdzonych zapisów, ostrożna obsługa zapisów historycznych, podział na ujawnione i nieujawnione źródła, osobne domniemania sprzeczności.
- `lib/server-state.js`: `appendReportedTurn`, identyfikatory pytań, kolejność i trwałe powiązanie odpowiedzi z pytaniem.
- `lib/witness-ledger-rc22.js`: `migrateWitnessLedger` oraz numeracja sekwencji przy zapisie.
- `lib/interview-repetition-rc58.js` **nowy**: `repetitionContext`, `repetitionReview` (jakość stylu bez dopisywania faktów).
- `lib/interview-wire-rc23.js`, `lib/interview-naturalness-rc28.js`: przekazanie zweryfikowanej pamięci, zakresu i kontekstu powtórzeń do modelu.
- `lib/interview-rc57103-gate.js`: walidacja niewywołanej pytaniem obrony przed zabójstwem, bez rozluźniania kanonu.
- `lib/interview-providers-rc24.js`, `lib/apinex-shared-quota-rc5710.js`: obsługa `Retry-After`, statusów i opcjonalnego limitowania współdzielonego.
- `lib/interview-observability-636.js`: rozdzielenie ostrzeżeń stylistycznych i krytycznych odrzuceń w diagnostyce.
- `supabase/008_apinex_distributed_queue_rc58.sql` **nowy**: dwie funkcje RPC i zablokowana dla zwykłych użytkowników tabela kolejki.
- `tools/test-rc58-intelligence.mjs`, `tools/test-rc58-provider.mjs`, `tools/test-rc58-endpoint.mjs` **nowe**, `package.json`: `npm run test:rc58`.

## Wymagania uruchomienia produkcyjnego

1. Wgrać paczkę w środowisko Vercel Preview, zachowując klucze API tylko na serwerze.
2. Bez zmiany konfiguracji nowy serwer nadal używa dotychczasowej logiki lokalnego limitowania; **współdzielona kolejka nie działa automatycznie**.
3. Aby użyć kolejki, wykonać SQL 008 w prawdziwym Supabase i potwierdzić uprawnienia `service_role`, następnie ustawić `APINEX_DISTRIBUTED_QUEUE_ENABLED=true`, `APINEX_MAX_UPSTREAM_CALLS_PER_MINUTE` na **rzeczywisty potwierdzony** limit konta i opcjonalny `APINEX_QUEUE_MAX_WAIT_MS`. Nie ustawiać wartości „na oko”.
4. Przejść prawdziwe przypadki AI-007,019,031,015,006,043 i pełne 72 pytań z dostawcą, zebrać diagnostykę wywołań, p50/p95 i maksymalny czas oraz wyniki trafności bez publikowania transkryptów graczy.
5. Przetestować dwie równoległe instancje Vercel i serię 429 z `Retry-After` przy włączonej kolejce, weryfikując wspólne rezerwacje.
6. Dopiero po wynikach live ogłosić spełnienie wszystkich kryteriów akceptacji.

**Werdykt:** rozwiązania P0 i P1 zaimplementowano i potwierdzono w testach lokalnych, ale końcowe kryteria użytkownika wymagające rzeczywistych 72 odpowiedzi APINEX oraz limitowania między instancjami pozostają otwarte. Nie zmieniono fabuły, dowodów, werdyktu ani interfejsu przesłuchań.
