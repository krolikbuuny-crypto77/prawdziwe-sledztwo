# Raport QA — 6.24, poprawki po audycie

**Data:** 29 października 2026. **Baza:** Pakiet 6.23. **Testy:** lokalny Node.js + Chromium, symulowane Z.ai/Groq/Supabase.

## Wyniki potwierdzone wykonaniem

| Przypadek | Wynik | Co sprawdzono |
|---|---|---|
| Podmiana banku faktów i fałszywe przyznanie | **PASS — atak odrzucony** | `tools/test-security624.mjs`: klientowy tekst nie trafia do banku wysyłanego dostawcom, brak akceptacji przyznania; kontrola przed audytem |
| Serwerowe bramki wiedzy | **PASS** | Nieudostępniony dokument i sprostowanie są ukryte; po serwerowym zatwierdzeniu dostępne |
| API Z.ai → Groq → fallback | **PASS** | `tools/test-api624-integration.mjs`: awaria, nielogiczna odpowiedź, audyt, sztuczny styl, bank identyczny dla obu dostawców |
| Zapis niezweryfikowanej tury offline | **PASS — jednostkowo** | `record_local_turn` nie modyfikuje `approvedEvidence`, chronologii ani werdyktu |
| Odpowiedź o T-17 | **PASS, 6/6** | `tools/test-quality624.py`: sześć rzeczywistych lokalnych odpowiedzi z gry, wszystkie dotyczą pytanej karty, a nie zastępczych tematów |
| Trzy pytania dla sześciu świadków | **PASS — stabilność** | 18 niepustych odpowiedzi, bez zmian dowodów i poziomego overflow na 390 px; nie jest to benchmark językowy |
| `npm run build` i `npm run check` | **PASS** | 61 modułów JS, 64 CSS, 75 WebP, 9 MP3 i odcisk serwerowego kanonu |
| `npm run test:architecture` | **PASS** | HMAC, CAS, serwerowy stan, mock offline i priorytet dostawców |
| `npm run test:progression` | **PASS** | 51 asercji, 15 etapów minigier, brak klientowego werdyktu |
| `npm run test:natural-dialogue` | **PASS — testy reguł** | Naturalny styl, odrzucanie niepopartych odpowiedzi, failover |
| `npm run test:ai-primary` | **PASS** | Aktywne UI przesłuchań, Enter, przycisk, awaria API |
| `npm run test:witnesses` | **PASS** | 720 tur, sześciu świadków, sprawdzanie pamięci i zapisu |
| `npm run test:saves` | **PASS** | Migracje, eksport/import, reset, autosave |
| `npm run test:inspections-puzzles` | **PASS** | Wszystkie pięć minigier i dostępność interfejsu |
| `npm run test:faces` | **PASS** | 320/390/768/1440 px, sześć animowanych portretów, osiem przełomów i finał |
| `npm run test:cinematic` | **PASS** | Nieliniowe sceny, opcjonalny dźwięk, reduced motion |
| `npm run test:living-story` | **PASS** | Sześć profili, tekstowe relacje i dokumentowe bramki |
| `npm run test:reasoning` | **PASS** | Tablica dedukcji, opinie Cloudflare bez uprawnień do postępu |
| `npm run test:events` | **PASS** | Brak fałszywych zdarzeń i podwójnego zakończenia |
| `npm run test:navigation` | **PASS** | Cztery rozdzielczości, 40 przejść, brak JS errors |

## Nieukończone lub niedostępne

- Pełny sieciowy E2E offline→online na testowej domenie `https://ps617.test` — **BLOCKED** (`ERR_BLOCKED_BY_ADMINISTRATOR` w Chromium). Test jednostkowy kolejki jest pozytywny, ale nie zastępuje E2E.
- Prawdziwe Z.ai, Groq, Cloudflare i Supabase — **NIE TESTOWANO** (brak produkcyjnego środowiska z kluczami).
- Pełne przejście fabuły od początku do wszystkich zakończeń przez człowieka — **NIE TESTOWANO**.
- Naturalność i wiarygodność 100–200 odpowiedzi live AI ocenianych przez niezależnych ludzi — **NIE TESTOWANO**.
- Test penetracyjny całej aplikacji, wielu użytkowników i opóźnień sieciowych — **NIE TESTOWANO**.

**Ocena:** udokumentowany problem P0 został naprawiony dla odtworzonego ataku, a problem P1 z pytaniem o T-17 rozwiązany w sześciu przypadkach. Nie można z tego wywnioskować, że wszystkie dowolne ataki semantyczne lub nieprzewidziane parafrazy są już wyeliminowane.
