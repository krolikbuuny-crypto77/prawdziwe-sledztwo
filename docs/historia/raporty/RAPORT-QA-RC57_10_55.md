# Raport QA — RC57.10.55 (stały wzorzec układu laptopowego)

## Cel i zakres

Na prośbę o zachowanie wzorca RC57.10.54 również na innych laptopach rozszerzono układ z warunku `min-width:1600px` na adaptacyjny wzorzec działający od 1080 px szerokości CSS. Wcześniejsze reguły mobilne pozostały bez zmian, a poniżej 1080 px przewidziano czytelną zmianę układu na jedną kolumnę. Zachowano wszystkie 10 zakładek i ich kolejność.

## Co zostało wykonane

- Stabilne obszary Pulpitu, Przesłuchań, Akt i Osi czasu.
- Płynna szerokość menu, zdjęć, listy świadków i formularzy bez globalnego skalowania.
- Dostosowanie wysokości rozmowy do okna (dvh), szerokości do dostępnej przestrzeni.
- Zachowanie pełnego protokołu i pola pytania w jednej kolumnie, bez pustego panelu.
- Reguły bezpiecznego układu dla okien 901–1079 px.
- Nowy automatyczny test regresyjny.

## Wyniki lokalne

- `npm run check`: PASS (61 sekcji JS, 64 sekcje CSS, spójność kompilacji, kanonu, assetów i zasad dowodowych).
- `tools/test-rc571055-laptop-parity.py`: 258/258 PASS. Rozmiary: 390×844, 1024×768, 1152×720, 1280×720, 1366×768, 1440×900, 1536×864, 1600×900, 1920×900, 1920×1080.
- `tools/test-rc571054-fullhd.py`: 221/221 PASS.
- `tools/test-rc571048-retrieval.mjs`: 2228 PASS, sześciu świadków, uprawnienia i pytania.
- `tools/test-saves.py`: PASS, migracje, import i eksport, reset, odzyskiwanie zapisu.

## Ograniczenia

Testy przebiegły lokalnie w Chromium i nie obejmują każdej kombinacji zoomu/skalowania systemu, fizycznego laptopa ani sesji z zewnętrznym AI/Supabase. Podział paneli może zostać zmieniony w wąskim oknie, aby nie ograniczać czytelności — to świadome zachowanie, nie błąd. Nie wdrożono nowej wersji do produkcyjnego Vercel.
