# Prawdziwe Śledztwo — RC57.10.64: płynność długiej sesji i pamięć przesłuchań

**Baza:** pełna, zweryfikowana RC57.10.63. **Data:** 5 listopada 2026 r.

## 1. Zakres zmiany

Usunięto niepotrzebne, okresowe przebudowy panelu pamięci rozmowy (`src/integrations/102-interview-memory-rc42.js`). Stary zegar 3400 ms zawsze wywoływał `render()` podczas aktywnego przesłuchania, nawet bez nowego pytania, przebudowując panel i tworząc kolejne krótkotrwałe węzły. W RC57.10.64 zegar najpierw kontroluje, czy zmieniła się lista pytań gracza, referencja listy (np. po imporcie zapisu), liczba wiadomości lub aktywny świadek. Tylko wówczas następuje odświeżenie. Porównuje także zawartość wszystkich wypowiedzi gracza, więc wykrywa edycje bez zmiany ich liczby. Przejście do zakładki nadal wymusza dotychczasowy odczyt.

Nie zmieniono progów psychologicznych, kanonu, rozwiązań fabularnych, zasad dowodowych, API, zapisu, kluczy, ustawień Supabase, logiki werdyktu ani wyglądu CSS. Nadal jest to **interfejs tekstowych przesłuchań**.

Zmiana wymaga ponownego hashowania drugiego pakietu JavaScript. Wynikowy `ps-js-60-*` wzrósł z 334 815 do 335 689 B (+874 B, gzip z 108 324 do 108 729 B, +405 B). Stary bundle nie jest potrzebny; `npm run build` usuwa nieaktualne pliki `ps-*`.

## 2. Wynik mierzalny: bezczynność podczas przesłuchań

Test `tools/test-rc571064-memory-poll.py` przechwycił tylko okresową procedurę odświeżania i wykonał 100 symulowanych wywołań w jednym, niezmienionym stanie rozmowy. Liczono rekordy `MutationObserver` wewnątrz panelu pamięci.

| Rozdzielczość | RC57.10.63 | RC57.10.64 |
|---|---:|---:|
| 390 px, 100 wywołań bez nowych pytań | 200 mutacji DOM | **0 mutacji DOM** |
| 1366 px, 100 wywołań bez nowych pytań | 200 mutacji DOM | **0 mutacji DOM** |
| Test nowego pytania, edycji tekstu przy tej samej liczbie wypowiedzi, zastąpienia logu po imporcie, przełączenia świadka | PASS | **PASS** |

Uwaga: to **syntetyczny test 100 wywołań**, nie 100 rzeczywistych okresów bezczynności ani pomiar czasu renderowania całej strony. Czasomierz 3400 ms wciąż działa, ale nie przebudowuje DOM bez zmiany danych.

## 3. Testy funkcjonalne i wizualne

- `npm run build` — PASS: 61 sekcji JS, 64 sekcje CSS, 3 bundlowane zasoby z hashami.
- `npm run check` — PASS: składnia, manifest, aktywa (81 WebP + 9 MP3), kontrakty i kontrola CSS.
- Test integralności dawnych poprawek RC57.10.61 / 62 / 63 — PASS po świadomym odpięciu historycznych pinów od zmienianego w kolejnych wydaniach pakietu `ps-js-60-*`; kod źródłowy silnika i `ps-js-00-*` pozostały niezmienione.
- `tools/test-rc571064-memory-poll.py` — PASS, oba szerokości.
- `tools/test-rc571064-browser.py --baseline /ścieżka/do/RC57.10.63` — PASS: **60/60** sprawdzeń zakładek w dwóch wersjach, **30/30** zgodnych zestawień stylów i geometrii, **14 091** porównanych stanów elementów, **9/9** zrzutów pikselowo identycznych w ostatnim przebiegu; błędy JS: 0. Wcześniejsze próby miały niepowtarzalne różnice czterech pikseli i pojedyncze rozbieżności pomiaru, dlatego test nie jest dowodem idealnej powtarzalności rasteryzacji na każdym urządzeniu.
- `tools/test-rc571064-browser.py` bez baseline — PASS: 30/30 zakładek przy 390, 1366 i 1920 px.
- `python tools/test-saves.py` — PASS: checksum, eksport/import, autosave, reset, rollback i migracje v1–v11.
- `python tools/test-navigation.py` — PASS: 10 kliknięć na każdym z 320/390/768/1440 px, zgodność ARIA, zachowanie blokad finału.
- `npm run test:rc58` — PASS osobno: 72 symulowane wywołania endpointu, 24 dodatkowe tury, 0 błędów, 2228 kontroli wiedzy i 1325 relacji. **Brak połączeń z rzeczywistym płatnym/darmowym dostawcą AI.**
- Zbiorczy `npm run test:rc571064` przekroczył dostępny limit wykonania po ukończeniu testów zapisów; nie jest przedstawiany jako zaliczony w jednym przebiegu. Powyższe elementy zostały zweryfikowane także osobno.

## 4. Profilowanie lokalnej wydajności i pamięci

`tools/benchmark-rc571064-runtime.py` uruchamia prawdziwą stronę w Chromium z lokalnym przechwyceniem zasobów, nie wykonuje zapytań AI. Pomiar czasu dotyczy synchronicznego `showTab` z wymuszoną aktualizacją geometrii. Po pierwszym cyklu (rozgrzewka):

| Szerokość | Przełączenia ogółem | Mediana (ms) | P95 (ms) | Błędy |
|---|---:|---:|---:|---:|
| 390 px | 120 | 32,15 | 55,3 | 0 |
| 1366 px | 120 | 31,75 | 72,2 | 0 |
| 1920 px | 120 | 37,35 | 62,1 | 0 |

Rozszerzony stres-test 1366 px: **360 przełączeń, mediana 33,35 ms, P95 78,6 ms, 0 błędów**. Liczba słuchaczy po pierwszym cyklu: **676**, bez dalszego wzrostu. Zbierane po GC zużycie sterty JS: około **4,77 MB przed aktywacją**, **5,98 MB po 12 cyklach** oraz **6,11 MB po 36 cyklach**. Węzły DOM oscylowały zgodnie z odświeżaną zakładką, zamiast rosnąć monotonicznie. To zgodne z jednorazowym dogrzewaniem pamięci, ale **nie dowodzi braku wycieku podczas wielogodzinnego używania**; pamięć natywna przeglądarki nie była mierzona.

**Interpretacja:** wyeliminowano konkretną pracę DOM podczas bezczynności. Nie wykazano, by samo przełączanie zakładek lub całe ładowanie strony stało się szybsze; porównania czasów między próbami są wrażliwe na warunki wykonania. Zakładki `interview`, `inspection12`, `notebook` i `deduction` pozostają relatywnie kosztowne i wymagają odrębnych profili CPU przed większą przebudową.

## 5. Ograniczenia i zalecenia wdrożenia

- Nie zmierzono rzeczywistych FCP/LCP/INP, opóźnień CDN, trwałego cache ani obciążenia Vercel Preview.
- Nie przetestowano faktycznych dostawców AI i ich kluczy ani współdzielonej kolejki Supabase.
- Nie przeprowadzono sesji wielogodzinnej ani przeglądarkowego testu na rzeczywistym telefonie. Profilowanie obejmowało lokalny headless Chromium.
- Stara wersja projektu RC57.10.63 pozostaje bezpieczną opcją powrotu.

Wdrożyć **najpierw na Vercel Preview**, sprawdzić odpowiedzi HTTP 200 dla HTML/CSS/obu JS, prawidłowy cache, wszystkie zakładki i zapis. Wykonać kilkunastominutowe testowanie prawdziwego przesłuchania AI, a następnie zmierzyć INP, LCP i pamięć w DevTools oraz na urządzeniu mobilnym. Nie zastępować produkcji bez tej akceptacji.

## 6. Materiały pomiarowe

`QA-RC571064/memory-idle-regression.json`, `browser-parity-vs-rc63.json`, `browser-smoke.json`, `runtime-benchmark.json`, `runtime-benchmark-36-cycles.json`. Zrzuty obrazów porównawczych nie są wymagane w produkcyjnej paczce ZIP; raport zawiera liczby.
