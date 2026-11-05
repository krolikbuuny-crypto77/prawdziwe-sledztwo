# Raport QA — RC57.10.23 · zgodność z zaakceptowaną makietą

## Zakres faktycznych zmian

- Trzykolumnowy wygląd na komputerze (nawigacja, karta przesłuchania i protokół, kartoteka sześciu świadków); układ pionowy na telefonach.
- Realne fotografie fikcyjnych świadków, spójna karta wybranego świadka, bordowe nagłówki, kremowy papier, dekoracyjne spinacze, faktura akt i wizualizacja zajezdni z tramwajem TW-217.
- Oryginalne metryki zachowania: zaufanie, napięcie, zmęczenie — bez fałszywych mierników „spokoju” czy „pamięci” z makiety.
- Panel dowodów korzysta wyłącznie z istniejącej listy materiałów dostępnych graczowi; kliknięcie uruchamia dotychczasowy selektor okazywania dowodu.
- Oryginalne trzy podejścia, taktyki, kooperacja i pozostałe funkcje są nadal dostępne; ukrycie części narzędzi w rozwijanym panelu jest wyłącznie prezentacyjne.
- Żadnych gotowych pytań, nowych zagadek, dopisanych wątków czy nowych faktów.

## Testy lokalne

| Test | Wynik |
|---|---|
| `node tools/build.mjs` | PASS |
| `node tools/check.mjs` | PASS — 61 sekcji JS, 64 sekcje CSS, komplet manifestu |
| `node tools/test-rc57-whole-game.mjs` | PASS — 380 testów reguł |
| `node tools/test-rc57-playthrough.mjs` | PASS — 580 działań |
| `node tools/test-rc571013-negations.mjs` | PASS — 600/600 |
| `node tools/test-rc571011-natural-interview.mjs` | PASS — lokalna regresja wskazówek stylu |
| `python tools/test-saves.py` | PASS — eksport/import, zapisy |
| `python tools/test-navigation.py` | PASS — moduły nawigacji przy 320, 390, 768, 1440 px |
| `python tools/test-rc571023-actions.py` | PASS — zdjęcia, zmiana świadka, oryginalny input, selektor dowodów, zachowane kontrolki |
| `python tools/test-rc571023-visual-browser.py` | PASS — brak poziomego overflow przy 320, 390, 768, 1440, 1672 px |

Testy przeglądarki wykonano na lokalnie wyrenderowanym pliku gry z zasobami obrazów podanymi jako wbudowane adresy danych tylko w narzędziu testowym. Nie zastępują testowania prawdziwego wdrożenia.

## Różnice względem wygenerowanego obrazu

- Wersja interaktywna opiera się na **prawdziwych danych gry**, nie na przykładowych informacjach z obrazu. Marek ma właściwą rolę kierownika; jest tramwaj TW-217, nie autobus.
- Gdy gracz nie odkrył dowodów, panel dowodów musi być pusty — nie wolno pokazać sfabrykowanych kart ani ujawnić fabularnych wskazówek.
- Nie wstawiono przykładowych dialogów z ilustracji. Model generuje własne odpowiedzi podczas rzeczywistej gry.
- Wizualnie dostosowano proporcje i typografię do prawdziwego responsywnego interfejsu; nie deklarujemy identyczności pikselowej.

## Pozostała weryfikacja przed produkcją

1. Wgrać na gałąź Preview i sprawdzić rozgrywkę w przeglądarce, także przy długiej historii czatu.
2. Sprawdzić 72-pytaniowy test live na Apinex, reakcje na HTTP 429/504, zachowanie pola pytania po błędzie.
3. Sprawdzić prawdziwe zapisy i odtworzenie gry w Supabase.
4. Obejrzeć wszystkie moduły na urządzeniach mobilnych i ocenić brak nakładania przy zmianie powiększenia tekstu.

**Nie wdrożono niczego na Vercel i nie zweryfikowano usług live.**
