# QA — 6.37 Gemini 3.8 Roles RC8

**Status:** lokalny build i testy kontraktu API OK; integracja z rzeczywistymi dostawcami niezweryfikowana.

## Zmiany

1. Google AI Studio: oba moduły `gemini-3.8-flash`. W przesłuchaniach `thinkingLevel=low`, w wewnętrznym audycie `medium`, w finale `high`.
2. Rozszerzono budżet wyjściowy Gemini, aby rozumowanie nie zużywało całego `maxOutputTokens` przed zwróceniem JSON.
3. OpenRouter: `deepseek/deepseek-r1:free` oraz poprawny identyfikator wariantu V3 `deepseek/deepseek-chat:free`; naprawiono przejście ze starego opakowania Cloudflare na bezpośredni JSON.
4. Cerebras: Llama 4 Scout jako **kandydat**, kontrola listy modeli konta przez `GET /v1/models`, brak niejawnego fallbacku do GPT-OSS. Dzienny limit tokenów nie jest weryfikowalny bez konta.
5. Zasady fabuły: wyłącznie serwerowo odblokowane źródła; żadnych automatycznych, wymyślonych pomiarów ani automatycznego werdyktu.

## Przetestowano (bez prawdziwych kluczy)

| Obszar | Wynik |
|---|---|
| Adapter Gemini JSON i `low`/`high` | PASS |
| Zapobieganie `minimal` dla Gemini 3.8 | PASS |
| Cerebras Llama 4 dostępna / nieobecna | PASS |
| Brak zamiany Llama 4 na inną rodzinę | PASS |
| OpenRouter DeepSeek, JSON + analiza serwerowa | PASS |
| Obiekcje obrony (6 pozycji, zatwierdzone źródła) | PASS |
| Laboratorium: odblokowania i filtrowanie identyfikatorów | PASS |
| `npm run build` i `npm run check` | PASS |
| Nawigacja 320/390/768/1440 px | PASS |
| Zapis i odczyt, 11 wersji migracji | PASS |

## Otwarte kwestie

- Brak danych do porównania dziennych limitów poszczególnych modeli Llama 4 w **konkretnym koncie** Cerebras; dostępność nie jest obecnie gwarantowana.
- Gemini, OpenRouter i Cerebras nie zostały faktycznie wywołane z sekretami produkcyjnymi; opóźnienia, przydziały i uprawnienia wymagają testów Preview.
- Generowane notatki i zarzuty mają walidację identyfikatorów źródeł, lecz testy nie dowodzą pełnej zgodności semantycznej każdego zdania AI z dokumentem.
- Na produkcji migracje SQL Supabase 001/002/003 nadal wymagają odrębnego potwierdzenia.
