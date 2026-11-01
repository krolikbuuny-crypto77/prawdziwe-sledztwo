# Prawdziwe Śledztwo — 6.37 Gemini 3.8 Roles RC8

## Podział AI

| Miejsce w grze | API | Model | Rola |
|---|---|---|---|
| Przesłuchania i mimika | Google AI Studio | `gemini-3.8-flash`, thinking `low` (audyt `medium`) | Rozumienie pytań, dialog, emocja do portretu SVG |
| Tablica dedukcyjna | OpenRouter | `deepseek/deepseek-r1:free` → `deepseek/deepseek-chat:free` | Pomocnicza ocena hipotez na podstawie odblokowanych akt |
| Laboratorium i dziennik | Cerebras | `llama-4-scout-17b-16e-instruct` **tylko jeśli dostępny na koncie** | Opisy z udostępnionych, zatwierdzonych dokumentów |
| Obrona / finał | Google AI Studio | `gemini-3.8-flash`, thinking `high` | 6 zastrzeżeń obrony do złożonego aktu |

## Co jest, a czego nie gwarantuje RC8

- Modele są wywoływane tylko po stronie Vercel; żaden klucz nie trafia do przeglądarki.
- Z.ai i Groq nie są już główną trasą przesłuchań. Nie ma lokalnego fallbacku generującego swobodne zeznania.
- System nie pozwala AI samodzielnie zatwierdzać dowodów, rozstrzygnięcia, przełomów, wyników pomiarów ani aktualizować zapisów gry poza zatwierdzonymi turami.
- Sekrety, których nie odblokowano w grze, **nie** są przekazywane do promptu AI. Duże okno kontekstowe nie jest argumentem za ujawnianiem ukrytej fabuły.
- Wersja zawiera poprawkę błędnego odczytu JSON z OpenRouter (wcześniejszy kontrakt Cloudflare).
- Cerebras Llama 4 Scout była dostępna historycznie, lecz nie jest potwierdzona w ofercie self-serve na październik 2026. Adapter sprawdza `GET /v1/models` i odmawia działania, jeśli model nie jest dostępny dla danego klucza. **Nie podmienia** jej po cichu na inny model. Jeśli konto nie udostępnia Llama 4, teksty laboratorium z AI nie będą dostępne, ale podstawowa logika śledztwa pozostaje zachowana.
- Dokładny limit tokenów na dzień / liczbę zapytań można potwierdzić wyłącznie w ustawieniach danego konta i usługi; żaden publiczny benchmark prędkości nie jest dowodem na większy dzienny limit.
- Darmowe warianty OpenRouter mają limity. Sam identyfikator `:free` nie gwarantuje stałej dostępności.
- Nie wykonano prawdziwych zapytań z Twoimi kluczami do Gemini, OpenRouter ani Cerebras. Testy używają symulowanych odpowiedzi.

## Wdrożenie do Vercel

1. Prześlij zawartość ZIP do repozytorium w tej samej strukturze katalogów (pliki `api/*`, `lib/*`, `src/*` oraz wygenerowany `index.html`). Nie przesyłaj własnych sekretów do GitHuba.
2. W **Vercel → Project → Settings → Environment Variables** dodaj klucze i modele (Production, a jeśli testujesz na Preview także Preview):

```text
GEMINI_API_KEY=...               # sekret, tylko Vercel
GEMINI_INTERVIEW_MODEL=gemini-3.8-flash
GEMINI_DEFENSE_MODEL=gemini-3.8-flash
OPENROUTER_API_KEY=...           # sekret
OPENROUTER_MODEL=deepseek/deepseek-r1:free
OPENROUTER_BACKUP_MODEL=deepseek/deepseek-chat:free
CEREBRAS_API_KEY=...             # sekret
CEREBRAS_MODEL=llama-4-scout-17b-16e-instruct
```

3. Zachowaj wcześniejsze `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET` i prawidłowe migracje 001, 002, 003. Nie trzeba ponownie wykonywać SQL tylko z powodu zmiany modeli.
4. **Sprawdź dostępne modele Cerebras** poleceniem wykonywanym lokalnie, nie wysyłając klucza do czatu:

```bash
curl https://api.cerebras.ai/v1/models -H "Authorization: Bearer $CEREBRAS_API_KEY"
```

   Wyszukaj `llama-4-scout-17b-16e-instruct` w `data[].id`. Jeśli jej nie ma, skontaktuj się z Cerebras lub skonfiguruj inną dostępną Llama 4 z większym **potwierdzonym dla konta** limitem dziennym. Wybieranie modelu spoza listy doprowadzi do komunikatu `cerebras_llama4_not_available`.
5. Wykonaj nowe wdrożenie (Redeploy) i przetestuj `/api/status`, pytanie świadka, tablicę dedukcyjną, notatkę z laboratorium oraz sześć zarzutów po złożeniu aktu oskarżenia.
6. W razie błędów prześlij tylko bezpieczne pola diagnostyczne `error`, `reason`, `fallbackReason`, `qualityDiagnostics`, bez kluczy API, nagłówków Authorization i ciasteczek.

## Wyniki kontroli lokalnej

- `node tools/test-gemini38-rc8.mjs` — umowy API, thinking `low/high`, JSON, Llama 4 tylko po sprawdzeniu dostępności.
- `node tools/test-specialized-rc7.mjs` — serwerowa kontrola akt w trzech dodatkowych trasach i sześć zarzutów obrony.
- `npm run build` i `npm run check` — spójność interfejsu, skrypty, zasoby.
- `python tools/test-navigation.py` — nawigacja 320/390/768/1440 px.
- `python tools/test-saves.py` — zapis, przywrócenie, import/eksport i migracje.

**Produkcja:** nie wdrożona w ramach tego pakietu. **Prawdziwe modele/API:** nie przetestowane z kontem użytkownika.
