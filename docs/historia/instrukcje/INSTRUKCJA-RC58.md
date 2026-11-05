# RC58 / RC57.10.59 — wdrożenie i testy

## Paczki
- Pełna: `Prawdziwe_Sledztwo_RC57_10_59_INTELIGENTNE_PRZESLUCHANIA_PELNA.zip` — samodzielny projekt.
- Aktualizacja: `Prawdziwe_Sledztwo_RC57_10_59_AKTUALIZACJA_DO_RC57_10_58.zip` — rozpakować do RC57.10.58 z nadpisaniem zmienionych plików.

## Vercel
1. Prześlij pełne repo lub zastosuj patch do istniejącego kodu. Zbuduj i uruchom Preview; NIE wprowadzaj zmiennych `APINEX_API_KEY` i `SUPABASE_SERVICE_ROLE_KEY` do klienta.
2. Wykonaj `npm run check`, `npm run build`, `npm run test:rc58` i `python tools/test-saves.py`.
3. Wariant minimalny: brak migracji — dotychczasowy limit w pamięci instancji, globalny limit czterech wywołań na pytanie i bezpieczny retry działają w aktualnym kodzie.
4. Opcjonalne limitowanie między instancjami: **najpierw** uruchom w prawdziwym Supabase plik `supabase/008_apinex_distributed_queue_rc58.sql`. Następnie w Vercel dodaj `APINEX_DISTRIBUTED_QUEUE_ENABLED=true` oraz `APINEX_MAX_UPSTREAM_CALLS_PER_MINUTE=<rzeczywisty limit potwierdzony w panelu dostawcy>`; ewentualnie `APINEX_QUEUE_MAX_WAIT_MS=4500`. Nie włączaj flagi przed migracją. Nie wpisuj arbitralnej liczby wywołań na minutę.
5. W Preview wykonaj przypadki AI-007, AI-019, AI-031, AI-015, AI-006 i AI-043, potem **72 pytania przez prawdziwy model**. Zbieraj licznik wywołań na pytanie, czas odpowiedzi, 429, 502, `not_entailed`, powtórzenia i błędy chronologii.
6. Porównaj z RC57.10.58, sprawdź migrację istniejących zapisów i brak wycieków wiedzy świadków. Jeśli pojawia się niepewność starej historii, serwer zwraca błąd odtworzenia zamiast fikcyjnego cytatu.

Uwaga: test `tools/test-rc571014-excluded-focus.mjs` ma historyczną niezgodność źródła faktu f14 z treścią odpowiedzi; może zgłaszać FAIL przed i po patchu. Nowy test `tools/test-rc58-intelligence.mjs` wykorzystuje właściwe źródło pobytu f15 i nie obniża rygoru walidatora.

Wdrożenie nie zmienia kanonu, poziomów dostępu do dowodów, werdyktu, zasad przełomów psychologicznych ani interfejsu gry.
