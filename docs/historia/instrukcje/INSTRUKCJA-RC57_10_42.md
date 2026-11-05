# Instalacja RC57.10.42

**Wersja pełna:** skopiuj zawartość ZIP do repozytorium, z zachowaniem katalogów `assets`, `src`, `tools` i `api`; wdrażaj najpierw na Vercel Preview. Przy wdrażaniu zachowaj swoje bieżące zmienne środowiskowe i serwerowy Supabase.

**Aktualizacja:** użyj wyłącznie na bazie RC57.10.41 i nadpisz pliki według ścieżek z ZIP. Nie stosuj tej małej poprawki do RC57.10.39/40 — tamte archiwa nie zawierają wszystkich zmian RC57.10.41.

Kontrole: `npm run build`, `npm run check`, `python tools/test-rc571042-mobile.py`, `python tools/test-navigation.py`, `python tools/test-saves.py`.

Na Vercel Preview sprawdź przejście od wyboru świadka do rozmowy i z powrotem na telefonie; panel konfrontacji powinien być rozwijany dopiero po wejściu w rozmowę. Włącz klawiaturę ekranową, wykonaj kilka pytań i sprawdź zapis po odświeżeniu. Dla AI osobno uruchom test rzeczywistych rozmów z uwzględnieniem limitów dostawcy. Nie zastępuj tym testu na produkcji.
