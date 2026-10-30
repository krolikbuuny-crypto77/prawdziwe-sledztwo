# QA — Prawdziwe Śledztwo 6.36 AI First Release Candidate

**Zakres:** poprawki wykryte przed aktualizacją GitHuba. **Wynik:** wykonane i zaliczone w lokalnych testach; wdrożenie produkcyjne nieweryfikowane.

## Zmiany

1. **`turnId` przy pierwszej odpowiedzi:** `api/interview.js` zwraca identyfikator klienta także po pierwszym udanym zapisie, nie tylko przy odtwarzaniu.
2. **AI First bez niejawnych odpowiedzi lokalnych:** krótkie i nieprawidłowe odpowiedzi przygotowane przez warstwę kanonu nie są wyświetlane jako swobodna wypowiedź; wyjątki są ograniczone do skryptowych reakcji proceduralnych/przełomów.
3. **Jednakowy limit 1600 znaków:** ustawienie formularza, kontrola klienta, walidacja serwera oraz serwerowe przechowywanie oryginalnego pytania. Brak cichego skracania długiego pytania.
4. **Trwałe identyfikatory tur:** `interviewReceipts` pozostają w JSONB sesji niezależnie od konwersacyjnego okna ostatnich 48 wpisów. CAS Supabase nadal rozstrzyga konflikty.
5. **Limit API współdzielony na Supabase:** migracja `supabase/003_interview_limits.sql` definiuje atomowy RPC `ps_allow_interview`, używający istniejącej tabeli `ps_ai_review_usage`. Brak funkcji lub błąd bazy kończy się 503 zamiast wywołania modelu poza limitem.
6. **Ograniczenie skutków roboczej tury:** lokalne zmiany licznika/psychologii/pamięci są wycofywane przed oczekiwaniem na AI. Po akceptacji odpowiedzi system zatwierdza je jednorazowo, a przy błędzie zachowuje poprzedni stan i pytanie do ponowienia.
7. **Handshake sesji:** przed płatnym żądaniem AI przeglądarka ustanawia cookie przez `GET /api/game-state`.
8. **Diagnostyka wydania:** metadane HTML i `/api/status` wskazują `6.36-AI-FIRST-RC`.

## Lokalne testy zaliczone

- `npm run build`, `npm run check`: składnia 61 części JS i 64 CSS, skróty plików źródłowych, 75 grafik WebP, 9 MP3, reguły kanonu i dowodów.
- `node tools/test-release-candidate636.mjs`: odpowiedź zawiera `turnId`; po ponad 24 wymianach odzyskuje stary wpis; pytanie powyżej 1500 znaków pozostaje całe; kolizja identyfikatora i przekroczony limit są odrzucane.
- `node tools/test-pre-github636.mjs`: idempotencja i brak lokalnego fallbacku, symulowany CAS Supabase.
- `node tools/test-ai-required637.mjs`: Z.ai → Groq, obie awarie, brak lokalnego zeznania, bezpieczne logi.
- `node tools/test-stage1-636.mjs`, `test-stage1-diagnostics636.mjs`, `test-stage2-636.mjs`, `test-stage3-636.mjs`, `test-dialogue635.mjs`: PASS.
- `python tools/test-pre-github-browser636.py`, `test-transaction636.py`, `test-ai-required-browser637.py`: odrzucone HTTP 200, puste 503, brak zmian stanu podczas oczekiwania, poprawne zatwierdzenie AI.
- `python tools/test-cloud-evidence635.py`, `test-stage2-sync636.py`, `test-audit634.py`: zaakceptowana fotografia `VIS-02`, weryfikacja materiałów, blokady nieautoryzowanych dowodów i TCMS.
- `python tools/test-stage4-636.py`, `test-navigation.py`, `test-saves.py`, `test-witnesses.py`: testy szerokości 320–1920 px, nawigacja, reset/import/eksport, 11 migracji zapisów, 24 tury API dla 6 świadków i 720 tur kanonu.

**Metoda:** serwer i przeglądarka testowane lokalnie. Z.ai, Groq i Supabase podstawione przez odpowiedzi testowe. Nie było rzeczywistych połączeń do tych usług.

## Wymagane przed `main`

1. Zainstalować i sprawdzić SQL `003_interview_limits.sql` na testowej bazie (w tym dwa współbieżne wywołania z tym samym IP i sesją).
2. Przetestować Vercel Preview z prawdziwym Z.ai, Groq i Supabase: zatwierdzenie pierwszej odpowiedzi, utrata HTTP po zapisie, ponowienie po ponad 24 turach, 429/503, przekroczenia limitu.
3. Zbadać reset i wznowienie sesji, jednoczesne zmiany w innych modułach, zapis serwera przy długich sesjach, poprawność finału.
4. Przeprowadzić pełne ręczne przejście fabuły, test urządzeń mobilnych i zabezpieczeń przed spoilerami.

**Werdykt QA:** gotowy kandydat do Preview po wykonaniu migracji SQL; bez potwierdzenia prawdziwych usług nie kwalifikować jako w pełni zweryfikowane wydanie produkcyjne.
