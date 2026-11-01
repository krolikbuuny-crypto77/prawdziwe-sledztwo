# Prawdziwe Śledztwo 6.38 — RC57 Hobby, bez aktywnego Gemini

## Co naprawiono
- Zmniejszono liczbę funkcji `api/*.js` z 14 do **12**. Vercel Hobby dopuszcza 12 funkcji dla projektu z bezpośrednimi plikami `api/*.js`.
- Połączono obsługę `/admin/testy`, `/api/admin-rc57` i `/api/status` w jednej funkcji `api/admin-rc57.js` za pomocą przekierowań wewnętrznych (`rewrites`).
- Wyłączono **aktywne** kierowanie zapytań do Gemini, również modelu Gemini przez Apinex. Przesłuchania korzystają nadal z Apinex i Z.ai, a moduły specjalistyczne z Apinex i Groq; lokalne mechanizmy awaryjne pozostają.
- Zachowano stare identyfikatory dostawców w kompatybilności historii i zapisów — nie oznacza to wysyłania do nich zapytań.
- Sam `index.html` gracza **nie zmienił się bajt po bajcie** względem oryginalnej RC57.

## Najważniejsze: usunięcie dwóch starych endpointów w GitHub
Podczas aktualizacji przez przeglądarkę GitHub przesłanie nowego ZIP-u nie usuwa starych plików. Przed wdrożeniem **usuń z repozytorium**:
1. `api/admin-rc57-ui.js`
2. `api/status.js`

Ich kod został przeniesiony odpowiednio do:
- `lib/admin-rc57-ui.js`
- `lib/status-handler.js`

Nie usuwaj `api/admin-rc57.js` ani żadnej innej funkcji API.

## Instalacja
**Opcja A — pełna paczka (najprostsza przy lokalnej kopii repozytorium):** rozpakuj pełny ZIP RC57 Hobby w katalogu projektu, zastępując pliki; następnie usuń oba wymienione wyżej stare pliki API, jeśli nadal w repozytorium występują. Zatwierdź zmiany na GitHub.

**Opcja B — mała poprawka do dokładnie RC57:** skopiuj zawartość poprawki do katalogu repozytorium, zastąp istniejące pliki; usuń oba stare endpointy z katalogu `api/`; zatwierdź zmiany.

Jeżeli używasz interfejsu GitHub, znajdź każdy z dwóch starych plików, wybierz menu `...` i `Delete file`, zatwierdź zmianę. Dopiero potem dodaj/zmień pliki z paczki.

## Zmienne środowiskowe
Zostaw obecne zmienne `APINEX_API_KEY`, `ZAI_API_KEY`, `GROQ_API_KEY`, sekrety Supabase, `GAME_SESSION_SECRET`, `RC57_ADMIN_PASSWORD` i `RC57_ADMIN_SECRET`.
`GEMINI_API_KEY`, `GEMINI_INTERVIEW_MODEL`, `GEMINI_DEFENSE_MODEL` nie są już potrzebne aktywnemu routowaniu. Możesz usunąć je z Vercel po potwierdzeniu, że pozostałe dostawcy działają. Samo usunięcie zmiennych nie ogranicza liczby funkcji.

## Po wdrożeniu
- Vercel: deployment `Ready`.
- Otwórz `https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy` i zaloguj się jak dotychczas.
- `https://prawdziwe-sledztwo-mg15.vercel.app/api/status` powinien zwrócić JSON z `ok:true`.
- Sprawdź przesłuchanie i kooperację w dwóch oknach; serwerowe testy lokalne nie potwierdzają zachowania produkcji.
- Nie wdrażaj poprawek bez kopii działającej RC54/RC57 i zapisów.

## Uruchomienie testów na komputerze
`npm run check && npm run build && npm run test:rc57-hobby`

## Ograniczenia
Tester RC57 nadal wykonuje 60/600 **deterministycznych przypadków**, nie 600 rozmów z prawdziwym AI. Nie modyfikuje Supabase. W teście 600 przypadków (zasilanym na kontrolowanych danych) przechodzi 540, 42 mają ostrzeżenia, a 18 zgłasza błędy interpretacji pytań. Nie twierdzimy, że zostały one naprawione tą aktualizacją. Nie przetestowano wdrożenia na Twoim produkcyjnym Vercel.
