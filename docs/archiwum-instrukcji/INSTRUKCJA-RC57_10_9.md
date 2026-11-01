# Prawdziwe Śledztwo — RC57.10.9

## Co wynika z testu użytkowniczki (6/72)

- Pięć prób wstrzymanych, w tym `provider_timeout` w etapach `generate` i `rewrite` (HTTP 504).
- Pytanie AI-007 o **pierwszą wypowiedź w tej rozmowie** nie zostało zatwierdzone; część odrzuceń raportowano jako `quality:unknown`.
- AI-002 i AI-006 przechodzą kontrolę faktów, lecz są oznaczone jako `stock_phrase_repetition` — bezpieczna, ale sztywna formułka pojawia się ponownie.
- W opisanym raporcie nie ma podstaw do stwierdzenia, że wszystkie `provider_timeout` pochodzą wyłącznie z limitów Apinex; mogły być lokalnymi limitami czasu faz lub problemami dostawcy.

## Zmiany w kodzie

1. `lib/dialogue-memory-636.js`: rozpoznawanie wyraźnej prośby o przypomnienie *własnych wcześniejszych słów*. Taka prośba nie jest traktowana jak nowy temat i nie uruchamia automatycznie kary za semantyczne powtórzenie. Nie dotyczy zwykłych pytań o pamięć zdarzeń ani pytania, kto potwierdzi zeznanie.
2. `lib/interview-quality-635.js`: dokładna parafraza lub przytoczenie wcześniejszych słów jest dozwolone tylko w pytaniu o powtórzenie. Ogólny filtr kopiowania zeznań pozostaje aktywny.
3. `lib/interview-style-cue-rc57108.js` i `lib/interview-prompt-rc57106.js`: krótkie, celowane wskazówki do odpowiedzi o pamięci rozmowy, sprostowaniu, źródłach, potwierdzeniu i miejscu pobytu. To wyłącznie styl — nie dopisuje faktów ani dowodów. Potoczne odpowiedzi Marka są zachęcane, ale nie gwarantowane przez zewnętrzny model.
4. `lib/interview-observability-636.js`: dopuszczono bezpieczne, szczegółowe kody odmów (`dialogue_opening_memory_attribution`, `dialogue_near_repetition` itd.). Koniec nieczytelnego `quality:unknown` w tych znanych przypadkach.
5. `lib/interview-budget-636.js`: Apinex `generate` maks. 15 s (z 11,5 s), `rewrite` maks. 7,5 s (z 2,5 s), limit jednego dostawcy maks. 32 s w ścieżce gry. Przerwania zewnętrzne nadal mogą występować. Szybsza odpowiedź kończy wywołanie od razu.
6. `lib/admin-rc57-live.js`, `lib/admin-rc57-ui.js`: aktualizacja wersji raportowania testera do RC57.10.9. Przy `blocked` nadal ten sam numer pytania i token; bez automatycznego ponawiania.

## Jak wgrać

- Jeśli źródłem na GitHub jest **dokładnie RC57.10.8**, wystarczy rozpakować i nałożyć ZIP `Prawdziwe_Sledztwo_RC57_10_9_POPRAWKA_DO_RC57_10_8.zip`, zachowując strukturę katalogów. To patch plików, nie ZIP do wrzucenia jako jeden plik.
- Jeśli nie wiesz, która wersja jest na GitHub, rozpakuj pełną paczkę `Prawdziwe_Sledztwo_RC57_10_9_HOBBY_PELNA.zip` i wgraj jej zawartość do repozytorium, najlepiej na gałąź Preview.
- Nie zmieniaj kluczy. Nie wykonuj SQL. Zachowaj istniejącą konfigurację Apinex i Supabase.
- Przed wdrożeniem **wyeksportuj JSON z otwartego testera**, ponieważ przeładowanie strony może utracić jego bieżące postępy; token wznowienia jest przechowywany w karcie i ma ograniczoną ważność.

## Jak zweryfikować na Vercel

1. Wdróż Preview i sprawdź `npm run check` oraz `npm run build`.
2. Uruchom test 72 pytań w jednym oknie. Obserwuj AI-002, AI-006, AI-007 — głównie powtórzenia Marka i przypomnienie pierwszej wypowiedzi.
3. W razie wstrzymania skopiuj `failureDiagnostics.phase`, `upstreamStatus` i `productionAudit.rejectedChecks`, nie podawaj kluczy ani tokenów.
4. Oceniaj naturalność ręcznie. `pass` oznacza akceptację automatycznych kontroli, nie perfekcyjny dialog.

## Czego nie zmieniono

Kanon, odblokowywanie dowodów, etapowanie postępu, reguły werdyktu, interfejs zeznań graczy i format zapisów Supabase pozostały bez zmian. Żaden prawdziwy model Apinex nie został wywołany podczas lokalnych testów.
