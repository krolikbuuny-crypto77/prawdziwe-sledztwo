# RC57.10.58 — Układ protokołu przesłuchania

Data: 4 listopada 2026. Baza: pełny RC57.10.57.

## Zakres
- Wyśrodkowana kolumna protokołu (maksymalnie 860 px), naprzemienne wypowiedzi gracza i świadka.
- Maksymalna szerokość dymków 650 px i bardziej czytelne odstępy; bez rozciągania wiadomości na całą szerokość Full HD.
- Zarezerwowane miejsce dla portretu świadka i oznaczenia „TY”, bez obcinania przy krawędzi obszaru przewijania.
- Zachowany nagłówek protokołu, pole własnego pytania, przewijanie, historia wiadomości i osobne widoki mobilne.
- Implementacja: nowy arkusz `assets/ui/rc571058-transcript-layout.css`, dołączony w `src/index.template.html` i skompilowanym `index.html`.
- Bez zmian w silnikach AI, wiedzy świadków, fabule, regułach dowodów i save.

## Weryfikacja
- Browser Chromium, syntetyczna rozmowa (to nie odpowiedzi produkcyjnego API): **58/58** kontroli na 1920×1080, 1536×864, 1366×768, 1280×720, 1024×768 i 390×844.
- Sprawdzenie: brak poziomego przewijania strony, brak kolizji dymków, awatary w obszarze, szerokości dymków, dostępność pola pytania, 100 wiadomości, doładowanie starszej historii; 0 błędów JavaScript w tym scenariuszu.
- `npm run build` i `npm run check`: PASS (61 sekcji JS, 64 CSS, 81 obrazów WebP, 9 MP3; kontrola zgodności kanonu i rejestru dowodów).
- `node tools/test-rc571048-retrieval.mjs`: **2228 PASS**.
- `node tools/test-state618.mjs`: **51 PASS** (logika i werdykt).
- `python tools/test-rc571056-story-gates.py`: **12 PASS** (widoczność wątków).
- `python tools/test-saves.py`: PASS (migracje, eksport/import, autosave, wznowienie, reset, błędny zapis).

## Granice testu
- Nie przeprowadzano rzeczywistego przesłuchania przez serwery AI ani testu produkcyjnego Supabase.
- Screeny w `QA-RC571058` wykonano na sztucznej rozmowie wyłącznie dla oceny geometrii.
- Zmiany ograniczone do prezentacji; wdrożenie produkcyjne należy poprzedzić kontrolą Vercel Preview.
