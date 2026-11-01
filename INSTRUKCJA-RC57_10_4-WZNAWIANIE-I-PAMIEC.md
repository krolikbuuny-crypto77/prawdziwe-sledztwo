# RC57.10.4 — instrukcja wdrożenia

## Którą paczkę wybrać?

- Jeśli masz już **RC57.10.3**, rozpakuj `Prawdziwe_Sledztwo_RC57_10_4_POPRAWKA_DO_RC57_10_3.zip` i nadpisz dokładnie te pliki w repozytorium, zachowując ich podkatalogi. Wykonaj Commit, a następnie sprawdź Vercel Preview.
- Jeśli **nie wgrywałaś jeszcze poprzednich RC**, użyj pełnego archiwum `Prawdziwe_Sledztwo_RC57_10_4_HOBBY_PELNA.zip` i wgraj pliki do repozytorium zamiast nakładać serię poprzednich poprawek.
- Nie wrzucaj ZIP-a do repozytorium jako jednego pliku: wgraj jego **zawartość**.

## Zmienne i baza

Nie trzeba dodawać nowych kluczy ani wykonywać SQL. Nadal wymagane są właściwie ustawione istniejące zmienne Vercel (`APINEX_API_KEY`, `RC57_ADMIN_SECRET`, `RC57_LIVE_TEST_ENABLED=true` do uruchamiania testów). Nie umieszczaj kluczy API w plikach klienta. Jeżeli opcjonalnego globalnego limitera SQL nie wdrożono, pozostaje wyłączony; limit siedmiu pytań dotyczy pojedynczej karty testera.

## Test po wdrożeniu Preview

1. Uruchom ślepy test 13 i 78 dokumentów. Sprawdź, czy wyrażenia negujące identyfikację przez włókna nie są błędnie oznaczane. Jeżeli AI faktycznie stwierdzi pewną identyfikację, ostrzeżenie powinno się pojawić.
2. Uruchom długi test Marka. Przy pytaniu siódmym sprawdź, czy świadek przypomina własną **pierwszą wypowiedź z rozmowy**, zamiast dopowiadać wcześniejsze ustalenia.
3. Jeśli API zwróci 429, 502 lub brak bezpiecznej wypowiedzi, sprawdź „Wstrzymane próby”, a następnie wznów. Numer pytania nie powinien się zmienić podczas samego błędu.
4. Eksportuj cały raport JSON. Analizuj osobno `results` (zatwierdzone odpowiedzi) i `blockedAttempts` (techniczne/niezatwierdzone próby), a także `qa.productionAudit.rejectedChecks`.
5. Po testach wyłącz testy na produkcji, jeśli nie chcesz zużywać darmowej puli Apinex (`RC57_LIVE_TEST_ENABLED=false`).

## Istotne zastrzeżenie

Nadal nie można zagwarantować, że zewnętrzny model zawsze odpowie bez błędów; system nie przechodzi do kolejnego pytania i nie udaje sukcesu, jeżeli odpowiedź nie została zatwierdzona. Aktualizacja nie zmienia faktów śledztwa ani dotychczasowych zapisów Supabase.
