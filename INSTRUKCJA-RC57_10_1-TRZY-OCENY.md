# Prawdziwe Śledztwo — RC57.10.1
## Instrukcja: trzy niezależne oceny ślepego testu

### Zakres
Ta aktualizacja zmienia **wyłącznie** ocenę i prezentację wyników ślepego testu w `/admin/testy`. Nie zmienia przebiegu sprawy, 78 dokumentów, dialogów graczy, warunków werdyktu ani tabel Supabase. Działa z istniejącą konfiguracją Apinex i Vercel Hobby (12 funkcji API).

### Instalacja

**Jeżeli masz już RC57.10:** rozpakuj `Prawdziwe_Sledztwo_RC57_10_1_POPRAWKA_DO_RC57_10.zip` i nadpisz wskazane pliki w repozytorium, zachowując ścieżki `lib/`, `tools/` i `package.json`. Zacommituj i przetestuj deployment Preview.

**Jeżeli RC57.10 nie jest jeszcze wgrana:** użyj od razu pełnej paczki `Prawdziwe_Sledztwo_RC57_10_1_HOBBY_PELNA.zip` jako źródeł aktualizacji repozytorium. Nie potrzebujesz instalować kolejno poprzednich małych poprawek.

Nie jest wymagany nowy SQL, nowy klucz API ani zmiana zmiennych środowiskowych. Istniejące `RC57_LIVE_TEST_ENABLED=true` nadal steruje dostępnością testów na żywo. Nie włączaj testów AI bez potrzeby — wykonują realne zapytania do Apinex.

### Sprawdzenie
1. Wejdź na wdrożenie Preview → `/admin/testy` i zaloguj się do panelu.
2. Przejdź do „Ślepy test detektywistyczny — RC57.10.1”.
3. Po wyrażeniu zgody uruchom analizę 13 i 78 dokumentów. Modele są niezależne; nie otrzymują klucza rozwiązania.
4. Przy obu etapach zobaczysz **1. Trafność wskazania**, **2. Poprawność dowodowa**, **3. Jakość rozumowania**. Przy 13 dokumentach nie ma oceny trafności nazwiska.
5. Jeśli model wymieni `LAB-014`, powinien pojawić się błąd `unknown_document_in_text`, a przy trafnym nazwisku ocena zbiorcza `canon_match_with_source_errors`.
6. Pobierz raport JSON — zawiera `grade.dimensions` z trzema oddzielnymi wynikami, zachowując istniejące pola `grade`.

### Lokalna regresja (Node 22, Chromium i Python/Playwright)
```
npm run check
npm run test:rc57101-blind
node tools/test-rc57-whole-game.mjs
```

### Ograniczenia
- To **reguły heurystyczne**, nie pełne automatyczne rozumienie wszystkich możliwych sformułowań. Brak ostrzeżeń nie oznacza poprawności całej argumentacji.
- Rozpoznanie zgodnego sprawcy pozostaje osobną informacją, nawet gdy dowody są błędne.
- Nie zmieniamy dokumentów gry ani nie dodajemy „brakującego” `LAB-014`.
- Testy automatyczne korzystają z podstawionych odpowiedzi modeli i nie potwierdzają odpowiedzi prawdziwego Apinex po wdrożeniu.
- Nowa ocena nie jest blokadą fabuły, dowodów ani werdyktu gracza.
