# RC35.3 — Naprawa zasłaniania gry przez „Starszego Śledczego”

## Co naprawiono

- Przycisk **Starszy Śledczy** nie jest już przyklejony do prawego dolnego rogu. Na dużym ekranie ma własne miejsce w bocznej sekcji „POSTĘP I WSKAZÓWKI”.
- Przycisk postępu „Etap 1/3” nie przeskakuje już przy wczytywaniu: od początku tworzy się we właściwym kontenerze menu, a nie w warstwie pływającej.
- Na telefonie i tablecie oba przyciski są umieszczane **w normalnym przepływie strony**, bezpośrednio pod paskiem „Wspólna gra (2 osoby)”, przed zawartością śledztwa. Nie zasłaniają tekstu, elementów przesłuchań ani czatu.
- Podpowiedź Starszego Śledczego można nadal otworzyć, a potem zamknąć przyciskiem X lub Escape. Panel pojawia się wyłącznie po wyraźnym kliknięciu.
- Utrzymano wspólny ekran, czat, API, modele AI, bazę danych, historię 40 par i wszystkie reguły fabularne RC35.2.

## Wdrożenie

Jeżeli wdrożona jest już pełna RC35.2, wystarczy rozpakować małą poprawkę RC35.3 do repozytorium GitHub i zatwierdzić nadpisanie wymienionych plików. Jeśli aktualna wersja jest starsza, wgraj całą paczkę RC35.3.

Po udanym wdrożeniu Vercel (Ready) odśwież przeglądarkę `Ctrl+Shift+R`.

**Nie trzeba uruchamiać nowych zapytań SQL.** Migracje kooperacji i czatu 004 oraz 005 pozostają bez zmian.

## Weryfikacja

Test lokalny Chromium: 320, 390, 768, 1024, 1280 i 1440 px. Sprawdzono brak stałej nakładki, brak poziomego przewijania, widoczność przycisków, otwieranie i zamykanie panelu oraz poprawność nawigacji. Dodatkowo przeszły testy dwuosobowej sesji i czatu.

Nie wdrożono RC35.3 na działający projekt Vercel i nie wykonano testów z produkcyjnym Supabase.
