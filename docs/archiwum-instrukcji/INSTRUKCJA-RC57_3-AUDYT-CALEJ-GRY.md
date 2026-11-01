# Prawdziwe Śledztwo RC57.3 — rozszerzony tester całej mechaniki gry

## Co jest nowego

W prywatnym panelu `/admin/testy` pojawia się sekcja **Audyt całego śledztwa — RC57.3**.

- Przycisk **Sprawdź mechanikę całej sprawy** przeprowadza 380 niezależnych kontroli rzeczywistych funkcji serwerowych w 13 obszarach.
- Przycisk **Sprawdź ekran gry** wykonuje 29 nieniszczących kontroli elementów dostarczanego HTML. Nie uruchamia skryptów gry ani nie dotyka zapisów.
- Wynik można pobrać do JSON, w tym błędy i zakresy, których test nie obejmuje.
- Poprzednie 600 testów deterministycznych i osobny test prawdziwych modeli AI z RC57.2 pozostają dostępne.

**Uwaga:** To szeroki audyt mechaniki, ale nie automatyczne, pełne przejście wszystkich interakcji przez dwóch graczy w produkcyjnej bazie Supabase. Przypisanie 100% pokrycia rozgrywki do liczby 380 byłoby nieuprawnione. Testy browser smoke i E2E są oddzielne.

## Instalacja

1. Zrób kopię dotychczasowej RC57.2 Hobby i zapisów.
2. Jeśli używasz RC57.2, rozpakuj **POPRAWKA** i wgraj pliki do tych samych ścieżek w GitHub. Aktualizacja *dodaje* `lib/admin-rc57-whole-game.js` oraz podmienia `lib/admin-rc57-ui.js` i `api/admin-rc57.js`; zawiera też testy QA, manifest skryptów i instrukcję.
3. Jeśli chcesz wgrać grę od podstaw, użyj **PELNA**. Przed zatwierdzeniem upewnij się, że usunięto z repozytorium stare `api/status.js` i `api/admin-rc57-ui.js` — są to niepotrzebne funkcje Hobby.
4. Zatwierdź zmiany i sprawdź, czy wdrożenie Vercel otrzymało status Ready.
5. Otwórz `https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy` i zaloguj się dotychczasowym hasłem RC57.
6. Kliknij **Sprawdź mechanikę całej sprawy**, pobierz raport JSON. Następnie kliknij **Sprawdź ekran gry**.
7. Test realnego AI jest osobnym, opcjonalnym trybem: wymaga `RC57_LIVE_TEST_ENABLED=true` i klucza dostawcy. Nie jest uruchamiany automatycznie.

## Bezpieczeństwo i ograniczenia

- 12 plików funkcji w katalogu `api/` — limit Vercel Hobby nie ulega zmianie.
- Brak nowego SQL, kluczy czy zapisów do Supabase. Test nie wymaga ani nie używa `GAME_SESSION_SECRET` do przyznawania uprawnień.
- Panel chroniony dotychczasowym hasłem i sesją; nowe endpointy są tylko akcjami istniejącej funkcji admin-rc57.
- Testy działają na sztucznym stanie testowym. Nie otwierają rzeczywistych pokojów, nie weryfikują łączności Supabase i nie zmieniają postępu prawdziwego gracza.
- Nie sprawdzają rzeczywistych odpowiedzi AI (przeznaczony jest do tego osobny test RC57.2), wydajności 4K ani pełnego doświadczenia mobilnego.
- Przeglądarkowy test dostępności ekranu w panelu sprawdza obecność sekcji/elementów i skryptów w HTML. Nie klika przycisków ani nie weryfikuje płynności widoków.

## Testy developerskie lokalne

- `npm run test:rc57-whole-game` — 380 kontroli mechaniki i przeglądarkowy test panelu, wymaga Chromium i Playwright.
- `npm run test:rc57-complete-local` — dodatkowo dotychczasowe 600 testów, test real-AI z podstawionym transportem, kooperacja, zapisy i nawigacja. Nie wykonuje płatnych żądań API.

## Jak czytać wyniki

- `pass` oznacza, że dany konkretny kontrakt kodu przeszedł test, NIE „cała gra bez błędów”.
- `fail` oznacza odtworzony błąd mechanizmu, który należy naprawić przed wdrożeniem.
- Brak testów rzeczywistej bazy / prawdziwego lobby kooperacji nie jest pozytywnym wynikiem; pola `notCovered` w eksporcie wyraźnie to zaznaczają.
