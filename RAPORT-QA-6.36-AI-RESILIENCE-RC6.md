# Raport QA — 6.36 AI Resilience RC6

## Zakres

Poprawka ogranicza fałszywe odrzucenie wypowiedzi Groq i wydłuża czas pierwszej odpowiedzi Z.ai. Nie usuwa limitów dostawców ani wymagań ochrony faktów.

## Odtworzony problem

- Zatwierdzony fakt Marka: „Nadzorowałem nocną zmianę i byłem dostępny z biura. Nie będę udawał, że siedziałem tam bez przerwy…”.
- Poprawne zdanie: „Nadzorowałem nocną zmianę i byłem dostępny z biura.”
- Stary `hardGuard` odrzucał je, bo w źródle występuje `nie`, chociaż w cytowanym fragmencie nie ma przeczenia. Nowy kod przekazuje tę sytuację do niezależnego audytu semantycznego.

## Wyniki

- Zaliczone: poprawny fragment dopuszczony po audycie; pominięcie istotnego przeczenia odrzucone przez audyt; dopisanie nieznanej godziny odrzucone twardym filtrem.
- Zaliczone: Groq może raz poprawić błędne `factIds` i odrzuconą semantykę; wcześniejsze testy RC5, etapu III i AI Required oraz kompilacja.
- Niezweryfikowane: rzeczywiste czasy Z.ai/Groq, przyczyna konkretnego błędu produkcyjnego, dostępność Supabase i sesji.

## Bezpieczna diagnostyka produkcyjna

W DevTools → Network → `/api/interview` → Response odczytać `fallbackReason` oraz `qualityDiagnostics.attempts` (bez udostępniania ciasteczek, nagłówków Authorization lub kluczy). To pokaże, czy Groq odrzucono za `bad_fact_ids`, `poor_style`, `hard_guard`, `not_relevant`, `not_entailed`, `not_complete` albo inny powód.

## Przed wdrożeniem

1. Potwierdzić migrację Supabase `003` i konfigurację Vercel.
2. Wdrożyć na gałąź Preview, nie `main`.
3. Zweryfikować proste i wielowątkowe pytania do sześciu świadków, długie rozmowy oraz opóźnienia.
4. Dopiero po pozytywnych testach wdrożyć produkcyjnie.
