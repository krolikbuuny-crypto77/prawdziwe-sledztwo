# Prawdziwe Śledztwo — 6.31: szybsze przesłuchania i ukrywanie dowodów

Pakiet bazuje na **6.30** i zachowuje wszystkie dotychczasowe API, Supabase SQL, fabułę i dokumenty. Nie trzeba zmieniać kluczy ani uruchamiać nowej migracji.

## 1. Krótszy czas odpowiedzi świadków

- Odpowiedź AI, która dosłownie przytacza jeden autoryzowany fakt (bez dopisywania niczego i bez doprecyzowania/pytania złożonego), przechodzi **deterministyczną walidację** bez drugiego wywołania modelu. Nadal musi przejść kontrolę liczb, niepewności, zaprzeczenia, zgodności z pytaniem i braku powtórki.
- Naturalna parafraza, odpowiedź na kilka pytań oraz doprecyzowanie rozmowy **nadal wymagają oddzielnego audytu AI**. Nie skracamy drogi kosztem faktów i werdyktu.
- Limity pojedynczych wywołań: Z.ai do 7,2 s generowanie / 4,5 s audyt; Groq 5,7 s / 4 s. Przeglądarka przechodzi na odpowiedź lokalną po 24 s, jeśli backend nie odpowiedział. To limity maksymalne, nie deklarowany czas odpowiedzi.
- Mniejszy limit generowania Z.ai i kompaktowe żądanie bez zdublowanej historii i listy tych samych faktów; skrócony powtarzający się fragment instrukcji systemowej.
- Pozostaje priorytet Z.ai → Groq → lokalny. Diagnostyka `?debugAI=1` zachowana.

## 2. Dowody podczas przesłuchań

- Lista „Okaż dowód” pokazuje wyłącznie **zebrane** materiały.
- Trzynaście dokumentów dostępnych od początku w **Aktach** nie pojawia się automatycznie na liście okazania. Należy **świadomie otworzyć dokument w Aktach** (kliknąć jego pozycję lub użyć nawigacji czytania), by przygotować go do okazania.
- Dokumenty **zdobyte później** podczas oględzin, poszukiwań i analiz są dostępne do okazania po zdobyciu.
- Pole `reviewedEvidence` jest utrwalane w lokalnym zapisie. Starsze zapisy odtwarzają dokumenty rzeczywiście okazane wcześniej, bez zdradzania nazw pozostałych dokumentów.
- Reset nowego śledztwa czyści listę przygotowanych dokumentów. **Nie zmieniamy** logicznych warunków zdobywania dowodów ani serwerowego rejestru zatwierdzonych materiałów.

## Testy

```bash
npm run build
npm run check
npm run test:fast-evidence
npm run test:priority1
npm run test:api629
```

Testy modelu są symulowane: nie potwierdzają rzeczywistego czasu odpowiedzi na produkcji. Test przeglądarkowy w bieżącym środowisku jest blokowany; sprawdzono składnię, reguły listy dowodów i zapis w testach kodu.

## Wdrożenie

1. Rozpakuj pełny ZIP 6.31 i skopiuj wszystkie pliki do folderu repozytorium GitHub Desktop (bez usuwania `.git`).
2. Commit → Push origin, następnie sprawdź projekt `prawdziwe-sledztwo-mg15` na Vercel.
3. W nowej sesji sprawdź: na początku lista „Okaż dowód” jest pusta; otwarcie dokumentu w Aktach udostępnia go do okazania; znalezienie nowego materiału również udostępnia go do okazania.
4. Zadaj trzy pytania świadkowi z `?debugAI=1` i porównaj `durationMs` na starszej i nowej wersji w podobnych warunkach. Oczekiwanie zależy też od obciążenia API i sieci.
