# Raport QA — 6.36 AI Follow-up RC4

## Obserwacja użytkownika
- Marek: „Nadzorowałem nocną zmianę i byłem dostępny z biura; nie siedziałem tam bez przerwy, co potwierdza rejestr wejść.” — styl z średnikiem.
- Pytanie „Kto to może potwierdzić?” — HTTP 503, bez informacji o przyczynie.

## Przyczyny i poprawki
1. Naturalny dialog: polecenie językowe oraz lekka normalizacja interpunkcji po wygenerowaniu, przed zatwierdzeniem odpowiedzi. Bez przekształcania faktów.
2. Pytania uzupełniające: kontekst z wcześniejszego alibi i dostępny fakt o braku osobowego świadka całego dyżuru. Warianty „to”, „wtedy”, „w tym czasie” łączą się z poprzednią turą. AI pozostaje odpowiedzialne za interpretację, a serwer za zatwierdzone fakty.
3. HTTP 503: serwer może zgłaszać błędy Supabase albo oba modele mogą zawieść. Bez odczytu konkretnego JSON z produkcyjnego Network nie wiadomo, która przyczyna wystąpiła. Interfejs mapuje bezpieczne kody, bez ujawniania sekretów.
4. Brak lokalnych zeznań po niepowodzeniu AI — zachowany.

## Zaliczone lokalnie
- Kompilacja, kontrola manifestu i integralności.
- Symulowane generowanie Z.ai i audyt semantyczny dla 3 pytań uzupełniających.
- Przeglądarkowa symulacja HTTP 503: odróżnienie braku limitera SQL 003 od błędów modeli, zachowanie pytania i brak lokalnego zeznania.
- Regresje RC3: rozumienie pytań przez modele, relacja z Leną, trwałe ID tur, kontrola 78 dowodów, budżet czasu Z.ai/Groq.

## Niezakończone
- Rzeczywisty Z.ai/Groq w produkcji.
- Rzeczywisty HTTP 503 z ekranu użytkownika — brak pełnego JSON błędu i logów Vercel.
- Integracja z produkcyjnym Supabase/migracją 003.

## Wniosek
RC4 nadaje się do Vercel Preview, nie do bezwarunkowej aktualizacji produkcyjnej.
