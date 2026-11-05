# RC57.10.37 — finalne dopracowanie wyglądu

## Zakres wykonanych zmian

Wykonano wyłącznie poprawki CSS, bez zmian w silnikach gry, rozmowach AI, faktach, logice dowodów, zapisach i werdykcie.

1. **Odstępy:** zmniejszono marginesy kart, nagłówków i paneli oraz zbyt duże odstępy między modułami.
2. **Typografia:** zwiększono minimalny rozmiar tekstu podstawowego (15 px) i czytelność nagłówków, etykiet oraz pól formularzy.
3. **Dedukcja:** ukryto powtórzony wizualnie tytuł warsztatu i górny duplikat nawigacji krokowej. Zostawiono działające trzy kroki, ich podpowiedź, przyciski na dole i formularz hipotezy.
4. **Nawigacja wewnętrzna:** ujednolicono skróty jako kompaktowe przyciski zakładek, z oddzielnym stanem aktywności.
5. **Hierarchia:** akcje główne mają czytelny bordowy wygląd; drugorzędne pozostają jasne. Stan wyłączony jest jednoznacznie oznaczony.
6. **Telefon:** bardziej kompaktowe nagłówki i skróty; etapy Dedukcji wyświetlane w trzech kolumnach, nie w długim pionowym stosie.

## Zmienione pliki

- `src/styles/rc571037-final-polish.css` (nowy, jedyny arkusz zmian wizualnych tej wersji)
- `src/build-manifest.json`
- `index.html` (wygenerowany z manifestu)
- `tools/test-rc571037-polish.py` (nowy test regresyjny)
- `INSTRUKCJA-GLOWNA.md` (informacja o wersji)

## Testy wykonane lokalnie

- `npm run check`: **PASS** — odtwarzalny build, składnia, assety i integralność kanonu.
- `python tools/test-rc571036-professional.py`: **400/400 PASS** — 10 zakładek na 8 rozmiarach.
- `python tools/test-rc571037-polish.py`: **390/390 PASS** — rozmiary od 320 do 1920 px, brak poziomego przepełnienia, czytelność rozmiarów tekstu, Dedukcja i wewnętrzna nawigacja.
- `node tools/test-rc57-whole-game.mjs`: **PASS 380 reguł**.
- `python tools/test-saves.py`: **PASS** — eksport, import, migracje, autosave.
- `python tools/test-rc571036-long-chat.py`: **3/3 PASS**, 100 testowych wiadomości.

## Ograniczenia

Zrzuty i testy wykonano w lokalnym Chromium. Nie przeprowadzono testu produkcyjnego z API modeli AI i Supabase ani na fizycznym telefonie z otwartą klawiaturą. Nie jest to weryfikacja każdego możliwego stanu wizualnego w grze.
