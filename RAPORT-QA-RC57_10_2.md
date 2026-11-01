# RAPORT QA — RC57.10.2

## Zakres

Analiza 18-wierszowego raportu użytkownika (Marek, Tomasz, Janusz, Elżbieta, Kamil i Magdalena). Oryginalny test: **13 pass / 5 warning / 0 fail** według przesłanych etykiet. To nie jest nowa seria rzeczywistych zapytań do Apinex.

## Najważniejsze ustalenia i kontrola po poprawce

| Test | Przed | Nowa ocena heurystyczna | Uzasadnienie |
|---|---|---|---|
| AI-002 Marek | self_order_contradiction | brak ostrzeżenia | Pamiętanie początku zmiany nie wymaga odtwarzania minutowej kolejności kolejnych wyjść. |
| AI-009 Janusz | near_repetition | brak ostrzeżenia na zgłoszonym przykładzie | Odpowiedź powtarza obowiązki, ale odnosi się do nowego przedziału czasu. |
| AI-012 Elżbieta | pass | location_evasion | „Nie byłam przy stanowisku” nie odpowiada na pytanie, gdzie była po północy. |
| AI-015 Kamil | place_self_contradiction | zachowane ostrzeżenie | Wskazane stanowisko i brak pewności co do miejsca mogą odnosić się do innych momentów; trzeba sprawdzić zakres godzin. |
| AI-017 Magdalena | overformal_answer | + memory_answer_without_referent | „Tego” nie ma wyraźnego odniesienia w pytaniu o pamięć. |
| AI-018 Magdalena | overformal_answer | + session_as_location, self_location_observation | Połączenie nie dowodzi obecności w konkretnym miejscu, a „własna obserwacja” jest semantycznie nielogiczna. |

Przy prostym przeliczeniu **tych samych 18 odpowiedzi** nowe reguły dają 14 pass i 4 warning. To przewidywany wynik ponownej lokalnej oceny, nie wynik ponownej transmisji do modelu. Priorytetem do ręcznego sprawdzenia jest AI-018. Wypowiedź „byłam przy stanowisku” jest niejednoznaczna: może odnosić się do stanowiska komputerowego i nie stanowi automatycznego przyznania obecności przy stanowisku nr 3.

## Wykonane testy

- `npm run test:rc57102-dialogues` — PASS, 6 rzeczywistych fragmentów z raportu, 2 jednoznaczne sprzeczności kontrolne, 3 poprawne odpowiedzi, testy RC57.6 i RC57.8.
- `npm run check` — PASS (61 skryptów, 64 bloki CSS, stałe skróty zasobów, źródła kanonu).
- `npm run test:rc57-live` — PASS, scenariusze 18/72, podpisana historia, kontrolowany transport modelu.
- `npm run test:rc57101-blind` — PASS, audyt dowodów, model bez kanonu, panel Chromium 390 i 1440 px, bez błędów JS.
- `npm run test:rc57-provider-migration` — PASS, brak aktywnej trasy Z.ai.
- `node tools/test-rc5710-quota.mjs` — PASS, izolowana symulacja globalnego licznika.
- `node tools/test-rc5710-traffic.mjs` — PASS, siedem rzeczywistych prób HTTP w oknie i 429.
- `node tools/test-rc5710-random-questions.mjs` — PASS, pytania i negacje.
- `node tools/test-rc57-playthrough.mjs` — PASS, 3 symulacje po 580 działań silnika.
- `python tools/test-rc57-whole-game-browser.py` — PASS, Chromium, kontrola UI 380 przypadków na dwóch szerokościach.
- `python tools/test-rc5710-admin-browser.py` — PASS, test panelu, 120 wyników stress, eksport raportu.

Początkowo uruchomiono nieistniejącą nazwę pliku testowego `tools/test-rc5710-api-quota.mjs`. To pomyłka w poleceniu testowym, nie błąd kodu. Następnie przeprowadzono właściwe `tools/test-rc5710-quota.mjs` i `tools/test-rc5710-traffic.mjs`, oba zaliczone.

## Otwarte ograniczenia

1. **Brak testu prawdziwego Apinex** na tej wersji — zmiana wskazówek generacji jest potwierdzona przez kod i kontrolowane przypadki, nie przez nowe odpowiedzi modeli.
2. **Brak testu produkcyjnego Supabase** i równoległych rzeczywistych graczy; nie dotykano cudzych zapisów.
3. Heurystyki nie wykonują pełnego rozumowania semantycznego i mogą nadal oznaczyć wypowiedzi wieloznaczne. Ostrzeżenia pozostają do oceny człowieka.
4. Nie wykonano pełnego przejścia całej fabuły *kliknięciami* w przeglądarce — symulacje silnika są osobne.

**Wniosek:** lokalnie gotowe do wdrożenia na Vercel Preview, nieuzasadnione byłoby deklarowanie pełnej weryfikacji produkcyjnej.
