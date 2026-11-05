# Prawdziwe Śledztwo — raport QA 6.34 (wersja robocza)

Data: 30.10.2026. Podstawa: raport rozgrywki produkcyjnej z oceną 6,5/10.

## Wprowadzone zmiany

1. **Wspólny analizator intencji**: nowe zakresy `self_departure`, `bhp_hazard`, `account_identity` i doprecyzowane `last_contact`; oddziela wstęp typu „Powiedział pan…” od właściwego pytania. Nadal jedna wspólna biblioteka `lib/question-intent-633.js` dla przeglądarki i serwera (z zachowaniem ID API 6.33). Zmiany są rozszerzeniem wspólnego źródła, nie nową warstwą klasyfikacji.
2. **Świadkowie**: bezpieczne, autorskie odpowiedzi awaryjne Marka, Elżbiety i Kamila na wybrane pytania z raportu. Serwer otrzymuje te same ograniczone fakty w `lib/trusted-interview-624.js`. Dotychczasowa hierarchia dostawców niezmieniona: Z.ai → Groq → lokalny.
3. **Okazany dowód**: fotografia nie używa ogólnej kwestii przeznaczonej dla wydruku godzin; poprawiona ścieżka `VIS-02` / Marek / osłona przed ratownikami. Spójność wyświetlonego tekstu i pamięci zeznania potwierdzona.
4. **Dodatkowe minigry**: egzekwują te same warunki źródłowe co główne laboratorium dla TCMS, wiadomości, CCTV, kryminalistyki i dostępu. Przed odblokowaniem nie renderują rekordów ani formularzy etapów; próby zaliczenia są blokowane. Stare ukończone etapy bez wymaganych źródeł nie są odtwarzane podczas importu zapisu, z wyjątkiem już zatwierdzonych głównych raportów.
5. **Identyfikacja kompilacji**: znacznik `<meta name="ps-game-version" content="6.34">` ułatwia rozpoznanie wdrożenia.

## Testy lokalne

- `npm run build`: zaliczony.
- `npm run check`: zaliczony (61 sekcji JS, 64 sekcje CSS, hashe zasobów, integracje).
- `python tools/test-audit634.py`: 4 przypadki pytań, blokada i odblokowanie TCMS, rzeczywiste okazanie VIS-02, pamięć zeznania — zaliczone w Chromium.
- `npm run test:unified633`, `test:priority1`, `test:fast-evidence`, `test:api629`, `test:witnesses`, `test:expanded-nlu`: zaliczone dla wcześniejszych regresji (po zmianach w istotnych modułach).
- Test serwerowego doboru faktów dla 4 nowych zakresów: zaliczony z testowymi danymi wejściowymi.

## Pozostaje otwarte — nie uznajemy za naprawione

- Pełna naturalność długich, złożonych i uzupełniających rozmów, w tym wszystkie parafrazy Marka. Lokalne komponowanie odpowiedzi nadal bywa niezgodne z osobnymi wpisami pamięci przy pytaniach wieloczęściowych.
- Ogólny model reakcji na *wszystkie* okazane dokumenty — zweryfikowano konkretny przypadek VIS-02; pozostałe ścieżki wymagają testów.
- Rozbieżność oceny dedukcji 44/100 z informacją zwrotną AI i kryterium finału; wymaga wspólnej skali i testów parafraz.
- Drobne komunikaty fleksji, sygnatury akt, sekundy na osi czasu, długość ekranów oględzin.
- Rzeczywiste czasy i wyniki Z.ai/Groq na Vercel, synchronizacja Supabase między urządzeniami, pełne 78 materiałów i 30 punktów oględzin, wersja mobilna i bezpieczeństwo produkcyjne.

## Zasady wydania

To pełna paczka do testów/stagingu **6.34**, nie potwierdzenie gotowości produkcyjnej. Nie aktualizowano GitHuba, Vercel ani Supabase i nie zmieniano oryginalnego ZIP-a 6.33.
