# Prawdziwe Śledztwo 6.38 RC34.1 — 40 par rozmów na świadka

## Co się zmienia
- Supabase zachowuje ostatnie 40 par (80 wiadomości) u każdego z sześciu świadków, zamiast 24 par.
- Przy imporcie pliku zapisu lub wznowieniu autosave synchronizuje się do 40 najnowszych par na świadka.
- Moduły pamięci dialogu, tematów i reakcji psychologicznych mogą korzystać z zakresu do 40 par.
- Wysyłany do modelu kontekst pozostaje skrócony: przede wszystkim pięć ostatnich par oraz wybrane wcześniejsze wątki. Zwiększenie pojemności serwera nie oznacza dosyłania wszystkich 40 rozmów w każdym zapytaniu AI.
- Pary powyżej limitu 40 pozostają widoczne w lokalnym dzienniku (o ile zawiera je plik zapisu), ale nie mieszczą się już w kontekście pamięci serwera.
- Nadal obowiązują podpisy RC34. Niepodpisane stare odpowiedzi nie stają się faktami; żaden import nie przyznaje dowodów, postępu ani werdyktu.

## Instalacja
1. Z pełnego ZIP wgraj całą zawartość do repozytorium zamiast starej wersji, zachowując istniejące serwerowe zmienne środowiskowe i bazę Supabase. Alternatywnie: jeśli Twoje źródła są w RC34, wypakuj mały ZIP RC34.1 na RC34 z zachowaniem ścieżek.
2. Sprawdź Vercel deployment i połączenie z Supabase. Nie ma nowych kluczy ani migracji SQL.
3. Przywróć zapis gry zawierający 40 par u wybranego świadka; poczekaj na zakończenie synchronizacji.
4. Zapytaj świadka o wcześniejszy wątek. Wspomnienia nie zastępują twardych faktów z kanonu.

## Testy
- `npm run build && npm run check`
- `npm run test:rc341` — test pamięci 40 par, potok importu, 80 wiadomości na świadka, Chromium, regresja RC34/RC33.
- Automatyczne testy nie zastępują testu produkcyjnego na rzeczywistym Supabase i z działającymi kluczami modeli.

## Uwagi
Przy maksymalnym scenariuszu sześciu świadków i czterdziestu par każdy import może wymagać 30 małych wywołań synchronizacji (8 par na żądanie), więc dłużej niż RC34. To osobny proces od 270-sekundowego budżetu odpowiedzi AI.
