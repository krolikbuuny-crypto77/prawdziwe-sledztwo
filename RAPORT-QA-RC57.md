# Raport QA — RC57 v1 (na bazie RC54)

**Zakres:** prywatny panel i deterministyczna regresja istniejących funkcji. Bez wdrożenia produkcyjnego.

| Kontrola | Wynik |
|---|---|
| `node tools/test-rc57.mjs` | PASS — logowanie, odmowa bez hasła, odrzucony obcy Origin, ciasteczko podpisane, wylogowanie, 600 unikalnych przypadków, brak sieci |
| Pełna deterministyczna próba (600) | 540 zaliczone, 42 ostrzeżenia, 18 błędów |
| `python tools/test-rc57-browser.py` | PASS — wygląd i przyciski w Chromium 390 px, z kontrolowanym mockiem HTTP, **nie** z prawdziwym Vercel |
| `npm run build`, `npm run check` | PASS |
| `node tools/test-rc35-coop.mjs` | PASS — pokój, 2 graczy, przejmowanie sterowania, blokady, CAS |
| `node tools/test-rc50.mjs`, `node tools/test-rc52.mjs` | PASS — wejście wielowątkowe i izolacja wiedzy |
| `python tools/test-saves.py` | PASS — zapis/odczyt, SHA-256, uszkodzony plik, 11 migracji |
| `python tools/test-navigation.py` | PASS — 320/390/768/1440 px |
| Porównanie `index.html` RC54 vs RC57 | Identyczny bajt po bajcie |
| Test panelu na Vercel i publicznym Supabase | NIE WYKONANY; wymaga wdrożenia i wprowadzenia sekretów |

## Wykryte wady starszego parsera
W pełnej próbie RC57 wykrył błędy klasyfikacji części korekt, np. zwrotu **„Nie o ostatnie spotkanie, tylko o godzinę wyjścia”**, a także nierozpoznawanie części nacisku słownego, np. **„Kłamiesz!”**. Błędy są pokazane jako raport QA; nie oznaczają, że 18 zeznań wygenerowanych przez model było fałszywych — test nie wywołuje modeli AI.

## Potwierdzony zakres izolacji
`api/admin-rc57.js` importuje funkcje analizujące i zatwierdzające działanie, ale nie zapisuje sesji, nie pobiera danych z Supabase i nie wywołuje dostawców AI. Przeglądarka panelu wywołuje **wyłącznie** chronione API testera. Kooperacja, zapis i kanon pozostały bez zmian.

## Otwarte zadania
- Rzeczywiste testy integracyjne na preview Vercel.
- Przeprowadzenie wybranych pytań u rzeczywistych dostawców AI za zgodą administratora.
- Automatyczny test pary przeglądarek z kontrolowanym odcinaniem sieci poza produkcyjną bazą.
- Trwała historia raportów, jeżeli będzie potrzebna.
