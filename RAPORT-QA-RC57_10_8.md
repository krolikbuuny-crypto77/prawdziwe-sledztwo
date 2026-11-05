# Raport QA RC57.10.8 — naturalność i diagnostyka żądań

**Źródło:** pełny ZIP RC57.10.7 z Biblioteki projektu. **Wynik:** zmodyfikowana pełna paczka oraz aktualizacja siedmiu plików do RC57.10.8.

## Diagnoza
W przykładach 5/18 `pass` poświadczono wstępną poprawność faktów, lecz Marek powtarzał charakterystyczne sformułowania o pamięci i rejestrach, a Tomasz użył nienaturalnego określenia o „godzinach w jednym wpisie”. Przy 6 wstrzymanych próbach nie udostępniono surowych kodów, więc ich rzeczywistej przyczyny **nie ustalono**. RC57.10.7 już zachowywała postęp i raportowała fazę błędu; RC57.10.8 rozszerza klasyfikację błędów, ale nie obiecuje zniesienia ograniczeń Apinex.

## Poprawki
- `lib/interview-style-cue-rc57108.js` (nowy): lista fraz z poprzednich wypowiedzi świadka, tylko wskazówka stylistyczna; nic z tekstu gracza nie jest wstrzykiwane do listy.
- `lib/interview-naturalness-rc28.js`: wskazówka podawana w produkcyjnym payloadzie; dodatkowe odrzucanie nielogicznej frazy „całe wcześniejsze godziny nie mieszczą mi się w jednym wpisie”.
- `lib/interview-prompt-rc57106.js`: bardziej bezpośrednie odpowiedzi na aktualną intencję, bez powtarzania alibi i urzędowych wywodów.
- `lib/admin-rc57-claim-audit.js`: `stock_phrase_repetition` w wynikach jakościowych, bez tworzenia fikcyjnego błędu faktów.
- `lib/admin-rc57-live.js`: bezpieczne kody `provider_model_unavailable`, `provider_invalid_request`, `provider_quota_exhausted` plus dotychczasowe 429/timeout; rozróżnienie limitów dziennych (brak ponowienia) i przejściowych.
- `lib/admin-rc57-ui.js`: komunikat o tym, kiedy wznowienie bez zmiany konfiguracji nie ma sensu; wersja raportu RC57.10.8.
- `tools/test-rc57108-naturalness-quota.mjs`: testy tego, że wskazówka stylu trafia także do produkcyjnego, skróconego payloadu; testy kodów HTTP/limitów i zachowania offsetu.

## Lokalnie zakończone testy (bez prawdziwego API)
- `npm run check` — PASS.
- `npm run build` — PASS.
- `node tools/test-rc57108-naturalness-quota.mjs` — PASS.
- `node tools/test-rc57107-pauses.mjs` — PASS.
- `node tools/test-rc57106-unified-prompt.mjs` — PASS, 24 przypadki świadków.
- `node tools/test-rc57103-preacceptance.mjs` — PASS.
- `node tools/test-rc57105-performance.mjs` — PASS, 300 lokalnych scenariuszy, **zero** zdalnych zapytań.
- `node tools/test-rc57-quality.mjs` — PASS.
- `node tools/test-rc5710-traffic.mjs` i `node tools/test-rc5710-quota.mjs` — PASS, testy izolowane z mockiem Supabase.
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań fabularnych.
- `python tools/test-saves.py` — PASS (migracje, suma kontrolna, autosave).
- `python tools/test-rc57107-pauses-browser.py` — PASS, 390 i 1440 px, wznowienia 20/40/80 s.
- `python tools/test-rc57-quality-browser.py` — PASS, 390 i 1440 px.

## Czego NIE potwierdzono
Nie mierzono realnego opóźnienia Apinex, nie oceniono 18 prawdziwych odpowiedzi po aktualizacji i nie znamy konkretnych kodów 6 przerw z oryginalnego raportu. `pass` dotyczy testów lokalnych i syntetycznego ruchu. Naturalność odpowiedzi zdalnego modelu nadal wymaga oceny człowieka. Wersja nie wykonuje automatycznych ponowień, nie omija limitów i nie zmienia danych Supabase.
