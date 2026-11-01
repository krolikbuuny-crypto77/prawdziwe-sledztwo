# Raport testów RC50–RC54

Testy lokalne wykonane na najnowszej paczce, bez kontaktu z produkcyjnymi usługami.

- `node tools/test-rc50.mjs` — PASS: negacja, alibi, źródła, wielowątkowość; `factBank` nietknięty.
- `node tools/test-rc51.mjs` — PASS: charakter sześciu postaci, ograniczenia stylu bez zmiany faktów.
- `node tools/test-rc52.mjs` — PASS: odwołania do własnych wypowiedzi; cudze zeznania nie są ujawniane jako wiedza postaci.
- `python tools/test-rc50-rc54-browser.py` — PASS: widoki 320, 390, 768 i 1440 px, źródła tylko odkryte, bez błędów JS, sumy SHA-256 zapisów.
- `python tools/test-rc41-auto-timeline.py` — PASS: automatyczna oś, pochodzenie, rozbieżności i zapis.
- `node tools/test-rc35-coop.mjs` — PASS: podstawowe operacje współpracy.
- `python tools/test-rc39-collab-browser.py` — PASS: dwie instancje Chromium, wspólny ekran, propozycje, sterowanie i synchronizacja.
- `node tools/test-rc33-models.mjs` — PASS: dobór modeli i fallback.
- `python tools/test-saves.py` — PASS: podpisy, zapis/odczyt, migracje.
- `python tools/test-navigation.py` — PASS: 10 widoków, 42 podłączenia, cztery rozdzielczości.
- `npm run check` — PASS: integralność źródeł i zasobów, audyt kanonu oraz dowodów.

Nie wykonano testu z rzeczywistymi odpowiedziami dostawców AI ani zapisu w produkcyjnym Supabase. RC49 pozostawiono bez zmian; w celu przywrócenia użyć kopii pierwotnej wersji.
