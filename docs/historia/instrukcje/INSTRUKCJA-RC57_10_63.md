# RC57.10.63 — instrukcja aktualizacji

1. Zachowaj kopię pełnej RC57.10.62 i konfiguracji Vercel. Bez zmian w kluczach środowiskowych i Supabase.
2. Użyj **pełnego ZIP-a RC57.10.63**, albo nałóż **aktualizację RC57.10.62 → RC57.10.63** na pełny katalog RC57.10.62, zachowując strukturę ścieżek.
3. W pakiecie zmienił się produkcyjny plik CSS z hashem i odwołanie w `index.html`. Te dwa pliki należy wdrażać razem. Oba pliki `ps-js-*` nie zmieniły się. Starszy `ps-css-*` jest nieużywany po aktualizacji (przy ręcznym nakładaniu można go usunąć po weryfikacji nowego wdrożenia).
4. W katalogu gry uruchom `npm run build`, `npm run test:rc571063`, `npm run audit:css`, `python tools/test-saves.py`, `python tools/test-navigation.py`. Opcjonalnie z lokalnym Chromium: `npm run test:rc571063:visual` i `npm run benchmark:rc571063`.
5. Po wdrożeniu do Vercel Preview sprawdź na karcie Network, że nowy `ps-css-*` i oba skrypty `ps-js-*` zwracają 200, nie ma brakujących zasobów, a HTML nie jest bezterminowo cache'owany. Uruchom wszystkie zakładki i zapisy. Sprawdź realne przesłuchanie ze skonfigurowanym dostawcą AI oraz brak błędów w konsoli.
6. Po akceptacji dopiero opublikuj na produkcji. Nie wymaga migracji danych ani nowych sekretów. W razie problemu przywróć RC57.10.62.

**Uwaga:** redukcja rozmiaru CSS jest zmierzona lokalnie; przyspieszenie rzeczywistego ładowania na Vercel nie zostało jeszcze potwierdzone.
