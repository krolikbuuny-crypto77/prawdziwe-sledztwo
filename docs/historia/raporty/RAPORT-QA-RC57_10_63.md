# Prawdziwe Śledztwo — RC57.10.63: lżejsze dostarczanie CSS i kontrola wydajności

**Baza:** pełna RC57.10.62. **Zakres:** zmiana procesu budowania produkcyjnego CSS oraz testy; wszystkie 84 źródłowe arkusze CSS pozostają bajtowo nietknięte. Bez zmian w mechanice, kanonie, AI/API, fabule, dowodach, zapisach, JavaScript, obrazach i dźwiękach. **Brak wdrożenia na Vercel.**

## 1. Zmiana

- Dodano `tools/strip-css-comments.mjs`, który usuwa zwykłe komentarze `/* ... */` **tylko w publikowanym arkuszu CSS**, bez dotykania czytelnych źródeł `src/styles/`. Nie ingeruje w komentarze wewnątrz łańcuchów znaków, obsługuje ucieczki, zachowuje komentarze licencyjne i mapy źródeł.
- W `tools/build.mjs` etap sklejania arkusza korzysta z filtra. `index.html` wskazuje nowy plik `ps-css-*` o hashu wynikającym z zawartości. HTML zmienia wyłącznie nazwę odwołania. Dotychczasowe dwa pliki `ps-js-*` są bajtowo identyczne.
- Zmieniono historyczny test integralności CSS RC57.10.62 tak, by weryfikował również transformację publikacyjną. Dodano niezależne testy filtra, porównanie CSSOM, geometrii i wizualne oraz lokalny mikrobenchmark. Dodano polecenia npm.
- Liczba źródłowych `!important` **pozostaje na poziomie 7296**. Ten etap nie usuwał deklaracji i nie zmieniał kolejności reguł.

## 2. Efekt wielkości pliku

| Metryka arkusza CSS | RC57.10.62 | RC57.10.63 | Zmiana |
|---|---:|---:|---:|
| CSS bez kompresji | 685 724 B | 661 537 B | −24 187 B (−3,53%) |
| CSS gzip poziom 9 (lokalne) | 144 380 B | 129 254 B | −15 126 B (−10,48%) |
| CSS Brotli jakość 9 (lokalne) | 125 810 B | 112 871 B | −12 939 B (−10,28%) |
| Liczba reguł CSSOM | 4666 | 4666 | bez zmian |
| Usunięte komentarze z bundla | — | 271 | źródła pozostają bez zmian |

To rozmiary **samego arkusza CSS** — nie całej gry. Gzip i Brotli są wyliczone lokalnie i nie stanowią pomiaru odpowiedzi Vercel. Po wdrożeniu nowy hash CSS wymusi jednokrotne ponowne pobranie pliku przez przeglądarkę.

## 3. Testy wykonane lokalnie

| Test | Wynik |
|---|---|
| `npm run build`, `npm run check` | **PASS** — projekt buduje 61 skryptów, 64 sekcje CSS, 3 zasoby z hashem |
| `npm run test:rc571062:css` | **PASS** — zachowanie śladu usunięcia 30 reguł z RC57.10.62 |
| `npm run test:rc571063:css` | **PASS** — dokładna transformacja CSS, testy komentarzy w napisach/escapach, hash CSS i brak zmian JS |
| `node tools/test-rc571060-bundle.mjs` | **PASS** — zgodność plików i odwołań HTML |
| `npm run test:rc58` | **PASS** — 72 lokalne symulacje żądań, 24 dodatkowe tury, 0 błędów; brak zewnętrznych wywołań AI |
| `python tools/test-saves.py` | **PASS** — eksport/import, checksum, rollback, autosave, reset, migracje v1–v11 |
| `python tools/test-navigation.py` | **PASS** — nawigacja 10 zakładek przy 320/390/768/1440 px; bez błędów JS |
| `python tools/test-rc571063-browser.py` | **PASS** — 30/30 porównań (10 zakładek × 390/1366/1920), 14 091 stanów elementów, identyczna geometria i obliczone style, 4666/4666 reguł CSSOM, 9/9 identycznych zrzutów w końcowym przebiegu |
| `python tools/benchmark-rc571063-css.py` | **Wykonano** — 24 syntetyczne parsowania CSS w Chromium dla każdej wersji |

W mikrobenchmarku lokalnym mediana parsowania CSS w obu wersjach wyniosła **16,8 ms**. Jest to jedynie czas parsera CSS w izolacji, nie pomiar załadowania strony czy szybkości działania całej gry. W jednym wcześniejszym przebiegu wizualnym wystąpiły niepowtarzalne drobne różnice rasteryzacji na 2 z 9 obrazów (83 i 4 piksele); porównania CSSOM i stylów były wtedy identyczne. Końcowy przebieg dał 9/9 zdjęć pikselowo identycznych.

Dane: `QA-RC571063/css-pipeline.json`, `QA-RC571063/cssom-and-visual-parity.json`, `QA-RC571063/css-transfer-and-parser.json`. Obrazy pomocnicze nie są wymagane do wdrożenia.

## 4. Ograniczenia

1. Nie przeprowadzono pomiaru na rzeczywistym Vercel Preview lub produkcji, nie mierzono real-user FCP/LCP ani CDN cache-hit. Wyniku mikrobenchmarku nie należy utożsamiać z przyspieszeniem gry w sieci.
2. Nie sprawdzono zewnętrznych dostawców AI z prawdziwymi kluczami. Testy RC58 korzystały z lokalnych symulacji.
3. W CSS nadal jest 7296 `!important`. Usuwanie następnych deklaracji wymaga osobnego, izolowanego refaktoru z testami CSSOM i wizualnymi.
4. Nie zmieniono konfiguracji Supabase, kluczy ani mechaniki rozgrywki.

## 5. Akceptacja wdrożenia

Wdrożyć RC57.10.63 najpierw do Vercel Preview; sprawdzić HTTP 200 dla `index.html`, nowego `ps-css-*` i dwóch `ps-js-*` oraz nagłówki `Cache-Control`. Przejść przez zakładki, przesłuchania z produkcyjnym dostawcą AI, eksport/import i wznowienie. Sprawdzić Network (gzip/Brotli według rzeczywistego `Content-Encoding`), brak błędów konsoli, FCP/LCP w DevTools i pamięć przy dłuższej sesji. Dopiero wtedy rozważyć produkcję. Powrót: pełna RC57.10.62.
