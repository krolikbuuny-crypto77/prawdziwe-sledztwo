# Prawdziwe Śledztwo 6.38 RC35.2 — poprawa układu pokoju i czatu

## Naprawiony problem

W RC35.1 przyciski „Utwórz pokój”, „Dołącz”, „Czat” i sam panel czatu były przypięte do prawego górnego rogu okna (`position:fixed`). Mogły zasłaniać menu gry, dokumenty, przesłuchania i inne elementy, szczególnie na telefonie.

W RC35.2 pasek pokoju i czat są częścią strony, bezpośrednio **pod górnym paskiem** i **nad treścią śledztwa**. Otwarcie czatu lub formularza dołączania przesuwa zawartość gry w dół zamiast ją zasłaniać. Na telefonie przyciski, pole kodu i formularz czatu dopasowują się do szerokości ekranu. Czat pozostaje zwijany przyciskiem „Czat”.

Usunięto pełnoekranową przezroczystą warstwę blokującą obserwatora, która przechwytywała również kliknięcia w czat. Dotychczasowe blokady działań obserwatora są nadal wykonywane w zdarzeniach interfejsu oraz, przede wszystkim, przez kontrolę uprawnień na serwerze.

**Uwaga:** po przewinięciu strony w dół panel czatu nie pozostaje przyklejony do ekranu — to celowe, żeby nie przesłaniał gry. Aby otworzyć czat, przewiń do góry.

## Wdrożenie

- Jeżeli masz już źródła RC35.1, wypakuj `Prawdziwe_Sledztwo_6_38_RC35_2_POPRAWKA_DO_RC35_1_UKLAD.zip` do repozytorium i zastąp pliki w tych samych ścieżkach.
- Jeżeli dopiero wdrażasz kooperację, użyj pełnego `Prawdziwe_Sledztwo_6_38_RC35_2_PELNA_WERSJA_CZAT_BEZ_ZASLANIANIA.zip` zamiast RC35.1.
- W przypadku pracy z kodem źródłowym uruchom `npm run build`, a następnie opublikuj zmiany na GitHub/Vercel. Pełny ZIP zawiera już wygenerowany `index.html`.
- W przeglądarce wykonaj `Ctrl+Shift+R`.
- Dla pokoi i czatu nadal wymagane są **te same migracje** `supabase/004_coop_rooms.sql` i `supabase/005_coop_chat.sql`. RC35.2 nie wymaga nowego SQL, tabel ani kluczy.

## Przeprowadzone testy

- `npm run build` i `npm run check`: PASS.
- `node tools/test-rc35-coop.mjs` i `node tools/test-rc351-chat.mjs`: PASS.
- `python tools/test-rc35-browser.py` i `python tools/test-rc351-chat-browser.py`: PASS.
- `python tools/test-rc352-layout.py`: PASS — 320, 375, 390, 768, 1024 i 1440 px; brak zasłaniania treści przez formularz dołączania i otwarty czat.
- `python tools/test-navigation.py`: PASS dla 320, 390, 768 i 1440 px.
- Pełne `python tools/test-saves.py` nie zakończyło się w limicie czasu środowiska; nie potwierdzono tego testu.

Bezpośrednich testów z produkcyjnym Vercel i Supabase jeszcze nie wykonano. Nie zmieniano logiki AI, postępu ani migracji SQL.
