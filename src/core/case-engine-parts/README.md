# `case-engine` — źródła podzielone na 8 części

**Źródło edycji:** `01-*.js`–`08-*.js` w tej kolejności. **Plik zgodności:** `../case-engine.js`, odtwarzany automatycznie, nie edytować ręcznie.

To **podział plików autorskich**, a nie przejście na ES Modules w przeglądarce. Części są fragmentami wspólnego klasycznego skryptu: nie muszą się uruchamiać osobno. Składanie jest bezseparatorowym łączeniem tekstu, więc wspólny zakres leksykalny, kolejność wykonania i wszystkie dotychczasowe globalne kontrakty pozostają takie same. Granice przebiegają po zakończeniu instrukcji najwyższego poziomu JavaScript, wyznaczonych parserem TypeScript.

- `01`: inicjalizacja, nawigacja, dokumenty i dowody, początek warstwy świadków.
- `02`: obszerna baza danych języka świadków.
- `03`: odpowiedzi, rozmowy, pamięć i stan świadków.
- `04`: warstwy zachowania świadków, początek TCMS.
- `05`: TCMS, wiadomości i materiał CCTV.
- `06`: CCTV, analizy śladów i początek zapisów dostępu.
- `07`: dostęp i działania śledcze.
- `08`: analiza sceny, postęp i finał.

Każda zmiana w częściach wymaga przeglądu kodu. Po zatwierdzeniu zmian: `npm run sync:case-engine:reviewed` (aktualizuje sumy kontrolne, generuje kopię zgodności, odświeża manifest części skryptu 0). Potem: `npm run check`, odpowiednie testy funkcjonalne, testy w przeglądarce i nowa linia bazowa porównania.

`npm run test:rc571061:parity` jest celowo testem **dokładnej zgodności z RC57.10.60**, więc po świadomej zmianie logiki lub CSS trzeba go zastąpić nowym testem porównawczym, a nie bezrefleksyjnie aktualizować jego sumy.
