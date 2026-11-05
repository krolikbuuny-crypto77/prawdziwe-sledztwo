# RC57.10.48 — mapa wyszukiwania wiedzy AI

## Jedna ścieżka doboru informacji

`Pytanie gracza → rozpoznanie tematu / osoby / czasu → zatwierdzone fakty TEGO świadka → ranking według tematu i źródła → limit kontekstu → plan odpowiedzi → model i niezależna kontrola faktów → zapis zeznania`.

**Źródło prawdy:** `lib/witness-registry-rc22.json` przez `lib/witness-engine-rc22.js`. Nie wprowadzono nowej, równoległej bazy wiedzy ani nowych scenariuszy wydarzeń.

### Co robią moduły

| Moduł | Odpowiedzialność |
|---|---|
| `lib/witness-engine-rc22.js` | Najpierw sprawdza dostęp zgodny z zatwierdzonymi dowodami; pobiera fakty wyłącznie danego świadka |
| `lib/witness-retrieval-rc48.js` | Jedyny nowy moduł rankingu: osoba, temat, okres, źródło, trafne słowa; nie dodaje ani nie odblokowuje faktów |
| `lib/trusted-interview-624.js` | Składa serwerowy kontekst oraz okazywany dokument; pilnuje limitu 36 fragmentów łącznie |
| `lib/witness-relations-rc46.js` | Rozpoznaje wymienione osoby i zaimki; relacja wymaga faktycznego, dozwolonego źródła |
| `lib/witness-humanity-rc47.js` | Mapuje 12 obszarów osobowości i pamięci na dozwolone ID, nie wymyśla wydarzeń |
| `lib/interrogation-brief-rc45.js` | Przekazuje AI uporządkowane pierwszeństwo faktów oraz wskazówki stylu, nie nową wiedzę |
| `lib/dialogue-memory-636.js` / `lib/witness-ledger-rc22.js` | Odtwarza tylko zatwierdzoną historię własnych zeznań i deklaracje; nie stanowią nowej prawdy fabularnej |
| `api/interview.js` | Sprawdza sesję, limity, audyt semantyczny i trwały zapis; pozostawiono bez zmian |

## Priorytety rankingu

1. Temat najnowszego pytania i jawne wykluczenie tematu („nie o Lenę, tylko o alibi”).
2. Osoba lub para osób, także zaimek rozwiązany z **zatwierdzonych pytań gracza do tego samego świadka**.
3. Pytany okres: przed/po północy, bez przenoszenia wcześniejszego spotkania na późniejszą godzinę.
4. Dozwolone wpisy zawierające konkretną wypowiedź o relacji, roli, miejscu, zdarzeniu lub źródle wiedzy.
5. Indywidualne fakty świadka przed ogólnymi zasadami, które nie dowodzą zdarzeń.
6. Kilka stałych podstawowych informacji pozostaje w kontekście; reszta to fakty dobierane do pytania. Kontekst nie może przekraczać 36 fragmentów, łącznie z okazanym dokumentem.

**Fałszywe dopasowania:** podobieństwo pojedynczego zwrotu „co wiesz” nie może aktywować niezwiązanego pakietu szczegółów. Podobnie „znałeś Lenę” nie jest synonimem „znalezienia Leny”. Samo wystąpienie dwóch nazwisk w wykazie obsady nie dowodzi prywatnej relacji ani czyjejś lokalizacji.

## Granice bezpieczeństwa

- Ranking zaczyna od `allAuthorisedKnowledge(witnessId, approvedEvidence)` i **nigdy** nie korzysta z tajnych faktów innej postaci.
- Wskazówki rankingu, psychologia, opinie, historia pytań i rozmowa z graczem **nie są dowodami**.
- Brak szczegółu w kanonie to brak wiedzy, a nie zachęta do wymyślenia rodzin, relacji, miejsca pobytu lub godziny.
- Okazany dokument musi być zweryfikowany po stronie serwera, a jego treść pozostaje odróżniona od osobistej obserwacji.
- Nie zmieniano bramek dowodowych, reguł werdyktu, zapisów ani kolejności dostawców AI.

## Sprawdzanie wyboru faktów

W katalogu projektu:

```bash
npm run test:retrieval-rc48
node tools/audit-retrieval-rc48.mjs MAREK "Co wiesz o Wójciku?"
node tools/audit-retrieval-rc48.mjs KAMIL "Jak znałeś Lenę?"
```

Narzędzie diagnostyczne korzysta z lokalnego, zatwierdzonego zestawu początkowego; nie łączy się z Vercel ani Supabase i nie przeprowadza rozmowy z modelem.
