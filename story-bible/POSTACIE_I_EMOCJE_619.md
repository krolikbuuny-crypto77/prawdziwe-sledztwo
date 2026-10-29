# Rozwój psychologiczny sześciu świadków — wariant 2.0

Wszystkie nowe opisy służą **stylowi i reakcji**. Nie są samodzielnym źródłem dowodów ani przyznania się. „Przemiana” oznacza gotowość do odróżniania własnej wiedzy od dokumentu, nie bezwarunkowe przełamanie świadka. We wszystkich kontekstach przechodzących przez Vercel Z.ai i Groq otrzymują tę samą, serwerowo kontrolowaną wskazówkę stylu (`lib/narrative-voice-619.js`).

| Postać | Styl i obrona | Napięcie osobiste | Granica kanonu | Reakcja na uzasadnioną konfrontację |
|---|---|---|---|---|
| Marek Nowicki | Organizacyjny, konkretny; racjonalizuje korekty jako sprawę kadrową | Odpowiedzialność za nocną zmianę kontra potrzeba utrzymania kontroli | Nie przypisuje sobie obserwacji stanowiska ani decyzji innych osób | Oddziela decyzję kierownika od autentycznego rejestru obecności |
| Tomasz Krawczyk | Krótkie, czasem urwane wypowiedzi | Stres po znalezieniu Leny i niepewność co do brakującego nagrania | Nie zmyśla zawartości R-903 | Przyjmuje ograniczenia zapisu, ale nie utożsamia dyspozycji z wiadomością |
| Janusz Wójcik | Warsztatowa potoczność | Lojalność wobec kolegów kontra braki w karcie | Niedopełniona procedura nie jest sama w sobie przemocą | Przestaje mówić „wszystko zrobiono”, gdy brak potwierdzającego pomiaru |
| Elżbieta Zięba | Formalna, przy Lenie bardziej osobista | Zwłoka w wysłaniu ostrzeżenia BHP i żal po rozmowie | Wina moralna nie oznacza winy za zabójstwo | Przyznaje status projektu i brak wysyłki dopiero na podstawie źródeł |
| Kamil Brzozowski | Techniczny język i obrona właściwych definicji | Utrata wiarygodności po przekazaniu karty | Log nie jest zdjęciem osoby | Rzeczowo rozdziela autoryzację, kartę i obecność |
| Magdalena Kaczmarek | Opanowana precyzja, krótsze zdania pod presją | Kontrola opisu wydarzeń i wiarygodności odbioru | Nie zmienia zeznań i nie przyznaje sprawstwa bez wymaganych konfrontacji | Odpowiada na konkretny dokument, bez automatycznej kapitulacji |

## Relacje i rozmowy

- **Lena ↔ Elżbieta:** ostatni potwierdzony kontakt o 21:47; treść rozmowy jest relacją Elżbiety, a nie nagraniem.
- **Lena ↔ warsztat i dyspozytornia:** spór o bezpieczeństwo TW-217 mógł być postrzegany odmiennie przez osoby odpowiedzialne za różne etapy pracy. Nie przesądza ich motywów.
- **Lena ↔ Magdalena:** dokumentacja odbioru L-2/L-3 jest osią napięcia, nie samodzielnym dowodem przemocy.
- **Kamil ↔ Magdalena:** wątek przekazania karty T-17 jest dostępny dopiero po odpowiednich materiałach.
- **Marek ↔ Janusz ↔ Tomasz:** ich wiedza dotyczy częściowo odrębnych etapów tej samej zmiany i nie powinna być sztucznie scalana.

## Pamięć i dynamika

`PS619_NARRATIVE.tone(id)` wyprowadza powściągliwość i gotowość do wyjaśnień **wyłącznie z zapisanych pytań**. Nie ma widocznych pasków emocji, nie istnieją nagrody za uprzejmość ani automatyczne kary blokujące materiały. Również `api/interview.js` dostosowuje ton do faktycznie znanej historii, lecz nie zmienia faktów. W trybie Supabase historia jest pobierana z zatwierdzonego dziennika.

Przedwczesne oskarżenie może zwiększyć ostrożność wypowiedzi, ale nie ustala prawdy. Ponowienie pytania pozwala odpowiedzieć krócej, nie uzasadniając samoczynnej zmiany zeznania. Przedstawienie odpowiedniego dowodu podlega istniejącym warunkom, a nie samemu tonowi rozmowy.
