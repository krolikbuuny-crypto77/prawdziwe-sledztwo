# Prawdziwe Śledztwo — raport RC57.10.67 „Żywi świadkowie 3.0”

**Baza:** pełna RC57.10.66. **Data:** 5 listopada 2026. **Zakres:** serwerowa inteligencja rozmowy, indywidualizacja tonu i ochrona chronologii. **Status:** testy lokalne; brak wdrożenia na Vercel, brak rzeczywistych odpowiedzi z zewnętrznych API.

## Zmiany faktycznie wprowadzone

1. **Nowy moduł `lib/witness-humanity-v3.js`** tworzy niewładczy plan rozmowy wyłącznie z bieżącego pytania, identyfikatora świadka i **zatwierdzonego przez serwer wątku tego samego świadka**. Obejmuje sześć odrębnych rejestrów mowy, sposób reakcji na pytania, wskazówki unikania powtórzeń oraz ograniczone wskaźniki dynamiki rozmowy (ostrożność, kontakt, skrócenie wypowiedzi w długiej sesji). Wskaźniki nie są dowodem realnych emocji, winy, motywów ani zdarzeń.
2. **`api/interview.js`** buduje plan po odtworzeniu wiarygodnej historii i przygotowaniu kontekstu, przed wywołaniem generatora. Ten sam moduł działa w bezpośrednio testowanej ścieżce `attemptInterview`. Oba tryby generatora korzystają z tej samej warstwy; zachowano limity wywołań, kolejność dostawców, audyt semantyczny, ograniczenia wiedzy i zapis CAS. W diagnostyce pojawiają się jedynie `humanityVersion` i kategoria `humanityMove`, bez surowego pytania, zapisu ani sekretów.
3. **`lib/interview-naturalness-rc28.js`** dodaje plan do danych generatora, ale nie zamienia go na fakty. Plan nie jest przesyłany jako uprawnienie do odblokowywania dowodów.
4. **`lib/interview-prompt-rc57106.js`** dopisuje do jedynego kontraktu generowania kolejność decyzji: dozwolony fakt → intencja pytania → reakcja postaci → naturalna wypowiedź. Nowa instrukcja zawiera obowiązek niewymyślania zdarzeń i nieprzyjmowania winy z powodu presji. Kontrakt audytu wymaga również kontroli przypisania słów do odpowiedniej tury.
5. **`lib/interview-wire-rc23.js`** dostarcza z serwerowej historii skrócony zapis **pierwszej odpowiedzi**, nawet gdy gracz nie pyta wprost o pierwszą turę, a także indeks ostatnich ośmiu tur. Są to cytaty wypowiedzi, a nie potwierdzone fakty świata gry.
6. **`lib/interview-turn-memory-rc58.js`** rozszerza wąską kontrolę błędnego cytowania z pierwszej odpowiedzi również na **poprzednią i jawnie ponumerowaną turę**, ale nie odrzuca odpowiedzi, gdy kolejność nie jest wiarygodna. Wcześniejszy mechanizm dokładnego odtworzenia zatwierdzonego cytatu został zachowany.
7. **`tools/test-humanity-v3.mjs`** — 196 nowych asercji dotyczących sześciu świadków, 13 typów pytań, wpływu presji i życzliwości, ochrony chronologii, rozdzielania niezaufanych wypowiedzi i danych modelu. `QA-HUMANITY-V3/intent-matrix.json` zawiera dodatkowe przykłady klasyfikacji.

## Wyniki lokalnych testów

| Kontrola | Wynik |
|---|---|
| `npm run build` i `npm run check` | PASS |
| `npm run test:humanity-v3` | **196/196 PASS**, sześciu świadków |
| `npm run test:rc58` | **72/72** przepływów endpointu plus 24 dodatkowe tury, bez realnego dostawcy AI; **2228** testów pobierania kontekstu i **1325** testów relacji |
| `node tools/test-rc571047-humanity.mjs` | **8419** kontroli wcześniejszego modułu psychologii — PASS |
| `python tools/test-saves.py` | PASS, zapis/import/eksport/wersjonowanie/migracje/autosave |
| `python tools/test-navigation.py` | PASS, 10 kliknięć na szerokościach 320, 390, 768 i 1440 px |
| Porównanie SHA-256 `index.html`, dwóch JS i CSS | **Identyczne z RC57.10.66** — bez zmian klienta i wyglądu |

**Znany historyczny test:** `tools/test-api624-integration.mjs` żąda teraz nieaktualnego kontraktu API (brak `turnId` i serwerowej sesji). Kończy się błędem HTTP 400 **również na niezmienionej RC57.10.66**; nie stanowi regresji nowego pakietu. Akceptacyjne testy obecnego endpointu zawarte są w RC58.

## Ograniczenia i nierozwiązane punkty

- **Brak prawdziwego testu jakości generatora AI** (Z.ai / APINEX, modele rezerwowe). Lokalne testy i symulowane odpowiedzi potwierdzają spójność infrastruktury, nie dowodzą, że model w każdej sytuacji będzie mówił naturalniej.
- Model może zignorować wskazówki stylu lub nadal powtarzać dłuższe formuły; dalszy test wymaga kilkudziesięciu prawdziwych pytań na świadka i audytu ręcznego. Zaakceptowane dowody i fabuła nadal mają pierwszeństwo.
- Nowy, niewładczy kontekst zwiększa liczbę znaków przesyłanych do modelu, więc może zwiększyć zapotrzebowanie na tokeny, czas odpowiedzi i koszt. **Nie zmierzono produkcyjnej różnicy kosztu lub opóźnienia.**
- Wskaźniki relacji to heurystyki zachowania rozmowy, **nie uczucia ustalone fabularnie**. Nie dodano kontrolowanych błędów pamięci dotyczących faktów krytycznych: w grze detektywistycznej nie wolno losowo wprowadzać fałszywych alibi.
- Serwerowa pamięć i reguły nie są migrowane; potrzebne jest potwierdzenie kompatybilności długiej sesji na Vercel Preview.

## Zalecany protokół akceptacyjny na Vercel Preview

1. Zadawać sześciu świadkom te same 10–15 pytań, porównać ich styl bez czytania imion. Ocenić odsetek odpowiedzi formalnych, ogólnikowych, nielogicznych i powtarzalnych.
2. Dla Nowickiego przeprowadzić trzy tury: pierwsza ogólna, potem nowa szczegółowa godzina, potem „Co powiedziałeś na początku?”. Pierwsza odpowiedź **nie może** przypisać sobie nowej godziny.
3. Zapytać Krawczyka „Nie pytam o Lenę, tylko gdzie byłeś po północy?”; odpowiedź ma dotyczyć jego pobytu, nie nieproszonego streszczenia wątku Leny.
4. Po kilku oskarżeniach zadać pytanie neutralne, potem życzliwe. Reakcja powinna być spójna z wcześniejszym napięciem, ale bez fikcyjnego przyznania się lub nowych faktów.
5. Zapytać „Kto może to potwierdzić?” i „Skąd to wiesz?”; odróżnić świadka-obserwatora od logu, dokumentu lub domysłu.
6. Wykonać długie przesłuchanie (co najmniej 40 tur), przełączyć świadka, ponownie otworzyć grę i zweryfikować zarówno cytaty, jak i brak wymiany cudzej pamięci między postaciami.
7. Skontrolować `qualityDiagnostics.humanityVersion === "3.0"` oraz `humanityMove` w odpowiedziach, nie logując surowych wypowiedzi ani kluczy API.
8. Dopiero po tym porównać koszty/latencję modelu i rozważyć produkcyjne wdrożenie.
