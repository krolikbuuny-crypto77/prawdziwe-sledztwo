# Prawdziwe Śledztwo — RC57.2: rzeczywiste testy przesłuchań AI

## Co zmienia wersja

Dodatkowy, odrębny tryb w prywatnym panelu `https://<twoja-domena>/admin/testy`:

- **Deterministyczny szybki**: dotychczasowe 60 przypadków bez API.
- **Deterministyczny pełny**: dotychczasowe 600 przypadków bez API.
- **Prawdziwe AI — krótki**: 18 pytań (3 dla każdego z 6 świadków).
- **Prawdziwe AI — długi**: 72 pytania (12 dla każdego z 6 świadków), w tym nawiązania do wcześniejszych odpowiedzi, sprostowania, nacisk i pamięć.

Wybrany dostawca: Apinex Luna lub Z.ai (bez Gemini). Generowanie i weryfikacja odpowiedzi odbywają się **tym samym serwerowym mechanizmem `attemptInterview` co w grze**, z ograniczonym, serwerowo przygotowanym zbiorem dozwolonych faktów. Nie ma dostępu do rzeczywistych pokojów, zapisów, werdyktów, API odblokowującego dowody ani do zmian w Supabase. Nie jest to test pełnej produkcyjnej sesji z bazą: mierzona jest izolowana logika rozmowy i jej audyt AI.

Raport AI zawiera każde pytanie, odpowiedź, świadka, dostawcę, czas odpowiedzi i wynik kontroli. **Ostrzeżenia** dotyczą między innymi identycznych powtórek, stylu oraz odpowiedzi o pamięci i nacisku, które trzeba ocenić ręcznie. Uznanie odpowiedzi za zgodną z faktami nie dowodzi pełnej naturalności rozmowy.

## Instalacja

1. Zachowaj pełną kopię działającej **RC57.1 Hobby bez Gemini** oraz kopie zapisów.
2. Jeśli masz tę wersję, rozpakuj `Prawdziwe_Sledztwo_RC57_2_HOBBY_TESTY_PRAWDZIWEGO_AI_POPRAWKA.zip` i wgraj jego zawartość do katalogu głównego repozytorium w GitHub z zachowaniem ścieżek. Alternatywnie skorzystaj z pełnej paczki RC57.2.
3. Upewnij się, że w katalogu `api/` jest **12 plików `.js`**. Jeśli w repozytorium nadal pozostają `api/status.js` i `api/admin-rc57-ui.js`, **usuń je**. Ich zadania obsługuje `api/admin-rc57.js`. Nie wystarczy tylko dodać pliki.
4. W Vercel → projekt → Settings → Environment Variables pozostaw istniejące `RC57_ADMIN_PASSWORD` i `RC57_ADMIN_SECRET` (nie udostępniaj ich). Dodaj **`RC57_LIVE_TEST_ENABLED` = `true`** dla Production. Musi istnieć `APINEX_API_KEY` i/lub `ZAI_API_KEY` dla wybranego dostawcy.
5. Wykonaj redeploy produkcji i upewnij się, że wdrożenie ma status Ready.
6. Wejdź na `https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy`, zaloguj się, wybierz *Rzeczywiste przesłuchania AI*, dostawcę i zakres, zaznacz potwierdzenie użycia limitów, kliknij **Testuj prawdziwe AI**.
7. Po zakończeniu kliknij **Eksportuj rozmowy JSON**. Ten plik możesz przesłać do analizy. Odświeżenie strony usuwa wyniki z pamięci karty, więc pobierz raport przed zamknięciem.

## Limity i bezpieczeństwo

- **Darmowy plan Hobby**: nadal **12 funkcji**. Nie dodano nowego endpointu API, tylko obsługę jednej dodatkowej akcji przez `api/admin-rc57.js`.
- **Koszty i limity AI**: na jedno pytanie może przypaść kilka rzeczywistych wywołań do dostawcy (generacja, semantyczna kontrola, ewentualna korekta). Test 72 pytań może więc zużyć **więcej niż 72 wywołania**. Żaden model nie jest wywoływany przez 60/600 testów deterministycznych.
- **Wyłączenie**: aby uniemożliwić kolejne testy sieciowe, usuń `RC57_LIVE_TEST_ENABLED` albo ustaw `false` i wykonaj redeploy. Tryb jest domyślnie wyłączony.
- **Bez sesji graczy**: w testach AI są tylko fikcyjne rozmowy oparte na dozwolonym kanonie. Nie używa się produkcyjnych zapisów ani sesji Supabase.
- **Zabezpieczenia**: tylko sesja administratora, ta sama domena żądania, jawne potwierdzenie, jeden krok/test na żądanie, podpisana historia HMAC, limit długości historii i wybór tylko dwóch serwerowo zdefiniowanych modeli.
- **Nieograniczone powtarzanie**: ponieważ nie dodawano bazy liczników, brak jest globalnego dziennego limitu wykonywania testów we wszystkich instancjach serverless. Nie uruchamiaj wielu testów jednocześnie.
- **Przerwanie**: przycisk zatrzymuje test po bieżącym pytaniu; zapytania już wysłanego do dostawcy nie można cofnąć.
- **Brak weryfikacji produkcyjnej**: przed wydaniem wykonano testy z podstawionymi odpowiedziami AI i bez prawdziwych kluczy dostawców; wyniki z prawdziwym Apinex/Z.ai pojawią się dopiero po wdrożeniu.

## Co nie zostało zmienione

Główny ekran gracza (`index.html`), kanon, lokalna baza faktów, zapisy, bramki dowodów, kooperacja, werdykt i model kolejki produkcyjnych przesłuchań.
