#  Integración Frontend-Backend Completada

##  Archivos Creados

### 1. **Tipos TypeScript**
 `/src/app/types/index.ts`
- Todos los tipos centralizados
- `User`, `Ticket`, `LoginResponse`, `CreateTicketDTO`, etc.

### 2. **Cliente HTTP Reutilizable**
 `/src/app/utils/api.ts`
- Cliente HTTP con `fetch`
- Manejo automático de autenticación JWT
- Manejo de errores 401 con redirección
- Métodos: `get`, `post`, `put`, `patch`, `delete`

### 3. **Servicio de Autenticación**
 `/src/app/services/auth.service.ts`
-  `login(credentials)` - Conectado al backend
-  `register(data)` - Conectado al backend
-  `getProfile()` - Conectado al backend
-  `logout()` - Limpia localStorage y redirige
-  Funciones de utilidad: `isAuthenticated()`, `getUserRole()`, etc.

### 4. **Servicio de Tickets**
 `/src/app/services/ticket.service.ts`
-  `createTicket(data)` - Crear ticket
-  `getTickets()` - Listar tickets (filtrado por rol)
-  `getTicketById(id)` - Detalle de ticket
-  `updateTicket(id, data)` - Actualizar ticket
-  `assignTechnician(id, technicianId?)` - Asignar técnico
-  `updateTicketStatus(id, status)` - Cambiar estado
-  Funciones de utilidad: filtros, contadores, colores, formateo de fechas

### 5. **Variables de Entorno**
 `/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

 `/.env.example`
- Plantilla para otros desarrolladores

### 6. **Documentación**
 `/src/app/services/API_INTEGRATION.md`
- Guía completa de integración
- Ejemplos de uso
- Solución de problemas

### 7. **Ejemplos de Uso**
 `/src/app/examples/ServiceUsageExample.tsx`
- Componentes de ejemplo con todos los servicios
- Referencia completa de implementación

---

##  Configuración Rápida

### Paso 1: Instalar dependencias (si es necesario)
```bash
npm install
# o
pnpm install
```

### Paso 2: Configurar variables de entorno
```bash
# Crear archivo .env en la raíz del proyecto
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### Paso 3: Iniciar el backend
```bash
cd backend
npm run dev
```

El backend debe estar corriendo en `http://localhost:5000`

### Paso 4: Iniciar el frontend
```bash
# En otra terminal, desde la raíz del proyecto
npm run dev
# o
pnpm dev
```

El frontend estará disponible en `http://localhost:5173`

---

##  Endpoints del Backend

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/profile` | Obtener perfil | Sí |

### Tickets
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/tickets` | Crear ticket | Client |
| GET | `/tickets` | Listar tickets | Ambos |
| GET | `/tickets/:id` | Detalle de ticket | Ambos |
| PUT | `/tickets/:id` | Actualizar ticket | Technician |
| PATCH | `/tickets/:id/assign` | Asignar técnico | Technician |
| PATCH | `/tickets/:id/status` | Cambiar estado | Technician |

---

##  Autenticación JWT

### Flujo de autenticación:

1. **Login/Register**
   ```typescript
   const response = await login({ email, password });
   // response = { user: {...}, token: "jwt_token" }
   ```

2. **Guardado automático en localStorage**
   - `solucionatech_token`: Token JWT
   - `solucionatech_user`: Datos del usuario

3. **Headers automáticos**
   - Todas las peticiones incluyen: `Authorization: Bearer <token>`

4. **Manejo de expiración**
   - Error 401 → Limpia localStorage → Redirige a `/login`

---

##  Ejemplos de Uso

### Login
```typescript
import { login } from '@/app/services/auth.service';

try {
  const response = await login({ 
    email: 'juan@cliente.com', 
    password: 'password123' 
  });
  
  console.log('Usuario:', response.user);
  // Redirigir según rol
  if (response.user.role === 'client') {
    window.location.href = '/client/dashboard';
  }
} catch (error) {
  console.error('Error:', error);
}
```

### Crear Ticket
```typescript
import { createTicket } from '@/app/services/ticket.service';

try {
  const ticket = await createTicket({
    title: 'Problema con impresora',
    description: 'La impresora no imprime',
    priority: 'high'
  });
  
  console.log('Ticket creado:', ticket);
} catch (error) {
  console.error('Error:', error);
}
```

### Obtener Tickets
```typescript
import { getTickets } from '@/app/services/ticket.service';

try {
  const tickets = await getTickets();
  // Cliente: solo sus tickets
  // Técnico: todos los tickets
  
  console.log('Tickets:', tickets);
} catch (error) {
  console.error('Error:', error);
}
```

### Asignar Ticket (Técnico)
```typescript
import { assignTechnician } from '@/app/services/ticket.service';

// Auto-asignarse
const ticket = await assignTechnician('ticket-id');

// Asignar a otro técnico
const ticket = await assignTechnician('ticket-id', 'technician-id');
```

### Cambiar Estado (Técnico)
```typescript
import { updateTicketStatus } from '@/app/services/ticket.service';

const ticket = await updateTicketStatus('ticket-id', 'in_progress');
```

---

##  Manejo de Errores

### Errores de API
```typescript
import { ApiError } from '@/app/utils/api';

try {
  await login({ email: 'test@test.com', password: 'wrong' });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Código:', error.statusCode);
    console.error('Mensaje:', error.message);
    
    switch (error.statusCode) {
      case 400:
        alert('Datos inválidos');
        break;
      case 401:
        alert('Credenciales incorrectas');
        break;
      case 404:
        alert('No encontrado');
        break;
      case 500:
        alert('Error del servidor');
        break;
    }
  }
}
```

---

##  Usuarios de Prueba

### Cliente
```
Email: juan@cliente.com
Password: password123
```

### Técnico
```
Email: ana@tecnico.com
Password: password123
```

---

##  Tipos TypeScript

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'technician';
  created_at?: string;
}
```

### Ticket
```typescript
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  client_id: string;
  technician_id: string | null;
  created_at: string;
  updated_at: string;
  // Datos del JOIN
  client_name?: string;
  client_email?: string;
  technician_name?: string | null;
  technician_email?: string | null;
}
```

---

##  Verificar Integración

### 1. Backend corriendo
```bash
curl http://localhost:5000/health
```

### 2. Login funcional
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@cliente.com","password":"password123"}'
```

### 3. DevTools del navegador
1. Abrir DevTools → Network
2. Hacer login en el frontend
3. Verificar petición a `/api/auth/login`
4. Verificar que el token se guarde en localStorage
5. Navegar a tickets
6. Verificar header `Authorization: Bearer <token>`

---

##  Notas Importantes

1. **CORS**: El backend ya tiene CORS configurado para `http://localhost:5173`
2. **Variables de entorno**: El archivo `.env` debe existir en la raíz
3. **IDs**: El backend usa UUIDs (no números)
4. **Estados**: Los estados válidos son: `pending`, `assigned`, `in_progress`, `resolved`
5. **Prioridades**: Las prioridades válidas son: `low`, `medium`, `high`

---

##  Solución de Problemas

### Error: "Failed to fetch"
 **Solución:**
- Verificar que el backend esté corriendo: `http://localhost:5000`
- Verificar `.env`: `VITE_API_URL=http://localhost:5000/api`
- Verificar CORS en el backend

### Error: "401 Unauthorized"
 **Solución:**
- Token expirado → hacer login nuevamente
- Token inválido → limpiar localStorage:
  ```javascript
  localStorage.clear();
  ```

### Error: "Network error"
 **Solución:**
- Verificar conexión a internet
- Verificar que el backend esté accesible
- Revisar consola del navegador para más detalles

### Backend no responde
 **Solución:**
```bash
cd backend
npm run dev
```

---

##  Recursos Adicionales

-  [Documentación del Backend](./backend/README.md)
-  [Guía de Inicio Rápido del Backend](./backend/QUICK_START.md)
-  [Esquema de Base de Datos](./backend/src/database/schema.sql)
-  [Endpoints de Prueba](./backend/test-auth.http)
-  [Documentación de Integración](./src/app/services/API_INTEGRATION.md)
-  [Ejemplos de Uso](./src/app/examples/ServiceUsageExample.tsx)

---

##  Checklist de Integración

- [x] Cliente HTTP reutilizable creado (`api.ts`)
- [x] Servicio de autenticación conectado (`auth.service.ts`)
- [x] Servicio de tickets creado (`ticket.service.ts`)
- [x] Tipos TypeScript definidos (`types/index.ts`)
- [x] Variables de entorno configuradas (`.env`)
- [x] Manejo de errores 401 implementado
- [x] Documentación completa creada
- [x] Ejemplos de uso proporcionados

---

##  ¡Integración Completada!

El frontend está completamente conectado al backend real. Todas las funcionalidades están listas para usar:

 Autenticación con JWT
 CRUD de tickets
 Control de permisos por rol
 Manejo de errores
 TypeScript completo
 Código limpio y modular


---

##  Soporte

Si tienes algún problema con la integración:

1. Revisa la [Documentación de Integración](./src/app/services/API_INTEGRATION.md)
2. Revisa los [Ejemplos de Uso](./src/app/examples/ServiceUsageExample.tsx)
3. Verifica la consola del navegador y del backend
4. Revisa que el backend esté corriendo correctamente
