# Prawdziwe Śledztwo — pakiet 6.29 (API)

Kompletny ZIP do zastąpienia plików w repozytorium GitHub, **nie sam patch**. Wersja bazowa: 6.28.1.

## Poprawki

1. **Z.ai → Groq → lokalnie**: `api/interview.js` używa Z.ai jako pierwszego dostawcy, `openai/gpt-oss-120b` w Groq jako pierwszej rezerwy oraz kanonicznej lokalnej wypowiedzi w Vercel jako ostatniej rezerwy. Gdy `GROQ_MODEL` w Vercel nadal ma starą wartość `llama-3.3-70b-versatile`, serwer automatycznie wybiera `openai/gpt-oss-120b`. Dla Groq włączono tryb odpowiedzi JSON i niski nakład rozumowania. Gdy oba klucze API są nieobecne, serwer nadal zwraca poprawny fallback HTTP 200 z `provider=local`.
2. **Prawidłowa diagnostyka**: `fallbackReason` nie wskazuje niedostępnego Groq, jeśli Z.ai już odpowiedział poprawnie. Zachowano `provider`, `model`, `requestId`, `durationMs`.
3. **Cloudflare**: `api/evidence-review.js` wymaga nagłówka `X-PS-Client: game`, sprawdza Origin i podpisaną sesję Supabase. Wysyła modelowi wyłącznie treści dokumentów pochodzące z serwerowego rejestru, odblokowane w tej sesji, oraz odpowiadające zapisowi serwerowemu zeznania. Odrzuca dokumenty niezebrane i zeznania offline niezatwierdzone. Opinie AI nie wpływają na reguły ani werdykt.
4. **Limit Cloudflare odporny na wiele instancji**: nowy Postgres RPC `ps_allow_ai_review` z migracji `supabase/002_ai_review_limits.sql`: maksymalnie 8 analiz na 10 minut na sesję oraz 40 na godzinę na hashowany adres IP. Nie przechowujemy adresów IP wprost. Bez wymaganej migracji endpoint **odmawia analizy** (`usage_guard_unavailable`), ale lokalna dedukcja i postęp gry pozostają dostępne.
5. **Reset Supabase**: jawny `GRANT DELETE` dla `service_role`, także dla istniejących instalacji poprzez migrację 002. Nie usuwa to zapisów i nie resetuje żadnej sesji w chwili wykonywania migracji.
6. **Interfejs**: wyjaśnia, kiedy źródła nie zostały jeszcze zsynchronizowane z serwerem, a kiedy osiągnięto limit analizy AI.

## Wymagane kroki instalacji (kolejność jest ważna)

1. **Supabase → SQL Editor**: uruchom CAŁĄ zawartość `supabase/002_ai_review_limits.sql` tylko raz. SQL jest idempotentny (można go uruchomić ponownie). Nie uruchamiaj ponownie pliku 001, jeśli baza już działa.
2. **Supabase → Data API / Settings**: upewnij się, że nowa funkcja `public.ps_allow_ai_review(uuid,text)` jest udostępniona przez Data API (jeśli Twoja konfiguracja wymaga ręcznego zaznaczenia funkcji). Tabela `public.ps_ai_review_usage` musi mieć dostęp przez rolę `service_role`; NIE udostępniaj jej anonimowym użytkownikom. Funkcja nie powinna być wykonywana przez `anon` ani `authenticated`.
3. **Vercel → prawdziwe-sledztwo-mg15 → Environment Variables**: ustaw `GROQ_MODEL` na `openai/gpt-oss-120b` (zalecane, choć kod automatycznie mapuje starą nazwę). Pozostaw `GROQ_API_KEY`, `ZAI_API_KEY`, `ZAI_MODEL=glm-4.7-flash`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` bez zmian. **Nie wklejaj sekretów do repozytorium**.
4. Rozpakuj ZIP i skopiuj całą jego zawartość do lokalnego folderu repozytorium GitHub Desktop, zastępując pliki. **Commit to main → Push origin**. W Vercel wykonaj redeploy, jeśli nie nastąpi automatycznie.
5. W produkcji sprawdź na osobnej sesji `https://prawdziwe-sledztwo-mg15.vercel.app/?debugAI=1`. Zadaj pytanie świadkowi, sprawdź dostawcę i model. Następnie użyj tablicy dedukcji z zatwierdzonym dokumentem. Nie da się wymusić awarii Z.ai wyłącznie przez zwykły interfejs; pełny test przełączeń wymaga logów albo bezpiecznego środowiska testowego.

## Kontrola po SQL (bez sekretów)

```sql
select to_regprocedure('public.ps_allow_ai_review(uuid,text)') as funkcja,
       has_table_privilege('service_role','public.ps_game_sessions','DELETE') as reset_delete,
       has_function_privilege('service_role','public.ps_allow_ai_review(uuid,text)','EXECUTE') as ai_limit_execute;
```

Powinny pojawić się nazwa funkcji i dwa wyniki `true`.

## Testy lokalne

`npm run build`, `npm run check`, `npm run test:api629`, `npm run test:security-624`, `npm run test:architecture`, `npm run test:progression`, `npm run test:ai-primary`, `npm run test:evidence-quality`, `npm run test:api-memory`.

**Ograniczenie:** symulowane testy nie potwierdzają prawdziwego zużycia API Z.ai, Groq, Cloudflare ani uprawnień rzeczywistego projektu Supabase. Nie zmieniano środowiska produkcyjnego ani kluczy.
