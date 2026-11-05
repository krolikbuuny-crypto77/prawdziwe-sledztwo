# RC57.10.27 — optymalizacja układu

## Zmiana
Ostateczne reguły responsywne dla komputerów, laptopów, tabletów i telefonów w `src/styles/103-dossier-visual-rc571015.css`. Nie zmodyfikowano żadnego skryptu mechaniki ani serwerowych API.

## Potwierdzone testy lokalne
- `npm run build` — PASS.
- `npm run check` — PASS (struktura, hash manifestu, kanon i dowody).
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 kontroli logiki.
- `python tools/test-saves.py` — PASS, w tym eksport, import i autosave.
- `python tools/test-rc571027-responsive.py` — PASS, 320, 390, 560, 768, 1024, 1280, 1440, 1648, 1920 px oraz 390 × 560.
- Użycie 50 wiadomości nie zmienia pozycji formularza względem dokumentu i przewijanie protokołu pozostaje wewnętrzne.
- Przełącznik mobilny „Wybór świadka / Przesłuchanie” działa w obie strony; orientacja pozioma 1024 px nie ukrywa rozmowy.
- Jeden formularz `#chatInput`, jeden `#chatSend`, trzy oryginalne podejścia, jeden selektor zdobytych dowodów.
- Brak poziomego przewijania w testowanych szerokościach, pole pytania w pełni widoczne.

## Ograniczenia
Nie wykonano testu prawdziwego API Apinex ani zapisu do zdalnego Supabase. Symulacja 50 wiadomości jest wyłącznie testem UI. Zgodność wizualna z makietą nie jest pikselowa. Wdrożenie na produkcji wymaga weryfikacji Vercel Preview.
