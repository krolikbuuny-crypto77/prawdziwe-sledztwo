# RC57.10.29 — naprawa kontrastu i komponentów po RC57.10.28

**Data:** 2 listopada 2026 r.  
**Podstawa:** pełna RC57.10.28.  
**Zakres:** wygląd interfejsu bez zmian mechanik, AI, kanonu, dowodów i zapisów.

## Przyczyna

Warstwa RC57.10.28 zmieniała globalne kolory tekstu i część paneli, ale pozostawiała niektóre podkarty w ciemnych barwach wcześniejszych wersji CSS. Powodowało to ciemny tekst na granatowym tle lub odwrotnie: jasny tekst na pergaminie. Test szerokości nie wykrywa takich regresji.

## Naprawione konkretne miejsca

- Oś czasu 3.0: rzędy luk i dokumentów `.ps-next-row`, ukryty/nieustalony punkt `.tl-locked-msg`, znaczniki `.chip`.
- Notatnik: punkty konfrontacji `.cf-empty` i `.cf-entry`, filtry, przyciski, rejestr źródeł `.ps53-source`.
- Poszukiwania: podświetlony tekst `.ps3-search-guide strong`.
- Dedukcja: `.correlation-summary`, podsumowania korelacji, panele źródeł, `.sim51-*`, `.ps53-card`, `.ps53-link`.
- Oględziny: statystyki `.p1-inspection-extras`, narzędzia `.ov36-advanced`, dodatkowe panele. Ciemna przestrzeń fotograficzna pozostała ciemna, ale z jasnymi etykietami.
- Pozostałe sekcje: jaśniejsze kontenery wspólnych analiz `.ps66-*` i źródła indeksu Akt.

Zmiany zapisano w **tym samym centralnym arkuszu** `src/styles/rc571028-unified-dossier.css`, zamiast rozrzucać dodatkowe style po wielu plikach. Aktualizacja manifestu gwarantuje odtwarzalne budowanie. Dodano `tools/test-rc571029-contrast.py`.

## Wyniki

- `node tools/build.mjs` — PASS.
- `node tools/check.mjs` — PASS (integralność zbudowanego HTML, 61 sekcji JS, 64 CSS, 81 WebP i 9 MP3).
- `python tools/test-rc571029-contrast.py` — PASS (**57/57** kontroli), dziewięć zakładek, trzy szerokości 390, 768, 1440; sprawdzenie rzeczywistych stylów w Chromium i kontrastu zgłoszonych problemów.
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań w trzech symulacjach.
- `node tools/test-rc571013-negations.mjs` — PASS, 600/600 przypadków.
- `python tools/test-saves.py` — PASS, lokalny import/eksport, reset i odzyskiwanie.

Zapisane zrzuty z rzeczywistego Chromium w `QA-RC571029/`: `timeline-1440.png`, `timeline-390.png`, `notebook-1440.png`, `notebook-390.png`, `deduction-1440.png`, `deduction-390.png`.

## Ograniczenia

Test dotyczył lokalnego interfejsu i najważniejszych zgłoszonych stanów. Nie jest to pełny audyt WCAG całej aplikacji, w szczególności dynamicznych stanów powstających dopiero po prawdziwych zapytaniach Apinex. Nie wykonywano żadnych żądań do Supabase, ani wdrożenia na Vercel. Przed publikacją należy potwierdzić te integracje na Vercel Preview.
