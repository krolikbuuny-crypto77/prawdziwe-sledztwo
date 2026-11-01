# RC35.6 — Naprawa „Suma kontrolna zapisu nie zgadza się” przy współdzielonym ekranie

## Dlaczego pojawiał się błąd
W RC35.5 SaveManager prawidłowo oblicza SHA-256 z `JSON.stringify` stanu zapisu. Pokój kooperacyjny przechowywał jednak cały obiekt zapisu wewnątrz `ps_coop_rooms.frame` (kolumna PostgreSQL `jsonb`). Podczas odczytu `jsonb` może zwrócić inną kolejność kluczy obiektu. Dane nadal są te same, ale suma SHA-256 z `JSON.stringify` nie jest taka sama. To powodowało niesłuszny alarm, że zapis jest uszkodzony.

## Zmiana w RC35.6
- Pokój zapisuje wynik `JSON.stringify(SaveManager.build())` jako tekst `frame.saveJson` w JSONB. PostgreSQL nie zmienia kolejności znaków **wewnątrz wartości tekstowej**.
- Drugi gracz odczytuje i parsuje ten tekst, po czym zawsze wykonuje normalną weryfikację `SaveManager.verify()` oraz `SaveManager.apply()`. **Nie usunięto ani nie osłabiono kontroli integralności**.
- Serwer `/api/coop` przyjmuje nowy format migawki i rozpoznaje wcześniejsze formaty pokoju. Nowy format jest wysyłany podczas tworzenia pokoju i każdej synchronizacji.
- Wcześniejsze migawki zapisane przez RC35.5 jako obiekty mogą nadal nie przejść weryfikacji. Osoba sterująca z nową wersją próbuje opublikować nową migawkę; jeśli problem trwa, należy **zamknąć stary pokój i utworzyć nowy**. Wcześniej warto wyeksportować zapis gry JSON. **Nie należy ponownie podpisywać starego, niezweryfikowanego obiektu**.
- Sytuacja rzeczywistej zmiany zawartości migawki bez zmiany podpisu nadal powoduje odrzucenie. Test bezpieczeństwa obejmuje tę sytuację.

## Instalacja
1. Na istniejącym repozytorium GitHub nadpisz pliki małą poprawką RC35.6 (wyłącznie jeśli korzystasz z RC35.5) albo użyj całej paczki RC35.6.
2. Zatwierdź zmiany i sprawdź `Ready` w Vercel.
3. U obojga graczy odśwież stronę `Ctrl + Shift + R`. Jeśli został stary pokój z RC35.5, poczekaj chwilę, aż osoba sterująca opublikuje nową migawkę. Jeżeli nadal występuje problem, zapisz grę lokalnie, zamknij pokój i utwórz nowy.
4. Sprawdź widok, przejęcie sterowania, wiadomości czatu i rozmowę ze świadkiem.

**Nie ma nowych migracji SQL**, kluczy API ani zmian w limicie 40 par na świadka i 270 sekundach na odpowiedź.

## Weryfikacja
- `npm run build`
- `npm run check`
- `python tools/test-rc356-jsonb-integrity.py` — dwie przeglądarki i mock odczytu PostgreSQL `jsonb` sortujący klucze; dwie zmiany sterowania; podmiana danych z zachowaną starą sumą jest odrzucana.
- `node tools/test-rc35-coop.mjs`
- `python tools/test-rc355-bottom-handoff.py`
- `python tools/test-rc355-slow-refresh.py`
- `python tools/test-rc355-chat-browser.py`
- `python tools/test-rc355-layout.py`

Testy wykonano na symulowanej bazie/serwerze i w lokalnym Chromium. Nie przeprowadzono w tym środowisku żądań do produkcyjnej bazy Supabase ani wdrożenia Vercel.
