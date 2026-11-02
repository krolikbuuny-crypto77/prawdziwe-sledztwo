# RC57.10.13 — raport naprawy 60 błędów negacji

## Diagnoza

- Odtworzony wynik RC57.10.12: `540 pass / 60 fail`. Wszystkie błędy pochodziły z `case 1` w `lib/admin-rc57-suite.js`, który sprawdzał `negatedScope.includes("odrzuć")`.
- Tekst wskazówki w centralnym module poprawnie zawierał sens `wyklucz temat zanegowany`, lecz nie słowo `odrzuć`. Wada dotyczyła kontraktu testu, nie 60 osobnych odpowiedzi modelu.

## Kod

1. `lib/interview-prompt-rc57106.js` — precyzyjna instrukcja wyłączania zanegowanego zakresu i oddzielna instrukcja doprecyzowania bez negacji.
2. `lib/interview-rc50.js` — pola `explicitNegation`, `excludedTopic`, `targetTopic`; wyłącznie wskazówki stylistyczne.
3. `lib/admin-rc57-suite.js` — zamiast zależności od słowa w promptcie: weryfikacja negacji, wykluczonego tematu, nowego celu, rozróżnienia korekty bez negacji i braku uprawnień faktograficznych.
4. `lib/admin-rc57-ui.js` — metadane eksportowanego raportu rozróżniają odtąd zaktualizowany zestaw testów (`RC57.10.13-suite`).
5. `tools/test-rc571013-negations.mjs` — test 600 przypadków, w tym 60 negacji dla sześciu świadków, oraz produkcyjnej ścieżki przekazania wskazówek do modelu.

## Wyniki

- Przed: 540 pass, 60 fail (deterministyczne).
- Po: 600 pass, 0 warning, 0 fail (deterministyczne).
- Test pełny nie wykonuje zewnętrznych żądań AI ani zapisu do Supabase.
- `node tools/test-rc57.mjs` — PASS, 600/600, bez połączeń z dostawcą i Supabase.
- `node tools/test-rc571013-negations.mjs` — PASS, 60/60 negacji, warianty doprecyzowania i kontrola payloadu produkcyjnego.
- `node tools/test-rc50.mjs`, `node tools/test-rc571012-corrections.mjs`, `node tools/test-rc57106-unified-prompt.mjs` — PASS.
- `npm run check`, `npm run build` — PASS (również po rozpakowaniu pełnej paczki).
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań.
- `node tools/test-rc571011-natural-interview.mjs`, `node tools/test-rc571010-testimony-recap.mjs`, `node tools/test-rc57107-pauses.mjs`, `node tools/test-rc57103-preacceptance.mjs`, `python tools/test-saves.py` — PASS.
- Pełna paczka ZIP i patch zweryfikowane: nałożenie patcha na dokładnie RC57.10.12 daje identyczną zawartość jak pełny RC57.10.13.

## Granice

Test 600 przypadków nie ocenia jakości faktycznych odpowiedzi Apinex. Po publikacji Preview należy sprawdzić negacje w normalnym przesłuchaniu i test 72 pytań. Bez migracji SQL, nowych sekretów ani zmian kanonu.
