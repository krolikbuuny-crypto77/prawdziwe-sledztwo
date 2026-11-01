# Prawdziwe Śledztwo 6.37 — RC10 (bez karty płatniczej)

## Usługi AI

| Funkcja | Dostawca | Model | Ustawienie |
|---|---|---|---|
| Przesłuchania + mimika | Google AI Studio | `gemini-3.8-flash` | thinking `high`, audyt `medium` |
| Tablica dedukcyjna | Groq Free | `openai/gpt-oss-120b` | reasoning `medium`, JSON |
| Rezerwa dedukcji | Groq Free | `openai/gpt-oss-20b` | JSON |
| Laboratorium i dziennik | Groq Free | `llama-3.1-8b-instant` | szybkie notatki, JSON |
| Finał / 6 zastrzeżeń obrony | Google AI Studio | `gemini-3.8-flash` | thinking `high` |

**OpenRouter i Cerebras usunięte z aktywnych połączeń.** Nie trzeba tworzyć konta, podawać karty ani konfigurować kluczy u tych dostawców. Jeden `GROQ_API_KEY` służy dedukcji oraz laboratorium.

## Skąd wziąć klucz Groq?

1. Otwórz <https://console.groq.com/keys> i załóż bezpłatne konto.
2. Utwórz klucz API. Skopiuj go tylko do menedżera sekretów / Vercel.
3. W Vercel → projekt → Settings → Environment Variables dodaj:

```dotenv
GEMINI_API_KEY=<TWÓJ_KLUCZ_GOOGLE>
GEMINI_INTERVIEW_MODEL=gemini-3.8-flash
GEMINI_DEFENSE_MODEL=gemini-3.8-flash
GROQ_API_KEY=<TWÓJ_KLUCZ_GROQ>
GROQ_DEDUCTION_MODEL=openai/gpt-oss-120b
GROQ_DEDUCTION_BACKUP_MODEL=openai/gpt-oss-20b
GROQ_LAB_MODEL=llama-3.1-8b-instant
```

4. Zachowaj `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` i SQL migracje `001`, `002`, `003` z wcześniejszych wersji.
5. Możesz usunąć **nieużywane** `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BACKUP_MODEL`, `CEREBRAS_API_KEY`, `CEREBRAS_MODEL`. Nie usuwaj innych konfiguracji bez sprawdzenia.
6. Po dodaniu sekretów wykonaj nowe wdrożenie Vercel **Preview**. Przetestuj przesłuchanie, dedukcję, notatki laboratoryjne i finał, a dopiero potem wdrażaj produkcyjnie.

## Limity darmowego Groq (stan: 30 października 2026)

| Model | Żądania/dzień (RPD) | Żądania/min (RPM) | Tokeny/dzień (TPD) | Tokeny/min (TPM) |
|---|---:|---:|---:|---:|
| `openai/gpt-oss-120b` | 1 000 | 30 | 200 000 | 8 000 |
| `openai/gpt-oss-20b` | 1 000 | 30 | 200 000 | 8 000 |
| `llama-3.1-8b-instant` | 14 400 | 30 | 500 000 | 6 000 |

To są limity na organizację Groq, a **nie osobna pula dla każdego klucza czy gracza**. Gdy skończą się tokeny, liczba faktycznie wykonanych zapytań może być dużo mniejsza od RPD. Dokładne wartości sprawdź na <https://console.groq.com/settings/limits> i w odpowiedziach `429`. Nie wolno automatycznie przełączać się na płatne modele ani nieznane identyfikatory.

Źródła: <https://console.groq.com/docs/rate-limits>, <https://console.groq.com/docs/billing-faqs>.

## Ochrona fabuły

- Klucze API są tylko po stronie serwera Vercel, bez wystawiania do HTML/JS w przeglądarce.
- AI analizuje tylko odblokowane i zatwierdzone dokumenty. Nie zapisuje dowodów, nie ujawnia tajemnic i nie zmienia wyroku.
- Laboratorium generuje **komentarz do autentycznych danych**, nigdy autorytatywne nowe pomiary czarnej skrzynki TW-217.
- Bezpieczeństwo dowodów i postęp gry nadal kontroluje Supabase oraz serwerowy silnik reguł.

## Weryfikacja

- `node tools/test-specialized-rc7.mjs`
- `node tools/test-gemini38-rc8.mjs`
- `node tools/test-interview-high-rc9.mjs`
- `npm run build`
- `npm run check`
- Testy używają danych symulowanych — **nie** są potwierdzeniem działania z prawdziwym kluczem na produkcji.
