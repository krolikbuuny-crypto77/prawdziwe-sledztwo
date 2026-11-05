# Raport QA — RC57.10.51

**Baza:** RC57.10.50. **Zakres:** wyłącznie kolizje menu bocznego i listy świadków. Przygotowano na podstawie dwóch zrzutów użytkowniczki z laptopa.

## Zidentyfikowane błędy

- Przyciski nawigacji miały stałą wysokość i `white-space: nowrap`, przez co dłuższe nazwy zakładek mogły być ucięte.
- W kartach świadków zdjęcia wychodziły poza szerokość kolumny, a tekst bywał przesuwany powyżej górnej krawędzi karty. Problem wynikał z nakładających się historycznych reguł stylów.

## Zmiany i weryfikacja

- Przy szerokości strony 941–1640 px pasek boczny ma 222 px; przyciski mogą zwiększać wysokość i zawijać nazwę.
- Lista świadków: precyzyjnie oddzielone zdjęcie (70 px) i tekst, dopuszczona naturalna wysokość kart, brak ucinania opisów.
- Chromium (390, 768, 950, 1024, 1100, 1280, 1366, 1536, 1920 px): **255/255** testów położenia elementów, przekroczeń i wyświetlania. **0** błędów JS. Test dodatkowej czcionki 18 px zaliczony.
- Faktyczne kliknięcie zakładki Przesłuchania, wybór piątego świadka oraz przejście do Akt — PASS.
- `node tools/build.mjs` — PASS, `node tools/check.mjs` — PASS, `node tools/audit-overrides.mjs` — PASS.
- `node tools/test-rc57.mjs` — PASS (**600 przypadków deterministycznych**).
- `node tools/test-rc571048-retrieval.mjs` — PASS (**2228 kontroli doboru wiedzy**).
- `python tools/test-saves.py` — PASS (migracje, eksport/import, autosave, rollback).

## Ograniczenia

- Nie potwierdzono wyglądu na fizycznym laptopie, pod różnymi ustawieniami skalowania systemu i rozszerzeniami.
- Nie testowano rzeczywistych API AI ani Supabase na produkcji.
- Kontrole 255/255 dotyczą wskazanych kolizji, nie dowodzą braku wszystkich błędów UI w grze.

## Skład paczek

Pełną paczkę zbudowano bezpośrednio z oryginalnego pełnego ZIP RC57.10.50, nadpisując `index.html`, `src/index.template.html` oraz dodając `assets/ui/rc571051-sidebar-witness.css`, dwa lokalne testy i dokumentację. Inne oryginalne pliki pozostają identyczne bajtowo.
