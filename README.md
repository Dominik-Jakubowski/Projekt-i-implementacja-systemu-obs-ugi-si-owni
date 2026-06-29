# System obsługi siłowni

Aplikacja webowa do planowania treningów i rezerwacji sprzętu siłowni w określonych slotach czasowych. System składa się z frontendu React/Vite, backendu Node.js/Express oraz bazy danych Microsoft SQL Server.

## Wymagania

Do uruchomienia aplikacji wymagane są:

* Node.js,
* npm,
* Microsoft SQL Server,
* utworzona baza danych `gym_reservation`.

## Przygotowanie bazy danych

1. Utworzyć bazę danych o nazwie:

```sql
gym_reservation
```

2. Wykonać skrypt tworzący strukturę bazy:

```text
backend/database/schema.sql
```

3. Wykonać skrypt z danymi startowymi:

```text
backend/database/seed.sql
```

Skrypt `seed.sql` dodaje między innymi role użytkowników, sprzęt, mięśnie, ćwiczenia, sloty czasowe oraz przykładowe plany treningowe.

## Konfiguracja backendu

W katalogu `backend` należy utworzyć plik `.env` z konfiguracją połączenia z bazą danych oraz sekretem JWT.

Przykładowy zakres konfiguracji:

```env
PORT=3000
DB_SERVER=localhost
DB_DATABASE=gym_reservation
DB_USER=sa
DB_PASSWORD=TwojeHaslo
JWT_SECRET=sekretny_klucz_jwt
```

Nazwy zmiennych należy dopasować do konfiguracji użytej w pliku odpowiedzialnym za połączenie z bazą danych.

## Uruchomienie backendu

Przejść do katalogu backendu:

```bash
cd backend
```

Zainstalować zależności:

```bash
npm install
```

Uruchomić backend:

```bash
npm run dev
```

Po uruchomieniu API powinno być dostępne pod adresem:

```text
http://localhost:3000
```

Sprawdzenie działania backendu:

```text
http://localhost:3000/health
```

## Uruchomienie frontendu

W drugim terminalu przejść do katalogu frontendu:

```bash
cd frontend
```

Zainstalować zależności:

```bash
npm install
```

Uruchomić frontend:

```bash
npm run dev
```

Aplikacja frontendowa powinna być dostępna pod adresem:

```text
http://localhost:5173
```

## Testy backendu

Testy integracyjne backendu można uruchomić poleceniem:

```bash
cd backend
npm test
```

Testy wymagają działającej bazy danych SQL Server oraz poprawnie skonfigurowanego pliku `.env`.

## Podstawowy sposób użycia

1. Uruchomić SQL Server i przygotować bazę danych.
2. Uruchomić backend na porcie `3000`.
3. Uruchomić frontend na porcie `5173`.
4. Otworzyć aplikację w przeglądarce.
5. Zalogować się na konto użytkownika lub administratora.
6. Korzystać z planów treningowych, rezerwacji sprzętu oraz panelu administratora.
