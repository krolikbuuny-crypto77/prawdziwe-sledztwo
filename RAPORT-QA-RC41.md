# RC41 — raport testowy

Zakres: automatyczna oś czasu oparta na odkrytych źródłach, bez modyfikacji silnika fabuły, API i SQL.

- `npm run build` — PASS.
- `npm run check` — PASS (identyczna liczba sekcji, nowe pliki w istniejącym manifeście).
- `python tools/test-rc41-auto-timeline.py` — PASS na 320 / 390 / 768 / 1440 px (brak ujawnienia zdarzeń bez dowodów, odsyłacze do akt i cytatów, ostrożne etykiety zeznań, brak HTML injection, rozbieżności ręczne, integralność zapisu).
- `node tools/test-rc39-collab.mjs`, `python tools/test-rc39-collab-browser.py` — PASS (dwie strony i przejmowanie sterowania, głosowanie).
- `python tools/test-rc40-staged-browser.py` — PASS (notatnik i finał).
- `python tools/test-rc356-jsonb-integrity.py` — PASS (synchronizacja JSONB, dwuosobowa).

Nie sprawdzano produkcyjnych połączeń Vercel/Supabase ani rzeczywistych, płatnych lub darmowych modeli AI. Regex czasu nie zastępuje rozumienia wypowiedzi i nie jest źródłem rozstrzygającego ustalenia.
- `python tools/test-navigation.py` — PASS (320 / 390 / 768 / 1440 px; dostosowano test do 32 podłączeń nawigacji).
- `python tools/test-saves.py` — PASS (SHA-256, cofnięcie błędnego importu, 11 starszych schematów, eksport/import i autosave).
- Zbiorcze `npm run test:rc41`: pełny łańcuch przekroczył limit środowiska podczas ostatniego ponownego uruchomienia testu RC40. Test RC40 był wcześniej zaliczony osobno; nie traktujemy ograniczenia czasowego jako zaliczenia tego łańcucha.
