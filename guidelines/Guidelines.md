# Lineamientos del Proyecto

## Objetivo

Establecer criterios tecnicos y de documentacion consistentes para el mantenimiento del repositorio.

## Convenciones de dominio

- Usar `ticketId` y `userId` para referencias camelCase.
- Mantener `client_id` y `technician_id` cuando se replica el contrato del backend.
- Los estados validos del ticket son `pending`, `assigned`, `in_progress`, `resolved` y `cancelled`.
- La categoria del ticket debe usar `general`, `hardware`, `software` o `network`.

## Convenciones de backend

- No cambiar el contrato `success`, `data`, `message` sin una migracion explicita.
- No eliminar endpoints de compatibilidad sin coordinar la migracion del frontend.
- Los controladores deben conservar responsabilidades de request/response.
- Las reglas de acceso deben mantenerse alineadas entre HTTP y sockets.

## Convenciones de frontend

- Centralizar consumo HTTP en `services/`.
- Mantener estado compartido en `context/` y extraer logica reutilizable a `hooks/`.
- Evitar duplicacion de logica de tickets, mensajes y no leidos.
- Preservar compatibilidad con los nombres de campos actualmente usados por backend.

## Documentacion

- Toda documentacion debe reflejar el estado real del sistema.
- Evitar ejemplos con campos eliminados, especialmente `priority`.
- Usar un lenguaje tecnico, formal y consistente.
