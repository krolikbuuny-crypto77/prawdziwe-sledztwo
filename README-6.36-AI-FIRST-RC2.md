# Prawdziwe Śledztwo 6.36 AI First RC2 — korekta relacji z ofiarą

Poprawka jakości przesłuchań na podstawie przykładu: „Kim była dla ciebie ofiara?” → Marek: „Nie wiem, kim była dla mnie ofiara”.

- Wspólny parser `lib/question-intent-633.js` rozpoznaje teraz pytanie o relację i wskazuje ofiarę jako osobę, której dotyczy pytanie.
- `lib/trusted-interview-624.js` dostarcza AI zatwierdzone fakty o Lenie i relacji Marka, zamiast zastępować je pustym opisem. Pozostałym świadkom podaje istniejące wypowiedzi kanoniczne.
- `lib/interview-quality-635.js` odrzuca samopowtarzającą się odpowiedź „nie wiem, kim była ... ofiara” i umożliwia jedną korektę przez ten sam model AI.
- `api/interview.js` przypomina modelom, że „ofiara” w tej sprawie oznacza Lenę Rudnicką, bez tworzenia nowych faktów.
- `tools/test-victim-relationship636.mjs` sprawdza siedem sposobów zadania pytania, sześciu świadków, odrzucenie pustej odpowiedzi i jedną poprawną próbę korekty.

Nadal obowiązuje tryb AI First: Z.ai → Groq → ponowienie pytania, bez ukrytego lokalnego zeznania. Poprawka nie dotyka Supabase ani konfiguracji kluczy.

Wymagane przed publikacją: test prawdziwych rozmów na Vercel Preview. Nie uruchomiono nowych zapytań do rzeczywistych Z.ai ani Groq. Nie zmodyfikowano GitHuba, Vercel ani Supabase.
