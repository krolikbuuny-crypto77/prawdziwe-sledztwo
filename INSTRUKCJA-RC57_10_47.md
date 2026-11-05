# RC57.10.47 — Żywi Świadkowie 3.0 · 12 obszarów wiedzy i psychologii

## Cel i instalacja
Bazą jest **RC57.10.46**. Pełny ZIP można wykorzystać jako cały nowy katalog projektu. Aktualizacja ZIP wymaga dokładnie RC57.10.46: rozpakuj ją do korzenia projektu z zachowaniem podkatalogów. Wykonaj `npm run build` i `npm run check`, a następnie wdroż Preview na Vercel. Zachowaj kopię wdrożenia i eksport zapisu przed aktualizacją.

## Zmienione obszary
Wszystkie sześć postaci korzysta z 12 odrębnych obszarów: życiorys; codzienność; osobiste wspomnienia; charakter; relacja z Leną; relacje z pozostałymi; przekonania; granice wiedzy; emocjonalna pamięć; indywidualny język; pamięć przesłuchania; reakcje na zachowanie gracza.

- `lib/witness-humanity-rc47.js`: plan 12 obszarów z odnośnikami **tylko** do autoryzowanego banku faktów danego świadka. Sygnały nacisku/empatii/powtórzenia pochodzą z serwerowo zatwierdzonego transkryptu. Tylko bezpośrednie wspomnienie emocji z czasu zdarzenia może być użyte jako relacja o tych uczuciach.
- `lib/interrogation-brief-rc45.js`: dołączenie planu do istniejącej logiki wybierania tematu pytań i relacji, bez zmian w stanach dowodów.
- `lib/interview-naturalness-rc28.js`: kompaktowy pakiet dwunastu obszarów przekazywany głównemu modelowi, bez wtórnego przesyłania pełnego opisu każdego obszaru.
- `lib/interview-prompt-rc57106.js`: reguły naturalnej rozmowy, pracy ze źródłami i niedomyślania się prywatnych historii.
- `lib/interview-local-rc24.js`: indywidualne (sześć głosów) odpowiedzi na pytania o prywatny życiorys, codzienną rutynę, emocje, styl, charakter, nacisk i wcześniejsze słowa; bez dopowiadania wydarzeń.
- `tools/test-rc571047-humanity.mjs`: nowe scenariusze i automatyczne zabezpieczenia przed przekraczaniem wiedzy.
- `tools/build-rc571047-humanity-map.mjs`: odtwarzalny indeks pochodzenia informacji z autoryzowanego źródła.

## Co nie zmieniło się
Kanon, `witness-registry-rc22.json`, reguły odblokowania dowodów, Supabase, API i klucze dostawców, zapis stanu oraz wygląd 10 zakładek. Nie wprowadzono nowych, niepotwierdzonych wydarzeń: u większości osób prywatna biografia i emocje z chwili zdarzenia pozostają w kanonie nieznane. Zwiększono organizację i trafność wykorzystania istniejącej wiedzy oraz indywidualne zachowanie w niepewności.

## Test przed produkcją
Odpytaj każdą osobę o wszystkie 12 obszarów, w tym „Co pamiętasz z ostatniej rozmowy z Leną?”, „Jak wyglądał twój zwykły dzień?”, „Czy znasz Kamila?”, „Jak się wtedy czułaś?”, „Czy możesz sprostować wcześniejsze słowa?” oraz „Nie twierdzę, że kłamiesz”. Następnie przeprowadź 20–30 wymian i sprawdź poprawność nawiązań oraz brak nowych prywatnych faktów. Przetestuj Vercel Preview i produkcyjne modele/API, ponieważ lokalne testy nie potwierdzają ich zachowania.
