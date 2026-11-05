# RC57.10.60 — instrukcja aktualizacji

1. Zrób kopię obecnej gry i konfiguracji Vercel. Nie zmieniaj sekretów środowiskowych.
2. **Pełna paczka** jest samodzielna. Dla aktualizacji RC57.10.59 można nałożyć pliki z małego ZIP-a na katalog projektu — **z zachowaniem struktury katalogów**.
3. Nowa wersja wymaga, aby **`index.html` i trzy pliki `ps-css-...css` / `ps-js-...js` zostały wdrożone razem** w katalogu głównym witryny. Brak choć jednego uniemożliwi działanie interfejsu.
4. W katalogu projektu uruchom `npm run build`, `npm run check`, `node tools/test-rc571060-bundle.mjs`, `python tools/test-saves.py`, `python tools/test-navigation.py` i `npm run test:rc58`. Odrębny, dłuższy test wizualny: `npm run test:rc571060:visual`.
5. Uruchom Vercel Preview. Zweryfikuj pliki `ps-*` w Network, liczbę żądań, nagłówki cache, następnie wszystkie zakładki, save/resume, Przesłuchania i brak błędów JS.
6. Przy ponownym wdrożeniu nie zachowuj starych `ps-*` z poprzednich buildów. `npm run build` usuwa nieaktualne wersje plików z hashami.
7. **Nie uruchamiaj dodatkowych migracji Supabase z powodu tej optymalizacji** — żadna nie została dodana. Dotychczasowe wymagania wdrożenia RC58 pozostają ważne.

Dane i logika śledztwa nie zostały zmienione. W przypadku problemów przywróć pełną RC57.10.59.
