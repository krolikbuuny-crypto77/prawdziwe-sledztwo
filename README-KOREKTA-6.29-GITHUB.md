# Korekta paczki 6.29 — zgodność plików GitHub

Ta paczka zawiera wszystkie pliki z wersji 6.29 oraz trzy brakujące pliki
kompatybilności: `api/evaluate.js`, `api/status.js` i `lib/common.js`.

- `api/evaluate.js` przekazuje obsługę do zabezpieczonego `api/evidence-review.js`.
  Stary, niezabezpieczony endpoint NIE został przywrócony.
- `api/status.js` to prosty kontrolny endpoint bez informacji o kluczach API.
- `lib/common.js` pozostaje dla zgodności z dawnym kodem.

**Aktualizacja z 6.25:** wklej wszystkie pliki z archiwum do katalogu
repozytorium. Nie usuwaj `.git`, nie kopiuj sekretów z `.env`.
W GitHub Desktop żółte kwadraty oznaczają zmienione pliki, zielone plusy
nowe pliki. Ostrzeżenie LF/CRLF nie jest błędem kompilacji.

Ta korekta nie zmienia ustawień Vercel ani Supabase. Wymagany SQL 6.29
pozostaje taki sam. Po Commit i Push sprawdź nowe wdrożenie Vercel.
