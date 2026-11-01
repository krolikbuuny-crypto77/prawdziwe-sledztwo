# Prawdziwe Śledztwo — Pakiet 6.24

Kompletna gra na bazie 6.23. Zawiera serwerowe zabezpieczenie źródeł przesłuchań, trafniejsze lokalne odpowiedzi o karcie T-17, synchronizację niezweryfikowanych tur offline oraz dotychczasowe animacje twarzy i sceny.

## Uruchomienie

Wgraj rozpakowany ZIP do gałęzi testowej repozytorium. Konfiguracja tajnych kluczy API pozostaje na Vercel. Uruchom `npm run build && npm run check`, potem `npm run test:security-624`, `npm run test:natural-dialogue`, `npm run test:progression`, `npm run test:ai-primary`.

Po każdej zmianie `src/data/case-content.js` należy uruchomić `npm run generate:canon` i ponownie przejrzeć wersję serwerową; `npm run check` blokuje niespójny eksport.

## Wdrożenie

Wersja 6.24 nie wymaga nowej tabeli Supabase. Nie umieszczaj kluczy w HTML ani w repozytorium. Przed wdrożeniem produkcyjnym uruchom testy na Vercel Preview z własnym Supabase oraz test odtwarzanego ataku z poprawnym wywołaniem endpointu.
