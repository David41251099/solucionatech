# Quick Start Backend

## Requisitos

- Node.js 20 o superior
- PostgreSQL disponible

## Instalacion rapida

```bash
cd backend
npm install
```

## Configuracion minima

Crear variables de entorno:

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

Aplicar esquema:

```bash
psql -U postgres -d solucionatech -f src/database/schema.sql
```

## Ejecucion

Desarrollo:

```bash
npm run dev
```

Pruebas:

```bash
npm run test:run
```

## Endpoints clave

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/tickets`
- `GET /api/tickets`
- `PATCH /api/tickets/:id/assign`
- `PATCH /api/tickets/:id/status`
- `GET /api/tickets/:id/messages`
- `POST /api/tickets/:id/messages`
- `POST /api/upload`

## Verificacion rapida

Comprobar salud del servicio:

```bash
curl http://localhost:5000/health
```

La respuesta esperada es un objeto JSON con `success: true` y `data.status: "ok"`.
