# RC57.10.42 — czytelniejsze Przesłuchania na telefonie

## Baza i granice
Podstawa: pełna lokalna paczka RC57.10.41 (Quality & UX). Obecne prace **nie zmieniają mechanik**, historii sprawy Leny Rudnickiej, dowodów, reguł odblokowywania, Supabase ani serwerowego API rozmów.

## Naprawione w RC57.10.42
1. **Wybór świadka** — zamieniono ciasną, poziomą taśmę 83 px na pionową listę pełnowymiarowych kart z przewijaniem tylko wewnątrz listy. Zdjęcia, role i statusy pozostają widoczne. Wcześniejszy układ na 390 px miał przewijanie poziome i ucięte karty.
2. **Konfrontacja zeznań** — po wejściu w zakładkę Przesłuchania panel nie zabiera miejsca na ekranie wyboru świadka. Podczas rozmowy jest dostępny w rozwijanej sekcji. Nadal wykorzystuje wyłącznie faktycznie zarejestrowane wypowiedzi innych świadków i nie odblokowuje dowodów.
3. **Portret i stan rozmowy** — na telefonie rozpoczynają się zwinięte, z możliwością rozłożenia jednym istniejącym przyciskiem. Ograniczono wysokość pustego nagłówka, aby protokół i formularz pytania były wyżej.
4. **Formularz pytania** — zachowana możliwość pisania własnych pytań, w pełnej szerokości, z minimalną wysokością przycisku 44 px.
5. **Komputer** — zachowano dostępność dotychczasowych paneli i kartoteki bez wymuszonego zwijania konfrontacji.

## Zrobione wcześniej w RC57.10.41 (zachowane)
- Spójny kontrast, klawiaturowy fokus, przyciski dotykowe.
- Dopasowanie zdjęć oględzin, puste stany list, czytelniejszy komunikat o zapisach.
- Lekkie animacje i opóźnione ładowanie nieaktywnych zdjęć.
- Nawigacja 10 modułów i wsparcie szerokości mobilnych.

## Testy przeprowadzone lokalnie
- Chromium, 320×700, 390×844, 390×560, 768×1024, 1440×900: **55/55 PASS**. Przejście wybór → rozmowa, formularz, brak poziomego przewijania strony, panel konfrontacji dostępny na żądanie, stan portretu.
- 100 wiadomości w trzech wariantach: **3/3 PASS** (dostępne pole pytania, lokalny protokół).
- `node tools/test-rc57-whole-game.mjs`: **380 PASS** reguł gry (symulacja, bez dostępu do produkcyjnego Supabase).
- `python tools/test-saves.py`: **PASS**, zapis, migracje, eksport/import, rollback i uszkodzone dane.
- `python tools/test-navigation.py`: **PASS**, 10 modułów × 4 szerokości.
- `npm run check`: **PASS**, składanie HTML, zasoby, składnia, kanon świadków, rejestry dowodowe.
- Testy lokalne zabezpieczeń dialogów: `test-rc571014-excluded-focus`, `test-rc571011-natural-interview`, `test-rc571010-testimony-recap`, `test-rc57108-naturalness-quota`: **PASS**.

## Załączony starszy test AI — czego poprawka nie rozwiązuje
W raporcie RC57.10.10-live z 1 listopada jest 42/72 zakończonych pytań, 34 `pass`, 8 `warning` i 8 zablokowanych prób. Występują powtórzenia, fałszywie surowe kontrole części negacji i HTTP 429. Pakiet RC57.10.41 zawiera nowszy kod weryfikacji `RC57.10.14`, który ma testy poprawnego traktowania krótkiej wzmianki o Lenie przy pytaniach z negacją. Lokalne testy tego kodu przeszły, ale nie wykonano testu 72 zapytań u prawdziwego dostawcy. **Nie należy przedstawiać powyższych blokad jako usuniętych w produkcji**; API dostawcy może nadal odsyłać 429.

## Czego nie potwierdzono
Nie wykonano rzeczywistego testu na fizycznym telefonie ani integracji Apinex/Supabase w Vercel Preview. Zrzuty z Chromium są w `QA-RC571042`, poza paczką gry. Wdrożenie na produkcję nie zostało wykonane.

## Pliki
- `assets/ui/rc571042-mobile-interview.css`
- `assets/ui/rc571042-mobile-interview.js`
- `src/index.template.html` + generowany `index.html`
- `tools/test-rc571042-mobile.py`
