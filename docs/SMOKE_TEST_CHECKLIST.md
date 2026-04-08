# Smoke Test Checklist

## Objetivo

Validar el flujo critico end-to-end del sistema sin alterar seguridad, sockets, uploads ni contratos HTTP.

## Precondiciones

- Backend ejecutandose.
- Frontend ejecutandose.
- Base de datos accesible.
- Al menos un usuario cliente y un usuario tecnico disponibles.

## Flujo de validacion

### 1. Acceso inicial

- Iniciar sesion como cliente.
- Verificar acceso a `/client/dashboard`.

### 2. Creacion de ticket

- Crear un ticket con titulo, descripcion y categoria.
- Confirmar que el ticket queda en `pending`.

### 3. Toma del ticket

- Iniciar sesion como tecnico.
- Tomar un ticket pendiente.
- Confirmar cambio a `assigned`.

### 4. Chat en tiempo real

- Abrir el chat del ticket desde cliente y tecnico.
- Enviar mensajes desde ambos lados.
- Verificar emision y recepcion en tiempo real.

### 5. Archivos

- Adjuntar una imagen valida menor a 5 MB.
- Confirmar almacenamiento y visualizacion.
- Probar un archivo invalido para confirmar rechazo controlado.

### 6. Progreso y resolucion

- Cambiar el estado a `in_progress`.
- Cambiar el estado a `resolved`.
- Confirmar que el chat deja de aceptar nuevos mensajes.

## Validaciones de seguridad

- Un cliente no puede consultar tickets de otro cliente.
- Un tecnico no asignado no puede escribir en el chat de un ticket ajeno.
- Un tecnico no asignado no puede cambiar estado de un ticket ajeno.
- Un request sin token debe fallar con `401` en endpoints protegidos.

## Resultado esperado

- El flujo cliente-tecnico se completa sin errores funcionales.
- Los estados del ticket se reflejan de forma consistente.
- Los uploads validos pasan y los invalidos se rechazan.
- Las reglas de ownership y autenticacion se cumplen.
