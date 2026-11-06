# Prawdziwe Śledztwo — RC57.10.58: naprawa paneli interfejsu

Podstawa: `Prawdziwe_Sledztwo_RC57_10_58_PROTOKOL_PRZESLUCHAN_PELNA.zip`.

## Zmiany

- Spis dokumentów: zmniejszenie wysokości kart, poprawa typografii i paska na dole.
- Desktop: panel dokumentów i podgląd mają wspólną wysokość; oba przewijają swoją zawartość bez pustego obszaru pod listą.
- Tablet/telefon: wysokość i przewijanie spisu automatycznie dopasowują się do viewportu; nie zmienia się logika przełączania listy i podglądu.
- Przesłuchania: trzy równe mierniki, czytelne etykiety i procenty; paski nie nachodzą na obramowania.
- Telefon: przeniesienie przełącznika portretu tak, by nie zakrywał wskaźników; bez zmiany działania przycisku.

## Zmodyfikowane pliki

- `src/styles/66-rc571058-panel-layout.css` — nowy arkusz CSS,
- `src/build-manifest.json` — wpis arkusza i aktualizacja sumy kontrolnej,
- `index.html` — ponownie wygenerowany po zmianach CSS.

Nie zmieniono mechaniki gry, historii, danych śledztwa, kodu API, zasad przesłuchań ani zapisu stanu.

## Kontrola

- `node tools/build.mjs` — PASS.
- `node tools/check.mjs` — PASS (61 sekcji JS, 64 sekcje CSS, 81 WebP, 9 MP3).
- `python tools/test-rc571057-panels.py` — PASS (97/97, bez błędów).
- Kontrola wymiarów i przewijania w Chromium: 320×700, 375×812, 665×800, 1024×768, 1280×900, 1920×1080 — PASS.

Kontrolowano lokalnie kod i interfejs. Nie wdrożono automatycznie do GitHub ani Vercel.

## Użycie

Rozpakuj pełne archiwum w katalogu projektu (zachowując ścieżki). `index.html` jest gotowy; w przypadku dalszych zmian źródłowych uruchom `npm run build`.
