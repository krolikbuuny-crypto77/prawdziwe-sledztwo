# Raport RC57 Hobby — bez aktywnego Gemini

- Funkcje serwerowe w `api/`: **12** (poprzednio 14).
- Zachowane adresy: `/admin/testy`, `/api/status`, `/api/admin-rc57`, `/api/interview`, `/api/coop`, `/api/coop-chat` i pozostałe.
- Brak aktywnej ścieżki Google/Gemini ani Gemini przez Apinex w `SPECIALIZED_CHAINS` i `INTERVIEW_CHAIN`.
- Fallback obrony: Apinex GLM → Groq gpt-oss-120b → Groq gpt-oss-20b.
- Zachowano starsze identyfikatory Gemini wyłącznie dla zgodności wcześniej podpisanych historii.
- `npm run check`: OK.
- `npm run build`: OK; wygenerowany `index.html` identyczny z RC57 źródłowym.
- `npm run test:rc57-hobby`: OK (routing i status, admin auth i CSP, 600 przypadków, dostawcy bez Gemini).
- `python tools/test-rc57-browser.py`: OK (izolowana przeglądarka, mockowane API).
- `node tools/test-rc35-coop.mjs`: OK (mockowany Supabase).
- Starszy `tools/test-state617.mjs`: nie przeszedł z powodu oczekiwań starego schematu serwera; nie jest częścią zestawu akceptacyjnego RC57 i nie stanowi potwierdzenia problemu wdrożenia.
- Brak testu produkcyjnego Vercel (przed wdrożeniem).

WAŻNE: podczas aktualizacji GitHub usuń `api/admin-rc57-ui.js` oraz `api/status.js`. Zwykła aktualizacja ZIP bez ich usunięcia nadal może przekroczyć limit Hobby.
