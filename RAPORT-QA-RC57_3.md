# Raport techniczny — RC57.3 (audit of the investigation)

## Nowe pokrycie

- **380 unikatowych** kontroli serwerowego przebiegu sprawy w 13 grupach, wszystkie zaliczone na danych testowych.
- **29 kontraktów HTML** panelu „Sprawdź ekran gry” — przeszły na lokalnie podstawionym prawdziwym `index.html`.
- Test przycisku uruchamiania 380 kontroli i eksportu raportu w Chromium: 390 px oraz 1440 px — zaliczony.
- API: akcja `game-batch` wymaga zalogowanej sesji administratora, poprawnego Origin oraz limituje partię do 20. Brak zewnętrznych żądań i brak zapisów do Supabase.
- **12 funkcji Vercel Hobby**, bez nowych tras serwerowych.
- Zachowano 600/600 starszych przypadków RC57.1, testy izolowanego modelu AI RC57.2 oraz wybór dostawców bez Gemini.

## Dodatkowa regresja

- Logika kooperacji (tworzenie pokoju, dostęp gościa, przejęcie sterowania) — istniejący test regresyjny zaliczony na mockowanej bazie.
- Zapis, import, eksport, SHA-256, rollback i 11 migracji — test Playwright zaliczony.
- Nawigacja przy 320, 390, 768 i 1440 px — test Playwright zaliczony.
- `npm run check`: składnia, suma plików, manifest, spójność kanonu i dowodów — zaliczony.
- Starszy `test-rc41-auto-timeline.py` nie ukończył się w tej sesji: proces Playwright przerwany (`EPIPE`) po limicie czasu. NIE raportujemy jego zaliczenia. Nowe 60 kontroli serwerowej osi czasu przeszło.

## Ograniczenia

Przeprowadzony test nie odtwarza pełnego E2E dwóch rzeczywistych przeglądarek podłączonych do produkcyjnej bazy Supabase, nie mierzy wydajności sieci ani rzeczywistych kosztów/zachowania dostawców AI. Zastosowane stany z pełnym zestawem dokumentów są testowymi fixture i służą do sprawdzania warunków i werdyktu, a nie dowodzą, że gracz może przejść całą ścieżkę przy normalnych ograniczeniach.

Nie wdrażano do Vercel ani GitHub. Przed wdrożeniem trzeba sprawdzić, że nie pozostały dwa stare endpointy będące już pod trasą admina.
