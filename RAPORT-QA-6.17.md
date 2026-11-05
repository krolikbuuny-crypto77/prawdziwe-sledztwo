# Raport QA — Pakiet 6.17

## Zaliczone

- Kompilacja `npm run build` i kompletność `npm run check`: 61 sekcji JS,
  64 sekcje CSS, 75 grafik WebP, 9 nagrań MP3.
- Niezależne symulacje API: poprawny Z.ai, awaria Z.ai → poprawny Groq,
  niekompletna odpowiedź Z.ai → Groq, awaria obu → lokalny silnik.
- Przekazanie tego samego kontekstu obydwu dostawcom, bez uprawnień do
  ingerowania w wynik śledztwa.
- Serwerowe reguły: poprawny i niepoprawny dowód, wymagania dla oględzin,
  odrzucenie zgłoszenia wygranej, migracja kontrolowana wersją CAS.
- Supabase w symulacji: podpisane cookie sesji, inicjalny zatwierdzony zestaw
  dowodów, zapis transakcyjny, konflikt zapisu.
- Offline w izolowanym symulatorze JS: kolejka `localStorage`, wznowienie
  sesji klienta i odtworzenie akcji po powrocie połączenia.
- `npm run test:saves`: formaty zapisów, import, eksport i reset.
- `npm run test:witnesses`, `npm run test:reasoning`, `npm run test:events`,
  `npm run test:memory`, `npm run test:ai-primary`, `npm run test:evidence-quality`.

## Niepotwierdzone lub poza zakresem

- Rzeczywiste Z.ai i Groq: tylko mock HTTP, bez dostępu do prawdziwych kluczy.
- Rzeczywista usługa Supabase: REST i CAS przetestowane wyłącznie na mocku,
  migracja SQL nie była wykonywana na produkcyjnym projekcie.
- End-to-end offline na rzeczywistym adresie w przeglądarce: środowisko
  testowe blokowało nawigację HTTP (ERR_BLOCKED_BY_ADMINISTRATOR). Pokrycie
  wykonane za pomocą testu klienta w izolowanym runtime JS oraz testów
  dotychczasowego interfejsu.
- Głęboka persystencja i zatwierdzanie całego finału: jeszcze nieprzeniesione
  do walidatorów serwera. Nie należy deklarować pełnej odporności na
  dowolne manipulacje klientem ani serwerowego zatwierdzenia zwycięstwa.
- Pełna walidacja wszystkich wariantów świadomego kłamstwa: tylko autorskie,
  potwierdzone bramką sprostowania są automatycznie rozpoznawane jako
  wpisy fabularne. Każda inna sprzeczność pozostaje nierozstrzygnięta.
