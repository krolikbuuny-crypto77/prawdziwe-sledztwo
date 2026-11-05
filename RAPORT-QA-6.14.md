# Raport QA 6.14 — 29.10.2026

**Status:** PASS dla wskazanych lokalnych testów funkcjonalnych. Brak testu rzeczywistego API Z.ai i produkcyjnego Vercel.

| Kontrola | Wynik |
|---|---|
| `npm run build`, `npm run check` | PASS: 61 sekcji JS, 64 źródła CSS, 75 WebP + 9 MP3 |
| 540 par pytań: 6.13 vs 6.14 | PASS: 306→348 różnych wypowiedzi, 97 zmienionych |
| Liczby/godziny i nazwane osoby w 97 zmianach | PASS: zachowane |
| Formalne zaprzeczenia w porównaniu | PASS: niezmienione |
| Powtórzenie pytania 7×, zapis/wczytanie, reset | PASS: 5 wariantów, stan trwały/wyzerowany |
| `tools/test-saves.py` | PASS: import/eksport/reset/autosave, migracje |
| `tools/test-witnesses.py` | PASS: 720 tur, 6 świadków, fallback i fałszywe przyznania |
| `tools/test-package62.py` | PASS: 1200 tur mieszanych, 36 pytań formalnych, 12 wiadomości UI |
| `tools/test-reasoning.py` | PASS: dedukcja, 5 kwalifikacji, 6 zarzutów, opinia Cloudflare symulowana |
| `tools/test-events.py` | PASS: EventBus, brak fałszywych postępów |
| `tools/test-navigation.py` | PASS: 40 kliknięć, 320/390/768/1440 px |
| `tools/test-package64-quick.py` | PASS: wątki, dialog i zapisy mobilne |
| `tools/test-package63.py` | Przetestowane minigry x2 i lupa 4K z wynikiem PASS w logu; zbiorczy proces przekroczył limit czasu i nie dał potwierdzonego kodu zakończenia — wymaga osobnego uruchomienia |
| Z.ai na prawdziwym serwerze | NIE TESTOWANO |

**Ograniczenia:** test automatyczny nie jest niezależnym audytem semantyki. Poprawiono wyłącznie zamknięty zbiór równoważnych wypowiedzi; brak dowodu poprawy jakości na nieznanych pytaniach.
