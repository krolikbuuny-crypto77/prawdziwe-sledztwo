# Pakiet 6.21 — Długie, wielowątkowe rozmowy i filmowe przełomy

## Zakres faktycznie wdrożony

**Warstwa przesłuchań**

- Nowy serwerowy moduł `lib/dialogue-threads-621.js` porządkuje tematy z dłuższej zatwierdzonej historii pojedynczego świadka: chronologia, dokumentacja, dostęp, Lena, alibi, technika, motywy, odpowiedzialność, źródła.
- Historia wypowiedzi zaakceptowanych przez backend ma teraz limit **48 wiadomości (24 pary pytanie–odpowiedź)**, zamiast 12 wiadomości. Do modelu nadal trafia najwyżej **12 ostatnich wypowiedzi** oraz **krótkie streszczenie powracających tematów**; pełna starsza historia nie jest przesyłana do każdego zapytania.
- Kontekst jest przygotowywany po stronie Vercel przed wyborem dostawcy. **Z.ai i Groq widzą identyczne wskazówki i ten sam bank dopuszczonych faktów**. Lokalny silnik pozostaje ostatnią rezerwą.
- Wskazówki odróżniają ponowione pytanie, kilka tematów w jednej wypowiedzi i zatwierdzone sprostowanie. Nie są źródłem faktów; model musi odpowiadać na pytanie z dozwolonego `factBank`.
- Nowa lokalna warstwa `src/story/78-long-interviews-621.js` pokazuje subtelną, opcjonalną adnotację o powracających tematach po co najmniej ośmiu pytaniach. Bez zmian w zeznaniach i bez nowych przycisków blokujących postęp.

**Warstwa scen przełomowych**

- `src/story/79-cinematic-turns-621.js` nadaje ośmiu **istniejącym** scenom indywidualne nastroje świetlne (`paper`, `warning`, `cold`, `night`), krótkie podpisy i dyskretny efekt przejścia między kadrami.
- Nowe style `src/styles/78-interviews-cinema-621.css` są dostosowane do 390, 768 i 1280 px oraz `prefers-reduced-motion`.
- Gracz może **samodzielnie włączyć** bardzo cichy, oryginalny syntetyczny dźwięk przejścia. Domyślnie jest wyłączony; nie używa nowych nagrań, nie odtwarza muzyki zewnętrznych twórców.
- Istniejące akapity, wybory, warunki dostępności scen i zapis tego, które sceny odczytano, pozostają bez zmian.

## Co celowo nie zostało zmienione

- Dowody, zasady odblokowania, minigry, chronologia kanoniczna, sprawca, progi aktu oskarżenia i werdykt.
- Cloudflare AI nadal służy wyłącznie do analizy śledztwa.
- Supabase pozostaje zapisem zatwierdzonego stanu; nowy kod nie wprowadza zmian w schemacie SQL.
- Nie dodano wymuszonych dialogów, zagadek, limitów pytań ani kar.

## Ograniczenia

- Zestaw tematów to **heurystyki językowe**, a nie pełny model semantyczny języka polskiego. Mogą przeoczyć niektóre parafrazy.
- Przeglądarka nie jest źródłem autorytatywnych zeznań. Bez skonfigurowanego Supabase lokalna historia jest używana wyłącznie jako wskazówka stylistyczna.
- Nie dodano nowych modeli 3D, animacji twarzy ani nagranych dialogów.
- Testy API były symulowane; nie wykonano zapytań z prawdziwymi kluczami.
- Automatyczne testy nie potwierdzają, że wypowiedzi brzmią naturalnie dla człowieka.
