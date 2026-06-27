# Instrukcja użytkownika

## Informacje ogólne

Aplikacja służy do obsługi treningów na siłowni. Użytkownik może korzystać z planów treningowych, rezerwować sesje, sprawdzać dostępność sprzętu i korzystać z timera. Administrator ma dodatkowy panel do zarządzania użytkownikami, sprzętem i rezerwacjami.

Etykiety widoczne w interfejsie powinny być prezentowane po polsku, np. `początkujący` zamiast `beginner` oraz `ćwiczenie siłowe` albo `siłowe` zamiast `strength`.

## Logowanie

1. Otworzyć frontend pod adresem `http://localhost:5173`.
2. Wpisać e-mail i hasło.
3. Kliknąć `Zaloguj`.

Po poprawnym logowaniu aplikacja zapisuje:

- token JWT,
- dane użytkownika,
- informację, czy wymagana jest zmiana hasła.

## Wymuszona zmiana hasła

Jeżeli konto zostało utworzone przez administratora, użytkownik otrzymuje hasło tymczasowe. Po pierwszym logowaniu system wyświetla ekran zmiany hasła.

1. Wpisać nowe hasło.
2. Powtórzyć nowe hasło.
3. Zatwierdzić formularz.

Nowe hasło musi mieć co najmniej 8 znaków. Po zmianie hasła aplikacja przechodzi do panelu użytkownika.

## Menu kafelkowe użytkownika

Po zalogowaniu widoczne jest menu kafelkowe:

- `Moje plany`,
- `Proponowane plany`,
- `Kreator planu`,
- `Moje sesje`.

Dla użytkownika z rolą `admin` widoczne są także kafelki administracyjne:

- `Panel administratora` / `Admin: użytkownicy` - zarządzanie użytkownikami,
- `Admin: sprzęt`,
- `Admin: rezerwacje`.

## Proponowane plany

Widok `Proponowane plany` pokazuje szablony treningowe przygotowane w systemie.

Użytkownik może:

1. przejrzeć nazwę, opis, cel, poziom i szacowany czas planu,
2. kliknąć `Skopiuj do moich planów`,
3. przejść do widoku `Moje plany`, gdzie kopia jest dostępna jako prywatny plan.

## Kreator planu

Widok `Kreator planu` pozwala utworzyć własny plan.

Proces:

1. Wpisać nazwę planu.
2. Uzupełnić opis.
3. Wybrać typ treningu.
4. Wybrać poziom trudności.
5. Wybrać ćwiczenie z listy.
6. Kliknąć `Dodaj ćwiczenie`.
7. Opcjonalnie dopisać notatkę.
8. Dodać kolejne ćwiczenia.
9. Kliknąć `Utwórz własny plan`.

Frontend pobiera szczegóły ćwiczenia z API i wybiera domyślne urządzenie przypisane do ćwiczenia. Jeżeli ćwiczenie nie ma sprzętu, aplikacja pokazuje błąd.

## Moje plany

Widok `Moje plany` służy do sprawdzania dostępności i rezerwowania sesji.

1. Wybrać datę w kalendarzu.
2. Wybrać godzinę rozpoczęcia. Frontend pokazuje godziny co 15 minut od 08:00 do 21:45.
3. Przy planie kliknąć `Sprawdź dostępność`.

System pokazuje podgląd:

- czas planowanej sesji,
- kolejne ćwiczenia,
- wymagany sprzęt,
- dostępność sprzętu,
- powód niedostępności,
- proponowane zamienniki.

Jeżeli oryginalny plan jest dostępny, użytkownik może kliknąć `Zarezerwuj`.

Jeżeli sprzęt jest zajęty, system może zaproponować skorygowany plan. Po kliknięciu `Zatwierdź skorygowany plan` backend tworzy techniczny plan z zamiennikami i rezerwuje sesję.

Jeżeli zmian jest zbyt dużo, aplikacja pokazuje propozycje alternatywnych terminów. Po wybraniu terminu użytkownik powinien ponownie sprawdzić dostępność.

## Moje sesje

Widok `Moje sesje` pokazuje zaplanowane sesje użytkownika.

Użytkownik może:

- otworzyć sesję,
- odwołać sesję o statusie `scheduled`.

Odwołanie sesji wymaga potwierdzenia. Po odwołaniu backend ustawia status sesji na `cancelled` i anuluje aktywne rezerwacje powiązane z sesją.

## Timer sesji

Timer jest widoczny po otwarciu sesji.

Ekran pokazuje:

- nazwę planu,
- status sesji,
- cel treningu,
- datę i godziny rezerwacji,
- aktywne ćwiczenie,
- sprzęt,
- zarezerwowany czas stanowiska,
- aktualną fazę,
- pozostały czas,
- następne ćwiczenie,
- harmonogram sesji.

Dla ćwiczeń cardio timer pokazuje czas ćwiczenia oraz przerwę/przejście. Dla ćwiczeń siłowych pokazuje serie i przerwy po seriach.

Timer działa po stronie frontendu i odświeża się co sekundę na podstawie aktualnego czasu przeglądarki.

## Panel administratora - użytkownicy

Widok jest dostępny tylko dla roli `admin`.

Administrator może:

- wyświetlić listę użytkowników,
- sprawdzić rolę, status i informację o wymaganej zmianie hasła,
- dodać użytkownika,
- wybrać rolę `user` albo `admin`,
- otrzymać wygenerowane hasło tymczasowe,
- dezaktywować użytkownika.

Konto utworzone przez administratora otrzymuje `MustChangePassword = 1`, dlatego po pierwszym logowaniu użytkownik musi ustawić własne hasło.

Dezaktywacja ustawia `Users.IsActive = 0`. Konto nie jest usuwane fizycznie.

## Panel administratora - sprzęt

Widok jest dostępny tylko dla roli `admin`.

Administrator może:

- wyświetlić listę urządzeń,
- zmienić liczbę egzemplarzy w polu `Quantity`,
- aktywować albo dezaktywować urządzenie przez `IsActive`,
- dodać pełne urządzenie z mięśniami i ćwiczeniami.

Dezaktywacja sprzętu jest logiczna i nie usuwa historii rezerwacji.

## Dodawanie pełnego urządzenia

Administrator dodaje pełne urządzenie w jednym formularzu:

1. Wprowadza dane urządzenia:
   - nazwę,
   - opis,
   - liczbę egzemplarzy,
   - kategorię.
2. Dodaje mięśnie powiązane z urządzeniem:
   - mięsień,
   - rolę,
   - poziom aktywacji,
   - opcjonalną notatkę.
3. Dodaje ćwiczenie dla urządzenia:
   - nazwę,
   - opis,
   - typ ćwiczenia,
   - tryb timera,
   - domyślne serie, powtórzenia, czas i przerwy,
   - poziom trudności.
4. Zapisuje całość przyciskiem `Dodaj nowe urządzenie`.

Backend zapisuje całość transakcyjnie do tabel:

- `Equipment`,
- `EquipmentMuscles`,
- `Exercises`,
- `EquipmentExercises`,
- `ExerciseMuscles`.

Jeżeli którykolwiek etap się nie powiedzie, transakcja zostaje wycofana.

## Panel administratora - rezerwacje

Widok jest dostępny tylko dla roli `admin`.

Administrator może:

- wyświetlić rezerwacje wszystkich użytkowników,
- filtrować rezerwacje po statusie,
- odświeżyć listę.

Widok pokazuje m.in. użytkownika, e-mail, sprzęt, termin i status rezerwacji.

## Aktualny zakres funkcjonalny systemu

Aktualny frontend obejmuje ekran logowania, ekran wymuszonej zmiany hasła, menu użytkownika, obsługę planów, rezerwacji, sesji i timera oraz trzy widoki administracyjne. Zakres administratora obejmuje użytkowników, sprzęt i podgląd rezerwacji, ale nie obejmuje edycji wszystkich pól użytkownika ani fizycznego usuwania danych.
