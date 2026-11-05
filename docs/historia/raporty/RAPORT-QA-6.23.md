# Raport QA — Pakiet 6.23

Wszystkie wymienione próby odbyły się **lokalnie**, na kodzie bazującym na Pakiecie 6.22. Żadna nie wykonała prawdziwego połączenia z Z.ai, Groq, Supabase lub Cloudflare.

| Test | Wynik | Potwierdzony zakres |
|---|---|---|
| `npm run build` | PASS | Wygenerowany HTML, 61 sekcji JS i 64 CSS |
| `npm run check` | PASS | 75 WebP, 9 MP3, hooki, struktura, integralność |
| `npm run test:natural-dialogue` | PASS | Sześć różnych profili; odrzucenie biurokratycznej wypowiedzi; przełączenie Z.ai → Groq; akceptacja naturalnego Z.ai; bezpieczny fallback; jednakowy bank faktów; blokada nowej godziny 03:20 i przyzwolenie na pominięcie nieistotnej godziny |
| `npm run test:architecture` | PASS | Symulacja dostawców, sesja Supabase, stan i kolejka offline |
| `npm run test:progression` | PASS | Serwerowe reguły postępu, sfałszowane werdykty i dowody odrzucone |
| `npm run test:ai-primary` | PASS | Tryb AI-first, kontrola błędów i nieaktualnych odpowiedzi w kliencie |
| `npm run test:witnesses` | PASS | 720 tur, 6 świadków, zapis pamięci, brak fałszywych przyznań, awaria API |
| `npm run test:dialogue` | PASS | 1200 tur mieszanych, 6 świadków, brak samowolnego odblokowania materiałów |
| `npm run test:faces` | PASS | Sześć portretów, osiem przełomów i finał, 320/390/768/1440 px |
| `npm run test:saves` | Wyniki asercji PASS, brak pewnego kodu zakończenia całego procesu | W logu potwierdzono 11 migracji, import, eksport, autosave, reset, ochronę checksum; zbiorcze wykonanie przekroczyło limit środowiska |
| `npm run test:cinematic` | NIEPOTWIERDZONE w tej sesji | Testy z 6.22 są dostępne, ale bieżące zbiorcze wykonanie nie ukończyło się w limicie |

## Ważne rozgraniczenia

**Nie przedstawiam testów opartych na mockach ani heurystykach jako dowodu naturalności rozmów.** Testy potwierdzają działanie mechanizmu wyboru modeli i wykrywanie wybranych, sztucznych konstrukcji. Nie dowodzą, że każde pytanie w naturalnej polszczyźnie zostanie trafnie zrozumiane lub że odpowiedź z API zawsze zabrzmi wiarygodnie.

Brak ludzkiego panelu jakościowego i prawdziwych kosztów/opóźnień Z.ai oraz Groq. Gdy oba modele zostaną odrzucone, lokalny silnik nadal może zwrócić formułkową odpowiedź. Świadomie nie obchodzę wówczas kanonu tylko po to, żeby dialog brzmiał swobodniej.

## Rekomendowana kontrola produkcyjna

Na Vercel Preview (z rzeczywistymi kluczami po stronie serwera) przetestować krótkie pytania, półzdania, kontradykcje, zaprzeczenia, wielowątkowe konfrontacje, fragmenty długiej rozmowy oraz pytania o T-17 i alibi Magdaleny. Ręcznie oceniać zgodność z kanonem, trafność, naturalność, długość, powtarzalność i rozróżnienie wiedzy od przypuszczenia. Dopiero po tej ocenie można deklarować poprawę naturalności odpowiedzi rzeczywistych modeli.
