# RC17 — baza 830 pytań i zakres wiedzy świadków

## Zmiana
Aktywną bazą jest `lib/interview-question-bank-rc17.json`: dokładnie 830 pozycji z dostarczonego Worda, bez zmiany treści i kolejności. Zawiera sumę SHA-256 dokumentu źródłowego. `npm run test:question-corpus` używa nowej bazy. Starsze skrypty pozostają jako archiwalne regresje; nie sterują wyborem odpowiedzi.

Serwer dopasowuje identyczne pytanie do kategorii i przekazuje AI krótkie zasady rozróżniania faktów, założeń i braków wiedzy. Dla nowych sformułowań te same zasady obowiązują bez dopasowania. Do pojedynczego wywołania nie przesyła 830 pytań ani gotowych odpowiedzi. Baza nie jest treningiem modelu i nie staje się kanonem. Nie dodano wydarzeń do fabuły.

## Przegląd wiedzy
| Świadek | Publicznie dostępna wiedza | Granice |
|---|---|---|
| Marek | Nadzór zmiany, dostępność z biura, wyjścia służbowe, relacja zawodowa z Leną i jej zastrzeżenia | Brak pełnej listy wyjść i osobowego świadka całej nocy; nie zna ostatniej minuty spotkania z Leną |
| Tomasz | Ruch TW-217, znalezienie Leny i zgłoszenie alarmu o 02:02 | Alarm nie potwierdza całej wcześniejszej godziny; nie zna pewnej godziny ostatniego spotkania żywej Leny |
| Janusz | Praca warsztatu, problem TW-217, zlecenia i ograniczenia kart pracy | Brak pełnego potwierdzenia obecności i pewnej godziny ostatniego kontaktu; brak wpisu nie wskazuje sam sprawcy |
| Elżbieta | Zastrzeżenia Leny dotyczące bezpieczeństwa, rozmowa o 21:47 | Nie widziała zdarzenia; kontakt nie dowodzi wysłania formalnego zgłoszenia ani całej treści rozmowy |
| Kamil | Diagnostyka, nietypowe zdarzenia testu, sesja i autoryzacja | Log ani karta nie identyfikują automatycznie człowieka; brak dokładnej minuty ostatniego spotkania |
| Magdalena | Zgodność dokumentacji, sesja audytowa 01:30–02:00 | Połączenie nie dowodzi ciągłej fizycznej obecności; nie widziała zgłoszenia alarmu |

### Pytania wymagające materiału dowodowego
Pytania o T-17, zawartość raportów, ślady, czasy przejścia, zgodność części i podpisy wymagają rozróżnienia wiedzy zawodowej od treści konkretnego dokumentu. Dokumenty i sprostowania nadal wchodzą do kontekstu wyłącznie przez dotychczasowe bramki uprawnień. Lista pytań tych bramek nie odblokowuje.

### Założenia, których nie wolno uznać za fakty
W pytaniach występują m.in. usunięcie całej historii połączeń (Q0131), awaria/zamierzone odłączenie kamery nr 4 (Q0193), przestawienie kamer o 30 stopni (Q0195), zatrzymanie zegara dokładnie o 02:14 (Q0389), łapówki, ukryte części i konkretne groźby. Publiczne wypowiedzi świadków nie wystarczają do potwierdzenia tych szczegółów. Należy poprosić o wskazanie źródła albo nazwać brak możliwości potwierdzenia. Nie wolno też uznać braku wiedzy za dowód, że zdarzenie nie nastąpiło.

Pytania „kogo masz na myśli”, o poprzednią wypowiedź, o nerwowość lub odmowę wymagają historii rozmowy. Pytania sugerujące przyznanie nie zastępują konfrontacji. Pozycja o „fikcyjnym sekrecie klienta” nie dodaje takiego sekretu do faktów.

## Weryfikacja
Przeprowadzono kontrolę 830 pytań × 6 świadków = 4980 par: powstanie kontekstu, obecność serwerowych faktów, zachowanie pytania i wskazówek w pakiecie dla modelu, brak ujawnienia ukrytych dokumentów/sprostowań bez uprawnień. Przeszły kontrole kompilacji, integralności kanonu/dowodów, starsze 100 przypadków, kartoteki świadków, kontrakt identyfikatorów faktów i obsługa awarii dostawców.

`AUDYT-WIEDZY-RC17.json` zawiera wszystkie 4980 par i kandydatów na źródła wybranych na podstawie wspólnych słów. To indeks do dalszego przeglądu, NIE semantyczne potwierdzenie odpowiedzi. Brak dopasowania słów nie oznacza braku wiedzy. Nie wyliczamy z niego procentu poprawnych odpowiedzi.

Rzeczywiste API nie było wywoływane. Nie sprawdzono jakości 4980 odpowiedzi modelu; status live pozostaje `not_run`. Rozszerzenie bazy nie usuwa timeoutów Gemini, błędnego klucza ani limitów Groq. Nie zwiększono liczby wywołań na pytanie.

## Wgranie
Paczka zastępuje RC16. Wgraj jej pełną zawartość i wykonaj Redeploy Vercel. `/api/status` powinno wskazać `6.37-QUESTION-BANK-RC17`. Zachowano obecne ustawienia modeli. Nie zmieniono dotychczasowych zapisów gry. Ta paczka nie została przeze mnie opublikowana na Vercel.
