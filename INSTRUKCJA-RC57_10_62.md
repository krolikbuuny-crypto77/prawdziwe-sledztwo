# Prawdziwe Śledztwo RC57.10.62 — instalacja

1. Zachowaj kopię działającej RC57.10.61 oraz konfiguracji Vercel. Nie zmieniaj kluczy API ani Supabase.
2. **Pełna paczka** zawiera samodzielne źródła. Alternatywnie **paczka aktualizacyjna** zawiera tylko zmienione/nowe pliki do nałożenia na **pełną RC57.10.61**, z zachowaniem katalogów.
3. Nowy `index.html` odwołuje się do **nowego** `ps-css-daff082e95459a10.css`. Ten CSS i `index.html` muszą trafić do *tego samego* deploymentu. Dwa pliki `ps-js-*` pozostają identyczne. Nie ma potrzeby wdrażać ponownie starszego `ps-css-1c98c8862e008a30.css`; po aktualizacji nie jest już używany przez nowy HTML.
4. W katalogu projektu wykonaj kolejno `npm run build`, `npm run check`, `npm run test:rc571062`, `npm run audit:css`. Dodatkowo: `python tools/test-navigation.py`, `python tools/test-saves.py`. Porównanie wizualne `npm run test:rc571062:visual` wymaga Chromium, Playwright i Pillow w lokalnym Pythonie.
5. Otwórz Vercel Preview i w DevTools → Network upewnij się, że `ps-css-*` i oba `ps-js-*` zwracają HTTP 200 oraz że hash pliku CSS odpowiada bieżącej wersji. Sprawdź wszystkie zakładki, formularz przesłuchania, zapisy/wznowienie i brak błędów JS.
6. Dopiero po akceptacji Preview promuj do produkcji. Nie jest potrzebna migracja bazy, przełączenie API ani zmiana kluczy.
7. Jeśli aktualizujesz nakładką, stary `ps-css-1c98c8862e008a30.css` może zostać w katalogu źródłowym jako nieużywany plik. Po upewnieniu się, że nowy deploy działa, można go usunąć; pełna paczka nie zawiera tego starego pliku.

**Ważne:** `npm run test:rc571061:parity` jest historycznym testem sprzed celowej zmiany CSS i w RC57.10.62 nie powinien przechodzić. Używaj aktualnego `test:rc571062:css`.
