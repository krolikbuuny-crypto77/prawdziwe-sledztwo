# Pakiet 6.13 — Trafniejsze parafrazy i odpowiedzi na właściwe pytanie

Bazowa wersja: **Pakiet 6.12**. Zmiany wykonano lokalnie, bez publikacji na GitHubie lub Vercel.

## Implementacja

- `src/witnesses/73-semantic-intent-robustness.js`: dodatkowa warstwa rozpoznawania polskich parafraz. Wykorzystuje pojęcia typu „własna perspektywa”, „docelowy odbiorca”, „pierwotne zeznanie”, „motyw decyzji”, „kwadrans”, „sektor”, „odpowiedzialność jako zabójca”. Jest to **regułowy parser**, nie nowy lokalny model LLM.
- Analizator respektuje pierwszeństwo dobrze działającej klasyfikacji z 6.12; nie zastępuje jej bez powodu. Wynik jest planem doboru dozwolonych faktów, a nie nowym faktem fabularnym.
- Lokalna warstwa końcowa poprawia wybrane odpowiedzi nietrafne: nie wymyśla autorów zgłoszeń, czasu, motywów, osób ani obserwacji. Tam, gdzie wiedza jest niewystarczająca, zaznacza brak pewności lub prosi o wskazanie zdarzenia.
- Odpowiedź na bezpośredni zarzut zabójstwa jest stanowiskiem postaci, **nie formalnym przyznaniem ani ustaleniem winy**. Zabezpieczenia sprostowań, konfrontacji, odmów proceduralnych i dowodów mają pierwszeństwo.
- Część odpowiedzi ma kilka dopuszczonych wariantów tekstu. Różnorodność nie może jednak być zwiększana kosztem zmiany faktów. W ogólnej próbie liczba unikalnych odpowiedzi nie wzrosła.
- Przesyłany do Z.ai `semanticPlan` odwołuje się do nowej klasyfikacji. Nie zwiększono banku faktów ani uprawnień modelu.

## Ograniczenia

Rozpoznanie intencji nie dowodzi, że wypowiedź jest pełna, naturalna lub merytorycznie poprawna. Heurystyki są wrażliwe na nieznane formy językowe. Reguły 6.13 opracowano również na podstawie błędów stwierdzonych w danych diagnostycznych: **nie są to niezależne wyniki generalizacji**. Nie wykonano prawdziwych połączeń z Z.ai.

## Jak odtworzyć testy

```sh
node tools/build.mjs
node tools/check.mjs
python tools/test-package613.py
python tools/test-witnesses.py
python tools/test-saves.py
python tools/test-reasoning.py
python tools/test-events.py
python tools/test-navigation.py
node tools/test-api612.mjs
```

Pełne porównanie pytanie-po-pytaniu: `TEST-6.13/porownanie_540.csv`. Dane surowe: `TEST-6.13/wyniki.json`.
