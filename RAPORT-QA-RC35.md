# RC35 — raport testowy / ograniczenia

Data: 2026-10-31
Bazowa paczka: `Prawdziwe_Sledztwo_6_38_RC34_1_PELNA_WERSJA_PAMIEC_40_PAR.zip`.

## Testy wykonane bez połączeń z płatnymi API

- `npm run build` / `npm run check` — PASS. 61 sekcji skryptów, 64 sekcje CSS, integralność zasobów i kompatybilność z pojedynczym kontrolerem nawigacji.
- `node tools/test-rc35-coop.mjs` — PASS: tworzenie pokoju, kod, limit dwóch osób, wspólna sesja Supabase, CAS, blokada zapisu dla obserwatora, przejęcie sterowania, blokada podczas odpowiedzi AI, wyjście i unieważnianie członkostwa.
- `python tools/test-rc35-browser.py` — PASS: dwa okna Chromium, dołączenie, wspólny wybór świadka, notatki i nawigacja, odtwarzanie widoku, zmiana operatora, ochrona przed równoległą edycją.
- `python tools/test-navigation.py` — PASS, 4 szerokości: 320 / 390 / 768 / 1440 px. Licznik hooków +1 jest zamierzoną zmianą RC35.
- `python tools/test-saves.py` — PASS, dotychczasowe zapisy i eksport JSON nadal działają.
- `node tools/test-rc341-history-40.mjs` i `node tools/test-rc34-history-sync.mjs` — PASS: pamięć 40 par, bez nadawania mocy dowodowej importowanym cytatom.
- `node tools/test-rc33-models.mjs`, `node tools/test-rc32-dialogue.mjs` — PASS: konfiguracja modeli i reguły przesłuchań bez regresji.

## Wykryta i naprawiona usterka

Zwiększenie numeru rewizji pokoju po wejściu gościa mogło spowodować konflikt 409 i zagubienie lokalnej zmiany gospodarza. Poprawka zachowuje modyfikację lokalną, pobiera nową wersję i ponawia zapis tylko wtedy, gdy gospodarz nadal ma kontrolę.

## Niewykonane testy

Nie testowano produkcyjnego Supabase, działających kluczy AI, wydajności internetowej z dwóch rzeczywistych sieci ani automatycznej aktualizacji przy utracie połączenia w trakcie 270-sekundowej odpowiedzi. Wymaga to migracji SQL 004 i wdrożenia na Vercel. Nie wysyłano żadnych zapytań do produkcyjnego serwera gry.
