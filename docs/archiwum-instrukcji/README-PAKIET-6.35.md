# Prawdziwe Śledztwo — 6.35 (wersja testowa)

## Cel

AI odpowiada na sens oryginalnego pytania i interpretuje zatwierdzone, okazane dowody. Wspólny analizator intencji jest pomocą, nie kolejną warstwą nadpisującą odpowiedzi. Fakty, odblokowania i zatwierdzone sprostowania pozostają w logice gry.

## Nowe zachowanie

1. Dla zwykłych pytań: Z.ai → Groq → lokalny; obie chmury dostają ten sam serwerowo wyznaczony bank faktów i (jeśli jest aktywna) zweryfikowaną historię Supabase.
2. Nowy `lib/interview-quality-635.js` nie klasyfikuje tematów — blokuje powtarzanie niemal identycznego zeznania na inne pytanie i niezgodny rodzaj okazanego dokumentu. Pierwszy błąd jakości daje **jedną** próbę korekty przez bieżący model. Kolejny błąd przełącza na dostawcę rezerwowego.
3. Prezentacja dowodu `presentedEvidenceId` jest przesyłana z klienta na Vercel. Serwer uznaje go **wyłącznie**, gdy identyfikator jest w `approvedEvidence` sesji Supabase i rejestrze kanonicznym. W przeciwnym razie zwraca HTTP 409, bez chmurowej interpretacji dokumentu. Klient pozostawia odpowiedź lokalną.
4. Serwer przekazuje do AI **tytuł, rodzinę i treść wyłącznie zatwierdzonego okazanego dokumentu** (nie nadaje im statusu wiedzy osobistej świadka). Reakcje stanowiące przełom lub autorskie sprostowanie pozostają w lokalnych regułach, nie są parafrazowane przez model.
5. Przed zaakceptowaniem wypowiedzi działa kontrola identyfikatora dokumentu, powtórzeń, zasobu dozwolonych faktów, numerów, negacji i niezależny audyt semantyczny dla nie-dosłownych wypowiedzi. Podczas okazania dokumentu nawet wypowiedź dosłowna przechodzi audyt semantyczny.
6. Budżet sieciowych etapów pojedynczej tury: maksymalnie ok. 21,5 sekundy po stronie Vercel; na kliencie nadal jest timeout 24 sekundy. Korekta jakości ma osobny limit 3,2 s (Z.ai) / 2,5 s (Groq); deadline ogranicza pozostałe wywołania. To **górny limit**, a nie zmierzony czas produkcyjny.

## Testy

```bash
npm run build
npm run check
npm run test:dialogue635
npm run test:unified633
npm run test:priority1
npm run test:api629
npm run test:fast-evidence
npm run test:witnesses
```

`tools/test-cloud-evidence635.py` włącza symulację HTTPS tylko wewnątrz izolowanej przeglądarki i przechwytuje wywołania `/api/interview`; nie kontaktuje się z prawdziwym Vercel ani Supabase.

## Co pozostaje do sprawdzenia

- Rzeczywista jakość dialogów Z.ai/Groq, koszty i opóźnienia produkcyjne.
- Zachowanie przy opóźnieniu synchronizacji zebranego dowodu do Supabase (przy niezatwierdzonym dowodzie działa lokalny fallback).
- Długie, niestandardowe rozmowy dla wszystkich sześciu świadków i pełny katalog 78 materiałów.
- Spójność oceny dedukcji 44/100 z feedbackiem AI (nie wchodzi w zakres tej wersji).

Nie modyfikować produkcji bez wdrożenia do stagingu i sprawdzenia rzeczywistych odpowiedzi z diagnostyką `provider` / `fallbackReason` / `durationMs`.
