# Raport QA 6.20 — rzetelnie zweryfikowany zakres

## Testy Pakietu 6.20

- `npm run build` — **PASS**, wygenerowany `index.html` z kodu źródłowego.
- `npm run check` — **PASS**: 61 sekcji JS, 64 sekcje CSS, 75 grafik WebP i 9 nagrań MP3; spójność manifestu.
- `npm run test:living-story` — **PASS**: trzy rozdzielczości 390, 768, 1280; indywidualne opisy 6 osób; reakcja na oskarżenie; brak przedwczesnego pytania z dokumentów; pytanie pojawia się po ich zdobyciu; nienadpisywanie wiedzy i stanu; identyczny kontekst stylu obu dostawców w API na mockach.

## Testy regresyjne zaliczone

- `npm run test:ai-primary` — **PASS**.
- `npm run test:architecture` — **PASS**.
- `npm run test:progression` — **PASS**.
- `npm run test:saves` — **PASS**.
- `npm run test:witnesses` — **PASS**: 720 tur, sześć świadków, przeglądarka i fallback.
- `npm run test:dialogue` — **PASS**: 1200 tur mieszanych, pytania następcze.
- `npm run test:reasoning` — **PASS**.
- `npm run test:events` — **PASS**.
- `npm run test:story` — **PASS**.
- `npm run test:navigation` — **PASS**: 320, 390, 768, 1440 px, 40 przejść.
- `npm run test:personality` — **PASS** (po dostosowaniu starego testu do obecnego kontraktu `prefaceKey=0`).
- `npm run test:memory` — **PASS**.
- `npm run test:inspections-puzzles` — **PASS**: 5 minigier na dwóch szerokościach.
- `npm run test:quality` — **PASS** jako test stabilności; nie jest pomiarem ludzkiej naturalności wypowiedzi.

## Korekty testów historycznych

Starsze testy miały wpisane liczby warstw z wcześniejszych wersji. Po dopięciu nowej warstwy zaktualizowano: `test-navigation.py` (27 hooków), `test-witnesses.py` (9 warstw wysyłania), `test-package65.py` (9), `test-api65.mjs` (zgodność z nowszym kontraktem). Nie zmieniono reguł zaliczania, faktów, dowodów ani finału w celu uzyskania pozytywnych testów.

## Elementy niewykonane / niezweryfikowane

- Brak testu prawdziwych kont i limitów Z.ai/Groq, Cloudflare i produkcyjnego Supabase.
- Brak niezależnej, ludzkiej oceny realizmu i naturalności dialogów na ślepo.
- Brak nowych, animowanych modeli twarzy i nagranych kwestii; dodano tylko dyskretną warstwę tekstowo-wizualną.
- Brak gruntownej przebudowy scenariusza wszystkich historycznych rozmów: to rozszerzenie spójności zachowań, nie nowa wersja kanonu.
- Heurystyki powtórzeń i rodzaju pytań nie są pełnym polskim modelem semantycznym.
- Nie przeprowadzono wdrożenia na GitHub, Vercel ani Supabase.

**Wniosek:** techniczna stabilność i źródłowe bramkowanie nowych reakcji zostały sprawdzone. Nie należy tego utożsamiać z udowodnioną poprawą naturalności odpowiedzi chmurowych.
