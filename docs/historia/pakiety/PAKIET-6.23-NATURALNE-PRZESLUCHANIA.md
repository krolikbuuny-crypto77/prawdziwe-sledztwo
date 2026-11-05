# Prawdziwe Śledztwo — Pakiet 6.23: naturalny język przesłuchań

## Co rzeczywiście zmieniłem

Zmieniono **istniejący** endpoint `api/interview.js`, nie tworzono nowej gry ani osobnego generatora przygotowanych odpowiedzi.

1. `lib/spoken-dialogue-623.js`: nowy, wspólny dla Z.ai i Groq, **serwerowy** zestaw dyrektyw języka mówionego. Inny charakter każdej z sześciu postaci, krótka odpowiedź, w razie potrzeby jedno pytanie zwrotne, bez recytowania procedur, niepotrzebnego wykładu i teatralnych didaskaliów.
2. Odpowiedź ma odnosić się **bezpośrednio** do pytania gracza. Postać może powiedzieć, czego nie wie, ale nie może wymyślać nowej wiedzy, przyznań ani nowych dowodów. Na pytania złożone odpowiada na wszystkie istotne części; na proste na ogół 1–2 zdaniami.
3. `reviewSpokenReply` wykrywa kilka **konkretnych**, szczególnie sztucznych formułek („wyciąga pan zbyt daleko idące wnioski”, „w świetle przedstawionych materiałów” itp.), niepotrzebną rozwlekłość, didaskalia w odpowiedzi i nadmiar pytań zwrotnych. To heurystyka stylu, a nie ocena prawdziwości.
4. Jeśli Z.ai zwróci taki nienaturalny tekst, backend **nie publikuje go**, tylko próbuje Groq. Jeśli obaj dostawcy nie potrafią sformułować poprawnej odpowiedzi albo są niedostępni, pozostaje bezpieczna odpowiedź lokalna.
5. Zachowano niezależny audyt semantyczny i kanoniczny bank faktów. Kontrola liczb **nie wymaga już recytowania wszystkich liczb z wybranego źródła**, ale zabrania dodawania jakichkolwiek liczb, których w źródle nie było. Dopełnia to niezależny audyt sensu, negacji i ograniczeń wiedzy.
6. `semanticSystem` uwzględnia naturalne dopytanie o dokument lub źródło i poprawne odpowiadanie bez recytowania całego protokołu.
7. Zachowano obecne portrety i mimikę SVG (6.22), tryb offline, zapis, minigry, śledztwo i warunki finału.

## Przykład stylu (nie nowy kanon)

**Śledczy:** „Mówiła pani, że nikogo tam nie było. A karta T-17?”

**Magdalena:** „Karta została użyta. Ale skąd pan wie, kto ją wtedy miał?”

To **demonstracja możliwości stylistycznej**, nie udokumentowana wypowiedź wygenerowana przez rzeczywistą usługę Z.ai. Taki dialog w rozgrywce może się pojawić tylko wtedy, gdy aktualnie udostępnione fakty i audyt semantyczny na niego pozwalają. Żaden tekst nie jest z góry wstawiany Magdalenie jako odpowiedź do odtworzenia.

## Czego nie zmieniłem

- Z.ai → Groq → lokalny WitnessEngine, zawsze przez Vercel dla usług zewnętrznych.
- Cloudflare ma tylko rolę analizy; serwerowy silnik reguł i Supabase zatwierdzają postęp.
- Brak nowych zagadek i dodatkowych progów przejścia.
- Brak zmian w liczbie lub zakresie dowodów, sprawcy, historii Leny i mechanizmie finału.
- Animowane portrety SVG pozostają w przesłuchaniach, przełomach i finale.

## Konkretnie zmodyfikowane lub dodane pliki

- `api/interview.js` — przebudowa instrukcji Z.ai / Groq, dwustopniowa kontrola odpowiedzi, rozluźnienie wymogu powtarzania wszystkich numerów.
- `lib/spoken-dialogue-623.js` — profile naturalnego języka, filtrowanie rażąco sztucznych wypowiedzi.
- `tools/test-dialogue623.mjs` — testy sześciu stylów, wyboru modelu, pytania zwrotnego, sztucznej odpowiedzi, kanonicznych liczb oraz bezpiecznego fallbacku.
- `package.json` — polecenie `npm run test:natural-dialogue`.
- `index.html` — przebudowano z tego samego manifestu, bez wprowadzania nowych zachowań po stronie przeglądarki.
