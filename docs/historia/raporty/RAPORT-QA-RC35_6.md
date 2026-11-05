# Raport QA RC35.6 — korekta integralności migawki

## Reprodukcja przyczyny (na poprzedniej RC35.5)
`PS_SAVE_MANAGER.verify(PS_SAVE_MANAGER.build())` => OK, ale rekurencyjne przestawienie kluczy obiektu zapisu (jak przy serializacji Postgres JSONB) => `Suma kontrolna zapisu nie zgadza się`.

## Poprawka
Migawka jest przekazywana jako `saveJson` (tekst z oryginalnymi bajtami JSON), a nie jako obiekt `save`. Normalna weryfikacja SHA-256 pozostaje w mocy.

## Wyniki
- PASS — `npm run build` i `npm run check`.
- PASS — dwie przeglądarki, PostgreSQL JSONB reordering, jedna wspólna historia, poprawna synchronizacja, przekazanie sterowania (`test-rc356-jsonb-integrity.py`).
- PASS — celowe zmodyfikowanie tekstu migawki przy zachowaniu starej sumy powoduje odmowę przywrócenia.
- PASS — bezpieczeństwo API pokoju (`test-rc35-coop.mjs`).
- PASS — czat dwuosobowy (`test-rc351-chat.mjs`, `test-rc355-chat-browser.py`).
- PASS — przejęcie sterowania przy odświeżaniu (`test-rc355-slow-refresh.py`).
- PASS — rozmieszczenie elementów na 7 rozdzielczościach (`test-rc355-layout.py`).
- PASS — 40 par u sześciu świadków (`test-rc341-history-40.mjs`).

Brak potwierdzenia na produkcyjnej sesji Supabase/Vercel. Bezpośrednia migracja starej migawki JSONB bez pierwotnego porządku kluczy nie jest możliwa przy zachowaniu pierwotnej sumy kontrolnej; dla takich pokoi może być konieczne ponowne utworzenie pokoju.
