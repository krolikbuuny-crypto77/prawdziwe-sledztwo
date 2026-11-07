# Prawdziwe Śledztwo — RC57.10.58 | Korekta kontrastu i czytelności

**Podstawa:** pełny projekt `Prawdziwe_Sledztwo_RC57_10_58_UI_3_OBSZARY_PELNA.zip`.
**Zakres:** wyłącznie interfejs użytkownika, bez zmian w mechanice, logice dowodów, API i dialogach.

## Zidentyfikowana przyczyna

Nowszy jasny motyw `ps28-skin` nakładał ciemny kolor tekstu na odziedziczone ciemne karty w oględzinach. Na przykład napis w stanie „Materiał jest już w aktach” uzyskiwał kontrast około 1.1–1.3:1, więc był praktycznie nieczytelny.

## Wprowadzone zmiany

- Spójna jasna typografia na ciemnych kartach oględzin: zakończone badania, wnioski, statusy, blokady, notatki, obserwacje, porównania i odpowiedzi.
- Czytelniejsze kapsułki „Metoda / Ocena / Zabezpieczenie” i nagłówki etapów.
- Większy tekst i odstępy w kartach obserwacji; przyciski akcji min. 44 px wysokości.
- Mobilny układ przycisków w jednej kolumnie, bez rozszerzania panelu poza ekran.
- Kontrast w ciemnych kartach notatnika i przeglądzie twierdzeń przy dedukcji.
- Zachowanie ciemnego tekstu na **jasnej** karcie podsumowania strefy, aby nie wprowadzić odwrotnego problemu.
- Kontrast podpisu fotografii szczegółowej.

## Pliki

1. `assets/ui/rc571058-legibility-system.css` — nowy, izolowany arkusz nadpisujący tylko określone komponenty.
2. `src/index.template.html` — podpięcie arkusza jako ostatniego.
3. `index.html` — plik wygenerowany z szablonu, gotowy do wrzucenia na hosting.

**Pozostałe pliki źródłowej paczki pozostają niezmienione.**

## Kontrola

- `npm run build` — PASS.
- `npm run check` — PASS: składnia, zgodność budowania, odwołania do assetów i źródeł.
- `npm run test:rc57` — PASS: 600 deterministycznych scenariuszy reguł (nie są to rzeczywiste rozmowy AI).
- Próbki renderowane w Chromium: poprawiony kontrast i czytelność kart; 7 szerokości 320, 375, 390, 768, 1280, 1440 i 1920 px bez przepełnienia badanych przycisków.
- Nie przeprowadzano pełnego testu produkcyjnego Vercel ani każdego ekranu w długiej rozgrywce. Do pełnej akceptacji zalecana jest kontrola po wdrożeniu na telefonie i PC.

## Instalacja

Dla pełnego archiwum: rozpakować i użyć jako wersji projektu zamiast starszej RC57.10.58. W GitHub zmienić pliki zgodnie ze strukturą katalogów. Jeśli używany jest pipeline budowania, `npm run build` wygeneruje `index.html` z szablonu.

Dla paczki zmian: skopiować trzy pliki z zachowaniem lokalizacji. Nie nadpisywać nowszej linii projektu RC57.10.68 bez osobnego przeniesienia tych zmian.
