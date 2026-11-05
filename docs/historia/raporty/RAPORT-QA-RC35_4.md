# RC35.4 — raport testów

Wykryta usterka: niepoprawna próba parsowania JSON po skutecznym POST PostgREST z pustym HTTP 201 Created w `lib/server-state.js`.

Naprawa:
- `response.text()` po odpowiedziach HTTP 2xx; brak treści → `null` bez parsowania; treść → JSON.
- W teście `tools/test-rc35-coop.mjs` atrapa Supabase odpowiada HTTP 201 bez treści na każde nowe `ps_game_sessions` (przed poprawką test nie przechodzi).
- `/api/coop`: bezpieczne rozróżnianie etapów: wczytanie sesji, utworzenie wspólnej sesji, commit i zapis pokoju; lepsze komunikaty przy brakującym SQL. Nie ujawnia kluczy ani danych zapisu.

PASS: `npm run build`, `npm run check`, `node tools/test-rc35-coop.mjs`, `node tools/test-rc351-chat.mjs`, `python tools/test-rc35-browser.py`, `python tools/test-rc351-chat-browser.py`, `python tools/test-navigation.py` (320, 390, 768, 1440 px).

Bez zmian: dostawcy AI, Supabase schema, migracje SQL 001–005, memoria 40 par rozmów, czat między graczami, układ RC35.3.

Brak testu z prawdziwymi kluczami Vercel i produkcyjną bazą Supabase. Wcześniejszy komunikat mógł mieć inne dodatkowe przyczyny; po RC35.4 możliwe jest odczytanie bezpieczniejszych wskazówek diagnostycznych.
