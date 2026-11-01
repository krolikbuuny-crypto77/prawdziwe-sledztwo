# RC57.10.3 — jakość odpowiedzi świadków przed akceptacją

## Aktualizacja

1. Jeśli na GitHub/Vercel masz już RC57.10.2, rozpakuj `Prawdziwe_Sledztwo_RC57_10_3_POPRAWKA_DO_RC57_10_2.zip` i zastąp pliki o identycznych ścieżkach.
2. Jeśli nic z ostatnich poprawek nie jest wdrożone, wgraj **pełną** RC57.10.3 zamiast nakładać wszystkie starsze ZIP-y.
3. Wykonaj wdrożenie Vercel Preview, sprawdź logi i wejdź w prywatny panel `/admin/testy`.
4. Wykonaj test 18 pytań osobno dla Luna oraz Jev. Pobierz raport JSON. Sprawdź, czy zniknęły ostrzeżenia `place_self_contradiction`, `session_as_location`, `overformal_answer`, `near_repetition`. Pamiętaj, że niektóre zgodne z kanonem luki pamięci mogą wymagać manualnej oceny.
5. Po zatwierdzeniu Preview dopiero wdrażaj produkcję. Nie trzeba zmieniać schematu ani istniejących zapisów Supabase.

## Co dokładnie poprawiono

- W produkcyjnym `attemptInterview` dodano przed semantycznym audytem weryfikację odpowiedzi pod kątem powtórzeń, sprzeczności miejsca, sesji audytowej jako alibi, błędnych wspomnień, dygresji o Lenie, sztucznego języka i literówek w odpowiedzi świadka.
- Jeśli pierwszy projekt ma takie błędy, model dostaje **jedną ograniczoną próbę poprawienia** z tym samym zestawem faktów. Dopiero wynik przechodzący istniejący `hardGuard` i niezależny audyt semantyczny może zostać zatwierdzony.
- Jeżeli obie próby nie przejdą kontroli, system korzysta z istniejącego łańcucha pozostałych dostawców. Nie zatwierdza błędnej wypowiedzi „na zielono”.
- Skrócono sztywny tekst awaryjny Magdaleny, ale nie modyfikowano kanonu ani źródłowego rejestru faktów.
- Wersja wyników testera: RC57.10.3-live.

## Granice i koszty

- To nie gwarancja 18/18 odpowiedzi **rzeczywistego** modelu. Testy lokalne używały izolowanego, podstawionego modelu; faktyczne zachowanie Apinex może się różnić.
- Poprawka nie usuwa ostrzeżeń z panelu, nie przepisuje automatycznie zeznań i nie dopisuje alibi ani brakujących miejsc.
- Jedna dodatkowa próba generowania zużywa kolejne wywołanie Apinex i może zwiększyć prawdopodobieństwo błędów 429. Obowiązujące limity i ponowienia pozostają bez zmian.
- Informacja o braku dowodu na **każdą minutę** nie jest równoznaczna z twierdzeniem, że świadek nie pamięta **żadnego** miejsca po północy. Nie wymuszamy nowego faktu tylko po to, by zniknęło ostrzeżenie.
