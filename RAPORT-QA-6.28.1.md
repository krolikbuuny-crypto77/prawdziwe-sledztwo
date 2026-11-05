# Kontrola powtórna — wersja 6.28.1 (30.10.2026)

## Wynik

Wykryto i poprawiono jeden nowy błąd w wersji 6.28: w `src/integrations/35-zai-client.js` nieudana odpowiedź `/api/interview` (np. 429, 503, 404) najpierw ustawia `fallbackReason: backend_http_<status>`, a następnie drugi krok asynchroniczny nadpisuje przyczynę na `unsupported_response`. W 6.28.1 zachowywany jest rzeczywisty status błędu. Nie zmieniono treści zeznań, zatwierdzonych faktów ani backendu.

## Dodatkowy test regresyjny

`python tools/test-diagnostic-http6281.py` uruchamia przeglądarkę Chromium i symuluje HTTP 429, 503, 404. Wszystkie trzy przypadki przeszły test zachowania przyczyny fallbacku, zgodności zeznania z pamięcią i eksportu JSON.

## Powtórzone testy

- `npm run check` — PASS, manifest, zasoby, JS, kanon.
- `python tools/test-quality628.py` — PASS, oględziny, liczniki, wznowienie, pamięć Marka.
- `node tools/test-api627.mjs` i `python tools/test-diagnostics627.py` — PASS, dostawca, model, fallback, identyfikator, czas, eksport.
- `node tools/test-interview626.mjs`, `python tools/test-quality626.py` — PASS, alibi, zgłoszenie alarmu, zeznania, pamięć.
- `node tools/test-security624.mjs`, `node tools/test-state618.mjs`, `node tools/test-sync617.mjs` — PASS, kanon i walidacja postępu.
- `python tools/test-navigation.py`, `python tools/smoke.py` — PASS na podstawie powtórnego przebiegu oryginalnego pakietu 6.28 przed tą zmianą diagnostyki.

## Ograniczenia

Produkcyjny adres Vercel nie był osiągalny z narzędzi testowych; testy korzystają z lokalnej kopii gry i symulowanych odpowiedzi API, nie potwierdzają aktywnych kluczy ani obecności modelu w rzeczywistym wdrożeniu. Rozszerzony historyczny skrypt `test-saves.py` nie zakończył się w krótkim limicie czasu w trakcie kontroli; jego brak wyniku nie stanowi potwierdzenia awarii ani sukcesu. Wdrożenie produkcyjne pozostawiono bez zmian.
