# RC57.10.12 — raport zmian i lokalnych testów

## Podstawa i powód zmian
Kod źródłowy pełnej paczki RC57.10.11. W ręcznym audycie znaleziono: utratę polskich znaków przy analizie pomocniczego typu pytania; fałszywe `witness_gender_mismatch` dla jawnie przypisanego cudzego cytatu; oraz duplikaty instrukcji i profili postaci w modułach generacji.

## Zmiany w kodzie
1. `interview-style-cue-rc57108.js`: wspólny `foldQuestion` używany do wykrywania źródeł, presji, sprostowania i miejsca, przy zachowaniu pierwotnego pytania dla modelu. Klasyfikacja nie stanowi dowodu.
2. `interview-gender-rc571011.js`: pomijanie przy kontroli rodzaju gramatycznego WYŁĄCZNIE form wewnątrz wyraźnie przypisanego cytatu (cudzysłowy polskie, angielskie, francuskie i ASCII). Nieprzypisane cytaty oraz forma własna nadal są kontrolowane. To kontrola heurystyczna, nie pełny analizator językowy.
3. `interview-prompt-rc57106.js`: centralne źródło tekstów instrukcji, profili wszystkich sześciu postaci, wskazówek korekty, zasad historii i legacy promptu.
4. `spoken-dialogue-623.js`, `narrative-voice-619.js`: usunięte konkurencyjne opisy sześciu postaci. Oba moduły odczytują profile z głównego modułu; walidator wypowiedzi pozostaje.
5. `dialogue-continuity-620.js`, `interview-psychology-rc37.js`, `interview-rc50.js`, `interview-rc51.js`, `interview-rc52.js`, `dialogue-threads-621.js`, `api/interview.js`: kontekst dynamiczny wykorzystuje centralny słownik instrukcji.
6. Nowy regresyjny test `tools/test-rc571012-corrections.mjs` dla 11 rodzajów pytań, 11 przykładów cytatów/form, 6 profili i integracji walidatorów.

## Testy lokalne — zaliczone
- `npm run check` — kontrola kompilacji, hooków i integralności kanonu.
- `npm run build` — produkcyjny build `index.html`.
- `node tools/test-rc571012-corrections.mjs` — nowe przypadki języka, cytatów, profili, integracji.
- `node tools/test-rc571011-natural-interview.mjs` — zachowane dotychczasowe kontrole jakości.
- `node tools/test-rc571010-testimony-recap.mjs` — poprawne podsumowania i blokowanie zmyślonych faktów.
- `node tools/test-rc57106-unified-prompt.mjs` — centralny prompt, zgodność 24 scen profilowych.
- `node tools/test-rc57-whole-game.mjs` — 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — 580 działań logicznych.
- `node tools/test-rc57107-pauses.mjs` — brak błędnego zaliczenia po timeoutach i limitach.
- `node tools/test-rc57103-preacceptance.mjs` — blokowanie błędnych szkiców.
- `node tools/test-rc57105-performance.mjs` — tylko lokalne testy przygotowania danych, bez realnych wywołań API.
- `node tools/test-rc57-quality.mjs` i `node tools/test-rc57108-naturalness-quota.mjs` — regresja jakości, limitów.
- `python tools/test-saves.py` — zapisy i odtwarzanie.
- `python tools/test-rc57107-pauses-browser.py` i `python tools/test-rc57-quality-browser.py` — mock przeglądarkowy na 390/1440 px.

## Ograniczenia
Brak testów z rzeczywistym Apinex po zmianie, więc nie można obiecać poprawy subiektywnej naturalności ani całkowitego braku HTTP 429/504. Heurystyczna kontrola cytatów dotyczy wyraźnie przypisanej mowy bezpośredniej, nie dowolnych konstrukcji polskiego języka. Nie wykonywano migracji SQL ani modyfikacji produkcyjnego Supabase. Nie zmieniano fabuły, dowodów ani mechanizmów odblokowania.
