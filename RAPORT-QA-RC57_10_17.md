# RC57.10.17 — Raport QA fotokartoteki

## Zakres
- Baza: RC57.10.16. Zmiany w `src/core/case-engine.js` (renderowanie zdjęć), `src/story/80-animated-faces-622.js` (spójne portrety w scenach), `src/styles/103-dossier-visual-rc571015.css` (ramki fotograficzne i responsywność) oraz sześć plików w `assets/portraits/`.
- Nie zmieniano szablonu z pytaniami, logiki AI, API, walidatorów faktów, kanonu, systemu dowodów, schematu zapisu ani werdyktu.
- Fotorealistyczne portrety wykonano z zaakceptowanej koncepcji graficznej: **fikcyjne postacie**, nie fotografie rzeczywistych pracowników.

## Zweryfikowano lokalnie
- `npm run build` — PASS. 61 sekcji JS i 64 sekcje CSS.
- `npm run check` — PASS: składnia, manifest, 81 obrazów WebP, 9 MP3, kontrakty zapisu i nawigacji, kanon i dowody.
- `python tools/test-rc571017-photo-dossier.py` — PASS dla 320, 390, 768, 1440, 1920 px: sześć zdjęć załadowanych; miniatura i duży portret tego samego świadka mają identyczną ścieżkę; zero błędów JS i poziomego overflow; jeden panel zachowań; pole własnego pytania zachowane.
- `python tools/test-faces622.py` — PASS na 320/390/768/1440 px, osiem scen, finał, kontroler emocji nadal działa, bez mutowania postępu śledztwa.
- `python tools/test-rc571015-all-tabs-layout.py` — PASS: 10 zakładek na 390/768/1440/1920 px bez poziomego overflow.
- `python tools/test-rc571016-single-behavior-panel.py` — PASS: sześciu świadków na 390/768/1440/1920 px, tylko jeden panel zachowania, reaktywne portrety.
- `node tools/test-rc57-whole-game.mjs` — PASS: 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — PASS: 580 działań śledczych w trzech symulowanych przebiegach.

## Ograniczenia
- Nie przeprowadzono prawdziwych sesji Apinex, Supabase ani testu wdrożenia na produkcyjnym Vercel.
- Fotografie są nieruchome; dotychczasowa animacja poszczególnych części twarzy SVG pozostaje pod fotografią jako fallback, a widoczna warstwa zdjęć reaguje nasyceniem i subtelnym ruchem zależnym od stanu. Nie jest to animacja ust ani mrugania na zdjęciu.
- Weryfikacja braku overflow nie jest gwarancją, że żadna nietypowa kombinacja tekstu i zawartości nie spowoduje lokalnego nachodzenia elementów.
