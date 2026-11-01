# RC30 — naprawa regresji naturalności i zgodności dostawców

## Rozpoznanie
Wersja RC28 została zbudowana z niepełnego archiwum RC27 i starszego frontendu 6.37 RC9. Z tego powodu frontend odrzucał odpowiedzi dostawców APINEX/Z.ai mimo zatwierdzenia przez serwer. Naprawa zgodności dostawców z RC29 pozostaje zachowana.

Druga, niezależna wada RC28: warstwa `reviewNaturalSpeech` uznawała sformułowania w rodzaju „nie mam alibi w sensie…” za powód ponownego wywołania modelu, nawet gdy odpowiedź była kompletna i zgodna z faktami. Następna próba mogła zakończyć się błędem lub zużyć limit.

## Naprawa RC30
- Zachowano warstwę instrukcji naturalnego języka przekazywaną do AI.
- Usunięto *wyłącznie* stylistyczny powód ponownego generowania; o przyjęciu odpowiedzi decydują dotychczasowe kontrakty faktów, `hardGuard` i niezależny audyt semantyczny.
- Zachowano aktualizację klienta RC29: serwerowo zatwierdzone odpowiedzi APINEX, Z.ai oraz lokalny autoryzowany fallback są akceptowane przez przeglądarkę.
- Nie zmieniano danych fabularnych, odblokowań, Supabase ani kluczy API.

## Pochodzenie i ograniczenia
Paczka bazuje na pełnej wersji RC29 (która była wcześniej zrekonstruowana z 6.37, fragmentów RC27 i GitHuba). Z oryginalnego, niepełnego ZIP RC27 odzyskano i porównano rzeczywisty `api/interview.js`, co potwierdziło zakres zmian RC28. Nie odzyskano kompletnego oryginalnego interfejsu RC27 — nie można zatem zagwarantować pełnej zgodności całej paczki z oryginalnym RC27.

Testy syntetyczne i budowanie nie zastępują sprawdzenia z prawdziwym API w produkcji. Gdy pojawi się błąd, należy sprawdzić `provider`, `fallbackReason` i `qualityDiagnostics`, bez ujawniania kluczy.

## Wdrożenie
Najbezpieczniejsza jest **mała poprawka RC30**, jeśli wgrano już RC29: podmień tylko `api/interview.js`. Jeśli wgrano wyłącznie RC28, trzeba dodatkowo zastosować poprawkę klienta RC29 (pliki `src/integrations/35-zai-client.js`, `src/build-manifest.json`, wygenerowany `index.html`) lub pełną paczkę RC30. Zachowaj poprzednią działającą wersję.
