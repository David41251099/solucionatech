# SolucionaTech

## Descripcion

SolucionaTech es una plataforma web de soporte tecnico con enfoque tipo marketplace. El sistema conecta clientes y tecnicos mediante un flujo controlado de tickets, chat en tiempo real y gestion segura de archivos. Adicionalmente, incorpora guias de auto-diagnostico para reducir escalamiento innecesario antes de crear un ticket.

## Caracteristicas principales

- Gestion de tickets con roles diferenciados para clientes y tecnicos.
- Flujo de estados controlado: `pending`, `assigned`, `in_progress`, `resolved`, `cancelled`.
- Chat en tiempo real por ticket con Socket.IO.
- Autenticacion con JWT para HTTP y handshake de sockets.
- Validacion de acceso por ownership y rol.
- Subida segura de archivos con validacion de extension, magic bytes y limite de tamano.
- Respuestas HTTP estandarizadas con el contrato `success`, `data` y `message`.
- Integracion continua con GitHub Actions para pruebas de backend y build de frontend.

## Arquitectura

### Frontend

Aplicacion React con Vite y TypeScript. La autenticacion se gestiona con Context API y la mensajeria en tiempo real se coordina desde `ChatContext`, que mantiene tickets, mensajes, salas activas y contadores de mensajes no leidos.

### Backend

API REST en Node.js y Express. La capa HTTP se organiza en rutas, controladores, middlewares y utilidades. Socket.IO comparte las mismas reglas de acceso del backend HTTP para evitar divergencias de seguridad.

### Base de datos

PostgreSQL almacena usuarios, tickets y mensajes de ticket. El esquema incluye restricciones de integridad para estados, categorias y relacion entre `status` y `technician_id`.

### Comunicacion

- HTTP: autenticacion, consultas, cambios de estado, creacion de tickets, carga de mensajes y uploads.
- Sockets: suscripcion a salas por ticket, envio de mensajes y notificaciones de cambios operativos.

## Tecnologias utilizadas

### Frontend

- React
- TypeScript
- Vite
- React Router
- Socket.IO Client
- Tailwind CSS
- Vitest

### Backend

- Node.js
- Express
- Socket.IO
- JSON Web Token
- bcrypt
- multer
- pino
- Vitest

### Base de datos

- PostgreSQL

### Herramientas

- GitHub Actions
- npm

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd "SolucionaTech UI Structure (3) copia"
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar la base de datos

Aplicar el esquema del backend:

```bash
cd ../backend
psql -U postgres -d solucionatech -f src/database/schema.sql
```

Opcionalmente, cargar datos semilla:

```bash
psql -U postgres -d solucionatech -f src/database/seed.sql
```

### 5. Configurar variables de entorno

Backend:

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

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 6. Ejecutar backend

```bash
cd backend
npm run dev
```

### 7. Ejecutar frontend

```bash
cd frontend
npm run dev
```

## Variables de entorno

### Backend

- `PORT`: puerto del servidor HTTP.
- `NODE_ENV`: entorno de ejecucion.
- `DB_HOST`: host de PostgreSQL.
- `DB_PORT`: puerto de PostgreSQL.
- `DB_NAME`: nombre de la base de datos.
- `DB_USER`: usuario de PostgreSQL.
- `DB_PASSWORD`: clave de PostgreSQL.
- `JWT_SECRET`: secreto para firmar y validar JWT.
- `JWT_EXPIRES_IN`: tiempo de expiracion del token.
- `FRONTEND_URL`: origen permitido por CORS y sockets.
- `LOG_LEVEL`: nivel de salida del logger.

### Frontend

- `VITE_API_URL`: URL base del backend HTTP.
- `VITE_SOCKET_URL`: URL base del servidor Socket.IO. Si no se define, se deriva desde `VITE_API_URL`.

## Ejecucion de pruebas

Backend:

```bash
cd backend
npm run test:run
```

Frontend:

```bash
cd frontend
npm run test:run
```

## CI/CD

El repositorio incluye dos workflows de GitHub Actions:

- `.github/workflows/backend.yml`: instala dependencias del backend y ejecuta `npm run test:run`.
- `.github/workflows/frontend.yml`: instala dependencias del frontend y ejecuta `npm run build`.

## Estructura del proyecto

```text
.
|-- .github/
|   `-- workflows/
|       |-- backend.yml
|       `-- frontend.yml
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- socket/
|   |   |-- utils/
|   |   `-- database/
|   |-- tests/
|   |-- README.md
|   `-- QUICK_START.md
|-- docs/
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- socket/
|   |   |-- types/
|   |   `-- utils/
|   |-- README.md
|   |-- INTEGRATION_README.md
|   `-- MIGRATION_GUIDE.md
|-- guidelines/
`-- README.md
```

## Estado del proyecto

El sistema se encuentra en una fase avanzada de desarrollo, con capacidades operativas de produccion inicial para autenticacion, tickets, chat en tiempo real, uploads seguros y pruebas automatizadas. La documentacion de este repositorio refleja el estado real del codigo actual y no una version idealizada.

## Documentacion relacionada

- `backend/README.md`
- `backend/QUICK_START.md`
- `frontend/README.md`
- `frontend/INTEGRATION_README.md`
- `frontend/MIGRATION_GUIDE.md`
- `docs/SMOKE_TEST_CHECKLIST.md`




Mejorar el registro del técnico, como va a ser a nivel ciudad el técnico tiene que tener local o punto físico, teléfono.
