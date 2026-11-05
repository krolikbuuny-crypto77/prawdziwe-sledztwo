# Raport RC57.10.48 — uporządkowanie wyszukiwania wiedzy AI

## Rzeczywisty zakres zmian

- Zastąpiono pobieranie prawie całego stałego pakietu wypowiedzi ograniczonym, kontekstowym rankingiem z **jednego autoryzowanego rejestru**.
- Klasyfikacja pytania uwzględnia osobę, parę osób, zaimki z zatwierdzonych pytań gracza, temat i okres.
- Wprowadzono pierwszeństwo osobistych faktów związanych z pytaniem przed ogólnymi pouczeniami. Przy braku źródła nie tworzy się wiedzy.
- Wyeliminowano wybór szczegółowego pakietu na podstawie luźnego podobieństwa typu „co wiesz” lub „znałeś”/„znaleziono”.
- Do serwerowego planu odpowiedzi trafia 8 najwyżej ocenionych dozwolonych identyfikatorów jako **ranking**, nie nowe dowody.
- Bank fragmentów jest ograniczony do 36 **łącznie** z okazywanym, zweryfikowanym dokumentem. Nie wpływa to na zakres autoryzacji.
- Dodano narzędzie do sprawdzania dopasowania informacji bez wywołań zewnętrznych.

## Porównanie przed/po — faktyczne wyniki doboru źródeł

| Pytanie | RC57.10.47 | RC57.10.48 |
|---|---:|---:|
| Marek o Wójciku: fakt `RC19-MAREK-S02` | pozycja 18 | pozycja 1 |
| Marek o spotkaniu z Januszem przed północą | pozycja 18 | pozycja 1 |
| Kamil o Lenie: fakt `RC19-KAMIL-S05` | pozycja 20 | pozycja 4 |
| Kamil o logach: fakt `authored-KAMIL-02` | pozycja 37 | pozycja 3 |

Pozycje oznaczają kolejność źródeł w **przekazywanym kontekście**, nie ocenę naturalności rzeczywistej odpowiedzi modelu.

## Potwierdzone testy lokalne

- `node tools/test-rc571048-retrieval.mjs` — **2228 kontroli PASS**: sześć osób, pytania krzyżowe, uprawnienia, okres, zaimki, negacja, zakres 36 faktów, okazywane dokumenty, zgodność źródeł lokalnie i w payloadzie AI.
- `node tools/test-rc571048-api-contract.mjs` — **22 kontrole PASS**: wczesne odrzucenie niepoprawnych żądań i brak przejmowania fałszywych faktów od klienta.
- `node tools/test-rc571047-humanity.mjs` — **8419 PASS** (12 obszarów wiedzy).
- `node tools/test-rc571046-relationships.mjs` — **1325 PASS** (relacje i cudze alibi).
- `node tools/test-rc571045-interrogations.mjs` — **784 PASS** (plan odpowiedzi).
- `node tools/test-rc571044-local-fallback.mjs` — **PASS**.
- `node tools/test-rc571013-negations.mjs` — **600/600 oraz 60/60 PASS**.
- `node tools/test-rc57.mjs` — **600 PASS** (deterministyczne reguły).
- `node tools/test-rc57-whole-game.mjs` — **380 PASS** (reguły śledztwa).
- `python tools/test-saves.py` — **PASS** (zapis, import/eksport, migracje, autosave).
- `python tools/test-navigation.py` — **PASS** (10 zakładek, 320/390/768/1440 px).
- `python tools/test-rc571036-long-chat.py` — **3/3 PASS** (lokalne widoki ze 100 wiadomościami, nie API).
- `npm run build`, `npm run check` — **PASS**: integralność, składnia, odtwarzalność, zasoby, zgodność z kanonem.

## Historyczne niezaliczone testy

Dwa starsze testy nie odzwierciedlają bieżącego przepływu i kończą się błędem także w nietkniętej RC57.10.47:
- `node tools/test-api624-integration.mjs`: oczekuje 200, otrzymuje 400 (nieaktualny format żądania).
- `node tools/test-witness-dossiers-rc5.mjs`: mock nie obsługuje aktualnego etapu `rewrite`.

Nie oznaczono ich jako PASS. Nie jest to test działania produkcyjnego dostawcy ani produkcyjnego Supabase.

## Ograniczenia

1. To usprawnienie **trafności doboru dozwolonych informacji**, nie dodanie nowych wiadomości o życiu prywatnym świadków.
2. Trafniejszy kontekst nie gwarantuje naturalnej wypowiedzi konkretnego modelu; wymaga testów produkcyjnych na Vercel Preview.
3. Nie wykonywano testów kluczy zewnętrznych, limitów dostawcy HTTP 429, opóźnień Apinex/Groq ani produkcyjnego Supabase.
4. Nie zmieniano stylów ani struktury HTML; testy przeglądarkowe obejmują niezmienione widoki.
