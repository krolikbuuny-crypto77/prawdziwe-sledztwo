# Prawdziwe Śledztwo — raport realizacji RC36–RC40

**Punkt odniesienia:** RC35.6 pozostaje nietknięta. Każdy etap ma osobny, możliwy do przywrócenia kod i paczkę. Pełne RC40 zawiera wszystkie etapy.

| Wersja | Zrealizowana funkcja | Ograniczenie |
|---|---|---|
| RC36 | Ponowienie synchronizacji po odzyskaniu sieci, serwerowo zweryfikowana kopia JSON przed zamknięciem pokoju, blokada zamknięcia gdy kopii nie da się uzyskać | Osobny eksport czatu nie jest częścią kopii rozgrywki; samego internetu nie można gwarantować |
| RC37 | Kontekstowe wskazówki rytmu i reakcji psychologicznych dla modeli przesłuchań | To modyfikacja promptu, nie nowy model AI; naturalności produkcyjnych odpowiedzi nie zweryfikowano |
| RC38 | Tablica powiązań odkrytych dokumentów i **ręcznie oznaczanych** potencjalnych sprzeczności, zapis podpisany z grą i synchronizowany w pokoju | To hipotezy graczy, nie automatyczny dowód ani obiektywne wykrywanie kłamstw |
| RC39 | Wspólne propozycje pytań, materiałów do sprawdzenia i osobne doradcze głosy dwóch graczy | Wymaga **NOWEJ migracji SQL 006**, nie zmienia orzeczenia ani warunków werdyktu |
| RC40 | Retrospekcja po istniejącym rozstrzygnięciu, ograniczenia dowodowe, lista aktywności świadków, tekstowy raport | Nie dodaje nowych faktów, rozstrzygnięć ani niezależnej ścieżki oskarżenia |

## Ważne informacje o migracji

1. Sprawdź, że istnieją wcześniejsze tabele i funkcje z migracji 001–005 (RC35.6).
2. W Supabase SQL Editor uruchom **`supabase/006_coop_collab.sql`** (tylko dla RC39 i RC40; RC36–RC38 działają bez niej).
3. Dopiero potem wgraj pełne RC40 lub paczki etapowe do repozytorium GitHub, zatwierdź i sprawdź status Ready w Vercel.
4. Na dwóch urządzeniach sprawdź przywracanie sesji, podgląd ekranu, propozycje i głosy; następnie przetestuj cały finał.
5. Aby wrócić do RC35.6, przywróć dokładnie jej ZIP i wdrożenie. Istniejących migracji SQL nie trzeba cofać: nowsza tabela nie zmienia tabel bazowych.

## Zabezpieczenia

- Dotychczasowy silnik fabuły, sprawdzanie faktów, dowodów, stanu Supabase i werdykt **nie były przestawiane** w nowych etapach.
- Żadne słowa z notatek, tablicy i propozycji nie stają się nowym faktem dla AI.
- Kooperacyjne głosowanie jest **niewiążące** i osobne od reguł werdyktu.
- Nie wprowadzono nowych kluczy AI ani dodatkowych płatnych zapytań modeli.
- Podpis SHA-256 pozostał obowiązkowy dla migawki pokoju i pliku JSON.

## Testy lokalne (wynik pozytywny)

- RC36: test podpisanej migawki i kopii eksportu pokoju w Chromium; regresja współdzielonej sesji RC35.
- RC37: test wskazówek psychologicznych, regresja odpowiedzi RC32.
- RC38: test interfejsu na 390 i 1280 px, zapisywanie/odtwarzanie hipotez, nawigacja 320/390/768/1440 px i migracje zapisów.
- RC39: test HTTP dostępu dwóch członków pokoju, walidacji głosów, idempotencji, kursora, braku AI; dwa okna Chromium z przejęciem sterowania, propozycjami i głosowaniem.
- RC40: test widoczności epilogu po *symulowanym* rozstrzygnięciu, generowania raportu tekstowego i braku epilogu przed werdyktem.
- Testy legacy: konfiguracja modeli RC33, 270-sekundowy budżet, pamięć 40 par oraz brak nadawania mocy dowodowej wpisom importowanym.

## Niewykonane testy

- Nowa migracja 006 nie została jeszcze uruchomiona na rzeczywistym Supabase użytkownika.
- Nie uruchomiono testu z produkcyjnymi kluczami APINEX/Z.ai ani pełnego przejścia fabularnego z realnym modelem.
- Testy w Chromium opierają się na symulowanych odpowiedziach serwera, nie są gwarancją bezawaryjności sieciowego wdrożenia.
