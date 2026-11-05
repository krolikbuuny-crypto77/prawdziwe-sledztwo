# Raport QA — RC57.2 rzeczywiste testy AI

**Stan:** paczka gotowa do wdrożenia, rzeczywisty dostawca AI i produkcyjny Vercel jeszcze nietestowane.

## Testy zaliczone lokalnie

- `npm run build` i `npm run check` — bez błędów; `index.html` SHA-256 identyczny z bazową RC57.1.
- `npm run test:rc57-hobby` — 12 funkcji, niezmienione trasy `/admin/testy` i `/api/status`, 600 z 600 deterministycznych testów, brak aktywnego Gemini, poprzednie sprawdzenia modeli.
- `npm run test:rc57-live` — 18 krótkich i 72 długie kroków u 6 świadków z podstawioną odpowiedzią; poprawne podpisywanie i odrzucanie zmienionych, błędnych oraz nieuprawnionych tokenów; odmowa bez zalogowania lub bez potwierdzenia; wyłączenie trybu przez zmienną środowiskową; próba tego samego silnika `attemptInterview` z imitacją transportu AI.
- Chromium w izolowanym środowisku z podmienionym API — szerokości 390 i 1280 px; potwierdzenie użycia limitów, uruchomienie 18 kroków, postęp, eksport JSON, brak błędów JavaScript.
- Brak nowych funkcji `api/*.js` i brak zapisu do Supabase.

## Czego testy nie potwierdzają

- Działania z rzeczywistym kluczem Apinex/Z.ai ani wyników długiej rozmowy z produkcyjnym modelem.
- Poprawności żywych odpowiedzi semantycznych poza dotychczasowym audytem produkcyjnym.
- Pełnej kooperacji dwóch przeglądarek, stabilności prawdziwej bazy danych czy wydajności produkcyjnego Vercel.
- Twardego, globalnego dziennego limitu wydatków API pomiędzy instancjami Vercel (brak wspólnej trwałej bazy liczników).

## Zakres kontroli jakości

Odpowiedź przechodzi istniejącą kontrolę kanonu i audyt semantyczny, dodatkowo sprawdzane są sztywne sformułowania oraz identyczne powtórzenia. Pytania o pamięć lub reakcję na nacisk są **oznaczane do oceny ręcznej**, mimo przejścia audytu faktów. Raport JSON zawiera pełną treść pytań i odpowiedzi; nie zawiera kluczy API.
