# Raport jakości RC57.4 — 1 listopada 2026

## Symulacja sekwencyjna

- Główna ścieżka: **193/193** kroków, 78 dokumentów, 5 analiz, 20 wydarzeń, 6 świadków, 6 obron, werdykt `solid`.
- Błędne oskarżenie: **193/193**, takie same dozwolone źródła, serwer zwrócił `returned` (nie `solid`).
- Wznowienie: **194/194**, odtworzenie struktury JSON, potem werdykt `solid`.
- Łącznie: **580/580** sekwencyjnych testów operacji. Brak pomijania etapów przez nadawanie dokumentów z fixture.

## Regresja istniejących mechanizmów

- `npm run check`: PASS — 61 części JS, 64 CSS, hashe zasobów, kanon, integracje.
- `node tools/test-rc57-playthrough.mjs`: PASS — trzy pełne ścieżki, autoryzacja, CSRF, brak zewnętrznych wywołań, 12 plików API.
- `python tools/test-rc57-playthrough-browser.py`: PASS — prywatny panel 390 i 1440 px, trzy scenariusze, pobranie 580 wierszy JSON, brak błędów JS.
- `node tools/test-rc57-whole-game.mjs`: PASS — 380 niezależnych kontroli.
- `node tools/test-rc57.mjs`: PASS — 600 przypadków, 0 błędów.
- `node tools/test-rc57-live.mjs`: PASS — mechanizm prawdziwego AI z testowym transportem (nie z prawdziwymi kluczami).
- `node tools/test-rc35-coop.mjs`: PASS — logika kooperacji (test izolowany).
- `python tools/test-saves.py`: PASS — SHA256, import/eksport, migracje 11 wersji, rollback, autosave.
- `python tools/test-navigation.py`: PASS — prawdziwe kliknięcia w Chromium przy 320, 390, 768, 1440 px. Pierwszy zbiorczy przebieg miał timeout środowiska; ponowny samodzielny przebieg zakończył się poprawnie.

## Integralność / limity

- Nadal dokładnie 12 plików `.js` w katalogu `api/` (Hobby).
- Główna gra `index.html` oraz kanon, reguły werdyktu i SaveManager nie zostały zmodyfikowane przez RC57.4.
- Symulacja nie dotyka Supabase, nie używa AI i nie zapisuje rzeczywistych pokojów ani stanów graczy.

## Ograniczenia

To nie jest pełne E2E przechodzące produkcyjną grę kliknięciami. Nie testowano w tym przebiegu prawdziwych pokojów Supabase i realnych odpowiedzi dostawców AI. Istniejące testy przeglądarkowe pokrywają tylko reprezentatywne ścieżki UI, nie wszystkie możliwe działania i rozgałęzienia.
