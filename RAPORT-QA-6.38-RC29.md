# QA: 6.38 RC29 — zgodność dostawcy odpowiedzi

## Błąd odtworzony w RC28
Zasymulowano HTTP 200 z `/api/interview`: `{decision:'answer',serverCanonical:true,semanticVerified:true,provider:'apinex-luna',turnId:<właściwy>,text:<bezpieczna wypowiedź>}`. Interfejs RC28 nie dopisywał zeznania i wyświetlał dokładnie: „Odrzucono nieprawidłową odpowiedź AI. Ponów pytanie.”.

## Wyniki po poprawce
- `node tools/build.mjs`: PASS
- `npm run check`: PASS — składnia, spójność manifestu, liczba sekcji, integralność zasobów, integracja
- `python tools/test-provider-acceptance-rc29.py`: PASS — 12 scenariuszy w Chromium (7 dostawców chmurowych, lokalny fallback, 4 niepoprawne odpowiedzi)
- `python tools/test-transaction636.py`: PASS — niezmienność stanu przed odpowiedzią i zatwierdzony zapis jednej tury

## Znane, wcześniejsze rozbieżności — potwierdzone także w nietkniętej RC28
- `node tools/test-priority631.mjs`: TypeError przy braku `identity` w fiksturze
- `node tools/test-dialogue635.mjs`: oczekiwano `repeated_previous_reply`, otrzymano `corroboration_nonanswer`
- `node tools/test-api624-integration.mjs`: oczekiwano HTTP 200, otrzymano 400

## Nie sprawdzono
- Działającej produkcji na Vercel po nowym deploymencie
- Realnych odpowiedzi od APINEX/Z.ai, rozliczania tokenów i limitów dostawców
- Ogólnego wyniku wszystkich historycznych testów, które wymagałyby osobnego porządkowania
