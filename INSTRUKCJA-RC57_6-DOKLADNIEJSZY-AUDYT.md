# Prawdziwe Śledztwo — RC57.6: precyzyjniejszy tester i pamięć świadków

## Instalacja

Najprościej: pobierz **pełną paczkę RC57.6** i wgraj jej pliki do istniejącego repozytorium GitHub, zachowując układ katalogów. Alternatywnie, jeśli Twoje repozytorium już ma dokładnie RC57.5, zastosuj **poprawkę RC57.5 → RC57.6**, nadpisując pliki o tych samych ścieżkach. Przy instalowaniu poprawki nie trzeba usuwać żadnych dodatkowych plików API. Upewnij się, że w `api/` jest dokładnie 12 plików `.js`; starsze `api/status.js` i `api/admin-rc57-ui.js` nie mogą wrócić.

Następnie zatwierdź zmiany w GitHub i poczekaj na **Ready** w Vercel. Tester jest dostępny na `/admin/testy`. Żeby skorzystać z rzeczywistego modelu AI, pozostaw `RC57_LIVE_TEST_ENABLED=true` dla **Production**, `RC57_ADMIN_PASSWORD`, `RC57_ADMIN_SECRET` oraz wybrany `APINEX_API_KEY` lub `ZAI_API_KEY`. Po zmianie zmiennych środowiskowych wykonaj Redeploy. Nie podawaj kluczy w panelu gry.

## Nowe zachowania

- **Ślepy audyt dowodów:** weryfikuje identyfikatory dokumentów także w uzasadnieniu, kontrargumencie i opisie brakującego dowodu. Odróżnia dokument nieistniejący od istniejącego, lecz nieosiągalnego na danym etapie. Wychwytuje znane nieścisłości: korekta zegara kamery C (−50 sekund) i skrócone okno DIG-09 (brak interakcji do 01:52). Wynik zapisuje do pola `qa.findings`, także na etapie 13 dokumentów. To **heurystyki i sygnały do ręcznej weryfikacji**, nie dowód prawdziwości pozostałych zdań.
- **Przesłuchania:** weryfikuje powoływanie się na brak własnej pamięci pomimo dostępnego zapisu rozmowy, wewnętrzne sprzeczności kolejności miejsc i bardzo bliskie powtórzenia odpowiedzi. Zapisuje szczegółowe `qa.findings` przy każdym pytaniu. Nowa kontrola nie odblokowuje fabuły ani nie zmienia werdyktu.
- **Pamięć modelu:** przy pytaniu o początek rozmowy modele otrzymują faktyczny pierwszy zatwierdzony fragment własnego przesłuchania, jeśli znajduje się w dostępnej historii. Fragment to cytat, a **nie potwierdzony fakt o wydarzeniach**. Dodano wyraźne polecenie, by nie podawać kolejności miejsc, której postać nie zna.
- **Limit API:** błędy 429 i timeout w trybie przesłuchań mają stan `blocked` zamiast `fail`; nie są doliczane do wykonanych pytań. W tym samym otwartym panelu można wznowić test od tego samego pytania, bez zmiany podpisanej historii. Po 429 panel **sugeruje** przerwę co najmniej 60 sekund — nie jest to gwarantowany termin odblokowania od dostawcy. Token jest ważny maks. 55 minut; zamknięcie karty usuwa możliwość wznowienia. Autoryzacja i brak klucza wymagają usunięcia przyczyny przed nowym uruchomieniem.

## Kontrola wydania

W warunkach lokalnych, z podstawionymi odpowiedziami dostawcy, zaliczono: 600 testów RC57, 380 testów mechaniki, 3 sekwencyjne przebiegi gry (580 kroków), testy ślepej próby 13/78, podpisanych tokenów, wznowienia po 429/timeout i autoryzacji. Sprawdzono interfejs testera w Chromium przy szerokościach 390 i 1440 px, testy zapisów i nawigacji. Liczba funkcji `.js` pod `api/`: **12**. `index.html` gry jest identyczny jak w RC57.5.

## Czego nie potwierdzono

Nie wykonano w tym wydaniu zewnętrznych wywołań przy użyciu Twoich kluczy API, nie testowano autentycznych nowych wypowiedzi wszystkich modeli ani pełnego dwuosobowego E2E z Supabase. Zielone testy strukturalne nie gwarantują fabularnej rozwiązywalności ani naturalności każdej odpowiedzi. Raport pełnego ślepego testu i rzeczywistych przesłuchań wymaga nadal krytycznej oceny.
