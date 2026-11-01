# RC57.10.6 — jeden uporządkowany prompt przesłuchań

## Zmiana względem RC57.10.5

Zamiast dokładać bazową instrukcję z `interview-wire-rc23.js`, następnie tekst RC57.10.5 oraz na końcu trzy części RC50/RC51/RC52, obie ścieżki korzystają teraz z **tego samego** `interviewAnswerSystem` z `lib/interview-prompt-rc57106.js`.

Pięć części kontraktu: (1) fakty i granice wiedzy; (2) intencja pytania; (3) pamięć, sprostowania i chronologia; (4) naturalność i psychologia; (5) kontrola przed wysłaniem oraz JSON.

Pamięć i indywidualny kontekst są dalej przygotowywane przez dotychczasowe moduły. Zachowano `factBank`, listę `allowedFactIds`, `dialogueMemory`, `conversationOpeningAnchor`, kontekst presji oraz styl każdego z sześciu świadków. W `witnessSpeech` usunięto tylko dwa zbędne teksty instrukcyjne (`responseShape` i `continuity`), których treść jest w jednym głównym kontrakcie. Nie zmieniono identyfikatorów faktów, modelu, maxTokens, timeoutów, kolejności audytów ani liczby funkcji API.

## Którą paczkę użyć

- **Pełny ZIP RC57.10.6**: gdy żadna z wcześniejszych wersji nie została wdrożona albo nie masz pewności, którą masz.
- **Poprawka RC57.10.5 → RC57.10.6**: wypakuj do katalogu źródłowego RC57.10.5 i zaakceptuj nadpisanie wskazanych plików. Nie nakładaj tej poprawki bezpośrednio na starsze RC.

Potem wdroż projekt zgodnie z dotychczasową procedurą GitHub / Vercel. Nie jest wymagane wykonywanie SQL ani zmiana zmiennych środowiskowych.

## Co testować po wdrożeniu Preview

W panelu administratora powtórz te same pytania na Luna i Jev, szczególnie: obecność po północy, źródła wspomnień, sprostowanie, pierwszą wypowiedź długiej rozmowy, presję i nieuprawnioną wiedzę. Porównaj `generateDurationMs`, `semanticAuditDurationMs`, `providerCalls`, tokeny (jeśli dostawca je udostępnia), medianę i p95. Weryfikuj także powtarzalność formułek i fakty. Użyj limitera testowego, aby nie wyczerpać limitów API.

## Uwaga

Krótszy prompt nie dowodzi automatycznie szybszej ani lepszej odpowiedzi konkretnego modelu. Nie przeprowadzono testu na prawdziwym Apinex — wyniki liczbowe w raporcie dotyczą payloadu i lokalnych testów.
