# Raport QA — Prawdziwe Śledztwo 6.36 / Etap IV

**Data:** 30.10.2026  
**Podstawa:** wersja testowa 6.36, Etap III; Etap IV zawiera też Etapy I–III.

## Wprowadzone poprawki

1. **Oględziny:** zwijane sekcje drugorzędne na wszystkich szerokościach zamiast kilku jednocześnie rozwiniętych paneli; zachowane przyciski i istniejące identyfikatory.
2. **Polskie odmiany:** wspólna odmiana liczników hipotez, kart i źródeł w warsztacie oraz Czerwonej Nitce.
3. **Źródła:** w osi czasu i powiązaniach aktu oskarżenia wyświetlane są przyjazne nazwy i sygnatury zamiast technicznych identyfikatorów.
4. **Oś czasu:** czytelny zakres dat i dokładność do minuty, normalizowanie oznaczeń z sekundami, wskazówka zachowania sekund w uzasadnieniu.
5. **Wprowadzenie:** asynchroniczne odpowiedzi przesłuchiwanych powodują ponowne obliczenie statusu pierwszych czynności.
6. **Testy:** zaktualizowany test wznawiania sesji korzysta z istniejącego przycisku „Kontynuuj śledztwo”.

## Wyniki testów lokalnych

| Test | Wynik | Granica potwierdzenia |
| --- | --- | --- |
| Kompilacja, manifest, assety | PASS | 61 sekcji JS, 64 CSS, 75 WebP, 9 MP3 |
| Chrom(ium) 390 / 768 / 1280 / 1920 px | PASS | brak błędów JS i poziomego overflow; liczniki, zwijanie sekcji, oś czasu |
| Rzeczywista nawigacja 320 / 390 / 768 / 1440 px | PASS | 10 zakładek, stan aktywny/ARIA, bramki finału |
| SaveManager w Chromium | PASS | eksport/import, autosave/wznowienie/reset, uszkodzony zapis, 11 starszych wersji, rollback |
| Wspólny analizator 6.33 | PASS | 21 zgodnych przypadków przeglądarka/serwer, regresje 6.32 |
| Test sześciu świadków | PASS | 720 tur, brak błędów JS i wycieku dowodów, symulowane wywołanie Z.ai |
| Etap I+II+III | PASS | mapa 78 dowodów, kolejność Z.ai→Groq→lokalny, limit czasu, bramki serwerowe w symulacji |
| Z.ai i Groq na prawdziwym Vercel | NIE TESTOWANO | wymagane klucze i działające środowisko staging |
| Supabase z drugim urządzeniem | NIE TESTOWANO | test lokalny nie weryfikuje chmurowej trwałości |
| 78 dowodów przejście całą fabułą | NIE TESTOWANO | mapowanie 78 nie jest pełną rozgrywką |
| Przeglądarki Safari / Firefox, gesty i audio | NIE TESTOWANO | wykonano Chromium, w tym widoki mobilne |
| HTTP 404 źródeł na Vercel i finał w Supabase | NIE TESTOWANO | ustawienia kodu; wymagają wdrożenia próbnego |

## Nierozwiązane ryzyka przed premierą

- Sekrety fabularne częściowo pozostają w kodzie klienta, nawet gdy bezpośrednie URL katalogów serwera są blokowane.
- Opóźnienia 3–6 s są celem projektowym, nie rzeczywiście osiągniętym wynikiem; nie testowano produkcyjnych dostawców API.
- Przed publikacją należy wykonać test staging z rzeczywistym Supabase (włącznie z odtworzeniem na innym urządzeniu i werdyktem), API i ochroną prywatnych katalogów.
- Uspójnienie polskiej odmiany obejmuje główne liczniki, nie wszystkie teksty całego interfejsu.

**Werdykt:** Etap IV zakończony w zakresie poprawek interfejsu i testów lokalnych. Paczka do testów stagingowych, nie gwarancja gotowości produkcyjnej. GitHub/Vercel/Supabase bez zmian.
