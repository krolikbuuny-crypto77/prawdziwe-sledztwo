# RC57.10.36 — Profesjonalny układ i uporządkowanie sekcji

## Co zrobiono

Przebudowano warstwę prezentacji wszystkich 10 zakładek w grze „Prawdziwe Śledztwo — Ostatni kurs”. Podstawą pozostają realne dane sprawy Leny Rudnickiej i tramwaju TW-217.

- **Wspólny rytm:** nagłówki, odstępy, obramowania, cienie i szerokości paneli ujednolicono w jednym arkuszu źródłowym.
- **Nawigacja wewnętrzna:** w Pulpicie, Aktach, Poszukiwaniach, Osi czasu i Notatniku dodano krótkie odsyłacze do rzeczywiście istniejących sekcji; w pozostałych modułach zachowano wcześniejsze mechanizmy nawigacji, aby nie duplikować menu.
- **Notatnik:** właściwy formularz notatek znajduje się przed analizą konfrontacji, zapisami i dodatkowymi tablicami.
- **Dedukcja:** formularz hipotezy znajduje się przed długą tablicą wątków; naprawiono błąd, w którym ukryty panel źródeł rezerwował szerokość obok formularza.
- **Oś czasu:** metryki i główny warsztat chronologiczny umieszczono przed rozbudowaną analizą automatyczną.
- **Kontrast:** poprawiono jasne opisy w nagłówkach modułów oraz zachowano czytelność na pergaminowych kartach.
- **Mobile:** przyciski nawigacji i panele przestawiają się według szerokości urządzenia, bez pomniejszania całej strony.

Nie zmieniono: AI, wyzwalaczy fabularnych, świadków, reguł dowodów, werdyktu, zapisu Supabase ani mechaniki własnych pytań.

## Rzeczywiste kontrole

- Chromium: **400/400 PASS**, 10 zakładek × 8 rozmiarów ekranu, kontrola orientacji, układu i podstawowych elementów formularza.
- Chromium: **3/3 PASS** — 100 testowych wiadomości na 390×844, 390×560 i 1440×900. Historia przewijana niezależnie od pola pytania.
- `npm run check`: **PASS** — odtwarzalność budowania, składnia i integralność assetów, rejestry nawigacji, zapisu, wiedzy świadków i dowodów.
- `node tools/test-rc57-whole-game.mjs`: **PASS, 380 kontroli** głównej logiki gry.
- `python tools/test-saves.py`: **PASS**, eksport/import, migrowanie zapisów i obsługa autosave.

## Ograniczenia

Testy wykonano lokalnie w przeglądarce Chromium. Nie przeprowadzono próby z prawdziwym API przesłuchań, zapisem Supabase w produkcji ani na fizycznym telefonie z otwartą klawiaturą. Podglądy przedstawiają lokalne widoki, nie opublikowaną produkcję.

## Zmiany źródłowe

- `src/styles/rc571036-professional-sections.css` — jednolity system prezentacji.
- `src/presentation/rc571036-professional-sections.js` — organizacja istniejących bloków i nawigacja wewnętrzna.
- `src/index.template.html` — podłączenie skryptu prezentacyjnego.
- `src/build-manifest.json` — rejestr źródła CSS i aktualizacja kontrolnej sumy stylów.
- `index.html` — wynik kompilacji.
- `tools/test-rc571036-professional.py`, `tools/test-rc571036-long-chat.py` — testy regresji.
