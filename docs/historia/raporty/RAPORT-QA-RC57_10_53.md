# Raport QA RC57.10.53 — trzy błędy wizualne

## Reprodukcja w bazowej RC57.10.52
Przy 1366×768 Chromium wykazał:
- `#nav`: stałe `height=490px`, `scrollHeight=597px`, `overflow:hidden`; ostatnie dwie pozycje wypadały pod panelem postępu.
- `#characterList::before`: `height=44px`, nagłówek „Świadkowie w sprawie (6)” zawijał się do dwóch wierszy, a tekst zderzał się z kartami.
- Skróty `#overview .ps38-actions-list button small`: obliczony kolor `rgb(89,64,46)` na ciemnym tle i 12px tekstu.

## Zmiany
1. Menu z automatyczną wysokością i rzeczywistą liczbą wierszy; w razie braku miejsca przewija się cały panel boczny. Nie ma obciętych zakładek.
2. Tytuł „Świadkowie (6)” w osobnym, niezapadającym się wierszu o minimalnej wysokości 52px.
3. Opisy skrótów w kolorze `#f5dfbb`, z fontem 14px i większą wysokością przycisków.

## Testy wykonane
- `npm run build`: PASS.
- `npm run check`: PASS (budowa, integralność, audyt kontrolerów i kanonu).
- `tools/test-rc571053-visual.py` uruchomiony osobno dla 1366×768 i 1536×864: 17/17 na każdej szerokości (z zachowaniem stanu śledztwa i zerem błędów JS). Przy 390×844 i 768×1024: 4/4 każdorazowo (bez kolizji strony, wszystkie karty akcji).
- `node tools/test-rc57.mjs`: PASS, 600 przypadków deterministycznych.
- `node tools/test-rc571048-retrieval.mjs`: PASS, 2228 kontroli AI.
- `python tools/test-saves.py`: PASS (migracje, eksport/import, autosave, reset).
- Zrzuty z lokalnego Chromium: menu, lista świadków, skróty „Najbliższe działania”, pulpity 1366 i 1536.
- Pełna paczka i aktualizacja porównane plik po pliku po spakowaniu.

## Ograniczenia
- Zbiorczy test obejmujący granicę 941px i osobny test 1024px przekroczyły limit czasu przeglądarki, więc tych wymiarów **nie uznaje się za potwierdzone** w tej iteracji.
- Brak testów na fizycznym laptopie użytkownika, w przeglądarce przy jego rzeczywistym zoomie i na Vercel.
- Nie były wykonywane produkcyjne żądania AI ani synchronizacja z Supabase.
