# RC57.10.64 — instrukcja instalacji i testowania

1. Utwórz kopię aktualnego wdrożenia i ustawień środowiska Vercel. **Nie zmieniaj kluczy API ani konfiguracji Supabase** w związku z tą aktualizacją.
2. Dla samodzielnego wdrożenia użyj **pełnej paczki RC57.10.64**. Jeżeli posiadasz dokładnie RC57.10.63, możesz nałożyć mniejszy ZIP aktualizacyjny, zachowując strukturę folderów (w tym `src/`, `tools/`, `QA-RC571064/`).
3. W katalogu gry uruchom `npm run build`. Komenda usunie stary pakiet `ps-js-60-6bb4f84ca3cf3049.js` i wygeneruje nowe odwołanie z hashem. **Na Vercel wdrażaj `index.html` i odpowiadające mu wszystkie trzy pliki `ps-*` z jednego builda.**
4. Kontrola źródeł: `npm run check`, `npm run test:rc571064:poll`, `npm run test:rc571064:browser`, `python tools/test-saves.py`, `python tools/test-navigation.py`, `npm run test:rc58`. Test wydajności (dłuższy): `npm run benchmark:rc571064`.
5. Użyj **Vercel Preview**, nie od razu produkcji. Sprawdź zakładki przy ekranach 390, 1366 i 1920 px, interfejs pamięci przesłuchań (nowa wypowiedź, zmiana świadka, import), brak błędów JS, zapisy, prawdziwe odpowiedzi AI i ich status.
6. W Chrome DevTools sprawdź Network/Performance/Memory: pobranie nowego JS, cache, FCP/LCP/INP, stan DOM po dłuższej sesji. Wyniki z lokalnego Chromium nie oznaczają identycznej wydajności sieciowej.
7. W razie regresji przywróć **pełną RC57.10.63** i wcześniejszy deployment. Nie ma nowych migracji bazy danych.

Dokładne wyniki i ograniczenia: `RAPORT-QA-RC57_10_64.md`.
