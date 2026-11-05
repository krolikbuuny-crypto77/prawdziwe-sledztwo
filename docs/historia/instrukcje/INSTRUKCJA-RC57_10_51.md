# RC57.10.51 — Menu i karty świadków (laptop 15,6")

## Instalacja

- **Pełna paczka** `Prawdziwe_Sledztwo_RC57_10_51_MENU_I_SWIADKOWIE_PELNA.zip` zawiera całą grę i zastępuje RC57.10.50. Zrób kopię projektu i zapisów, potem przetestuj w Vercel Preview.
- **Mała aktualizacja** `Prawdziwe_Sledztwo_RC57_10_51_AKTUALIZACJA_DO_RC57_10_50.zip` jest przeznaczona **wyłącznie na wersję RC57.10.50**. Rozpakuj na katalogu projektu i nadpisz pliki, zachowując ścieżki.
- Jeżeli używasz źródeł Node.js, `npm run build` odtwarza `index.html`, następnie `npm run check` sprawdza integralność.
- Po wdrożeniu wymuś odświeżenie zasobów (`Ctrl + F5`) i sprawdź układ przy typowym powiększeniu przeglądarki.

## Zakres poprawek

1. Menu na laptopie: zwiększona szerokość paska z 194 do 222 px, elastyczna wysokość przycisków, trzy kolumny dla numeru, ikony i tekstu, dopuszczone zawijanie nazw. Żadnej zakładki nie usunięto.
2. Przesłuchania: zdjęcia świadków mieszczą się w przeznaczonej kolumnie, nazwy i opisy nie wychodzą nad ani poza karty; wszystkie sześć pozycji przewija się pionowo.
3. Dodane kontrole geometrii i kliknięć w lokalnym Chromium. Nie zmieniono AI, dostępów do dowodów, danych fabularnych ani zapisu.

## Ograniczenia

Wersji nie wdrożono na Vercel ani nie testowano na fizycznym laptopie użytkowniczki. Rzeczywiste ustawienia skalowania Windows, przeglądarki i dodatkowych rozszerzeń mogą wpłynąć na wygląd. Kontrole używają lokalnego Chromium i symulacji większej czcionki. Nie testują zewnętrznych dostawców AI.
