# RC57.10.31 — naprawa czytelności paneli kontekstowych i ustawień dźwięku

## Zgłoszenie i diagnoza

- W Przesłuchaniach nagłówek `#ps54Director > summary` miał jasny kolor na jasnej karcie (`rgb(243,211,157)` na pergaminie), bo starsza reguła miała większą specyficzność.
- Panel `#ps66Explain_interview` wciąż używał starego ciemnego tła (`rgb(23,38,48)`) i drobnych opisów.
- W ustawieniach dźwięku było niejednolite wzornictwo i mała typografia. Później dołączany przełącznik `Starszy Śledczy — podpowiedzi` zachowywał jasny tekst na jasnej powierzchni.
- Przycisk współpracy mógł nachodzić na otwarty panel audio z powodu niepoprawnego poziomu warstwy nadrzędnej.

## Zmiany

1. Dwa rozwijane panele rozmowy otrzymały czytelne nagłówki, stan otwarty, jasne wnętrze i wyraźne przyciski.
2. Fazy `Rytmu sceny` otrzymały jasne tło i osobne oznaczenie zaliczonych etapów.
3. Panel audio przypomina kartę akt, z czytelniejszymi opisami, większymi checkboxami, lepszą hierarchią i przewijaniem na niskich ekranach.
4. Poprawiono także później dołączane ustawienia `Starszy Śledczy — podpowiedzi` i priorytet warstwy panelu.
5. Zmiany są umieszczone w jednym ostatnim arkuszu `src/styles/rc571028-unified-dossier.css`; bez zmian w runtime JS. Dodano test `tools/test-rc571031-ui.py`.

## Weryfikacja

- `npm run build` oraz `npm run check`: PASS. Weryfikacja jednego źródła CSS, 61 sekcji JS, 64 sekcji CSS, integracji i manifestu zasobów.
- `python tools/test-rc571031-ui.py`: PASS — 320×640, 390×560, 390×844, 768×1024, 1440×900. Kontrola rzeczywistych kolorów, proporcji, dostępności kontrolek i otwierania sekcji w Chromium.
- Oszacowany kontrast tekstu nagłówka na ciemniejszym końcu pergaminu: 8,15:1. Zwykły tekst panelu audio na jasnym tle: 11,52:1; jaśniejszy opis na najciemniejszym tle 5,11:1.
- `node tools/test-rc57-whole-game.mjs`: 380/380 kontroli reguł, PASS.
- `node tools/test-rc57-playthrough.mjs`: 580 działań śledczych, PASS.
- `node tools/test-rc571013-negations.mjs`: 600/600, PASS.
- `python tools/test-saves.py`, `python tools/test-navigation.py`: PASS.
- Zrzuty lokalne: `QA-RC571031-RYTM.png`, `QA-RC571031-POMOC.png`, `QA-RC571031-DZWIEK.png`, `QA-RC571031-DZWIEK-TELEFON.png`.

## Granice testu

To test lokalny, bez żywego dostawcy AI, bez podłączania produkcyjnej bazy i bez wdrożenia na Vercel. Nie dowodzi poprawności każdego możliwego stanu wszystkich zakładek.
