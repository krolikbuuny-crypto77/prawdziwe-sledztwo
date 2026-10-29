# Prawdziwe Śledztwo — Pakiet 6.19 · Fabularna głębia i epilog

Uruchom grę przez `index.html` lub umieść rozpakowaną zawartość tego ZIP-a w głównym katalogu repozytorium. Nie wysyłaj samego ZIP-a jako `index.html`.

**Zawartość:** pełna gra z zasobami, działające moduły 6.18, nowa warstwa 6.19, raport QA, trzy opracowania narracyjne, pełen źródłowy kanon sprawy. Klucze API nie są dołączone.

Zachowaj `api/`, `lib/`, `assets/`, `src/`, `supabase/`, `tools/`, `vercel.json`, `package.json` oraz `index.html`. Przy aktualizowaniu istniejącego repo sprawdź różnice w `api/` i `lib/` przed nadpisaniem działających integracji. Sekretów nie wprowadzaj do plików publikowanych na GitHubie.

**Konfiguracja:** `ZAI_API_KEY`, `GROQ_API_KEY`, zmienne Supabase i Cloudflare, `GAME_SESSION_SECRET` po stronie Vercel. Szczegóły w `GITHUB-WGRYWANIE.md` i `.env.example`. Nie zmieniaj istniejących tabel Supabase bez migracji. Wersja 6.19 nie dodaje nowych tabel.

**Testy:** `npm run build`, `npm run check`, `python tools/test-narrative619.py`, `npm run test:progression`, `npm run test:architecture`, `npm run test:ai-primary`.

**Stan:** lokalnie zbudowane i testowane. Nie zaktualizowano produkcyjnego GitHuba, Vercel ani Supabase.
