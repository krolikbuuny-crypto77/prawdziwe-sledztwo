# Raport QA RC34 — Synchronizacja przesłuchań

Przetestowano:
- HMAC podpisów i odmowę uznania zmienionych odpowiedzi, świadka, okazanych dowodów lub podrobionego podpisu;
- import podpisanych wypowiedzi do serwerowego JSONB wyłącznie jako relacje, bez `factIds` i zmiany `approvedEvidence`;
- starsze niepodpisane zapisy w kwarantannie `offline_unverified` i brak ich treści w kontekście modelu;
- idempotencję importu, limit 8 wpisów na wywołanie, limit 24 pary na świadka w przeglądarce;
- obsługę sześciu świadków, zachowywanie ostatnio wybranego świadka;
- przeglądarkowy test wysłania załadowanych rozmów do atrap endpointu;
- dotychczasowe testy RC33, etapy 6.36, eksport/import, wszystkie historyczne migracje i nawigację.

Nie przetestowano dostępu do realnej produkcyjnej bazy Supabase ani ciągłości autentycznego modelu AI po wdrożeniu.
