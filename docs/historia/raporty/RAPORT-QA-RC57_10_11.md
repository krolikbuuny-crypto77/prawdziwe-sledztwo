# Prawdziwe Śledztwo — RC57.10.11: raport zmian i QA

## Podstawa

Źródło: kompletna paczka RC57.10.10 + wynik testu `Prawdziwe_Sledztwo_RC57_10_10_AI_live-long.json` (42/72 zatwierdzone odpowiedzi, 34 `pass`, 8 `warning`, 8 prób wstrzymanych). Raport testowy był częściowy: **nie testował szóstego świadka** i tylko częściowo obejmował Elżbietę. Wnioski dotyczące naturalności nie są dowodem, że konkretny model zawsze powtórzy lub zawsze uniknie danych błędów.

## Pięć wdrożonych priorytetów

1. **Relewancja i brak recytacji:** główny kontrakt wymaga odpowiedzi na aktualny zakres zamiast kopiowania całego alibi. `antiRepetition` przekazuje ostatnie początki wypowiedzi i nadużywane zwroty jako wyłącznie kontekst stylistyczny; podobieństwa są ostrzeżeniami QA. Dosłowne skopiowanie całej odpowiedzi na nowe pytanie nadal nie jest przyjmowane.
2. **Odrębny język sześciu świadków:** jeden słownik `WITNESS_VOICE_PROFILES` obejmuje Marka, Tomasza, Janusza, Elżbietę, Kamila i Magdalenę. Reakcje na nacisk są wskazówkami stylu, nie nowymi zdarzeniami ani faktami.
3. **Pamięć wypowiedzi:** kontrakt rozróżnia pierwszą odpowiedź w rozmowie od początku zmiany. QA sygnalizuje przypisywanie pierwszej wypowiedzi szczegółów wymienionych dopiero w późniejszych turach; celowe przypomnienie i podsumowanie własnych wypowiedzi nie są karane jako zbędne powtórzenia.
4. **Odpowiedzi wymijające i gramatyka:** nowe `interview-gender-rc571011.js` sprawdza charakterystyczne pierwszoosobowe formy czasu przeszłego (Marek/Tomasz/Janusz/Kamil – męskie; Elżbieta/Magdalena – żeńskie). Błąd trafia do istniejącego pojedynczego rewrite, z audytem faktów bez zmian. Tester administracyjny używa żeńskich pytań również w turach 4 i 7. QA sygnalizuje odpowiedź „nie mam dokumentu” zamiast określenia własnego miejsca lub niepewności.
5. **Powtórzenia zależne od intencji:** dłuższe dosłownie powtórzone fragmenty są ostrzeżeniami QA w różnych pytaniach, ale wyjątków dla żądanego przypomnienia i streszczenia nie rozszerzono na pytania o nowe fakty. Nie osłabiono reguł `factIds`, `hardGuard` i niezależnego audytu semantycznego.

## Jeden kanoniczny kontrakt zamiast sprzecznych instrukcji

- `lib/interview-prompt-rc57106.js`: **jedyne źródło** systemowego promptu odpowiedzi, systemowego promptu audytu, 6 profili mówienia, map podpowiedzi dla fokusów i napraw, dyrektyw kompatybilności RC28/50/51/52.
- Inne moduły nie definiują ponownie normatywnych promptów; stare eksporty są aliasami. Pozostają tylko obliczenia kontekstu, kontrola techniczna i sprawdzanie wyników.
- `INSTRUKCJA-GLOWNA.md`: jedna aktualna instrukcja użytkownika; 78 historycznych instrukcji/README zostało przeniesionych do `docs/archiwum-instrukcji/`. Historyczne raporty QA pozostały w repozytorium, lecz nie są instrukcjami wdrożenia.

## Zweryfikowane testami lokalnymi

| Test | Wynik |
|---|---|
| `npm run check`, `npm run build` | PASS |
| `tools/test-rc571011-natural-interview.mjs` | PASS: 6 głosów, 5 priorytetów, pamięć, QA powtórzeń, rodzaj |
| `tools/test-rc57106-unified-prompt.mjs` | PASS: jeden kontrakt, zgodność eksportów |
| `tools/test-rc571010-testimony-recap.mjs` | PASS: AI-011/012 i kontrola faktów |
| `tools/test-rc57-whole-game.mjs` | PASS: 380 kontroli logiki |
| `tools/test-rc57-playthrough.mjs` | PASS: 580 działań w trzech przejściach |
| `tools/test-rc57103-preacceptance.mjs`, `tools/test-rc57-quality.mjs` | PASS |
| `tools/test-rc57105-performance.mjs` | PASS: 300 lokalnych przygotowań, bez prawdziwego dostawcy |
| `tools/test-rc5710-traffic.mjs`, `tools/test-rc5710-quota.mjs` | PASS |
| `tools/test-rc57107-pauses.mjs`, przeglądarkowy odpowiednik, `test-rc57-quality-browser.py` | PASS na 390/1440 px |
| `tools/test-saves.py` | PASS |

## Ograniczenia

- **Nie wykonano nowego testu 72 pytań na rzeczywistym Apinex**. Z tego powodu nie ma podstaw do deklaracji „naturalność 9/10”, „0 warning” ani przewidywania czasu prawdziwego API.
- Wąski filtr odmiany nie zastępuje pełnej analizy polskiej gramatyki. Reguły intencji i oceny stylu także są heurystyczne; ręczna ocena nadal wymagana.
- Test administracyjny (72 pytania) powtarza podobne tematy celowo, dlatego ostrzeżenia nie są automatycznie błędami fabularnymi.
- Nie wykonano zapisu do produkcyjnego Supabase ani nie wdrożono poprawki w GitHub/Vercel. Repozytorium pozostaje nietknięte.
- `APINEX_API_KEY` i inne sekrety nie są umieszczone w plikach gry. Zmiany nie wymagają nowych zmiennych, migracji SQL ani zwiększenia liczby funkcji `api/`.
