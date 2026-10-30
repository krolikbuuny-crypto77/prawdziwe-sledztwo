# Raport QA — Prawdziwe Śledztwo 6.36 AI First, poprawki przed GitHubem

## Wdrożone poprawki

1. **Brak cichego lokalnego zeznania.** Odpowiedź HTTP 200 musi zawierać `serverCanonical`, `decision=answer`, `semanticVerified`, `provider=zai|groq`, poprawny tekst i identyczny `turnId`. Każdy błąd przywraca pytanie i wyświetla możliwość ponowienia. Identyczny tekst AI i lokalnego szkicu jest dopuszczalny tylko jako rzeczywiście zatwierdzona odpowiedź AI.
2. **Cofanie nieudanej tury.** Gdy chmura nie odpowie lub klient odrzuci tekst, usuwana jest prowizoryczna para pytanie–odpowiedź, a zmienione przez lokalny szkic pola NPC4, NPC9, stanu symulacji, zdarzeń i audytu powiązań są odtwarzane z migawki (z pominięciem pól zmodyfikowanych późniejszymi czynnościami). Rejestry PS65/PS68 usuwają nieudaną turę. Odmowy i obowiązkowe reakcje proceduralne pozostają skryptowe.
3. **Ponowienie bez duplikatów.** Przeglądarka przydziela stały `turnId` próbie i zachowuje go po błędzie w sessionStorage. Serwer zapisuje ten identyfikator razem z zatwierdzonym tekstem i modelem w JSONB sesji Supabase. Ponowienie tej samej tury zwraca zapisany tekst, bez nowego zapytania do modeli. Konkurencyjny CAS sprawdza istniejący identyfikator po konflikcie; użycie identyfikatora dla innego pytania jest odrzucane. Bez nowej migracji DB.
4. **Wymagane AI.** Usunięto przełącznik `PS_INTERVIEW_AI_ONLY=false`, który umożliwiał dawny lokalny fallback przy awarii chmury. Kolejność Z.ai → Groq bez zmian. Gdy oba zawodzą: 503 i możliwość ponowienia.
5. **Diagnostyka.** `GET /api/status` deklaruje spójnie API `6.36`, wydanie `6.36-AI-FIRST-HARDENED` i politykę `required`, bez danych konfiguracyjnych i sekretów.
6. **Testy.** Dodano nowy test idempotencji i kolizji `turnId`, test przeglądarkowy nieprawidłowego HTTP 200 i cofnięcia liczników, zaktualizowano test 6 świadków oraz test fotografii `VIS-02` do kontraktu z `turnId`.

## Testy zaliczone lokalnie

- `npm run build` i `npm run check` — zgodność kodu, manife­stu, składni, 75 grafik WebP i 9 MP3, brak konfliktów architektury.
- `node tools/test-pre-github636.mjs` — trwały identyfikator tury, ponowienie bez podwójnego zapisu, odmowa ponownego użycia `turnId` z innym pytaniem, brak lokalnego fallbacku przy ustawieniu `PS_INTERVIEW_AI_ONLY=false`. Mock Supabase, nie prawdziwa baza.
- `python tools/test-pre-github-browser636.py` — odrzucenie błędnego HTTP 200, rollback stanu NPC4/NPC9/symulacji i pamięci; następna odpowiedź AI wyświetlona poprawnie. Chromium.
- `node tools/test-ai-required637.mjs` oraz `python tools/test-ai-required-browser637.py` — awaria modeli, przełączenie Z.ai → Groq, brak lokalnego zeznania.
- `node tools/test-stage1-636.mjs`, `test-stage1-diagnostics636.mjs`, `test-stage2-636.mjs`, `test-stage3-636.mjs`, `test-dialogue635.mjs` — PASS.
- `python tools/test-cloud-evidence635.py`, `test-stage2-sync636.py`, `test-audit634.py` — PASS.
- `python tools/test-stage4-636.py` — 390, 768, 1280 i 1920 px, PASS.
- `python tools/test-navigation.py` — 320, 390, 768 i 1440 px, PASS.
- `python tools/test-saves.py` — eksport/import, autosave, reset, 11 wersji migracji, PASS.
- `python tools/test-witnesses.py` — 24 tury interfejsu na symulowanym API, 720 odpowiedzi lokalnego silnika jako *wewnętrznego modelu kanonu*, bez udzielania tych odpowiedzi graczowi w razie awarii AI — PASS.

Zbiorczy `npm run test:pre-github` zaliczył wszystkie wykonane podtesty do zakończenia testów zapisów; polecenie zostało przerwane zewnętrznym limitem procesu przed końcem. Pozostałe wymienione testy uruchomiono osobno, z wynikiem PASS. Nie traktujemy całości jako jednej nieprzerwanej zaliczonej sesji.

## Ograniczenia i sprawdzenia wdrożeniowe

- **Brak rzeczywistego testu Vercel, Z.ai, Groq i Supabase.** W szczególności nie weryfikowano rzeczywistych opóźnień, czasów 60 s funkcji, synchronizacji i autorytatywnego finału.
- **Idempotencja trwała zależy od Supabase i identyfikatora sesji w cookie.** Gdy serwerowy zapis jest wyłączony albo pierwsza odpowiedź z ustawieniem cookie ginie przed jego zapamiętaniem przez przeglądarkę, odtworzenie tury między instancjami nie jest gwarantowane. Przed przesłuchaniami warto sprawdzić wstępny handshake `/api/game-state`.
- **Optymistyczny rollback** odtwarza pola, których od wykonania lokalnego szkicu nie zmieniły inne czynności użytkownika. Osobne mechanizmy zdarzeń ze skutkami ubocznymi wymagają jeszcze testów rzeczywistej wielozadaniowej sesji.
- Testy archiwalne oczekujące lokalnej odpowiedzi po obu awariach (`test-api624-integration.mjs` i część historycznych `test:api629`) są już sprzeczne z nowymi wymaganiami i nie stanowią kryterium akceptacji polityki AI First.
- Nie zmieniono GitHuba, Vercel ani produkcyjnego Supabase.

**Rekomendacja:** wdrożyć na gałąź testową/Preview, sprawdzić stabilne cookie, scenariusz przerwanego HTTP po zapisie do Supabase, scenariusze dostawców 429/503, następnie dopiero po akceptacji wprowadzić na `main`.
