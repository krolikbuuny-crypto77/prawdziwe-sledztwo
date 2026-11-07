# Instrukcja użycia poprawek RC57.10.58

Pakiet jest przeznaczony dla bazowej wersji **RC57.10.58 z naprawami trzech obszarów UI**.

- **Pełna gra:** rozpakuj całe archiwum i przenieś zawartość do repozytorium.
- **Tylko zmiany:** przenieś `index.html`, `src/index.template.html` oraz `assets/ui/rc571058-legibility-system.css` do odpowiadających katalogów repozytorium.
- Jeżeli projekt jest budowany z `src`, uruchom `npm run build` przed wdrożeniem.
- Commit do GitHub wyzwoli wdrożenie przez podłączone Vercel; sam ZIP na Dysku Google nie wdraża zmian.
- Nie łącz automatycznie z RC57.10.68 — tam wymagany jest osobny merge CSS po sprawdzeniu różnic.
