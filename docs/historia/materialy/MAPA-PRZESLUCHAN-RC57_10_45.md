# Mapa przesłuchań — RC57.10.45

Ten dokument porządkuje **dozwolony zakres tematów** dla sześciu świadków. Nie jest drugim kanonem. Fakty, godziny, tożsamości, dokumenty, zezwolenia i bramki dowodowe pochodzą wyłącznie z `lib/witness-registry-rc22.json` i serwerowego stanu sesji. Temperament i ograniczenia wypowiedzi pochodzą z `lib/witness-dossiers-rc5.js`. Wypowiedź świadka nie jest automatycznie faktem potwierdzonym śledczo.

## Sześć postaci — spójne zasady

| Świadek | Wolno odpowiadać na podstawie dozwolonych wpisów | Nie wolno wywnioskować | Psychologia i sposób mówienia |
|---|---|---|---|
| Marek Nowicki | Obowiązki kierownika, nadzór zmiany, służbowe kontakty, dostępność, rejestr wejść, relacja zawodowa z Leną | Nieprzerwanej obecności w biurze, dokładnej kolejności wyjść, przyznania winy z samej presji | Rzeczowy, kontrolowany. Na nacisk krótka, konkretna obrona granic odpowiedzialności, nie wielokrotna recytacja alibi |
| Tomasz Krawczyk | Dyspozytornia, polecenia ruchowe, odnalezienie Leny, alarm o 02:02, ograniczenia rejestru konsoli | Co robił w każdej nieobserwowanej minucie, godzin ostatniego spotkania bez źródła, bycia świadkiem samego urazu | Zwięzły, operacyjny. Pod naciskiem oddziela to, co widział, od przebiegu zdarzenia przed przybyciem |
| Janusz Wójcik | Warsztat, karta pracy, podpisy, dokumentowanie napraw, obsługa TW-217 | Winnego na podstawie braku podpisu, pełnej osobistej obserwacji z karty pracy, szczegółów śmierci | Praktyczny, warsztatowy. Broni realnej wykonanej pracy, nie tworzy proceduralnych monologów |
| Elżbieta Zięba | BHP, zagrożenia TW-217, rozmowa z Leną o 21:47, biling i ograniczenia potwierdzenia zgłoszenia | Treści rozmowy wyłącznie z bilingu, wysłania dokumentu bez potwierdzenia, obecności przy urazie | Precyzyjna, bardziej osobista wobec tematu Leny, ale bez nowych wyznań |
| Kamil Brzozowski | Diagnostyka, logi sesji, konto i karta, różnica między zapisami a osobą | Fizycznego użytkownika z samego logu, dokładnego położenia z autoryzacji, nieznanej godziny spotkania z Leną | Techniczny, konkretny, wyjaśnia granice danych prostym językiem |
| Magdalena Kaczmarek | Audyt, dokumentacja odbiorowa, sesja zdalna 01:30–02:00, potwierdzenie ciągłości połączenia | Osobistej obserwacji z samego połączenia, fizycznej obecności osoby z podpisu, udziału w alarmie bez świadectwa | Oszczędna, formalna bez wielosłowia, pod presją krótsza i precyzyjniejsza |

## Zasady działania odpowiedzi

1. **Bieżące pytanie:** najpierw ustal, czego dotyczy (rola, lokalizacja, źródło, potwierdzenie, chronologia, pamięć rozmowy, sprostowanie, dowód, relacja, nacisk). Jeśli śledczy mówi „nie pytam o X, tylko Y”, Y jest celem odpowiedzi.
2. **Dozwolone fakty:** indeks tematyczny podpowiada trafne `factIds` już znajdujące się w *serwerowym* `factBank`. Nie rozszerza ujawnionej wiedzy i nie dopuszcza cudzych prywatnych faktów.
3. **Trzy oddzielne źródła:** (a) własna pamięć i obserwacje, (b) relacje innych osób, (c) dokumenty i logi. Historii przesłuchania nie wolno zamieniać w nowy dowód.
4. **Chronologia:** znany początek zmiany nie ustala nieznanej kolejności późniejszych wyjść. Sesja, rozmowa i alarm nie ustalają innych nieobserwowanych minut.
5. **Psychologia:** dłuższa rozmowa, presja i powtarzanie pytania wpływają tylko na *długość, rytm i ton wypowiedzi*. Nie powodują przyznania się, nowego faktu ani odblokowania materiału.
6. **Pamięć rozmowy:** gdy gracz pyta „co powiedziałeś na początku tej rozmowy?”, odpowiedź pochodzi z pierwszej zatwierdzonej wypowiedzi tego świadka; nie z początku jego zmiany roboczej.
7. **Różnorodność:** zamiast poprzedniego akapitu podanego jeszcze raz model otrzymuje ostatnie otwarcia i wskazówkę, jakie zdanie faktycznie odpowiada na obecne pytanie.
8. **Awaria AI:** lokalny silnik próbuje najpierw dosłownego dopuszczonego wpisu odpowiadającego pytaniu. Jeśli nie ma takiego źródła, nazywa ograniczenie lub prosi o doprecyzowanie. Nie wymyśla odpowiedzi.
9. **Audyt:** niezależny audyt semantyczny nadal weryfikuje znaczenie, pochodzenie i kompletność odpowiedzi. Sprostowania i odblokowania podlegają odrębnym serwerowym regułom.

## Co dokładnie zmieniono w kodzie

- `lib/interrogation-brief-rc45.js` — jedna pomocnicza warstwa odpowiedzi, scalająca pytanie, autoryzowane fakty, styl kartoteki i zatwierdzoną historię w ustrukturyzowaną wskazówkę dla AI.
- `api/interview.js` — tworzy wskazówkę wyłącznie **po** zastąpieniu danych klienta serwerowym `trustedScene` i po odczycie zatwierdzonej historii.
- `lib/interview-naturalness-rc28.js` — przekazuje ją do głównego modelu jako kontekst stylu i trafności. Audyt pozostaje niezależny.
- `lib/interview-prompt-rc57106.js` — doprecyzowano nadrzędność oryginalnego pytania i faktów; plan nie jest źródłem wiedzy.
- `lib/interview-local-rc24.js` — precyzyjniejszy wybór świadectw o źródle wiedzy, potwierdzeniach i lokalizacjach; nie myli zdarzenia „na stanowisku” z obecnością świadka.
- `tools/test-rc571045-interrogations.mjs` — wieloosobowe testy zgodności tematów, pochodzenia, psychologii, pamięci i odpowiedzi awaryjnych.

## Granice aktualizacji

Nowe rozwiązanie jest **organizacją** istniejących danych i reguł, nie rozbudową kanonu. Nie dodano imion, nowych spotkań, motywów, dokumentów, tajemnic ani dowodów. Nie da się potwierdzić naturalności dialogów produkcyjnych bez osobnego testu z rzeczywistym modelem, dlatego użytkownik powinien sprawdzić m.in. 10–20 pytań pod rząd do każdego świadka w Vercel Preview.
