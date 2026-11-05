# Raport RC32 – poprawa naturalności rozmów

Podstawa: RC31. Zmienione pliki: `api/interview.js`, `lib/interview-naturalness-rc28.js`. Dodano `lib/dialogue-direction-rc32.js`, `tools/test-rc32-dialogue.mjs`, instrukcję i niniejszy raport.

## Naprawa względem pięciu tur z Markiem

1. Alibi: pierwsza fraza odpowiada na pytanie; bez definicji alibi i urzędowego wstępu.
2. Potwierdzenie: rozróżnij świadka rozmowy od świadka fizycznej obecności; nie wymyślaj nazwisk.
3. Lokalizacja: nie zastępuj odpowiedzi listą rejestrów, zwłaszcza po wyraźnym „nie pytam o dokumenty”.
4. Uzasadnienie poprzedniej wypowiedzi: sprawdź w zapisanej historii, co faktycznie padło, zanim stwierdzisz „już mówiłem”.
5. Nieufność: podejrzenie zatajenia nie jest automatycznie zarzutem przemocy.

Wskazówki dotyczą wyłącznie sposobu wypowiadania zatwierdzonych faktów. Serwerowy factBank, hardGuard, audyt semantyczny, bramki dowodowe, sesje i kwoty API pozostają niezmienione.

## Wynik

Testy nowej warstwy, budowania i wybrane testy kompatybilności zaliczone. Cztery historyczne testy mają te same porażki na RC31 i RC32. Brak podstaw do twierdzenia, że rzeczywiste odpowiedzi modelu zostały już sprawdzone produkcyjnie. Ostateczna ocena naturalności wymaga porównania rozmów po wdrożeniu.
