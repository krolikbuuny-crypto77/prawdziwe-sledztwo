# Prawdziwe Śledztwo — pakiet 6.33

## Jedno źródło interpretacji pytań

Paczka 6.33 zawiera `lib/question-intent-633.js`: **jeden moduł** analizujący
naturalne pytanie śledczego, używany przez serwer Vercel jako ESM oraz
wbudowywany bez zmian w przeglądarkowy plik `index.html` podczas `npm run build`.
Nie ma osobnych niezależnych tabel rozpoznawania intencji dla odpowiedzi chmurowej
i lokalnej. Moduł nie zna stanu dowodów i nie może go zmienić.

Przebieg: pytanie oryginalne → zdania pozytywne i wykluczone → części, temat,
podmiot, czas i czułość wypowiedzi → serwerowo dozwolone fakty → Z.ai / Groq /
bezpieczny fallback lokalny → kontrola zgodności → odrębne zapisy zeznań.

## Najważniejsze zmiany

1. Stare moduły 71, 72 i 73 nie mają już uprawnień do końcowego
   nadpisywania odpowiedzi. Pozostają ich nieingerujące funkcje kompatybilności.
2. Usunięto aktywne moduły `83-question-focus-626.js` i
   `84-precise-question-scope-632.js`; zastępuje je jeden
   `85-unified-response-633.js`, który czyta plan z modułu wspólnego.
3. Stary moduł 70 analizuje intencję przez wspólne API; moduł 82
   nie nadpisuje zakresów przejętych przez wspólny plan.
4. `question-context-630.js`, `interview-intent-626.js` i
   `trusted-interview-624.js` korzystają z tego samego źródła.
5. Pytania o brak wpisu, doręczenie zgłoszenia BHP i autoryzację testu
   otrzymują na serwerze bezpieczne, ograniczone do wiedzy fakty; bez
   automatycznego przesądzania winy, wysyłki lub tożsamości osoby.
6. Wprowadzono etykiety historyczne `PS611_NLU` jako adapter **wyniku**
   analizatora, nie kolejny analizator. Stare szablony dialogowe i bezpieczne
   działania procesowe pozostały.
7. Liczba aktywnych warstw *odpowiedzi* w WitnessEngine: 21 → 17;
   moduły obsługujące pamięć, zapis, styl, fabułę i bramki dowodowe pozostały.

## Reprodukcja

```
npm run build
npm run check
npm run test:unified633
npm run test:priority1
npm run test:fast-evidence
npm run test:api629
npm run test:witnesses
npm run test:expanded-nlu
npm run test:relevance625
```

Nie wymagają żadnych rzeczywistych kluczy API ani połączenia z produkcyjną
bazą danych. Testy chmurowe używają mocków; środowisko produkcyjne wymaga
odrębnego testu E2E.

## Ograniczenia

Analizator jest deterministyczny i nadal heurystyczny. Wyrażenia wieloznaczne
lub rzadkie, wielowątkowe pytania mogą wymagać doprecyzowania albo pomocy
modelu generatywnego. Starsze 17 warstw WitnessEngine nadal wykonuje
funkcje domenowe; nie należy utożsamiać konsolidacji klasyfikatora z usunięciem
całej historycznej architektury dialogowej. Moduł nie skraca limitów Z.ai/Groq.
