# Prawdziwe Śledztwo — Biblia fabularna 2.0 (spoilerowa, dla autorów)

Punkt odniesienia: **najnowsze źródła 6.18**, zwłaszcza `src/data/case-content.js`, `src/story/11-linked-intrigue.js`, `src/story/29-narrative-breakthroughs.js`, `src/story/41-investigation-plot-turns.js`, `src/finale/57-indictment-variants-and-epilogue.js`, `lib/server-canon-618.json` i `lib/progression-618.js`. Pełny katalog 78 dokumentów, cytowanych zeznań, dziewięciu bramek oraz materiałów startowych znajduje się w `KANON_ZRODLOWY.json`. Tekst rozdziela źródło dowodowe od scenopisarskiej interpretacji.

## Niepodlegające zmianie fakty sprawy

- Lena Rudnicka jest ofiarą; znaleziono ją przy stanowisku przeglądowym nr 3 zajezdni. Samo zgłoszenie o 02:02 nie podaje chwili urazu (`MED-01`, `DIG-10`).
- TW-217, zgłoszenia diagnostyczne i niekompletny obieg odbiorowy łączą się z konfliktem o bezpieczeństwo, ale nie stanowią automatycznie mechanizmu śmierci (`TEC-01`–`TEC-04`, `EVID_WORK_ORDER_RAW`, `TEC-15`).
- Wariant L-2 widnieje na fizycznym oznaczeniu, L-3 w dokumentacji odbioru partii ZG-41. Same te źródła nie dowodzą defraudacji lub zabójstwa (`TEC-15`, `EVID_SERIAL_PHOTO`, `EVID_ACCEPTANCE_RECORD`).
- Zdarzenie czujnika o 01:44 nie jest medyczną, dokładną chwilą zgonu. Opinia wskazuje przedział 01:41–01:49 i rozróżnia uraz pierwotny od późniejszego kontaktu z podłożem (`TEC-14`, `MED-03`, `MED-10`).
- Wiadomość o 01:32 zaprasza Lenę do porównania protokołu przy stanowisku nr 3. Konta i urządzenia powiązane z wiadomością nie są samodzielną fotografią nadawcy (`EVID_MESSAGE_THREAD_RECOVERED`, `EVID_MESSAGE_DEVICE_METADATA`).
- Karta T-17 oraz sesja audytowa to rejestry operacji; nie stanowią nieprzerwanego potwierdzenia obecności fizycznej (`EVID_RESOURCE_HANDOVER`, `EVID_T17_DOOR_EVENT`, `EVID_CONFERENCE_SESSION`).
- **Ustalona przez projekt oś sprawstwa**: gałąź mocnego aktu oskarżenia w `src/finale/57-indictment-variants-and-epilogue.js` wymaga sprawcy `MAGDALENA` i metody `two_stage`, z niezależnym potwierdzeniem osoby, mechanizmu, alibi, kontaktu i chronologii. Nowa narracja ani epilog nie zmienia tych warunków.

## Chronologia zweryfikowanych punktów (nie łączyć godzin pochodzących z różnych źródeł)

| Data i czas | Zdarzenie | Dokument | Granica pewności |
|---|---|---|---|
| 17 XI 18:26 | Rozpoczęcie służbowego kursu TW-217 | `TEC-02` | Nie jest to czas powrotu ani naprawy |
| 17 XI 19:11 | Zgłoszenie diagnostyczne | `TEC-02` | Nie dowodzi usunięcia usterki |
| 17 XI 20:54 | Osobny wpis warsztatowy | `TEC-02` | Wpis i pomiar nie są tym samym |
| 17 XI 21:47 | Połączenie Leny i Elżbiety | `DIG-01` | Treść tylko z zeznania, brak nagrania |
| 17 XI 23:14 | Zmiana dyspozycji TD-217 | `EVID_DISPATCH_REVISION` | Nie jest poleceniem późniejszego spotkania |
| 18 XI 00:16 | Wydanie T-17 | `EVID_RESOURCE_HANDOVER` | Nie przesądza późniejszego użycia |
| 18 XI 00:39 | Zapis przekazania T-17 | `EVID_RESOURCE_HANDOVER` | Skrót odbiorcy wymaga potwierdzenia |
| 18 XI 01:30–02:00 | Aktywna sesja audytowa AU-01 | `EVID_CONFERENCE_SESSION` | Nie dowodzi ciągłej obecności przy ekranie |
| 18 XI 01:32 | Wiadomość do Leny | `EVID_MESSAGE_THREAD_RECOVERED` | Treść nie dowodzi przebiegu spotkania |
| 18 XI około 01:38 | Sylwetka na zsynchronizowanym CCTV | `EVID_CCTV_SYNC` | Brak wyraźnej twarzy |
| 18 XI 01:41–01:49 | Przedział prawdopodobnego zgonu | `MED-03` | To przedział, nie minuta |
| 18 XI 01:44 | Sygnał mechaniczny stanowiska | `TEC-14` | Nie identyfikuje osoby ani przedmiotu |
| 18 XI 02:02 | Zgłoszenie znalezienia Leny | `MED-01`, `DIG-10` | Nie jest godziną powstania obrażeń |

## Status informacji

**Obiektywne:** zawartość rejestrów i ich ograniczenia, opinie medyczne, potwierdzone wyniki oględzin. Wnioski o osobach wymagają niezależnych powiązań.

**Subiektywne wspomnienia:** `voice.last_seen`, `voice.alibi`, `voice.empathy` z profilu każdego świadka. Mogą wyrażać pamięć, wstyd, ocenę lub brak pewności. Nie są automatycznie faktami sprawy.

**Udokumentowane przemilczenia/sprostowania:** korekta godzin Marka, luka w zapisie Tomasza, niekompletna karta Janusza, niewysłane ostrzeżenie Elżbiety, przekazanie T-17 Kamila oraz rozbieżność protokołu Magdaleny. Ich dialogowe potwierdzenia wymagają wcześniejszych bramek. Nie wszystkie są umyślnymi kłamstwami i żadna z nich sama nie potwierdza zabójstwa.

**Niepewne:** osoba widoczna na niewyraźnym nagraniu, dokładna minuta śmierci, tożsamość posiadacza karty w danym momencie, faktyczna obecność podczas zdalnej sesji, pełna treść rozmowy o 21:47, zachowanie osoby w ostatniej chwili Leny. Gra nie może wymieniać niepewności na pewność tylko dla dramatyzmu.

**Informacje warunkowe:** `CONTENT.gates` i `NPC9_MEMORY.confronted` kontrolują oficjalne sprostowania; wątek z `PS85_STORY.available()` staje się widoczny wyłącznie po odblokowaniu odpowiednich połączeń. Nowe rozdziały życia Leny używają swoich *już posiadanych* identyfikatorów dowodów. Nie są dodatkowymi dowodami.

## Psychologia: co jest faktem, a co interpretacją

Profile w `src/story/76-narrative-depth-619.js` są **dyrektywami inscenizacyjnymi**, nie nowym kanonem. W szczególności słowa „czuje”, „obawia się” i „próbuje racjonalizować” opisują zachowanie postaci i nie mogą być używane przez AI jako dowód zewnętrznego wydarzenia.

## Finał

Ocenę osoby, kwalifikacji, obrony i wariantu rozstrzygnięcia nadal przeprowadzają istniejące reguły. Finał 3.0 dodaje językowo spokojny, źródłowo ograniczony epilog społeczno-psychologiczny dla sześciu świadków oraz Leny. Złożenie aktu oskarżenia, decyzja procesowa i ewentualny przyszły wyrok sądowy **pozostają trzema odrębnymi rzeczami**.
