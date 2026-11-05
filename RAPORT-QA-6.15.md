# Raport QA — Pakiet 6.15

## Potwierdzone lokalnie

- `npm run build` i `npm run check`: PASS; 61 sekcji JS, 64 sekcje CSS, 75 grafik, 9 nagrań.
- `node tools/test-api615.mjs`: PASS; API v3, wymaganie kompletności, weryfikacja faktów, odrzucanie niepoprawnych identyfikatorów i zgodność API v2.
- `python tools/test-package615.py`: PASS; pierwsza widoczna odpowiedź nie ujawnia lokalnego szkicu; Enter korzysta z chmury; przyjęta parafraza nie zastępuje kanonicznej pamięci; błąd HTTP przywraca lokalną odpowiedź.
- `node tools/test-api65.mjs`, `test-api67.mjs`, `test-api68.mjs`, `test-api611.mjs`: PASS; zgodność historycznego backendu.
- `python tools/test-package65.py`, `test-saves.py`, `test-witnesses.py`: PASS; profile sześciu świadków, migracje zapisów 1–11, eksport/import/reset, 720 tur przesłuchań.
- `python tools/test-reasoning.py`, `test-events.py`: PASS; dedukcja, finał, EventBus i źródła dowodowe.
- `python tools/test-quality610.py`, `test-package614.py`: PASS; 36 trudnych prób, porównanie wariantów 540 pytań (dotychczasowy wynik lokalny: 348 różnych tekstów), brak naruszenia faktów w zmienionych wypowiedziach.
- `python tools/test-navigation.py`: PASS; 40 przejść po modułach na czterech szerokościach.

## Nieprzetestowane

- Rzeczywiste żądania Z.ai z kluczem użytkownika, rzeczywista jakość rozumienia swobodnych pytań, koszt/opóźnienia w Vercel Preview i długie sesje na fizycznym smartfonie.
- Brak dowodu 100% poprawności rozumienia lub niezawodności automatycznej oceny semantycznej.

**Wniosek:** potwierdzono nową kolejność prezentowania odpowiedzi i działanie ochrony fabuły w testach lokalnych. Poprawa rzeczywistej trafności modelu wymaga osobnego testu z Z.ai.
