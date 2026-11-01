# Prawdziwe Śledztwo — rozwój RC42–RC49

## Bezpieczeństwo aktualizacji

- **Nie zastępuj kopii RC41**. Zachowaj RC41 ZIP i utwórz kopię repozytorium lub osobną gałąź GitHub `rc42-rc49`.
- Sprawdź, że RC41 na Vercel działa, zanim zaczniesz aktualizować.
- Wariant etapowy: każda `POPRAWKA_DO_RCxx` jest aktualizacją **tylko z poprzedniej wersji**. Rozpakuj ZIP do głównego katalogu projektu GitHub, zachowując ścieżki, zatwierdź i sprawdź Vercel.
- Wariant jednorazowy: użyj `RC49_PELNA_WERSJA.zip` albo `RC49_POPRAWKA_Z_RC41_WSZYSTKIE_ETAPY.zip`. Nie trzeba instalować wcześniejszych etapów.
- W kooperacji **obie osoby powinny odświeżyć grę** po wdrożeniu. Przed zmianą wersji zamknij aktywny pokój, wcześniej eksportując zapis; nie wprowadzaj zmian, gdy ktoś jest w środku przesłuchania.
- **Nowy SQL nie jest wymagany**. Współpraca z RC39 wymaga dotychczasowej migracji `006_coop_collab.sql`, która jest już częścią RC41.
- Klucze API wciąż zostają po stronie Vercel. Niczego nie wklejaj do klienta ani GitHub.
- Aby wrócić do RC41, przywróć całą kopię RC41 (nie mieszaj plików różnych wersji), odśwież oba urządzenia.

## Etapy

- **RC42 — Żywi świadkowie 4.0**: serwerowe wskazówki psychologiczne (wyłącznie styl), indywidualność sześciu postaci, pamięć rzeczywiście zadanych pytań w interfejsie. Nie zmienia rejestrów faktów ani uprawnień.
- **RC43 — Konfrontacja**: przytoczenie faktycznej odpowiedzi innego świadka z historii i przygotowanie pytania. Cytat jest oznaczony jako niezweryfikowane zeznanie i **nie jest automatycznie wysyłany ani uznawany za fakt**.
- **RC44 — Przełomy 3.0**: czytelny dziennik dotychczasowych ośmiu scen, wyłącznie po odblokowaniu oryginalnymi warunkami. Bez nowych zagadek, dowodów lub zmian finału.
- **RC45 — Oś czasu 3.0**: wykrywanie przerw pomiędzy odkrytymi znacznikami i oznaczanie wielu powiązanych dokumentów. Przerwa nie jest dowodem braku wydarzeń; liczbę źródeł nie należy mylić z ich niezależnością.
- **RC46 — Kooperacja 3.0**: odwołania do faktycznie wypowiedzianych kwestii świadka i podpisane adnotacje w SaveManager. Sterujący może oznaczać; drugi gracz widzi po synchronizacji i może składać sugestie w istniejącym kanale RC39. Nie dodajemy alternatywnego systemu zapisu.
- **RC47 — Psychologia 4.0**: czytelne wskaźniki tempa, nacisku, pytań o źródła i doprecyzowań, **wyłącznie heurystyka pytań gracza, a nie obiektywny stan umysłu**. Serwer zachowuje ograniczenia kanonu.
- **RC48 — Inteligentny raport**: raport TXT z odkrytymi dokumentami, opartą na nich chronologią, zeznaniami, hipotezami i adnotacjami. Werdykt pochodzi wyłącznie z istniejącego silnika.
- **RC49 — Audyt jakości**: odczytowe kontrole integralności SHA-256, wpisów, wymiarów historii, autorstwa źródeł i dostępności modułów, plus testy Playwright. Testy nie zmieniają zapisów graczy ani werdyktu.

## Uruchomienie

1. Po wdrożeniu odśwież stronę przez `Ctrl+Shift+R` na obu urządzeniach.
2. Sprawdź **Przesłuchania** (RC42, RC43 i RC47), **Dedukcję** (RC44), **Oś czasu** (RC45), **Notatnik** (RC46 i RC49) oraz **Finał** (RC48).
3. Spróbuj utworzyć pokój i dołączyć drugą osobą. Zmień sterującego, zaznacz wypowiedź w Notatniku, poczekaj na synchronizację i sprawdź drugi ekran.
4. W przypadku błędów sprawdź Vercel Logs i wróć do kopii RC41.

## Granice potwierdzenia

Automatyczne testy są lokalne. Nie uruchomiono produkcyjnego wdrożenia i nie sprawdzono zewnętrznego dostawcy AI z rzeczywistymi kluczami. Różnorodność języka AI to kierunkowanie odpowiedzi, a nie gwarancja idealnej rozmowy.
