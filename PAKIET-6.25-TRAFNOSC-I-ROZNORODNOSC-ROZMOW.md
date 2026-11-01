# Pakiet 6.25 — Trafność pytań i indywidualny język świadków

**Baza:** wersja 6.24. Poprawki dotyczą tylko dwóch pozycji wskazanych w audycie: (1) odpowiedzi lokalnego silnika nie na temat oraz (2) powtarzalnych formułek. Nie dołożono zagadek, dowodów ani nowych informacji fabularnych.

## 1. Trafność lokalnych odpowiedzi

Dodano ostatnią warstwę `src/witnesses/82-relevance-and-voice-625.js`. Zachowuje dotychczasowe rozpoznawanie pytań, lecz tuż przed wyświetleniem sprawdza, czy odpowiedź odnosi się do wyraźnie wskazanego tematu. Tylko przy rozpoznanym, niezabezpieczonym odejściu od pytania proponuje krótką, ostrożną odpowiedź w granicach wiedzy postaci.

Rozpoznawane sytuacje kontrolne:

- pytania o awarię, stan, diagnozę i rozbieżności **L-2 / L-3**;
- odpowiedzialność za protokół/odbiór **L-3**;
- kolejność **alarmu i zmiany kursu**;
- powody zmiany dyspozycji **TW-217** i wystawienia zlecenia;
- **nieprecyzyjne zarzuty o sprzeczność wcześniejszych wypowiedzi**.

Jeśli pytanie łączy kilka odrębnych wątków (np. dyspozycja TW-217 i karta T-17), nowa warstwa **nie zastępuje** pełnej odpowiedzi tylko jedną częścią. Nie przerabia również odpowiedzi o wiedzy Leny na ogólną dyskusję o technice.

Warstwa nie przejmuje odpowiedzi, gdy okazano dowód, wydano proceduralną odmowę, dokonano zatwierdzonego sprostowania, padło przyznanie się, trwa formalna konfrontacja lub bieżący zapis powiązano ze źródłem dowodowym. Istniejący silnik nadal przeprowadza takie przypadki samodzielnie.

## 2. Naturalność i różnorodność

Sześć świadków otrzymało **różne zestawy krótkich, znaczeniowo bezpiecznych sformułowań** w sześciu rozpoznawanych sytuacjach. Są to warianty *ograniczenia wiedzy lub prośby o doprecyzowanie*, nigdy nowe relacje o zdarzeniach. Wybór uwzględnia postać, sformułowanie pytania i ostatnie wypowiedzi, aby ograniczyć bezpośrednie powtórzenia.

Różnice charakteru:

- Marek: odpowiedzialność organizacyjna i precyzja wypowiedzi;
- Tomasz: zwięzłe, mniej formalne wyjaśnienia dyspozytora;
- Janusz: język warsztatowy i potoczne reakcje;
- Elżbieta: spokojne, ostrożne rozdzielanie techniki i BHP;
- Kamil: granice pomiaru, logu i interpretacji;
- Magdalena: kontrola języka dokumentacyjnego bez automatycznego przyznawania winy.

Nie wprowadzono nowego modelu AI w przeglądarce. W trybie online nadal działa **Z.ai → Groq → lokalna rezerwa**. Priorytet rzeczywistych odpowiedzi chmurowych pozostaje bez zmian.

## Próbka przed / po (wynik testu lokalnego)

**Pytanie do Tomasza:** „Co wiesz o awarii L-2 i L-3?”

- Przed: „Znalazłem Lenę przy stanowisku numer trzy i wezwałem pomoc. Nie widziałem, jak doszło do obrażeń.”
- Po: „L-2 i L-3? Nie sprawdzałem tych części. Nie powiem, co się w nich zepsuło.”

**Pytanie do Janusza:** „Wcześniej mówiłaś inaczej.”

- Przed: wypowiedź ze wspólną formułą „Jeśli chodzi o sprzeczność, proszę wskazać dwie konkretne wypowiedzi...”.
- Po: „Daj mi tę wcześniejszą wypowiedź. Nie będę kłócił się z ogólnym zarzutem.”

Są to wyniki przykładowych kontrolowanych pytań, nie dowód pełnego rozumienia wszystkich parafraz.

## Zmienione pliki

- `src/witnesses/82-relevance-and-voice-625.js` — **nowa** warstwa trafności i głosów sześciu osób;
- `src/build-manifest.json` — aktualizacja 61. sekcji JS;
- `src/compatibility-contracts.json` — 19 warstw odpowiedzi;
- `tools/test-witnesses.py`, `tools/test-package62.py` — aktualizacja **wyłącznie** oczekiwanej liczby warstw, bez osłabiania scenariuszy;
- `tools/test-quality625.py` — **nowy** rzeczywisty test przeglądarkowy;
- `package.json` — `npm run test:relevance625`;
- `index.html` — przebudowana wersja produkcyjna.

## Ważne ograniczenia

Ta poprawka nie daje lokalnemu silnikowi pełnego modelu języka. Kontrolowane kategorie nadal wykorzystują heurystyki i bezpieczne alternatywy tekstowe. Nie udowadniamy stuprocentowej trafności, spontaniczności dialogu ani naturalności odpowiedzi Z.ai/Groq. Wszystkie testy AI wykonywano na mockach; produkcyjne usługi nie były włączone.
