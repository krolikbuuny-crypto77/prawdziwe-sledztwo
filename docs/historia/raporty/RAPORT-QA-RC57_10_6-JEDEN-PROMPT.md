# Raport QA — RC57.10.6 (konsolidacja instrukcji)

## Zakres

Wersja bazowa: RC57.10.5. Zmienione trzy pliki produkcyjne:

1. `lib/interview-prompt-rc57106.js` — **jedyne** źródło systemowego promptu generowania.
2. `lib/interview-wire-rc23.js` — eksport tej samej definicji; pozostawiono niezależny audyt bez modyfikacji.
3. `lib/interview-naturalness-rc28.js` — eksport tej samej definicji, bez łączenia historycznych dyrektyw; usunięcie dwóch zdublowanych tekstowych wskazówek w `witnessSpeech`.

Nowy test: `tools/test-rc57106-unified-prompt.mjs`. Niezmienione: kanon, 78 dokumentów, logika postępu, werdykt, Supabase, limity API, parametry generowania, logika semantyczna.

## Pomiar: na tych samych 60 scenariuszach × 5 powtórzeń

| Metryka | RC57.10.5 | RC57.10.6 | Zmiana |
|---|---:|---:|---:|
| Znaki instrukcji generowania | 7045 | 5507 | −21,8% |
| Średnia długość całego żądania generowania | 18576 B | 16970 B | −8,6% |
| Średnia długość żądania audytu | 5925 B | 4417 B | Pomiar porównuje starszy format audytu z już zoptymalizowanym formatem z RC57.10.5; RC57.10.6 go nie zmienia |
| Rzeczywista mediana odpowiedzi Apinex | Brak | Brak | **Nie zmierzono** |
| Rzeczywiste p95 czasu odpowiedzi Apinex | Brak | Brak | **Nie zmierzono** |

Dane bajtowe pochodzą z `tools/test-rc57105-performance.mjs` uruchomionego z `BASELINE_DIR=/mnt/data/rc57_10_5_perf`. Jest to pomiar rozmiaru żądań, nie wydajności modelu. Lokalny czas JSON.stringify jest zmienny i nie pozwala przewidzieć opóźnienia API.

## Testy zaliczone

- `npm run build`, `npm run check` — składnia, integralność zasobów, kanon.
- `tools/test-rc57106-unified-prompt.mjs` — jeden prompt, pięć sekcji, kontrakt faktów i pamięci, 24 próbki wszystkich sześciu świadków; identyczna lista faktów, psychologia, styl wypowiedzi, relacje względem RC57.10.5.
- `tools/test-rc50.mjs`, `tools/test-rc51.mjs`, `tools/test-rc52.mjs`, `tools/test-rc37-psychology.mjs` — negacje, złożone pytania, charakterystyka, bez wycieku między świadkami.
- `npm run test:rc57105-performance` — 300 pomiarów lokalnych i mock transportu.
- `npm run test:rc57103-preacceptance` — lokalne sprawdzenie generowania, odrzucenia błędnych wypowiedzi i poprawek.
- `npm run test:rc57-hobby` — 600 deterministycznych kontroli oraz 12 funkcji Vercel Hobby.
- `npm run test:rc57-typos` — literówki i testy Chromium w szerokościach 390 / 1440 px.
- `npm run test:rc57101-blind` — kontrola raportu ślepego testu i Chromium.
- `node tools/test-rc57-playthrough.mjs` — 3 symulacje, 580 działań.
- `node tools/test-rc57-provider-migration.mjs` — ścieżki providerów i pacing.
- `node tools/test-rc57-quality.mjs` — tester i wznawianie.
- `python tools/test-saves.py` — operacje na zapisach i migracje.

## Dotychczasowe nieaktualne testy

`tools/test-rc32-dialogue.mjs` i `tools/test-rc30-nonblocking-naturalness.mjs` nadal oczekują starego zachowania bez korekty wypowiedzi. Oba kończą się tym samym błędem `rewrite` także na **niezmienionej RC57.10.5**. Nie oznaczono ich jako zaliczonych i nie zmodyfikowano produkcyjnej bramki w celu ich zaliczenia.

## Czego nie potwierdzono

Nie było rzeczywistych zapytań do Apinex; nie ma empirycznego dowodu na skrócenie czasu generowania ani zachowanie tej samej naturalności na modelu. Weryfikacja na Vercel Preview jest konieczna. Żadne testy z mock transportu nie są prezentowane jako prawdziwe odpowiedzi Luna/Jev.
