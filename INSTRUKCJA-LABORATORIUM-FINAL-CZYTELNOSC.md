# Prawdziwe Śledztwo RC57.10.58 — czytelność laboratorium i finału

## Cel
Poprawiono trzy zgłoszone ekrany: analizę odtworzonej korespondencji (wybór jednego z pięciu wniosków), odkrywany stopniowo finał, oraz kartę argumentacji z powiązanymi dowodami. Zmiany dotyczą tylko prezentacji.

## Zmiany
- Nowy arkusz `assets/ui/rc571058-lab-final-readability.css` izoluje jasną typografię ciemnych pól laboratorium i jasną typografię ciemnych elementów rekonstrukcji łańcucha bloków.
- W laboratorium zwiększono czcionki odpowiedzi, poprawiono wyróżnianie zaznaczenia, czytelność legendy pól wyboru i etykiet metadanych.
- W finale etapy mają czytelne kontrasty, wyraźne stany bieżący/ukończony oraz poprawne zawijanie tekstu.
- Kwalifikacja czynu i przypięte źródła wykorzystują jasne karty akt. Skorygowano rozmiary czcionek, odstępy i kontrast usuwania źródeł.
- Jasne, czytelne podsumowanie `Kontrola akt` oraz komunikaty o brakujących argumentach; formularze adaptują się do szerokości okna.

## Pliki do aktualizacji
- `assets/ui/rc571058-lab-final-readability.css` — nowy plik.
- `src/index.template.html` — odnośnik do nowego arkusza CSS.
- `index.html` — gotowy wygenerowany plik strony.

Jeśli projekt jest budowany skryptem, wystarczy zachować drzewo katalogów i uruchomić `npm run build`. Paczka pełna zawiera wszystkie oryginalne pliki wersji RC57.10.58 oraz powyższą aktualizację, paczka zmian zawiera wyłącznie wymienione pliki i tę instrukcję.

## Sprawdzenie
- `npm run build`: zaliczone.
- `npm run check`: zaliczone, 61 sekcji skryptów i 64 sekcje CSS; ścieżki zasobów poprawne.
- `npm run test:rc57`: 600 deterministycznych scenariuszy reguł, 0 ostrzeżeń, 0 błędów. Nie są to testy rzeczywistych rozmów AI.
- Testy układu w Chromium w syntetycznych reprezentatywnych kartach dla szerokości 390, 628, 1280 i 1705 px: bez poziomego przepełnienia na badanych ekranach.
- Nie przeprowadzono całościowego testu gry na produkcyjnej stronie po wdrożeniu; obecna wersja Vercel nie zmienia się automatycznie.
