# RAPORT QA — PRAWDZIWE ŚLEDZTWO 6.26

## Zakres zmian

Naprawiono pięć usterek wykrytych w sesji produkcyjnej: niespójna pamięć, alibi Marka, zgłoszenie Tomasza, fałszywy komunikat wielu kart oraz błędna odmiana liczników. Dodatkowo dodano niesekretną diagnostykę dostawcy odpowiedzi.

## Zweryfikowane testy lokalne

- Kompilacja 61 segmentów JS i 64 segmentów CSS oraz kontrola sum kontrolnych 75 WebP i 9 MP3: PASS.
- Integralność zasadniczych kontrolerów, hooków, manifestu i autorytatywnego kanonu: PASS.
- 6 świadków, 24 rozmowy przez kliknięcie / Enter i 720 tur obciążeniowych: PASS (zestaw `test-witnesses.py`).
- Pamięć 6.8: 90+ tur, limity, anchor alibi, import/eksport: PASS.
- Test 6.26 w Chromium: dwa pytania o alibi Marka, dwa pytania alarmowe Tomasza, odmiana, załadowanie stanu, brak odblokowania dowodów: PASS.
- Symulowane zakończenie odpowiedzi AI: `dialogues == ps67.approved == ps68.episodes` dla tej samej tury; oryginalny kanon zachowany: PASS.
- Symulowana odpowiedź AI poza tematem odrzucona, a rejestry pozostają spójne: PASS.
- Serwerowa klasyfikacja alibi i zgłoszenia, wyłącznie z dopuszczonego kanonu: PASS.
- Testy 6.24 Z.ai → Groq na atrapach, odporność na fałszywe przyznanie się i wyciek sekretów: PASS.
- Testy Supabase i werdyktu 6.17/6.18 z atrapami (51 przypadków): PASS.

## Co wymaga potwierdzenia na żywym Vercel

- Rzeczywiste odpowiedzi Z.ai i Groq z Twoich kluczy i ich limitów.
- Faktyczny zapis w Supabase po pełnej turze przesłuchania i ponownym zalogowaniu.
- Sytuacja różnych otwartych kart i duplikacji karty przez przeglądarkę (nie testowano na produkcji).

Nie modyfikowano produkcyjnego GitHub, Vercel, konfiguracji SQL ani tokenów. Żadnych kluczy produkcyjnych nie ma w archiwum.
