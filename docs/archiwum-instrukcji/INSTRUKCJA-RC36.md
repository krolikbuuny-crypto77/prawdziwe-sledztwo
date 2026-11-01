# RC36 — odporność na zerwanie połączenia i kopia pokoju

Baza RC35.6 pozostaje bez zmian. RC36 dodaje: automatyczne ponowienie synchronizacji po odzyskaniu internetu, bezpieczne pobieranie zweryfikowanego zapisu pokoju z Supabase oraz automatyczną kopię przed zamknięciem pokoju przez gospodarza. Jeśli serwer nie udostępni zweryfikowanej kopii, pokój nie zostanie zamknięty. Zapis JSON nie zawiera prywatnego czatu.

Po wdrożeniu sprawdź w dwóch oknach: utwórz pokój, przerwij połączenie, wróć online, pobierz Kopię zapisu, zamknij pokój i zaimportuj JSON w trybie solo. Bez nowych tabel SQL.
