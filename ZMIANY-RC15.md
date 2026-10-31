# RC15 — odpowiedzi świadków i mniejszy kontekst

W kanonie gry to Lena zgłaszała zastrzeżenia dotyczące bezpieczeństwa wagonu. Przykład odpowiedzi Marka odwracający tę czynność był nieprawidłowy.

## Zmiany

- Kontrola odpowiedzi na prośbę o osobowego świadka: sama wzmianka o rejestrach, połączeniach czy „służbach biurowych” nie wystarcza. Odpowiedź powinna wskazać osobę na podstawie faktów albo konkretny brak osobistego potwierdzenia. Kontrola jest wąską regułą pomocniczą; nie zastępuje rozumienia pytania i audytu semantycznego.
- Kontrola przykładu odwrócenia czynności Leny i błędnego rodzaju w opisaniu jej jako „znanego pracownika”. Te kontrole nie obejmują wszystkich możliwych odmian językowych.
- Audyt semantyczny otrzymuje wyraźną instrukcję sprawdzania, kto wykonał czynność i wobec kogo, oraz odróżniania osobowego świadka od dokumentów.
- Doprecyzowane instrukcje poprawy odrzuconej wypowiedzi; nowe przyczyny w logach: `corroboration_nonanswer`, `relationship_actor_reversed`, `victim_gender_mismatch`.
- Przed wysłaniem żądania usuwany jest powtórzony indeks tematów i dokładnie powtórzone fragmenty kontekstu. Pozostają wszystkie fakty z identyfikatorami, cała wysyłana historia rozmowy, sprostowania, wcześniejsze powiązane wątki i granice wiedzy. Nie wprowadzono lokalnego rankingu faktów ani obcinania historii.

Zmniejszony kontekst ogranicza rozmiar żądania, ale nie gwarantuje braku limitów tokenów Groq. Nie zmieniono modelu ani ustawień thinking: Gemini low dla generowania, medium dla audytu; Groq jako rezerwa. Zachowano budżety i diagnostykę RC14.

## Wdrożenie i test

Wgraj całą paczkę, wykonaj Redeploy Vercel i sprawdź `/api/status`: `6.37-DIALOGUE-RC15`. W nowej rozmowie sprawdź „Masz alibi?”, „Kto to potwierdzi?”, „Znałeś ofiarę?”. Przy błędzie skopiuj nowy pełny wpis `interview-diagnostic`.

Dotychczasowe odpowiedzi w zapisanej historii nie są nadpisywane ani automatycznie prostowane. Najczytelniejszy test będzie na nowym zapisie.

Testy automatyczne używają kontrolowanych odpowiedzi dostawców i pełnego HTML w JSDOM. Zaliczenie testów nie potwierdza dostępności produkcyjnych API, ich limitów ani jakości wszystkich przyszłych wypowiedzi. Paczka nie została wdrożona na publiczną stronę.
