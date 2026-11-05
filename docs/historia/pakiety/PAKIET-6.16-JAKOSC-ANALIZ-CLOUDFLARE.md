# Prawdziwe Śledztwo — Pakiet 6.16: lepsza jakość analiz Cloudflare

## Zakres

Cloudflare AI ocenia wyłącznie hipotezy i powiązane z nimi **dostępne dla gracza** materiały z tablicy dedukcyjnej. Z.ai pozostaje jedynym modelem używanym do przesłuchań, także do formułowania odpowiedzi świadków. Pakiet 6.16 nie dodaje nowych minigier, progów zaliczenia, obowiązkowych czynności ani zmian fabuły.

## Co nowego

- Opinia AI rozróżnia **co rzeczywiście wynika ze źródeł** od **tego, czego materiał jeszcze nie potwierdza**.
- Do każdej konkretnej uwagi przypisany jest identyfikator dostępnego źródła; interfejs pokazuje jego nazwę.
- Zamiast kolejnego surowego wyniku procentowego, nowy endpoint podaje zwięzłe uzasadnienie i **jeden opcjonalny krok**, bez narzucania dodatkowego zadania.
- Prompt zachęca do ostrożnej polszczyzny, rozróżniania obserwacji od interpretacji i unikania zmyślonych szczegółów.
- Serwer odrzuca niezrozumiałe zapytania i nie ujawnia sekretu Cloudflare. Nieznane identyfikatory źródeł są usuwane z odpowiedzi; nie ma wprowadzania dowodów do gry.
- Prośba do Cloudflare zawiera maksymalnie 8 już połączonych źródeł. Wynik pozostaje opinią pomocniczą.
- Nowy endpoint: `api/evidence-review.js`, bez nadpisywania starszego `api/evaluate`. Frontend spróbuje starego endpointu **tylko przy HTTP 404** z nowego (etapowe wdrożenie).
- Przy błędzie API pozostaje lokalna ocena źródeł. Wszelkie dotychczasowe warunki uznania hipotezy i finału pozostają takie same.

## Konfiguracja na Vercel

W ustawieniach projektu Vercel -> Environment Variables ustaw:

- `CLOUDFLARE_ACCOUNT_ID`: identyfikator konta Cloudflare.
- `CLOUDFLARE_API_TOKEN`: token API Cloudflare ze zgodą na Workers AI.

Istniejący `ZAI_API_KEY` pozostaje bez zmian. Nie umieszczaj tokenów w GitHubie ani w kodzie frontendowym.

Domyślny model to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; wybrany z powodu obsługi strukturalnego JSON Mode. Endpoint korzysta z oficjalnego REST `POST /accounts/{account_id}/ai/run/{model_name}`. Rzeczywista dostępność zależy od uprawnień konta, limitów i rozliczeń Cloudflare.

Nie używaj Cloudflare do przesłuchań. **Nowe połączenie nie poprawia odpowiedzi Z.ai; poprawia jakościowo opisy materiałów dowodowych.**

## Testy

```bash
npm run build
npm run check
npm run test:evidence-quality
npm run test:reasoning
npm run test:saves
npm run test:witnesses
```

Mockowane scenariusze obejmują brak danych, niedozwolone identyfikatory źródeł, odmowę Cloudflare, brak konfiguracji, zgodność ze starszym endpointem i zachowanie zapisów.

**Ograniczenie:** testy potwierdzają integrację i ochronę reguł gry. Odpowiedzi rzeczywistego modelu Cloudflare nie były badane na żywym API; poprawa merytorycznej trafności wymaga jeszcze ewaluacji na znanych dokumentach i z poprawnym tokenem konta. Sprawdzanie samych identyfikatorów nie wykryje każdej błędnej interpretacji tekstu źródła.
