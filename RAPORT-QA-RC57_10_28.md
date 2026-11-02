# RC57.10.28 — Raport wdrożenia wyglądu i kontroli jakości

Data: 2 listopada 2026 r.

## Zakres

Dokończono jeden system wizualny „Akta Śledcze” dla wszystkich zakładek poza utrzymanym już ekranem Przesłuchań: Pulpit, Akta, Poszukiwania, Oś czasu, Oględziny, Notatnik, Laboratorium, Dedukcja, Finał.

Źródło zmiany: `src/styles/rc571028-unified-dossier.css`, dołączone jako ostatnia część istniejącej scalanej sekcji CSS w `src/build-manifest.json`. Nie dodano drugiego, konkurencyjnego arkusza. Tylko 9 wymienionych sekcji ma klasę `ps28-skin`, dodaną w `src/index.template.html`.

Główne elementy: jasne pergaminowe wnętrza, ciemnobrązowy tekst, widoczne tytuły, obramowania i odstępy, spójne formularze i przyciski, kontrastowe karty wątków, osi czasu, analiz, dedukcji i finału. Zasoby obrazów dowodowych i fotografii świadków pozostały niezmienione.

## Kontrole wykonane

- `node tools/build.mjs` — PASS, 61 sekcji JavaScript + 64 sekcje CSS w jednym style produkcyjnym.
- `node tools/check.mjs` — PASS, zgodność kodu źródłowego z kompilatem, integralność manifestu, 81 WebP i 9 MP3, kontrola kontraktów integracji.
- `node tools/test-rc57.mjs` — PASS, 600 lokalnych przypadków administracyjnych.
- `node tools/test-rc57-whole-game.mjs` — PASS, 380 unikalnych kontroli reguł.
- `node tools/test-rc57-playthrough.mjs` — PASS, 580 działań w 3 symulowanych przejściach.
- `node tools/test-rc571013-negations.mjs` — PASS, 600 przypadków, w tym 60 negacji.
- `python tools/test-saves.py` — PASS, checksum, zapisy, migracje, import/eksport, przywracanie po błędzie.
- Własny test Chromium na rzeczywistym zbudowanym `index.html`: **70/70 widoków PASS** — 10 zakładek na 320×720, 390×844, 768×1024, 1024×768, 1280×800, 1440×900 i 1920×1080 px, brak poziomego przewijania dokumentu i aktywnej sekcji, zakładka prawidłowo otwarta.
- Zrzuty 20 widoków (10 na 390px i 10 na 1440px) w `PODGLADY/` oraz raport pomiarów `QA-UI-RESULTS.json`.

## Zakres nienaruszony

Nie zmieniono kodu silnika AI, mechaniki pytań, kanonu Leny Rudnickiej i TW-217, zdjęć, uprawnień do dowodów, zapisu i werdyktu. Przyciski i pola pozostały pod swoimi identyfikatorami.

## Ograniczenia

Testy lokalne nie potwierdzają realnej dostępności Apinex ani zapisów w produkcyjnym Supabase. Dodatkowo testy przeglądarkowe wykorzystywały kontrolowane środowisko bez realnego mobilnego IME. Przed publikacją sprawdzić Vercel Preview, klawiaturę na fizycznym telefonie, prawdziwe pytanie i zapis/odczyt sprawy. Ze względu na rozbudowaną historię projektu część wyspecjalizowanych ciemnych paneli narzędziowych (np. tryb fotografii technicznych) zachowała odrębną stylistykę, ale z czytelnymi kontrolkami.
