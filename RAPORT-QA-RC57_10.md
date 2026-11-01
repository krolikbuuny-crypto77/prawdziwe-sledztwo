# RC57.10 — raport QA, 1 listopada 2026

## Wykonane zmiany
- `lib/apinex-traffic-rc5710.js`: rezerwacja prawdziwych wywołań HTTP do Apinex przed transportem, przesuwające się 60 sekund, kontrolowany cooldown 429. Domyślny limit lokalny: 30 HTTP/min; zmienna `APINEX_LOCAL_HTTP_RPM` ograniczona do 1–30. Niezależny panelowy limit 7 **pytań**/min z RC57.9 zachowany.
- `lib/interview-providers-rc24.js`: integracja licznika z rzeczywistym transportem do Apinex; respektowanie nagłówka `Retry-After`, bez logowania tajnych danych.
- `lib/interview-naturalness-rc28.js`: wskazówki kontynuacji, pamięci własnych słów, pierwszoplanowej odpowiedzi na pytanie o miejsce i unikania niepotwierdzonej kolejności zdarzeń. Nie zmienia kanonu ani reguł werdyktu.
- Dodatkowe testy regresyjne: limit faktycznych wysyłek, cooldown, 12 nieoczywistych pytań/literówek, realny Chromium UI na 390/1440 px.

## Zweryfikowane wyniki lokalne
- `npm run check` — PASS (kompilacja, kanon, dowody)
- `node tools/test-rc5710-traffic.mjs` — PASS: 7 przesłanych żądań, ósme zablokowane **przed** transportem, rolling window i cooldown
- `node tools/test-rc5710-random-questions.mjs` — PASS: 12 pytań, negacje i sprzeczności
- `node tools/test-rc57-playthrough.mjs` — PASS: 580 działań w trzech deterministycznych symulacjach
- `python tools/test-rc57-playthrough-browser.py` — PASS: panel symulacji w Chromium na 390 i 1440 px
- `python tools/test-navigation.py` — PASS: 40 kliknięć na 4 szerokościach
- `node tools/test-rc35-coop.mjs` — PASS: 2 osoby, zapisy wersjonowane, uprawnienia, wymiana kontroli; izolowany zamiennik Supabase
- `python tools/test-rc39-collab-browser.py` — PASS: dwie strony Chromium z podmienionym API; synchronizacja UI, blokada obserwatora, przekazanie sterowania
- `python tools/test-saves.py` — PASS: import/export, autosave, reset, uszkodzony zapis, 11 migracji
- `node tools/test-rc57-whole-game.mjs` — PASS: 380 testów reguł
- `node tools/test-rc57-live.mjs` — PASS: audyt z podstawionym modelem, zabezpieczenia

## Nieudowodnione i ograniczenia
1. Brak pełnego 580-klikowego E2E zakończonego werdyktem w prawdziwej przeglądarce. Przeglądarka i silnik domenowy są sprawdzane osobno.
2. Brak rzeczywistego testu dwóch graczy na bezpiecznej instancji staging Supabase. Nie łączono się z produkcyjną bazą.
3. Limiter ruchu jest per-proces (serverless instancje nie mają wspólnej pamięci); wymaga osobnego wdrożenia globalnego licznika do silnej gwarancji.
4. Nie przeprowadzono w tej sesji realnego odpytywania konta Apinex ani długiej rozmowy 72 pytań.
5. Instrukcje psychologiczne są hipotezą poprawy jakości, nie potwierdzonym wynikiem jakości rzeczywistego AI.

**Ocena wydania:** gotowe do lokalnych i Preview testów. Nie oznaczać jako pełnej walidacji produkcyjnej bez staging Supabase i rzeczywistego modelu.

## Dodatkowe testy RC57.10 (nowe moduły)
- `node tools/test-rc5710-quota.mjs` — PASS. Opcjonalny **globalny limit** na rzeczywiste wywołania Apinex oparty o atomową funkcję SQL w Supabase: 3 z 4 równoległych prób dostały zgodę; czwarta została zablokowana przed wywołaniem Apinex. Test na izolowanym zamienniku Supabase, nie na prawdziwym staging.
- `node tools/test-rc5710-stress.mjs` — PASS: 120 odtwarzalnych wariantów pytań, 6 świadków, literówki i negacje; 18 kroków rozmów z symulowanym modelem.
- `node tools/test-rc5710-two-player.mjs` — PASS: uprawnienia dwóch użytkowników, synchronizacja, konflikty i przejęcie kontroli na izolowanym zamienniku REST Supabase.
- `python tools/test-rc5710-admin-browser.py` — PASS: panel 120 wyników stresowych, eksport JSON, Chromium 390 i 1440 px.
- `node tools/test-rc5710-staging-supabase.mjs` — **SKIP**: brak oddzielnego projektu Supabase staging. Nie wykonywano zapisu na produkcji.
- `python tools/test-rc5710-browser-e2e.py` — PASS: 20 rzeczywistych kliknięć w Chromium, 2 rozdzielczości, bez odblokowania finału.

## Opcjonalna globalna kontrola API
Dodatkowy mechanizm w `lib/apinex-shared-quota-rc5710.js` i `supabase/007_apinex_upstream_quota.sql` może koordynować żądania między instancjami Vercel, ale **domyślnie jest wyłączony**. Wymaga wcześniejszego ręcznego wykonania migracji na odpowiednim Supabase i ustawienia `APINEX_SHARED_QUOTA_ENABLED=true`. W przypadku braku bazy mechanizm odmawia wysłania zapytania (fail closed). Ta opcja nie została przetestowana na prawdziwej bazie staging; sama obecność pliku SQL nie oznacza wdrożenia schematu.
