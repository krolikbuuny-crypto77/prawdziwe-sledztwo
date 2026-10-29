# Prawdziwe Śledztwo — pakiet 6.25

**Cel:** poprawki nr 1 i 2 po ocenie wersji 6.24 — zgodność lokalnych odpowiedzi z pytaniem i różnorodność stylu świadków.

## Uruchomienie

1. Rozpakuj ZIP do katalogu głównego repozytorium (zalecana osobna gałąź).
2. Uruchom `npm run build` oraz `npm run check`.
3. Uruchom `npm run test:relevance625` i `npm run test:witnesses`, a przed produkcyjnym wdrożeniem pełną regresję.
4. Na Vercel sprawdź prawdziwe rozmowy z Z.ai i Groq na konfiguracji testowej.

Nowy kod to `src/witnesses/82-relevance-and-voice-625.js`, kompilowany do `index.html`. Nie dodaje zmiennych środowiskowych, nie wymaga migracji Supabase i nie zmienia API.

**Ostrożność:** brak danych z realnego API i brak oceny naturalności przez ludzi. Szczegóły i testy: `PAKIET-6.25-TRAFNOSC-I-ROZNORODNOSC-ROZMOW.md`, `RAPORT-QA-6.25.md`.
