# Raport QA — RC57.10.4

## Powód wydania

Analiza najnowszego ślepego testu 13/78 dokumentów oraz testów Marka (literówki, 7/72 pytań, długa pamięć) ujawniła: fałszywy alarm `class_fibers_as_individual_proof` przy dosłownym zaprzeczeniu indywidualnej identyfikacji, błędną rekonstrukcję pierwszej wypowiedzi, a także przesuwanie testu i zatruwanie historii po błędzie dostawcy lub braku bezpiecznej odpowiedzi.

## Zmiany

1. `lib/admin-rc57-claim-audit.js` — rozróżnianie zdania „włókna nie identyfikują Magdaleny” od fałszywego „jednoznacznie identyfikują Magdalenę”. Ostrzeżenia o prawdziwej nadinterpretacji pozostają. Nowa kontrola `opening_memory_attribution` porównuje twierdzenia o początku rozmowy z pierwszą faktycznie zatwierdzoną wypowiedzią świadka.
2. `api/interview.js`, `lib/interview-naturalness-rc28.js`, `lib/interview-rc57103-gate.js`, `lib/interview-quality-635.js` — serwer przesyła modelowi własną wcześniejszą wypowiedź jako zakotwiczony kontekst tylko przy pytaniu o początek rozmowy; wykryte, ewidentnie wymyślone wspomnienie powoduje jedną próbę poprawy z zachowaniem autorytatywnych faktów.
3. `lib/admin-rc57-live.js` — nieudana odpowiedź modelu i `provider_error` są jawnie wstrzymaną próbą, NIE zaliczoną wypowiedzią. Nie powstaje zastępcza fałszywa odpowiedź w podpisanej historii. Ponowienie z tego samego offsetu jest ręczne i podlega limitom API. Brak zniesienia limitu 7 pytań/min.
4. `lib/admin-rc57-ui.js` — dokładniejsze komunikaty o wstrzymaniu i liczniku prób, osobno od zaliczonych wypowiedzi. Aktualizacja eksportu RC57.10.4.
5. Aktualizacja testów przeglądarkowych i testu literówek do nowego, zamierzonego znaczenia „blocked”.

## Wyniki przeprowadzonych testów

- `npm run check`: PASS — składnia, zintegrowane źródła, fingerprint kanonu i rejestr dowodów.
- `node tools/test-rc57104-reports.mjs`: PASS — 4 przykłady ostrożnej interpretacji włókien bez fałszywego alertu; 2 rzeczywiste nadinterpretacje nadal wykrywane; błędna pamięć początku rozmowy wykryta, wierna pamięć bez alertu; kotwica wcześniejszej wypowiedzi dociera do wywołania modelu; błąd dostawcy i brak bezpiecznej odpowiedzi nie zmieniają offsetu ani historii; kontrola liczby funkcji.
- `node tools/test-rc57101-blind-audit.mjs`: PASS — audyt 13/78 i sześć rodzajów błędnego wnioskowania.
- `node tools/test-rc57102-live-audit.mjs`: PASS — wcześniejsze kontrolowane przykłady 18 pytań.
- `node tools/test-rc57103-preacceptance.mjs`: PASS — próbna naprawa i bezpieczne odrzucenie dwóch błędnych projektów.
- `node tools/test-rc57-live.mjs`: PASS — 18/72 tur i podpisane tokeny z podstawionym modelem.
- `node tools/test-rc57-blind.mjs`: PASS — odizolowany ślepy test 13/78.
- `node tools/test-rc57-quality.mjs`: PASS — audyty i wznawianie 429.
- `node tools/test-rc57-typo578.mjs`: PASS — literówki i obsługa nowego statusu.
- `node tools/test-rc57-provider-migration.mjs`: PASS — Jev/Luna bez Z.ai.
- `node tools/test-rc57-playthrough.mjs`: PASS — trzy symulacje reguł, 580 kroków.
- `python tools/test-rc57-blind-browser.py`: PASS — Chromium 390 i 1440 px.
- `python tools/test-rc57-quality-browser.py`: PASS — Chromium 390 i 1440 px, ręczne wznowienie po 429, eksport JSON.
- 12 funkcji serwerless w `api/`, bez nowych migracji Supabase.

## Ocena danych dostarczonych przez użytkownika

- „3 dokumentów” w przeklejonym wyniku nie odpowiada liczbie w kodzie: pakiet początkowy to **13 dokumentów**, sprawdzane i wyświetlane przez tester. Tekst przeklejony nie jest rozstrzygającym dowodem błędu licznika.
- Wskazanie Magdaleny po 78 dokumentach zgodne z kanonem; średnia pewność nie jest bezpośrednim dowodem winy.
- Sformułowanie „włókna W-7 (...) nie wskazują konkretnej osoby” jest ostrożne i nie powinno powodować alertu identyfikacyjnego.
- `provider_error` nie jest oceną jakości wypowiedzi świadka. Do rozpoznania konkretnego błędu u zewnętrznego operatora potrzebne będą kody diagnostyczne z nowego uruchomienia.
- `5 API zatrzymane` oznacza liczbę przerwanych prób, nie pięć niepoprawnych wypowiedzi.

## Ograniczenia

**Brak nowych połączeń do rzeczywistych modeli Apinex**, brak testu produkcyjnego Vercel/Supabase. Testy zewnętrznego modelu są niestabilne z definicji: nie ma technicznej gwarancji 18/18 odpowiedzi bez ostrzeżeń. Nie zmieniono 78 źródeł, sprawcy, procesu werdyktu ani schematu zapisów. Weryfikacja pamięci jest ostrożna i nie zastępuje pełnej analizy semantycznej. Nie wymuszamy domyślania nieznanego alibi. Testy 580 kroków dotyczą silnika reguł, nie pełnej rozgrywki kliknięciami. Przed produkcją wymagany test na Vercel Preview i ocena prawdziwych zeznań.
