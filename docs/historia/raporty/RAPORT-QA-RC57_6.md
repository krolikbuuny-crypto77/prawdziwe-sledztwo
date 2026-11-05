# Raport RC57.6 — zmiany i testy

## Rozwiązane problemy z raportu użytkownika

| Problem | Poprawka | Zakres kontroli |
|---|---|---|
| Ślepa próba wzmiankuje nieistniejący `LAB-014` | Wykrywanie identyfikatorów dokumentów w pełnym tekście uzasadnienia i brakujących dowodów | Ostrzeżenie `unknown_document_in_text` |
| Korekta czasu kamery C o +50 s | Kontrola kierunku korekty i czasu nagrania | Ostrzeżenie `camera_c_time_conversion` |
| Opis DIG-09 jako „01:35–01:44” bez 01:52 | Kontrola ograniczenia chronologicznego | Ostrzeżenie `incomplete_activity_window` |
| AI-007: brak pamięci słów mimo ich obecności w rozmowie | Selektywny `openingExchange` oraz dodatkowy audyt wypowiedzi | `memory_evasion` |
| AI-003/005: konkretna kolejność, a potem jej zanegowanie | Dodatkowy audyt oraz instrukcja dla generowania | `self_order_contradiction` |
| AI-008: `provider_rate_limited` jako błąd postaci | Stan `blocked`, brak przesunięcia indeksu i ręczne wznowienie | Podpisany token, ręczny przycisk, test w Chromium |
| Bliskie parafrazy powtarzane mimo różnych pytań | Konserwatywna analiza zbieżności wyrazów | `near_repetition` do ręcznego potwierdzenia |

## Regresja

- 600/600 deterministycznych testów RC57: **PASS**.
- 380/380 testów mechaniki gry: **PASS**.
- 3 scenariusze sekwencyjne, 580 poprawnie zweryfikowanych działań: **PASS**.
- Testy izolacji i autoryzacji RC57.5, trybu rzeczywistego AI, RC50/RC51/RC52, kooperacji RC35: **PASS**.
- Testy zapisów, importu i migracji: **PASS**.
- Nawigacja na 320, 390, 768 i 1440 px: **PASS**.
- Chromium: nowy panel QA i zatrzymanie/wznowienie 429 (390/1440 px), stary ślepy test (390/1440 px), przebieg symulatora (390/1440 px): **PASS**.
- Kompilacja, testy integralności zasobów i kanonu: **PASS**.
- `api/*.js`: **12** funkcji; żadnego nowego endpointu. `index.html` bez zmian SHA-256.

## Uczciwe ograniczenia

Wykrywanie sprzeczności jest częściowo heurystyczne; nowy audyt wymaga ręcznego przejrzenia oznaczonych miejsc. Przykładowe trzy ostrzeżenia dotyczą raportu otrzymanego od użytkownika, a nie nowej próbki wygenerowanej przez modele w tym wydaniu. Udoskonalona pamięć i prompt produkcyjny mogą poprawić reakcje, ale bez prawdziwego testu z API nie można potwierdzić zmiany jakości rozmów.
