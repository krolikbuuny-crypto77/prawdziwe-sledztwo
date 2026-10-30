# Prawdziwe Śledztwo — 6.36 AI Understanding RC3

## Cel i zakres

Z.ai (główny) i Groq (rezerwowy) wybierają odpowiedź na podstawie **oryginalnego polskiego pytania i całego dopuszczonego zbioru faktów**. Wcześniejszy lokalny parser (`question-intent-633.js`) nie przekazuje już modelom narzuconego `questionPlan` ani `questionParts`. Parsowanie lokalne pozostaje pomocnicze dla logiki UI i niektórych zabezpieczeń, lecz nie powinno ograniczać dostępnych publicznych faktów.

Nie oznacza to, że AI ma dowolny dostęp do fabuły. Kanon, bramki postępu, własność okazanego dowodu, autoryzacja i zapis pozostają po stronie serwera/Supabase. Nie przekazujemy faktów z ukrytych korekt, dopóki serwer nie potwierdzi odpowiednich warunków.

## Wprowadzone zmiany

1. `lib/trusted-interview-624.js`: wszystkie jawne, scenariuszowo zatwierdzone wypowiedzi postaci są dostępne dla AI niezależnie od sformułowania pytania, zamiast tylko 7 najlepiej dopasowanych do słów kluczowych. Obejmuje to relację z Leną, alibi, sposób pozyskania informacji i ograniczenia wiedzy. Wciąż brak nieodblokowanych dokumentów i `evidence_strong` bez bramki; podanie dokumentu wymaga potwierdzenia na serwerze. Nieodpowiednie do okazanego dowodu szablonowe `evidence_weak` nie jest przekazywane dla konfrontacji.
2. `api/interview.js`: `attemptInterview` usuwa lokalny plan z ładunku wysyłanego do Z.ai oraz Groq; model dostaje oryginalne pytanie, zatwierdzoną historię, dopuszczone fakty i autorytatywny dokument.
3. Główna instrukcja AI wymaga samodzielnego rozpoznania referentu i żądanej informacji oraz zwrócenia struktury `understanding` (diagnostycznej, bez uprawnień do zmiany stanu). Nie dodajemy osobnego zapytania AI tylko do klasyfikacji, więc liczba obowiązkowych wywołań nie wzrasta.
4. Ostatni filtr oparty o dwie kategorie lokalnego parsera (`relevantForQuestion`) nie ma prawa już odrzucać odpowiedzi wyłącznie na podstawie błędnego przypisania tematu. Pozostaje kontrola faktów, jakości wypowiedzi, ochrony dowodów oraz niezależny audyt semantyczny tam, gdzie wymagany.
5. `api/status.js` i `src/index.template.html`: oznaczenie `6.36-AI-UNDERSTANDING-RC3`.
6. `tools/test-ai-understanding637.mjs`: regresje sześciu świadków i sześciu parafraz, błędnego lokalnego tematu, audytu semantycznego oraz blokady niezweryfikowanych dowodów.

## Zaliczone kontrole lokalne

- `npm run build` i `npm run check`: PASS.
- `node tools/test-ai-understanding637.mjs`: PASS (6 świadków × 6 parafraz; oryginalne pytanie i wszystkie jawne fakty w wywołaniu AI, bez lokalnego planu).
- `node tools/test-victim-relationship636.mjs`: PASS.
- `node tools/test-stage1-636.mjs`, `test-stage1-diagnostics636.mjs`, `test-stage2-636.mjs`, `test-stage3-636.mjs`: PASS.
- `node tools/test-pre-github636.mjs`, `test-ai-required637.mjs`, `test-release-candidate636.mjs`: PASS.
- `node tools/test-dialogue635.mjs`: PASS.
- `python tools/test-cloud-evidence635.py`, `test-stage2-sync636.py`, `test-stage4-636.py`, `test-saves.py`, `test-witnesses.py`, `test-transaction636.py`: PASS.
- `test-api629.mjs`, `test-interview630.mjs`, `test-api624-integration.mjs`, `test-security624.mjs` nie przechodzą przez historyczne oczekiwanie obsługi przesłuchania bez obowiązkowego `turnId` / sesji. Nie są dowodem awarii RC3; testy aktualnego kontraktu przechodzą.
- `test-audit634.py`: **nieukończony** (timeout), niezaliczony w raporcie.

## Ograniczenia i ryzyka

- **Nie testowano prawdziwych odpowiedzi Z.ai ani Groq.** Testy wywołań korzystały z kontrolowanych modeli/symulowanych odpowiedzi. Poprawa rzeczywistej jakości wymaga testów produkcyjnego modelu z wieloma parafrazami, wielowątkowymi pytaniami i ujawnionymi dowodami.
- Semantyka generacji pozostaje probabilistyczna. Nie gwarantujemy, że każde pytanie zostanie zrozumiane. Sztywny analizator nadal jest używany do przygotowania części kontekstu i walidacji UI, ale nie wybiera wąskiego zestawu faktów dla chmury.
- Większy kontekst jawnych faktów może zwiększyć użycie tokenów oraz czas odpowiedzi. Nie zwiększono limitów czasu; limit całej tury pozostaje 46 s w kodzie.
- `SUPABASE 003` pozostaje **obowiązkową migracją** przed wdrożeniem. Bez niej przesłuchania mogą zwrócić 503.
- Pozostaje staging: prawdziwe Z.ai/Groq, Supabase, Vercel Preview oraz pełne przejście gry.
- Nie zmieniano GitHuba, działającej strony ani produkcyjnej bazy.
