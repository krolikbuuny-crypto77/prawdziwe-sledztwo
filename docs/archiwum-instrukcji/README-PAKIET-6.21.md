# Prawdziwe Śledztwo — Pakiet 6.21

Kompletny projekt gry z rozszerzeniem długich, wielowątkowych rozmów oraz filmową prezentacją ośmiu istniejących przełomów. Baza: 6.20.

## Uruchomienie i testy

- `npm run build` — odtwarza plik `index.html`.
- `npm run check` — kontroluje manifest i strukturę.
- `npm run test:cinematic` — sprawdza nowy pakiet.
- `npm run test:architecture`, `npm run test:progression` — sprawdzają zasady backendowe na mockach.

Wymagane zmienne środowiskowe dla prawdziwych wywołań są opisane w `.env.example`; nigdy nie trafiają do HTML. Nie nadpisuj produkcyjnych zmiennych kluczami z pakietu.

## Kluczowe pliki

- `lib/dialogue-threads-621.js`
- `src/story/78-long-interviews-621.js`
- `src/story/79-cinematic-turns-621.js`
- `src/styles/78-interviews-cinema-621.css`
- `tools/test-package621.py` i `tools/test-api621.mjs`
- `PAKIET-6.21-DLUGIE-ROZMOWY-I-FILMOWE-PRZELOMY.md`
- `RAPORT-QA-6.21.md`

Nie usuwaj istniejącego endpointu `/api/evaluate` i innych plików produkcyjnych nieuwzględnionych w paczce bez wcześniejszego porównania.
