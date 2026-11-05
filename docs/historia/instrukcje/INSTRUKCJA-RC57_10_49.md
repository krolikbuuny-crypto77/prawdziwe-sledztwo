# RC57.10.49 — przebudowa UX pod laptop 15,6 cala

## Co wgrać

- **Pełny ZIP** `Prawdziwe_Sledztwo_RC57_10_49_LAPTOP_15_6_PELNA.zip`: użyj do nowego projektu albo czystego wdrożenia Vercel Preview.
- **Aktualizacja** `Prawdziwe_Sledztwo_RC57_10_49_AKTUALIZACJA_DO_RC57_10_48.zip`: tylko na bazę **RC57.10.48**. Zastąp pliki zgodnie ze strukturą katalogów, bez pomijania `src/index.template.html`, `index.html` i dwóch plików w `assets/ui`.

## Bezpieczna procedura

1. Zachowaj kopię poprzedniej wersji i wyeksportuj zapis śledztwa.
2. Zastosuj pełny ZIP albo aktualizację (nie obie naraz).
3. Jeżeli publikujesz projekt ze źródeł: `npm run build` oraz `npm run check`.
4. Uruchom Vercel Preview i wyczyść cache twardym odświeżeniem, aby nowy CSS nie mieszał się ze starym.
5. Sprawdź **1366×768** i **1536×864** przy skalowaniu systemowym 100% oraz zwykłym powiększeniu przeglądarki. Następnie sprawdź telefon.
6. Otwórz Pulpit, Akta, Poszukiwania, Przesłuchania, Oś czasu, Oględziny, Notatnik, Laboratorium, Dedukcję i Finał. W Przesłuchaniach rozwiń „Narzędzia rozmowy…”.
7. Sprawdź prawdziwą odpowiedź AI i trwałość zapisu Supabase przed wdrożeniem produkcyjnym. Test lokalny tego nie potwierdza.

**Zakres aktualizacji:** tylko układ, wygląd i organizacja elementów DOM. Wersja nie ingeruje w logikę dowodów, AI, werdyktu, zapisu i warunków odblokowania.
