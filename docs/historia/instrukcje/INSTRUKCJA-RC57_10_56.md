# Prawdziwe Śledztwo — RC57.10.56: uporządkowane zakładki i odkrywane wątki

## Instalacja

1. **Pełna wersja:** rozpakuj `Prawdziwe_Sledztwo_RC57_10_56_NOWY_UKLAD_PELNA.zip` i wgraj zawartość katalogu do repozytorium po utworzeniu kopii/gałęzi testowej. ZIP nie jest pojedynczym plikiem przeznaczonym do uruchomienia przez Vercel.
2. **Aktualizacja:** jeśli masz dokładnie pełną RC57.10.55, rozpakuj `Prawdziwe_Sledztwo_RC57_10_56_AKTUALIZACJA_DO_RC57_10_55.zip` do katalogu projektu, nadpisując wskazane pliki z zachowaniem ścieżek. Mała paczka nie jest samodzielną grą.
3. Sprawdź na Vercel **Preview** przy 1920×1080 (Windows 100%, Chrome 100%), następnie przy 1366×768, 1536×864 i na telefonie. Dopiero po testach opublikuj produkcyjnie.
4. W razie starych styli użyj Ctrl+F5 lub otwórz nowe okno prywatne.

## Zakres zmian

- Menu: jednoliniowe etykiety, czytelna kolumna z numerem, symbolem i nazwą; „Poszukiwania” w menu = „Szukaj”, „Notatnik” = „Notatki”. Techniczne identyfikatory `data-tab` są bez zmian.
- Pulpit: opis sprawy bez ucinania, cztery główne działania przed panelami drugorzędnymi; odkryte linie dochodzenia jako informacja pomocnicza.
- Wątki: po uruchomieniu bez odpowiednich akt nie pojawiają się opisy późniejszych wydarzeń. Przy częściowym odkryciu widoczne są ogólne, bezpieczne nazwy tematyczne, bez zdradzania brakujących źródeł lub liczby potrzebnych dokumentów. Pełne ustalenia i zapis w notatniku dopiero po zdobyciu wszystkich wymaganych materiałów. Konfrontacje świadków ujawniane dopiero po spełnieniu wymagań.
- Akta: zwarte filtry, lepszy bilans spisu i czytnika.
- Szukaj: pole wyszukiwania wyżej, obszary jako filtry poniżej.
- Przesłuchania: szeroki protokół, lista świadków po prawej, ciaśniejsze odstępy.
- Oś czasu: dwie kolumny robocze bez szerokich marginesów.
- Oględziny: podgląd i narzędzia dostępne przy niższych nagłówkach.
- Notatki, Laboratorium, Dedukcja, Finał: bardziej zwarte formularze, karty i panele pomocnicze.

## Co pozostało bez zmian

Nie zmieniono kanonu, zbioru faktów w kartotekach, promptów AI, dostawców, bramek dowodowych, zasady oceniania werdyktu, SaveManager ani schematu Supabase. RC56 zmienia wyłącznie wyświetlanie wątków i układ UI; nie zmienia momentu faktycznego odblokowania dowodów.

## Testy lokalne

- `node tools/check.mjs`
- `node tools/audit-overrides.mjs`
- `python tools/test-rc571056-layout.py`
- `python tools/test-rc571056-story-gates.py`
- `node tools/test-rc57.mjs`
- `node tools/test-rc571048-retrieval.mjs`
- `node tools/test-rc571046-relationships.mjs`
- `python tools/test-saves.py`
- `python tools/test-navigation.py`

Szczegóły i ograniczenia opisuje `RAPORT-QA-RC57_10_56.md`. Nie był testowany produkcyjny dostawca AI ani zapis do rzeczywistego Supabase.
