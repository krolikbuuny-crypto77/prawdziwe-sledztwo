# RC24 — Z.ai, Mistral i działająca lokalna rezerwa

## Przyczyna braku lokalnej odpowiedzi
Dotychczasowy endpoint miał politykę AI-required. Po awarii Gemini i Groq zwracał 503. Przeglądarka celowo usuwała prowizoryczną turę i przywracała pytanie. Sama obecność lokalnej bazy nie uruchamiała odpowiedzi po timeoutcie.

## Nowa kolejność przesłuchań
1. Z.ai: `glm-4.7-flash`, zwykły endpoint API `https://api.z.ai/api/paas/v4/chat/completions`. Rozumowanie wyłączone przez `thinking.type=disabled`; format JSON. Bez Coding Plan i bez automatycznego przejścia na płatny FlashX.
2. Mistral: `mistral-small-latest`, endpoint `https://api.mistral.ai/v1/chat/completions`, format JSON.
3. Serwerowy lokalny rejestr wiedzy: bez kolejnego wywołania AI.

Dla odpowiedzi chmurowych pozostaje kontrola identyfikatorów faktów, znaczenia, kompletności, powtórzeń i dokumentów. Odrzucenie odpowiedzi, timeout, błędny JSON, limity lub brak kluczy uruchamiają następną dostępną ścieżkę. Gemini i Groq nie są używane do przesłuchań RC24; pozostałe funkcje gry zachowują własne integracje.

## Czas oczekiwania
- Budżet całej obsługi modeli: 44 s, z rezerwą 1,5 s na zapis.
- Z.ai: generowanie do 14 s, poprawka do 4 s, audyt do 5 s; przy obecnej rezerwie Mistral okno Z.ai nie przekracza 23 s.
- Mistral: generowanie do 10 s, poprawka do 3,5 s, audyt do 4,5 s; każda faza jest dodatkowo ograniczona pozostałym budżetem.
- Twardy wyścig z zegarem działa nawet, gdy transport ignoruje AbortSignal. Nie ma dodatkowych automatycznych prób tego samego API po wyczerpaniu czasu.
- Przeglądarka ma limit 49 s. Po timeoutcie sieci lub odpowiedzi HTTP 5xx próbuje raz wywołać lokalną ścieżkę endpointu, z osobnym limitem 8 s i tym samym turnId. Nie uruchamia ponownie generowania AI.
- Odczyt/zapis Supabase i sieć mają własny czas; powyższe liczby nie są gwarancją czasu całego żądania.

## Zasady lokalnej odpowiedzi
Lokalna ścieżka używa wyłącznie faktów wybranych na serwerze z rejestru danego świadka po sprawdzeniu bramek. Nie ufa polu canonical, faktom ani historii dostarczonym przez klienta. Zwraca dosłowny tekst autorski, nie niezatwierdzoną propozycję modelu. Przykład: po pytaniu o alibi „Kto to potwierdzi?” może wykorzystać osobisty wpis świadka o osobach potwierdzających konkretne kontakty, wraz z ograniczeniem zakresu takiego potwierdzenia.

To ograniczony silnik reguł, nie pełne rozumienie języka. Przy niejasnym odniesieniu, pytaniu wielowątkowym, okazanym dokumencie wymagającym interpretacji albo braku pewnego dopasowania świadek prosi o doprecyzowanie lub wskazuje granicę wiedzy. Nie tworzy brakujących faktów. Lokalne wypowiedzi nie uruchamiają efektów prowizorycznej odpowiedzi starego silnika ani sprostowań i przełomów dowodowych.

Odpowiedź lokalna ma `provider=local`, `localVerified=true`, `semanticVerified=false`. Nie jest przedstawiana jako odpowiedź po audycie AI. Przeglądarka ją akceptuje i pokazuje status „Odpowiedź z lokalnej bazy świadka”. Zapis, pokwitowania turnId, odtwarzanie po utracie odpowiedzi i kontrola równoległej zmiany rozmowy obejmują również lokalny wariant.

Jeśli nie ma żadnego połączenia z serwerem, przeglądarka wyświetla wyłącznie bezpieczną prośbę o doprecyzowanie i kolejkuje ją jako wypowiedź offline, niezweryfikowaną. Pełny prywatny rejestr nie jest kopiowany do przeglądarki. Konflikt stanu, niezatwierdzony dowód i odmowa proceduralna nie są obchodzone przez lokalną rezerwę.

## Wdrożenie
1. Wgraj całą zawartość paczki do repozytorium, zastępując pliki, a następnie wykonaj Redeploy na Vercel.
2. W Vercel → Settings → Environment Variables ustaw klucze jako zmienne serwerowe dla właściwego środowiska (Production, ewentualnie Preview):
   - `ZAI_API_KEY` — klucz API platformy Z.ai, nie klucz innej usługi.
   - `MISTRAL_API_KEY` — klucz API Mistral Studio.
3. Jeśli dodajesz zmienne po wdrożeniu, wykonaj ponownie Redeploy. Nie używaj prefiksów NEXT_PUBLIC/VITE i nie wpisuj kluczy do plików klienta.
4. Zachowaj konfigurację Supabase, GAME_SESSION_SECRET oraz klucze potrzebne innym funkcjom gry. Nie ma nowej migracji SQL.
5. Status `/api/status` powinien pokazać `6.38-ZAI-MISTRAL-LOCAL-RC24`, `aiPolicy=cloud_with_local_fallback`, providers: zai, mistral, local. Odśwież otwartą grę po wdrożeniu.
6. Sprawdź rzeczywiste pytanie. W logu interview-diagnostic zobaczysz dostawcę zaakceptowanej odpowiedzi oraz wcześniejsze błędy. Brak kluczy nie zatrzyma rozmowy, ale wtedy będzie działała jedynie ograniczona lokalna rezerwa.

## Weryfikacja
Przeszły testy kontrolowane: Z.ai, Mistral po timeoutcie Z.ai, awarie obu API, timeout audytu, niepoprawny JSON i identyfikatory faktów, brak kluczy, wymuszona lokalna ścieżka, prywatne bramki, ponowne użycie turnId bez dodatkowego generowania/zapisu, błędny CAS i twardy timeout transportu. Rzeczywisty kod klienta uruchomiono w środowisku VM ze stubami DOM: timeout i 503 przełączają na lokalny endpoint z tym samym turnId; awaria sieci daje bezpieczną prośbę; 409 nie jest obchodzone; lokalna odpowiedź nie zatwierdza prowizorycznych efektów gry. Nie jest to test prawdziwej przeglądarki.

Kontrole budowania, składni, zasobów i rejestru oraz regresje wiedzy, polszczyzny i kontraktu faktów również przeszły. Reprezentatywne żądanie zachowuje 36 faktów i ma 11 557 znaków instrukcji oraz payloadu; nie jest to liczba tokenów.

Nie wykonywano żądań do rzeczywistych Z.ai/Mistral i nie zmieniano konfiguracji Vercel. Dostępność, limity konta, jakość polszczyzny i czas odpowiedzi usług wymagają testu po dodaniu kluczy. Nie obiecujemy gwarantowanej szybkości darmowego API.

Dokumentacja adapterów: https://docs.z.ai/api-reference/llm/chat-completion oraz https://docs.mistral.ai/api/endpoint/chat
