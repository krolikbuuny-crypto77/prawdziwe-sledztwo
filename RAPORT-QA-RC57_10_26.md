# Raport QA — RC57.10.26

## Cel
Osiem ulepszeń wyglądu bez zmiany reguł, dialogów, usług lub danych sprawy. Oparty na kodzie RC57.10.25 i zaakceptowanym drugim obrazie.

## Ulepszenia
1. Stały, trójstrefowy układ przesłuchania z kontrolowaną wysokością protokołu.
2. Wzmocnienie warstw pergaminu, obramowań i cieni bez dekoracyjnego szumu.
3. Czytelniejsze, poprawnie łamane wypowiedzi w osobno przewijanym protokole.
4. Pusty panel dowodów z jednoznacznym komunikatem i oryginalnym selektorem zdobytych materiałów.
5. Niezależne od liczby wypowiedzi pole własnego pytania, także po 50 wiadomościach.
6. Identyczne zdjęcie w dużej karcie i miniaturach, jednolite proporcje i pełny kadr bez pustego pasa.
7. Krótkie animacje interakcji z obsługą `prefers-reduced-motion`.
8. Widok telefonu i tabletu bez nakładających się kart oraz z czytelnym formularzem.

## Wyniki testów lokalnych
- Build: PASS, kompletna strona `index.html` z rzeczywistych źródeł.
- 380 kontroli reguł: PASS.
- 580 symulowanych działań śledczych: PASS.
- 600/600 testów negacji: PASS.
- 10 modułów, szerokości 320 / 390 / 768 / 1440 px: PASS.
- Sześć świadków, zmiana zdjęć, zachowanie własnego pytania, wybór oryginalnych dowodów: PASS.
- Jeden panel zachowania: PASS.
- 50 wiadomości w protokole, szerokości 320 / 390 / 768 / 1280 / 1440 / 1648 / 1920 px: PASS; brak poziomego wycieku, pole pytania stabilne, dostępne przewijanie.
- Symulacja mobilnej klawiatury (390 × 560): PASS dla widoczności i szerokości aktywnego pola.
- Pusty panel dowodów: PASS; jeden informacyjny stan zamiast przedwczesnego ujawniania dokumentów.

## Ograniczenia
Nie jest to kopia makiety piksel po pikselu ani test prawdziwego Apinex/Supabase. Test 50 wiadomości jest symulacją tylko do QA, a nie dodaniem gotowego dialogu do gry. Przed publikacją konieczny test Vercel Preview, rzeczywistych pytań i zapisów.
