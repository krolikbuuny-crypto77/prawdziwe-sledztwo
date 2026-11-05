# Raport QA — Prawdziwe Śledztwo 6.33

**Źródło:** lokalny ZIP 6.32. Zmiany w osobnej kopii 6.33; nie zapisano nic do GitHuba, Vercel ani produkcyjnego Supabase.

## Wynik i zakres

- Jeden plik `lib/question-intent-633.js` jest wykonywany na serwerze i w przeglądarce.
- Zlikwidowano wielokrotne przepisywanie odpowiedzi przez trzy stare analyzatory (71/72/73) oraz dwa zakresowe końcowe moduły (83/84), zastępując je jedną regułą końcową 85. Inne moduły stylu, wiedzy i fabuły pozostają.
- Negowane wątki nie stają się automatycznie podstawą wyboru odpowiedzi. Intencje pytań połączonych są reprezentowane jako części, a tematy ryzykowne nie są automatycznie przepisywane przez lokalną warstwę zakresu.
- Serwer wylicza plan wyłącznie z pytania i dozwolonej historii; ignoruje deklarowaną przez klienta interpretację jako źródło faktów.
- Zachowano blokady przyznań, konfrontacji, dowodów i obecnych warunków progression/werdyktu.

## Zaliczono (lokalnie, bez sieci)

- `npm run build` — kompilacja z jednego modułu interpretacji.
- `npm run check` — składnia, hash assetów, ownership i kontrakty.
- `npm run test:unified633` — 21 pytań, identyczne plany serwera i przeglądarki, negacje, pytania złożone, czułość tematu, 14 dawnych przypadków na szerokościach 390/1280 i pamięć odpowiedzi.
- `npm run test:priority1` — serwerowe pytania, bezpieczeństwo kanonu i próby dostawców z mocków, lokalne alibi i zgłoszenie alarmu.
- `npm run test:fast-evidence` — ukryte dowody, odblokowanie i weryfikacja uproszczonej ścieżki AI.
- `npm run test:api629` — serwerowe zabezpieczenia i diagnostyka API.
- `npm run test:witnesses` — 24 pytania przez UI, 720 tur obciążenia, zapis/wznowienie, brak zmian dowodów.
- `npm run test:expanded-nlu` — 34 historyczne etykiety intencji i zabezpieczenia wejścia API.
- `npm run test:relevance625` — 16 pytań × 6 świadków na dwóch szerokościach, brak zmian w stanie dowodowym i różne głosy postaci.

## Niezweryfikowane

Nie wykonywano rzeczywistych zapytań Z.ai ani Groq, transmisji do produkcyjnego Vercel, trwałego zapisu Supabase ani kontroli czasu produkcyjnej odpowiedzi. Nie da się z testów heurystycznych wnioskować, że każde dowolne pytanie polskiego użytkownika będzie zrozumiane poprawnie. Pełny audyt pozostaje wskazany przed publikacją.
