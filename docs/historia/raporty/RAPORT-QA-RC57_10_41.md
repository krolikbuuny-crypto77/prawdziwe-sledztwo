# RC57.10.41 — Quality & UX

## Baza
Pełny projekt RC57.10.38 oraz poprawki prezentacyjne RC57.10.39 i RC57.10.40 przeniesione do arkusza/źródeł; nowy kod jest składany reprodukowalnie z `src/index.template.html`.

## Zakres
- Mobilny panel przesłuchań: poprawione wysokości obszaru wiadomości, dostępność pola pytania, karty świadków, przewijanie długich wiadomości i podświetlenie aktywnego przełącznika.
- Oględziny: dopasowanie fotografii i kontrolek 4K do wąskich ekranów.
- Wspólne elementy: kontrast, klawiaturowy fokus, wysokość przycisków, kompaktowe rozwijane sekcje.
- Puste listy dowodów i źródeł: czytelny komunikat bez ujawniania materiałów.
- Zapisy: czytelniejszy, kompaktowy istniejący komunikat o niedostępnym zapisie. Żadna awaria serwera nie została ukryta ani naprawiona bez dostępu do produkcyjnego systemu.
- Subtelne separatory aktowe dla pozostałych modułów.
- Obrazy w Aktach, Laboratorium, Notatniku, Dedukcji i Finale: `loading=lazy` / `decoding=async` dla zdjęć poza aktywnymi kadrami. Nie zmienia dostępu do zasobów.

## Pliki
- `index.html` (generowany z szablonu)
- `src/index.template.html`
- `assets/ui/rc571039-40-preserved.css`
- `assets/ui/rc571039-preserved.js`
- `assets/ui/rc571041-quality.css`
- `assets/ui/rc571041-performance.js`

## Testy wykonane w tym środowisku
- `node tools/build.mjs` — PASS.
- `node tools/check.mjs` — PASS (reprodukowane źródła, składnia, zasoby i punkty integracji).
- `node tools/audit-overrides.mjs` — PASS.
- `python tools/test-saves.py` — PASS (round-trip, migracje, rollback, uszkodzony autosave).
- `python tools/test-navigation.py` — PASS (10 modułów, szerokości 320, 390, 768, 1440 px, eventy i ARIA).
- `node tools/test-rc57.mjs` — PASS (600 testów deterministycznych, nie rzeczywiste dialogi AI).
- Statyczne parsowanie obu nowych plików CSS — 0 błędów składni.

## Ograniczenia
- Ręczny, bezpośredni test nowego wyglądu w Chromium i zrzuty „po” nie zostały wykonane: przeglądarka zgłosiła `ERR_BLOCKED_BY_ADMINISTRATOR` dla lokalnej strony i plików.
- Nie potwierdzono działania integracji Apinex/Supabase na Vercel.
- Interfejs wymaga porównania wizualnego na Vercel Preview, zwłaszcza telefonu z otwartą klawiaturą i oględzin 4K.
- Nie obiecujemy, że każda możliwa kombinacja dynamicznych stanów jest poprawna.
