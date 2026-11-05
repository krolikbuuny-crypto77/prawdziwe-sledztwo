# RC57.10.54 — Full HD (1920×1080, Windows 100%)

## Instalacja

- **Pełna paczka:** rozpakuj `Prawdziwe_Sledztwo_RC57_10_54_FULL_HD_1920x1080_PELNA.zip` i opublikuj zawartość katalogu głównego w repozytorium / projekcie Vercel. Zachowaj wszystkie `assets/`, `api/`, `src/`, `lib/` i pozostałe katalogi.
- **Aktualizacja:** gdy projekt ma już pełną RC57.10.53, nałóż `Prawdziwe_Sledztwo_RC57_10_54_AKTUALIZACJA_DO_RC57_10_53.zip`, nadpisując zmienione pliki. Nie używaj aktualizacji jako samodzielnej strony.
- Testuj najpierw na Vercel Preview. Po zmianie na produkcji wykonaj twarde odświeżenie (Ctrl+F5).

## Rozdzielczości

Docelowa konfiguracja: **1920×1080, skalowanie Windows 100%, zoom przeglądarki 100%**. Testy obejmują również realną wysokość okna przeglądarki ~900 px oraz mniejsze rozmiary: 1600×900, 1536×864, 1366×768, 390×844. Reguły Full HD włączają się od szerokości CSS 1600 px do 2400 px.

## Zakres zmian

- Pulpit: zlikwidowanie pustej prawej części karty głównej; wykorzystanie pełnej szerokości dla opisu sprawy i fotografii.
- Przesłuchania: usunięcie pustej kolumny protokołu, zachowanie szerokiej rozmowy i pola pytania, pozostawienie listy świadków z boku.
- Akta: zwężenie zbyt wysokiego nagłówka i uporządkowanie proporcji listy do podglądu.
- Oś czasu, Poszukiwania, Oględziny, Notatnik, Laboratorium, Dedukcja, Finał: dopasowanie szerokości, paddingu wybranych nagłówków i formularzy; dostępność wszystkich narzędzi bez usuwania funkcji.
- Brak zmian w AI, serwerowych API, regułach dowodów, zapisie i werdykcie.

## Testy

`npm run check` oraz `python tools/test-rc571054-fullhd.py`. Szczegóły i ograniczenia w `RAPORT-QA-RC57_10_54.md`.
