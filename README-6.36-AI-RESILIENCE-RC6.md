# Prawdziwe Śledztwo 6.36 AI Resilience RC6

## Problem zgłoszony przez gracza

„AI nie zwróciło zatwierdzonej odpowiedzi. Z.ai: przekroczony czas, Groq: odrzucona odpowiedź. Ponów pytanie.”

Komunikat oznacza osobno przekroczenie czasu przez Z.ai oraz brak zaakceptowanej odpowiedzi Groq. Bez śladu `qualityDiagnostics` nie można stwierdzić, czy rzeczywista odpowiedź Groq była sprzeczna z fabułą, czy odrzucono poprawną parafrazę.

## Poprawki

1. `lib/interview-budget-636.js`: 22 sekundy zamiast 18 na pierwszą generację Z.ai; całe okno jednego dostawcy 25 s i łączna tura 46 s nadal obowiązują. Nie ma równoległych wywołań.
2. `api/interview.js`: kontrola liczb i niedozwolonych przyznań pozostaje twarda; automatyczna kontrola słowa `nie` w całym wybranym materiale źródłowym nie odrzuca już prawdziwego fragmentu innego zdania. Fragmenty bez istotnej negacji przechodzą niezależny audyt semantyczny, nie automatyczne zatwierdzenie.
3. `api/interview.js`: po pierwszej negatywnej ocenie doboru faktów, formy lub semantyki model może wykonać maksymalnie jedną naprawę. Ostateczna odpowiedź nadal wymaga autoryzowanych faktów i kontroli znaczenia.
4. `lib/interview-quality-635.js`: poprawa konkretnej instrukcji naprawczej dla wybranego powodu odrzucenia.
5. `src/integrations/35-zai-client.js`: gdy API odeśle diagnozę, komunikat odróżnia np. brak oparcia w faktach, błędne ID, niepełną odpowiedź; nie pokazuje kluczy, treści pytania ani historii.
6. Wersja klienta i API `6.36-AI-RESILIENCE-RC6`.

## Bezpieczeństwo i zasady

- **Wolne przesłuchania wymagają prawdziwego Z.ai lub Groq.** Brak odpowiedzi obu modeli nadal oznacza błąd i możliwość ponowienia pytania, nigdy lokalne zeznanie.
- Silnik reguł nie dodaje informacji fabularnych, nie odblokowuje niewidzianych dowodów, nie modyfikuje warunków werdyktu.
- Nie wydłużono globalnego czasu 46 s; Vercel ma ustawiony maksymalny czas funkcji 60 s.

## Testy

`npm run build && npm run check && node tools/test-ai-resilience-rc6.mjs`

`node tools/test-witness-dossiers-rc5.mjs && node tools/test-ai-understanding637.mjs && node tools/test-followup-rc4.mjs && node tools/test-ai-required637.mjs`

**Nie zmieniono GitHuba, Vercel ani Supabase.** Produkcyjnego komunikatu 503 nie można uznać za rozwiązany bez sprawdzenia dokładnego powodu odrzucenia w `qualityDiagnostics.attempts` i testu prawdziwych modeli.
