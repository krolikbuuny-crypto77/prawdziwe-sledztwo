# Prawdziwe Śledztwo — pakiet 6.30: priorytet 1, inteligencja przesłuchań

Pełna aktualizacja 6.29.1. Nie dodaje zagadek ani nie zmienia fabuły, dowodów, werdyktu lub Supabase SQL.

## Zmiany

1. `lib/question-context-630.js`: serwerowy analizator pełnego pytania. Rozdziela rzeczywiste pod-pytania, rozpoznaje własne alibi, zgłoszenie alarmu, osobistą obserwację, źródło wiedzy, daty i miejsce. Zaprzeczenie typu „nie pytam o Lenę” nie jest osobnym tematem do odpowiedzi.
2. `api/interview.js`: po odrzuceniu klientowych wskazówek faktograficznych odtwarza `questionPlan`, `questionParts` i `dialogueFocus` wyłącznie z pytania gracza oraz zatwierdzonej historii jego sesji Supabase. Przekazuje tę strukturę Z.ai i Groq i uwzględnia ją w audycie semantycznym.
3. `lib/trusted-interview-624.js`: przy pytaniach wielowątkowych umieszcza w serwerowym banku dozwolonych faktów informacje potrzebne do kilku tematów (np. własne alibi oraz zgłoszenie alarmu). Żaden fakt nie pochodzi z notatek lub spreparowanych danych przeglądarki.
4. `api/interview.js`: identyczna długa odpowiedź dla innego pytania lub wyraźnego doprecyzowania jest traktowana jako nieadekwatna i umożliwia przejście do zapasowego dostawcy, zamiast utrwalania ślepej powtórki.
5. `tools/test-interview630.mjs`: testy pytań z negacją, dialogów wielowątkowych, odwołań do wcześniejszego zeznania, odizolowania pamięci offline i rzeczywistej ścieżki API z symulowaną bazą/dostawcami.

## Ważne

- Nie trzeba ponownie wykonywać SQL ani dodawać kluczy w Vercel po 6.29.1.
- Z.ai → Groq → bezpieczna odpowiedź lokalna i zasady Supabase pozostają bez zmian.
- Poprawki poprawiają przygotowanie danych do rzeczywistego modelu i kontrolę wypowiedzi, ale nie gwarantują jakości każdej przyszłej odpowiedzi generatywnej.
- Modelom nigdy nie wolno dopisać faktów, dowodów, alibi ani modyfikować werdyktu.
- Odpowiedź offline jest oznaczana jako niezweryfikowana i nie przechodzi do banku faktów.
- W wersji serwerowej bez skonfigurowanej bazy nie ma zatwierdzonej historii; analizator rozpoznaje wtedy wyłącznie bieżące pytanie.

## Testy

```bash
npm run build
npm run check
npm run test:priority1
npm run test:api629
```

## Wdrożenie

1. Pobierz ZIP i rozpakuj jego zawartość bez dodatkowego folderu nadrzędnego do lokalnego repozytorium GitHub Desktop. Zastąp pliki, **nie usuwaj `.git`**.
2. Sprawdź zmiany, Commit to main i Push origin.
3. Po wdrożeniu Vercel `prawdziwe-sledztwo-mg15`, uruchom śledztwo z `?debugAI=1` w osobnej sesji.
4. Zadaj Markowi serię: „Gdzie byłeś między 01:30 a 02:05?”, „Nie pytam o Lenę, tylko o twoje miejsce pobytu”, „A skąd właściwie to wiesz?”; Tomaszowi: „Kto zgłosił znalezienie Leny i o której godzinie?”
5. Sprawdź `provider`, `model`, `fallbackReason`, `requestId` i spójność zeznań w eksporcie. Zgłaszaj niezgodne wypowiedzi z datą i ukrytym identyfikatorem sesji.
