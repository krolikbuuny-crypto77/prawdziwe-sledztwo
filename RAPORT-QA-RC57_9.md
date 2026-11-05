# Raport lokalny RC57.9 — siedem pytań testowych na minutę

## Zmiana

- Zastąpiono stałą przerwę 35 sekund **po zakończeniu** pytania mechanizmem uruchamiającym do 7 pytań testowych na minutę, liczonych **od rozpoczęcia** pytania.
- Co najmniej 8572 ms między rozpoczęciami. Jeden licznik w karcie obejmuje testy przesłuchań, ślepy test i ponowienia. Rezerwacja miejsca jest serializowana przy równoczesnym uruchomieniu dwóch testów.
- Po błędzie 429 obowiązuje także zalecany cooldown; raport zawiera regułę tempa.

## Testy

- `npm run build`: PASS.
- `npm run check`: PASS.
- `node tools/test-rc57-provider-migration.mjs`: PASS.
- `python tools/test-rc57-rate579-browser.py`: PASS na 390 i 1440 px. Wirtualny zegar sprawdził: minimum 8572 ms odstępu, maksimum 7 rozpoczęć w każdym 60-sekundowym oknie, 60 s po 429, wznowienie na tym samym pytaniu, wspólne tempo testu ślepego i przesłuchań, eksport JSON.
- `npm run test:rc57-hobby`: PASS (600 przypadków, 12 funkcji).
- `npm run test:rc57-quality`: PASS (testy logiki + Chromium).
- `npm run test:rc57-typos`: PASS (testy logiki + Chromium).
- `npm run test:rc57-blind`: PASS (testy logiki + Chromium).
- `node tools/test-rc57-playthrough.mjs`: PASS (trzy ścieżki, 580 kroków).
- `python tools/test-saves.py`: **niezaliczony jako ponownie zweryfikowany** — przebieg zawiesił się w środowisku i został przerwany limitem czasu. Nie zmieniano kodu zapisów.

## Zakres potwierdzenia

- Nie wywoływano prawdziwego modelu Apinex, a testy tempa wykorzystują kontrolowaną odpowiedź API i wirtualny zegar.
- Limit jest lokalny dla jednej karty; nie jest serwerowym limitem per klucz API. Wiele kart lub inne sesje nadal mogą przeciążyć wspólny limit konta Apinex.
- Jedno pytanie testowe nie jest tym samym co jedno wywołanie upstream. Wewnętrzny audyt może zużyć wiele wywołań; nie gwarantuje się braku HTTP 429.
- `index.html` pozostaje bajtowo identyczny z RC57.8; nie modyfikowano głównej gry ani danych gracza.
