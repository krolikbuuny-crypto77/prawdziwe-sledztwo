# RC57.10.2 — korekta oceny przesłuchań przed wdrożeniem

**Podstawa:** pełna paczka RC57.10.1. Nie trzeba osobno instalować wcześniejszych RC, jeśli wybierzesz pełną RC57.10.2.

## Instalacja

1. Jeśli masz RC57.10.1, rozpakuj `Prawdziwe_Sledztwo_RC57_10_2_POPRAWKA_DO_RC57_10_1.zip` i skopiuj zawartość do katalogu projektu, zachowując strukturę `lib/`, `tools/` i plik `package.json`.
2. Jeśli na GitHub nie ma jeszcze RC57.10.1, zastosuj **pełną** paczkę RC57.10.2. Nie nakładaj poprawki do RC57.10.1 bez tej wersji bazowej.
3. Wdróż najpierw na Vercel Preview, sprawdź `/admin/testy` i eksport JSON (release powinien zawierać `RC57.10.2-live`).
4. Uruchom krótki test 18 pytań na Luna i osobno na Jev. Sprawdź co najmniej Marka AI-002, Elżbietę AI-012 i Magdalenę AI-018. Nie uruchamiaj testów równolegle; obie trasy korzystają z jednego konta Apinex.
5. Nie trzeba dodawać ani usuwać tabel Supabase, modyfikować zapisów graczy ani zmieniać kluczy API. Zachowano limit 12 funkcji Vercel Hobby.

## Zmiany

- `self_order_contradiction`: nie jest już zgłaszana, gdy świadek pamięta początkowe miejsce, ale nie odtwarza dokładnej kolejności późniejszych wyjść co do minuty.
- `location_evasion`: pytanie „gdzie?” nie jest zaliczane jako w pełni zaadresowane tylko dlatego, że świadek zaprzeczył obecności w jednym miejscu.
- `session_as_location`: dodatkowe ostrzeżenie, gdy Magdalena opisuje fizyczną obecność przy stanowisku w oparciu o sesję audytową; jest to sygnał do ręcznej weryfikacji, a nie automatyczne stwierdzenie fałszu.
- `self_location_observation`: wykrywanie nielogicznego odwołania do „własnej obserwacji” przy opisie własnego miejsca pobytu.
- `memory_answer_without_referent`: wykrywanie niejasnego „tego” w odpowiedzi na pytanie o własną pamięć.
- `near_repetition`: mniejsza liczba fałszywych alarmów, gdy kolejne pytanie dotyczy nowego przedziału czasu.
- Dodatkowe wskazówki do generowania naturalnych, spójnych odpowiedzi, bez tworzenia faktów, godzin czy alibi.

## Granice

To wąska poprawka heurystyk i instrukcji AI. Wskazanie `pass` nie stanowi dowodu naturalności, a `warning` nie dowodzi kłamstwa świadka. Prawdziwy model Apinex może nadal odpowiedzieć niepoprawnie. Nowe zachowanie generacyjne należy potwierdzić po wdrożeniu Preview. Aktualizacja nie uruchamia migracji SQL ani nie zmienia kanonu, dowodów, reguł odblokowań lub końcowego werdyktu.
