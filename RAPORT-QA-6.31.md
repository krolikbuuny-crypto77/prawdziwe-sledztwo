# Raport QA 6.31

Zakres: optymalizacja `/api/interview`, stopniowe ujawnianie załączników w zakładce Przesłuchania, zgodność z zapisem.

## Wyniki przeprowadzonych testów
- `npm run build`: **PASS**.
- `npm run check`: **PASS**, w tym manifest źródeł, składnia, 75 obrazów WebP i 9 plików MP3, zgodność kanonu.
- `npm run test:fast-evidence`: **PASS** — zero początkowych eksponatów do okazania, odczyt dokumentu z Akt odblokowuje jego okazanie, nabyty materiał pojawia się, nieodkryte pozostają ukryte, reset i zapis mają pole `reviewedEvidence`.
- `npm run test:priority1`: **PASS** — negacje, alibi, wielowątkowe pytania, pamięć, przełączenia, walidacje.
- `npm run test:api629`: **PASS** — reguły serwerowe, autoryzacja źródeł, limit Cloudflare, diagnostyka.
- `node tools/test-api617.mjs`, `node tools/test-state617.mjs`, `node tools/test-state618.mjs`, `node tools/test-sync617.mjs`: **PASS**.

## Ograniczenia i ryzyka
- Produkcyjne Z.ai, Groq, Cloudflare i Supabase nie były wywoływane. **Nie znamy dokładnego czasu odpowiedzi** przy rzeczywistym obciążeniu.
- Testy wyświetlania w Chrome/Playwright są w tym środowisku blokowane. Potwierdzono logikę renderowania przez izolowane wykonanie fragmentu kodu, nie pełną sesję przeglądarkową.
- Skrócone limity wywołań mogą częściej kierować opóźnione odpowiedzi Z.ai do Groq / fallbacku. Po wdrożeniu należy porównać metadane `provider`, `durationMs`, `fallbackReason`.
- Uwaga: lista startowych 13 dokumentów w Aktach pozostaje dostępna, ale nie zdradza się ich automatycznie w selektorze okazania; użytkownik musi je otworzyć w Aktach.
