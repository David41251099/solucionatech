# SolucionaTech Backend

## Proposito

El backend expone la API REST y la capa Socket.IO que soportan autenticacion, tickets, chat en tiempo real y carga de archivos. La implementacion preserva contratos estables hacia el frontend mediante respuestas con `success`, `data` y `message`, ademas de algunos campos legacy de compatibilidad controlada.

## Arquitectura

```text
backend/
|-- server.js
|-- src/
|   |-- app.js
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- routes/
|   |-- socket/
|   |-- utils/
|   `-- database/
`-- tests/
```

### Capas principales

- `server.js`: carga variables de entorno, crea el servidor HTTP e inicializa Socket.IO.
- `src/app.js`: configura middlewares globales, CORS, rate limiting, rutas y manejo de errores.
- `src/routes`: declara endpoints y middlewares por recurso.
- `src/controllers`: procesa request/response y coordina acceso a base de datos.
- `src/middleware`: autenticacion, autorizacion, control de acceso a tickets, uploads y errores.
- `src/socket`: define autenticacion de sockets, salas por ticket y eventos en tiempo real.
- `src/utils`: respuestas HTTP, errores tipados y utilidades compartidas.

## Flujo de tickets

### Estados soportados

- `pending`
- `assigned`
- `in_progress`
- `resolved`
- `cancelled`

### Reglas operativas

- Un ticket nuevo se crea en `pending`.
- Un ticket en `pending` no puede tener `technician_id`.
- Un ticket en `assigned` o `in_progress` debe tener `technician_id`.
- El tecnico autenticado toma el ticket mediante `PATCH /api/tickets/:id/assign`.
- El tecnico asignado puede avanzar de `assigned` a `in_progress`.
- El tecnico asignado puede avanzar de `in_progress` a `resolved`.
- El cliente propietario puede cancelar un ticket no finalizado.
- El tecnico asignado puede liberar un ticket en `assigned` o `in_progress`, devolviendolo a `pending`.

## Seguridad implementada

### Acceso y ownership

- JWT obligatorio en rutas protegidas.
- `verifyToken` resuelve `userId` y `role` desde el token.
- Los clientes solo pueden ver y cancelar sus propios tickets.
- Los tecnicos solo pueden modificar tickets asignados a ellos, salvo la toma inicial de tickets `pending`.
- El chat solo permite escritura cuando el ticket esta en `assigned` o `in_progress` y el usuario pertenece al ticket.

### Uploads seguros

- El endpoint `/api/upload` requiere autenticacion.
- Se aceptan imagenes con extensiones `.jpg`, `.jpeg`, `.png` y `.webp`.
- El backend valida magic bytes para evitar archivos con contenido inconsistente.
- Se bloquean extensiones peligrosas y patrones de doble extension.
- El limite de tamano por archivo es 5 MB.

### Protecciones globales

- `helmet` para cabeceras de seguridad.
- `express-rate-limit` para reducir abuso de endpoints.
- CORS restringido por `FRONTEND_URL`.
- Logging estructurado con `pino`.

## Endpoints principales

### Autenticacion

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/profile`

`/api/auth/profile` se mantiene como alias de compatibilidad.

### Tickets

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/available`
- `GET /api/tickets/my-tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `PATCH /api/tickets/:id/assign`
- `PATCH /api/tickets/:id/status`
- `PATCH /api/tickets/:id/cancel`
- `PATCH /api/tickets/:id/release`
- `GET /api/tickets/:id/messages`
- `POST /api/tickets/:id/messages`

### Uploads

- `POST /api/upload`

### Salud del servicio

- `GET /health`

## Formato de respuesta

### Exito

```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

### Error

```json
{
  "success": false,
  "data": null,
  "message": "Descripcion del error",
  "error": "Descripcion del error"
}
```

## Variables de entorno

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solucionatech
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=definir_un_valor_seguro
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

## Ejecucion local

```bash
npm install
npm run dev
```

Para ejecutar pruebas:

```bash
npm run test:run
```

## Base de datos

El esquema principal se encuentra en `src/database/schema.sql`. Las entidades relevantes son:

- `users`
- `tickets`
- `ticket_messages`

El esquema aplica una migracion segura que elimina `priority` si todavia existe, incorpora `category` y refuerza restricciones de consistencia sobre estados.
