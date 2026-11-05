# RAPORT QA — RC57.10.16: bez duplikowania zachowań świadka

## Defekt w RC57.10.15

W interfejsie przesłuchania stan emocjonalny i wskaźniki `Zaufanie / Napięcie / Zmęczenie` pojawiały się równocześnie w `#npc4Panel` (środek ekranu) oraz w stopce portretu `.wp-caption` (prawy fragment nagłówka). Dodatkowo oddzielny `#witnessQuickState` prezentował powtórnie nazwę nastroju. To była duplikacja UI, nie duplikacja mechaniki.

## Naprawa

- `src/index.template.html`: sekcja `#witnessQuickState` przeniesiona do istniejącego `#npc4Panel`. Został **jeden** punkt wyświetlania zachowania i reakcji.
- `src/core/case-engine.js`: `npc8PortraitMarkup()` renderuje wyłącznie portret i animację bez `wp-caption` oraz dodatkowych trzech wskaźników. `npc8RefreshWitnessPortrait()` pokazuje w jednym panelu krótką wskazówkę bez ponownego cytowania nazwy nastroju. Zmiany w kodzie tylko w warstwie prezentacji.
- `src/styles/103-dossier-visual-rc571015.css`: układ reakcji jako część panelu wskaźników; brak osobnego kafelka przy nagłówku.
- `src/build-manifest.json` i `index.html`: odtworzona zgodność z powtarzalnym procesem `npm run build`.
- Trzy przyciski zmiany podejścia, selektor dowodu, własne pytania, animacje twarzy, zapisy i protokół stanu postaci **bez zmian**.

## Lokalne testy

- `npm run build` — PASS (61 modułów JS, 64 sekcje CSS, bez zmian liczby skryptów).
- `npm run check` — PASS (zgodność z kodem źródłowym, kompilacja, rejestr zaufanych dowodów).
- `python tools/test-rc571016-single-behavior-panel.py` — PASS dla 6 świadków × 390/768/1440/1920 px = 24 kontrole UI; jeden zestaw trzech wskaźników w `#npc4Panel`, zero zestawów w portrecie; animowane oczy i usta oraz mimika reagująca na zmianę napięcia, brak poziomego overflow, zachowane przyciski i pole pytania.
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli mechanik gry.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań w symulowanych przejściach.
- `python tools/test-rc571015-dossier-layout.py` — PASS, cztery rozdzielczości; bez nakładania listy świadków na rozmowę i pola wpisu na przycisk.

## Ograniczenia

Wymienione testy nie są równoznaczne z testem produkcyjnego Vercel, realnego Apinex ani wszystkich możliwych ustawień urządzenia. To poprawka wizualna i nie modyfikuje danych kanonu, odblokowywania dowodów, walidatorów AI, pamięci ani danych Supabase.
