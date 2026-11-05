# GitHub / Vercel — aktualny punkt wejścia

Wersja repozytorium: **RC57.10.68**. Aktualna i szczegółowa instrukcja wdrożenia znajduje się w [INSTRUKCJA-GLOWNA.md](INSTRUKCJA-GLOWNA.md).

1. Rozpakuj pełny ZIP do pustego katalogu lub nałóż aktualizację na dokładnie RC57.10.67 (wówczas uruchom `npm run migrate:rc571068`).
2. Sprawdź `npm run build`, `npm run check`, `npm run project:doctor` i `npm run test:current`.
3. Wgraj do repozytorium zachowując katalogi `api/`, `lib/`, `src/`, `assets/`, `story-bible/` i `supabase/` oraz `vercel.json`.
4. Użyj **Vercel Preview** do testu odpowiedzi AI, pobierania dowodów i zapisów Supabase przed jakimkolwiek wdrożeniem produkcyjnym.
5. Klucze dostawców i Supabase trzymaj tylko w ustawieniach środowiskowych Vercel; nie umieszczaj ich w ZIP, plikach klienta ani commitach.

Historyczna instrukcja GitHub sprzed etapu porządkowego została zachowana w `docs/historia/instrukcje/GITHUB-WGRYWANIE-PRZED-RC57_10_68.md`.
