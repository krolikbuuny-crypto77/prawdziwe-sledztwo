# RC35.3 — raport QA układu Starszego Śledczego

**Źródło problemu:** `src/deduction/55-mentor-and-red-thread.js` tworzył pływający przycisk w `document.body`; `src/core/case-engine.js` tworzył drugi pływający przycisk `psFab`, który był później przenoszony. Dodatkowo `src/navigation/43-interface-consolidation.js` przy wąskich ekranach przenosił `psFab` z powrotem do `body`.

**Rozwiązanie:** Pierwotny montaż przycisków bezpośrednio w `#ps76Tools`, eliminacja mobilnego przenoszenia do `body`, dynamiczne umieszczenie całych narzędzi na stronach do 1000 px tuż pod paskiem kooperacji, wyższy priorytet końcowych stylów CSS.

- `npm run build` — zaliczony
- `npm run check` — zaliczony
- `python tools/test-rc353-mentor-layout.py` — zaliczony na 6 rozdzielczościach
- `python tools/test-navigation.py` — zaliczony (4 szerokości, 10 zakładek)
- `node tools/test-rc35-coop.mjs` — zaliczony
- `node tools/test-rc351-chat.mjs` — zaliczony
- `python tools/test-rc351-chat-browser.py` — zaliczony

Testy przeglądarkowe działają na lokalnym HTML z symulowanym API. Produkcyjny Vercel, Supabase i AI nie były testowane.
