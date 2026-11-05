# Raport QA — Pakiet 6.25

## Cel

Sprawdzenie trafności lokalnych odpowiedzi dla wykrytych błędów (zwłaszcza L-2/L-3), zmniejszenia identycznych formuł u sześciu świadków oraz zachowania bramek dowodowych, zapisów i finału.

## Wyniki uzyskane w środowisku lokalnym

| Test | Wynik | Co zweryfikowano |
|---|---|---|
| `npm run build` | PASS | Odbudowany jeden `index.html` |
| `npm run check` | PASS | 61 sekcji JS, 64 CSS, 75 WebP, 9 MP3; struktura, fingerprint kanonu |
| `npm run test:relevance625` | PASS | 16 pytań × 6 świadków × 2 szerokości = **192 odpowiedzi**; temat, różne głosy, brak zmian dowodów |
| Granice nowego kontrolera | PASS | Pytania o Lenę, domniemany sabotaż i pytania dwuwątkowe nie są przejmowane przez regułę L-2/L-3 |
| Sześć głosów | PASS | Przy trzech kluczowych pytaniach każda z sześciu postaci udzieliła innej odpowiedzi |
| `npm run test:security-624` | PASS | Serwerowy bank faktów, próba podsunięcia fałszywego kanonu i nieautorytatywny dziennik offline |
| `npm run test:progression` | PASS | Serwerowo zatwierdzane 15 etapów minigier, kontrola finału, konfliktów i kolejki |
| `npm run test:ai-primary` | PASS | Z.ai → Groq → lokalnie na mockach, kontrola nieuprawnionego przyznania |
| `npm run test:witnesses` | PASS | 720 tur, sześć postaci, odtworzenie pamięci, przyciski i Enter, awaria sieci |
| `npm run test:dialogue` | PASS | 1200 tur mieszanych, 36 pytań formalnych, pamięć i przejścia przez interfejs |
| `npm run test:saves` | PASS | Eksport/import, 11 starszych wersji zapisów, rollback, reset i autosave |
| `npm run test:inspections-puzzles` | PASS | Wszystkie 5 minigier na dwóch szerokościach, brak przecieku dowodów |
| `npm run test:faces` | PASS | Sześć animowanych portretów, osiem przełomów, finał, 320–1440 px |
| `npm run test:navigation` | PASS | 40 przejść, 4 szerokości, brak błędów JS |
| `npm run test:reasoning` | PASS | Dedukcja i kwalifikacje, brak autorytatywności Cloudflare |
| `npm run test:story` | PASS | Bramki fabularne i zapis na czterech szerokościach |
| `npm run test:quality624` | PASS | Regresja odpowiedzi T-17 wszystkich sześciu świadków |

## Co faktycznie poprawiono

- **Przed:** 6/6 badanych świadków potrafiło odpowiedzieć na pytanie o awarię L-2/L-3, nie wspominając o L-2/L-3. **Po:** 6/6 badanych odpowiedzi dotyczyło wskazanych części.
- **Przed:** sześciu świadków używało wspólnej rozbudowanej formuły o dwóch wypowiedziach. **Po:** odpowiedzi sześciu postaci na niejasny zarzut miały odrębne brzmienie i były krótsze.
- Brak dodatkowych odblokowań, zmiany ustalonego sprawcy, godzin kanonicznych lub zasad oskarżenia.

## Uwaga o wskaźnikach

192 odpowiedzi sprawdzono automatycznie pod kątem niepustego tekstu, orientacyjnego związku z tematem i różnorodności postaci. To **nie jest** niezależna ludzka ocena sensowności 192 odpowiedzi. Nie można na tej podstawie obliczyć skuteczności dla wszystkich możliwych pytań.

## Ograniczenia

- Brak rzeczywistych zapytań do Z.ai i Groq, pełnego testu produkcyjnego Vercel/Supabase oraz testu użytkowników.
- Klasyfikacja lokalna jest heurystyczna i może nie rozpoznać sarkazmu, niejawnych odniesień lub nietypowych parafraz.
- Ograniczona liczba wariantów nadal może się powtarzać w bardzo długiej rozmowie. To redukcja schematyczności, a nie całkowita eliminacja powtórzeń.
- Nie wykonano pełnego przejścia gry od początku do każdego zakończenia w prawdziwym środowisku produkcyjnym.
