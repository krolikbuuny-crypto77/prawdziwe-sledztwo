# RC57.7 — APINEX zamiast Z.ai, wolniejsze i bezpieczniejsze testy

Data: 2026-11-01. Wersja bazowa: RC57.6 Hobby (dokładny pełny ZIP).

## Co zmieniono

- Usunięto Z.ai z aktywnego łańcucha przesłuchań, obu testów AI (18/72 pytań i ślepego testu) oraz listy dostępnych dostawców.
- Dodano `apinex-jev` / `free/jev-1.13` do łańcucha przesłuchań (za pozostałymi APINEX) i obu selektorów testera. Model używa istniejącej zmiennej `APINEX_API_KEY`.
- W serwerze NIE jest wywoływany endpoint `api.z.ai`, nawet gdy pozostał `ZAI_API_KEY`.
- Pozostawiono wyłącznie zgodność wsteczną przy odczycie archiwalnych metadanych zeznań z oznaczeniem `zai`. Zapisów i schematu bazy danych nie zmieniano.
- Tester robi 35 sekund przerwy między pytaniami; nie blokuje to oddzielnych wywołań modelu przez samą grę, dlatego 429 nadal jest możliwy.
- Token wznowienia testu jest ważny do 120 minut w jednej sesji administratora. Po błędzie 429 test nie przesuwa się na kolejne pytanie.
- Tester zgłasza dodatkowo literówki zaobserwowane w przesłanym raporcie (`nadzierałem`, `dyspozyorni`).

## Instalacja do wersji RC57.6

1. Zrób kopię gałęzi GitHub. ZIP `POPRAWKA_DO_RC57_6` jest przeznaczony dokładnie do pełnej wersji RC57.6 Hobby. Rozpakuj i zastąp pliki o tych samych ścieżkach w repozytorium GitHub (nie wgrywaj całego folderu jako podkatalog).
2. Jeśli instalujesz z pominięciem RC57.6, użyj **pełnej wersji** RC57.7.
3. Usuń z GitHub dwa stare pliki `api/status.js` i `api/admin-rc57-ui.js`, **jeśli znajdują się w repozytorium**. W obecnej pełnej paczce ich nie ma; obecność w GitHub zwiększy liczbę funkcji ponad Hobby 12.
4. Zostaw `APINEX_API_KEY`, `RC57_ADMIN_PASSWORD`, `RC57_ADMIN_SECRET` i `RC57_LIVE_TEST_ENABLED=true` na Vercel Production. `ZAI_API_KEY` można usunąć po wdrożeniu — nowy kod z niego nie korzysta.
5. Zrób Deploy/Redeploy na Vercel i sprawdź **Ready**. Otwórz `/admin/testy`, zaloguj się, zobacz modele `Apinex Luna` i `Apinex Jev 1.13` w dwóch testach.
6. Uruchom najpierw test 18 pytań, a potem ślepy test. Eksportuj raporty JSON. Kontroluj limity APINEX; w przypadku 429 wznowienie od bieżącego pytania.

## Uwaga o limitach API

`free/jev-1.13` jest **innym modelem**, ale nie jest osobnym dostawcą ani niezależnym limitem: ten sam klucz APINEX może podlegać wspólnym limitom RPM/TPM oraz limitom kategorii free. W publicznym katalogu APINEX model ma oznaczenie bezpłatnej kategorii bez „Subscription only”; warunki mogą się zmienić. Brak gwarancji, że będzie poprawnie odpowiadał w każdej rozmowie, dopóki nie wykonasz testu na realnym kluczu.

## Weryfikacja lokalna

`npm run check`, `node tools/test-rc57-provider-migration.mjs`, `node tools/test-rc57-quality.mjs`, `node tools/test-rc57.mjs`, `node tools/test-rc57-whole-game.mjs`, `node tools/test-rc57-playthrough.mjs`, `python tools/test-rc57-quality-browser.py`, `python tools/test-rc57-blind-browser.py`, `python tools/test-navigation.py`, `python tools/test-saves.py`. Wyniki sprawdzone lokalnie na atrapach API, nie na koncie APINEX użytkownika.
