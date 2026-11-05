# RC35.2 — audyt poprawki układu

Przyczyna: `.ps-coop-bar` w RC35.1 używał `position: fixed; top: 5px; right: 8px; z-index: 10000001`, a obserwator miał pełnoekranowy `.ps-coop-shield` blokujący kliknięcia. Panel, tworzenie i dołączanie do pokoju nie miały własnego miejsca w treści strony.

Zmiana: przeniesiono pasek do normalnego układu wewnątrz `.layout > .main`, tuż przed `#mainContent`. Usunięto przechwytujący ekran shield; blokada obserwatora działa dalej w JS i na serwerze. Dodano ograniczenie szerokości formularzy, dostosowanie mobilne, stabilniejszy rendering przy odświeżaniu pokoju i atrybuty ARIA panelu czatu.

Przetestowano układ na sześciu szerokościach, z otwartym formularzem dołączenia i panelem czatu. Sprawdzono geometrię: pasek po nagłówku, przed treścią gry, w obrębie ekranu i bez nakładania się na treść. Testy dwuosobowe czatu, pokoju i nawigacji przeszły. Regresja testów zapisów nie została ukończona w limicie czasu.

Brak testu na produkcyjnym Supabase.
