# Raport RC57.7 — usunięcie aktywnego Z.ai i nowy model APINEX

## Źródło: raport użytkownika RC57.6 live-short

Eksport: 2026-11-01 09:40–09:40 UTC, 18 planowanych pytań, 7 ukończonych. Wynik: 5 `pass`, 1 `warning`, 1 `fail`, 1 `blocked` (próba AI-008). Silnik: `apinex-luna` (`free/gpt-6-luna`).

- AI-001: nienaturalny wyraz „nadzierałem” niewychwycony przez poprzednią kontrolę.
- AI-003: literówka „dyspozyorni” niewychwycona przez poprzednią kontrolę.
- AI-005: `fail` — model nie zwrócił bezpiecznej, zatwierdzonej semantycznie wypowiedzi. Nie jest to błąd limitu API.
- AI-006: `warning` — niemal powtórzona odpowiedź Tomasza.
- AI-008: `blocked`, `provider_rate_limited` (2,042 ms), nie oceniono zachowania Janusza. Wersja RC57.6 poprawnie nie zwiększyła licznika ukończonych pytań.

## Zmiany architektoniczne

- `lib/interview-providers-rc24.js`: APINEX `free/jev-1.13` jako nowy legalny provider, bez aktywnej ścieżki Z.ai.
- `lib/interview-budget-636.js` i `api/interview.js`: budżet jednego dostawcy APINEX + fallback lokalny (bez wysyłania żądań Z.ai).
- `lib/admin-rc57-live.js`, `lib/admin-rc57-blind.js`, `lib/admin-rc57-ui.js`: tylko Luna i Jev jako wybory do testowania. Przerwa 35 sekund między pytaniami i dłuższy podpisany token wznowienia. Funkcje autoryzacji pozostają.
- `lib/admin-rc57-claim-audit.js`: dwa dodatkowe ostrzeżenia dotyczące wykrytych usterek językowych, bez ingerencji w kanon.
- `src/core/case-engine.js`, `src/integrations/35-zai-client.js`, `api/interview-restore.js`, `lib/interview-observability-636.js`: nowy identyfikator dopuszczony, stare identyfikatory w metadanych pozostają zgodne wstecz.
- `src/build-manifest.json` i `index.html`: zgodna przebudowa po zmianach w kliencie.

## Ograniczenia

- Wybór innego modelu APINEX **nie omija** limitu przypisanego temu samemu kluczowi API. Zbyt wiele zapytań z gry i testera nadal może spowodować 429. Brak globalnego limitera między równoległymi instancjami Vercel.
- Nie wykonywano połączeń z prawdziwymi kluczami APINEX. Zgodność endpointu i trybu JSON sprawdzono przy użyciu atrap odpowiedzi.
- Nie można uznać jakości odpowiedzi Jev za potwierdzoną bez rzeczywistego testu na produkcji.
- Stare testy archiwalne napisane dla konfiguracji z Z.ai mogą wymagać osobnej migracji ich historycznych założeń; aktualne testy RC57.7 zostały dostosowane.

## Testy

- 600/600 deterministycznych testów pytań.
- 380/380 kontroli silnika reguł i mechaniki śledztwa.
- 3/3 symulacje pełnego przejścia śledztwa, łącznie 580 działań.
- 12 plików `.js` w `api/` (limit Hobby).
- Testy klienta i panelu w Chromium, testy kooperacji i zapisów: zaliczone lokalnie.
