# Pakiet 6.14 — różnorodność wypowiedzi bez zmiany ustalonych faktów

## Cel
Zmniejszyć powtarzalność lokalnych wypowiedzi sześciu świadków w pytaniach o brak pewności, motywy, chronologię, źródła informacji i odbiorców zgłoszeń. Nie dodawać nowych świadectw ani dowodów. Bazą jest publiczna paczka GitHub 6.13.

## Zmiana architektoniczna
- Nowa warstwa `src/witnesses/74-grounded-response-variety.js` rejestruje się jako **ostatni** etap `WitnessEngine`.
- Odpowiedź merytoryczna jest najpierw oceniana i generowana przez poprzednie warstwy (rozpoznanie intencji, dostępna wiedza, konfrontacje). Dopiero potem 6.14 dopuszcza wybór równoważnego językowo wariantu.
- Reguły wariantów dopasowują **pełną gotową wypowiedź** (lub jeden określony wstęp chronologiczny), a nie pojedyncze słowa pytania. Nie modyfikują dowodowych ani formalnych wypowiedzi.
- Nowy licznik wyborów i skróty ostatnich wariantów zapisują się pod `npc614` w aktualnym systemie pamięci świadków. Rejestr ma limit 48 tematów i 8 ostatnich wariantów na postać; resetowanie nowej gry usuwa go.
- Nie dotknięto systemów Z.ai, przyznawania dowodów, logiki oskarżenia ani statystyk. Przy dostępnym API Z.ai otrzymuje odpowiedź bazującą na dozwolonej wiedzy; poza API działa nowa warstwa offline.

## Zasady ochronne
- Odpowiedzi powiązane z dokumentem lub dowodem, poprawki po konfrontacji, przyznania i proceduralne odmowy pozostają w oryginalnym brzmieniu.
- Bezpieczne warianty są ręcznie zatwierdzonymi, zamkniętymi listami odpowiadającymi tej samej tezie („nie wiem”, „nie mogę potwierdzić”, „brak chronologii” itp.).
- Przy zmianie wstępu chronologicznego pozostała część odpowiedzi zawierająca fakty (np. godziny alarmu) pozostaje **identyczna bajtowo**.
- Pamięć przyjmuje finalny tekst wyświetlany graczowi i jest synchronizowana z ostatnim zatwierdzonym lokalnym zeznaniem. Wypowiedź AI nadal nie staje się nowym faktem.

## Wyniki porównania 540 pytań (Chromium, offline)
- 6.13: 306 unikalnych wypowiedzi.
- 6.14: **348** unikalnych wypowiedzi (**+42; +13,7%** względem liczby różnych tekstów).
- 97 z 540 wypowiedzi zmieniło brzmienie.
- 0 pustych odpowiedzi, 0 wyjątków JavaScript, 0 nieuprawnionych dowodów.
- Kontrola zmienionych wypowiedzi: te same numery/godziny i imiona/nazwy własne; brak przeredagowanych formalnych zaprzeczeń.
- Powtórzenie konkretnego pytania siedem razy: 5 wariantów; zapis i reset zachowały właściwe stany.

## Czego test nie dowodzi
Wynik 348/540 jest miarą **różnorodności tekstowej**, a nie dowodem 13,7% poprawy naturalności. Nie przeprowadzono niezależnej oceny semantycznej z rzeczywistym modelem Z.ai ani testu długiej sesji na fizycznym smartfonie. Warianty dotyczą ograniczonego zbioru bezpiecznych zdań, więc wiele innych odpowiedzi celowo pozostaje niezmienionych.

## Wdrożenie
`npm run build` → `npm run check` → `python tools/test-package614.py` → `python tools/test-package614-repeat.py`. Na Vercel Preview należy zachować istniejące `api/evaluate` i folder `lib` (nie są częścią paczki źródłowej), a także dotychczasowe sekrety w ustawieniach projektu. Nie umieszczać `ZAI_API_KEY` w HTML ani w GitHubie.
