# Aktualna mapa projektu — RC57.10.68

## Architektura i odpowiedzialności

| Warstwa | Główne pliki i katalogi | Granice odpowiedzialności |
|---|---|---|
| Klient | `src/`, `src/index.template.html`, `src/build-manifest.json` | Widok, nawigacja, formularze, lokalne interakcje i prezentacja zatwierdzonego stanu |
| Kompilacja | `tools/build.mjs`, `tools/sync-case-engine.mjs`, `tools/strip-css-comments.mjs` | Jednoznaczne odtwarzanie `index.html`, dwóch plików `ps-js-*` i `ps-css-*` z źródeł |
| Endpointy | `api/interview.js`, `api/evaluate.js`, `api/game-state.js`, inne `api/*.js` | Granica zaufania, weryfikacja sesji, ocena, persystencja i rozmowy z dostawcami |
| Silnik przesłuchań | `lib/interview-*.js`, `lib/witness-humanity-v3.js` | Historia, wiedza świadka, kanon, plan stylu, generacja, audyt odpowiedzi, limity i rezerwy |
| Kanon i reguły | `story-bible/`, `lib/trusted-*.json`, `lib/approved-rules.js`, `lib/server-state.js` | Fakty fabularne, dostęp do dowodów, progresja i werdykt — nie są ustalane przez sam generator AI |
| Zapis i synchronizacja | `api/game-state.js`, `lib/server-state.js`, `src/integrations/` | Trwałość, zgodność historii i migracje stanów; nie zmieniać bez testów zapisów |
| Multimedia | `assets/`, `ASSET_MANIFEST.json` | Obrazy, audio i manifest ich sum kontrolnych |
| Konfiguracja deploy | `vercel.json`, `api/package.json`, `lib/package.json` | Routing, limity wykonania funkcji, nagłówki, ochrona prywatnych plików |
| Testy | `tools/test-*`, `QA-*` | Testy jednostkowe, regresyjne i materiały QA; część testów to narzędzia dawnych wersji |
| Historia | `docs/historia/`, `docs/archiwum-instrukcji/` | Archiwum poradników, raportów i decyzji; nieaktualne nagłówki nie zastępują bieżącej instrukcji |

## Przepływ odpowiedzi świadka

1. `api/interview.js` weryfikuje żądanie, sesję i dopuszczalny kontekst.
2. Serwer odtwarza zatwierdzoną historię **właściwego świadka**; odróżnia wypowiedzi gracza i świadka.
3. Warstwa wiedzy/kanonu określa granice tego, co postać może powiedzieć; `witness-humanity-v3.js` dodaje **niewładcze** wskazówki stylu i intencji.
4. Generator korzysta z kontekstu i reguł stylistycznych; audyt sprawdza treść, chronologię i zgodność z kanonem.
5. Tylko reguły serwera mogą zatwierdzić zmianę dowodów/stanu. Wskazówki psychologiczne nie są dowodami ani motywami.

## Bezpieczne zasady refaktoru

- Nie edytuj ręcznie `index.html` ani `ps-js-*`/`ps-css-*`. Modyfikuj `src/` i w razie potrzeby aktualizuj `src/build-manifest.json`, potem uruchom `npm run build` i `npm run check`.
- Nie przenoś `api/`, `lib/`, `src/`, `story-bible/`, `assets/` bez osobnej migracji importów i konfiguracji Vercel.
- Nie zmieniaj schematu zapisu ani kluczy sesji bez testów migracji i weryfikacji kompatybilności.
- Wersje poprzednich testów nie są źródłem aktualnego kontraktu API. Używaj [bieżących testów](TESTY-AKTUALNE.md).
- Nie udostępniaj folderów wewnętrznych i tajemnic jako statycznych URL; zob. `vercel.json` i `tools/project-doctor.mjs`.
