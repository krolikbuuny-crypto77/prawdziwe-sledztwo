# Raport RC57.10.47 — 12 obszarów wiedzy i psychologii

## Podstawa
Pełna paczka RC57.10.46, bez zmian w mechanice dowodów ani interfejsie.

## Wyniki potwierdzone lokalnie
- `node tools/test-rc571047-humanity.mjs`: **8442/8442 PASS** (6 świadków, 12 kategorii, źródła i statusy, głos postaci, emocje w przeszłości, prywatne dane, pamięć własnych słów, nacisk/empatia, bezpieczna rezerwa).
- `node tools/test-rc571046-relationships.mjs`: **1325/1325 PASS** (relacje, zaimki, autoryzowane fakty, brak fikcyjnych więzi).
- `node tools/test-rc571045-interrogations.mjs`: **784 PASS** (dotychczasowa koncentracja pytania i psychologia).
- `node tools/test-rc571044-local-fallback.mjs`: **12 scenariuszy PASS**.
- `node tools/test-rc57-whole-game.mjs`: **380 PASS** reguł śledztwa.
- `node tools/test-rc57.mjs`: **600 PASS** przypadków deterministycznych.
- `node tools/test-rc571013-negations.mjs`: **600/600 + 60/60 PASS**.
- `python tools/test-saves.py`: **PASS**, eksport, import, migracje, cofnięcie błędnego importu, autosave.
- `python tools/test-rc571036-long-chat.py`: **3/3 PASS**, próby po 100 wiadomości w lokalnym interfejsie; nie testuje rzeczywistego modelu.
- `npm run build`, `npm run check`: **PASS**: odtwarzalny build, składnia, kontrola źródeł/assetów i zgodność z kanonem.

## Istotne ograniczenia
1. Wiele danych biograficznych i prywatnych relacji nie istnieje w zatwierdzonych źródłach. Status „brak faktu” to nie wada indeksu, lecz zakaz improwizowanego kanonu.
2. 12 obszarów nie jest nową bazą wydarzeń. Indywidualne wskazówki psychologiczne wpływają na formę, lecz nie są dowodami.
3. Lokalne testy nie sprawdzają odpowiedzi Apinex/Z.ai/Groq, limitów 429 ani zapisów produkcyjnego Supabase.
4. Interfejs nie został zmieniony. Nie wykonywano pełnego nowego audytu wizualnego ani testu na fizycznym telefonie.
5. Do pełnej, bogatszej prywatnej biografii konieczna jest autoryzowana aktualizacja kanonu ze spójnymi osiami czasu, relacjami i perspektywami.

## Kontrola jakości
Sprawdzono, że nie powstają nowe fakty z nieautoryzowanych źródeł, cytaty własnych wcześniejszych słów nie są dowodami, emocje bieżące nie stają się automatycznie emocjami z chwili wypadku, a jedno nocne zadanie nie staje się codzienną rutyną. Wybrano kompaktowy format przesyłany do AI, żeby nie dokładać pełnego opisu 12 obszarów do każdego pytania.
