# Raport techniczny — RC42–RC49

## Gwarancje architektury

- Wersja zapisu: `PS_V7_COMPLETE_STAGE14`, version 11, SaveManager schema 2, suma SHA-256 — bez zmian.
- `showTab`, `buildSave`, `applySave`, ReasoningEngine, WitnessEngine, EventBus — bez nowego właściciela.
- `src/data/case-content.js`, `lib/trusted-witness-canon-624.json`, `lib/trusted-evidence-629.js`, `src/core/reasoning-engine.js`, `api/evaluate.js` niezmienione.
- Nie dodano nowych table/RPC, API routes ani kluczy środowiskowych.
- RC46 jest jedynym etapem dodającym pole zapisu `rc46Annotations`; stare zapisy bez niego są akceptowane, nowe adnotacje są podpisane razem z całą migawką.
- Dane z historii przesłuchań mogą być cytowane wyłącznie jako relacja, nie jako nowy fakt scenariusza.

## Wykonane testy

- `npm run build`, `npm run check`: PASS (61 JS sekcji, 64 CSS; hash aktywów, kanon i dowody).
- `python tools/test-rc42-49.py`: PASS dla 320, 390, 768 i 1440 px.
- `python tools/test-rc41-auto-timeline.py`: PASS dla 320, 390, 768 i 1440 px.
- `node tools/test-rc37-psychology.mjs`: PASS (kompatybilność pól psychologii).
- `node tools/test-rc39-collab.mjs`: PASS.
- `python tools/test-rc39-collab-browser.py`: PASS (dwóch graczy, przekazanie sterowania i wspólne zapisy).
- `python tools/test-rc356-jsonb-integrity.py`: PASS (PostgreSQL JSONB i zgodność SHA-256).
- `python tools/test-rc40-staged-browser.py`: PASS na 390 i 1280 px.
- `python tools/test-saves.py`: PASS (import/eksport, wszystkie 11 formatów historycznych, uszkodzona suma, autouzapisy, rollback).
- `python tools/test-navigation.py`: PASS dla 320, 390, 768 i 1440 px (zaktualizowano oczekiwaną liczbę hooków).

## Ograniczenia

- Testy API są symulacją lokalną, bez prawdziwej bazy Supabase/Vercel i bez rzeczywistych dostawców AI.
- Automatyczne wskazówki stylu nie potrafią niezależnie potwierdzić psychologicznej wiarygodności każdej wygenerowanej odpowiedzi.
- Wspólne adnotacje RC46 są wpisywane przez sterującego, a drugi gracz może proponować działania przez istniejący kanał uzgodnień RC39; gość nie edytuje bezpośrednio migawki gry.
- Wskaźniki RC47 są analizą pytań, nie ukrytym pomiarem rzeczywistych emocji.
