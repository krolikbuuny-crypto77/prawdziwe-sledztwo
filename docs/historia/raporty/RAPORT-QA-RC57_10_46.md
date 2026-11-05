# RC57.10.46 — rozszerzenie wiedzy kontekstowej AI o inne osoby
Data: 2026-11-03. Baza: RC57.10.45.

## Zmiana
- Dodano `lib/witness-relations-rc46.js`: rozpoznawanie polskich imion i nazwisk sześciu świadków oraz Leny, fleksji i odniesień „on/ona/z nim/o niej” z zatwierdzonych pytań tego samego przesłuchania.
- `lib/interrogation-brief-rc45.js`: kieruje pytania o osoby trzecie na istniejące, autoryzowane wpisy danego świadka, a nie na jego własne alibi. Priorytetem jest dozwolony fakt bezpośrednio dotyczący pytanej osoby.
- `lib/interview-local-rc24.js`: w trybie rezerwowym odpowiedź dosłownie oparta na dopuszczonym źródle albo jawne ograniczenie wiedzy; odróżnia pojedynczą znajomość od niepotwierdzonej relacji dwóch innych osób. Dopytuje przy niejasnych zaimkach.
- `lib/interview-prompt-rc57106.js`: uzupełniono wspólny kontrakt chmurowego AI o zakaz domniemywania zaufania, romansu, konfliktu lub czyjejś fizycznej obecności z ogólnej współpracy i cudzych niezweryfikowanych cytatów.
- Nie zmieniano `lib/witness-registry-rc22.json`, kanonu, dowodów, bramek fabuły, zapisów Supabase, API modeli ani wyglądu gry.
- Mapa `MAPA-RELACJI-RC57_10_46.md` jest indeksem materiału już istniejącego, nie nową biografią postaci.

## Wyniki potwierdzone lokalnie
- `node tools/test-rc571046-relationships.mjs`: **1325/1325** kontroli (6 punktów widzenia × 6 innych osób + zaimki, cytaty, bezpodstawne oskarżenia, alibi osób trzecich i ograniczenia źródeł).
- `node tools/test-rc571045-interrogations.mjs`: **784** kontrole PASS. Historyczną próbę pytania o Lenę zaktualizowano do nowego rodzaju `relationship`; nie jest to ukryta porażka, lecz zamierzona zmiana klasyfikacji.
- `node tools/test-rc57-whole-game.mjs`: **380** kontroli reguł PASS.
- `node tools/test-rc57.mjs`: **600** deterministycznych testów bezpieczeństwa i logiki PASS.
- `node tools/test-rc571013-negations.mjs`: **600/600 + 60/60** PASS.
- `node tools/test-rc571044-local-fallback.mjs`: **12** scenariuszy PASS.
- `python tools/test-saves.py`: PASS, eksport, import, migracje, rollback, autosave.
- `npm run build`, `npm run check`: PASS, odtwarzalna kompilacja, kanon i spójność zasobów.

## Niepotwierdzone
- `python tools/test-navigation.py`: próba zakończyła się przerwaniem procesu Chromium/Playwright (`EPIPE`) po przekroczeniu limitu czasu środowiska. **Nie raportujemy PASS**. Interfejs nie był modyfikowany w RC57.10.46.
- Test 3 × 100 wiadomości także nie ukończył się w tej sesji po przerwaniu zbiorczej komendy. Poprzednie wyniki z RC57.10.45 pozostają historycznym punktem odniesienia, a nie nowym wynikiem.
- Nie wykonano rzeczywistej produkcyjnej rozmowy przez Apinex/Groq na Vercel ani sprawdzenia stałych limitów HTTP 429. Testy są lokalne i nie dowodzą niezawodności chmury.
- Część potencjalnych relacji **nie istnieje w zatwierdzonym kanonie**; system wówczas nie może podać szczegółów prywatnych. Aby rzeczywiście dopisać nowe wydarzenia i więzi, potrzebna byłaby odrębna, świadoma aktualizacja fabuły, kartotek i testów kanonu.

## Zalecany test produkcyjny
Dla każdej postaci zadaj 12–20 różnych pytań, m.in. „Co sądzisz o Nowickim?”, „Jak znałeś Lenę?”, „Czy Janusz i Tomasz się kłócili?”, „Czy Lena ufała Markowi?”, „Wójcik mówił, że cię widział — co na to powiesz?”, „A co o nim myślisz?”. Zwróć uwagę na trafność, ton, powtarzalność i odmowę ujawnienia cudzych tajemnic. Nie wdrażaj na produkcję bez Vercel Preview.
