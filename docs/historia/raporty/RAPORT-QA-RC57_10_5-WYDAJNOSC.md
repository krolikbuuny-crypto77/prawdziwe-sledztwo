# RC57.10.5 — raport QA: wydajność AI bez wyłączania pamięci i audytu

**Baza:** pełna RC57.10.4. **Zakres:** optymalizacja wywołań przesłuchań i obserwowalności. **Brak zmian:** kanon, 78 dokumentów, sprawca, chronologia, bramki dowodów, werdykt, schemat i zapisy Supabase, liczba funkcji Vercel (12).

## Diagnoza

- Podany przez właścicielkę przebieg: **13 187 ms**, generowanie **8128 ms**, audyt semantyczny **3990 ms**, dwa wywołania API, zero korekt. To ok. 61,6% i 30,3% czasu. Względem wcześniejszego 3260 ms jest to ok. czterokrotny wzrost, ale porównanie pochodzi z innych przebiegów i nie izoluje zmian w modelu/kwotach/obciążeniu ani różnic sceny.
- W RC57.10.4 standardowy przebieg: generowanie -> deterministyczne bramki bezpieczeństwa -> niezależny audyt AI -> akceptacja. Ten układ **seryjnie sumuje** czasy dwóch wywołań; dodatkowe korekty zwiększają liczbę żądań.
- Kod systemowego promptu generacji zawierał powtarzające się fragmenty RC28/32/37/57.8/57.10.2/57.10.3 o naturalności, logach, pamięci i alibi. Rozmiar instrukcji: 11 031 znaków.
- Audyt przed zmianą korzystał z funkcji przygotowania danych również dodającej wskazówki psychologiczne i tekstowe; te wskazówki nie są dla niezależnego kontrolera konieczne.
- 34–36 elementów `factBank` na świadka nie ma identycznych duplikatów. **Nie filtrowano ich ryzykownym rankingiem słów kluczowych**. Źródła prawdy są serwerowe i pozostają wszystkie dostępne. Dłuższe cytaty starszych wypowiedzi są dobierane osobno.

## Implementacja

1. `lib/interview-naturalness-rc28.js`: scalono nakładające się instrukcje dialogowe w krótszą, logicznie równoważną sekcję. Zachowano niezależny oryginalny kontrakt factBank, wskazówki RC50/RC51/RC52, psychologię, literówki, pamięć i wymóg rozumienia wielowątkowego.
2. `lib/interview-perf-rc57105.js` i `api/interview.js`: audyt korzysta z węższej projekcji faktów, pytania, historii, dialogowego kontekstu i proponowanej odpowiedzi. **Nie został wyłączony**, nadal wymagany dla wszystkich parafraz poza dotychczasowym ściśle dopuszczonym wyjątkiem dosłownego fragmentu.
3. `lib/dialogue-memory-636.js` i `lib/interview-wire-rc23.js`: gdy użytkownik wraca do odległego tematu po >40 parach, można dołączyć najwyżej jeden dopasowany cytat starej **zatwierdzonej** wypowiedzi. Pamięć pozostaje relacją, nie staje się źródłem faktów. Pierwsza wypowiedź jest zachowana przy pytaniu o początek rozmowy.
4. `lib/interview-providers-rc24.js`: na podstawie rzeczywistego pola `usage` z odpowiedzi Apinex raportowane są `prompt_tokens` / `completion_tokens` (jeśli występują). Oddzielnie mierzony jest czas oczekiwania na kwotę i dostawcę oraz czy rzeczywiście rozpoczęto żądanie HTTP. Nie zapisuje się promptów ani sekretów.
5. `lib/interview-observability-636.js` i `api/interview.js`: `totalDurationMs`, `generateDurationMs`, `semanticAuditDurationMs`, `localValidationDurationMs`, `contextPreparationDurationMs`, `providerCalls`, `correctiveCalls`, `rejectedChecks`, `fallbackReason`, `inputTokens`, `outputTokens`, `contextSize` (bajty UTF-8), `auditMode`, `provider`, `model`, a dodatkowo czas dostawcy i kwoty. Brak danych tokenowych = `null`, nie zero.
6. Token-limitów, timeoutów, 429, 12 funkcji i kolejności fallbacków **nie skracano na ślepo**. Brak automatycznego wyścigu dwóch modeli.

## Pomiar porównawczy RC57.10.4 vs RC57.10.5

Lokalny benchmark odtworzył 10 rodzajów pytań dla 6 świadków, pięć powtórzeń = **300 przypadków / 60 scenariuszy**. Obie wersje używały tych samych przygotowanych scen i faktów. Wyniki rozmiaru żądania uwzględniają instrukcję systemową i serializowaną część `user`.

| Metryka | RC57.10.4 | RC57.10.5 | Zmiana |
|---|---:|---:|---:|
| Instrukcja generowania, znaki | 11 031 | 7 045 | −36,1% |
| Średni rozmiar wejścia generacji, bajty | 22 818 | 18 576 | −18,6% |
| Średni rozmiar wejścia audytu, bajty | 5 925 | 4 417 | −25,5% |
| Mediana *lokalnego* przygotowania generacji | — | ok. 0,064 ms | niedostępny punkt odniesienia |
| p95 *lokalnego* przygotowania generacji | — | ok. 0,159 ms | niedostępny punkt odniesienia |
| Mediana *lokalnego* przygotowania audytu | — | ok. 0,006 ms | niedostępny punkt odniesienia |
| p95 *lokalnego* przygotowania audytu | — | ok. 0,017 ms | niedostępny punkt odniesienia |
| Rzeczywista mediana/p95 opóźnienia Apinex | brak pomiaru po zmianie | **niezmierzone** | nie można potwierdzić |

**Uwaga:** mikroczasy są pomiarami przygotowania obiektów JS, **nie** czasu odpowiedzi modelu. Redukcja bajtów nie przesądza o proporcjonalnym przyspieszeniu po stronie dostawcy. Nie deklarujemy osiągnięcia celu 3–5 s. Dostawca nie był w tym środowisku wywoływany z produkcyjnym kluczem; metryki tokenowe przetestowano na lokalnym transporcie zwracającym pole `usage`.

## Wykonane testy

- **PASS:** `npm run check`: składnia, hashe zasobów, kanon świadka, rejestr dowodów, zgodność budowania.
- **PASS:** `tools/test-rc57105-performance.mjs`: 300 przypadków, 6 świadków, 10 scenariuszy, zachowanie całego factBank, pamięć odległa, brak coachingów w audycie, metryki `usage` oraz `null` przy ich braku, 1 faktycznie symulowane żądanie transportu.
- **PASS:** `tools/test-rc57103-preacceptance.mjs`: odrzucenie błędnych wypowiedzi, ograniczona korekta, niezależny audyt i brak akceptacji podwójnie złej odpowiedzi.
- **PASS:** `tools/test-rc57104-reports.mjs`: audyt źródeł i odległa pamięć, przerwane testy bez fałszywego zapisu.
- **PASS:** `tools/test-rc57-whole-game.mjs`: 380 kontroli logiki.
- **PASS:** `tools/test-rc57-blind.mjs`: 13/78 dokumentów, rozdział osądu od kanonu.
- **PASS:** `tools/test-rc57-live.mjs`: ścieżki testera 18/72 w symulowanym transporcie.
- **PASS:** `tools/test-rc57-provider-migration.mjs`, `tools/test-rc57-typo578.mjs`, `tools/test-rc5710-traffic.mjs`: dostawcy, literówki i 429.
- **PASS:** `tools/test-saves.py`: eksport/import, checksumy, rollback, autosave, migracje 11 wersji.
- **PASS:** `tools/test-rc5710-browser-e2e.py`: Chromium 390 i 1440 px, 10 kliknięć, bramki finału.
- **SKIP:** odizolowany staging Supabase — brak osobnych poświadczeń; produkcja bez zmian.
- **STARY TEST NIEAKTUALNY:** `tools/test-rc32-dialogue.mjs` zakłada brak korekty przy wypowiedzi, którą późniejsza RC57.10.3 celowo odrzuca. Ten test zgłasza taki sam błąd na bazowej, niezmienionej RC57.10.4. Nie uznano go za zaliczony.

## Wymagania przed produkcją

Przetestować na Vercel Preview, bez naruszania produkcyjnych zapisów: co najmniej 10 scenariuszy × 6 świadków, identyczne zatwierdzone stany, dostawca Luna (i ewentualnie Jev), trzy lub więcej powtórzeń dla stabilnego porównania i dokumentacja median/p95, liczby tokenów, liczby API, częstości 429, odrzuceń semantycznych i naturalności (ręczna ocena). 10×6×3 to **180 pytań, zwykle co najmniej 360 wywołań modelu**, dlatego monitorować limit konta i nie uruchamiać prób równolegle. Przy gorszej spójności narracyjnej wycofać wydanie.
