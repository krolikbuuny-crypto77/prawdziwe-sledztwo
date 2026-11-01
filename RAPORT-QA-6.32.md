# Raport QA 6.32

Źródło: pełna paczka `Prawdziwe_Sledztwo_6_31_PELNA_WERSJA.zip`. Zakres zmian: celowane korekty odpowiedzi lokalnych i dynamiczny podpis zdjęcia w Oględzinach.

## Reprodukowane błędy na 6.31

- Janusz: pytanie o brak wpisu przekierowywało czasem do ogólnego motywu działania.
- Elżbieta: pytanie `Czy zgłoszenie BHP zostało wysłane?` otrzymywało odpowiedź bez stanowiska o potwierdzeniu wysłania.
- Kamil: pytanie `Co dokładnie potwierdza autoryzację?` zaczynało się od `Nie.`.
- Tomasz: pytanie o własny pobyt, z wyraźną negacją ostatniego widzenia Leny, wywoływało powrót do tamtego tematu.
- Podpis fotografii był na stałe `materiał przed zabezpieczeniem`.

## Testy 6.32

- `npm run build`: PASS
- `npm run check`: PASS
- `npm run test:regression632`: PASS na 390 i 1280 px, po 14 pytań, ochrona pytań wrażliwych, spójność zapisów jednej tury, trzy stany zdjęcia.
- `npm run test:priority1`: PASS — przeglądarka i mocki serwera.
- `npm run test:fast-evidence`: PASS — jawność dokumentów i dowodów.
- `npm run test:api629`: PASS — autoryzacja źródeł i kontrola serwerowa.

**Nie zweryfikowano:** produkcyjnego działania Z.ai, Groq, Cloudflare AI, Supabase ani szybkości end-to-end. Wersja 6.32 nie skraca limitów API i nie rozwiązuje wszystkich możliwych przypadków błędnego rozumienia wypowiedzi.
