# Prawdziwe Śledztwo 6.36 — Etap II (paczka testowa)

**Baza:** 6.36 Etap I. **Zakres:** konfrontacje 78 materiałów, synchronizacja zatwierdzenia dowodu przed analizą AI oraz spójność informacji zwrotnej dedukcji.

## Zmiany

1. **Serwerowe źródło prawdy o okazywanym materiale:** `lib/exhibit-context-636.js` udostępnia identyfikator, tytuł, rodzinę, typ, ograniczenie interpretacji i treść wyłącznie ze zweryfikowanego rejestru po odczytaniu sesji. Nazwa, typ i treść podane przez klienta są ignorowane. Dalsze kontrolki narracyjne (z 6.35/Etapu I) nadal obowiązują.
2. **Inteligentna reakcja AI:** zarówno Z.ai, jak i Groq otrzymują ten sam materiał serwerowy. Weryfikacja jakości wypowiedzi wymaga odniesienia do okazanego materiału. Silnik lokalny pozostaje rezerwą.
3. **Synchronizacja przed konfrontacją:** `PS617_SYNC.ensureEvidence` czeka ograniczony czas na serwerowe zatwierdzenie świeżo zdobytego materiału i nigdy nie przyznaje uprawnień na podstawie `STATE.found`. Gdy zatwierdzenia nie ma, konfrontacja pozostaje lokalna. To nie jest automatyczna synchronizacja całej lokalnej bazy dowodów.
4. **Dedukcja:** obok pomocniczych tez Cloudflare AI wyświetlana jest oddzielna, niezmieniana punktacja lokalnego audytu warsztatu oraz informacja o brakach formalnych. Potwierdzenie przesłanki przez AI nie podnosi punktacji i nie zmienia werdyktu.
5. **Wersja:** metadane strony `6.36-II`.

## Uruchomienie testów

```
npm run build
npm run check
npm run test:stage2-636
npm run test:unified633
npm run test:priority1
npm run test:witnesses
```

## Ograniczenia

- Test 78/78 sprawdza prawidłowość **mapowania i autoryzacji rejestru**, a nie 78 pełnych interaktywnych konfrontacji ani ich jakości w Z.ai/Groq.
- Bieżąca infrastruktura Vercel/Supabase nie była używana. Testy synchronizacji korzystają z lokalnego serwera pozorowanego w przeglądarce. Przed wdrożeniem produkcyjnym wymagany staging.
- Analiza AI dedukcji jest doradcza; polskie parafrazy i niski wynik heurystyczny nadal wymagają sprawdzenia na rzeczywistych przypadkach, a nie arbitralnego podwyższania oceny.
- Nie wprowadzono nowych reguł fabularnych, odblokowań ani decyzji werdyktu. Nie zmieniono danych Supabase, GitHuba ani Vercel.
