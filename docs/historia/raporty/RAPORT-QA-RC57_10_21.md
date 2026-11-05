# RC57.10.21 — wdrożenie interfejsu i pakiet przedpremierowy

## Zakres

1. **Naturalne przesłuchania**: jedna centralna instrukcja AI wzmacnia reagowanie na ostatnie pytanie, pamięć zatwierdzonych wypowiedzi i zróżnicowanie tonu sześciu świadków. Nie zmienia faktów, modelu, API ani reguł odblokowań. Działanie z prawdziwym Apinex nadal niepotwierdzone.
2. **Filmowa oprawa**: zmodernizowana papierowa stylistyka istniejących, regułowo odblokowywanych przełomów oraz ekranu ładowania. Nie dodano nowych wydarzeń ani zagadek.
3. **Kontrola premierowa**: lokalne testy przesłuchań, negacji, reguł i przebiegu gry; test zapisu, integralność źródeł i obrazu. Wdrożenie Vercel i Supabase nie było wykonywane.
4. **Zgodność z zatwierdzoną makietą**: prawa fotokartoteka, portret i jeden panel zachowania, protokół przesłuchania i własne pytanie. Dotychczasowe trzy podejścia oraz możliwość okazania dowodu przeniesiono do pomocniczej kolumny, bez kopiowania mechanik i gotowych pytań z obrazka. Nazwy i fakty pozostają zgodne z Leną Rudnicką i zajezdnią TW-217.
5. **Mobilnie**: lista świadków przewijana poziomo, portret widoczny domyślnie z możliwością zwinięcia, pytanie bezpośrednio pod protokołem.

## Wyniki potwierdzone lokalnie

- `npm run build`, `npm run check` — PASS, 61 sekcji JS, 64 źródła CSS, 81 WebP, 9 MP3.
- `node tools/test-rc571011-natural-interview.mjs` — PASS.
- `node tools/test-rc571013-negations.mjs` — PASS 600/600, negacje 60/60.
- `node tools/test-rc571014-excluded-focus.mjs` — PASS.
- `node tools/test-rc57-whole-game.mjs` — PASS 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — PASS 580 działań, trzy symulowane kompletne przejścia.
- `node tools/test-rc571018-ui.mjs` — PASS.
- `python tools/test-rc571021-ui.py` — PASS 390 i 1440 px, bez poziomego przepełnienia i błędów JS, po jednym polu pytania i przycisku.
- `python tools/test-package621.py` — PASS trzy rozdzielczości, nienaruszone odblokowania przełomów.
- `python tools/test-saves.py` — PASS, eksport/import, migracje, autosave, checksum i rollback.

## Ograniczenia

Nie ukończono pełnej, wielomodułowej sesji Chromium 50 widoków — test pierwotny przekroczył limit czasu. Zamiast deklarować zaliczenie tego testu, przeprowadzono krótsze testy kluczowego widoku 390 i 1440 px. Brak rzeczywistego testu na Vercel Preview i Apinex/Supabase: nie należy jeszcze nazywać tej wersji produkcyjnie zweryfikowaną.
