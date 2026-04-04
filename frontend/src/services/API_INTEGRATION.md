# Documentacion de Integracion Frontend-Backend

## Resumen
SolucionaTech consume una API REST con formato estandar:

```json
{
  "success": true,
  "data": {},
  "message": "Operacion exitosa"
}
```

En errores:

```json
{
  "success": false,
  "message": "Error descriptivo",
  "error": "Error descriptivo"
}
```

## Variables de entorno
```env
VITE_API_URL=http://localhost:5000/api
```

## Auth
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

`auth.service.ts` usa solo `/auth/me` para perfil actual.

## Tickets
- Crear ticket con `title`, `description`, `category` y adjunto opcional.
- `category`: `general | hardware | software | network`.
- Mensajes y adjuntos por ticket en `/tickets/:id/messages`.

## Socket.IO seguro
- El token JWT se envia en el handshake (`auth.token`).
- El backend valida acceso al ticket en `ticket:join` y `message:send`.
- No se confia en `senderId` enviado por cliente.

## Cliente HTTP (`api.ts`)
- Adjunta `Authorization: Bearer <token>` cuando aplica.
- Normaliza errores y lanza `ApiError` con `statusCode` y `message`.
- Redirige a login cuando recibe `401`.

## Nota de compatibilidad
Aunque el backend ya entrega `data`, algunos endpoints tambien retornan campos legacy (`ticket`, `tickets`, `user`, `token`) para no romper el frontend existente.
