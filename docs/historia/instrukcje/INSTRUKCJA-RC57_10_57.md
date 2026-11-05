# RC57.10.57 — poprawa paneli i czytelności

Baza: pełna gra RC57.10.56. Zmiany dotyczą wyłącznie stylów interfejsu.

## Instalacja

**Pełna paczka:** rozpakuj wszystkie pliki do katalogu projektu (zachowaj strukturę `assets/`, `src/`, `api/`, `tools/` itd.). Wdrożenie testowe wykonaj na Vercel Preview przed aktualizacją wersji produkcyjnej.

**Paczka aktualizacyjna:** rozpakuj jej zawartość bezpośrednio do katalogu zawierającego RC57.10.56, zastępując wskazane pliki. Nie instaluj paczki aktualizacyjnej jako osobnego projektu.

Po wdrożeniu wykonaj pełne odświeżenie strony (`Ctrl + F5`) i sprawdź zakładki Pulpit, Oględziny, Laboratorium oraz krok **2. Dowody** w Dedukcji.

## Zmiany

- Pulpit: nagłówek sprawy ma automatyczną wysokość — tekst nie powinien być przycinany nawet przy zawijaniu.
- Oględziny: status punktów i komunikat pustego stanu mają czytelny, ciemny tekst na jasnym tle; lista odkrytych punktów zachowuje swój normalny układ.
- Laboratorium: w Full HD pięć pracowni układa się 3+2 zamiast 4+1; poprawiono liczniki, podsumowania i etykiety źródeł.
- Dedukcja: lista zdobytych źródeł ma niezależne przewijanie i margines chroniący karty oraz znaczniki przy prawej krawędzi.
- Na mniejszych ekranach utrzymano dotychczasowy układ i brak poziomego przewijania.

Żadnych zmian w serwerowym AI, kanonie fabularnym, bazie dowodów, walidatorach, historii rozmów lub zapisie gry.

## Kontrole lokalne

Uruchom w katalogu projektu: `npm run check`, `python tools/test-rc571057-panels.py`, `node tools/test-rc571048-retrieval.mjs`, `python tools/test-rc571056-story-gates.py`, `python tools/test-saves.py`.

Wyniki oraz ograniczenia: `RAPORT-QA-RC57_10_57.md`.
