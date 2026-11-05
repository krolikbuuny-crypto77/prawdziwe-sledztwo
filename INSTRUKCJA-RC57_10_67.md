# RC57.10.67 — „Żywi świadkowie 3.0”, etap I

**Baza:** RC57.10.66. **Wdrożenie:** najpierw Vercel Preview.

## Pełny pakiet

1. Rozpakuj pełny ZIP do pustego katalogu. Nie mieszaj plików z innymi wydaniami.
2. Uruchom `npm run check`, `npm run test:humanity-v3` i `npm run test:rc58`. Narzędzia do nawigacji wymagają Chromium/Playwright.
3. Umieść cały katalog w repozytorium/deploymencie Vercel Preview. `api/interview.js` musi pozostać razem z nowym `lib/witness-humanity-v3.js` i zmodyfikowanymi plikami `lib/interview-*`.
4. **Nie zmieniaj zmiennych środowiskowych ani formatu zapisów**; nadal obowiązują konfiguracje Supabase i modeli z dotychczasowej wersji.
5. W Preview sprawdź rzeczywistą rozmowę AI, kontrolę chronologii, sześć stylów postaci i diagnostykę `qualityDiagnostics.humanityVersion`.

## Mała aktualizacja z RC57.10.66

1. Zrób kopię źródeł i ważnych zapisów.
2. Rozpakuj ZIP aktualizacyjny **w katalogu RC57.10.66**, nadpisując istniejące pliki.
3. W tym etapie nie trzeba usuwać starych hashowanych zasobów CSS/JS — pliki klienta są identyczne z RC57.10.66.
4. Uruchom `npm run check`, `npm run test:humanity-v3` i — jeśli możliwe — `npm run test:rc58`.
5. Wdróż ponownie cały projekt na Vercel Preview, gdyż zmieniają się moduły serwerowe, mimo że wygląd gry się nie zmienia.

## Bezpieczeństwo i ograniczenia

- Nie wgrano niczego na GitHub, Vercel ani Supabase.
- AI nadal otrzymuje tylko serwerowo dopuszczone fakty i zatwierdzoną historię rozmowy; plan stylu nie odblokowuje dowodów ani nie tworzy nowych faktów.
- Realne oceny naturalności i wpływu na koszty wymagają testów z aktywnym modelem na Preview. Szczegółowy plan w `RAPORT-QA-RC57_10_67.md`.
