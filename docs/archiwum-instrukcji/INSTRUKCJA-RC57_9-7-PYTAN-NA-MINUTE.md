# RC57.9 — limit 7 pytań na minutę w testerze AI

## Instalacja

- Jeżeli na GitHub działa RC57.8: rozpakuj `Prawdziwe_Sledztwo_RC57_9_HOBBY_POPRAWKA_DO_RC57_8.zip` i skopiuj pliki do katalogu głównego projektu, zachowując podkatalogi. **Nie wgrywaj samego pliku ZIP jako pliku gry.**
- Jeżeli na GitHub jest starsza wersja: użyj pełnej paczki RC57.9. Sprawdź, czy w `api/` jest maksymalnie 12 plików `.js`; usuń stare, wycofane `api/status.js` lub `api/admin-rc57-ui.js`, jeśli pozostają po starszych aktualizacjach.
- W Vercel pozostaw `APINEX_API_KEY`, `RC57_ADMIN_PASSWORD`, `RC57_ADMIN_SECRET` oraz `RC57_LIVE_TEST_ENABLED=true`. Nie potrzeba nowych kluczy.
- Zatwierdź zmiany w GitHub, sprawdź status **Ready** w Vercel, otwórz `/admin/testy`.

## Tempo AI

- Limit: **maksymalnie 7 rozpoczęć pytań testowych w dowolnym oknie 60 sekund**.
- Minimalny odstęp pomiędzy rozpoczęciami: `Math.ceil(60000 / 7) = 8572 ms`.
- Czas odpowiedzi modelu zalicza się do odstępu. Jeżeli odpowiedź trwa 10 sekund, nie wprowadza się dodatkowej przerwy 8,572 s.
- Jeden wspólny licznik obejmuje oba modele Apinex, testy 18/72 pytań, dwa etapy testu ślepego oraz wznowienia.
- Po zablokowaniu z powodu 429 tester uwzględnia przerwę zalecaną przez serwer (np. 60 sekund) i nie próbuje wysłać ponowionego pytania wcześniej.
- Limit obowiązuje **w jednej otwartej karcie**. Nie jest globalnym ograniczeniem dla wszystkich kart, urządzeń ani funkcji Vercel; należy uruchamiać tylko jedną sesję testową naraz.
- To limit pytań **testera**, nie wywołań modelu. Jedno pytanie może wykonać więcej niż jeden request do Apinex (generowanie / audyt / naprawa), więc błąd 429 nadal jest możliwy.
- Dane o tempie są dołączane do pobieranego raportu JSON (`rateLimit`).

## Bezpieczeństwo zmian

Zmiana dotyczy panelu administratora i testów. Nie zmienia plików fabuły, dowodów, zapisów, bazy Supabase ani głównego `index.html`.
