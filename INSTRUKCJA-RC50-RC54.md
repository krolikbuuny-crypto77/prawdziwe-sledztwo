# Prawdziwe Śledztwo — RC50 do RC54

## Podstawa: RC49 (niezależna kopia)
Zrealizowano pięć następujących etapów bez modyfikowania kanonu, reguł odblokowania dowodów ani werdyktu:

- **RC50: rozumienie pytań** — serwerowa nieautorytatywna analiza wielowątkowych pytań, negacji i zmian tematu; wymóg pokrycia pytań dopisany do audytu semantycznego. Ostateczne rozumienie języka pozostaje po stronie AI.
- **RC51: naturalne rozmowy** — osobny rytm języka dla każdego z sześciu świadków i wskazówki unikania urzędowych szablonów. Wskazówki nie dodają faktów ani emocji.
- **RC52: pamięć relacji** — odniesienia do postaci wymienionych w pytaniu lub własnej, wcześniej zatwierdzonej wypowiedzi świadka. Cudze przesłuchania i sekrety postaci **nie są udostępniane** pozostałym świadkom.
- **RC53: pochodzenie źródeł** — przegląd odkrytych dokumentów i rzeczywistych wypowiedzi świadków, grupowanie według obiegu/świadka, odsyłacze do oryginałów. Liczba zapisów nie jest uznawana za liczbę niezależnych dowodów.
- **RC54: inscenizacja 4.0** — zwijany panel przebiegu przesłuchania, sygnały wynikające z liczby pytań i wcześniej odblokowanych przełomów. Bez inscenizowania nowych zdarzeń ani ingerencji w fabułę.

## Instalacja

Jeśli na GitHub jest RC49, można nałożyć **RC54_POPRAWKA_Z_RC49_CALOSC.zip** i zatwierdzić pliki. Alternatywnie wgrać całą **RC54_PELNA_WERSJA.zip**. Poprawki etapowe RC50→RC51→RC52→RC53→RC54 wymagają instalacji po kolei na dokładnie wskazanej wersji. Przed wgraniem zachowaj kopię repozytorium, RC49 i własnych zapisów.

**Nie ma nowej migracji Supabase, dodatkowych kluczy ani zmian w schemacie zapisów.** Na produkcji nadal obowiązują dotychczasowe konfiguracje Vercel i migracje (w tym 006 dla współpracy). Po wdrożeniu sprawdź Vercel Ready i wykonaj Ctrl+Shift+R na obu urządzeniach.

## Test po wdrożeniu

1. Dwóch graczy dołącza do pokoju i zmienia sterowanie.
2. W przesłuchaniu zadaj pytanie wielowątkowe, np. „Nie pytam o Lenę — gdzie byłeś po północy, kto to potwierdzi i dlaczego wcześniej powiedziałeś inaczej?”. Sprawdź zrozumienie w prawdziwej odpowiedzi AI.
3. W Notatniku otwórz „Wiarygodność źródeł 2.0”. Sprawdź filtr dokumentów, zeznań i otwieranie materiału.
4. W przesłuchaniu rozwiń „Rytm sceny”.
5. Zapisz grę i wczytaj. Następnie sprawdź drugi ekran i werdykt.

## Ograniczenia

RC50–RC52 są deterministycznymi wskazówkami dla AI, nie nowym modelem i nie gwarancją, że każda generowana odpowiedź będzie bardziej naturalna. Niezależny audyt znaczenia i faktów pozostaje bez zmian. Testy w przeglądarce i serwerowych atrapach nie są testem produkcyjnych odpowiedzi APINEX, Z.ai czy Supabase.
