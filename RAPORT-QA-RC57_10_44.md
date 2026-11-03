# Prawdziwe Śledztwo — RC57.10.44 · czytelność i bezpieczniejsze dialogi

Data: 2026-11-03. Baza: pełny projekt RC57.10.43.

## Zmiany wdrożone

1. **Naprawa dekoracji pod „Finałem”.** W `assets/ui/rc571039-40-preserved.css` były błędne ścieżki `assets/images/...` oraz `assets/ui/fingerprint.webp` interpretowane względem katalogu `assets/ui`. Przeglądarka żądała `assets/ui/assets/images/...` i zwracała HTTP 404. Skorygowano je na `../images/...` i `fingerprint.webp`; dostosowano przyciemnienie fotografii. Nowy, ostatni arkusz `assets/ui/rc571044-visual-finish.css` utrwala właściwy kadr, podpis i kontrast.
2. **Czytelniejsze Przesłuchania.** Poprawiono kontrast opisów świadków i formularza, podświetlenie wybranego świadka bez polegania wyłącznie na kolorze, odstępy, fonty dymków i pola pytania, widoczny fokus klawiatury oraz zachowanie rozmowy po uaktywnieniu pola na wąskim ekranie. Wcześniejsze mobilne poprawki RC57.10.42/43 pozostały zachowane.
3. **Bezpieczniejsza odpowiedź awaryjna.** Serwerowy `lib/interview-local-rc24.js` przy pytaniach o miejsce, rolę i potwierdzenie zeznań w pierwszej kolejności szuka *istniejącego dosłownego* wpisu zatwierdzonego banku faktów. Uwzględnia frazy z negacją tematu („Nie pytam o Lenę, tylko gdzie byłeś?”) i odróżnia zaprzeczoną lokalizację („nie byłem w biurze”) od rzeczywiście wskazanego miejsca. Gdy brak odpowiedniego wpisu, prosi o doprecyzowanie — nie wymyśla alibi lub nazwisk.
4. **Zabezpieczenia bez zmian.** Nie zmieniono kontroli faktów, semantycznego audytu AI, rejestru dowodów, przełomów, reguł odblokowywania, werdyktu, schematu Supabase, danych fabularnych, animacji twarzy ani mechanizmów zapisu.

## Testy wykonane lokalnie

| Test | Wynik |
|---|---|
| `npm run build` i `npm run check` | PASS, reprodukowalny `index.html`, walidacja kanonu i zasobów |
| `python tools/test-rc571044-visual.py` | **159/159** kontroli: 10 zakładek, 6 rozmiarów (320–1440), brak JS błędów, brak poziomego przepełnienia, dostępność pola pytania, faktyczne ładowanie naprawionego zdjęcia |
| `node tools/test-rc571044-local-fallback.mjs` | **12 scenariuszy**: położenie, rola, świadek, negacja wykluczonego tematu, brak źródeł, brak nieuprawnionych nazwisk/miejsc, dokument, oskarżenie, złożone pytanie |
| `node tools/test-rc57-whole-game.mjs` | 380 kontroli reguł, 13 grup, PASS |
| `node tools/test-rc57.mjs` | 600 lokalnych przypadków deterministycznych, PASS |
| `node tools/test-rc571013-negations.mjs` | 600/600 + 60/60 negacji, PASS |
| `node tools/test-rc571014-excluded-focus.mjs` | PASS |
| `node tools/test-rc571010-testimony-recap.mjs` | PASS |
| `node tools/test-rc57108-naturalness-quota.mjs` | PASS |
| `node tools/test-rc57103-preacceptance.mjs` | PASS |
| `python tools/test-navigation.py` | 10 modułów na 320, 390, 768, 1440 px, PASS |
| `python tools/test-saves.py` | Import/eksport, autosave, reset, uszkodzony plik, PASS |
| `python tools/test-rc571036-long-chat.py` | 3/3 dla 100 wiadomości, PASS |

**Izolacja testu:** w teście przeglądarkowym żądanie `GET /api/coop?since=0` celowo zwracało 404, ponieważ funkcje Vercel nie były podpięte do lokalnego adaptera zasobów. Nie jest to obserwacja błędu produkcyjnego. Pozostałe zasoby graficzne były dostępne; zdjęcie pod „Finałem” zostało aktywnie pobrane i zweryfikowane po zmianie ścieżki.

## Ograniczenia i zalecenia przed publikacją

- Nie wykonano nowego zestawu rzeczywistych pytań do Apinex ani połączeń z Supabase, więc **nie potwierdzono pełnego usunięcia powtórzeń, błędów audytu ani ograniczeń HTTP 429**. Te zależą również od zewnętrznego modelu, jego limitów i rzeczywistej historii rozmowy.
- Odpowiedź awaryjna z kartoteki jest dosłowna i zgodna z podanymi faktami, ale nie zastępuje jakości wielowątkowego dialogu generowanego przez model AI.
- Warto zweryfikować mobilną klawiaturę systemową, orientację krajobrazową i sesję współdzieloną w Vercel Preview przed publikacją produkcyjną.
- Testy sprawdzają wybrane rozmiary i stany; nie gwarantują braku kolizji w każdej kombinacji stanu gry.

## Weryfikacja wydania
Pełny pakiet i patch aktualizacyjny zawierają identyczne nowe pliki. Patch nakłada się na **RC57.10.43**, nie na starszą wersję. Nie nadpisywać selektywnie fragmentów z dawnych wydań.
