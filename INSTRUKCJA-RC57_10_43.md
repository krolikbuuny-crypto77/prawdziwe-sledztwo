# RC57.10.43 — instrukcja

**Pełna paczka** zawiera cały projekt i wszystkie zasoby. Należy rozpakować ją do repozytorium, zachowując ścieżki `src/`, `assets/`, `api/`, `tools/` i plik `index.html` w katalogu głównym.

**Mała aktualizacja** jest przeznaczona wyłącznie na pełną bazę RC57.10.42. Po rozpakowaniu należy nadpisać `index.html` i `src/index.template.html`, dodać `assets/ui/rc571043-visual-balance.css` oraz raport i test. Poprawka nie wymaga nowych zmiennych środowiskowych ani migracji danych.

Zalecane: `npm run build`, `npm run check`, lokalny `python tools/test-rc571043-visual.py`, a następnie Vercel Preview na telefonie (portret ukryty/otwarty, długa rozmowa, otwarta klawiatura).
