# RAPORT QA — RC57.10.15, wygląd kartoteki

## Zakres

Punktem wyjścia jest pełna RC57.10.14. Zmieniono CSS (nowy, końcowy plik `src/styles/103-dossier-visual-rc571015.css`), `src/build-manifest.json`, kolorystykę przeglądarki w szablonie HTML, zbudowany `index.html` oraz dokumentację. Nie zmieniano JavaScriptu gry, API, źródeł faktów, kanonu ani mechanik. Brak nowych sugerowanych pytań; `#chatInput` i `#chatSend` zachowano.

## Wyniki lokalne

- `npm run build` — PASS, 61 sekcji JS, 64 sekcje CSS, jeden scalony arkusz.
- `npm run check` — PASS; w tym bazowe kontrakty nawigacji, stanu, przypisania funkcji, kanonu i zaufanych dowodów.
- `node tools/test-rc57-whole-game.mjs` — PASS (380 kontroli reguł).
- `node tools/test-rc57-playthrough.mjs` — PASS (580 zweryfikowanych działań gracza w 3 symulacjach).
- `python tools/test-saves.py` — PASS.
- `node tools/test-rc571013-negations.mjs` — PASS (600/600).
- `node tools/test-rc571014-excluded-focus.mjs` — PASS.
- `python tools/test-rc571015-dossier-layout.py` — PASS dla 390/768/1440/1920 px; pole pytania, 3 istniejące taktyki rozmowy, wybór dowodu, 10 modułów, brak poziomego overflow oraz brak nakładania się głównego pola pytania i przycisku wysłania (a także listy postaci i rozmowy).
- `python tools/test-rc571015-all-tabs-layout.py` — PASS; 10/10 modułów dla czterech szerokości (40 widoków), bez poziomego overflow dokumentu i bez błędów JS.

## Co nie zostało potwierdzone

Nie wykonywano realnych zapytań do Apinex ani testów wdrożonego Vercel. Test `no horizontal overflow` nie wykrywa wszystkich możliwych nakładek w każdym stanie gry, długich dokumentach i na każdym urządzeniu. Fotografie i assety z względnych ścieżek w lokalnych zrzutach z izolowanego HTML mogą nie być widoczne, choć docelowe pliki pozostają w paczce. Przed przejściem na produkcję zweryfikuj w Vercel Preview interakcje, dowody, długą rozmowę, menu mobilne oraz autentyczne grafiki.
