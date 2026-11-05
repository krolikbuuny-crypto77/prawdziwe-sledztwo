# RC25 — APINEX, Z.ai i lokalna baza

## Kolejność przesłuchań
1. APINEX `free/gpt-6-luna`.
2. APINEX `free/glm-5.3-flash`.
3. APINEX `free/deepseek-v4.1-flash`.
4. Bezpośrednie Z.ai `glm-4.7-flash`.
5. Serwerowy lokalny rejestr wiedzy świadka.

Kolejny model zastępuje poprzedni po błędzie, timeoutcie lub odrzuceniu odpowiedzi. Nie odpytujemy wszystkich modeli po poprawnej odpowiedzi. Każdy model chmurowy przechodzi dotychczasowe kontrole faktów i audyt znaczenia; DeepSeek nie jest osobnym audytorem wszystkich wcześniejszych modeli. Lokalny rejestr oraz obsługa utraty połączenia działają według zasad RC24.

## Wspólny limit APINEX
Trzy modele APINEX korzystają z jednego klucza i limitu konta. Po HTTP 429, 401, 402 lub 403 z APINEX pomijamy pozostałe modele tej usługi w bieżącej turze i przechodzimy do Z.ai. Tak samo obsługujemy rozpoznane błędy 429/401/402/403 w obiekcie error odpowiedzi HTTP 200. W śladzie diagnostycznym pominięcia mają kod shared_provider_limit. HTTP 404, timeout lub odrzucenie treści pozwalają spróbować następnego modelu. Nie ma automatycznych opłat, zmiany na płatny identyfikator ani modeli Subscription only w tej integracji.

## Budżet czasu
Łączny budżet faz AI wynosi 52 s, z rezerwą 1,5 s na zapis. Każdy model APINEX ma maksymalnie 9,5 s na swoje fazy: generowanie do 6,5 s, audyt do 3 s, poprawka do 1 s — dodatkowo ograniczone pozostałym oknem. Z.ai ma pozostały czas: generowanie do 14 s, poprawka do 4 s, audyt do 5 s. Brak czasu nigdy nie uprawnia do zaakceptowania niezweryfikowanej parafrazy. Jeżeli wszystkie modele zawiodą, wraca tekst z lokalnej bazy lub bezpieczna prośba o doprecyzowanie.

Przeglądarka czeka do 57 s; po timeoutcie próbuje lokalnej ścieżki endpointu z tym samym turnId i osobnym limitem 8 s. Serwer Vercel nadal ma maxDuration=60 s. Sieć i operacje Supabase mają własny czas — podane liczby nie stanowią gwarancji czasu całego żądania.

## Wdrożenie Vercel
- Wgraj pełną zawartość RC25 do repozytorium.
- Settings → Environment Variables:
  - APINEX_API_KEY: klucz wygenerowany na Twoim koncie APINEX.
  - ZAI_API_KEY: klucz platformy Z.ai.
- Ustaw Production i ewentualnie Preview. Nazwy modeli są wpisane w kodzie; nie dodawaj zmiennych modeli.
- MISTRAL_API_KEY nie jest używany w przesłuchaniach. Dotychczasowe klucze innych funkcji gry i konfigurację Supabase zachowaj.
- Redeploy musi obejmować kod RC25 i nowe zmienne. Po wdrożeniu odśwież grę.
- /api/status: release=6.38-APINEX-ZAI-LOCAL-RC25, aiPolicy=cloud_with_local_fallback, providers=[apinex-luna,apinex-glm,apinex-deepseek,zai,local].
- Status informuje o obsługiwanej kolejności; nie jest testem kluczy ani dostępności dostawców.
- Nie ma nowej migracji SQL. Brak klucza APINEX pomija trzy pierwsze modele; brak klucza Z.ai pomija Z.ai. Oba brakujące klucze oznaczają lokalną rezerwę.

## Kontrole
Testy kontrolowane sprawdzają dokładną kolejność czterech modeli, zatrzymanie po sukcesie, audyt, timeouty i błędne odpowiedzi, ominięcie wspólnego limitu APINEX, brak kluczy, bramki tajnej wiedzy, trwały replay, konflikt zapisu i twardy timeout transportu. Test klienta wykonuje rzeczywisty kod warstwy wysyłania w VM ze stubami DOM; potwierdza akceptację APINEX i lokalnej odpowiedzi oraz brak zatwierdzania prowizorycznych efektów gry przez lokalną rezerwę. Nie jest to test pełnej przeglądarki.

Nie wykonywaliśmy rzeczywistych wywołań API APINEX ani Z.ai i nie wprowadzaliśmy zmian na Vercel. Dwa przekazane przez użytkownika testy Playground Luny potwierdzają tylko prosty JSON i reakcję na fałszywe założenie. Nie potwierdzają jakości pełnego kontekstu, dostępu do GLM/DeepSeek ani czasu obsługi w grze. Szybkość, faktyczne limity i działanie parametrów API wymagają sprawdzenia po wdrożeniu.

Źródła identyfikatorów i endpointu:
https://apinex.bond/models/free-gpt-6-luna
https://apinex.bond/models/free-glm-5-3-flash
https://apinex.bond/models/free-deepseek-v4-1-flash
