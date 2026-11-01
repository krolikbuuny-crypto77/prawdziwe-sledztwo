# RC57.10 — instalacja i testy

1. Jeśli GitHub zawiera **pełną RC57.9**, wypakuj ZIP `POPRAWKA_DO_RC57_9` i nadpisz pliki zachowując katalogi. Jeśli wersja jest niepewna, użyj pełnej paczki RC57.10.
2. Zatwierdź zmiany w GitHub i sprawdź Vercel Preview, zanim wdrożysz na produkcję. W Hobby pozostaje 12 funkcji `api/*.js`.
3. Zachowaj `APINEX_API_KEY`, `RC57_ADMIN_SECRET`, `RC57_ADMIN_PASSWORD` i w razie testów `RC57_LIVE_TEST_ENABLED=true`. Klucze zostają na serwerze; nie umieszczaj ich w ZIP ani klientowym JS.
4. Opcjonalnie `APINEX_LOCAL_HTTP_RPM=30` (domyślne). To liczba **rzeczywistych wywołań HTTP na minutę, na pojedynczą instancję procesu**, nie liczba pytań. Ustawienie 7 może bardzo szybko zatrzymać odpowiedzi, ponieważ pojedyncza odpowiedź zużywa kilka wywołań. Tester panelowy zachowuje niezależnie 7 pytań/min.
5. Błąd 429 uruchamia lokalne okno chłodzenia na podstawie `Retry-After` lub 60 sekund; nie usuwa ani nie zmienia historii gry. W panelu jest wznowienie.
6. Testy lokalne: `npm run check`, `node tools/test-rc5710-traffic.mjs`, `node tools/test-rc5710-random-questions.mjs`, `python tools/test-rc5710-browser-e2e.py`, `node tools/test-rc57-playthrough.mjs`, `node tools/test-rc35-coop.mjs`, `python tools/test-rc39-collab-browser.py`, `python tools/test-saves.py`.

## Znane ograniczenia
- Limit ruchu jest **lokalny dla instancji serverless**, nie globalny na Vercel. Nie daje gwarancji łącznych 7 wywołań HTTP ani braku 429. Globalna ochrona wymaga atomowego licznika w trwałym współdzielonym magazynie; nie została dodana bez przygotowanego, izolowanego schematu i konfiguracji.
- 580 akcji to dokładny deterministyczny test domenowy. Chromium sprawdza 10 interaktywnych ekranów i kooperację w dwóch kartach, ale **nie wykonuje 580 kliknięć rozgrywki aż do werdyktu**.
- Testy kooperacji działają z podmienionym REST Supabase, nie na produkcyjnej bazie. Nie zmieniano produkcyjnych danych ani prywatnych zapisów użytkowników.
- Dostawcy Apinex nie byli w tej rundzie sprawdzani z prawdziwym kluczem API. Skuteczność wskazówek stylistycznych wobec realnego modelu wymaga testu na Vercel.

## Opcjonalnie: limit globalny na Apinex (nie włącza się sam)
1. Przygotuj **odizolowany Supabase staging** i wykonaj `supabase/007_apinex_upstream_quota.sql` w SQL Editor. Ten schemat dodaje osobną tabelę do liczników; nie zmienia istniejących zapisów gry.
2. W staging ustaw `APINEX_SHARED_QUOTA_ENABLED=true`, `APINEX_MAX_UPSTREAM_CALLS_PER_MINUTE=18` oraz prawidłowe serwerowe `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`.
3. Przetestuj licznik na staging; dopiero potem rozważ to samo na produkcji. Gdy migracja lub klucz nie działają, gra świadomie **nie wysyła** wywołań Apinex.
4. Wartość 18 dotyczy **rzeczywistych wywołań HTTP ze wszystkich modeli i użytkowników**, nie 18 pytań. 7 pytań/min w panelu to nadal osobne ograniczenie.
5. Dopóki staging nie jest sprawdzony, zostaw `APINEX_SHARED_QUOTA_ENABLED` nieustawione/`false`.
