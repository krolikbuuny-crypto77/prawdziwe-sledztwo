# Raport QA — Prawdziwe Śledztwo 6.36 / AI-required

**Podstawa:** 6.36 Etapy I–IV.

## Wprowadzone zmiany

1. Z.ai → Groq pozostają jedyną ścieżką generowania swobodnych odpowiedzi, bez automatycznego podstawiania lokalnego tekstu po wyczerpaniu czasu.
2. Budżet czasu wzrósł z 17,5 s do 46 s; okno głównego modelu wzrosło z 10 s do 25 s.
3. Serwer po dwóch nieudanych próbach zwraca HTTP 503 i **nie zapisuje** lokalnego zeznania do historii Supabase.
4. Przeglądarka przy błędzie przywraca pytanie, usuwa prowizoryczną odpowiedź i jej zapisy pamięci 6.5/6.8.
5. Połączenie offline, brak zatwierdzenia dowodu i niepoprawna odpowiedź API nie zamieniają się w wypowiedź świadka.
6. Vercel: funkcja `api/interview.js` ma `maxDuration=60s`; w przeglądarce limit zapytania wynosi 54 s.

## Weryfikacja

- `npm run build`, `npm run check`: **PASS**.
- `node tools/test-ai-required637.mjs`: **PASS** — 503 bez lokalnego zeznania, awaria Z.ai → poprawna odpowiedź Groq, granice czasu.
- `python tools/test-ai-required-browser637.py`: **PASS** — HTTP 503, tekst pytania zostaje, brak wpisu lokalnego w 6.5/6.8 oraz w widocznym dialogu.
- `python tools/test-cloud-evidence635.py`: **PASS** — serwerowa odpowiedź Z.ai przy okazaniu `VIS-02`.
- `node tools/test-stage2-636.mjs`, `node tools/test-stage3-636.mjs`: **PASS** — autoryzacja 78 materiałów, konwencja wspólnego budżetu.
- Testy dawnego trybu (flagą `PS_INTERVIEW_AI_ONLY=false`): `test-api627`, `test-api617`, `test:api629`: **PASS** jako kompatybilność, **nie** jako potwierdzenie nowego trybu.
- Część pełnego zestawu Etapu IV: przeglądarka 4 szerokości, SaveManager, nawigacja i sprawdzenia Etapów II/III: **PASS**; cały wieloetapowy zestaw nie ukończył się w dostępnej sesji.

## Nadal wymagane

- Test prawdziwych modeli na Vercel (czas odpowiedzi, odrzucenia, limity 429, błędy 503).
- Test na rzeczywistej bazie Supabase z opóźnioną synchronizacją i restartem przeglądarki.
- Test transakcyjnego wycofywania pomocniczych lokalnych liczników, jeśli odpowiedź AI nie dojdzie.
- Nie należy traktować `46s` jako gwarancji odpowiedzi w tym czasie. Jest to okno oczekiwania; przy niepowodzeniu wymagana jest ponowna próba, **nie fallback lokalny**.

**Nie zmieniano GitHuba, Vercel ani produkcyjnej bazy danych.**
