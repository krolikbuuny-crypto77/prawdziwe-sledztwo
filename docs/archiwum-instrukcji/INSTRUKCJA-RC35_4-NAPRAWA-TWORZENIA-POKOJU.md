# Prawdziwe Śledztwo RC35.4 — naprawa `coop_storage_unavailable`

## Potwierdzona usterka
W `lib/server-state.js` poprzednia wersja wykonywała `response.json()` po każdym udanym żądaniu, poza HTTP 204. PostgREST po `POST` z `Prefer: return=minimal` typowo odpowiada HTTP **201 Created, bez treści**. Tworzenie pierwszej sesji właściciela lub nowej wspólnej sesji kończyło się wtedy wyjątkiem JSON i `coop_storage_unavailable`, mimo że zapis do bazy mógł się udać. Testy wcześniejszych paczek nie wychwyciły tego, ponieważ atrapa bazy odpowiadała HTTP 204.

Poprawka: odczytujemy `response.text()` i pustą odpowiedź traktujemy jako sukces, natomiast JSON parsujemy tylko gdy istnieje. Aktualizacja testów odtwarza HTTP 201 z pustą treścią.

## Druga możliwość — brak migracji albo złe uprawnienia
Jeśli po wdrożeniu RC35.4 pojawi się komunikat, że nie znaleziono tabeli pokoi, sprawdź Supabase SQL Editor:

```sql
select
  to_regclass('public.ps_game_sessions') as sesje,
  to_regclass('public.ps_coop_rooms') as pokoje,
  to_regclass('public.ps_coop_messages') as czat,
  to_regprocedure('public.ps_commit_session(uuid,integer,jsonb)') as zatwierdzanie;
```

Brak `ps_game_sessions` → migracja `supabase/001_game_sessions.sql`.
Brak `ps_coop_rooms` → migracja `supabase/004_coop_rooms.sql` (po 001).
Brak `ps_coop_messages` → migracja `supabase/005_coop_chat.sql` (po 004).
Brak `ps_commit_session` → migracja 001 lub niepoprawne uruchomienie jej funkcji.
Nie uruchamiaj ponownie SQL 001/004/005 bez potrzeby i nie usuwaj istniejących tabel.

## Wdrożenie
1. Wgraj całą RC35.4 albo poprawkę na dokładnie RC35.3 do tego samego repozytorium GitHub i wdrożenia Vercel.
2. Upewnij się, że projekt Vercel ma `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` (sekret ma minimum 32 znaki). Nie kopiuj wartości kluczy do zgłoszeń.
3. Otwórz stronę i kliknij „Utwórz pokój”. Przy powtarzającym się błędzie sprawdź zakładkę Vercel → Logs, funkcję `/api/coop`. RC35.4 zapisuje tam etap, np. `load_shared_session`, `commit_shared_session`, `insert_room`, bez danych gry i sekretów.
4. Jeśli zwracany jest błąd `coop_rooms_table_missing_or_cache_stale`, sprawdź tabelę `ps_coop_rooms` i ewentualnie odśwież schemat PostgREST w Supabase: `NOTIFY pgrst, 'reload schema';`.

## Testy
- `npm run build && npm run check`
- `node tools/test-rc35-coop.mjs` — obejmuje HTTP 201 bez treści, utworzenie pokoju oraz brak tabeli.
- `node tools/test-rc351-chat.mjs`
- `python tools/test-rc35-browser.py`
- `python tools/test-rc351-chat-browser.py`
- `python tools/test-navigation.py`

Nie wywoływano produkcyjnego API Supabase ani nie modyfikowano Twoich tabel. Nie są wymagane żadne NOWE migracje SQL dla samej poprawki RC35.4.
