# Raport QA 6.29 — audyt i naprawa API

**Zakres:** `api/interview.js`, `api/evidence-review.js`, `lib/server-state.js`, `lib/trusted-evidence-629.js`, `supabase/001_game_sessions.sql`, `supabase/002_ai_review_limits.sql`, klient Cloudflare i testy.

| Ryzyko | Zmiana | Test |
|---|---|---|
| Wycofany model Groq | GPT OSS 120B, mapowanie starej nazwy z Vercel, JSON Object Mode, niski wysiłek rozumowania | `test-api629`, `test-api627` |
| Obaj dostawcy AI niedostępni | Vercel zwraca lokalną odpowiedź, nawet bez kluczy | `test-api629` |
| Fałszywy fallbackReason | Brak fałszywego `groq_not_configured`, jeśli Z.ai odpowiedział | `test-api68`, `test-api627` |
| Fałszowanie źródeł w Cloudflare | Dane dokumentów z rejestru, kontrola zatwierdzenia Supabase i zapisanych zeznań | `test-api629` |
| Nieautoryzowane wywołania i limity | Origin + nagłówek klienta + sesja + RPC per IP/sesja (fail-closed) | `test-api629` |
| Brak jawnego prawa DELETE | `GRANT DELETE` w 001 i migracji 002 | statyczna kontrola SQL, test endpointu z mockiem |
| Zmiana treści źródeł przy budowaniu gry | rejestr generowany z tego samego `case-content.js` co gra | `check-trusted-evidence629.mjs` |

Testy prowadzono przy użyciu symulowanych odpowiedzi upstream oraz Supabase, bez sekretów produkcyjnych. Testy nie są gwarancją produkcyjnej dostępności usług. Migrację 002 należy uruchomić przed wdrożeniem 6.29.
