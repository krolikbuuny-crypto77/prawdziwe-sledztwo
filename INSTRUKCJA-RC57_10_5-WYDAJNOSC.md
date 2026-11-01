# Instrukcja RC57.10.5 — optymalizacja wydajności przesłuchań

1. Jeśli masz aktualnie **RC57.10.4**, rozpakuj poprawkę `Prawdziwe_Sledztwo_RC57_10_5_POPRAWKA_DO_RC57_10_4.zip` w katalogu repozytorium GitHub, zachowaj podkatalogi `api/`, `lib/`, `tools/` i nadpisz wskazane pliki. Alternatywnie wgraj **pełny ZIP RC57.10.5**, jeżeli jeszcze nic nie wdrożono.
2. W repozytorium uruchom `npm run check` i `npm run test:rc57105-performance`. Test wydajności uruchomiony bez `BASELINE_DIR` weryfikuje jedynie nową wersję. Porównanie z bazową wersją można wykonać z rozpakowaną RC57.10.4: `BASELINE_DIR=/ścieżka/do/RC57_10_4 node tools/test-rc57105-performance.mjs`.
3. Na Vercel użyj **Preview Deployment**. Liczba plików `api/*.js` nadal wynosi 12, nie ma nowych kluczy API ani wymuszonych migracji SQL. Klucz `APINEX_API_KEY` musi pozostać wyłącznie w zmiennych Vercel.
4. Wejdź na `/admin/testy`, sprawdź najpierw 18 pytań na Luna. Nie uruchamiaj wielu równoległych testerów; liczba wywołań generacji + audytu jest większa niż liczba pytań. Jeśli jest dostępne staging Supabase, powtórz test długiej pamięci na odizolowanym koncie.
5. W `interview-diagnostic` porównaj `totalDurationMs`, `generateDurationMs`, `semanticAuditDurationMs`, `providerCalls`, `inputTokens`, `outputTokens`, `contextSize`, `auditMode` i `qualityDiagnostics`. Jeśli `inputTokens` lub `outputTokens` to `null`, dostawca nie zwrócił danych — **to nie jest 0**.
6. Uznaj przyspieszenie za sukces tylko przy braku regresji faktów, pamięci, psychologii i naturalności. Pełen test produkcyjnego Apinex nie był możliwy w lokalnym środowisku przygotowania paczki.

**Nie zmieniono:** sprawcy, fabuły, warunków odblokowań, werdyktu, istniejących zapisów Supabase, wymaganych kontroli semantycznych ani timeoutów.

Zobacz `RAPORT-QA-RC57_10_5-WYDAJNOSC.md`.
