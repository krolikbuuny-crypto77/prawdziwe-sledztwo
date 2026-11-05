# Prawdziwe Śledztwo — Pakiet 6.24: poprawki po audycie wersji 6.23

**Baza:** najnowsza wersja 6.23, bez przebudowy fabuły, zagadek, sprawcy, animacji twarzy i wyglądu. Zmiany wprowadzono bezpośrednio do kodu gry i backendu Vercel.

## P0 — niezaufany bank faktów w `/api/interview` — naprawiony w testowanym scenariuszu

Dawniej backend uznawał `knowledge.currentGroundedAnswer`, `factBank`, `groundedOptions` i sugestie źródeł przysłane przez przeglądarkę za wiążące dla dostawców AI. Model i jego audyt sprawdzały zgodność z **tym samym, potencjalnie sfałszowanym** materiałem.

Teraz `lib/trusted-interview-624.js` **zastępuje** pochodzące od klienta źródła autorytatywnymi fragmentami z `lib/trusted-witness-canon-624.json`, wyeksportowanego z `src/data/case-content.js`. Dozwolone sprostowania z `lib/approved-rules.js` można przedstawić modelom tylko przy serwerowo potwierdzonych dokumentach. Dokumenty *okazane* przez klienta są przecinane ze zbiorem `approvedEvidence` w sesji. Brak skonfigurowanego Supabase oznacza brak uprawnienia do poznania dodatkowych, bramkowanych faktów — nie automatyczne zaufanie przeglądarce.

Dodatkowo modelowy audyt otrzymuje propozycję dopiero po sprawdzeniu deterministycznych ograniczeń. Sfałszowana odpowiedź nie jest już do niego wysyłana, jeśli odpada na kontroli. Ostateczny modelowy audyt nadal nie zastępuje walidacji własnego serwerowego źródła.

`tools/generate-trusted-canon624.py` regeneruje zestaw, a `tools/check-trusted-canon624.mjs` sprawdza dokładny SHA-256 źródła, aby nie użyć przestarzałej biblii fabuły.

## P1 — odpowiedzi obok tematu

Nowa końcowa warstwa `src/witnesses/81-out-of-scope-624.js` obsługuje pytania o kartę T-17 i rejestr dostępu u sześciu świadków. Dla Elżbiety, Tomasza, Janusza i Marka nie przechodzi na BHP, dyspozytornię lub warsztat, jeśli pytanie dotyczy samej karty. U Kamila i Magdaleny podkreśla granicę identyfikacji osoby przez log.

Warstwa **nie** nadpisuje odpowiedzi powiązanych z pokazanym dowodem, oficjalnego sprostowania, przyznania się ani decyzji procesowej. Jej celem jest poprawa wykrytego w audycie przypadku, nie stworzenie kompletnego modelu polszczyzny.

## P2 — powtarzalny lokalny język

Skrócono dwie szczególnie urzędowe alternatywy w `src/witnesses/74-grounded-response-variety.js`. Indywidualne formułowanie odpowiedzi poza tym pozostaje zadaniem Z.ai/Groq. Nie zmieniono znaczenia udokumentowanych zeznań.

## P2 — awarie, odpowiedzi offline i serwerowy dziennik

`api/interview.js` zapisuje także bezpieczną odpowiedź autorytatywną przy awarii obu dostawców, jeśli istnieje aktywna sesja Supabase. Klient przy odpowiedzi `serverCanonical` może wyświetlić wynik zweryfikowany przez serwer bez wymuszania zgodności z **niezaufanym lokalnym** `factBank`. Nie zamienia treści tego wyniku na lokalny kanon.

Jeżeli połączenie niedostępne jest już w chwili wysyłania lub żądanie do serwera nie powiedzie się, lokalne pytanie i odpowiedź mogą przejść przez istniejącą kolejkę `PS617_SYNC` jako akcja `record_local_turn`. Serwer przechowuje je wyłącznie jako **offline_unverified**. Nie dostają uprawnień do faktów, dowodów, sprostowań ani werdyktu. Kolejka i backend zachowują dotychczasowe ograniczenia rozmiaru.

## Kompatybilność

- Bez nowych kluczy API i bez migracji SQL; nowe pola statusu zapisują się w dotychczasowym JSONB.
- Bez zmian w Cloudflare AI i w decyzjach serwerowego silnika reguł.
- Bez dodatkowych zagadek i bez zwiększania liczby wymaganych pytań.
- Wszystkie portrety SVG, sceny i zasoby z 6.23 zachowane.
- Wymieniono zestaw **uruchamianych** testów API w `package.json` na odpowiedniki 6.24. Historyczne pliki testów API 6.15–6.23 pozostają w projekcie dla porównania, lecz zawierają nieaktualne założenie o zaufaniu klientowemu bankowi faktów i mogą nie przejść przy uruchomieniu bezpośrednio.

## Ograniczenia

Nie oceniano naturalności żywych modeli Z.ai/Groq ani wydajności produkcyjnej. Na celowo spreparowanym żądaniu i atrapach modeli test przeszedł; nie jest to zewnętrzny audyt penetracyjny. Fizyczne urządzenia mobilne i prawdziwe połączenia Vercel/Supabase nie były dostępne. Brak Supabase oznacza brak serwerowej weryfikacji pełnej rozgrywki — lokalna gra jest nadal możliwa, ale jej dowody nie są automatycznie zatwierdzane.
