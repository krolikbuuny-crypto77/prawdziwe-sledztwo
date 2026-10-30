# Prawdziwe Śledztwo 6.36 — Etap III (paczka testowa)

**Baza:** 6.36-II. **Zakres:** wydajność odpowiedzi AI oraz ochrona serwerowych źródeł i końcowego rozstrzygnięcia. Pełna gra obejmuje też Etap I i Etap II.

## Punkt 7 — wydajność przesłuchań

- Wprowadzono `lib/interview-budget-636.js`, czyli jedno źródło limitów czasu dla całej tury.
- Cała próba odpowiedzi ma budżet **17,5 s od rozpoczęcia prób modeli**, z czego **1,1 s** zarezerwowano na zapis/odpowiedź HTTP. Poprzednio limit prób wynosił 21,5 s i nie obejmował wszystkich dodatkowych ocen równie konsekwentnie.
- Z.ai ma okno maksymalnie 10 s, później Groq korzysta z pozostałego czasu. Limit pojedynczego generowania Z.ai to 5,6 s, Groq 4,7 s. Analizy semantyczne i poprawki zużywają TEN SAM budżet.
- Wciąż **Z.ai → Groq → silnik lokalny**. Nie ma równoległych zapytań do obu dostawców. Dodatkowa korekta jest ograniczona do jednej próby i nie jest podejmowana po wyczerpaniu budżetu.
- Jedynie bardzo restrykcyjna ścieżka dosłownego cytatu zatwierdzonego faktu może pominąć niezależny audyt semantyczny. Inne parafrazy wymagają kontroli.
- Faktyczne opóźnienie w Internecie i czas zapisu Supabase **nie zostały zmierzone**. Cel 3–6 s pozostaje celem, a nie wynikiem testu.

## Punkt 8 — ochrona fabuły

- `vercel.json` dodaje reguły `404` dla bezpośrednich żądań HTTP do `/lib`, `/src`, `/tools`, wyników QA oraz plików projektu. Ma to chronić m.in. kanon serwerowy i reguły werdyktu przed zwykłym publicznym pobraniem. Trzeba to sprawdzić na wdrożeniu Vercel.
- Z usuwanych fragmentów kodu przeglądarki zniknęły porównania wybranej osoby z wpisanym na stałe poprawnym sprawcą. Lokalne finały zamiast tego uzyskują status tożsamości z `PS617_SYNC.actorStatusFor()` po zatwierdzeniu przez serwer, przy zgodności bieżącego aktu i serwerowego werdyktu.
- Bez serwera końcowa identyfikacja ma status `pending`, nie `confirmed`. Lokalne procedury i zapis są nadal dostępne; **definitywne potwierdzenie finału offline nie jest dostępne**. To świadomy kompromis bezpieczeństwa.
- Po synchronizacji wyraźnie odróżniany jest autorytatywny werdykt serwera od symulacji lokalnej. Nie dodano nowych źródeł ani warunków odblokowania.

### Granice ochrony

To nie jest pełne przeniesienie całej fabuły na serwer. `index.html` nadal zawiera scenariusz, opcje dialogowe, teksty dowodów i logikę lokalnych minigier, więc zdeterminowany odbiorca może poznać część zdarzeń przez analizę źródła strony. Bez dużej przebudowy mechaniki offline nie da się jednocześnie utrzymać pełnej samodzielności przeglądarki i całkowicie ukryć rozwiązań. Nie deklaruj, że wszystkie sekrety są już chronione.

## Testy

```bash
npm run build
npm run check
npm run test:stage3-636
npm run test:unified633
npm run test:priority1
npm run test:witnesses
```

Przed produkcją przeprowadź test stagingowy: HTTP 404 na `/lib/server-canon-618.json` i `/lib/trusted-witness-canon-624.json`, dostępność `/`, `/assets/` i `/api/interview`, scenariusze opóźnień Z.ai i Groq oraz zapis i końcowy werdykt w rzeczywistym Supabase.

**Nie modyfikowano GitHuba, Vercel ani bazy Supabase.**
