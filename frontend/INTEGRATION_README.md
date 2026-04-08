# Integracion Frontend-Backend

## Objetivo

Este documento describe como el frontend consume el backend real de SolucionaTech y cuales son los contratos relevantes para autenticacion, tickets, mensajes, uploads y sockets.

## Configuracion

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Si `VITE_SOCKET_URL` no esta definido, el cliente de sockets deriva su origen a partir de `VITE_API_URL`.

## Contrato HTTP

### Respuesta exitosa

```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

### Respuesta con error

```json
{
  "success": false,
  "data": null,
  "message": "Descripcion del error",
  "error": "Descripcion del error"
}
```

## Endpoints clave consumidos por el frontend

### Autenticacion

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

El backend tambien expone `GET /api/auth/profile` como alias de compatibilidad.

### Tickets

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/my-tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id/assign`
- `PATCH /api/tickets/:id/status`
- `PATCH /api/tickets/:id/cancel`
- `PATCH /api/tickets/:id/release`

### Mensajes y archivos

- `GET /api/tickets/:id/messages`
- `POST /api/tickets/:id/messages`
- `POST /api/upload`

## Adaptacion del frontend

Los servicios del frontend usan `apiClient` y luego desempaquetan el contenido de `data`. Cuando el backend mantiene campos legacy por compatibilidad, el frontend resuelve ambos formatos sin cambiar la logica de negocio.

Ejemplos de campos usados por compatibilidad:

- `user`
- `token`
- `ticket`
- `tickets`
- `message`

## Flujo operativo completo

### 1. Cliente crea ticket

- El cliente autenticado envia `title`, `description`, `category` y adjuntos opcionales.
- El backend crea el ticket en `pending`.
- Se emiten eventos operativos para notificar creacion.

### 2. Tecnico asigna ticket

- El tecnico usa `PATCH /api/tickets/:id/assign`.
- El ticket cambia a `assigned`.
- El backend registra un mensaje de sistema y emite eventos de actualizacion.

### 3. Cliente y tecnico ingresan al chat

- El frontend abre la sala con `ticket:join`.
- El backend valida ownership o asignacion antes de permitir la suscripcion.

### 4. Intercambio de mensajes

- El frontend envia `message:send` o `POST /api/tickets/:id/messages`.
- El backend valida estado del ticket y acceso del usuario.
- Los mensajes se emiten mediante `message:new`.

### 5. Resolucion del ticket

- El tecnico asignado mueve el estado a `in_progress` y luego a `resolved`.
- El chat queda bloqueado para nuevos mensajes al cerrarse el ticket.

## Eventos de socket relevantes

### Cliente a servidor

- `ticket:join`
- `ticket:leave`
- `message:send`

### Servidor a cliente

- `message:new`
- `socket:error`
- `ticketAssigned`
- `ticketReleased`
- `ticketCancelled`
- `ticketResolved`
- `ticket:statusUpdated`
- `ticket:new`
- `ticket:assigned`
- `ticket:released`
- `ticket:cancelled`

## Seguridad de integracion

- El token JWT se envia en el handshake de Socket.IO.
- El backend no confia en `senderId` enviado por el cliente.
- El backend valida acceso por `userId`, `client_id`, `technician_id` y estado del ticket.
- El cliente HTTP redirige a login cuando recibe `401`.

## Estados y nombres consistentes

Los nombres usados por frontend y backend deben mantenerse estables:

- `ticketId`
- `userId`
- `client_id`
- `technician_id`
- `pending`
- `assigned`
- `in_progress`
- `resolved`
- `cancelled`
