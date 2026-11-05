# Testowanie — aktualne polecenia i interpretacja

## Podstawowy zestaw przed każdą zmianą

```bash
npm run build
npm run check
npm run project:doctor
npm run test:current
```

`npm run test:current` wykonuje kontrolę integralności oraz nowe asercje „Żywi świadkowie 3.0”, kontrakt RC58 z dostawcami zastępczymi, scenariusze zapisów i nawigacji Chromium. Wymaga Node.js, Pythona i Playwright/Chromium do testów nawigacji.

## Rozszerzenie po zmianach UI

```bash
npm run test:current:browser
```

Przy poważniejszych zmianach CSS lub skryptów uruchom dodatkowo testy konkretnego obszaru z `package.json` i ręczny test na Vercel Preview.

## Co potwierdzają lokalne testy

- Poprawność składni, sum kontrolnych i odtwarzalność skompilowanych zasobów.
- Integralność dokumentacji i bezpieczne blokowanie prywatnych ścieżek przez reguły `vercel.json` (analiza konfiguracji, nie realny test sieciowy).
- Deterministyczne testy logiki, migracji zapisów, nawigacji oraz serwerowej ścieżki przesłuchań z odpowiedziami symulowanymi.

## Czego **nie** potwierdzają

- Jakości rzeczywistych odpowiedzi Z.ai/APINEX lub modeli rezerwowych, kosztów tokenów i czasu odpowiedzi w produkcji.
- Pełnej współpracy z usługą Supabase i realnych uprawnień po wdrożeniu.
- Zachowania przez wielogodzinną rozgrywkę na faktycznym urządzeniu mobilnym.
- Działania tras ochronnych na zewnętrznym Vercel bez sprawdzenia Preview.

## Dziedzictwo testowe

W `package.json` są polecenia od poprzednich etapów RC i 6.x. Część z nich odwołuje się do poprzednich kontraktów API; przykładowo `tools/test-api624-integration.mjs` zgłasza błąd HTTP 400 także na bazowej RC57.10.66. Nie traktuj ich jako bieżącego testu akceptacyjnego. Nie usuwamy ich bez osobnego audytu, aby zachować historię regresji.

## Kontrola przed produkcją

1. Vercel Preview: otwórz każdą zakładkę na telefonie i komputerze; skontroluj import/eksport zapisów.
2. Przeprowadź przesłuchania sześciu postaci z realnym modelem, zadając pytania o początek rozmowy, alibi, zaprzeczenia i źródła wiedzy.
3. Sprawdź, że API i zasoby są dostępne, a `story-bible/`, `docs/`, `src/` i `lib/` **nie** są publikowane jako pliki statyczne.
4. Przed produkcją udokumentuj wynik i dopiero wtedy podejmij decyzję o wdrożeniu.
