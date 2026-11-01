# Raport QA — RC57.5

**Status:** kompilacja i testy lokalne przebiegły poprawnie; **rzeczywisty zdalny dostawca nie był wywoływany**. Brak wdrożenia produkcyjnego.

## Nowe testy
- Dwa odrębne pakiety wejściowe: **13** i **78** dokumentów publicznych; sześciu świadków.
- Dokumenty w teście porównane dokładnie z `src/data/case-content.js`; brak klucza odpowiedzi w pakiecie przekazanym modelowi.
- Jawna zgoda na użycie modelu; odrzucanie nieprawidłowego dostawcy, braku klucza i nieprawidłowej fazy.
- Błędny podejrzany, brak rozstrzygnięcia i nieistniejące identyfikatory dowodów są rozpoznawane, nie są „zielone”.
- Moduł porównania z kanonem jest importowany **po zakończeniu wnioskowania**; nie zawiera się w przesyłanym pakiecie.
- Przetestowano odmowę niezalogowanego żądania i cross-origin requestów oraz brak sieci w teście z podstawionym modelem.
- Chromium **390 i 1440 px**: logowanie, wymagane potwierdzenie, kolejne fazy, wyświetlenie wyników, eksport JSON i brak błędów JS.

## Regresja
- `npm run check` — PASS
- `npm run build` — PASS
- `node tools/test-rc57-blind.mjs` — PASS
- `python tools/test-rc57-blind-browser.py` — PASS
- `node tools/test-rc57-playthrough.mjs` — PASS
- `node tools/test-rc57-whole-game.mjs` — PASS
- `node tools/test-rc57-live.mjs` — PASS (z podstawionym modelem)
- `python tools/test-navigation.py` — PASS (320/390/768/1440 px)
- `python tools/test-saves.py` — PASS (w tym 11 migracji)
- `node tools/test-rc35-coop.mjs` — PASS
- **12 plików `.js` w `api/`**, nie dodano nowej funkcji.
- `index.html`, `src/data/case-content.js`, `lib/progression-618.js`, `lib/server-state.js`, `vercel.json` — identyczne bajtowo jak RC57.4.

## Ryzyka i uczciwość wyników
- Test ślepy **został zintegrowany, ale nie zweryfikowano jeszcze**, czy Apinex Luna lub Z.ai samodzielnie wskażą właściwą osobę na prawdziwych materiałach.
- Przypadki lokalne wykorzystują sztuczne odpowiedzi, w tym błędne typy, a nie wynik realnego API.
- Pole `canonMatch` stwierdza wyłącznie zgodność wskazania nazwiska z kluczem. Nie dowodzi poprawności związku przyczynowego ani jakości fabuły.
- Rozbieżności modeli lub brak wskazania mogą świadczyć o problemie z zagadką **lub** z interpretacją modelu. Wymagana ocena człowieka.
