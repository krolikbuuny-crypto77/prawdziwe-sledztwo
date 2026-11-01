# Prawdziwe Śledztwo — RC33: rezerwowe modele AI, limit 270 s

## Co zmienia RC33
- Przesłuchania: **10 modeli APINEX → Z.ai GLM 4.7 Flash → lokalny silnik**. Kolejność jest rzeczywista, a nie równoległa: pierwszy zatwierdzony wynik kończy łańcuch.
- APINEX (kolejność): GPT-6 Luna; MiniMax M3.1 Flash; MiMo V2.6 Pro; GLM 5.3 Flash; DeepSeek V4.1 Flash; GLM 5.3 FlashX; Muse Spark 1.3; Gemini 3.8 Flash; DeepSeek V4 Pro (`-0813`); GLM 5.3.
- Limit czasu przesłuchania: **270 sekund na całe żądanie**; maksymalny czas funkcji Vercel: **300 sekund**; limit klienta: **290 sekund**.
- Okno APINEX: do 210 s od początku żądania. Po nim pozostaje do 35 s dla Z.ai i 25 s na rezerwę lokalną/zapis. Każdy model ma ograniczenie czasu: APINEX do 19,5 s, Z.ai do 34 s. Sukces kończy działanie natychmiast.
- Przy 429/braku autoryzacji/wymaganej płatności APINEX pomijane są kolejne modele APINEX, bo korzystają ze wspólnej puli konta. Po dwóch odpowiedziach o niedostępności infrastruktury APINEX również pomijamy pozostałe modele tej usługi.
- Zachowano niezależny audyt semantyczny faktów oraz bramki postępu i dowodów. Modele nie mogą modyfikować Supabase ani werdyktu; nie regenerujemy wypowiedzi tylko za formalny styl.

## Inne funkcje (zapasowy model tylko przy niepowodzeniu)
| Funkcja | Kolejność |
|---|---|
| Analiza dowodów i hipotez | APINEX GLM 5.3 → APINEX DeepSeek V4 Pro → Groq GPT-OSS 120B → Groq Qwen 3.8 27B → Groq GPT-OSS 20B |
| Narracja laboratoryjna | APINEX MiniMax M3.1 Flash → APINEX MiMo V2.6 Pro → Groq GPT-OSS 20B → Groq GPT-OSS 120B |
| Obrona w finale | APINEX Gemini 3.8 Flash → Google Gemini 3.8 Flash → APINEX GLM 5.3 → Groq GPT-OSS 120B → Groq GPT-OSS 20B |
| Postęp, dowody, werdykt | Silnik reguł serwerowych → Supabase (bez decyzji AI) |

## Wymagania przed wdrożeniem
1. Na Vercel **Hobby** upewnij się, że *Fluid Compute jest włączone*. Bez niego funkcje Hobby mogą mieć limit 60 s, niezależnie od `maxDuration:300` w `vercel.json`.
2. W Settings → Environment Variables muszą pozostać serwerowe klucze: `APINEX_API_KEY`, `ZAI_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` (albo `GOOGLE_AI_STUDIO_API_KEY`) oraz istniejące zmienne Supabase. Nie kopiuj kluczy do JS przeglądarki.
3. Użyj **pełnej paczki**, jeśli chcesz zastąpić całą grę, albo małej poprawki jeżeli masz dokładnie RC32. Pliki kopiuj do istniejącego repozytorium, z zachowaniem struktury `api/`, `lib/`, `src/`, `tools/`, `assets/` i `vercel.json`. Nie twórz nowego projektu Vercel.
4. Po wdrożeniu otwórz `/api/status` i sprawdź `release: 6.38-RC33-MULTI-MODEL`, `interviewMaxResponseSeconds:270`. Następnie odśwież stronę Ctrl+Shift+R.
5. Przetestuj „Masz alibi?” i kilka pytań uzupełniających. Dla niedostępnego dostawcy sprawdź serwerowy log `interview-diagnostic` (bez przekazywania sekretów) i czy przełącza się na rezerwę.

## Ograniczenia
- **270 s to sufit, nie planowane opóźnienie.** Przy sukcesie jednego modelu odpowiedź powinna pojawić się od razu. Nie ma gwarancji, że wszystkie 10 modeli zmieszczą się w oknie czasu.
- Modele APINEX mają wspólną pulę limitów. Ich wielość zwiększa odporność na błędy konkretnego modelu, ale nie mnoży darmowej puli konta.
- Modele APINEX i Google/Groq zostały wybrane na podstawie katalogu; odpowiedzi produkcyjne i faktyczna dostępność na kluczach użytkownika nie były testowane. API może odmówić dostępu, np. 401, 404, 429 — router przejdzie dalej.
- Stare testy i dokumenty częściowo opisują poprzednie ścieżki API; najważniejsze nowe testy: `npm run test:rc33` oraz `npm run check`.
- Wersja nie została automatycznie wdrożona na produkcyjnym Vercel ani nie zmienia zapisów Supabase.
