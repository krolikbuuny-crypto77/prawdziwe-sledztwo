# Raport QA — 6.27

## Zakres

Naprawa rozbieżności między odpowiedzią zatwierdzoną przez serwer i wyświetlaną przeglądarką oraz bezpieczna diagnostyka dostawcy, modelu, powodu przełączenia i identyfikatora żądania. Zachowano poprawki 6.26 (pamięć i rozumienie intencji).

## Testy wykonane lokalnie

- `npm run check`: PASS — 61 sekcji JS, 64 CSS, kontrola zasobów i zgodności źródeł.
- `node tools/test-api627.mjs`: PASS — Z.ai, Groq po błędzie 429, silnik lokalny po błędach Z.ai/Groq, odrzucenie niezgodnej odpowiedzi, identyfikatory UUID, brak sekretów w metadanych.
- `python tools/test-diagnostics627.py`: PASS — wyświetlanie diagnostyki, eksport i ponowne wczytanie, identyczne odpowiedzi `dialogues`, `ps67.approved` i `ps68.episodes`, brak wyjątków JS.
- `node tools/test-api617.mjs`: PASS po poprawieniu historycznego oczekiwania testu, które porównywało fallback z niezaufaną odpowiedzią dostarczoną przez klienta; test sprawdza obecnie kanon serwera.
- `node tools/test-interview626.mjs`: PASS — alibi i zgłoszenie alarmu.
- `node tools/test-api624-integration.mjs`, `node tools/test-security624.mjs`: PASS — dostawcy, kontrola faktów i semantyki, brak zmian werdyktu.
- `python tools/test-quality626.py`: PASS — spójność trzech pamięci, odrzucanie niezaufanej odpowiedzi poza tematem i ponowne wczytanie. Test dawnej, fałszywie oznaczonej odpowiedzi `serverCanonical:true` zastąpiono testem niezaufanego rezultatu z przestarzałego backendu.
- `python tools/test-quality625.py`: PASS — zestaw pytań i sześć głosów.
- `python tools/test-saves.py`: PASS — integralność zapisu, import, migracje, autosave i reset.

## Ograniczenia

- Testy sieciowe używały **mocków** i nie potwierdzają rzeczywistego routingu w produkcyjnym Vercel ani wywołań kont Z.ai/Groq.
- Gdy po stronie klienta nie dociera odpowiedź sieciowa, dostawca może pozostać nieustalony (`unknown`). Nie wolno wyciągać wniosku o rzeczywistym dostawcy z powtarzalności tekstu.
- Zgodność podczas równoczesnego błędu sieci i trwałego zapisu serwerowego wymaga osobnego testu na staging; transakcje Supabase nadal chronią zapis przy prawidłowo otrzymanej odpowiedzi HTTP.
- Poprawa rozumienia pytań nadal jest zależna od walidacji semantycznej i nie gwarantuje bezbłędności dla każdej polskiej parafrazy.
