# Raport QA — Prawdziwe Śledztwo 6.36, Etap I

Data: 30.10.2026. Zakres: diagnostyka AI, pamięć dialogowa i styl psychologiczny. Punkt wyjścia: kompletna wersja testowa 6.35. GitHub, Vercel i Supabase pozostały niezmienione.

## Zrealizowane

- Wspólny analizator intencji 6.33 pozostaje jedynym źródłem klasyfikacji; liczba warstw odpowiedzi WitnessEngine: 17.
- Bezpieczne czasy poszczególnych etapów: `generate`, `rewrite`, `semantic-audit`, `quality`, `post-check`; rozpoznawanie odrzucenia za semantyczne powtórzenie. Brak pytań, zeznań, haseł i dokumentów w logach diagnostycznych.
- Pamięć ostatnich wypowiedzi oparta na historii serwerowej, z izolacją wcześniejszych odpowiedzi offline i oznaczeniem sprostowań. Nie nadaje dawnym zeznaniom statusu prawdy.
- Jeden możliwy retry po semantycznie powtórzonej odpowiedzi. Szybka ścieżka dosłownego cytatu zachowana dla prostych pytań; pytania o nowy szczegół podlegają niezależnemu audytowi.
- Adaptacyjny styl sześciu postaci w istniejącym module, bez tworzenia nowych faktów.
- Oznaczenie HTML: `6.36-I`; parametry debugowania `?debugAI=1`.

## Wykonane testy

- `npm run build` — zaliczony.
- `npm run check` — zaliczony.
- `npm run test:stage1-636` — zaliczony.
- `node tools/test-stage1-diagnostics636.mjs` — zaliczony.
- `npm run test:unified633` — zaliczony.
- `npm run test:api629` — zaliczony.
- `npm run test:priority1` — zaliczony.
- `npm run test:fast-evidence` — zaliczony.
- `npm run test:witnesses` — zaliczony, 720 tur lokalnych.
- Testy VIS-02, blokad TCMS i braku odblokowań po rozmowie — zaliczone w regresjach.

## Niepotwierdzone / ryzyka

1. Rzeczywista skuteczność filtrowania powtórzeń przez Z.ai/Groq: dotychczas tylko symulacje i test kontraktowy.
2. Opóźnienia w sieci i korzyść z próby korekty: wymagają pomiarów na stagingu. Ścieżka audytu może zwiększyć liczbę wywołań.
3. Długoterminowa trwałość pamięci przy przełączeniu urządzeń i konfliktach zapisu w Supabase: niezweryfikowana na produkcji.
4. Odpowiedzi lokalne przy niedostępności chmury pozostają mniej elastyczne niż generowane przez modele.
5. Ocena dedukcji i szczegółowa weryfikacja wszystkich 78 dokumentów pozostają na kolejne etapy.

**Werdykt QA:** gotowe do testowania na gałęzi/stagingu, nie do bezwarunkowej publikacji produkcyjnej.
