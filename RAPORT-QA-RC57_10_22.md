# RC57.10.22 — zgodność z wizualizacją Akta Śledcze

## Dlaczego ta poprawka

Dotychczasowy zrzut RC57.10.21 nie odwzorowywał zatwierdzonej makiety: protokół i pole pytania były za nisko, panel świadka miał inne proporcje, a widok był nadmiernie długi. Rozwiązanie w RC57.10.22 przywraca kompozycję głównej sceny z zachowaniem rzeczywistych elementów gry.

## Zmiany

- Trzykolumnowe przesłuchanie: duży portret i stan świadka nad protokołem, narzędzia po lewej od rozmowy, pełna lista sześciu świadków po prawej.
- Zmniejszony pionowy obszar zajmowany przez zdublowane wskazówki i narzędzia; pole pytania umieszczone tuż pod protokołem.
- Istniejący panel taktyk/przerw przeniesiony do dostępnej rozwijanej sekcji — jego elementy i nasłuchiwanie zdarzeń pozostają zachowane.
- Poprawione nagłówki, ramki, odstępy, kolory papieru i obramowanie portretów. Lista sześciu świadków jest bardziej kompaktowa.
- Na telefonach pozostaje obecna dwuzakładkowa nawigacja świadka/rozmowy i pełny formularz własnego pytania.
- W projekcie nadal występują autentyczne postacie i fakty: Lena Rudnicka, tramwaj TW-217, Marek Nowicki, Tomasz Krawczyk, Janusz Wójcik, Elżbieta Zięba, Kamil Brzozowski, Magdalena Kaczmarek. Nie przeniesiono autobusów, fikcyjnych danych ani gotowych pytań z makiety.

## Testy zaliczone lokalnie

- `npm run check`: komplet statycznych kontroli, kanon i rejestr dowodów zgodne.
- `node tools/test-rc57-whole-game.mjs`: 380 kontroli zasad gry.
- `node tools/test-rc57-playthrough.mjs`: 580 działań gracza w 3 przejściach.
- `node tools/test-rc571013-negations.mjs`: 600/600, w tym 60/60 negacji.
- `node tools/test-rc571014-excluded-focus.mjs`: kontrola wykluczonych tematów.
- `node tools/test-rc571011-natural-interview.mjs`: sześć głosów i reguły pamięci.
- `python tools/test-saves.py`: zapisy, import/eksport, migracje i rollback.
- `python tools/test-navigation.py`: 320, 390, 768, 1440 px.
- `python tools/test-rc571016-single-behavior-panel.py`: brak powielonych wskaźników, sześć świadków, animacje; stary test dostosowano do nowego układu, gdzie zdjęcie jest po lewej.
- `python tools/test-rc571022-reference-layout.py`: 320, 390, 768, 1440, 1920 px bez poziomego przewijania; jeden formularz i jeden zestaw wskaźników; narzędzia dostępne po rozwinięciu.

## Ograniczenia

To implementacja funkcjonalnego interfejsu wzorowanego na makiecie, nie idealna kopia obrazu piksel po pikselu. Lokalne testy nie potwierdzają działania rzeczywistych serwisów Apinex/Vercel/Supabase ani wszystkich możliwych stanów gry. Screenshoty lokalne mają osobno osadzone zdjęcia, ponieważ izolowana przeglądarka blokuje żądania do lokalnych adresów, ale same pliki portretów znajdują się w `assets/portraits/`.

Przed publikacją wdrożyć na Vercel Preview i sprawdzić renderowanie pełnych rozmów, zmianę świadka, przerwę, wybór dowodu, błędy AI oraz przywracanie zapisów.
