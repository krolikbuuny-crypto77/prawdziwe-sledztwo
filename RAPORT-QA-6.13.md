# Raport QA — Pakiet 6.13

## Porównanie 6.12 → 6.13, lokalny silnik bez Z.ai

| Grupa pytań | Wersja 6.12: trafiona intencja gdziekolwiek w planie | 6.13 | 6.12: prawidłowa pierwsza intencja | 6.13 |
|---|---:|---:|---:|---:|
| Znanych 360 pytań (regresja) | 360/360 | 360/360 | 324/360 | 324/360 |
| 120 parafraz z poprzedniego audytu (zbiór diagnostyczny) | 48/120 | 114/120 | 42/120 | 96/120 |
| 60 pytań napisanych przed zmianą kodu 6.13 (użytych do projektowania reguł) | 21/60 | 59/60 | 19/60 | 54/60 |

Pełne wypowiedzi: 540 tur, brak pustych odpowiedzi i błędów JS, zero nowo przyznanych dowodów. Zmieniono 89 z 540 odpowiedzi. Liczba różnych tekstów odpowiedzi wyniosła odpowiednio **313 vs 306**. Nie uzyskano więc wzrostu ogólnej różnorodności i nie można twierdzić, że silnik już mówi naturalnie jak człowiek. Część odpowiedzi stała się bardziej trafna, ale część nadal pozostaje powtarzalna. Powyższy zestaw posłużył do dostrajania; wyniki są **testami diagnostycznymi**, nie niezależnym badaniem trafności.

### Przykłady naprawionej trafności

- Na pytanie o zaufanie do własnej pamięci świadek zamiast kierować do dokumentacji wprost dopuszcza pomyłkę pamięci.
- Na pytanie o kwadrans zdarzenia nie wstawia innego wydarzenia, tylko wyjaśnia brak dokładnego czasu.
- Na pytanie o odbiorcę zgłoszenia nie przypisuje nazwiska bez potwierdzenia.
- Na pytanie o przyznanie się do zabójstwa podaje stanowisko wprost; nie odblokowuje formalnej konfrontacji.

### Testy regresyjne — PASS

- Kompilacja 61 sekcji JS / 64 sekcji CSS oraz odtwarzalny produkcyjny `index.html`.
- Integralność wszystkich 75 obrazów WebP i 9 nagrań MP3.
- SaveManager: schemat v2, migracje 1–11, eksport/import/autosave/reset, kontrola integralności.
- WitnessEngine: 24 pytania przez UI, 720 tur silnika, 6 świadków, awaria API i opóźniona odpowiedź, brak przyznawania dowodów.
- ReasoningEngine: niedostępne dowody, dedukcja, 5 wariantów oskarżenia i 6 zarzutów obrony.
- EventBus: 7 zdarzeń, brak zdarzeń fabularnych po samym imporcie.
- Nawigacja: 40 przejść na 320/390/768/1440 px.
- Symulowane API: kontrola niepełnego pokrycia części pytania.

### Niezweryfikowane

- Realna trafność i opóźnienie Z.ai na Vercel.
- Jakość semantyczna na dużym, nowym i nieużytym podczas projektowania zbiorze pytań.
- Długie, niezależnie oceniane rozmowy oraz wszystkie zakończenia pełnej rozgrywki.

**Wniosek:** rozszerzenie wyraźnie zwiększa rozpoznawanie sprawdzonych parafraz, ale nie jest dowodem rozumienia swobodnej polszczyzny na poziomie człowieka. Naturalność i różnorodność wymagają dalszej pracy, najlepiej wraz z pomiarem rzeczywistego Z.ai.
