# Diagnostyka AI — RC13

Ta paczka dodaje diagnostykę; nie stanowi jeszcze potwierdzonej naprawy przyczyny błędów na kontach dostawców.

## Wdrożenie i jeden test

1. Wgraj całą zawartość ZIP-a do projektu i wykonaj nowe wdrożenie Vercel. Zachowaj obecne zmienne środowiskowe.
2. Sprawdź `/api/status`: `release` ma wartość `6.37-DIAGNOSTICS-RC13`.
3. Zadaj jedno pytanie świadkowi.
4. W Vercel Logs otwórz nowy wpis `interview-diagnostic` dla `/api/interview`. Rozwiń pełny JSON i pokaż sekcję `providerFailures` oraz `fallbackReason`. Zrzut samego obciętego wiersza może nie pokazać szczegółów.

## Co zapisujemy

`providerFailures` zawiera dostawcę, model, etap wywołania, nasz kod błędu, a dla błędów HTTP również:

- `upstreamStatus`: rzeczywisty status HTTP, np. 400, 429, 503;
- `upstreamCode`: kod z zamkniętej listy, np. `INVALID_ARGUMENT`, `RESOURCE_EXHAUSTED`, `rate_limit_exceeded`; nieznane wartości są zastępowane przez `unknown`;
- `parameterIssue`: bezpieczna klasyfikacja wskazówki o parametrze, np. `thinking_config`, nie surowy opis błędu;
- `quotaKind`: wskazówka z komunikatu dostawcy, np. `tokens_per_minute`; `unknown` oznacza brak rozpoznanej informacji;
- `retryAfterSeconds`: zalecany czas z nagłówka `Retry-After` lub Google `RetryInfo`, albo `null`, gdy dostawca go nie podał.

Nie zapisujemy surowych opisów błędów, promptów, pytań, wypowiedzi, kluczy ani nagłówków autoryzacji. Klasyfikacja parametrów i limitów jest wskazówką, nie potwierdzeniem przyczyny.

Po awarii obu dostawców gra respektuje otrzymany czas ponowienia: blokuje wysyłanie do jego upływu, zachowuje pytanie i nie ponawia żądania automatycznie. Blokada dotyczy bieżącej otwartej gry; nie jest globalnym limitem konta i nie zastępuje ograniczeń serwera. Nieznany czas nie jest zgadywany.

Gemini w przesłuchaniach i audycie nadal używa `medium`. Okno Gemini pozostaje 28 s, całkowity budżet AI 52 s, Groq jest rezerwą. Finał zachowuje dotychczasową konfigurację.

## Weryfikacja

Testy z kontrolowanymi odpowiedziami obejmują błędne parametry Gemini, HTTP 429 Groq, numeryczny i datowany `Retry-After`, Google `RetryInfo`, nieprawidłową treść błędu i brak wycieku tekstów testowych. Test pełnego HTML w JSDOM obejmuje blokadę ponowienia, utrzymanie blokady przy nawigacji i odblokowanie bez automatycznego żądania.

To nie był test produkcyjnych kluczy API ani rzeczywistej dostępności modeli. Paczka wymaga wdrożenia i jednego testu na Vercel.
