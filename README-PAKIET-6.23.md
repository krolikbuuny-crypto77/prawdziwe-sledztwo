# Pakiet 6.23 — Przesłuchania, które brzmią jak rozmowa

Wersja wyjściowa: Pakiet 6.22 (animowane twarze). Zachowano istniejące zasoby, 6 świadków, wszystkie mechaniki, stan Supabase i integracje Vercel.

## Wdrożenie

1. Rozpakuj ZIP do gałęzi testowej repozytorium i porównaj zmiany w `api/interview.js` oraz `lib/` z produkcją. Nie usuwaj niezależnego endpointu `api/evaluate` ani własnych plików serwera.
2. Wgraj nowy `lib/spoken-dialogue-623.js` **razem** z `api/interview.js`.
3. Zbuduj i sprawdź: `npm run build`, `npm run check`, `npm run test:natural-dialogue`.
4. Na Vercel Preview sprawdź pytania przy normalnym Z.ai oraz awarii Z.ai/Groq; bez testów z prawdziwymi usługami nie oznaczaj przebudowy jako produkcyjnie zweryfikowanej.
5. Nie publikuj plików `.env` ani kluczy API; pakiet nie wymaga nowych sekretów ani migracji Supabase.

Dokumenty: `PAKIET-6.23-NATURALNE-PRZESLUCHANIA.md`, `RAPORT-QA-6.23.md`.
