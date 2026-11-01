# Raport QA RC30 — 31.10.2026

## Przyczyny regresji
1. RC28 pełna paczka została zrekonstruowana z niepełnego RC27 oraz plików starszej wersji 6.37; w efekcie frontend przepuszczał wyłącznie Gemini (Z.ai/Groq tylko przy replay), serwer zwracał też APINEX i Z.ai. W teście przeglądarkowym RC28 dla `provider='apinex-luna'` i zatwierdzonego HTTP 200 wyświetlano błąd: „Odrzucono nieprawidłową odpowiedź AI. Ponów pytanie.”.
2. RC28 wymuszał `rewrite` dla poprawnej znaczeniowo i jawnie ograniczonej wypowiedzi „Nie mam alibi w sensie ciągłej obecności...”. Odtworzono niepożądane wywołanie `rewrite` testem z atrapą dostawcy (test RC28 FAIL; RC30 PASS).

## Zmiany względem RC29
- Usunięto tylko stylistyczną blokadę ponownego generowania w `api/interview.js`.
- Zostawiono instrukcje dotyczące naturalności (`lib/interview-naturalness-rc28.js`) i walidację faktów.
- Zachowano synchronizację listy dostawców przeglądarki i serwera z RC29.

## Testy zakończone powodzeniem
- `node --check api/interview.js`
- `npm run build`
- `npm run check`
- `node tools/test-rc30-nonblocking-naturalness.mjs`
- `python tools/test-provider-acceptance-rc29.py` — 12 scenariuszy, 7 dostawców chmurowych, lokalny, oraz niepoprawne odpowiedzi
- `python tools/test-transaction636.py`
- `node tools/test-stage1-636.mjs`
- `node tools/test-ai-understanding637.mjs`

## Niepotwierdzone
- Nie testowano prawdziwego APINEX/Z.ai/Gemini w produkcji (bez dostępu do kluczy i sesji użytkownika).
- Nie zagwarantowano zgodności wszystkich plików z oryginalnym pełnym RC27, ponieważ przekazany ZIP RC27 urywa się w trakcie plików multimedialnych. Oryginalny `api/interview.js` odzyskano i porównano; kompletny `src` RC27 nie był dostępny.
- Pozostałe historyczne rozbieżności testowe starszych pakietów nie zostały tu rozwiązane.
