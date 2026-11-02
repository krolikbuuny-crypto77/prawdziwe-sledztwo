# RC57.10.18 — Raport QA i ograniczenia

## Zakres zmian
- Baza: RC57.10.17 Fotokartoteka.
- Szablon gry: początkowy ekran „Otwieranie akt”, zwijane instrukcje, wskazówki wydajności.
- CSS: spójniejsze czytanie dialogów, zachowanie formularza i układu w telefonie, humanitarne stany błędu i oczekiwania.
- Klient AI: komunikaty dla gracza bez surowych kodów HTTP; zachowanie pytania i istniejący `Retry-After`. Techniczne szczegóły wyłącznie w debugowaniu.
- Dodatkowe informacje w laboratorium, obronie, współpracy i przy odczycie zapisu nie ujawniają wewnętrznych identyfikatorów błędów.
- Portrety fikcyjnych postaci: WebP, istniejące fotografie; niższy priorytet miniatur. Fotografie dowodowe w pełnej jakości, **nie** były rekompresowane ani zmieniane semantycznie.

## Potwierdzone testy lokalne
- `node tools/build.mjs` — PASS, 61 JS / 64 CSS, odtwarzalny artefakt.
- `node tools/check.mjs` — PASS, 81 plików WebP i 9 MP3 z niezmienionymi hashami, kontrakty gry.
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli logiki.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań w trzech symulowanych śledztwach.
- `node tools/test-rc571013-negations.mjs` — PASS, 600/600, w tym 60/60 negacji.
- `node tools/test-rc571014-excluded-focus.mjs` — PASS, poprawne wspomnienie o Lenie nie blokuje alibi.
- `python tools/test-rc571018-presentation.py` — PASS przy 320, 390, 768, 1440, 1920 px: 10 sekcji, fotografie, brak poziomego overflow, brak błędów JS, początkowy ekran znika; na telefonie zachowany istniejący przełącznik między świadkami i rozmową.
- `node tools/test-rc571018-ui.mjs` — PASS: oczekiwanie i mapowanie błędów w zwykłym widoku bez kodów dostawców, 6 portretów.

## Ograniczenia
- Nie uruchomiono zapytań do prawdziwego Apinex, Vercel ani Supabase w tym wydaniu.
- Lokalny test HTTP z atrapą modelu został zablokowany przez środowisko uruchomieniowe (przeglądarka nie może połączyć się z lokalnym serwerem). **Nie** zalicza się go jako testu integracyjnego.
- Nie potwierdzono wyglądu każdego bardzo długiego tekstu we wszystkich możliwych stanach rozgrywki; wymagana ręczna próba w Vercel Preview.
- Optymalizacja polega na priorytetach pobierania/lazy-loading i ograniczeniu animacji; oryginalny rozmiar plików graficznych w paczce zasadniczo pozostaje niezmieniony, by zachować jakość dowodów.
- Brak zmian logiki, dialogów, odblokowywania dowodów i zapisu.
