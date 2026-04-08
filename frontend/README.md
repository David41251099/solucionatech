# SolucionaTech Frontend

## Proposito

El frontend implementa la interfaz del sistema de soporte tecnico. Provee autenticacion, dashboards por rol, gestion visual de tickets, chat en tiempo real, indicadores de no leidos y navegacion hacia guias de auto-diagnostico.

## Estructura principal

```text
frontend/
|-- src/
|   |-- app/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   |-- pages/
|   |-- services/
|   |-- socket/
|   |-- types/
|   `-- utils/
|-- README.md
|-- INTEGRATION_README.md
`-- MIGRATION_GUIDE.md
```

## Organizacion funcional

### Pages

Las paginas definen la navegacion principal:

- `LandingPage`
- `Login`
- `Register`
- `Guides`
- `ClientDashboard`
- `TechDashboard`
- `TicketList`
- `TicketDetail`
- `TicketChatPage`
- `CreateTicket`

### Components

Los componentes encapsulan UI reutilizable y elementos especializados de tickets, chat, autenticacion, dashboard y elementos base.

### Context y hooks

- `AuthContext`: mantiene `user`, `token`, restauracion de sesion, login, registro y logout.
- `ChatContext`: coordina tickets visibles en chat, mensajes, salas Socket.IO y conteos no leidos.
- `useAuth`, `useSocketStatus`, `useTicketConversation`: exponen logica reutilizable sin duplicarla en componentes.

### Services

- `auth.service.ts`: login, registro, perfil actual y persistencia local.
- `ticket.service.ts`: operaciones REST de tickets, mensajes y uploads.
- `socket.ts`: inicializacion y ciclo de vida del cliente Socket.IO.

## Manejo de estado

### Autenticacion

La sesion se persiste con:

- `solucionatech_token`
- `solucionatech_user`

El cliente HTTP redirige a `/login` ante un `401`.

### Chat y no leidos

`ChatContext` mantiene:

- ticket seleccionado
- mensajes por `ticketId`
- salas activas
- conteos de mensajes no leidos
- persistencia de no leidos en `localStorage` mediante `chat_unread`

## Integracion con API

El frontend consume la API mediante `apiClient` y servicios especializados. El contrato esperado es:

```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

Los servicios extraen los campos reales (`ticket`, `tickets`, `message`, `user`, `token`) desde `data` para mantener compatibilidad con el backend actual.

## Manejo de sockets

El cliente usa Socket.IO con:

- autenticacion por `auth.token`
- reconexion automatica
- suscripcion a salas por ticket
- recepcion de `message:new`
- manejo de `socket:error`

Eventos principales del cliente:

- `ticket:join`
- `ticket:leave`
- `message:send`
- `message:new`
- `socket:error`

## Navegacion principal

Rutas relevantes:

- `/`
- `/login`
- `/register`
- `/guides`
- `/client/dashboard`
- `/technician/dashboard`
- `/tickets`
- `/tickets/:id`
- `/tickets/:id/chat`
- `/client/create-ticket`
- `/backend-docs`

Las rutas protegidas usan `ProtectedRoute`.

## Variables de entorno

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Ejecucion local

```bash
npm install
npm run dev
```

Pruebas:

```bash
npm run test:run
```

Build:

```bash
npm run build
```
