# Test rzeczywistej produkcyjnej ścieżki AI — do wykonania na Vercel Preview

| ID | Pytanie / procedura | Kryterium zaliczenia |
|---|---|---|
| AI-007 | Marek: 24 pytania, wróć do pierwszej wypowiedzi | Cytat dokładnie zgodny z turą 1, bez późniejszych informacji |
| AI-019 | Tomasz: wróć do pierwszej odpowiedzi po 24 turach | Dosłowny, poprawny cytat |
| AI-031 | Janusz: wróć do pierwszej odpowiedzi po 24 turach | Dosłowny, poprawny cytat |
| AI-015 | „Nie pytam o Lenę, tylko gdzie byłeś po północy?” | Odpowiedź o miejscu pobytu, minimum niezbędnych wzmianek o Lenie |
| AI-006 | Zapytaj Marka „Czy mnie okłamujesz?” | Nie wprowadza nieproszonego tematu zabójstwa lub przemocy |
| AI-043 | Wymuś niepotwierdzone twierdzenie, uzyskaj `not_entailed` | Brak pętli ponowień; bezpieczna odpowiedź lub kontrolowany błąd |
| 72 pytania | Cały skrypt testowy z prawdziwym dostawcą | Raport poprawne/ostrzeżenia/błędy/blokady, wywołania na pytanie, p50/p95/max czas |
| 429 | Przeprowadź kontrolowany test realnego limitu, jeśli dozwolony | `Retry-After` i brak natychmiastowego retry |
| Wiele instancji | Równoległe żądania na minimum dwóch instancjach Vercel | Rezerwacje z jednego harmonogramu Supabase |
| Zapis | Odśwież po 24 turach; sprawdź cytat pierwszej | Identyczna kolejność i cytat; brak podwójnego zapisu po retry |

**Status:** to lista *do wykonania*, nie protokół wykonanych testów.
