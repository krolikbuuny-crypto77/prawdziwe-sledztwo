# 6.36 — AI Follow-up RC4

Wersja testowa do wdrożenia na Vercel Preview. Zawiera poprzedni RC3.

## Poprawki
- Z.ai sam interpretuje pytania „Kto to może potwierdzić?”, „A kto może to poświadczyć?”, „Czy ktoś cię wtedy widział?” i kontekst poprzedniej tury. Groq pozostaje pierwszą rezerwą.
- Marek ma dostęp do zatwierdzonego, jawnego faktu o braku osoby obserwującej go przez cały dyżur oraz o częściowej wartości rejestru i połączeń. Nie dodano fikcyjnego świadka.
- AI nie używa średników w wypowiedziach; otrzymany średnik zamieniany jest na granicę dwóch zdań bez zmiany faktów.
- HTTP 503 nie jest nazywany „nieobsługiwanym pytaniem”. Interfejs pokazuje bezpieczną kategorię: brak migracji `003`/sesji Supabase lub awaria Z.ai/Groq.
- Nieudane zapytanie przywraca pytanie do pola bez zapisu lokalnego zeznania.

## Kontrole
- `npm run build && npm run check`
- `node tools/test-followup-rc4.mjs`
- `python tools/test-followup-browser-rc4.py`
- `node tools/test-ai-understanding637.mjs`

## Przed produkcją
Wymagane testy prawdziwych API Z.ai, Groq i Supabase na Vercel Preview oraz obecność migracji `003`. Kod nie usuwa ani nie omija tych wymagań.
