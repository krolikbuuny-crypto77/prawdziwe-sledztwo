# Prawdziwe Śledztwo — pakiet roboczy 6.34

Poprawki po audycie produkcyjnego przebiegu gry z 30.10.2026. Zakres: wybrane pytania świadków, fotografia VIS-02 i wymagania źródłowe minigier.

Ważne: to następca 6.33, a nie automatycznie potwierdzona wersja gry na Vercel. Pliki są kompletne i zawierają dotychczasowe zasoby.

## Testy

```
npm run build
npm run check
python tools/test-audit634.py
npm run test:unified633
npm run test:priority1
npm run test:fast-evidence
npm run test:api629
npm run test:witnesses
npm run test:expanded-nlu
```

Bieżące i pozostałe ograniczenia są opisane w `RAPORT-QA-6.34.md`.
