# RC57.8 — literówki graczy, trafniejsze przesłuchania i tester

## Wdrożenie
- Jeżeli masz już RC57.7: rozpakuj ZIP `...POPRAWKA_DO_RC57_7.zip` i **skopiuj jego zawartość do katalogu głównego repozytorium GitHub, zachowując strukturę folderów**. Zastąp wskazane pliki; samo dodanie ZIP do GitHub nie aktualizuje gry.
- Jeżeli masz inną wersję: wybierz paczkę pełną RC57.8.
- Zaczekaj na wdrożenie w Vercel > Deployments, status Ready. Przy błędzie sprawdź logi budowania.
- Nie dodawaj funkcji API: w `api/` ma pozostać **12 plików `.js`**. Jeżeli masz stare `api/status.js` lub `api/admin-rc57-ui.js`, usuń je, zamiast pozostawiać obok aktualnych tras.
- W `Settings > Environment Variables` pozostaw `APINEX_API_KEY`, `RC57_ADMIN_PASSWORD`, `RC57_ADMIN_SECRET`, a dla testów rzeczywistego AI `RC57_LIVE_TEST_ENABLED=true`. Nie potrzebujesz `ZAI_API_KEY`. Po zmianie zmiennych wykonaj Redeploy.
- Wejdź pod `/admin/testy`, wykonaj test 18 pytań na Luna lub Jev, potem pobierz JSON. Zrób również ręcznie próbę w grze: `gdze byles po polnocy?`, `Nie pytam o Lenę, tylko gdze byłeś?`, `Czy możesz pokazać TEC-04?`.

## Co zmieniono
1. **Właściwe formy gramatyczne** dla Elżbiety i Magdaleny w krótkim i długim zestawie pytań.
2. **Audyt odpowiedzi wymijających**: brak wskazania lokalizacji, sprzeczność „byłem przy stanowisku” vs „nie znam miejsca”, powrót do tematu Leny wykluczonego przez pytanie oraz nadmiernie urzędowe wypowiedzi. To ostrzeżenia do oceny człowieka, nie automatyczne stwierdzenie kłamstwa.
3. **Powód odrzucenia odpowiedzi**: tylko bezpieczne, wcześniej dopuszczone kody etapów produkcyjnego audytu, liczba wywołań i poprawek. Bez ujawniania promptów, treści rozmów poza raportem, kluczy ani odpowiedzi API.
4. **Literówki gracza**: bezpieczny parser pytań rozpoznaje drobne błędy popularnych słów (`gdze`→`gdzie`, `nei`→`nie`, `potwirdzic`→`potwierdzic`), także bez znaków diakrytycznych. Oryginalny tekst pytania pozostaje niezmieniony w historii i jest przesyłany modelowi. Przepisów fabularnych, faktów ani dowodów nie modyfikowano.
5. **Instrukcja dla modeli**: interpretować sens niedoskonałego zapisu i wyjaśniać niejednoznaczność, gdy pomyłka dotyczy nazwiska, godziny, negacji lub identyfikatora.

## Ograniczenia
- To ograniczony, deterministyczny słownik i odległość pojedynczej literówki, nie pełny słownik ortograficzny ani semantyczny model języka; przy wielu błędach zrozumienie nadal może się nie powieść.
- Żadne nazwiska, numery dokumentów, znaczniki czasu czy identyfikatory nie są automatycznie poprawiane. AI może poprosić o wyjaśnienie.
- Tryb testowania z prawdziwym modelem zużywa zewnętrzny limit Apinex. Jest zachowana przerwa 35 s i ręczne wznowienie po 429/timeout, ale nie ma gwarancji, że wszystkie 18/72 próby przejdą na darmowym limicie.
- Automatyczne testy dialogów są w większości symulacyjne. Produkcyjną naturalność trzeba ocenić z nowego raportu JSON.
