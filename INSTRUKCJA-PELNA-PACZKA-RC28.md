# Prawdziwe Śledztwo — pełna paczka 6.38 RC28

Paczka zawiera kompletny projekt (katalogi src, api, lib, assets, tools i pliki konfiguracyjne), z poprawką naturalności RC28.

## Pochodzenie
- Bazowe źródła, narzędzia i multimedia: pełne archiwum 6.37 RC9.
- Nowsze, zachowane pliki 6.38 RC27: odzyskane z przesłanego archiwum ZIP (oryginalne archiwum było ucięte).
- Moduły lib: uzupełnione z dostępnego repozytorium GitHub `krolikbuuny-crypto77/prawdziwe-sledztwo` w dniu 31.10.2026. Nie gwarantuje to dokładnej zgodności wszystkich modułów z nieodzyskanym fragmentem oryginalnego ZIP-a RC27.
- RC28: dodano `lib/interview-naturalness-rc28.js` i zmieniono `api/interview.js`.

## Wdrożenie
1. Rozpakuj ZIP.
2. Wgraj ZAWARTOŚĆ rozpakowanego folderu do głównego katalogu właściwego repozytorium GitHub. Zachowaj ścieżki plików. Nie publikuj plików .env z kluczami.
3. Pozwól Vercel automatycznie zbudować nowe wdrożenie.
4. Sprawdź API przesłuchań w działającej grze, przeprowadź kilka kolejnych pytań jednego świadka.

## Weryfikacja
- `npm run build`: PASS.
- `npm run check`: PASS (składnia, aktywa, budowanie, rejestry).
- `node --check` RC28: PASS.
- `tools/test-pre-github636.mjs`: FAIL — starszy test wymagał 503, aktualna implementacja zwraca 200.
- `tools/test-dialogue635.mjs`: FAIL — różnica przyczyny odrzucenia odpowiedzi.
- `tools/test-api624-integration.mjs`: FAIL — różnica kodu statusu 400 wobec 200.
- Nie wykonywano prawdziwych wywołań modeli AI ani testów produkcyjnych Vercel.

Ze względu na niekompletność źródłowego ZIP RC27 i niezaliczone testy regresyjne traktuj paczkę jako **kandydata do testowego wdrożenia**, a nie gwarantowaną wersję produkcyjną. Zachowaj kopię obecnego wdrożenia/repozytorium.
