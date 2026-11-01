# Prawdziwe Śledztwo 6.36 AI Understanding RC3

**Nowa architektura przesłuchań:** AI wybiera fakty na podstawie naturalnego pytania, bez narzuconej lokalnej klasyfikacji. Serwer kontroluje zatwierdzone informacje, historię, dowody i reguły. Z.ai → Groq; gdy oba modele zawiodą, gracz może ponowić pytanie (bez lokalnej imitacji AI).

## Wdrożenie

1. Nie zastępuj produkcji bez sprawdzenia wersji na Vercel Preview.
2. W testowym Supabase zastosuj wcześniejsze migracje `001`, `002` i `003_interview_limits.sql` (z paczki), jeżeli nie są jeszcze wdrożone. Nie uruchamiaj ich bez weryfikacji aktualnego schematu.
3. Ustaw bezpieczne zmienne Preview Z.ai/Groq, sekret sesji i testowe Supabase.
4. Wgraj zawartość ZIP na gałąź testową GitHub, nie na `main`, i przetestuj pytania np. „Kim była dla ciebie ofiara?”, „Co was łączyło?”, „Gdzie byłeś?”, „Kto to widział?”, „A skąd możesz to wiedzieć?”.
5. Skontroluj, czy model odpowiada na nowe pytanie bez powtarzania wstępu i czy nie ujawnia ukrytych dowodów.

Test lokalny: `npm run build && npm run check && npm run test:ai-understanding637`.

Szczegóły: `RAPORT-QA-6.36-AI-UNDERSTANDING-RC3.md`.
