> **Aktualizacja po Etapie 2 (29.10.2026):** nadpisania `buildSave`/`applySave` zostały usunięte, a 45 nazwanych hooków działa pod centralnym `src/core/save-manager.js`; starsze zestawienia liczby wrapperów opisują stan historyczny przed Etapem 2. Zobacz `ETAP-2-SAVEMANAGER.md`.

> **Aktualizacja po Etapie 1 (29.10.2026):** wielokrotne nakładki `showTab` zostały usunięte. Centralny kontroler znajduje się w `src/core/case-engine.js`, a 23 nazwane hooki obsługują reakcje modułów i UI. Niniejszy dokument zawiera też historyczny audyt sprzed tej konsolidacji — w razie rozbieżności obowiązuje `ETAP-1-NAWIGACJA.md`.

# Raport refaktoryzacji i audytu zależności

## Co faktycznie zostało zrobione

- Wydzielono **61 bloków JavaScript** i **64 bloki CSS** do katalogów tematycznych z jasnymi angielskimi nazwami plików.
- Rozdzielono duży pierwszy blok na dane sprawy (`src/data/case-content.js`) i silnik (`src/core/case-engine.js`). Kompilator scala je **w tym samym miejscu**, by zachować istniejącą widoczność `CONTENT`.
- Utworzono deterministyczny kompilator odtwarzający produkcyjny HTML oraz kontrolę jego zgodności.
- Dodano automatyczną weryfikację składni skryptów, skrótów integracyjnych i SHA-256 **84 plików multimedialnych**.
- Gotowy plik HTML powstaje w tej samej kolejności skryptów i styli — bez wzrostu liczby żądań sieciowych do 125 osobnych plików kodu.

## Ryzyko, które pozostaje — priorytet kolejnej fazy

Kod odziedziczony nadal zawiera wielokrotne warstwy rozszerzające funkcje innych warstw, zwłaszcza `buildSave` i `applySave`; powtarza się również jawne nadawanie `window.NPC4_LAST`. Te wystąpienia **nie są z definicji błędami** (część jest świadomym opakowaniem wcześniejszej funkcji), ale mogą skutkować zależnościami od kolejności ładowania i trudnymi do wykrycia regresjami.

Nie usunięto ich mechanicznie: mogłoby to zmienić działania fabularne, zapis historii przesłuchań lub reguły obrony. Wymagałoby to zebrania wszystkich przypadków i zastąpienia kompozycją jawnych funkcji lub rejestrem zdarzeń, etap po etapie.

**Rekomendowana kolejność dalszej konsolidacji:**

1. `navigation` — wykonano w Etapie 1; następnie `save/load` — jedna warstwa persystencji w planowanym Etapie 2;
2. `witnesses` — jedna kolejka przetwarzania wypowiedzi, pełna pamięć, ograniczenia wiedzy i API Z.ai;
3. `deduction + finale` — jeden rejestr reguł/zdarzeń zamiast wielu opakowań wyników;
4. `inspection + audio` — jasne cykle życia scen i zasobów.

Dla każdego kroku: porównanie ze stanem bazowym, przejście scenariuszy gry, test starszych zapisów i test wdrożenia Vercel Preview.

## Połączenia Vercel

Nie modyfikowano funkcji serwerowych `api/interview.js`, `api/evaluate.js` ani `lib/common.js` — nie są częścią oryginalnej paczki ZIP. Dotychczasowe endpointy `/api/interview` i `/api/evaluate` pozostały w kodzie HTML. Klucze nie powinny trafić na GitHub.

## Ryzyka wykryte statycznie i kontrola dodawania nakładek

W wersji bazowej wykryto **21 przypisań `showTab = function`, 20 przypisań `buildSave = function` i 27 przypisań `applySave = function`**. Po Etapie 1: **0 przypisań do `showTab`, nadal 20 do `buildSave` i 27 do `applySave`**. Nie wszystkie są aktywne równocześnie: część jest wewnątrz warunków lub funkcji. To liczby wystąpień kodu, a nie liczba rzeczywistych błędów.

Polecenie `npm run check` uruchamia również `tools/audit-overrides.mjs`. Gdy kolejna zmiana wprowadzi nową nakładkę na te funkcje albo drugą definicję `showTab`, test zakończy się błędem i wymusi świadomą aktualizację kontraktów po analizie.

Opcjonalny `python tools/smoke.py` sprawdza 10 modułów na 4 szerokościach w Chromium (wymaga Playwright).


> **Aktualizacja Etapu 3 (29.10.2026):** nakładki odpowiedzi, pamięci i wysyłania przesłuchań zastąpiono jednym `WitnessEngine` z rejestrem 28 nazwanych warstw (10 odpowiedzi, 6 eksport, 6 odczyt, 6 wysyłanie). Bezpośrednie przypisania w historycznych modułach przesłuchań usunięto. Jedyny backend Z.ai pozostaje pod `/api/interview`; klient nie ma prawa nadać nowych dowodów ani odblokować etapów. Nadal potrzebne jest sprawdzenie serwera i nieograniczonej jakości wypowiedzi AI.

> **Aktualizacja Etapu 4 (29.10.2026):** dedukcja, Czerwona Nitka i Kontradyktoryjna Obrona otrzymały wspólny końcowy kontroler `src/core/reasoning-engine.js`. Pięć wariantów finału korzysta z jednego rejestru właściwych zarzutów. Zachowano historyczne szczegółowe reguły fabularne, lokalny graf dowodowy i korelacje czasowe/osobowe/miejscowe. Nadal istnieją warstwy renderowania oraz zależności od kolejności skryptów — do Etapu 5. Pozostałe wcześniejsze prognozy ryzyka w tym dokumencie są zapisem historycznym.


> **Aktualizacja Etapu 5 (29.10.2026):** `EventBus` w `src/core/event-bus.js`
> udostępnia 7 typów zdarzeń i 7 nazwanych subskrypcji w
> `src/core/event-reactions.js`. Autentyczne miejsca zmiany postępu emitują
> zdarzenia; walidatory i właściciele stanu pozostają niezmienieni. SaveManager
> ma aktualnie 46 hooków ze względu na dodanie wyciszenia podczas odczytu.
> Pozostałe bezpośrednie odświeżenia historycznych ekranów i duplikaty CSS
> będą porządkowane w Etapie 6.


> **Aktualizacja Etapu 6 (29.10.2026):** 64 historyczne pliki CSS są nadal
> oddzielnie edytowalne, lecz kompilator generuje z nich jeden element `<style>`.
> Dwa identyczne powtórzenia reguł CSS zostały usunięte. W Czerwonej Nitce
> ograniczono koszt wyszukiwania węzłów i aktualizacji SVG; EventBus łączy
> reakcje UI w jednej klatce. Utrzymano 4K, pełną liczbę zasobów i brak
> trybu lekkiego. Otwarte ryzyka: stara bezpośrednia logika odświeżeń w innych
> podsystemach, rzeczywista wydajność na urządzeniach mobilnych, API i
> długie pełne przejścia fabuły w Etapie 7.
