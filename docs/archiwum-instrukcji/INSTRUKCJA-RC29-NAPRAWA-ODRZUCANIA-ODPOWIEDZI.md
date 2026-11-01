# Prawdziwe Śledztwo — 6.38 RC29

## Co poprawiono

W RC28 serwer `/api/interview` generował i zapisywał odpowiedzi zatwierdzone przez dostawców APINEX (Luna, GLM, DeepSeek), Z.ai i lokalną rezerwę. Klient `src/integrations/35-zai-client.js` odrzucał nowe wypowiedzi od wszystkich dostawców innych niż Gemini (Z.ai/Groq akceptował tylko przy `replayed:true`). Dlatego przy pytaniu „Masz alibi?” mógł pojawiać się komunikat „Odrzucono nieprawidłową odpowiedź AI. Ponów pytanie.”, mimo odpowiedzi HTTP 200.

RC29 synchronizuje listę dostawców dozwolonych w kliencie z serwerem. **Nie usuwa zabezpieczeń:** nadal sprawdza `serverCanonical`, `semanticVerified` dla chmury albo `localVerified` dla lokalnej rezerwy, `decision`, zgodny identyfikator tury, długość i niedozwolone znaki tekstu.

## Zmienione pliki
- `src/integrations/35-zai-client.js` — warunek akceptacji dostawców
- `src/build-manifest.json` — aktualny SHA-256 i rozmiar zaktualizowanego modułu
- `index.html` — odbudowany interfejs, aby zmiana dotarła do działającej strony
- `tools/test-provider-acceptance-rc29.py` — nowy test przeglądarkowy

Nie zmieniano: `api/interview.js`, serwerowych reguł faktów, schematu Supabase, kluczy API, etapów fabularnych, ustawień Vercel ani `lib/interview-naturalness-rc28.js`.

## Wdrożenie pełnego ZIP-a
1. Zachowaj kopię aktualnego repozytorium GitHub (i wskazanie poprzedniego działającego wdrożenia Vercel).
2. Rozpakuj ZIP RC29 na komputerze.
3. Wgraj **zawartość** rozpakowanego katalogu do istniejącego repozytorium `krolikbuuny-crypto77/prawdziwe-sledztwo`, zachowując strukturę folderów. Nie klikaj Import w Vercel — to niepotrzebnie utworzy kolejny projekt.
4. W Vercel sprawdź najnowszy deployment: Production → Ready.
5. Odśwież stronę gry kombinacją Ctrl+Shift+R.
6. W przesłuchaniu Marka wpisz „Masz alibi?”. Odpowiedź zatwierdzona przez serwer powinna zostać wyświetlona. Jeżeli nadal pojawi się błąd, sprawdź w DevTools Network odpowiedź `/api/interview` i diagnostykę serwerową, **bez udostępniania sekretów**.

Można także zastosować mały ZIP aktualizacyjny RC29 zawierający trzy wymienione pliki aplikacji oraz test, bez ponownego wgrywania wszystkich zasobów.

## Ograniczenia
- Testy dostawców korzystały z atrap odpowiedzi API (bez realnych zapytań do płatnych/zewnętrznych dostawców).
- Oryginalna pełna paczka RC28 była rekonstruowana z poprzedniej wersji i repozytorium. Nie rozwiązano pozostałych starych niezgodności testów regresyjnych.
- Jeśli AI nie wygeneruje zatwierdzonej odpowiedzi **na serwerze**, ta poprawka nie zmieni odrzucenia w poprawną odpowiedź. Naprawia konkretną niezgodność klient–serwer.
