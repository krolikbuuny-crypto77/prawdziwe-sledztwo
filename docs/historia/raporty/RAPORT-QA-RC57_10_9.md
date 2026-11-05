# RC57.10.9 — raport lokalnych kontroli

**Baza:** pełny ZIP RC57.10.8.

## Zdiagnozowane na podstawie raportu 6/72

1. `quality:unknown`: `lib/interview-observability-636.js` nie rozpoznawał szeregu kodów `dialogue_*` generowanych przez `reviewWitnessDraft`. Zidentyfikowano i rozszerzono whitelistę.
2. AI-007: pytanie o pierwszą wypowiedź w rozmowie przechodziło przez filtry anty-powtórzeniowe jak inne pytania. Dodano **wąski wyjątek tylko dla wyraźnej prośby o przytoczenie wcześniejszych słów**. Nie oznacza to, że wszystkie pięć odrzuconych prób miało tę samą przyczynę — oryginalne szczegółowe kody zostały ukryte przez `unknown`.
3. `provider_timeout` przy `rewrite` (504): limit 2,5 s był niższy od obserwowanych czasów normalnej odpowiedzi. Zwiększono limity faz, bez dokładania dodatkowych wywołań ani usuwania audytu faktów.
4. Sztywne zwroty: dodano krótkie wskazówki zależne od aktualnego pytania; ostrzeżenie QA pozostaje aktywne.

## PASS — kontrole lokalne

- `npm run check`, `npm run build`
- `node tools/test-rc57109-live-recall.mjs` — rozpoznanie pytania o cytat, brak niepotrzebnego rewrite, ścieżka API z mock modelu i raportowanie przyczyn odrzucenia
- `node tools/test-rc57103-preacceptance.mjs`
- `node tools/test-rc57104-reports.mjs`
- `node tools/test-rc57108-naturalness-quota.mjs`
- `node tools/test-rc57107-pauses.mjs`
- `node tools/test-rc33-models.mjs`
- `node tools/test-stage1-636.mjs`
- `node tools/test-rc57-whole-game.mjs` — 380 kontroli
- `node tools/test-rc57-playthrough.mjs` — 580 działań logicznych
- `node tools/test-rc57105-performance.mjs` — 300 prób w lokalnym benchmarku; bez Apinex
- `python tools/test-saves.py` — zapisy i migracje
- `python tools/test-rc57107-pauses-browser.py` — interfejs 390 i 1440 px
- `python tools/test-rc57-quality-browser.py` — interfejs 390 i 1440 px

## Granice pewności

- Bez oryginalnego pełnego JSON z AI-007 nie da się przypisać wszystkich odrzuceń do jednej konkretnej kontroli.
- Brak rzeczywistego testu API Apinex po zmianach. Zwiększenie limitu **może** zmniejszyć liczbę lokalnych timeoutów, ale nie eliminuje błędów 504 generowanych przez dostawcę ani problemów z limitem zapytań.
- Naturalność generowanych odpowiedzi nadal zależy od modelu; nie ogłaszamy zerowej liczby ostrzeżeń.
- Nie łączono się z produkcyjnym Supabase; brak migracji SQL.
