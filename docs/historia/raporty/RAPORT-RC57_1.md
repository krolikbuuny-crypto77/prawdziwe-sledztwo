# QA RC57.1 — 2026-11-01

Punkt wyjścia RC57 Hobby bez Gemini: 540 zaliczone / 42 ostrzeżenia / 18 błędów.

Przyczyna: skrócony wzorzec sprostowań dopuszczał tylko kilka nazw tematów, a wzorzec nacisku miał granicę słowa bezpośrednio po rdzeniu, co wykluczało polskie końcówki fleksyjne. Reguła była współdzielona przez sześciu świadków.

Po naprawie:
- `node tools/test-rc57-corrections-pressure.mjs` — PASS 600/600, dodatkowe przypadki negacji i zarzutów.
- `node tools/test-rc57.mjs` — PASS 600/600, zero zewnętrznych żądań.
- `node tools/test-rc50.mjs`, `node tools/test-rc57-hobby.mjs`, `node tools/test-rc52.mjs`, `node tools/test-rc33-models.mjs`, `node tools/test-rc35-coop.mjs` — PASS.
- `python tools/test-saves.py` — PASS, SHA-256, import/eksport i migracje.
- `npm run check`, `npm run build` — PASS.
- Liczba `api/*.js`: 12.

Bez zmian: UI gry, reguły kanonu, dowody, werdykt, modele AI i Supabase. Nie testowano produkcyjnego Vercel ani rzeczywistej odpowiedzi modelu.
