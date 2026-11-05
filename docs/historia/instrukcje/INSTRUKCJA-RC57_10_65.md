# RC57.10.65 — instrukcja aktualizacji

1. Zachowaj kopię obecnego projektu RC57.10.64 i eksport zapisanej sesji. Nie zmieniaj istniejących sekretów środowiskowych.
2. **Pełny ZIP** jest samodzielnym wydaniem, które można rozpakować do nowego katalogu projektu. **Mały ZIP** jest nakładką wyłącznie na kompletną RC57.10.64; zachowaj strukturę katalogów.
3. Uruchom `npm run build`, następnie `npm run check`. Budowa odtwarza `index.html`, hashowane CSS i JS oraz usuwa stare pliki `ps-*` z poprzedniego builda.
4. Sprawdź lokalnie: `npm run test:rc571065:render`, `npm run test:rc571065:browser`, `python tools/test-saves.py`, `python tools/test-navigation.py`, `npm run test:rc58`. Odrębne wywołanie pełnej macierzy: `npm run test:rc571065` może trwać dłużej. Do dokładnego porównania przed/po: `python tools/test-rc571065-browser.py --baseline /ścieżka/do/RC57.10.64` i `python tools/test-rc571065-render.py --baseline /ścieżka/do/RC57.10.64`.
5. Wdróż najpierw na Vercel Preview i upewnij się, że `ps-css-*`, `ps-js-00-*` i `ps-js-60-*` oraz `index.html` pochodzą z tego samego builda. W Network sprawdź HTTP 200 i cache dla zasobów z hashami.
6. Wykonaj ręczny test: powtarzaj wejścia do Przesłuchań, Oględzin i Dedukcji; zmieniaj świadka, okazuj nowy dowód, przełącz pokój, filtruj źródła, zapisz i wznow grę. Sprawdź dłuższą realną rozmowę AI na skonfigurowanym backendzie.
7. Jeśli pojawią się regresje lub ostrzeżenia w konsoli, przywróć pełną RC57.10.64. Nie instaluj migracji Supabase — nie wprowadzono zmian schematu ani reguł.

**Uwaga:** optymalizacja eliminuje określone przebudowy DOM przy niezmienionym stanie; nie jest gwarancją szybszej transmisji sieciowej ani braku wycieków pamięci.
