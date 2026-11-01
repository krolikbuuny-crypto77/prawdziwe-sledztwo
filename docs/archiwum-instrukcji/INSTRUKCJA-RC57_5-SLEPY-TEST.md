# RC57.5 — ślepy test detektywistyczny

## Instalacja
- Pełna paczka RC57.5 zastępuje całą RC57.4. Alternatywnie: poprawka RC57.4 → RC57.5, kopiując pliki z zachowaniem struktury katalogów.
- Repozytorium GitHub musi **usunąć** dawne `api/admin-rc57-ui.js` oraz `api/status.js` (plików tych nie ma w pełnej paczce). Samo nadpisanie plików nie usuwa ich z repozytorium; w przeciwnym razie można przekroczyć limit Hobby.
- `RC57_ADMIN_PASSWORD` i `RC57_ADMIN_SECRET` pozostają wymagane; nie udostępniaj ich w plikach.
- Aby włączyć **prawdziwy** ślepy test modelu: `RC57_LIVE_TEST_ENABLED=true`, plus `APINEX_API_KEY` albo `ZAI_API_KEY` (wartości wyłącznie w Vercel → Environment Variables). Po zapisaniu wykonaj Redeploy.
- Prywatny adres: `https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy`; logowanie administratora. Zwykły gracz nie widzi testera.
- Liczba plików `.js` bezpośrednio w `api/`: **12**, zgodnie z konfiguracją RC57.4. Nowej funkcji Vercel nie dodano.

## Uruchomienie
1. Zaloguj się w `/admin/testy`.
2. Wybierz dostawcę Apinex Luna lub Z.ai i zaznacz świadomą zgodę na wykorzystanie limitu API.
3. Kliknij „Rozpocznij ślepe śledztwo”. Model podejmie dwie **niezależne** decyzje: **13** dokumentów początkowych i **78** dokumentów, do których można dotrzeć podczas rozgrywki.
4. Sprawdź wskazaną osobę, cytowane ID dowodów, alternatywne wyjaśnienie, to czego wciąż brakuje i ocenę kanonu. Pobierz pełny **JSON**.

## Co oznacza wynik
- `canon_match_requires_manual_review`: model wskazał osobę zgodną z ukrytym kanonem i podał co najmniej 3 poprawne ID dowodów oraz alternatywę. **To nie jest automatyczny dowód uczciwości fabuły!** Koniecznie przeczytaj uzasadnienie.
- `different_suspect`: model wskazał inną osobę; warto sprawdzić, czy fabuła jest niejednoznaczna, czy model popełnił błąd.
- `undetermined`: model nie znalazł podstaw do wskazania osoby. Jest to dopuszczalne, zwłaszcza na początku.
- `invalid_evidence`: model odwołał się do nieistniejącego lub niedostępnego dokumentu.
- `incomplete_reasoning`: brakuje minimum 3 ID dokumentów lub konkurencyjnego podejrzanego.

## Jak zachowujemy ślepotę
- Model otrzymuje tylko sześć **publicznych** nazw/stanowisk świadków oraz dane z **78 dokumentów widocznych w grze** (`title`, `issuer`, `document_time`, `body`). Etap początkowy zawiera tylko 13 dokumentów początkowych.
- Nie otrzymuje ukrytych reguł werdyktu, kanonicznego sprawcy, rozwiązań minigier, scenariusza oskarżenia, wcześniejszego typowania, promptów świadków, prawdziwych zapisów użytkownika ani jego historii.
- Ocena popełnionego przez AI wyboru znajduje się w osobnym module, ładowanym dopiero po otrzymaniu decyzji z API.
- Nie ma zapisu do Supabase; test nie ingeruje w rozgrywki.

## Ograniczenia
- Wymaga rzeczywistego modelu AI i może zużyć limit lub naliczyć koszt. Testy lokalne użyły podstawionych odpowiedzi, **nie są wynikiem realnego rozumowania Apinex ani Z.ai**.
- Model czyta dokumenty, ale sam nie klika w interfejs, nie rozwiązuje minigier, nie prowadzi żywych przesłuchań. Konieczne są niezależne testy tych modułów.
- Weryfikacja dokumentów sprawdza ID, a nie automatyczną poprawność każdej tezy; trafny strzał bez poprawnego uzasadnienia nadal może być mylący. Przeczytaj argumentację, zwłaszcza ograniczenia dowodowe.
- Dwie niezależne odpowiedzi modelu nie są replikacjami wielu niezależnych śledczych; do solidniejszej oceny można porównać różne modele i powtórzenia.
