# RAPORT QA — RC57.10.68 · Porządek projektu

Data: 5 listopada 2026. Baza: RC57.10.67 („Żywi świadkowie 3.0”).

## Zakres

- Przeniesiono **188 historycznych dokumentów** z katalogu głównego do `docs/historia/` (treści archiwalne pozostawione identyczne bajtowo).
- Zachowano **3 kopie poprzednich przewodników** (stare `README.md`, `INSTRUKCJA-GLOWNA.md`, `GITHUB-WGRYWANIE.md`), zastępując aktywne przewodniki zwięzłymi, aktualnymi instrukcjami.
- Dodano katalog historii, mapę architektury, testów i manifest migracji z SHA-256 (`docs/historia/ARCHIVE_MAP_RC57_10_68.json`).
- Dodano bezpieczną migrację `npm run migrate:rc571068`, kontrolę projektu `npm run project:doctor` i aktualne aliasy testowe.
- Uzupełniono reguły `vercel.json` ograniczające statyczny dostęp do katalogów dokumentacji, kanonu, kodu i materiałów testowych; dotychczasowe endpointy i assety mają pozostać dostępne.

## Zgodność

- Bez zmian w `api/`, `lib/`, `src/`, `story-bible/`, `supabase/`, `assets/` i manifestach kompilacji.
- Wygenerowane `index.html`, `ps-js-*`, `ps-css-*` mają identyczne sumy SHA-256 względem RC57.10.67.
- Brak migracji stanu rozgrywki, fabuły, dowodów, modeli, limitów API i stylów klienta.

## Wyniki testów

Wyniki automatyczne i kontrola po rozpakowaniu wydania są zapisane w dalszej części raportu. Testy lokalne nie zastępują Vercel Preview ani rzeczywistych wywołań modeli.

## Ryzyka i ograniczenia

1. Dodatkowe reguły `vercel.json` sprawdzone są statycznie; skuteczność HTTP w rzeczywistym wdrożeniu wymaga kontroli na Vercel Preview.
2. Stare narzędzia historyczne mogą odwoływać się do ścieżek dawnej dokumentacji; cztery ścieżki wykryte jako zależności narzędzi zachowano w katalogu głównym. Reszta wymaga korzystania z nowego indeksu.
3. Testy RC58 korzystają z symulowanych odpowiedzi dostawców, a nie z zewnętrznych modeli AI.
4. Pliki historycznych QA zachowano bez przenoszenia, aby nie zerwać ich powiązań z testami. Nie przeprowadzono masowego refaktoru `src/` lub `lib/`, ponieważ taki refaktor zwiększyłby ryzyko regresji funkcjonalnej.

## Weryfikacja wykonana lokalnie

| Kontrola | Wynik |
|---|---|
| `npm run build` | PASS |
| `npm run check` | PASS — składnia, 61 sekcji JavaScript, 64 sekcje CSS, integralność zasobów i kanonu |
| `npm run project:doctor` | PASS — 191 zarchiwizowanych rekordów (188 przeniesień + 3 kopie), 201 lokalnych odnośników, 15 przypadków ścieżek prywatnych i 10 publicznych |
| `npm run test:humanity-v3` | 196/196 PASS, 6 świadków i 13 przykładów intencji |
| `npm run test:rc58` | PASS — 72 żądania endpointu + 24 kolejne tury, 2228 kontroli wyszukiwania i 1325 kontroli relacji, 0 wywołań zewnętrznych API |
| `python tools/test-saves.py` | PASS — eksport, import, autosave, odrzucenie błędnej sumy, rollback, migracje v1–v11 |
| `python tools/test-navigation.py` | PASS — 10 zakładek × 4 szerokości 320/390/768/1440, brak błędów JS |
| Porównanie z RC57.10.67 | **435/435** zasobów funkcjonalnych oraz wynikowych plików klienta identycznych bajtowo |

Nie stwierdzono funkcjonalnych zmian w grze. Testy opierają się na lokalnym środowisku. Brak rzeczywistego testu Vercel Preview.
