# SolucionaTech Backend

Backend de SolucionaTech (tickets + chat en tiempo real + autenticacion JWT).

## Tecnologias
- Node.js + Express
- PostgreSQL
- JWT
- Socket.IO

## Instalacion
```bash
npm install
npm run dev
```

Servidor por defecto: `http://localhost:5000`

## Variables de entorno
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solucionatech
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=tu_secreto
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Endpoints principales

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protegido)
- `GET /api/auth/profile` (alias legacy)

### Tickets
- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/my-tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id/assign`
- `PATCH /api/tickets/:id/status`
- `PATCH /api/tickets/:id/cancel`
- `PATCH /api/tickets/:id/release`
- `GET /api/tickets/:id/messages`
- `POST /api/tickets/:id/messages`

### Upload
- `POST /api/upload`

## Formato de respuesta estandar

### Exito
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error descriptivo",
  "error": "Error descriptivo"
}
```

Nota: algunos endpoints mantienen campos legacy (`ticket`, `tickets`, `user`, `token`) para compatibilidad con frontend existente.

## Seguridad
- Helmet y rate-limit globales.
- JWT obligatorio en rutas protegidas.
- Socket.IO con autenticacion por token en handshake.
- Validacion de acceso a ticket en eventos `ticket:join` y `message:send`.

## Esquema relevante

### `tickets`
- `id`
- `title`
- `description`
- `status`
- `category` (`general|hardware|software|network`)
- `attachment_url`
- `client_id`
- `technician_id`
- `created_at`
- `updated_at`

`priority` fue retirado del flujo actual.
