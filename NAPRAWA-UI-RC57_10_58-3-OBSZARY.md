# Prawdziwe Śledztwo — RC57.10.58, naprawa 3 obszarów UI

**Podstawa:** pełna wersja RC57.10.58 z wcześniejszą naprawą spisu dokumentów i mierników.

## Co poprawiono

1. **Przesłuchanie świadka:** opis roli nie jest zakrywany przez mierniki. Mierniki ustawiono w naturalnym układzie, usunięto nakładanie stempla na zmęczenie, skorygowano wysokość nagłówka i mobilny przycisk portretu.
2. **Czerwona Nitka / Tablica powiązań:** większa typografia kart źródeł i pustego stanu hipotez, wygodniejszy przycisk tworzenia hipotezy, mniejsze zagęszczenie kart, poprawa wysokości ramki i przewijania źródeł.
3. **Przegląd sprawy:** usunięto przewijanie wewnątrz karty powitalnej przez naprawę konfliktu `overflow-x` i `overflow-y`; wysokość karty rośnie wraz z treścią, z zachowaniem galerii zdjęć.

**Mechanika nietknięta:** brak zmian w AI, treści śledztwa, regułach, zapisie sesji, API, przyznawaniu dowodów i przebiegu gry. Nie zmieniano portretów.

## Zmienione / nowe pliki

- `src/styles/66-rc571058-panel-layout.css` — wyłącznie CSS, dodatkowa warstwa na końcu arkusza.
- `src/build-manifest.json` — kontrolna suma SHA-256 i rozmiar źródeł.
- `index.html` — ponownie zbudowana strona produkcyjna.
- `tools/test-rc571058-three-panels.py` — automatyczny test geometrii i przewijania trzech obszarów.
- `NAPRAWA-UI-RC57_10_58-3-OBSZARY.md` — ten opis.

## Testy lokalne

- `npm run check` — PASS (61 sekcji JS, 64 sekcje CSS, 81 WebP, 9 MP3, zgodność kanonu).
- `python tools/test-rc571057-panels.py` — PASS 97/97.
- `python tools/test-rc571056-layout.py` — PASS 407/407 po pierwszej korekcie (przed końcową kosmetyką).
- `python tools/test-rc571058-three-panels.py` — PASS dla 3 obszarów × 7 viewportów (320, 390, 665, 930, 1280, 1705, 1920 px), bez błędów JS i poziomego przewijania.

**Wdrożenie:** archiwum wymaga osobnego przesłania plików do repozytorium GitHub. Samo zapisanie ZIP na Dysku Google nie zmienia strony Vercel.
