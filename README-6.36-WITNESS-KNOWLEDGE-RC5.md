# Prawdziwe Śledztwo — 6.36 Witness Knowledge RC5

## Cel

Przesłuchania pozostają AI First: Z.ai → Groq. Lokalny analizator nie wybiera AI tematu odpowiedzi. Silnik serwerowy kontroluje wszystkie źródła wiedzy i bramki fabularne.

## Zmiany względem RC4

1. **Prywatne kartoteki sześciu świadków:** `lib/witness-dossiers-rc5.js`. Dla każdej postaci zawierają indeks zagadnień (alibi, relacje, obserwacje, źródła), ograniczenia wiedzy oraz instrukcje wyłącznie stylistyczne.
2. **Bardziej szczegółowy bank wiedzy:** `lib/trusted-interview-624.js` zachowuje zatwierdzone pełne wypowiedzi i dodaje pochodzące z nich dosłowne, samodzielne zdania. Zwykła rozmowa ma teraz 20–24 bezpieczne fragmenty na postać zamiast ~14–16. Fragmenty nie dodają faktów i nie pochodzą z przesłanych przez klienta danych.
3. **Psychologia bez fikcyjnych faktów:** model dostaje charakterystyczny sposób wypowiedzi i zmienia wyłącznie ton zależnie od zatwierdzonej historii pytań. Nacisk nie otwiera automatycznie tajnych informacji.
4. **AI dobiera informacje samo:** `witnessDossier.topics[].factIds` to mapa pomocnicza, a nie drugi analizator; model analizuje oryginalne polskie pytanie. Tylko `knowledge.factBank` ma prawo stanowić źródło twierdzeń.
5. **Wersja wydania:** `6.36-WITNESS-KNOWLEDGE-RC5` w kliencie i API.

## Czego celowo NIE zrobiono

- Nie wymyślono życiorysów, osobistych znajomości, godzin, miejsc, pobudek, nowych wydarzeń ani sprawcy.
- Nie ujawniono poprawek zeznań zależnych od bramek dowodowych ani nieodblokowanych dokumentów.
- Nie zmieniono Supabase, GitHuba ani Vercel. Migracja Supabase `003` nadal jest niezbędna, a HTTP 503 wymaga diagnostyki serwerowej.
- Nie uruchomiono prawdziwych zapytań Z.ai i Groq. Wszystkie testy jakości dialogów używają ich symulowanych odpowiedzi; skuteczność w produkcji należy sprawdzić na Preview.

## Testy

`npm run build && npm run check && npm run test:witness-knowledge-rc5`

Opcjonalnie przeglądarkowo: `python tools/test-saves.py`, `python tools/test-navigation.py`, `python tools/test-witnesses.py`.

Uwaga: `tools/test-api624-integration.mjs`, `tools/test-api629.mjs` i `tools/test-interview630.mjs` pochodzą ze starego kontraktu API, który nie wymagał jeszcze identyfikatora tury / sesji; ich oczekiwań nie należy traktować jako podstawy do wycofania AI First.
