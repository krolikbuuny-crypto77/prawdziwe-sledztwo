# RC26 — maksymalny czas oczekiwania 1:30

Limit dotyczy całego pytania i wszystkich modeli łącznie. Kolejność RC25 pozostaje: APINEX Luna → GLM Flash → DeepSeek Flash → Z.ai → lokalna baza. Wcześniejsza poprawna odpowiedź kończy oczekiwanie natychmiast.

## Zmiany
- Przeglądarka wyznacza wspólny termin 90 s przed operacjami sieciowymi (sesja, dowody, pytanie).
- Pierwsze żądanie przerywa po 82 s. Lokalny endpoint ma najwyżej 8 s i zawsze tylko pozostałą część wspólnych 90 s. Jeżeli pozostała 1 s, lokalna próba dostaje 1 s, nie dodatkowe 8 s.
- Timeout lokalnego endpointu obejmuje też odczyt JSON odpowiedzi. Twardy wyścig z zegarem kończy oczekiwanie także wtedy, gdy transport nie respektuje przerwania.
- Jeżeli również lokalny endpoint jest nieosiągalny, wraca bezpieczna prośba o doprecyzowanie w przeglądarce, bez ujawniania prywatnej wiedzy ani zatwierdzania prowizorycznych efektów gry.
- Serwer liczy czas od wejścia do endpointu, a nie dopiero od pierwszej próby AI. Budżet wynosi 90 s, z 18 s rezerwy na zapis/obsługę lokalną i komunikację. Czas faz modeli kończy się najpóźniej około 72 s od wejścia do endpointu; wcześniejsze odczyty Supabase również zużywają ten budżet.
- Każdy model APINEX ma okno do 16 s, generowanie do 10 s, poprawkę do 2 s, audyt do 5 s, zawsze ograniczone pozostałym oknem. Z.ai: generowanie do 16 s, poprawka do 4 s, audyt do 6 s, ograniczone pozostałym wspólnym budżetem. Nie sumujemy pełnych limitów, jeśli nie ma już czasu.
- vercel.json ustawia maxDuration=90 wyłącznie dla api/interview.js.

To ograniczenie oczekiwania aplikacji, nie gwarancja odpowiedzi chmurowej ani dokładności zegara systemowego. Uśpienie karty lub blokada głównego wątku przeglądarki mogą opóźnić wykonanie jej timerów. Nie akceptujemy odpowiedzi AI bez kontroli tylko dlatego, że kończy się czas.

## Wdrożenie
Wgraj pełną paczkę RC26 i wykonaj Redeploy. Zachowaj APINEX_API_KEY oraz ZAI_API_KEY. Nie zmieniasz modeli ani bazy SQL.

Na Vercel Hobby włącz Fluid Compute, jeśli jest wyłączone. Bez Fluid Compute limit funkcji Hobby wynosi maksymalnie 60 s, więc maxDuration=90 wymaga Fluid Compute. Nie zmienialiśmy ustawień Twojego konta Vercel.

Status: release=6.38-90SECONDS-RC26; interviewMaxResponseSeconds=90.

Dokumentacja: https://vercel.com/docs/functions/configuring-functions/duration

## Testy
Kontrole routingu czterech modeli, lokalnej rezerwy, zapisów i ochrony faktów oraz kontrola budowania. Test klienta uruchamia rzeczywisty kod w VM ze stubami DOM i przyspieszonymi zegarami: pierwszy timeout, zawieszony odczyt lokalnej odpowiedzi i lokalna próba z tylko 1 s pozostałego budżetu. Nie czekaliśmy 90 s na prawdziwe API i nie potwierdzamy ustawień produkcyjnego Vercel.
