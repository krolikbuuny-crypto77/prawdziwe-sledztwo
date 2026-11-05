# RC57.10.55 — stały wzorzec układu laptopowego

## Instalacja

- Pełna paczka: rozpakuj `Prawdziwe_Sledztwo_RC57_10_55_STALY_UKLAD_LAPTOP_PELNA.zip` i wgraj całą zawartość do projektu Vercel.
- Aktualizacja: na pełną RC57.10.54 nałóż `Prawdziwe_Sledztwo_RC57_10_55_AKTUALIZACJA_DO_RC57_10_54.zip` i nadpisz pliki. Aktualizacja nie jest samodzielnym projektem.
- Sprawdź na Vercel Preview, następnie odśwież Ctrl+F5, by nie korzystać ze starego CSS.

## Zasada działania

Przy szerokości obszaru strony (CSS viewport) od 1080 px do 1920 px i wyżej układ zachowuje te same główne regiony:
- Pulpit: opis sprawy i galeria obok siebie, pełna szerokość bohatera, wskazówki osobno, wątki niżej;
- Przesłuchania: protokół z polem pytania po lewej i lista świadków po prawej;
- Akta: dwukolumnowy spis i podgląd;
- Oś czasu: lista i panel rekonstrukcji obok siebie.

Proporcje są płynne (`clamp`, `minmax`, `dvh`). Przykładowo Full HD 1920×1080 przy zoom 125% daje często około 1536 px szerokości CSS, przy 150% około 1280 px. W takich warunkach zachowany jest ten sam podział paneli. W mniejszym oknie, przy znacznym zoomie lub na tablecie elementy układają się pionowo, ponieważ priorytetem jest dostępność i czytelność. Nie jest możliwa identyczna liczba widocznych wierszy niezależnie od fizycznego rozmiaru czy skalowania ekranu.

Nie używamy globalnego `transform:scale()` ani ustawiania sztywnego viewportu.

## Zmiany techniczne

- `assets/ui/rc571055-laptop-consistency.css` — końcowe reguły layoutu.
- `src/index.template.html` i wygenerowany `index.html` — dołączenie arkusza.
- `tools/test-rc571055-laptop-parity.py` — test 10 zakładek na 10 rozmiarach okna.

## Bez zmian

Silniki AI, kanon, dowody, progi odblokowań, zapis Supabase, SaveManager i werdykt.

## Kontrole

`npm run check` oraz `python tools/test-rc571055-laptop-parity.py`. Dodatkowo wykonano `python tools/test-rc571054-fullhd.py`, `node tools/test-rc571048-retrieval.mjs` i `python tools/test-saves.py`.
