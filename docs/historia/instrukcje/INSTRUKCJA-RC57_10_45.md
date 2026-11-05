# Instalacja RC57.10.45 — uporządkowane Przesłuchania

1. Wykonaj kopię obecnego projektu i osobny eksport zapisu gry.
2. **Pełna paczka RC57.10.45** zawiera cały projekt, w tym serwerowe API, `lib/`, zasoby i dotychczasową oprawę RC57.10.44. To preferowany sposób wdrożenia na Vercel Preview.
3. **Aktualizacja RC57.10.44 → RC57.10.45** zawiera tylko zmienione/nowe pliki. Rozpakuj ją do istniejącego projektu RC57.10.44, zachowując katalogi i zastępując pliki.
4. Uruchom `npm run build`, `npm run check`, `npm run test:interrogations-rc45`.
5. W Vercel Preview sprawdź po 10–20 pytań do każdego z sześciu świadków, w tym negacje, sprostowania, przypomnienie początku rozmowy, presję i okazane dowody. Następnie sprawdź prawdziwy zapis Supabase i limity dostawcy.
6. Dopiero po tych próbach rozważ publikację produkcyjną.

Dokumentacja: `MAPA-PRZESLUCHAN-RC57_10_45.md` oraz `RAPORT-QA-RC57_10_45.md`.
