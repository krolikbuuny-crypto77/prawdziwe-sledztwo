# RC27 — zakres alibi i niepoparta wyłączność źródeł

## Problem
Wypowiedź Marka o „jedynych obiektywnych źródłach, których nie odtwarza” przeszła audyt chmurowy. Wiedza o niepełnym potwierdzeniu całej nocy nie uprawnia do wykluczenia innych źródeł ani do kategorycznego stwierdzenia, że świadek nie ma żadnego alibi.

Samo „Nie mam alibi w sensie ciągłej obecności…” zawiera kwalifikację i nie jest traktowane jako bezwarunkowy brak alibi. Główne błędy zgłoszonej wypowiedzi to niepoparta wyłączność źródeł i nielogiczne sformułowanie o odtwarzaniu źródeł. Nie dodajemy obowiązku twierdzenia, że świadek ma pełne alibi.

## Zmiany
- Krótkie instrukcje generowania i audytu wymagają zachowania zakresu częściowego potwierdzenia oraz odrzucenia niepopartych określeń „jedyne/wyłączne źródła, dowody, świadkowie”.
- Nowa wąska kontrola interview-scope-rc27 działa przed audytem AI i przed szybką akceptacją cytatu. Model nie może jej ominąć wynikiem entailed=true.
- Kontrola odrzuca kategoryczne „nie mam alibi”, jeżeli takiego twierdzenia nie ma w wybranych faktach i wypowiedź nie ma ograniczenia zakresu. Pozwala na autorskie dosłowne zaprzeczenie, niepełne alibi i zaprzeczenie wcześniejszemu cytatowi.
- Kontrola wyłączności uwzględnia negację, np. „Rejestr nie jest jedynym źródłem”. Nie wymaga recytowania wszystkich potencjalnych źródeł.
- Niezręczne „źródła, których nie odtwarzam” dostaje oddzielną wskazówkę poprawy. Granicę pamięci trzeba odnosić do zdarzeń lub godzin.
- Błędna propozycja uruchamia istniejącą ograniczoną poprawkę z konkretnym powodem, następnie audyt. Jeżeli poprawka zawiedzie, działa dalsza kolejność modeli i lokalna rezerwa.
- Log jakości rozróżnia unsupported_exclusivity, alibi_scope_overreach i unclear_source_phrase.

To dodatkowe wąskie reguły znaczenia, nie pełna automatyczna gwarancja poprawności każdej parafrazy. Nie zmieniamy faktów, bramek dowodowych, pamięci, limitu 90 sekund ani kolejności modeli.

## Weryfikacja
Dokładna wypowiedź użytkownika jest odrzucana. Kontrolowany test całej funkcji generowania potwierdza kolejność generate → rewrite → semantic-audit oraz poprawną akceptację poprawionej wypowiedzi. Powtórne podanie tej samej błędnej treści zostaje odrzucone. Sprawdzono poprawne kwalifikacje alibi, zaprzeczenia wyłączności i dosłowne autorskie stwierdzenia. Przeszły też regresje routingu, lokalnej rezerwy, kontraktu faktów, polskich odniesień i budowania.

Reprezentatywne żądanie ma 11 751 znaków instrukcji i payloadu, z zachowaniem wszystkich 36 faktów. Nie wykonano rzeczywistych wywołań API.

## Wdrożenie
Wgraj pełną paczkę RC27 i wykonaj Redeploy. Klucze APINEX_API_KEY i ZAI_API_KEY pozostają te same. Nie ma zmian SQL ani dodatkowych zmiennych. Fluid Compute i limit 90 sekund z RC26 pozostają aktualne.

Status: 6.38-ALIBI-SCOPE-RC27.
