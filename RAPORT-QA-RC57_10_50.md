# Raport QA — RC57.10.50

## Punkt wyjścia

Pełna, sprawdzona paczka RC57.10.49. Dwa dostarczone przez użytkownika zrzuty pokazują ucięty tytuł w lewym logo i niewyraźny napis daty.

## Naprawy

- Usunięto `white-space: nowrap` dla tytułu, zredukowano rozmiar emblematu i zachowano cały napis w obrębie szerokości logo.
- Data otrzymała jasny kolor `#ffefd0`, tło `#30363a`, większą czcionkę 12,5 px (11,5 px na najmniejszych telefonach) i obrys.
- Nowe reguły trzymane są w jednym arkuszu `assets/ui/rc571050-brand-date.css` ładowanym po poprzedniej skórce; do źródeł HTML dodano tylko odsyłacz do arkusza.

## Testy wykonane lokalnie

- `node tools/build.mjs` — PASS.
- `node tools/check.mjs` — PASS.
- `node tools/audit-overrides.mjs` — PASS.
- `python tools/test-rc571050-brand-date.py` — 48/48 PASS na 8 rozdzielczościach (320, 390, 768, 950, 1024, 1366, 1536, 1920 px), 0 błędów JS. Kontrole ukrytego menu są pomijane tam, gdzie jest celowo niewidoczne.
- Kontrast daty z tłem: 10,8:1 (na podstawie obliczenia jasności względnej dla dwóch kolorów renderowanych przez przeglądarkę).
- `node tools/test-rc57.mjs` — PASS, 600 lokalnych przypadków deterministycznych.
- `python tools/test-saves.py` — nieukończony, proces przekroczył limit czasu środowiska.

## Ograniczenia

Nie przeprowadzono testu na fizycznym laptopie użytkownika ani testu integracji API i zapisów na Vercel. Testy wizualne w lokalnym Chromium nie są gwarancją poprawności przy każdej skali przeglądarki i ustawieniu zoomu.
