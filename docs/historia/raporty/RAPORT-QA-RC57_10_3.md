# Raport QA — RC57.10.3

## Zakres

Poprawka faktycznego generowania/akceptacji zeznań, nie jedynie sposobu prezentowania ostrzeżeń. Bez zmian w zasadach odblokowania dowodów, werdyktu, bazie 78 dokumentów czy schemacie zapisów.

## Rozwiązanie

`lib/interview-rc57103-gate.js`: ocena projektów odpowiedzi przez wspólne reguły z testera i istniejący filtr stylu; blokada wyłącznie jawnych błędów i bezpieczny wyjątek dla nieudokumentowanej lokalizacji. Wywołanie z `api/interview.js` po weryfikacji faktów, przed kosztownym audytem semantycznym. `lib/interview-quality-635.js`: powody poprawki konkretne dla rodzaju usterki. `lib/interview-naturalness-rc28.js` i `lib/spoken-dialogue-623.js`: precyzyjniejsze wskazówki dla dwóch modeli. `lib/trusted-interview-624.js`: wyłącznie naturalniejsza awaryjna fraza Magdaleny, bez zmian w autorytatywnym rejestrze faktów. `lib/admin-rc57-live.js`: oznaczenie wydania.

## Sprawdzone

- 6 przypadków złych projektów zeznań zostało wykrytych; 6 rozsądnych, ostrożnych odpowiedzi przechodzi test.
- Produkcyjne `attemptInterview` z podstawionym modelem: wykrywa błędne łączenie sesji Magdaleny z fizyczną lokalizacją, odrzuca projekt przed audytem, przekazuje precyzyjne wskazówki do poprawki; zmodyfikowana wypowiedź przechodzi niezależny audyt semantyczny.
- Dwie kolejne niespójne wypowiedzi nie są automatycznie zaliczane; mechanizm zwraca brak zatwierdzonej odpowiedzi.
- `npm run check`: przechodzi, brak zmian w kanonie i rejestrze dowodów.
- `tools/test-rc57102-live-audit.mjs`, `tools/test-rc57-live.mjs`, `tools/test-rc57-quality.mjs`, `tools/test-rc57-typo578.mjs`, `tools/test-rc57-blind.mjs`: przechodzą.
- 12 plików JS w katalogu `api/`: zgodność z liczbą funkcji Vercel Hobby.

## Ograniczenia

Nie były uruchamiane rzeczywiste płatne/zewnętrzne modele Apinex, nie można więc rzetelnie deklarować 18/18 odpowiedzi bez ostrzeżeń w działającej grze. Pozostawiono ostrzeżenia, jeśli faktycznie powstaje problem. W sytuacji, gdy brak zatwierdzonych faktów o lokalizacji, kontrola nie zmusza modelu do wymyślenia miejsca pobytu. Dodatkowe przepisanie odpowiedzi zużywa limit API, a przy błędach sieciowych nadal obowiązują dotychczasowe tryby awaryjne. Brak ingerencji w produkcyjny Supabase.
