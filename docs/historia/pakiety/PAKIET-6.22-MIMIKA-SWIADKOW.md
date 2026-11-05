# Prawdziwe Śledztwo — Pakiet 6.22: animowane twarze świadków

## Rzeczywiście wprowadzone zmiany

**Baza:** pakiet 6.21, zachowujący Z.ai → Groq → WitnessEngine, Cloudflare AI wyłącznie do analiz, serwerowy silnik reguł i Supabase.

1. Rozbudowano sześć **istniejących, indywidualnych portretów SVG**. Zachowano geometrię twarzy, fryzury, okulary i kolory; dodano sterowane osobno grupy oczu, tęczówek, brwi i linii ust.
2. `src/story/80-animated-faces-622.js` jest wspólnym kontrolerem 10 stanów ekspresji: neutralność, skupienie, niepewność, napięcie, defensywność, zaskoczenie, smutek, ulga, kontrolowany spokój i irytacja. Każdy ze świadków ma odrębne ustawienia bazowe.
3. Ekspresja w sali przesłuchań zależy od ostatniego pytania, dostępnych już dowodów i istniejącego stanu emocjonalnego świadka. Zmiana w ustach, brwiach, spojrzeniu, mruganiu i subtelnym ruchu głowy jest **animacją elementów SVG**, nie zmianą statycznego obrazka. Nie wprowadzono rozpoznawania kłamstwa po twarzy.
4. W ośmiu istniejących scenach przełomowych pokazywane są po dwie odpowiednie twarze z tym samym systemem animacji, bez dodawania nowej bramki. W epilogu działają te same portrety, przy zachowaniu obojętnej procesowo ekspresji niezależnie od wyniku sprawy.
5. Dodano CSS `src/styles/80-animated-faces-622.css`, z obsługą smartfonów, statycznymi miniaturkami listy oraz `prefers-reduced-motion` (wyłącza animacje).
6. Nie dodano nowych kluczy, połączeń API, nagrań, animacji wideo, minigier, dowodów, warunków zwycięstwa ani migracji Supabase. System działa offline.

## Architektura

- `src/core/case-engine.js`: dodatkowe klasy wewnątrz dotychczasowego `npc8PortraitSvg`, wywołanie aktualizacji mimiki po odświeżeniu portretu.
- `src/story/80-animated-faces-622.js`: `PS622_FACES.derive/animate/refreshCurrent/renderStory/renderFinale`. Tylko odczytuje `STATE`, istniejące warstwy i listę dostępnych źródeł. Nie wywołuje EventBus ani funkcji przyznawania dowodów.
- `src/styles/80-animated-faces-622.css`: animacja mrugania, spojrzenia, brwi, oddechu i ust. Nie modyfikuje interfejsu minigier.
- `src/build-manifest.json`: zachowuje 61 sekcji skryptowych i 64 sekcje CSS oraz ich hash.
- `tools/test-faces622.py`: integracyjny test prawdziwej struktury SVG w Chromium na 320/390/768/1440 px i ośmiu scen fabularnych.

## Ograniczenia i uczciwa ocena jakości

- To **wektorowa, stylizowana mimika** istniejących portretów, nie fotorealistyczne animacje 3D ani motion capture. Każda postać pozostaje rozpoznawalna; płynność i subtelność wymagają jeszcze weryfikacji na urządzeniach docelowych.
- Reakcje są wyprowadzane z reguł i stanu rozmowy, nie z automatycznej klasyfikacji emocji przez Z.ai/Groq. Model nadal odpowiada tekstem; jego odpowiedź nie jest bezpośrednim poleceniem do zmiany mimiki lub faktu.
- Przy okazaniu dowodu zaskoczenie może wystąpić wyłącznie wtedy, gdy dokument jest już zdobyty i istniejące napięcie jest wystarczająco wysokie. To efekt wizualny, a **nie dowód kłamstwa**.
- Testy API w tej paczce korzystają z mocków. Nie wykonano wdrożenia ani pomiarów FPS na fizycznych telefonach.
