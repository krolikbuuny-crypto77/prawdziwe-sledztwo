# QA — Prawdziwe Śledztwo 6.37 RC9

## Zakres
Wyłącznie `thinkingLevel` dla generowania oraz poprawki zeznania: `high`. Audyt: `medium`. Finał: `high`.

## Sprawdzenia
- `node tools/test-interview-high-rc9.mjs` — nowa konfiguracja i bezpieczny mock JSON.
- `node tools/test-gemini38-rc8.mjs` — zgodność adapterów.
- `node tools/test-specialized-rc7.mjs` — moduły dedukcji, laboratorium i obrony.
- `npm run build` i `npm run check` — kontrola buildu i integralności.

Testy nie zawierają rzeczywistych wywołań Gemini, OpenRouter ani Cerebras. Ustawienie high może wydłużać latencję w ramach obecnych limitów.
