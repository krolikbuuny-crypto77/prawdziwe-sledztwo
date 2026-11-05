# RC57.10.24 — Dopasowanie wyglądu do zaakceptowanego drugiego obrazu

- Wersja bazowa: RC57.10.23. Zmiany: wyłącznie CSS, dekoracyjne faktury z referencji użytkownika oraz dokumentacja.
- Poprawiono kolorystykę, ramki, proporcje kart, prezentację aktywnego świadka, wyróżnienie pytań, kartotekę sześciu świadków i mobilny opis stanowiska.
- Zastosowano prawdziwe nazwy świadków, role i rozmowy pobierane z istniejącego silnika — bez przykładowych danych z obrazu koncepcyjnego.
- Dowody wyświetlane są tylko, jeśli gracz je zdobył i przejrzał; brak dowodów na starcie jest prawidłowy.
- Nie dodawano gotowych pytań. Zachowane trzy podejścia do rozmowy, jedno pole własnego pytania, zapis stanu i weryfikacja dowodów.
- Potwierdzone: `npm run check` (składnia, zasoby, kanon), `test-rc571013-negations` 600/600, `test-rc57-whole-game` 380 kontroli, `test-rc57-playthrough` 580 działań, `test-rc571023-actions` — zaliczony.
- Chromium 1648, 1440, 768, 390 px — brak poziomego przekroczenia szerokości; na telefonie rozmowa otwiera się po wybraniu świadka.
- Granice: dopasowanie stylu do obrazu jest interpretacją CSS, nie kopią piksel po pikselu. Zrzut referencyjny przedstawia przykładowe dowody, dialogi i dane, których nie przenoszono do produkcji. Żywego Apinex ani Supabase nie testowano w tej poprawce.
- Test na Vercel Preview jest nadal zalecany przed publikacją.
