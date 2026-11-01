# Prawdziwe Śledztwo 6.36 — AI First Release Candidate

Wydanie **6.36-AI-FIRST-RC** obejmuje wszystkie Etapy I–IV i poprawki przed wdrożeniem.

## Jak przygotować wdrożenie testowe

1. Nie nadpisuj jeszcze produkcyjnej gałęzi `main`. Prześlij zawartość ZIP na osobną gałąź i przetestuj wdrożenie Vercel Preview.
2. Na **testowej instancji Supabase** uruchom migracje w kolejności:
   - `supabase/001_game_sessions.sql`, o ile jeszcze nie została zainstalowana;
   - `supabase/002_ai_review_limits.sql`, o ile jeszcze nie została zainstalowana;
   - **`supabase/003_interview_limits.sql` — obowiązkowa nowa migracja**.
   Nowa funkcja `ps_allow_interview(uuid,text)` globalnie limituje żądania AI; brak tej funkcji powoduje bezpieczne wstrzymanie przesłuchań (503), a nie uruchomienie lokalnego zeznania.
3. Ustaw na Vercel serwerowe zmienne `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` (co najmniej 32 znaki), `ZAI_API_KEY`, `GROQ_API_KEY`. Nie umieszczaj wartości kluczy w kodzie HTML ani repozytorium.
4. Sprawdź `GET /api/status` — `release` powinno wynosić `6.36-AI-FIRST-RC`; pole `aiPolicy` powinno mieć wartość `required`.
5. Sprawdź `GET /api/game-state` (powinno ustanowić podpisane cookie sesji), następnie swobodne pytanie do świadka, prezentację zatwierdzonego materiału i retry po utracie HTTP.
6. Sprawdź 429 (limity), 503 (awaria obu modeli), odświeżenie strony, ponowienie tego samego `turnId`, zamknięcie i ponowne otwarcie sesji, zapis finału i zachowanie 6 świadków.
7. Dopiero po przejściu testów Preview scal gałąź do `main`.

## Najważniejsze zmiany

- Pierwsza poprawna odpowiedź AI zawsze zawiera zatwierdzony identyfikator `turnId`.
- Serwer przechowuje podpisane odpowiedzi w `interviewReceipts`, **niezależnie od skracanej do 48 wpisów historii przesłuchania**. Powtórzenie identyfikatora odzyskuje tę samą odpowiedź bez generowania i bez kolejnej opłaty limitowej.
- Ujednolicony limit pytania: maksymalnie **1600 znaków** w formularzu, walidacji API i serwerowym zapisie. Pytania dłuższe są odrzucane, nieobcinane po cichu.
- Free-form AI obowiązkowe: **Z.ai → Groq → komunikat i ponowienie**. Odmowy proceduralne i autorskie obowiązkowe kwestie fabularne pozostają skryptowe.
- Zwykła rozmowa jest przygotowywana lokalnie jako szkic kanonu; szkic jest wycofywany przed żądaniem sieciowym. Stan rozmowy i pamięć zostają zatwierdzone dopiero po odebraniu poprawnej odpowiedzi AI.
- Przeglądarka najpierw wykonuje `GET /api/game-state`, ustanawiając cookie sesji, a dopiero potem `POST /api/interview`.
- Wspólny limit zapytań dzięki atomowej funkcji Supabase, a nie pamięci jednej instancji Vercel: **25 nowych prób na sesję na minutę i 150 na anonimowy skrót IP na godzinę**.
- Ujednolicona wersja metadanych przeglądarki i odpowiedzi `/api/status`.

## Ograniczenia

- **Nie przeprowadzono testów na produkcyjnym Vercel ani na rzeczywistych Z.ai, Groq i Supabase.** Migrację `003` trzeba uruchomić i przetestować najpierw w osobnej bazie.
- Idempotencja opiera się na podpisanym cookie sesji: między innymi urządzeniami sesja nie przenosi się automatycznie.
- Rejestr `interviewReceipts` jest przechowywany w JSONB sesji i może zwiększać rozmiar zapisu przy bardzo długich kampaniach. Przed masowym ruchem zalecana jest dalsza optymalizacja przechowywania.
- Kontrola nieudanych tur dotyczy zmodyfikowanych pól gry i pamięci objętych testami; nie przeprowadzono pełnego testu współbieżnych akcji ze wszystkimi innymi modułami.
- Kod przeglądarki nadal zawiera pewne autorskie elementy fabuły. Całkowita ochrona przed analizą źródeł wymaga osobnego audytu.

Do kompilacji: `npm run build`. Do kontroli kodu i zasobów: `npm run check`. Nowe testy: `npm run test:release-candidate` i `npm run test:ai-first-hardening`.
