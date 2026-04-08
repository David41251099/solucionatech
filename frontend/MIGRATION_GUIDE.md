# Guia de Migracion

## Objetivo

Este documento resume los cambios funcionales y de compatibilidad que deben considerarse al actualizar integraciones antiguas hacia el estado actual del sistema.

## Cambios relevantes

### Eliminacion de `priority`

- El flujo actual ya no utiliza `priority`.
- La base de datos elimina `priority` de forma segura en `schema.sql`.
- La documentacion, el frontend y las integraciones nuevas deben usar `category`.

Categorias vigentes:

- `general`
- `hardware`
- `software`
- `network`

### Estados de ticket vigentes

Los estados soportados actualmente son:

- `pending`
- `assigned`
- `in_progress`
- `resolved`
- `cancelled`

Las integraciones antiguas que asumian solo cuatro estados deben contemplar `cancelled`.

### Seguridad reforzada en chat

- El chat ya no depende solo de autenticacion general.
- El backend valida que el usuario pertenezca al ticket y que el estado permita escritura.
- Un ticket `resolved` o `cancelled` no acepta nuevos mensajes.

### Uploads mas estrictos

- Solo se aceptan imagenes `.jpg`, `.jpeg`, `.png` y `.webp`.
- Existe validacion por magic bytes.
- Se rechazan archivos con extensiones peligrosas o doble extension.
- El limite por archivo es 5 MB.

### Autenticacion y perfil actual

- La consulta principal del perfil es `GET /api/auth/me`.
- `GET /api/auth/profile` se conserva como alias de compatibilidad.
- El frontend mantiene soporte para `solucionatech_token` y una clave legacy `token`.

### Respuesta estandarizada

El backend responde con `success`, `data` y `message`. Sin embargo, algunos endpoints exponen campos legacy en paralelo para no romper clientes existentes.

## Compatibilidad actual

Se mantienen mecanismos de compatibilidad en:

- login y registro
- perfil actual
- respuestas de tickets
- respuestas de mensajes

La recomendacion para nuevas integraciones es consumir siempre los datos desde `data`.

## Acciones recomendadas para migracion

1. Sustituir cualquier referencia a `priority` por `category`.
2. Verificar que el frontend use `GET /api/auth/me` como ruta primaria de perfil.
3. Confirmar que los estados de ticket incluyan `cancelled`.
4. Revisar que los formularios de upload solo permitan imagenes soportadas.
5. Alinear la logica de chat con las restricciones de estados cerrados.

## Impacto esperado

La migracion no debe cambiar contratos funcionales visibles para el usuario final. El objetivo es alinear nomenclatura, seguridad y consistencia con el sistema actual.
