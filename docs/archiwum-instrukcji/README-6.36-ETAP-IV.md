# Prawdziwe Śledztwo 6.36 — Etap IV (pełna paczka testowa)

**Baza:** 6.36 Etap III. **Zawartość:** komplet Etapów I, II, III i IV. Nie zastępuje samodzielnie wdrożenia GitHub/Vercel.

## Zmiany interfejsu (punkt 9)

- W sekcji oględzin drugorzędne sekcje (statystyki, szczegóły strefy, ostatnie ślady, rekonstrukcja, dziennik) są początkowo zwinięte także na dużym ekranie. Główne elementy badania i przycisk zabezpieczenia pozostały dostępne, a każde szczegóły można rozwinąć.
- Centralna funkcja `psCount` odmienia liczbę kart, hipotez i źródeł w licznikach warsztatu i czerwonej nitki (1 karta, 2 karty, 5 kart; 1 źródło, 2 źródła, 5 źródeł).
- W osi czasu materiały są prezentowane przez sygnaturę użytkową zamiast wewnętrznego ID, a powiązania aktu oskarżenia wyświetlają tytuły dowodów.
- Oś czasu operuje dokładnością do minuty. Zapis `2026-11-18T02:02:11` jest normalizowany do `2026-11-18T02:02` i UI wyjaśnia, że sekundy trzeba zachować w uzasadnieniu, nie w polu znacznika.
- Wskazówka pierwszego przesłuchania odświeża się po rzeczywistej zmianie historii dialogu, także po asynchronicznej odpowiedzi modelu.
- Test wznowienia zaktualizowano pod aktualną etykietę `Kontynuuj śledztwo` bez modyfikowania logiki zapisu.
- W meta stronie `ps-game-version` jest `6.36-IV` dla sprawdzania aktywnego wdrożenia.

## Testy (punkt 10)

```
npm run build
npm run check
npm run test:stage4-636
```

Test `test:stage4-636` uruchamia test UI w Chromium, pełny test SaveManager, nawigację, testy Etapów I–III, wspólny analizator i test 720 tur świadków. Inne specjalistyczne testy dawnych wersji można uruchamiać osobno.

## Ważne ograniczenia

- Testy modeli chmurowych korzystają z atrap/danych testowych; rzeczywiste czasy odpowiedzi i trafność Z.ai/Groq na Vercel nie zostały potwierdzone.
- Testy Supabase sprawdzają kontrakty i symulacje; nie obejmują realnego zapisu między urządzeniami ani serwerowego werdyktu końcowego.
- Testy interfejsu obejmują 4 szerokości, nie pełną macierz przeglądarek lub urządzeń dotykowych.
- Wersja 6.36-IV to **paczka testowa do stagingu**. Działający projekt produkcyjny nie został zmieniony.
