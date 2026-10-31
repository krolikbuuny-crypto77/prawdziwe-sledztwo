# Prawdziwe Śledztwo RC35.1 — czat graczy w pokoju dwuosobowym

## Nowa funkcja

Po utworzeniu pokoju lub dołączeniu do niego na pasku wspólnej gry pojawia się **Czat**. Obie osoby, także obserwator bez uprawnienia do sterowania ekranem, mogą pisać do siebie bezpośrednio, w tym podczas oczekiwania na odpowiedź AI. Wiadomości są aktualizowane co ~2 sekundy przy otwartym czacie lub co ~6,5 sekundy przy zamkniętym panelu (wtedy widać licznik nieprzeczytanych). Enter wysyła wiadomość, Shift+Enter wstawia nową linię. Limit: 600 znaków w jednej wiadomości.

To czat między graczami, **nie przesłuchanie**. Wiadomości nie są przekazywane do modeli AI, pamięci świadków, odblokowań dowodów ani reguł werdyktu. Czat nie wydaje tokenów AI. Podczas przejęcia sterowania oraz zmiany widoku rozmowa w czacie pozostaje dostępna obu osobom.

## Instrukcja instalacji na istniejącym Vercel

1. Jeśli nie uruchamiano jeszcze migracji pokoju, w **tym samym projekcie Supabase** uruchom w SQL Editor `supabase/004_coop_rooms.sql`.
2. Następnie uruchom **nową migrację** `supabase/005_coop_chat.sql` — tabela prywatnych wiadomości i serwerowa funkcja bezpiecznego dodawania wiadomości. Migracje mają być uruchamiane w tej kolejności. **Nie wklejaj SQL do Vercel**.
3. Wgraj pełną RC35.1 albo, jeśli masz już dokładnie RC35, pliki małej poprawki do dotychczasowego repozytorium GitHub. Nie twórz kolejnego projektu Vercel.
4. Sprawdź zmienne Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` (co najmniej 32 znaki). Nie dodawaj tych wartości do HTML, JS w przeglądarce ani publicznego repozytorium.
5. Wdróż i sprawdź w dwóch przeglądarkach: A tworzy pokój, B dołącza kodem, oboje otwierają **Czat**, wysyłają po jednej wiadomości. B może pisać nawet jeśli A steruje grą.

**Uwaga:** bez migracji 005 czat wyświetli komunikat o niedostępności bazy; pozostałe elementy pokoju RC35 powinny działać nadal.

## Prywatność i trwałość

- Wiadomości są zapisywane w prywatnej tabeli Supabase i dostępne wyłącznie członkom aktualnie istniejącego pokoju za pośrednictwem podpisanego ciasteczka i API Vercel.
- Gospodarz i gość mają etykiety „Gospodarz” / „Gość” zamiast nazw kont. Brak osobnego logowania.
- Ostatnie 80 wiadomości jest przywracane po odświeżeniu; w długiej aktywnej sesji interfejs pokazuje maksymalnie 150 najnowszych wiadomości. Wszystkie wiadomości istnieją w bazie do zamknięcia pokoju.
- Po **Zamknij pokój** wiadomości są usuwane przez `ON DELETE CASCADE`. Nie są zapisywane w pliku JSON rozgrywki. Jeśli chcesz je zachować, należy dodać osobny eksport czatu.
- Serwer przyjmuje maksymalnie 600 znaków i wymusza minimum sekundową przerwę między wiadomościami jednego gracza oraz maksymalnie 20 wiadomości na minutę. Powtórzenie wysyłki z tym samym identyfikatorem nie powiela wiadomości.
- Ochrona przed XSS: tekst jest wstawiany jako `textContent`, bez interpretacji HTML.
- Nie ma nowych kluczy API ani dodatkowych połączeń do modeli AI.

## Testy lokalne

`npm run check`
`node tools/test-rc351-chat.mjs`
`python tools/test-rc351-chat-browser.py`
`node tools/test-rc35-coop.mjs`

Testy z rzeczywistym Supabase, prawdziwym kontem Vercel oraz dwoma fizycznymi urządzeniami wymagają wdrożenia i uruchomienia obu migracji.
