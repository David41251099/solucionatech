
# SolucionaTech

## Descripción
Plataforma de soporte técnico tipo marketplace con guías de auto-diagnóstico, gestión de tickets y chat en tiempo real.

## Tecnologías
- React + Vite + TypeScript
- TailwindCSS
- Node.js + Express
- PostgreSQL
- Socket.IO

## Instalación

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

### Backend
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `FRONTEND_URL`

### Frontend
- `VITE_API_URL`

## Flujo del sistema
1. Usuario consulta guías de auto-diagnóstico.
2. Si no resuelve, crea un ticket.
3. Un técnico acepta/asigna el ticket.
4. Cliente y técnico se comunican por chat en tiempo real.
5. El ticket se resuelve y se actualiza su estado.
  
