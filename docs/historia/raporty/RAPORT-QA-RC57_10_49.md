# Raport jakości RC57.10.49 — laptop 15,6 cala

## Baza
RC57.10.48, zachowana jako osobny ZIP. Modyfikacje: zewnętrzna warstwa CSS, mały organizator DOM, odwołania z szablonu i wygenerowany z niego HTML; bez zmian w aktach, dowodach, systemie AI, Supabase, logice śledztwa i werdyktu.

## Cztery etapy

1. **1366×768 / 1536×864:** zwężenie sidebaru, wysokość nawigacji i nagłówka, układy jedno- i dwukolumnowe. Pulpit: czytelniejszy pełnoszeroki opis i zdjęcia; kroki startowe w rozwijanym, dostępnym panelu. Przesłuchania: rozmowa + spis świadków (bez trzeciej równoległej kolumny narzędzi).
2. **Kontrast:** osobna korekta modalu wznowienia (jasny tekst na granacie), kontrast daty na ciemnym tle, czytelniejsze opisy, pomocnicze etykiety i pola input/textarea.
3. **Nawigacja:** trzy wizualne grupy w lewym menu, nadal wszystkie 10 oryginalnych kart i ich identyfikatorów. Nawigacja wewnętrzna prowadzi do rozwijanych wskazówek; panel tonu rozmowy i dowodów jest rozwijany, a nie usunięty.
4. **Karty i formularze:** proporcje list i edytorów osi czasu oraz dedukcji, brak wymuszonego poziomego przewijania tablicy, pełne etykiety, większe pola, naturalne łamanie tekstu, uproszczone dekoracje.

## Potwierdzone kontrole

- `npm run build` — PASS.
- `npm run check` — PASS: 61 sekcji JS, 64 sekcje CSS, integralność aktywów, nawigacja, SaveManager, WitnessEngine, kanon i źródła.
- `node --check assets/ui/rc571049-laptop-layout.js` — PASS; składnia CSS `tinycss2` — 0 błędów.
- `node tools/test-rc57.mjs` — PASS: **600** deterministycznych przypadków.
- `node tools/test-rc571048-retrieval.mjs` — PASS: **2228** kontroli wyszukiwania wiedzy.
- `python tools/test-saves.py` — PASS: migrowanie zapisów, integralność, import/export, rollback, autosave.
- Chromium: cztery rozmiary (390×844, 768×1024, 1024×768, 1366×768) — **125/125 weryfikacji** zakończonych bez niepowodzenia; obejmują nawigację, brak poziomego przepełnienia, wprowadzanie pytań i kontrast sztucznie odtworzonego okna wznowienia.
- Osobny Chromium 1366×768: rzeczywiste zrzuty Pulpitu, Poszukiwań, Przesłuchań i Dedukcji, wszystkie bez błędów JS i poziomego scrolla.
- Chromium 1536×864: wykonane zrzuty porównawcze i kontrola przewijania (bez błędów JS).

## Ograniczenia i znane ryzyka

- Dłuższy, zbiorczy test geometrii obejmujący 1536×864 **przekroczył limit czasu** i nie ma statusu PASS. `python tools/test-navigation.py` także przekroczył limit czasu, więc nie zaliczam tego testu.
- Nie wykonano pełnego przeglądu każdej dynamicznej kombinacji 10 modułów ani testu na fizycznym laptopie 15,6 cala.
- Nie testowano produkcyjnego Vercel, zewnętrznych dostawców AI i Supabase. **Nie można stwierdzić, że cała gra jest pozbawiona usterek.**
- Testy deterministyczne AI nie są równoważne z rzeczywistymi, wielowątkowymi przesłuchaniami.

## Test przed premierą

Na Vercel Preview: 1366×768 i 1536×864, Windows przy 125%/150% skalowania, przeglądarka 100%; szczególnie modal wznowienia, sześciu świadków, okno wpisywania pytań przy otwartej klawiaturze, filtrowanie materiałów i tablica hipotez.
