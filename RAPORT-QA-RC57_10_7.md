# Prawdziwe Śledztwo — RC57.10.7: diagnostyka wstrzymań testera

## Podstawa i diagnoza
Bazą jest RC57.10.6 z uproszczonym widocznym nagłówkiem „Przesłuchania”. Z raportu użytkowniczki: 5/18 zaliczonych odpowiedzi, 0 ostrzeżeń, 0 błędów odpowiedzi, 6 wstrzymanych prób. **Nie otrzymaliśmy surowych kodów tych 6 prób**, więc nie znamy ich rzeczywistej przyczyny.

W kodzie RC57.10.6 stwierdzono:
- w `runLiveStep` błędy inne niż rozpoznane 429 i brak zatwierdzonej wypowiedzi otrzymywały zawsze `suggestedPauseSeconds=20`;
- w UI wstrzymania były liczone i eksportowane, ale lista widoczna na ekranie renderowała wyłącznie zatwierdzone odpowiedzi (`liveReport.results`), bez `blockedAttempts`;
- kolejne ręczne wznowienia tego samego pytania nie zwiększały sugerowanej przerwy;
- komunikat użytkownika nie podawał fazy wywołania ani bezpiecznego statusu HTTP.

Nie ma dowodu, że wstrzymania są wyłącznie skutkiem 429. **Przerwa 20 s sugeruje inny rozpoznany błąd lub ogólny `provider_error`, nie jest diagnostyką konkretnego dostawcy.**

## Zmiany
1. `lib/admin-rc57-live.js`: ustrukturyzowana, allowlistowana diagnostyka `failureDiagnostics` (`code`, `phase`, `upstreamStatus`, `retryAfterSeconds`, `quotaKind`, `requestDispatched`, `providerCalls`, `rejectedChecks`). Brak surowych komunikatów z upstream, promptów i sekretów. Istniejące `retryOffset` i podpisany token historii pozostają bez zmian. Dla 429 uwzględniany `Retry-After` (maks. 300 s).
2. `lib/admin-rc57-ui.js`: wstrzymane próby są widoczne pod zaliczonymi odpowiedziami, z kodem i fazą błędu. Sugerowany manualny cooldown dla ponowień tego samego pytania rośnie 20/40/80/160 s (z ograniczeniem do 300 s). Brak automatycznych ponowień. Testy nadal maks. 7 pytań/min na kartę.
3. Zmiany tylko w testerze administratora — nie w silniku dialogów ani w regułach gry. Ostrzeżenia jakości i kontrola semantyczna pozostają aktywne.

## Zweryfikowane lokalnie
- `npm run check` — PASS.
- `npm run build` — PASS.
- `node tools/test-rc57107-pauses.mjs` — PASS: timeout semantyczny, 429 z Retry-After=145 s, bezpieczne pola diagnostyczne, zachowanie offsetu oraz przyjęcie poprawnej odpowiedzi.
- `python tools/test-rc57107-pauses-browser.py` — PASS na 390 i 1440 px; 3 kolejne wstrzymania tego samego pytania, przerwy 20/40/80 s, brak błędnych zaliczeń, identyczny token, eksport JSON.
- `python tools/test-rc57-quality-browser.py` — PASS na 390 i 1440 px; starszy test dopasowany do nowego tekstu UI.
- `node tools/test-rc57104-reports.mjs` — PASS.
- `node tools/test-rc57103-preacceptance.mjs` — PASS.
- `node tools/test-rc57-whole-game.mjs` — PASS (380 kontroli).
- `node tools/test-rc57-playthrough.mjs` — PASS (580 działań logicznych).
- `node tools/test-rc5710-traffic.mjs`, `node tools/test-rc5710-quota.mjs` — PASS (limity i mock Supabase).
- `python tools/test-saves.py` — PASS.
- `node tools/test-rc57105-performance.mjs` — PASS (lokalny benchmark 300 przypadków; bez realnego API).
- W katalogu `api/` pozostaje 12 funkcji JS zgodnych z Hobby.

## Granice pewności
- Bez wyeksportowanego raportu zawierającego kody 6 oryginalnych wstrzymań nie da się wskazać, czy było to 429, timeout, 5xx lub nieudana weryfikacja.
- Nie wykonano prawdziwych zapytań do Apinex ani testu mediany/p95 na tym dostawcy.
- 5/5 `pass` oznacza zaliczenie walidatorów, a nie doskonałą naturalność: w odpowiedziach Marka nadal są powtórzenia („nie odtwarzam kolejności”, „rejestr wejść”). Ten patch celowo nie zwiększa liczby rewrite, aby nie pogłębiać problemów z limitami.
- Nie testowano rzeczywistego Supabase produkcyjnego; zapisy nie były modyfikowane.
