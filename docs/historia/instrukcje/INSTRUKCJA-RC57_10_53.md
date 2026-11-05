# RC57.10.53 — poprawa nawigacji, nagłówka świadków i kontrastu skrótów

**Baza:** pełna RC57.10.52. **Rodzaj:** poprawka wyłącznie prezentacyjna.

## Instalacja
1. Zrób kopię aktualnej wersji gry i eksport zapisu.
2. **Pełna wersja:** rozpakuj `Prawdziwe_Sledztwo_RC57_10_53_CZYTELNOSC_PELNA.zip` i wdroż na Vercel Preview.
3. **Aktualizacja:** tylko dla pełnej RC57.10.52, nadpisz odpowiednie pliki z `Prawdziwe_Sledztwo_RC57_10_53_AKTUALIZACJA_DO_RC57_10_52.zip` (zachowaj katalogi).
4. Przy budowaniu ze źródeł użyj `npm run build` i `npm run check`.
5. Na swoim laptopie sprawdź menu wraz z „Dedukcją” i „Finałem”, nagłówek „Świadkowie (6)” oraz opisy skrótów na Pulpicie przy dotychczasowym zoomie przeglądarki.

## Techniczny zakres
- `assets/ui/rc571053-navigator-contrast.css`: usunięcie limitu wysokości i siatki 10 wierszy z `#nav`, przewijanie całego panelu zamiast ucinania przycisków; krótki, niekolidujący nagłówek listy świadków; wysoki kontrast opisów „Najbliższych działań”.
- `src/index.template.html` i `index.html`: podłączenie arkusza CSS.
- `tools/test-rc571053-visual.py`: test kontrolny prezentacji.
- Tylko dokumenty QA i instrukcje poza tym. Bez zmian w plikach serwera, kanonu, zapisów ani AI.

Przed wdrożeniem produkcyjnym warto porównać zrzuty na fizycznym laptopie i sprawdzić pełne przesłuchanie oraz zapis po stronie Vercel/Supabase.
