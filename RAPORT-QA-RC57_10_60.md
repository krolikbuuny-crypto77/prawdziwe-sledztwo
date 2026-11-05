# Prawdziwe Śledztwo — RC57.10.60: audyt i optymalizacja bez zmiany rozgrywki

**Baza:** pełna RC57.10.59 / RC58.  **Zakres wykonany:** optymalizacja dostarczania CSS/JS, cache, powtarzalny build, testy porównawcze i diagnostyka rozmiaru.  **Bez zmian:** kanon, AI, API, dowody, przebieg śledztwa, zapisy, CSS wynikowy i JavaScript wynikowy.

## 1. Diagnoza

Strona startowa RC57.10.59 miała 3 322 902 B i zawierała w jednym HTML: skonsolidowany arkusz CSS 687 638 B oraz dwie duże klasyczne sekcje JavaScript: 1 469 568 B i 334 815 B. Oznaczało to ponowne dostarczanie tych samych bajtów w odpowiedzi HTML po aktualizacji lub ponownym wejściu, zamiast korzystania z osobno cache'owanych plików. Osobne pliki grafik i dźwięków już korzystały z cache i większość zdjęć miała lazy loading — tego nie zastępowałem agresywnym preloadem.

## 2. Zmiany wykonane

- `tools/build.mjs`: generuje **3 pliki z SHA-256 w nazwie**: `ps-css-...css`, `ps-js-00-...js`, `ps-js-60-...js`, oraz odwołania w `index.html`. Zawartość i kolejność reguł CSS oraz wykonywania klasycznych skryptów pozostaje oryginalna. Pierwszy duży skrypt ma preload w `<head>`; jego klasyczne wykonanie następuje w dotychczasowym miejscu dokumentu. Stare wersje plików z hashami są usuwane przez komendę build. CSS pozostaje w katalogu głównym — dotychczasowe ścieżki względne do obrazów działają.
- `vercel.json`: cache rok + `immutable` dla `ps-*`, obok istniejącego cache grafik i audio. `index.html` wciąż wymaga walidacji (`no-cache`), dzięki czemu przeglądarka pobiera aktualne nazwy zasobów po wdrożeniu.
- `tools/check.mjs`: weryfikuje źródła, hash-bundles, powtarzalność kompilacji, kontrakty i integralność oryginalnych grafik/audio; nie oczekuje już osadzonego elementu `<style>`.
- `tools/.test-index-inline.html`: **wyłącznie lokalny, niedostępny przez `/tools` na Vercel** artefakt kompatybilności testów `page.set_content`. Jest automatycznie generowany z tych samych źródeł; porównanie z oryginalnym produkcyjnym HTML RC57.10.59 wykazało identyczność bajtową. Nie jest drugą wersją gry do wdrożenia.
- `tools/test-saves.py`, `tools/test-navigation.py`, `tools/test-rc571055-laptop-parity.py`, `tools/test-rc571057-panels.py`: wykorzystują zgodny samodzielny HTML w dotychczasowym typie testów; nowe testy testują osobno rzeczywistą wersję z zewnętrznymi zasobami.
- `tools/test-rc571060-bundle.mjs`, `tools/test-rc571060-browser.py`, `package.json`: pomiar rozmiarów, weryfikacja sum i zachowania, porównanie obrazów oraz odtwarzalne zadania testowe.

## 3. Wyniki rozmiaru i transferu

| Metryka | RC57.10.59 | RC57.10.60 |
|---|---:|---:|
| Sam `index.html` | 3 322 902 B | 831 062 B |
| Sam `index.html` — gzip poziom 9 | 974 054 B | 272 469 B |
| HTML + CSS + 2 JS, pierwsze pobranie (gzip, bez pozostałych zasobów) | 974 054 B | 976 161 B |
| Dodatkowe cache'owane pliki | 0 | 3 |
| Arkusz CSS | inline 687 638 B | zewnętrzny 687 638 B |

**Wynik:** HTML zmniejszył się o **74,99% bez kompresji i 72,03% po gzip**. **Pierwsze pobranie nie jest mniejsze** — rozdzielenie plików daje w tym modelu ok. 2107 B narzutu przy gzip; mogą też wystąpić dodatkowe opóźnienia HTTP. W kolejnych wizytach przy niezmienionych plikach CSS/JS przeglądarka może wykorzystać cache; wtedy musi ponownie sprawdzić głównie HTML. To korzyść architektoniczna i sieciowa, nie dowód określonego przyspieszenia całej gry.

## 4. Testy

- `npm run check` — **PASS**: 61 skryptów, 64 sekcje CSS, 81 WebP + 9 MP3 z `ASSET_MANIFEST.json`, kompilacja, kanon i dowody.
- `node tools/test-rc571060-bundle.mjs` — **PASS**: 3 bundlowane zasoby zgodne z hashami, brak brakujących plików CSS.
- Test rzeczywistej strony `index.html` w Chromium poprzez przechwycenie zasobów: **132/132 kontroli zakończonych poprawnie** w niezależnym przebiegu (390, 1366, 1920 px). W rozszerzonym przebiegu na 390, 1280, 1366, 1536, 1920 px wydrukowano **220/220 poprawnych kontroli**, lecz całe uruchomienie zbiorcze przekroczyło limit czasu po tej fazie, więc nie uznaję tego przebiegu za formalnie zaliczony. Nie wykonano zapytań do zewnętrznego API.
- Po ostatniej korekcie ścieżek względnych do zasobów sprawdziłem stronę produkcyjną przy 1920, 1366 i 390 px: wszystkie trzy pliki CSS/JS zostały załadowane, zakładka Przesłuchania działa, brak błędów JS i przepełnienia poziomego — **PASS**.
- Porównanie sześciu zrzutów: **pikselowo identyczne** dla Pulpitu, Przesłuchań i Laboratorium przy 1366 oraz 1920 px.
- `python tools/test-saves.py` — **PASS**: integralność, eksport, import, autosave, reset, wersje zapisów 1–11 i rollback.
- `python tools/test-navigation.py` — **PASS**: 10 kliknięć przy 320, 390, 768 i 1440 px, spójność ARIA, brak odblokowania finału i błędów JS.
- `npm run test:rc58` — **PASS** (log lokalny): m.in. 91 kontroli pamięci i odpowiedzi, 72 żądania lokalnym endpointem z symulowanym Supabase, 2228 kontroli wyszukiwania wiedzy i 1325 relacji.
- Pierwszy zbiorczy `npm run test:rc571060` **przekroczył limit czasu po ukończeniu testu przeglądarkowego**. Po wydzieleniu długiej kontroli wizualnej do `npm run test:rc571060:visual` zbiorczy `npm run test:rc571060` uruchomiono ponownie i **przeszedł z kodem wyjścia 0**. Nie oznacza to zakończenia długiego przebiegu wizualnego, którego częściową diagnostykę opisano powyżej.

Pliki pomiarowe: `QA-RC571060/bundle-metrics.json`, `QA-RC571060/comparison.json`. Zrzuty przed i po przechowywane w katalogu roboczym QA, ale nie powiększają pełnego ZIP-a gry.

## 5. Pozostałe ograniczenia

- W oryginalnym CSS pozostają **7329 wystąpienia `!important`**. Usunięcie tysięcy kaskadowych nadpisań wymaga osobnego, etapowego refaktoru z testami każdej zakładki; nie usuwałem ich automatycznie, ponieważ mogłoby zepsuć wygląd.
- Nie przeprowadziłem rozbicia 1,4 MB źródłowego `src/core/case-engine.js` na niezależne moduły runtime. Zawartość jest od teraz cache'owalna jako część wygenerowanego pliku JS, ale wewnętrzna architektura źródła nadal wymaga pracy.
- Historyczne testy przeglądarkowe używające na sztywno `index.html` w `set_content`, inne niż cztery zaktualizowane, nie były wszystkie przenoszone na nowy fixture. W takim trybie nie wczytają zewnętrznych zasobów bez routingu. Nowy test strony produkcyjnej sprawdza je we właściwy sposób.
- Nie przeprowadziłem produkcyjnego testu wydajności na Vercel ani profilu wielogodzinnego zużycia RAM. Czasy lokalnego Chromium z przechwytywaniem plików nie są miarodajnym benchmarkiem sieciowym.
- Nie zmieniałem API RC58, a kolejka współdzielona nadal wymaga wcześniejszej konfiguracji Supabase; nie można uznać zewnętrznego limitowania za uruchomione tylko na podstawie testów lokalnych.

## 6. Rekomendowana akceptacja

Wgrać pełną RC57.10.60 do Vercel Preview, sprawdzić w DevTools Network, że `ps-css-*`, `ps-js-*` zwracają HTTP 200 oraz `Cache-Control: public, max-age=31536000, immutable`, przełączyć wszystkie zakładki przy 1920×1080 i 1366×768 i powtórzyć test zapisów. Następnie odświeżyć stronę i sprawdzić pamięć podręczną zasobów. **Nie zastępować wersji produkcyjnej przed tym krokiem.**
