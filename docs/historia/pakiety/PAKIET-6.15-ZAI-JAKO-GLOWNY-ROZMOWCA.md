# Pakiet 6.15 — Z.ai jako główny silnik rozumienia pytań

## Cel
Z.ai samodzielnie interpretuje pytanie w swobodnej polszczyźnie, dobiera już dopuszczone fakty i tworzy odpowiedź w osobowości świadka. Lokalny WitnessEngine nadal rozstrzyga warunki fabularne, przygotowuje bezpieczną wiedzę i zapewnia pełną odpowiedź awaryjną.

## Zmiany

1. **Z.ai jako główny autor widocznej odpowiedzi.** Przy dostępności API odpowiedź lokalna jest obliczana w tle, lecz w interfejsie pojawia się jedynie informacja o formułowaniu zeznania. Po akceptacji wyświetlana jest odpowiedź Z.ai. Po błędzie/usunięciu odpowiedzi wraca dokładne zeznanie lokalne.
2. **Priorytet sensu oryginalnego pytania.** Lokalny plan intencji jest tylko sugestią. Model ma rozwiązać odniesienia z kontekstu rozmowy, odróżnić pytanie o przyczynę, obserwację, źródło wiedzy, negację i zarzut, oraz obsłużyć wszystkie części pytania.
3. **Dwa przebiegi AI.** Pierwszy wybiera maksymalnie cztery dopuszczone fakty i tworzy język odpowiedzi, a drugi niezależnie ocenia trafność, pokrycie całego pytania i zgodność z faktami.
4. **Nowy kontrakt API (wersja 3).** Wymaga jawnego `complete:true` z audytu całego pytania; odpowiedź niepełna wraca do lokalnego silnika. Wersja 2 API pozostaje kompatybilna.
5. **Zachowanie kanonicznej pamięci.** Autoryzowana parafraza Z.ai zostaje widoczna i zapisana w rozmowie, ale nie nadpisuje wewnętrznego rejestru zatwierdzonych zeznań. Nie odblokowuje dowodów, przełomów ani finału.
6. **Enter i przycisk „Wyślij”** korzystają z tego samego kontrolera. Spóźniona odpowiedź z poprzedniej sesji jest ignorowana.

## Architektura tury

`pytanie gracza -> WitnessEngine (uprawnienia / dozwolony bank faktów / lokalny fallback) -> Z.ai (rozumienie + odpowiedź) -> Z.ai (niezależny audyt semantyczny) -> walidator serwera i klienta -> jedna widoczna odpowiedź`.

## Ograniczenia

- Integracja była testowana z symulowanym serwerem Z.ai, bez połączenia do prawdziwego konta. Poprawy **realnej jakości językowej** ani skuteczności na nieznanych pytaniach nie można jeszcze przypisać modelowi.
- Dwa wywołania modelu zwiększają koszt i opóźnienie. Maksymalnie po 9 sekund na wywołanie po stronie serwera, do 26 sekund po stronie przeglądarki.
- Maksymalnie 36 fragmentów dozwolonej wiedzy na turę i do czterech wybranych faktów. Jeśli odpowiedź jest niedostępna, obowiązuje lokalna wersja. AI nie posiada całej ukrytej wiedzy postaci.
- Faktografia i dostęp do dowodów pozostają oparte na stanie gry w przeglądarce. Nie jest to serwerowo autorytatywny, odporny na celową manipulację klientem model bezpieczeństwa.
- Audyt AI może się mylić; jego pozytywny wynik nie gwarantuje poprawności każdego zdania.
- Użycie nowszego modelu zmienia `ZAI_MODEL` w zmiennych środowiskowych Vercel; przed wdrożeniem należy sprawdzić dostępność dla konkretnego klucza.

## Wdrożenie

Rozpakuj ZIP do repozytorium. Zachowaj aktualne `api/evaluate` oraz `lib/` (nie ma ich w paczce). Ustaw `ZAI_API_KEY` i opcjonalnie `ZAI_MODEL` wyłącznie w konfiguracji Vercel. Uruchom `npm run build`, `npm run check`, `npm run test:ai-primary`. Sprawdź Vercel Preview i rzeczywiste odpowiedzi Z.ai przed produkcją.
