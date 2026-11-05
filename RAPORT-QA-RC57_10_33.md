# RC57.10.33 — Raport naprawy widocznych kontrolek

## Punkt odniesienia

Pełna paczka RC57.10.32. Zgłoszone trzy zrzuty obejmowały: podpis gestów
oraz wartość powiększenia zdjęcia, napis wyboru pomieszczenia i pasek
„Animacje: włączone” z niepożądanym przewijaniem.

## Zmiana kodu

Poprawiono `src/styles/rc571028-unified-dossier.css`; przebudowano wynikowy
`index.html` i odświeżono odcisk kontrolny sekcji stylów w
`src/build-manifest.json`. Funkcje JavaScript i dowody nie były zmieniane.

Szczególnie ważne: stary selektor `#interview #ps87RoomToolbar` narzucał
`max-height:38px!important` i `overflow:auto!important`. Reguła nowego
motywu o mniejszej specyficzności nie mogła go nadpisać. Nadpisanie
z identyfikatorem usuwa pasek przewijania.

## Wyniki

- Chromium: cztery szerokości 320 / 390 / 768 / 1440 px; 4/4 zaliczone.
- Kontrast podpisów i odczytu wartości zweryfikowany na computed styles.
- Kliknięcie powiększenia zmienia wartość; „Dopasuj” przywraca 100%.
- Wybór pomieszczenia nadal zawiera siedem opcji.
- Przycisk animacji zmienia `aria-pressed`; własny pasek przewijania usunięty.
- `node tools/check.mjs`: PASS; 61 sekcji JS, 64 CSS, sumy zasobów.
- Testy głównych reguł gry: 380/380 PASS.
- Symulowane działania śledczego: 580 PASS.
- Deterministyczny zestaw 600 testów: 600 PASS (nie są to odpowiedzi AI).
- Testy migracji i zapisów: PASS.

## Ograniczenia

Kontrola była lokalna; nie wykonywano rzeczywistych zapytań AI ani operacji
na produkcyjnym Supabase. Nie badano wszystkich historycznych stanów gry.
Test klikania animacji w lokalnym, niewiązanym z domeną dokumencie nie jest
równoważny testowi trwałego zapisu ustawienia w przeglądarce na Vercel.
