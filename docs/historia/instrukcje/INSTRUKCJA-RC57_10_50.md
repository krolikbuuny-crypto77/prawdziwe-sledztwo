# RC57.10.50 — czytelne logo i data

## Instalacja

- **Pełna paczka:** wypakuj `Prawdziwe_Sledztwo_RC57_10_50_LOGO_DATA_PELNA.zip` do nowej kopii projektu i wykonaj próbne wdrożenie na Vercel Preview.
- **Mała aktualizacja:** użyj `Prawdziwe_Sledztwo_RC57_10_50_AKTUALIZACJA_DO_RC57_10_49.zip` **wyłącznie na wersji RC57.10.49**. Nadpisz zawarte pliki, zachowując strukturę katalogów.
- Nie jest wymagane dodawanie zmiennych środowiskowych, migracji bazy ani zmiany ustawień API.
- Po instalacji możesz uruchomić `node tools/build.mjs` oraz `node tools/check.mjs`. Kontrola fragmentów interfejsu: `python tools/test-rc571050-brand-date.py` (wymaga Chromium i Playwright).

## Zakres

1. Lewa karta `Prawdziwe Śledztwo / Ostatni kurs`: tytuł łamie się w dostępnej szerokości zamiast być ucinany. Zmniejszony emblemat i większe minimalne pole tekstowe.
2. Data `17–18 LISTOPADA 2026` na Pulpicie: tło o ustalonym ciemnym kolorze, większa czcionka, jasne litery, obramowanie i odstępy.
3. Dodatkowa kontrola szerokości 320, 390, 768, 950, 1024, 1366, 1536 i 1920 px.

To aktualizacja prezentacyjna. Nie zmienia AI, kartotek świadków, źródeł, reguł odblokowywania, Supabase ani werdyktu.
