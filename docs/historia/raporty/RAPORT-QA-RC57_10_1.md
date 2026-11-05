# RAPORT QA — RC57.10.1 (ślepy test)

## Cel
Oddzielić trafność wyboru podejrzanego od poprawności dowodowej i rzetelności argumentacji. Naprawić sytuację, gdy `canon_match_requires_manual_review` pojawiało się obok wykrytego nieistniejącego `LAB-014` bez jasnego powiązania obu ocen.

## Zmiany
- `lib/admin-rc57-blind-grade.js`: trzy niezależne wymiary `grade.dimensions.verdict/evidence/reasoning`; ocena zbiorcza `canon_match_with_source_errors` dla trafnego typowania z nieprawidłowym źródłem i `canon_match_with_reasoning_warnings` dla niepewnego wnioskowania bez błędnego ID. Zachowano pola wstecznie zgodne `canonMatch`, `assessment`, `invalidSourceIds`.
- `lib/admin-rc57-claim-audit.js`: kontrola źródeł w `evidenceIds` i w trzech polach tekstowych; oddzielne wykrywanie nadinterpretacji metadanych AUD-04, niewysłanego projektu BHP, niewidocznej niszy, sesji online, włókien, trasy 215 s i sylwetki z kamer; sygnał podwójnego liczenia LAB-07/LAB-09 tylko przy wyraźnej deklaracji niezależności.
- `lib/admin-rc57-blind.js`: ocena we wszystkich fazach, lecz bez punktowania sprawcy na 13 dokumentach; brak klucza w ładunku AI; doprecyzowanie instrukcji dotyczących nieuprawnionych wniosków; spójniejszy `integrity.allCitedDocumentsKnown`.
- `lib/admin-rc57-ui.js`: trzy osobne wiersze oceny w wynikach i eksporcie raportu.
- Nowy test regresyjny, aktualizacja testu Chromium, skrypt npm.

## Wyniki
- `npm run check`: **PASS** — składnia, spójność źródeł i pakiet gry.
- `node tools/test-rc57101-blind-audit.mjs`: **PASS** — przypadek z ostatniego raportu (LAB-014, konto nadawcy, BHP), sześć dodatkowych nadinterpretacji, brak fałszywych alarmów w kontrolowanych przykładach ostrożnego wnioskowania, 13 vs 78 źródeł, izolacja klucza odpowiedzi, liczba funkcji 12.
- `node tools/test-rc57-blind.mjs`: **PASS** — dwie niezależne fazy, dostęp, uprawnienia, brak przesyłania klucza kanonu.
- `node tools/test-rc57-quality.mjs`: **PASS** — zachowane wcześniejsze kontrole i wznowienia po 429.
- `python tools/test-rc57-blind-browser.py`: **PASS** — Chromium 390 i 1440 px, widoczne trzy oceny, ostrzeżenie LAB-014, pobranie JSON, brak błędów JavaScript.
- `node tools/test-rc57-whole-game.mjs`: **PASS** — 380 rzeczywistych kontroli reguł gry, w izolacji od Supabase.

## Otwarta lista ryzyk
1. Heurystyki mogą nie znaleźć parafraz błędnych twierdzeń albo oznaczyć nietypową formę poprawnej hipotezy do ręcznej kontroli.
2. Nie było prawdziwego połączenia z Apinex w ramach tego wydania — testy użyły kontrolowanych odpowiedzi, bez zużywania klucza użytkownika.
3. Nie testowano produkcyjnej bazy Supabase; nie była potrzebna do zmian w testerze.
4. Częściowo poprawne wyjaśnienie sprawcy nadal wymaga oceny człowieka: żadna reguła nie zastępuje analizy semantycznej całej fabuły.

## Integralność
- **78 dokumentów**: bez zmian; **13 startowych**: bez zmian.
- **12 plików funkcji API Vercel**: bez zmian.
- Nie zmieniano serwerowego kanonu, reguł werdyktu, migracji Supabase, zapisów graczy ani widoku gry.
- Nie wykonano deployu na GitHub/Vercel.
