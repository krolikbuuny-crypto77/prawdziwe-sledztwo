# Instalacja RC57.10.66 — Prawdziwe Śledztwo

**Baza aktualizacji:** RC57.10.65. **Produkcja:** niezmieniona; rekomendowane Vercel Preview.

## Pełna wersja

1. Rozpakuj pełną paczkę do nowego katalogu. Nie łącz z pozostałościami starszej instalacji.
2. Uruchom `npm run check` oraz `npm run test:rc571066:chat` (wymaga Playwright/Chromium); `npm run build` regeneruje `index.html` i hashowane zasoby.
3. Wdróż cały katalog jako jedno wydanie Vercel Preview. `index.html`, `ps-js-00-*.js`, `ps-js-60-*.js`, `ps-css-*.css` muszą pochodzić z tej samej kompilacji.
4. Sprawdź 200 dla HTML i wskazanych zasobów, zapis/odczyt gry, rozwijanie historii przesłuchania i przełączanie świadków, także na urządzeniu mobilnym.
5. Kontrola przed produkcją: nagłówek przy 1920 px, jedna dłuższa rozmowa z rzeczywistym dostawcą AI oraz wydajność przewijania.

## Aktualizacja z RC57.10.65

1. Zachowaj kopię dotychczasowej gry i zapisów użytkowników.
2. Rozpakuj mały pakiet w katalogu RC57.10.65, nadpisując istniejące pliki.
3. Usuń stare hashowane pliki wymienione w `USUN_STARY_BUNDLE_RC57_10_65.txt` z paczki aktualizacyjnej (nie należy usuwać innych zasobów).
4. Uruchom `npm run check` i opcjonalnie `npm run build`. Zweryfikuj, że wynikowy `index.html` wskazuje obecne hashowane zasoby.
5. Wdróż najpierw na Vercel Preview. W razie regresji wróć do pełnej RC57.10.65.

## Ważne

Nie zmieniono danych fabularnych, formatu zapisów, reguł dowodowych ani serwerowych endpointów. Testy lokalne nie obejmują autentycznych odpowiedzi z zewnętrznych API. Pełny raport znajduje się w `RAPORT-QA-RC57_10_66.md`.
