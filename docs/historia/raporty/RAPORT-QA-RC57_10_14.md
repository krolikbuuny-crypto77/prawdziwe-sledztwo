# Prawdziwe Śledztwo — RC57.10.14: korekta blokady AI-015

## Wejście i diagnoza

Na podstawie eksportu tekstowego z rzeczywistego testu (AI-001–AI-015):
- Marek AI-005 i AI-009: ostrzeżenia powtórzeń stylistycznych.
- Tomasz AI-014: zatwierdzone ostrzeżenie `overformal_answer` i osobna odrzucona próba `not_entailed` wraz z `fact_ids_count`.
- Tomasz AI-015: cztery odrzucone próby `dialogue_excluded_topic_repeated`. W eksporcie brak surowych tekstów odrzuconych prób, więc nie można ustalić, ile z nich było fałszywie dodatnich.
- Odrębna wstrzymana próba AI-012: rzeczywisty HTTP 429 / etap rewrite / Retry-After 16 sekund, a nie błąd negacji.

W `lib/admin-rc57-claim-audit.js` wcześniej występował warunek, który flagował **każdą** wzmiankę `Lena/Lenę/Leny` w odpowiedzi na pytanie „Nie pytam o Lenę…”. Kod `excluded_topic_repeated` był następnie twardo blokowany przez `lib/interview-rc57103-gate.js`. To stwarzało możliwość fałszywego odrzucania trafnych odpowiedzi zawierających krótkie odniesienie do odkrycia ofiary.

## Zmiany

1. `lib/admin-rc57-claim-audit.js`: rozróżnienie `excluded_topic_incidental` (nieblokujące ostrzeżenie za wzmiankę o Lenie w odpowiedzi o własnej lokalizacji) i `excluded_topic_repeated` (twarda blokada za odejście do wątku ofiary bez odpowiedzi o własnym miejscu). Podstawą jest jawne wykluczenie zakresu i pozytywny cel pytania; nie samo wystąpienie imienia. Obsłużono polskie odmiany imienia i lokacje typu „w rejonie warsztatu” i „przy konsoli”.
2. `lib/interview-prompt-rc57106.js`: jedno centralne źródło wskazówek dla generatora, audytora i pojedynczej naprawy; odpowiedź o miejscu jest ważniejsza od unikania jakiegokolwiek słowa „Lena”. Przy `not_entailed` naprawa nie dopisuje nieautoryzowanych godzin ani kontaktów.
3. `tools/test-rc571014-excluded-focus.mjs`: nowe testy sześciu świadków, czterech prawdziwych odejść od pytania oraz symulacji produkcyjnej (bez niepotrzebnego rewrite, ale bez przepuszczania `entailed:false`). Zmieniono też stary test RC57.8, który wcześniej oczekiwał twardego błędu za prawidłowe alibi z nieistotną wzmianką o Lenie.
4. Oznaczenia wersji diagnostycznej, README i jednej `INSTRUKCJA-GLOWNA.md` zaktualizowano do RC57.10.14.

## Zweryfikowane lokalnie (bez dostawcy)

- `npm run check` — PASS.
- `npm run build` — PASS.
- `node tools/test-rc571014-excluded-focus.mjs` — PASS.
- `node tools/test-rc571013-negations.mjs` — PASS, 600/600 przypadków; 60/60 negacji.
- `node tools/test-rc57103-preacceptance.mjs`, `node tools/test-rc57-typo578.mjs`, `node tools/test-rc5710-random-questions.mjs` — PASS.
- `node tools/test-rc571011-natural-interview.mjs`, `node tools/test-rc571012-corrections.mjs` — PASS.
- `node tools/test-rc57-whole-game.mjs` — PASS (380 kontroli).
- `node tools/test-rc57-playthrough.mjs` — PASS (580 działań śledczych).
- `python tools/test-saves.py` — PASS.

## Granice

- Nie uruchamiano rzeczywistego Apinex ani testu 72 pytań po zmianie. Wnioski nie są dowodem usunięcia zewnętrznych 429 lub wszystkich błędów `not_entailed`.
- Bez surowych odrzuconych odpowiedzi nie wiadomo, ile z czterech prób AI-015 było zgodnych z pytaniem. Nowy mechanizm nadal może popełnić błędy w mniej typowych polskich konstrukcjach; niezależny audyt semantyczny pozostaje aktywny.
- Brak modyfikacji dowodów, fabuły, systemu odblokowań, werdyktu, stanu gracza, migracji SQL, sekretów API lub liczby endpointów Vercel.
