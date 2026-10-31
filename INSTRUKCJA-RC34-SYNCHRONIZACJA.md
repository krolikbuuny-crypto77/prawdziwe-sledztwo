# RC34 — Synchronizacja historii przesłuchań po wczytaniu zapisu

Podstawa: pełna RC33 (6.38). Poprawka nie zmienia list modeli, limitów czasowych ani kanonu fabuły.

## Co działa

1. Ręczny import pliku JSON uruchamia synchronizację rozmów z `/api/interview-restore`, a potem z Supabase. Przy wznowieniu autosave również synchronizuje pamięć.
2. Maksymalnie 24 ostatnie pary pytanie–odpowiedź na świadka trafiają do serwerowej historii (oryginalne 1600 wpisów mogą pozostać widoczne lokalnie). Import jest porcjowany; duplikaty są pomijane.
3. Nowe odpowiedzi serwera otrzymują podpis HMAC `turnProof` i identyfikator `turnId`, zapisane w metadanych wypowiedzi. Po przeniesieniu pliku na inny komputer można zweryfikować autentyczność tych cytatów, jeśli `GAME_SESSION_SECRET` jest ten sam.
4. Starsze zapisy RC33 nie mają podpisów. Takie odpowiedzi są zapisane jako `offline_unverified`: służą do wyświetlenia i zachowania pytań, **nie są przekazywane AI jako potwierdzone wypowiedzi**, nie są podstawą nowych faktów, odblokowań ani werdyktu. Jeżeli oryginalne odpowiedzi nadal istnieją w tej samej sesji Supabase, gra je zachowuje i korzysta z nich.
5. Wczytanie pliku przywraca ostatnio aktywnego świadka (`activeChar`). Pliki wcześniejsze, bez tego pola, zachowują dotychczasowe działanie.
6. Przy imporcie sprawdzana jest zgodność z istniejącą historią serwera. Jeśli ta sama sesja ma już cytaty, nie jest resetowana. Jeśli import jest z innego śledztwa, następuje reset serwerowej sesji, aby nie pomieszać zatwierdzonego postępu różnych rozgrywek. Stan lokalnego zapisu pozostaje widoczny; importowany postęp/dowody nie otrzymują automatycznie zatwierdzenia serwerowego.

## Wdrażanie

1. Wgraj zawartość pełnego ZIP RC34 zamiast RC33; uruchom `npm run build` jeśli wdrażasz z kodu źródłowego (pełny ZIP ma już wygenerowany `index.html`).
2. Vercel potrzebuje już istniejących `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` (minimum 32 znaki) i migracji Supabase z RC33. Nowa tabela ani migracja SQL **nie jest wymagana**, ponieważ nowe pola mieszczą się w JSONB `approved_state`.
3. Klucze przechowuj tylko w zmiennych Vercel; nie umieszczaj ich w plikach gry.
4. Otwórz grę, przeprowadź rozmowę, zapisz plik, wczytaj go i zadaj pytanie doprecyzowujące. W Supabase sprawdź `witnesses` i `interviewReceipts`.
5. **Ważne:** aby weryfikować podpisy w kolejnych wdrożeniach, nie zmieniaj `GAME_SESSION_SECRET` bez migracji.

## Granice potwierdzenia

- Testy endpointu i przeglądarki są wykonywane na atrapach sesji; nie wykonywano produkcyjnych zapytań do Supabase ani prawdziwych modeli na koncie właściciela.
- Stary plik RC33 przeniesiony na nowe konto/komputer nie może dowieść, że wcześniejsza odpowiedź została rzeczywiście zatwierdzona przez serwer. Zabezpieczenie jest celowe.
- Przy nieudanej synchronizacji plik nadal się wczytuje lokalnie, a interfejs informuje o braku kompletnej pamięci serwerowej.
