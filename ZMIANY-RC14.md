# RC14 — Gemini low i identyfikatory faktów

- Przesłuchania Gemini: generowanie i poprawki `low`; niezależny audyt semantyczny pozostaje `medium`. Finał pozostaje `high`.
- Samo generowanie Gemini: do 26 s zamiast 20 s. Łączne okno Gemini przy dostępnej rezerwie Groq: 32 s zamiast 28 s. Audyt: do 6 s. Cały budżet AI: 54 s; klient i funkcja Vercel: 60 s. Kolejne wywołania są ograniczane pozostałym czasem; nie każde otrzyma pełen limit.
- Dostawca otrzymuje pełną listę `allowedFactIds`, jawny format 1–4 różnych identyfikatorów tekstowych oraz dokładniejszą instrukcję poprawki. Fakty i ich walidacja pozostają autorytatywne.
- Log rozdziela `model_fallback`, `invalid_decision`, `missing_fact_ids`, `fact_ids_count`, `fact_ids_type`, `duplicate_fact_ids`, `unknown_fact_ids`. Nie zapisuje surowej odpowiedzi.
- Jawna decyzja modelu `fallback` nie uruchamia próby wymuszenia odpowiedzi od tego samego dostawcy. Serwer może spróbować kolejnego skonfigurowanego dostawcy.
- Zachowano diagnostykę RC13 i respektowanie czasu ponowienia podanego przez dostawcę.

Wgraj całą zawartość paczki i wykonaj nowe wdrożenie Vercel. `/api/status` powinno wskazywać `6.37-LOW-RC14`.

Zaliczone testy: budowa i kontrola projektu, adaptery i diagnostyka błędów, przełączanie Gemini/Groq, rozumienie pytań, wiedza świadków, pytania uzupełniające, nowe przypadki kontraktu faktów oraz test DOM oczekiwania i blokady ponowienia. Testy API używają odpowiedzi kontrolowanych, bez produkcyjnych kluczy.

Ta aktualizacja nie potwierdza usunięcia problemu na kontach dostawców. Po wdrożeniu zadaj jedno pytanie; przy błędzie pokaż rozwinięty `interview-diagnostic`, w szczególności `providerFailures` i `qualityDiagnostics.attempts`.
