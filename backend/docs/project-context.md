# Kontekst projektu

Temat pracy:
Projekt i implementacja systemu obsługi siłowni.

Cel systemu:
Backendowy system REST API umożliwiający rezerwację urządzeń siłowni w slotach czasowych.

Technologie:
- Node.js
- Express.js
- Microsoft SQL Server
- JWT
- JSON REST API

Zakres MVP:
- rejestracja i logowanie użytkownika,
- role: użytkownik i administrator,
- zarządzanie urządzeniami siłowni,
- zarządzanie slotami czasowymi,
- tworzenie rezerwacji,
- anulowanie własnej rezerwacji,
- kontrola kolizji rezerwacji,
- opcjonalnie: alternatywne urządzenia.

Główne tabele:
- Roles
- Users
- Equipment
- TimeSlots
- Reservations
- EquipmentAlternatives

Najważniejsza zasada biznesowa:
System nie może pozwolić na utworzenie większej liczby aktywnych rezerwacji dla danego urządzenia, daty i slotu niż liczba dostępnych egzemplarzy urządzenia.

Jeżeli limit został osiągnięty, API powinno zwrócić 409 Conflict.