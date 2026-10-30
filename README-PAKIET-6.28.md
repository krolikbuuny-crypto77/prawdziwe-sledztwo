# Wersja 6.28 — poprawki po teście gry (30.10.2026)

Kompletny pakiet do nadpisania plików repozytorium GitHub.

1. Pamięć `ps68`: priorytet pytania o własne alibi przed wzmianką o Lenie w zanegowanej części pytania; migracja błędnie oznaczonych odcinków wcześniejszego zapisu bez zmieniania tekstu zeznania.
2. Oględziny: wspólne nazwy trzech stanów, synchronizacja karty fotograficznej z etapem zabezpieczenia i dwa niezależne liczniki (zbadano / zabezpieczono).
3. Wznowienie: modalne pytanie Kontynuuj śledztwo / Nowe śledztwo przed pokazaniem zerowego pulpitu; brak automatycznej decyzji po kliknięciu poza komunikatem.
4. Efekty: brak animowanego komunikatu o nowym materiale podczas przywracania istniejącego zapisu.
5. Diagnostyka: `?debugAI=1` w adresie gry; przy odpowiedziach: provider, model, fallbackReason, durationMs, requestId. Metadane trafiają do zapisu JSON, bez kluczy API.

Po wypakowaniu skopiuj zawartość ZIP *do katalogu repozytorium*, nadpisz istniejące pliki, wykonaj GitHub Desktop Commit i Push. `npm run build` wykonuje się w Vercel według konfiguracji projektu. Nie zamieszczaj plików `.env` z sekretami.

Testy lokalne nie są dowodem działania produkcyjnego Z.ai, Groq ani Supabase.

## Uzupełnienie kontroli — wersja 6.28.1

Podczas niezależnej weryfikacji 6.28 wykryto, że frontend zapisywał prawidłowe
`fallbackReason: backend_http_429/503/404`, po czym nadpisywał je ogólnym
`unsupported_response`. W 6.28.1 oryginalny status HTTP pozostaje w diagnostyce
świadka i eksporcie JSON. Nie zmienia to faktów gry, treści zeznań ani backendu.
Dodatkowy test: `python tools/test-diagnostic-http6281.py`.
