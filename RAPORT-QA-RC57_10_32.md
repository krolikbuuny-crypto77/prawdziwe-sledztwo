# RC57.10.32 — czytelność okna zapisu, Oględzin, Dedukcji i skrótów modułów

## Zakres

Ta aktualizacja dotyczy wyłącznie CSS. Zmiany zostały zapisane w źródłowym pliku `src/styles/rc571028-unified-dossier.css` i skompilowane do `index.html`. Metadane `src/build-manifest.json` odpowiadają zaktualizowanemu źródłu.

1. **Poprzednia sesja (`#psResumeOffer`)**: zamiast ciemnego tła i ciemnego opisu — pergamin, ciemne nagłówki i tekst, kontrastowe przyciski i dopasowanie do telefonu.
2. **Oględziny (`#ciFocusCard`)**: ciemny i czytelny tekst instrukcji 4K, metadanych, statusu i pomocy na jasnej karcie. Funkcje badania pozostają takie same.
3. **Dedukcja (`.dd-editor-panel`)**: ciemne etykiety pól, pomocniczy tekst i kontrastowe pola wejściowe; utrzymana edycja i zapis istniejących kart.
4. **Nawigacja w modułach (`.sv2-subnav`)**: jeden pergaminowy pasek z czytelnymi przyciskami i wyróżnieniem aktywnego elementu. Nie zmieniono identyfikatorów przycisków ani przewijania do sekcji.

## Testy wykonane

- `npm run build` / `npm run check` — PASS, w tym zgodność kompilacji z kodem źródłowym, integralność 61 sekcji JS i 64 sekcji CSS, manifestu i zasobów.
- `python tools/test-rc571032-contrast.py` — **35/35** kontroli kontrastu przeglądarkowego w Chromium na szerokościach **320, 390, 768, 1440 i 1920 px**, brak poziomego wychodzenia poza ekran.
- `node tools/test-rc57-whole-game.mjs` — **380/380** reguł śledztwa.
- `node tools/test-rc57-playthrough.mjs` — **580** działań śledczych w symulowanych przejściach.
- `node tools/test-rc571013-negations.mjs` — **600/600**, w tym 60 negacji.
- `python tools/test-saves.py` — PASS (wznowienie, nowa gra, eksport, import, autosave).
- `python tools/test-navigation.py` — PASS (10 zakładek na czterech szerokościach).
- `python tools/test-rc571031-ui.py` — test nie zakończył się w limicie czasu; **nie zaliczono go** jako ponownie wykonanego.

## Materiały porównawcze

Zrzuty z realnego, lokalnego Chromium znajdują się w `QA-RC571032/`: `wznowienie-1440.png`, `wznowienie-390.png`, `ogledziny-1440.png`, `ogledziny-390.png`, `dedukcja-1440.png`, `dedukcja-390.png`, `skroty-1440.png`. Okno wznowienia w teście jest zbudowane z dokładnie tych samych klas i treści, lecz wyświetlone testowo bez faktycznego nadpisywania zapisu użytkownika.

## Granice

Nie testowano połączenia z rzeczywistym Apinex, produkcyjnej bazy Supabase ani pełnej dostępności na sprzętowych czytnikach ekranu. Pomiar kontrastu porównuje obliczone kolory z charakterystycznym tłem; nie jest certyfikatem WCAG całej gry. Zmiany nie dotyczą silnika przesłuchań, faktów, dowodów ani zasad werdyktu.
