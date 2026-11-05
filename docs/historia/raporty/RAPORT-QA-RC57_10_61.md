# Prawdziwe Śledztwo — RC57.10.61 / bezpieczna organizacja kodu

**Baza:** RC57.10.60, pełne archiwum. **Cel:** przygotować bezpieczny, stopniowy refaktor złożonego silnika i kaskady CSS bez zmiany gry, fabuły, integracji API, wyglądu ani zapisu.

## Wykonano

1. `src/core/case-engine.js` (1 377 656 bajtów UTF-8) podzielono w źródłach autorskich na **8 logicznych części** `src/core/case-engine-parts/01-*.js`–`08-*.js` (części 122–285 KB).
2. `tools/sync-case-engine.mjs` składa części **bez żadnych dodatkowych znaków**, sprawdza sumy SHA-256, odtwarza `src/core/case-engine.js` jako zgodną kopię dla starych testów oraz posiada świadomie uruchamianą opcję `--accept` dla zatwierdzonych zmian.
3. `tools/build.mjs` odtwarza zgodną kopię przed budowaniem; `tools/check.mjs` sprawdza jej integralność. `tools/audit-overrides.mjs` nie skanuje wtórnie plików autorskich, dzięki czemu zachowane są wymagania pojedynczych właścicieli (`showTab`, SaveManager, WitnessEngine).
4. `tools/audit-css-cascade.mjs`, `src/css-important-baseline.json` i `QA-RC571061/css-cascade-inventory.json` identyfikują źródła nadpisań; kontrola nie pozwala przypadkowo zwiększyć istniejącej liczby deklaracji `!important` bez osobnego przeglądu.
5. Dodano `tools/test-rc571061-parity.mjs` i polecenia `npm run audit:css`, `npm run sync:case-engine:reviewed`, `npm run test:rc571061:parity`, `npm run test:rc571061`.

## Testy i dowody zgodności

- **PASS** `npm run build`.
- **PASS** `npm run check`: 61 sekcji JS, 64 sekcje CSS, zgodność 81 WebP i 9 MP3, brak naruszeń pojedynczej odpowiedzialności, zgodność kanonu i dowodów.
- **PASS** `npm run test:rc571061:parity`: `src/core/case-engine.js`, `index.html`, główny CSS oraz oba wygenerowane skrypty JS mają **identyczne sumy SHA-256 jak w RC57.10.60**.
- **PASS** `node tools/test-rc571060-bundle.mjs`: zgodność trzech wersjonowanych zasobów, brak problemów cache i build.
- **PASS** `npm run test:rc58`: m.in. 72 symulowane zapytania, 24 dodatkowe tury, 0 błędów, 2228 kontroli wyszukiwania wiedzy, 1325 kontroli relacji oraz testy inteligencji i dostawców.
- **NIEZAKOŃCZONE W TYM ŚRODOWISKU:** pełny `npm run test:rc571061`, ponieważ przeglądarkowy `tools/test-saves.py` nie zakończył się przed limitem wykonania. Z tego powodu **nie zgłaszam świeżego PASS** dla testów zapisów i nawigacji w Chromium. Testy tych funkcji poprzedniej wersji RC57.10.60 pozostają udokumentowane w jej raporcie QA. Jest silny dowód braku regresji w warstwie klienta przez identyczność bajtową wszystkich uruchamianych zasobów; nie zastępuje to nowego testu wdrożenia.

## Audyt CSS — baza

- **84 źródłowe pliki CSS**, **7329** wystąpień `!important`; liczba **pozostała bez zmian**.
- Największe skupiska: `103-dossier-visual-rc571015.css` — 4186; `rc571028-unified-dossier.css` — 801; `rc571038-premium-dossier.css` — 582; `58-studio-v2-interface.css` — 534; `31-cinematic-noir-theme.css` — 292.
- W tej wersji **nie usuwano nadpisań**. Samo ich hurtowe usunięcie grozi zmianą kaskady, kontrastu i responsywności. Rozsądny następny etap to usuwanie małych grup udowodnionych nadmiarowych reguł, każdorazowo z testem wizualnym każdej zakładki.

## Wydajność i wdrożenie

**Nie twierdzimy, że gra stała się szybsza.** Rozmiary runtime, wygląd i zachowanie są identyczne z RC57.10.60. To poprawa organizacji źródeł, przygotowanie do dalszych optymalizacji i automatyczna ochrona przed regresją. Nie zmieniano Vercel, Supabase, API, kluczy ani migracji.

Pakiet pełny jest samodzielny; mały ZIP aktualizacyjny nakładać na pełne źródła RC57.10.60, z zachowaniem ścieżek. Wdrożenie produkcyjne samej RC57.10.61 nie daje zmian widocznych graczowi.
