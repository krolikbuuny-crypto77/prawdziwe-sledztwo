# Prawdziwe Śledztwo 6.38 RC35 — wspólne śledztwo dla 2 osób

## Co dodano

- Pokój prywatny na **dokładnie dwóch uczestników**: właściciel zakłada pokój, druga osoba dołącza **9-znakowym kodem**.
- Jeden wspólny serwerowy identyfikator sesji dla obu uczestników. **Dowody, dziennik rozmów AI, postęp i werdykt** są zatwierdzane przez dotychczasowy silnik reguł i zapisywane w jednej sesji Supabase.
- Synchronizacja **widoku gry co około 1,5 sekundy**: otwarta zakładka, świadek, rozmowy, notatki, obszar, wybrany dokument, podstawowe filtry oraz przewijanie. Nie jest to transmisja obrazu WebRTC; krótkotrwałe animacje i wszystkie okna pomocnicze nie są jeszcze gwarantowane co do piksela.
- W danej chwili tylko **jeden uczestnik steruje**. Drugi obserwuje; może przejąć sterowanie, jeśli nie trwa generowanie odpowiedzi AI. Obserwator nie może przesyłać nowych działań fabularnych ani uruchamiać API AI.
- Wspólna rozmowa AI to **jedno wywołanie generowania**, a nie dwa osobne. Pozostają modele i limity RC33 (270 s) oraz 40 par historii na świadka z RC34.1.
- Serwer weryfikuje podpisane ciasteczko członka pokoju, ogranicza liczbę miejsc do dwóch, a konflikty równoległych zmian rozstrzyga na podstawie rewizji CAS.
- Migawka ekranu jest **tylko widokiem** i nigdy nie jest przyjmowana przez serwer jako prawdziwy dowód ani zatwierdzony stan śledztwa.

## Instrukcja wdrożenia

1. **Przed wdrożeniem:** w Supabase → SQL Editor uruchom `supabase/004_coop_rooms.sql` na **tej samej bazie**, w której istnieją `ps_game_sessions` i migracje 001–003. Ta migracja **nie usuwa** istniejących zapisów.
2. Sprawdź, czy zmienne środowiskowe w projekcie Vercel nadal obejmują `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` i `GAME_SESSION_SECRET` (minimum 32 znaki). Nigdy nie wstawiaj klucza service_role do HTML ani JS w przeglądarce.
3. Wgraj **całą paczkę** RC35 do dotychczasowego repozytorium (bez tworzenia nowego projektu Vercel), uruchom `npm run build`, a następnie wdrożenie na istniejący projekt Vercel. W paczce jest już wygenerowany `index.html`.
4. Wejdź na publiczny adres produkcyjny gry na **dwóch osobnych urządzeniach lub przeglądarkach**.
5. Osoba A klika **Utwórz pokój**, przekazuje kod osobie B.
6. Osoba B klika **Dołącz**, wpisuje kod i widzi ten sam stan. Gdy chce sterować, klika **Przejmij sterowanie**. Aktywna odpowiedź AI blokuje zmianę operatora do jej ukończenia.
7. Po skończeniu **wyeksportuj zapis JSON**, potem właściciel klika **Zamknij pokój**. Druga osoba może wcześniej wybrać **Opuść pokój**.

## Uwaga na reset i import

W trybie wspólnym przyciski „Rozpocznij od nowa” i „Wczytaj postęp z pliku” są blokowane. Zmiana całej rozgrywki wymaga najpierw zamknięcia pokoju. Pozostałe funkcje zapisu lokalnego i eksportu nadal działają.

## Co synchronizuje się, a co nie

- Wspólny serwerowy stan gry i zeznania: tak, przez dotychczasowe API Vercel/Supabase.
- Ekran i notatki: tak, jako migawki udostępniane co około 1,5 sekundy (krótkie opóźnienia sieci są możliwe).
- Rozmowa AI: jedno zatwierdzone generowanie po stronie serwera; druga osoba otrzymuje ten sam tekst.
- Efekty przejściowe, otwarte systemowe okna wyboru plików, każdy szczegół animacji i pozycja kursora: nie są przesyłane piksel po pikselu.
- Brak korzystania z Supabase Realtime/WebSockets w RC35: jest **szyfrowane HTTPS + odpytywanie wersji**, aby nie wymagać dodatkowej konfiguracji kanałów Realtime.

## Ograniczenia

- Rozgrywka dwuosobowa wymaga połączenia internetowego i poprawnie skonfigurowanego Supabase; tryb jednoosobowy może nadal korzystać z zapisu lokalnego.
- Ciasteczko członka pokoju wygasa po 7 dniach; ponowne dołączenie wymaga kodu i wolnego miejsca w pokoju.
- Zamykanie pokoju odcina jego uczestników od wspólnej sesji. **Przed zamknięciem pobierz kopię JSON** do zachowania postępów.
- Odpowiedź AI może zająć do 270 sekund. Kontroler nie może być zmieniony podczas aktywnego generowania; po awaryjnym przerwaniu blokada wygasa najpóźniej po 300 sekundach.
- Bezpośrednie testy z produkcyjnym Supabase i rzeczywistym AI pozostają do przeprowadzenia **po migracji i wdrożeniu**. Testy automatyczne używają sztucznej bazy danych i symulowanych odpowiedzi.

## Kontrola lokalna

`npm run check`
`node tools/test-rc35-coop.mjs`
`python tools/test-rc35-browser.py`
`python tools/test-navigation.py`
`python tools/test-saves.py`
`node tools/test-rc341-history-40.mjs`

## Szybki test po wdrożeniu

1. A zakłada pokój i wpisuje notatkę; B ją widzi.
2. A otwiera przesłuchanie Marka; B widzi tę samą historię.
3. A zadaje pytanie; B obserwuje oczekiwanie i jedną odpowiedź (bez drugiego żądania AI).
4. B próbuje przejąć sterowanie w trakcie odpowiedzi AI → blokada.
5. Po zakończeniu B przejmuje, przechodzi do innej zakładki; A widzi zmianę.
6. A zamyka pokój, B otrzymuje informację i po odświeżeniu wraca do trybu solo.
