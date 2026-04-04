# SMOKE TEST CHECKLIST

Duracion estimada: 15 minutos.
Objetivo: validar flujo critico end-to-end sin romper seguridad, chat ni uploads.

## Precondiciones
- Backend y frontend corriendo en entorno de prueba.
- Base de datos accesible.
- Existe al menos 1 usuario cliente y 1 usuario tecnico.

## Flujo
1. Login cliente
- Iniciar sesion con cuenta de cliente.
- Verificar acceso al dashboard cliente.

2. Crear ticket
- Crear ticket nuevo con titulo y descripcion.
- Verificar que queda en estado `pending`.

3. Login tecnico
- Cerrar sesion cliente e iniciar con tecnico.
- Verificar acceso al dashboard tecnico.

4. Tomar ticket
- Tecnico toma ticket pendiente.
- Verificar cambio a `assigned` y que aparece como asignado al tecnico actual.

5. Enviar mensajes en chat
- Cliente envia mensaje en ticket asignado.
- Tecnico responde.
- Verificar recepcion en tiempo real en ambos lados.

6. Subir imagen valida
- Adjuntar imagen `.png`, `.jpg` o `.webp` menor a 5MB.
- Verificar que el mensaje/adjunto se guarda y se visualiza.

7. Validar rechazo de upload invalido
- Intentar subir archivo no permitido (ejemplo: `.exe` o doble extension).
- Verificar error controlado (400/413 segun caso).

8. Cambiar estado a in_progress
- Tecnico asignado cambia estado a `in_progress`.
- Verificar que el estado se refleja en cliente y tecnico.

9. Resolver ticket
- Tecnico cambia estado a `resolved`.
- Verificar cierre de flujo sin errores.

## Validaciones de seguridad rapidas
- Cliente no puede ver ticket de otro cliente (403).
- Tecnico no asignado no puede escribir en chat ni cambiar estado (403).
- Sin token o token invalido en endpoints protegidos retorna 401.

## Resultado esperado
- Flujo cliente-tecnico completo funciona.
- Reglas de acceso se cumplen.
- Uploads validos pasan y uploads maliciosos fallan.
- No hay errores criticos en consola ni en logs del servidor.
