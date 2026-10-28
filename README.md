# Prawdziwe Śledztwo — integracja API przez Vercel

**Ważne:** ten katalog nie zawiera prawdziwych kluczy. Wszystkie klucze dodajesz wyłącznie w panelu Vercel.

## Co jest podłączone

- `index.html`: ostatnia wersja gry po naprawach P1 i P2 (oryginalne grafiki i audio).
- `/api/interview`: **Z.ai GLM-4.7-Flash**, tylko przesłuchania. Lokalna odpowiedź nadal kontroluje wiedzę i stan świadka; Z.ai nadaje jej bardziej naturalną formę. Gdy API jest niedostępne, zostaje odpowiedź lokalna.
- `/api/evaluate`: **Cloudflare Workers AI / @cf/qwen/qwen3-30b-a3b-fp8**, tylko dodatkowa, opisowa ocena hipotez i powiązanych materiałów w sekcji **Dedukcja → Sprawdź argumentację**. Lokalna walidacja nadal decyduje, czy etap można zaliczyć. To celowe: AI nie może przyznać dowodu ani zdradzić rozwiązania.
- `/api/status`: pokazuje, czy obie konfiguracje zostały znalezione; nie wyświetla kluczy.

**Zakres:** pierwsza integracja oceny AI obejmuje kontrolę argumentacji w Dedukcji. Pozostałe mechanizmy oceny osi czasu, minigier i końcowego aktu pozostają na tym etapie lokalne — można je podłączyć do tego samego endpointu później bez trzeciego AI.

## Krok 1. GitHub

1. Otwórz repozytorium gry na GitHubie.
2. Wgraj pliki z tego katalogu do głównego katalogu repozytorium, zachowując ścieżki `api/...` i `lib/...`.
3. Jeśli repo zawiera już `index.html`, utwórz kopię zapasową poprzedniej wersji, potem zastąp ją nową.
4. Nie wgrywaj `.env` ani żadnych prawdziwych kluczy.
5. Zatwierdź zmiany (Commit).

Możesz też utworzyć nowy projekt GitHub z tymi plikami i podłączyć go do Vercel. Plik `package.json` nie ma zewnętrznych zależności.

## Krok 2. Vercel

1. Zaloguj się do `https://vercel.com/dashboard`.
2. Jeśli gra nie jest jeszcze na Vercel: **Add New → Project → Import Git Repository**, wybierz repo, jako Framework Preset ustaw **Other** i pozostaw Root Directory na `./`.
3. W istniejącym projekcie wybierz **Settings → Environment Variables** i dodaj:

| Name | Value |
| --- | --- |
| `ZAI_API_KEY` | Twój klucz Z.ai (model API, nie Coding Plan) |
| `CLOUDFLARE_API_TOKEN` | Twój token Workers AI |
| `CLOUDFLARE_ACCOUNT_ID` | Identyfikator konta Cloudflare |

4. Zaznacz **Production** (oraz **Preview**, jeśli chcesz testować podglądy).
5. Kliknij **Save** i wykonaj nowy deployment (**Redeploy** albo nowy commit).

## Krok 3. Test bez udostępniania kluczy

1. Otwórz `https://TWOJ-PROJEKT.vercel.app/api/status`.
2. Sprawdź `interviewConfigured: true` i `evaluationConfigured: true`. To potwierdza obecność zmiennych, **nie** poprawność kluczy.
3. Otwórz grę na tej samej domenie. Zadaj pytanie świadkowi; gdy Z.ai działa, poprawi naturalność odpowiedzi. Gdy nie — gra pokaże lokalną odpowiedź.
4. Przejdź do **Dedukcji**, wybierz posiadany dokument i użyj **Sprawdź argumentację**. Pod lokalną analizą pojawi się pomocnicza opinia drugiego AI.
5. Jeśli pojawi się informacja o niedostępnym API, sprawdź logi Functions na Vercel oraz panel zużycia odpowiedniego dostawcy.

## Krok 4. Ochrona darmowych limitów

- Z.ai podaje model `glm-4.7-flash` jako darmowy, lecz może ograniczać przepustowość.
- Cloudflare Workers AI Free: **10 000 neuronów dziennie**. Po przekroczeniu limitu zapytania nie są obsługiwane.
- W Vercel Firewall skonfiguruj ograniczenie liczby żądań dla ścieżki `/api/` (oba modele); darmowy plan Hobby ma ograniczoną liczbę reguł oraz własne limity. Sprawdź ewentualne opłaty za korzystanie z WAF.
- Na początek możesz użyć np. 10–20 żądań na minutę na IP. Dobierz wartości na podstawie prawdziwego ruchu.
- Nie można zabezpieczyć publicznych endpointów wyłącznie ukryciem kluczy. Bez WAF lub innego trwałego ograniczania żądań użytkownik może wielokrotnie wywoływać API.
- Gra wymaga jeszcze testów na docelowej domenie i urządzeniach mobilnych przed ogłoszeniem premiery.

## Ważne ograniczenia

- Dostęp z samego pliku `file://` uruchamia **lokalny** silnik gry, bez obu API. Testuj pod adresem Vercel.
- Z.ai otrzymuje fakty z lokalnie wygenerowanej wypowiedzi i jedynie ją naturalizuje. Takie podejście zmniejsza ryzyko sprzeczności fabularnych, ale nie daje pełnej autonomii świadka.
- Opinia Cloudflare jest **pomocnicza**. Nie przyznaje punktów/zdobytych dowodów i nie odblokowuje finału — zostają do tego istniejące reguły.
- Dane przesyłane w API to treść pytania i fragmenty rozmowy oraz, w ocenie, tylko materiały wybrane przez gracza. Ogranicz to w polityce prywatności gry.
- W Vercel Hobby obowiązują zasady używania do celów osobistych i niekomercyjnych. Publiczna gra bez reklam i monetyzacji może wpisywać się w niekomercyjny charakter, ale sprawdź aktualne warunki przed publikacją.

Dokumentacja: `https://docs.z.ai/api-reference/llm/chat-completion`, `https://developers.cloudflare.com/workers-ai/get-started/rest-api/`, `https://vercel.com/docs/environment-variables`.
