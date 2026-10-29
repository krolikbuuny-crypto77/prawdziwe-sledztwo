# Pakiet 6.18 — serwerowa kontrola minigier, osi czasu i finału

## Cel

Zamienić deklarowany przez przeglądarkę sukces na **propozycję czynności**,
którą niezależny moduł serwerowy zatwierdzi albo odrzuci. Nie dodawać nowych zagadek
ani nowych obowiązkowych progów do rozgrywki lokalnej. Zachować układ Z.ai → Groq
→ lokalnie; Cloudflare pozostaje wyłącznie przy analizie dowodów.

## Nowości

- `lib/server-canon-618.json`: zamrożone parametry 20 wydarzeń i 5 minigier.
- `lib/progression-618.js`: niezależna ocena 15 etapów, czasów wydarzeń,
  dowodów w akcie, 6 wariantów argumentów obrony i wydanie werdyktu serwerowego.
- `lib/server-state.js`: nowe pola `puzzles`, `verifiedTimeline`, `indictment`,
  `defense`, `verdict`; zachowuje odczyty starszych rekordów sesji.
- `src/laboratory/09-multi-stage-puzzles.js`: wysyła konkretne rozwiązanie etapu.
- `src/core/case-engine.js`: wysyła zweryfikowane wpisy chronologii i projekt aktu.
- `src/finale/14-adversarial-trial.js`: wysyła uargumentowane decyzje obrony.
- `src/finale/57-indictment-variants-and-epilogue.js`: zgłasza zamknięcie sprawy.
- `src/integrations/75-verified-state-sync.js`: kolejka offline, próby ponowienia
  odroczonych akcji i oddzielna informacja o zatwierdzeniu serwera.

## Zasady bezpieczeństwa

- Żadna akcja `set_state`, `caseCompleted`, `force_verdict` ani `solved=true`
  nie nadaje zatwierdzonego postępu.
- Serwer używa wyłącznie własnej listy dokumentów i parametrów rozwiązań.
- Akty z brakującą podstawą nadal mogą otrzymać zakończenie **niekorzystne**,
  tak jak w dotychczasowej rozgrywce — nie są sztucznie blokowane.
- Serwer nie wydaje rozstrzygnięcia „oskarżenie utrzymane”, jeśli nie ma
  zatwierdzonych dowodów, kotwic chronologicznych, powiązań i obrony.
- Wynik lokalny nie jest oznaczany jako zatwierdzony przez Supabase.
- Wszystkie zapisy do bazy pozostają po stronie Vercel (`service_role` nie idzie do klienta).

## Rzeczywiste ograniczenia

- Właściwa baza Supabase oraz Z.ai/Groq/Cloudflare nie zostały tutaj wywołane:
  testy korzystają z lokalnych atrap.
- Część lokalnych metod oceny wiarygodności źródeł ma bardziej szczegółowe reguły
  niż obecny walidator serwera. Wersja 6.18 nie jest jeszcze ich pełnym odpowiednikiem.
- Poprawnych rozwiązań nie da się traktować jako dowodu faktycznej pracy użytkownika,
  skoro część ich danych jest widoczna w kodzie przeglądarki. Wymaga to w przyszłości
  losowanych wyzwań wydawanych i sprawdzanych przez serwer.
- Wymagany jest test end-to-end na rzeczywistym Vercel Preview + Supabase.

## Testy

`npm run test:progression` obejmuje 51 kontroli, 15 etapów i 6 sporów obrony.
Wykonano także `npm run check`, `npm run test:architecture`,
`npm run test:saves`, `test:witnesses`, `test:reasoning`, `test:events`,
`test:ai-primary`, `test:inspections-puzzles`, `test:story`.
