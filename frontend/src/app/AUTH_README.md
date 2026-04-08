# Modulo de Autenticacion del Frontend

## Alcance

El modulo de autenticacion administra la sesion de usuario en el frontend, restaura credenciales persistidas, consulta el perfil actual y conecta o desconecta Socket.IO segun el estado de autenticacion.

## Componentes involucrados

- `src/context/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/services/auth.service.ts`
- `src/utils/api.ts`

## Responsabilidades

### AuthContext

- Mantener `user`, `token`, `isLoading` e `isAuthenticated`.
- Restaurar sesion al iniciar la aplicacion.
- Ejecutar `login`, `register` y `logout`.
- Activar o cerrar la conexion Socket.IO junto con la sesion.

### auth.service

- Ejecutar login y registro contra el backend.
- Consultar `GET /api/auth/me`.
- Persistir token y usuario en `localStorage`.
- Mantener compatibilidad con la clave legacy `token`.

### ProtectedRoute

- Restringir acceso por autenticacion.
- Restringir acceso por rol cuando aplica.
- Evitar que clientes y tecnicos ingresen a vistas que no les corresponden.

## Persistencia local

Claves usadas:

- `solucionatech_token`
- `solucionatech_user`
- `token` como compatibilidad legacy

## Flujo resumido

1. El usuario inicia sesion o se registra.
2. El frontend guarda token y usuario.
3. `AuthContext` actualiza el estado global.
4. La aplicacion conecta Socket.IO con el token actual.
5. Ante un `401`, el cliente limpia la sesion y redirige a `/login`.

## Roles soportados

- `client`
- `technician`

## Rutas protegidas relevantes

- `/client/dashboard`
- `/technician/dashboard`
- `/tickets`
- `/tickets/:id`
- `/tickets/:id/chat`
- `/client/create-ticket`
