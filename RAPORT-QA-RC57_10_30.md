# RC57.10.30 — naprawa czytelności konfrontacji i oględzin

Data: 2026-11-02. Baza: pełny ZIP RC57.10.29.

## Zmiany w kodzie gry

- `src/styles/rc571028-unified-dossier.css`: jeden zestaw nadpisań końcowych dla panelu konfrontacji przesłuchań (`#ps43Confrontation`), nawigatora rozpoznawania punktów i dokumentacji fotograficznej (`#ov36Navigation`), kart fotografii/dokumentów, napisów, statusów, pól wyboru oraz mobilnych odstępów.
- `src/inspection/03-visual-asset-bridge.js`: aktywna fotografia 4K otrzymuje `loading=eager` wyłącznie po wejściu w Oględziny. Korzysta z już istniejącego haka nawigacji (liczba haków bez zmian).
- CSS zdjęcia wewnątrz absolutnie pozycjonowanej warstwy otrzymał pełną wysokość i `object-fit:cover`, usuwając przypadek `height:0` i pustej ciemnej planszy. Pozostałe zdjęcia nadal są ładowane z odroczeniem.
- `index.html` został ponownie wygenerowany ze źródeł; manifest build został przeliczony. Zawartość śledztwa, dowody i API pozostały nienaruszone.

## Potwierdzone testy lokalne

- `npm run build` + `npm run check`: PASS, 61 sekcji JS, 64 sekcje CSS; integralność zasobów, kanon świadków i rejestr dowodów.
- `python tools/test-navigation.py`: PASS, 10 modułów na 320/390/768/1440 px, 42 hooki.
- `node tools/test-rc57-whole-game.mjs`: PASS, 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs`: PASS, 580 działań śledczych w 3 symulowanych przebiegach.
- `node tools/test-rc571013-negations.mjs`: PASS, 600/600 testów (60/60 negacji).
- `python tools/test-saves.py`: PASS, zapis, import, migracje i rollback.
- Test Chromium wszystkich 10 zakładek na 390/768/1440 px: 30/30, bez poziomego overflow i utraty aktywnych sekcji.
- Test Chromium trzech rozmiarów dla konfrontacji, nawigatora dokumentacji i aktywnej fotografii: 9/9 PASS; obraz o natywnej szerokości 3840px widoczny na telefonie/tablecie/komputerze.

## Ograniczenia

Nie wykonano rozmów przez prawdziwy Apinex ani zapisu do produkcyjnego Supabase, a także pełnego audytu wszystkich możliwych stanów gry. Nie oznacza to zweryfikowanej produkcji Vercel. Aktualizacja jest przeznaczona najpierw na Vercel Preview.
