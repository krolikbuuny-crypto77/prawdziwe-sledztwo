# Prawdziwe Śledztwo — RC57.10.62: ostrożne ograniczenie nadpisań CSS

**Baza:** pełna RC57.10.61. **Zakres:** wyłącznie porządkowanie istniejących reguł CSS, narzędzia weryfikacyjne i metadane budowania. Bez zmian w fabule, kanonie, AI/API, zapisach, dowodach, nawigacji, obrazach i dźwiękach. **Brak wdrożenia na Vercel w tym etapie.**

## Co zmieniono

- W `src/styles/103-dossier-visual-rc571015.css` usunięto **30 wcześniejszych, identycznych reguł**, dla których istnieją późniejsze reguły z tym samym selektorem, listą deklaracji i tym samym kontekstem warunkowym (`@media`/`@supports`/`@container`). Nie przestawiano pozostałych reguł.
- Liczba wystąpień `!important` spadła z **7329 do 7296 (−33)**. Plik źródłowy: **189 601 → 187 687 B (−1914 B)**. CSS produkcyjny: **687 638 → 685 724 B (−1914 B)**. To niewielka poprawa porządku kodu, **nie potwierdzone przyspieszenie gry**.
- Zmieniono sumę kontrolną i rozmiar odpowiedniej sekcji `src/build-manifest.json`, odświeżono wygenerowane `index.html`, lokalny testowy HTML oraz plik `ps-css-*.css` z nową nazwą zależną od zawartości. **Dwa wygenerowane skrypty `ps-js-*` nie zmieniły bajtów ani nazw.**
- Zaktualizowano próg ochronny `src/css-important-baseline.json` do **7296**, aby następne zmiany nie przywróciły przypadkowo usuniętych nadpisań. `npm run audit:css` tworzy bieżący inwentarz w `QA-RC571062/`.
- `QA-RC571062/removed-duplicate-rules.json` zapisuje dokładnie usunięte fragmenty i ich lokalizacje. `tools/test-rc571062-css-integrity.mjs` odtwarza z nich **bajt w bajt** oryginalny arkusz RC57.10.61 i weryfikuje SHA-256 oraz stałość wygenerowanego JS.

## Testy — wykonane lokalnie

| Test | Wynik |
|---|---|
| `npm run build` i `npm run check` | **PASS** — 61 sekcji JS, 64 CSS, 81 WebP, 9 MP3, kanon i kontrakty |
| `npm run audit:css` i `npm run test:rc571062:css` | **PASS** — 30 duplikatów, 33 `!important` mniej; oryginał odzyskiwalny bajtowo |
| `node tools/test-rc571060-bundle.mjs` | **PASS** — zgodne 3 pliki CSS/JS z hashami i odwołaniami w HTML |
| `npm run test:rc58` | **PASS** — 72 symulowane żądania, 24 dodatkowe tury, 0 błędów, 2228 kontroli wiedzy, 1325 relacji; bez wywołań płatnego/zewnętrznego API |
| `python tools/test-navigation.py` | **PASS** — po 10 kliknięć w 320, 390, 768, 1440 px; ARIA, bramki finału i brak JS errors |
| `python tools/test-saves.py` | **PASS** — checksum, rollback, eksport/import, autosave, reset, migracje v1–v11 |
| `python tools/test-rc571062-browser.py` | **PASS** — porównanie CSS **30/30** (10 zakładek przy 390, 1366 i 1920 px); **14 091** porównań stanów obliczonych stylów i geometrii; **9/9 zrzutów pikselowo identycznych** (Pulpit, Przesłuchania, Laboratorium w 3 rozdzielczościach); brak błędów JS i poziomego przepełnienia |

Wyniki dodatkowe: `QA-RC571062/css-before-after-browser.json`, `QA-RC571062/css-cascade-inventory.json`, `QA-RC571062/bundle-metrics.json`. Screenshoty i pełne logi służyły do lokalnej kontroli, nie są dołączane do paczki wdrożeniowej.

## Ograniczenia i ryzyka

- Testy przeglądarkowe korzystały z lokalnie przechwytywanych zasobów HTTP. **Nie jest to test rzeczywistego wdrożenia na Vercel** ani zewnętrznych dostawców modeli.
- Dodatkowy test RC57.10.61 `test:rc571061:parity` celowo powinien teraz zwrócić błąd, ponieważ sprawdza identyczność starego, już zmienionego arkusza CSS. Nowy kontrakt jest w `test:rc571062:css`; test JS pozostaje niezmienny.
- W pozostałych plikach nadal są tysiące `!important`. Nie usuwaj ich mechanicznie. Każde następne odchudzanie wymaga porównania CSSOM, wyliczonych stylów oraz zrzutów ekranu.
- Mimo niewielkiego zmniejszenia CSS, **nie zmierzono zysku wydajności sieciowej**. Przy pierwszym wejściu po aktualizacji trzeba pobrać nowy arkusz o zmienionym hashu.

## Wniosek i akceptacja

**Lokalnie RC57.10.62 przechodzi testy regresji w sprawdzonym zakresie i daje identyczny obraz wybranych modułów.** Przed produkcją należy uruchomić Vercel Preview: sprawdzić HTTP 200 dla wszystkich `ps-*`, cache, przełączanie zakładek, zapis i wznowienie oraz przesłuchania z konfiguracją dostawcy używaną na produkcji. W razie problemów wrócić do RC57.10.61. Brak nowych migracji Supabase lub zmian kluczy.
