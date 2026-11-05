# QA — Pakiet 6.16: jakość opinii dowodowych, bez zwiększenia trudności

## Testy przeprowadzone lokalnie

| Test | Wynik | Zakres |
|---|---|---|
| `npm run build` | PASS | Reprodukowalny `index.html` |
| `npm run check` | PASS | Składnia, 61 skryptów, 64 sekcje CSS, 75 WebP, 9 MP3, integralność manifestu |
| `npm run test:evidence-quality` | PASS | REST Cloudflare na mocku, schemat danych, odrzucanie obcych referencji, pomocniczy interfejs, awarie, zachowanie stanu |
| `npm run test:reasoning` | PASS | Karty dedukcyjne, kwalifikacje, obrona, zapis, starszy kontrakt `/api/evaluate` |
| `npm run test:events` | PASS | EventBus i finał |
| `npm run test:saves` | PASS | 11 migracji, import, eksport, autoload, reset |
| `npm run test:witnesses` | PASS | 720 tur, sześciu świadków, pamięć i ochrona dowodów |
| `npm run test:ai-primary` | PASS | Z.ai jako główny rozmówca, symulowana awaria, lokalny fallback |
| `npm run test:navigation` | PASS | 40 rzeczywistych kliknięć, cztery szerokości |
| `npm run test:story` | PASS | Konsekwencje fabularne, cztery szerokości |
| `npm run test:memory` | PASS | Pamięć długoterminowa świadków |
| `npm run test:inspections-puzzles` | NIEZAMKNIĘTY | W logu PASS dla lupy 4K oraz pięciu minigier x2 szerokości, ale całość przekroczyła limit czasu. |

## Sprawdzone zasady

- Żaden wywołany komponent analizy Cloudflare nie zmienia `STATE.found`, `STATE.dialogues`, liczby kart ani podstawy werdyktu.
- Nowe `api/evidence-review.js` i `src/integrations/53-vercel-ai-client.js` działają poza przepływem przesłuchań.
- Do serwera trafia najwyżej 8 źródeł, które lokalny ReasoningEngine potwierdza jako dostępne.
- Serwer nie przekazuje klientowi nieznanych identyfikatorów źródeł wygenerowanych przez model.
- Brak HTTP 200 i błędny JSON modelu nie przerywa rozgrywki.
- Nowy endpoint nie zastępuje istniejącego `api/evaluate`; kompatybilność jest włączana tylko po 404.
- **Brak podwyższania poziomu trudności:** nie dodano nowych bramek ani wymagań.

## Ograniczenia

Testy Cloudflare wykonano na mocku; rzeczywiste API i dostępność modelu wymagają konfiguracji `CLOUDFLARE_ACCOUNT_ID` i `CLOUDFLARE_API_TOKEN` na Vercel. Użycie odniesienia do znanego źródła samo w sobie nie gwarantuje, że model właściwie zrozumiał jego treść. Wszelkie opinie należy traktować jako pomoc, a nie arbitra prawdy.
