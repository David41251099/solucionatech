# Servicios e Integracion API

## Proposito

Este documento resume el papel de los servicios del frontend en la integracion con el backend.

## Servicios principales

### `auth.service.ts`

- `login`
- `register`
- `fetchCurrentUser`
- `logout`

### `ticket.service.ts`

- `createTicket`
- `getTickets`
- `getMyTickets`
- `getTicketById`
- `assignTicket`
- `updateTicketStatus`
- `getTicketMessages`
- `sendTicketMessage`
- `createTicketWithAttachments`
- `sendMessageWithAttachment`
- `cancelTicket`
- `releaseTicket`

## Cliente HTTP base

`src/utils/api.ts` encapsula:

- URL base del backend
- adjuncion automatica del token
- manejo centralizado de errores
- redireccion a login ante `401`

## Convenciones de datos

- El frontend prioriza `response.data`.
- Si el backend expone campos legacy, los servicios preservan compatibilidad temporal.
- Los identificadores deben manejarse como `string`.

## Integracion con sockets

El servicio `src/services/socket.ts` reutiliza el token actual para autenticar la conexion y publica una instancia unica del cliente Socket.IO.
