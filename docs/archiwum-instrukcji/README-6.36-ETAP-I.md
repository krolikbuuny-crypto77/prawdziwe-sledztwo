# Prawdziwe Śledztwo — 6.36, Etap I: Inteligencja świadków

Paczka testowa zbudowana na bazie 6.35. **Nie jest to ukończona wersja 6.36 ani potwierdzona wersja produkcyjna.**

## Wprowadzone zmiany

1. **Diagnostyka przesłuchań** (`lib/interview-observability-636.js`): osobne czasy i statusy generowania, kontroli jakości, poprawki i audytu semantycznego; dostawca, przyczyna odrzucenia, liczba korekt. Diagnostyka jest lokalna dla jednej tury, bez treści pytań, odpowiedzi, dokumentów i kluczy. Odpowiedź API zawiera `qualityDiagnostics`. W interfejsie włącz podgląd dopisując `?debugAI=1` do adresu strony i przejdź do przesłuchań.
2. **Pamięć dialogowa 2.0** (`lib/dialogue-memory-636.js`): odczyt tylko z zatwierdzonej na serwerze historii konkretnego świadka (maksymalnie ostatnie 48 wpisów). Wyodrębnia wcześniejsze pytania, niepewne odpowiedzi i sprostowania. Odpowiedzi offline nie są przenoszone jako fakt; historia nigdy nie uzupełnia `factBank`.
3. **Powtórzenia znaczeniowe**: niezależny audyt AI sprawdza, czy nowa wypowiedź jedynie parafrazuje dawną odpowiedź na inne pytanie. Przy takim wyniku można przeprowadzić **jedną** korektę u tego samego dostawcy, nie zwiększając limitu rewizji. Świadome ponowienie pytania oraz uzasadniona powtarzana odmowa nie powinny być automatycznie odrzucane.
4. **Psychologia i naturalność**: rozbudowano istniejący moduł stylu `dialogue-continuity-620.js` o reakcje na zmianę tematu, ponowne doprecyzowania i powracające przyznanie braku wiedzy, bez tworzenia nowych zdarzeń. Nadal obowiązują sześć indywidualnych charakterystyk.

## Architektura

Pytanie → jeden wspólny analizator `question-intent-633.js` → autorytatywny `factBank` i potwierdzenie dowodów → Z.ai → Groq → lokalny → zapis. Nie dodano konkurencyjnego analizatora ani nowych odblokowań i reguł fabularnych. Jedynym źródłem nowych dopuszczonych faktów jest serwerowy kanon.

## Testy lokalne

```bash
npm run build
npm run check
npm run test:stage1-636
npm run test:unified633
npm run test:api629
npm run test:priority1
npm run test:fast-evidence
npm run test:witnesses
```

Aby zweryfikować etap diagnostyczny niezależnie: `node tools/test-stage1-diagnostics636.mjs`.

## Ograniczenia

- Testy korzystają z symulowanych Z.ai/Groq; **nie mierzą** produkcyjnej jakości semantycznej ani rzeczywistych opóźnień.
- Weryfikacja semantyczna może wymagać dodatkowego wywołania modelu przy pytaniu uzupełniającym; limit całej tury nadal wynosi 21,5 sekundy na serwerze.
- Zapisy Supabase nie były testowane na prawdziwym koncie. Bez skonfigurowanego stanu serwera pamięć zatwierdzonej rozmowy jest pusta i zachowany jest bezpieczny fallback.
- Oceny dedukcji, kompletne pokrycie 78 dowodów i sekrety w bundle przeglądarki nie są częścią Etapu I.
- Do wdrożenia użyj osobnej gałęzi testowej i potwierdź działanie modeli oraz trwałość sesji przed podmianą produkcji.
