# RC57.10.61 — instrukcja aktualizacji

1. Zachowaj pełny backup RC57.10.60.
2. Rozpakuj pełny ZIP RC57.10.61 albo nałóż mały ZIP **na folder źródłowy RC57.10.60**, zachowując strukturę podkatalogów.
3. Nie edytuj ręcznie generowanego pliku `src/core/case-engine.js`. Rozwijaj wyłącznie części w `src/core/case-engine-parts/`. Instrukcja dla programisty: `src/core/case-engine-parts/README.md`.
4. Uruchom `npm run build`, `npm run check`, `npm run test:rc571061:parity`, `npm run test:rc58` i `npm run audit:css`. Sprawdź także `python tools/test-saves.py`, `python tools/test-navigation.py` oraz testy pod Vercel Preview przed awansem wersji.
5. Gdy zatwierdzasz **nowe zmiany** w częściach silnika, uruchom `npm run sync:case-engine:reviewed`, potem wszystkie testy i nowy test baseline. Historyczny test byte parity RC57.10.61 powinien wtedy przestać przechodzić — taki jest jego cel.
6. Nie zmieniaj konfiguracji API, Supabase i kluczy. Samo przejście z RC57.10.60 na RC57.10.61 nie wymaga migracji.

**Ważne:** wariant 10.61 jest organizacyjnym wydaniem źródeł. Nie zmniejsza liczby 7329 `!important` i nie przyspiesza widocznie klienta, ponieważ wygenerowane zasoby runtime pozostają takie same.
