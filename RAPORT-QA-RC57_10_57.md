# Raport QA — RC57.10.57 (4 listopada 2026)

## Zakres

Weryfikacja i poprawa czterech obszarów wskazanych na zrzutach użytkownika, na bazie pełnej RC57.10.56:
1. Nagłówek Pulpitu — zapobieganie przycinaniu tytułów i opisów.
2. Oględziny — kontrast statusu punktów i komunikatu przy pustej liście bez zablokowania kolejnych odkryć.
3. Laboratorium — wykorzystanie miejsca przez pięć pracowni oraz kontrast liczników źródeł i etykiet.
4. Dedukcja — pozycjonowanie kart, marginesy i niezależne przewijanie listy źródeł w kroku 2.

## Testy lokalne

| Test | Wynik |
|---|---|
| Widoki Pulpitu, Oględzin, Laboratorium i kroku 2 Dedukcji — 1920×1080, 1536×864, 1366×768, 1280×720, 1024×768, 390×844 | **97/97 PASS** |
| Błędy JavaScript w przebiegu powyższych testów | **0** |
| Wyszukiwanie wiedzy świadków / źródła / ograniczenia | **2228 PASS** (`test-rc571048-retrieval.mjs`) |
| Widoczność wątków / blokady fabularne | **12 PASS** (`test-rc571056-story-gates.py`) |
| Zapisy, migracje, import, eksport, reset, autosave | **PASS** (`test-saves.py`) |
| `npm run check`: składanie, zasoby, rejestry kanonu i dowodów | **PASS** |

Dodatkowo sprawdzono krok 2 Dedukcji, w którym oba panele są widoczne na laptopie; urządzenie mobilne celowo przełącza panele zamiast wyświetlać je obok siebie.

## Integralność zmian

- Nowy arkusz `assets/ui/rc571057-panel-fixes.css` dopięty **po** dotychczasowych stylach, bez zmian w silnikach gry.
- `src/index.template.html` oraz wynikowe `index.html` zaktualizowano spójnie (przebudowa przez `npm run build`).
- Żadnych zmian plików AI, treści scenariusza, kartotek, rejestru dowodów lub API.

## Ograniczenia

- Testy były wykonane w lokalnym headless Chromium, nie na fizycznym laptopie użytkownika, Vercel ani w produkcyjnym Supabase.
- Nie wykonywano rozmów z zewnętrznymi dostawcami AI — zmiany są wyłącznie prezentacyjne.
- Pomiary geometrii nie gwarantują braku kolizji dla każdego możliwego zapisu gry, powiększenia przeglądarki i ustawień dostępności.
- Przed publikacją produkcyjną skontrolować Vercel Preview z rzeczywistym zapisem gry.
