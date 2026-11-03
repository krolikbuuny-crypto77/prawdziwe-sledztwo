# RC57.10.35 — automatyczne dopasowanie interfejsu

## Zmiany
Zmiany są wyłącznie wizualne. Układ reaguje automatycznie na szerokość i wysokość okna oraz orientację ekranu. Nie stosowano `zoom` ani `transform: scale()` na całej stronie, aby nie zmniejszać czytelności tekstów.

1. **Komputer i laptop:** płynna szerokość nawigacji i obszaru roboczego, mniejsze puste marginesy, proporcjonalne kolumny w aktach, oględzinach, dedukcji i finale.
2. **Tablet:** jedno- lub dwukolumnowy układ zależny od faktycznego miejsca; elastyczna szerokość kart i paneli.
3. **Telefon:** elastyczne karty, formularze i skróty, mniejsze odstępy bez zmniejszania czcionek; niezależne przewijanie długich danych.
4. **Mała wysokość/klawiatura:** mniejsza wysokość przewijanego protokołu, bez obcinania pola własnego pytania.
5. **Oś czasu:** liczniki przechodzą z układu czterokolumnowego na dwie lub jedną kolumnę.
6. **Dźwięk i wznawianie gry:** wysokość okien dialogowych jest ograniczona dostępnością ekranu, wnętrze można przewijać.
7. **Dostępność:** responsywność przy powiększeniu strony, dotykowe cele oraz `prefers-reduced-motion`.
8. **Kontrast:** zachowano i włączono do źródeł poprawki kontrastu RC57.10.34.

## Testy rzeczywiście wykonane
- Chromium, 10 zakładek × 8 rozmiarów: **281/281 kontroli PASS**, w tym wykrywanie poziomego przewijania, ukrytych zakładek, przycinania pola pytania, liczników Osi czasu i zachowania przy 100 dodatkowych wiadomościach.
- Dodatkowo 10 zakładek × 10 rozmiarów: 100 kontroli, **0 poziomych przekroczeń szerokości** i **0 ukrytych zakładek** (test przed ostatnimi poprawkami liczników i pola pytania; poprawki potwierdzono w testach 281/281).
- Kontrola kompilacji `npm run check`: PASS, 61 sekcji skryptów, 64 sekcje CSS, 81 WebP i 9 MP3, poprawność integracji oraz kanon dowodowy.
- Testy lokalnych zapisów: wersje historyczne, eksport/import, autosave i wznawianie: PASS.
- Nawigacja w 320, 390, 768 i 1440 px: PASS.
- Testy 600 przypadków negacji i 600 przypadków deterministycznych: PASS.

## Ograniczenia weryfikacji
Przeglądarka użyta w teście uruchamia cały interfejs w trybie offline przez `set_content`, a nie produkcyjny Vercel. Zewnętrzne usługi AI i Supabase nie były wywoływane. Nie testowano fizycznego telefonu z wyświetloną klawiaturą ekranową, Safari ani wszystkich stanów dowodowych i konfrontacji. Zgodność z konkretnym obrazem referencyjnym to odrębny audyt estetyczny, nie jest to kopia piksel po pikselu.

## Pliki zmienione
- `index.html` (przebudowana wersja produkcyjna)
- `src/styles/rc571034-contrast.css` (trwałe scalenie poprzedniej poprawki kontrastu)
- `src/styles/rc571035-fluid-viewport.css` (nowy, końcowy arkusz responsywny)
- `src/build-manifest.json` (manifest budowania)
- `RAPORT-QA-RC57_10_35.md`

Nie modyfikowano logiki gry, pytań, dowodów, AI, Supabase, werdyktu ani zapisów.
