# RC57.10.43 — kontrola kolizji wizualnych

## Stwierdzone i poprawione błędy
1. Na telefonie, w widoku Przesłuchania, przycisk „Pokaż portret i stan rozmowy” nakładał się na opis stanowiska świadka. Powodem był przycisk `position:absolute` i wymuszona wysokość nagłówka 126 px.
2. Nagłówek „PROTOKÓŁ PRZESŁUCHANIA” miał stare ujemne marginesy, co obcinało pierwszy znak z lewej strony.
3. Po rozwinięciu portretu wskaźniki nastroju (panel `#npc4Panel`) nakładały się na przycisk schowania portretu. Uporządkowano je w osobnych wierszach bez zmieniania informacji.
4. Przy szerokości 681–700 px stary układ dwóch kolumn rozmowy powodował kolizje przy rozwiniętym portrecie. Uporządkowano kolejność nagłówka, protokołu, formularza i narzędzi.

## Zakres modyfikacji
Wyłącznie jeden nowy arkusz `assets/ui/rc571043-visual-balance.css` i jego deklaracja w `src/index.template.html`, następnie reprodukowalny `index.html`.
Bez zmian w historii, pytaniach, świadkach, zdarzeniach, logice odblokowań, integracjach i zapisie gry.

## Testy
- Chromium: 320, 390, 700, 1440 px — **83/83** sprawdzenia, w tym brak przecięć tekstu, przycisku, panelu nastroju i protokołu przy obu stanach portretu, oraz brak poziomego przewijania 10 zakładek.
- Testy wcześniejszych mobilnych Przesłuchań: **55/55**.
- Rozmowy ze 100 wiadomościami: **3/3** warianty.
- Kontrola nawigacji: **10 modułów** przy szerokościach 320, 390, 768 i 1440 px — PASS.
- Kontrola reguł śledztwa: **380** PASS.
- Testy zapisów (round-trip, migracje, rollback, uszkodzone zapisy): PASS.
- `npm run check`: PASS.

## Ograniczenia
Są to testy lokalne na Chromium, nie produkcyjny test Vercel z prawdziwą klawiaturą ekranową. Pozostałe, nienazwane niedociągnięcia wizualne mogą nadal występować w głębszych stanach gry. Nie przeprowadzono pełnej oceny jakości nowych odpowiedzi AI ani działania Supabase.
