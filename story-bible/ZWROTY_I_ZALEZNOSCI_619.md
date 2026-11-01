# Mapa zwrotów akcji i warunki Fabularne 2.0

Osiem istniejących zwrotów dostępnych przez `PS85_STORY.available()` zachowuje swoje bramki. `PS619_NARRATIVE.beats` dodaje do każdego zestaw: przesłanka → odkrycie → reinterpretacja → reakcja → dalsza możliwość. Nie zmienia żadnych warunków odblokowania.

| Zwrot | Przesłanka i odkrycie | Nowe znaczenie | Reakcja | Możliwość |
|---|---|---|---|---|
| `work` | Dyspozycja + zlecenie warsztatu | Papier nie zastępuje pomiaru | Marek i Janusz dzielą odpowiedzialności | Weryfikacja realizacji zlecenia |
| `warning` | Projekt BHP + odbiór | Wiedza o ryzyku ≠ zgłoszenie | Elżbieta i Magdalena | Porównanie kanałów obiegu |
| `access` | T-17 + sesja audytu | Konto/karta ≠ osoba | Kamil i Magdalena | Niezależna identyfikacja |
| `lastcontact` | Dyspozycja + wiadomość | Dwa odrębne odcinki nocy | Tomasz | Sprawdzenie autora kontaktu |
| `mechanism` | Wiadomość + opinia o obrażeniach | Kontakt ≠ dowód przemocy | Elżbieta i Magdalena | Osobna rekonstrukcja urazu |
| `faultline` | Warsztat + BHP | Dwa kanały zaniedbań | Marek i Elżbieta | Kto otrzymał który sygnał |
| `presence` | Elektroniczne alibi + korespondencja | Ciągła sesja ≠ obecność | Kamil i Magdalena | Niezależne potwierdzenie trasy |
| `boundary` | Zestawienie końcowe | Opowieść ≠ udowodnienie | Wszyscy we własnym zakresie wiedzy | Akt oparty na odrębnych źródłach |

## Gating historii Leny

| Rozdział | Wymagane, posiadane już dokumenty |
|---|---|
| Praca Leny | `TEC-01` |
| Upór i omylność | `TEC-03`, `TEC-04` |
| Rozmowa 21:47 | `DIG-01` |
| Niewysłane BHP | `EVID_BHP_DRAFT`, `EVID_OUTBOX_MISSING_SUBMISSION` |
| L-2/L-3 | `TEC-15`, `EVID_SERIAL_PHOTO`, `EVID_ACCEPTANCE_RECORD` |
| Ostatni kontakt | `EVID_MESSAGE_THREAD_RECOVERED`, `EVID_MESSAGE_DEVICE_METADATA` |

Każdy rozdział jest komentarzem opartym na istniejących dokumentach, **nie nowym dowodem**. Wszystkie rozdziały są opcjonalne — niczego nie trzeba odczytywać, aby ukończyć śledztwo.

## Istniejący łańcuch decyzji pozostaje nienaruszony

1. Z.ai → Groq → WitnessEngine dla dialogów; żadnego bezpośredniego klucza API w przeglądarce.
2. Lokalna chronologia i minigry pozostają w UI, zaś zatwierdzanie postępu leży w `/api/game-state` i regułach `lib/progression-618.js`.
3. Cloudflare działa tylko jako recenzent hipotez i dowodów; wynik AI nie odblokowuje postępu.
4. Finał według reguł 6.18. Epilog 6.19 **nie** tworzy nowego werdyktu, a warianty prezentacyjne wynikają z dotychczasowego `STATE.sim.trial.kind`.
5. Offline zapisuje lokalnie, synchronizuje po powrocie łączności, bez uznawania lokalnego stanu za zatwierdzony serwerowo.
