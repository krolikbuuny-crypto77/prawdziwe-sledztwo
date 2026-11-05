# QA 6.30 — przesłuchania AI, priorytet 1

## Testy automatyczne przeprowadzone lokalnie

- `npm run build`: PASS (61 sekcji JS, 64 sekcje CSS).
- `npm run check`: PASS (składnia, integralność zasobów, kanon i dokumenty).
- `npm run test:priority1`: PASS (pytania z negacją, wątki podzielone, memoriał zatwierdzony w Supabase, odcięcie pamięci offline i podmienionego kontekstu klienta, zapisy zeznań, bezpieczne fallbacki).
- `node tools/test-api629.mjs`: PASS (Groq, Cloudflare, limity, reset, sesje).
- `node tools/test-api627.mjs`: PASS (identyfikacja dostawcy i diagnostyka).
- `python tools/test-quality625.py`: PASS (sześciu świadków, pytania i brak zmian dowodów).

## Przypadki pokryte nowymi testami

- „Gdzie byłeś między 01:30 a 02:05? Nie pytam o ostatnie spotkanie z Leną.”: negacja nie generuje drugiego zadania dotyczącego Leny.
- „Gdzie byłeś i kto zgłosił alarm?”: udostępnione są obie autorskie wypowiedzi.
- „Kto zgłosił znalezienie Leny i o której godzinie?”: dwie części podlegają niezależnej kontroli pokrycia.
- „A skąd właściwie to wiesz?”: model otrzymuje odniesienie do poprzedniego zatwierdzonego pytania i zeznania.
- Zapisany wyłącznie offline tekst nie jest traktowany jak potwierdzony fakt.
- Spreparowany plan i pamięć ze strony gracza nie trafiają do modeli jako fakty.
- Dosłowna powtórka nieadekwatna do innego pytania może być odrzucona przed zapisem.

## Ograniczenia

Nie używano rzeczywistych kluczy i nie wykonano transakcji na produkcji. Testy integracyjne używały kontrolowanych, symulowanych odpowiedzi Z.ai/Groq/Supabase. Jakość spontanicznej mowy i prawdziwe przełączanie dostawców muszą być dodatkowo ocenione w osobnej sesji Vercel po wdrożeniu.
