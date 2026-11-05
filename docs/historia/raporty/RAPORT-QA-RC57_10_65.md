# Prawdziwe Śledztwo — raport RC57.10.65: ograniczenie zbędnych renderów

**Baza:** kompletna RC57.10.64. **Data:** 5 listopada 2026 r. **Status:** lokalne testy pozytywne; nie wdrożono na Vercel.

## 1. Zakres implementacji

Zredukowano operacje przebudowy DOM przy powtarzanym wejściu do trzech sekcji bez zmiany danych:

- **Przesłuchania:** nie tworzy się ponownie całej listy sześciu świadków i portretów SVG, jeżeli aktywny świadek, stany emocji/relacji, statusy rozmów i rola ostatnich wiadomości pozostają identyczne. Identyfikatory gradientów SVG są generowane tylko przy rzeczywistej przebudowie. Selector dowodów i karty okazania są aktualizowane tylko po zmianie HTML. Wszelkie zmiany danych świadków nadal unieważniają ten stan.
- **Oględziny:** bez zbędnej przebudowy list pomieszczeń, pinezek, metryk i planu przy ponownym otwarciu bez zmian. Dotychczasowe dwa renderery listy punktów miały konflikty właścicielstwa: bazowy renderer nadpisywał wynik rozszerzonego, a rozszerzony przywracał go natychmiast. Teraz po uruchomieniu modułu rozszerzonego tylko on zarządza docelową listą. W razie braku modułu rozszerzonego działa dotychczasowy wariant bazowy.
- **Dedukcja:** pominięcie identycznych przebudów listy dostępnych źródeł, kart dedukcyjnych i metryk; przyciski i obsługa zdarzeń ponownie wiążą się wyłącznie po wymianie elementów. Rozwinięte `<details>` źródeł mogą pozostać otwarte przy powrocie na zakładkę.

Funkcja `psRenderMarkup` porównuje generowany markup z ostatnio wstawionym i sprawdza tożsamość pierwszego węzła oraz liczbę bezpośrednich potomków, aby wychwycić zewnętrzną wymianę hosta. Nie zapisuje reguł śledztwa ani wyników AI i nie zmienia stanu gry. Użyto jednego kontrolera nawigacji; nie dodawano drugiego.

**Niezmienione:** CSS, fabuła, dowody i blokady, postęp, format zapisu, API, Supabase, dostawcy AI, finał. Przy zapisie i przy wymuszonej zmianie danych renderery nadal aktualizują elementy.

## 2. Mierzalny efekt — powtarzalne wejścia do sekcji

Test wykonał po **18 przełączeń** ze strony Pulpitu do każdej z trzech zakładek bez zmian w stanie gry; `MutationObserver` zliczał rekordy `childList` w dokładnie wskazanych hostach UI. Pomiar oddzielnie przy 390, 1366 i 1920 px.

| Sekcja i monitorowane hosty | Przed (na jedną szerokość) | Po (na jedną szerokość) |
|---|---:|---:|
| Przesłuchania — `characterList`, `attachedDoc`, `ps23EvidenceCards` | 54 | **0** |
| Oględziny — `scRooms`, `scPins`, `scHotspots`, `scMetrics`, `scBlueprintBase` | 90 | **0** |
| Dedukcja — `dedSourceList`, `dedBoard`, `dedMetrics` | 54 | **0** |

Łącznie w monitorowanych hostach przy 3 szerokościach: **594 → 0** rekordów `MutationObserver` w tym scenariuszu. **Nie oznacza to zerowych mutacji całej strony** — pozostałe moduły nadal celowo aktualizują inne obszary. Wyniki dokumentuje `QA-RC571065/dom-comparison-summary.json` wraz z osobnymi surowymi testami. Czasy pojedynczych prób zależą od obciążenia systemu; wynik nie stanowi gwarantowanego wzrostu FPS ani skrócenia ładowania na Vercel.

## 3. Regresja funkcjonalna i wizualna

- `npm run build`, `npm run check` — **PASS**: 61 skryptów, 64 części CSS, 81 WebP + 9 MP3, integracje, zgodność manifestów i odtwarzalność.
- `tools/test-rc571065-render.py` — **PASS** dla 390, 1366 i 1920 px: brak zbędnych mutacji badanych hostów i prawidłowe interakcje po trafieniu w cache. Sprawdzono zmianę statusu innego świadka po nowym pytaniu, wybór świadka, udostępnienie nowego dowodu, zachowanie wyboru dowodu, nawigację pomieszczeń, wyszukiwanie i reset filtrów dedukcji.
- `tools/test-rc571065-browser.py --baseline /ścieżka/do/RC57.10.64` — **PASS**: 60/60 kontroli zakładek, 30/30 zgodnych zestawień obliczonych stylów i geometrii przy 390, 1366, 1920 px, 0 błędów JS. Porównanie normalizuje wyłącznie numery seryjne identyfikatorów gradientów SVG, które zależą od liczby wcześniejszych odtworzeń. Nie normalizuje widocznych kolorów, rozmiarów, położenia ani innego HTML. **8/9 zrzutów pikselowo identycznych**, dziewiąty (Laboratorium, 1920 px) różni się 4 pikselami bez różnic stylów; różnica mieści się w progu tolerancji rasteryzacji. Nie należy opisywać całej serii jako 9/9 identycznej.
- `python tools/test-saves.py` — **PASS**: checksum, eksport, import, autosave, reset, rollback, migracje v1–v11.
- `python tools/test-navigation.py` — **PASS**: 10 kliknięć na każdej szerokości 320/390/768/1440 px, ARIA, blokady finału i brak błędów JS.
- `npm run test:rc58` — **PASS**: 72 wywołania lokalnego endpointu z mockowaną usługą Supabase, 24 dodatkowe tury, 0 błędów, 2228 kontroli wyszukiwania wiedzy i 1325 relacji. **Nie przetestowano zewnętrznych API AI.**
- `tools/benchmark-rc571064-runtime.py --cycles 6 --widths 1366` — **PASS**: 60 przełączeń, 0 błędów, mediana lokalna 35,1 ms, P95 86,7 ms, sterta JS po GC 4,87 → 5,73 MB. Krótki test nie dowodzi braku wycieków i nie wystarcza do przypisania zmianie konkretnego przyspieszenia.

## 4. Ograniczenia i ryzyka

1. Pomiar używa lokalnego headless Chromium z przechwyceniem zasobów i zablokowanym ruchem na zewnątrz; nie jest pomiarem CDN/Vercel ani prawdziwego urządzenia mobilnego.
2. Cache porównuje reprezentację HTML i podpis stanu świadka; dalsze dodawanie dynamicznych pól do portretów wymaga aktualizacji podpisu. Testy w `tools/test-rc571065-render.py` sprawdzają obecne pola i aktualizacje.
3. Pamięć sterty JavaScript zmierzono po wymuszonym GC; nie mierzono pamięci natywnej, INP ani wielogodzinnej sesji.
4. Wynik 0 mutacji dotyczy tylko zdefiniowanych, niezmienionych hostów przy powtarzanych wejściach. Interakcje zmieniające dane nadal mogą prawidłowo przebudowywać DOM.

## 5. Wdrożenie

Wgrać najpierw pełną RC57.10.65 na **Vercel Preview**. `index.html` i trzy pliki `ps-*` muszą pochodzić z tego samego builda. Sprawdzić 200 na HTML/CSS/JS, nagłówki cache, wszystkie zakładki, kilkanaście minut realnego przesłuchania oraz eksport/import zapisu. Zmiany nie dodają migracji Supabase ani wymagania dodatkowych kluczy. W razie problemu przywrócić RC57.10.64. Nie zastępować produkcji bez ręcznej akceptacji Preview.

## 6. Pomiary źródłowe

`QA-RC571065/dom-comparison-summary.json`, `render-final-390.json`, `render-smoke-desktop.json`, `browser-parity-vs-rc64.json`, `runtime-6cycles-1366.json`. Zrzuty nie powiększają wydania ZIP, lecz są dostępne w lokalnym środowisku testowym.
