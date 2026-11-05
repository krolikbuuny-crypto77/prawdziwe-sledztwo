# Raport QA 6.18

**Cel:** sprawdzić przeniesione reguły progresji bez zmiany stopnia trudności.

| Test | Wynik |
|---|---|
| 15 kroków pięciu wieloetapowych minigier | PASS (51 asercji łącznie z atakami) |
| Fałszywe odpowiedzi, etapy poza kolejnością | ODRZUCONE |
| Otrzymanie dokumentów za ukończenie minigry | PASS po zatwierdzeniu |
| Dwie kotwice osi czasu + fałszywe źródło | PASS / fałszywe ODRZUCONE |
| Próba podania werdyktu z klienta | ODRZUCONA |
| 6 argumentów obrony, wynik liczony na serwerze | PASS |
| Niepełny akt / możliwość słabszego zakończenia | PASS |
| Starszy backend Z.ai → Groq → lokalny | PASS na atrapach |
| Testy migracji zapisów (1–11) | PASS |
| Przesłuchania i zarządzanie faktami | PASS |
| Dedukcja oraz EventBus | PASS |
| Minigry — UI na 2 szerokościach | PASS |
| Testy fabuły na 4 szerokościach | PASS |
| Produkcyjne Vercel + Supabase | NIE TESTOWANO |

To nie dowód odporności na przeciwnika znającego kod klienta. Weryfikowana
jest zgodność **przesłanych danych** z niezależnymi regułami serwera.
