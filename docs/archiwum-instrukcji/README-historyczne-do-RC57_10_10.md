> **RC27:** kontrola zakresu alibi i niepopartej wyłączności źródeł. [RAPORT-RC27.md](RAPORT-RC27.md).

> **RC26:** limit oczekiwania na pytanie 90 s, wspólny dla wszystkich modeli i lokalnej rezerwy. Wdrożenie: [RAPORT-RC26.md](RAPORT-RC26.md).

> **Aktualizacja RC25:** przesłuchania: APINEX Luna → GLM Flash → DeepSeek Flash → Z.ai → lokalny rejestr. Aktualna instrukcja: [RAPORT-RC25.md](RAPORT-RC25.md).

> **Aktualizacja RC24:** przesłuchania używają Z.ai GLM-4.7-Flash → Mistral Small → lokalny rejestr. Instrukcja wdrożenia i aktualna polityka: [RAPORT-RC24.md](RAPORT-RC24.md). Starsze raporty AI-required są historyczne.

# Najnowsza wersja — 6.37 Free Groq RC10

Przesłuchania i finał: Google Gemini 3.8 Flash. Dedukcja i laboratorium: **Groq Cloud Free bez karty płatniczej**. Instrukcja: `README-6.37-FREE-GROQ-RC10.md`. Poprzednie README są archiwalne.

# Aktualizacja 6.37 RC9

Przesłuchania Gemini `gemini-3.8-flash`: **thinking high**, audyt semantyczny **medium**. Pozostałe moduły bez zmian. Szczegóły w `README-6.37-GEMINI38-ROLES-RC9.md`.

# 6.37 Gemini 3.8 Flash — RC8

Aktualny podział usług i instrukcja wdrożenia: [README-6.37-GEMINI38-ROLES-RC8.md](README-6.37-GEMINI38-ROLES-RC8.md).

Prawdziwe Śledztwo — wersja testowa **6.36-AI-FOLLOWUP-RC4**.

Pełna wersja obejmuje wszystkie zmiany RC3 oraz poprawkę pytania uzupełniającego o potwierdzenie alibi, naturalne rozdzielanie zdań i diagnostykę błędów HTTP 503.

Instrukcja: `README-6.36-AI-FOLLOWUP-RC4.md`. Raport: `RAPORT-QA-6.36-AI-FOLLOWUP-RC4.md`.

## Aktualny wariant — 6.36 Witness Knowledge RC5

Przed wdrożeniem przeczytaj `README-6.36-WITNESS-KNOWLEDGE-RC5.md` oraz `RAPORT-QA-6.36-WITNESS-KNOWLEDGE-RC5.md`. RC5 rozbudowuje tylko serwerowe kartoteki wiedzy świadków. Nie zastępuje wymogu migracji Supabase `003` i nie oznacza, że błąd 503 na Vercel został naprawiony.


## Aktualny wariant — 6.36 AI Resilience RC6

Najnowsza wersja z poprawką błędów Z.ai timeout / Groq odrzucona odpowiedź. Zobacz `README-6.36-AI-RESILIENCE-RC6.md` i `RAPORT-QA-6.36-AI-RESILIENCE-RC6.md`. Mimo zmian 503 może nadal wystąpić przy rzeczywistej niedostępności modeli, problemach z limitem lub Supabase.
