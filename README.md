# Prawdziwe Śledztwo — Ostatni kurs

**Aktualne wydanie repozytorium: RC57.10.68 (porządkowanie projektu).**
**Stan wdrożenia:** przygotowane lokalnie; wdrożenia produkcyjnego ani testów prawdziwego AI nie wykonano.

## Od czego zacząć

- [Instrukcja bieżącego wydania i wdrażania](INSTRUKCJA-GLOWNA.md) — aktualizacja, pełna paczka, Vercel Preview.
- [Mapa projektu i odpowiedzialności](docs/ARCHITEKTURA-AKTUALNA.md) — klient, API, źródła, zapisy, AI.
- [Testowanie i status testów](docs/TESTY-AKTUALNE.md) — szybkie i pełne testy, granice weryfikacji.
- [Spis historycznych raportów i instrukcji](docs/HISTORIA-WYDAN.md) — archiwum bez utraty materiałów.
- [Raport RC57.10.68](RAPORT-QA-RC57_10_68.md) — zmiany i wyniki.

## Praca z kodem

```bash
npm run build
npm run check
npm run project:doctor
npm run test:current
```

Serwer Vercel: `api/` i `lib/`. Źródła klienta: `src/`. `index.html` oraz pliki `ps-js-*`, `ps-css-*` **są generowane** przez `npm run build`; nie edytuj ich ręcznie. Autorytatywne reguły śledztwa, fabuła i uprawnienia pozostają po stronie serwera. Szczegóły w mapie projektu.

Dokumenty starszych wersji są materiałem historycznym — nie stanowią instrukcji do aktualnej wersji.
