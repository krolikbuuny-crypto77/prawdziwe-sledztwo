# RC57.10.46 — pytania o innych świadków i Lenę

## Instalacja
1. Zachowaj kopię obecnego projektu oraz eksport aktualnego zapisu gry.
2. Wgraj na **Vercel Preview** pełną paczkę `Prawdziwe_Sledztwo_RC57_10_46_RELACJE_SWIADKOW_PELNA.zip` albo zastosuj aktualizację **wyłącznie** na bazie RC57.10.45, nadpisując pliki zawarte w ZIP i zachowując foldery.
3. Upewnij się, że wdrażasz pliki `lib/*.js` jako część serwerowego projektu, nie tylko `index.html`. Nowa warstwa działa na serwerze API Vercel.
4. Zbuduj i sprawdź projekt: `npm run build`, `npm run check`, `npm run test:relationships-rc46`.
5. W Preview przetestuj rozmowy z sześcioma świadkami: pytania o inne osoby, Lenę, wspólną znajomość, sprostowania cytatów, presupozycje i doprecyzowania „on/ona”.

## Zasada fabularna
Rozszerzenie NIE dodaje nowych faktów o prywatnych kontaktach. Wykorzystuje pełniej zatwierdzone fakty każdego świadka, nie zastępuje reguł dowodowych ani nie przekazuje wiedzy cudzych świadków. Brak danych o relacji jest celowym ograniczeniem, nie luką do wypełnienia przez model.

## Dokumentacja
- `MAPA-RELACJI-RC57_10_46.md` — indeks 36 kierunków pytań o osoby z perspektywy sześciu świadków.
- `RAPORT-QA-RC57_10_46.md` — testy i ograniczenia.
