# Aktualna instrukcja — RC57.10.68

**Baza aktualizacji różnicowej:** wyłącznie RC57.10.67. **Bez migracji bazy danych lub zapisów.**
**Zmiana:** uporządkowanie dokumentacji i narzędzi oraz ograniczenie dostępu HTTP do prywatnych materiałów. Kod rozgrywki, AI i generowane zasoby klienta pozostają bez zmian.

## Opcja A — pełne wydanie (zalecane)

1. Wykonaj kopię repozytorium i zapisów gry; rozpakuj pełny ZIP do **pustego katalogu**.
2. Uruchom `npm run build`, `npm run check`, `npm run project:doctor`, a następnie `npm run test:current`.
3. Sprawdź w Vercel Preview przesłuchania sześciu świadków, przejścia, dowody, zapisy i aktualny stan endpointu.
4. Nie zmieniaj kluczy API ani Supabase. Nie publikuj bez wyników testów Preview i potwierdzenia dostawców AI.

## Opcja B — aktualizacja z dokładnej RC57.10.67

1. Zrób kopię całego repozytorium. Nie nakładaj aktualizacji na starsze ani nowsze wydanie.
2. Rozpakuj ZIP aktualizacji **z zachowaniem ścieżek** w katalogu bazowej RC57.10.67.
3. Uruchom `npm run migrate:rc571068`. Usuwa on **jedynie** zduplikowane dokumenty historyczne, których zawartość i bezpiecznie zachowana kopia odpowiadają kontrolnym SHA-256. Pliki zmienione samodzielnie pozostają nietknięte, a polecenie zgłasza konflikt.
4. Uruchom `npm run build`, `npm run check`, `npm run project:doctor` i `npm run test:current`.
5. Potwierdź działanie na Vercel Preview. Nie wprowadzono nowych env ani SQL.

## Ważne zasady

- `README.md` i ta instrukcja są aktualne. Wcześniejsze dokumenty znajdziesz w `docs/historia/` (indeks: `docs/HISTORIA-WYDAN.md`).
- Nie usuwaj katalogów `api/`, `lib/`, `src/`, `story-bible/`, `assets/`, `supabase/` ani plików manifestów. Prywatne materiały są wyłączone z publicznego serwowania, **nie z kodu na serwerze**.
- Testy RC58 są mockami i nie weryfikują rzeczywistych odpowiedzi Z.ai/APINEX ani połączenia Supabase. Produkcja nie została zmieniona.
- Historyczne testy wykorzystujące poprzednie kontrakty API mogą być nieaktualne. Patrz `docs/TESTY-AKTUALNE.md`.
