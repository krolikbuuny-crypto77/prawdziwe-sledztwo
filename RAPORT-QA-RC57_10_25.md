# Raport QA — RC57.10.25

## Zakres i porównanie ze wzorem

Praca na plikach rzeczywistej gry RC57.10.24. Referencją pozostaje zaakceptowany przez użytkownika drugi obraz, a nie nowe wygenerowane przykłady. Poprawiono wygląd i układ bez zmiany mechanik.

- Zmniejszono wysokość 10 przycisków lewego menu z 56 do 43 px w widoku komputerowym.
- Powiększono miniatury postaci w kartotece, zwiększono kontrast nazw i statusów oraz uporządkowano odstępy.
- Dopasowano tekstury drewna i pergaminu; usunięto artefakty wynikające z poprzedniego wycinania faktur z obrazu.
- Wzmocniono warstwowość kart, protokołu, fotografii, pól i przycisków.
- Dodano wyłącznie informacyjne oznaczenie sprawy (Lena Rudnicka, TW-217), bez nowych twierdzeń o świadkach.
- Utrzymano fotografie sześciu postaci, stan zachowania, mechaniki dowodów, pole wyłącznie własnego pytania.
- W panelu dowodów nie dodano żadnych niedostępnych materiałów z wizualizacji.

## Wyniki lokalne

- `node tools/build.mjs`: PASS.
- `python tools/visual-check-rc24.py`: PASS dla 1648, 1440, 768 i 390 px; brak poziomego przepełnienia strony; jeden formularz pytania.
- `python tools/smoke.py`: PASS 10 modułów na szerokościach 320, 390, 768, 1440 px; bez błędów JS i przepełnienia poziomego.
- `python tools/test-rc571023-actions.py`: PASS (6 świadków, zmiana portretów, zachowanie wpisanego pytania, selektor dowodu).
- `python tools/test-rc571016-single-behavior-panel.py`: PASS (jeden panel zachowania).
- `node tools/test-rc57-whole-game.mjs`: PASS, 380 sprawdzeń reguł.
- `node tools/test-rc57-playthrough.mjs`: PASS, 580 działań w symulowanych scenariuszach.
- `node tools/test-rc571013-negations.mjs`: PASS, 600/600.

## Uczciwe ograniczenia

To **zbliżenie wizualne działającego interfejsu**, a nie pikselowa kopia generowanej makiety. Makieta zawiera przykładowe dialogi i nieodblokowane dowody, których nie wolno dodawać do produkcyjnego stanu gry. Nie testowano tu z prawdziwym Apinex ani Supabase i nie wykonano wdrożenia Vercel.
