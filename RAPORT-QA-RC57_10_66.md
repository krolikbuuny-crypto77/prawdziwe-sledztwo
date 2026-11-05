# Prawdziwe Śledztwo — raport RC57.10.66

**Baza:** pełna RC57.10.65. **Data:** 5 listopada 2026. **Zakres:** wyłącznie warstwa prezentacji rozmowy, testy długiej sesji i aktualizacja przestarzałego testu integralności. **Wdrożenie:** lokalne, nie wgrywano na Vercel.

## 1. Faktycznie wprowadzone zmiany

- `src/core/case-engine-parts/04-witness-behaviour-tcms.js`: `ps66CommitChat` przechowuje jedynie ostatnią reprezentację widocznych wiadomości; nie modyfikuje `STATE.dialogues`, wiedzy świadków, mechaniki dowodów, kolejności zeznań, formatów zapisów ani wyników AI.
- Gdy zawartość widocznego fragmentu i świadek są identyczni, nie nadpisuje `chatLog.innerHTML`, zachowując istniejące węzły DOM i pozycję przewijania.
- Przy dopisywaniu wiadomości do istniejącego okna zachowuje niezmienione węzły, usuwa tylko elementy wypadające z okna i dopisuje wyłącznie nowe. Przy zmianie danych, załadowaniu innej tablicy wiadomości, zmianie świadka lub wykryciu zewnętrznej mutacji (np. znacznik oczekiwania na AI) wykonuje pełne odświeżenie.
- `MutationObserver` monitoruje wyłącznie `chatLog` w celu unieważnienia cache. Użycie `WeakMap` nie utrzymuje zbędnych referencji do odłączonych korzeni DOM.
- Zaktualizowano starszy test `test-rc571061-parity.mjs`, który miał na sztywno wpisane sumy SHA-256 sprzed późniejszych zmian. Obecnie sprawdza osiem zweryfikowanych segmentów źródła, aktualny manifest i wszystkie dostarczane zasoby z nazwami opartymi na hashu.
- Dodano testy `tools/test-rc571066-chat.py` i `tools/benchmark-rc571066-long-session.py`. Można je uruchomić po rozpakowaniu pełnej paczki bez dodatkowej wersji bazowej; porównanie wersji działa po podaniu `--baseline /ścieżka/do/starszej/gry`.

**Niezmienione:** pliki CSS, fabuła, sześciu świadków, kontrola reguł śledztwa, odblokowania dowodów, Supabase, API AI, finał i wersja formatu zapisu. Wersja nie wymaga dodatkowych kluczy ani migracji.

## 2. Profilowanie przy długim transkrypcie

**Test 1:** po 1000 wiadomości w rozmowie (pełne okno 1000) wywołano `renderChat` 20 razy bez zmiany treści. Wszystkie wywołania wykonano lokalnie w headless Chromium bez ruchu sieciowego:

| Wskaźnik | RC57.10.65 | RC57.10.66 |
|---|---:|---:|
| Mutacje childList w `chatLog`, ekran 390 px | 20 | **0** |
| Mediana odświeżenia, ekran 390 px | 7,8 ms | **4,8 ms** |
| Mutacje childList w `chatLog`, ekran 1366 px | 20 | **0** |

Mediana czasu dla pierwszego przebiegu na 1366 px była niestabilna pod obciążeniem, więc nie jest użyta jako wiarygodna miara procentowej poprawy. Pełne rekordy znajdują się w `QA-RC571066/chat-regression.json`.

**Test 2:** historia 1600 wiadomości, 220 odświeżeń, naprzemienne nowe tury i powroty na zakładkę, widoczne maksymalnie 100 wiadomości:

| Wskaźnik, lokalne Chromium 1366 px | RC57.10.65 | RC57.10.66 |
|---|---:|---:|
| Mutacje `chatLog` | 264 | **110** |
| Mediana odświeżenia | 16,1 ms | **14,0 ms** |
| P95 | 26,3 ms | **20,1 ms** |
| Różnica sterty JS po wymuszonym GC | +513 734 B | +523 606 B |
| Cała historia w stanie gry | 1600 | 1600 |
| Maksymalna liczba widocznych bąbelków | 100 | 100 |

**Interpretacja:** liczba zbędnych operacji DOM zmniejszyła się, lecz ten krótki pomiar **nie dowodzi zmniejszenia zużycia pamięci ani braku wycieków**. Czasy nie są gwarancją poprawy na telefonie lub w produkcji Vercel.

## 3. Zgodność funkcjonalna

- `npm run build`, `npm run check` — **PASS** (61 sekcji skryptów, 64 sekcje CSS, 81 WebP, 9 MP3, manifesty i kontrakty).
- `node tools/sync-case-engine.mjs --check` — **PASS**, 8 części autorskich i źródło wynikowe zgodne z aktualnym hashem.
- `node tools/test-rc571061-parity.mjs` po korekcie przestarzałego hasha — **PASS**, wszystkie trzy pliki cache pasują do builda.
- `python tools/test-rc571066-chat.py --baseline /ścieżka/do/RC57.10.65` — **PASS** przy 390 i 1366 px: powtarzany render, dopisanie i przesunięcie okna, rozszerzenie historii, korekta wypowiedzi, zewnętrzny znacznik AI, przewijanie, zmiana świadka i równość początkowego HTML między wersjami.
- `python tools/test-saves.py` — **PASS**: eksport/import, checksum, autosave, reset i migracje.
- `python tools/test-navigation.py` — **PASS**: 320, 390, 768, 1440 px, po 10 rzeczywistych kliknięć.
- `npm run test:rc58` — **PASS**: 72 lokalne wywołania przy mockowanej usłudze Supabase, dodatkowe 24 tury; 0 błędów. Test **nie obejmuje prawdziwych wywołań AI**.

## 4. Kontrola wizualna i otwarta uwaga QA

Uruchomiono `tools/test-rc571065-browser.py --baseline /ścieżka/do/RC57.10.65` — **60/60 kontroli zakładek**, **30/30 porównań obliczonych stylów i geometrii**, **0 błędów JS**. **6/9 zrzutów jest identycznych pikselowo.** Przy 1920 px trzy zrzuty różnią się o **154 piksele każdy** w tym samym fragmencie dekoracji nagłówka (x16–148, y55–89); zakładki i układ nie różnią się. Historyczny skrypt ma jednak ścisły próg 100 pikseli, dlatego **jego wynik końcowy formalnie wyniósł FAIL** pomimo zgodności stylów. Nie podnoszono progu testu tylko po to, aby uzyskać wynik PASS. Przed produkcją porównać nagłówek w Vercel Preview. Dane surowe: `QA-RC571066/browser-parity-vs-rc65.json`.

## 5. Granice testów i wdrożenie

- Pomiar używa jednego Chromium na lokalnym komputerze i izolowanych symulowanych transkryptów. Nie jest miarą FPS/INP na urządzeniach produkcyjnych.
- W pamięci obiektu gry zachowano całą historię rozmów; optymalizacja dotyczy wyłącznie DOM. Nie zmieniano mechaniki ilości dowodów ani reguł odblokowywania.
- Wersji nie wgrywano na Vercel, GitHub ani do Supabase. Nie wykonywano prawdziwych zapytań do Z.ai/Groq/Cloudflare.
- Rekomendowany następny krok: Vercel Preview z rzeczywistymi długimi przesłuchaniami, importem starego zapisu, kilkuminutowym przełączaniem sekcji, pomiarem pamięci natywnej, INP i inspekcją nagłówka Full HD; dopiero potem produkcja.
