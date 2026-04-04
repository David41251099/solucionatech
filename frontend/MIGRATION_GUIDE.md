#  Guía de Migración de Componentes

Esta guía muestra cómo actualizar los componentes existentes para usar la API real en lugar de los mocks.

---

##  Cambios Necesarios en los Componentes

### 1. **Actualizar imports en componentes de autenticación**

####  Antes (imports antiguos):
```typescript
import { login } from '../services/auth.service';
```

####  Después (los imports siguen igual):
```typescript
import { login } from '../services/auth.service';
```

**Nota:** Los imports NO cambian, solo cambia la implementación interna del servicio.

---

### 2. **Login Component - Sin cambios necesarios**

El componente de login ya debería funcionar sin cambios si estaba usando el servicio correctamente:

```typescript
import { login } from '@/app/services/auth.service';
import { ApiError } from '@/app/utils/api';

const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await login(credentials);
    // El resto del código sigue igual
    navigate('/dashboard');
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    }
  }
};
```

---

### 3. **Register Component - Sin cambios necesarios**

El componente de registro también debería funcionar sin cambios:

```typescript
import { register } from '@/app/services/auth.service';
import { ApiError } from '@/app/utils/api';

const handleRegister = async (data: RegisterData) => {
  try {
    const response = await register(data);
    navigate('/dashboard');
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    }
  }
};
```

---

### 4. **AuthContext - Actualización del tipo User**

####  Antes:
```typescript
interface User {
  id: number;  // Era número
  name: string;
  email: string;
  role: 'client' | 'technician';
}
```

####  Después:
```typescript
import type { User } from '@/app/types';

// O si prefieres definirlo:
interface User {
  id: string;  // Ahora es UUID (string)
  name: string;
  email: string;
  role: 'client' | 'technician';
  created_at?: string;
}
```

---

### 5. **Componentes de Tickets - Usar nuevo servicio**

####  Antes (si tenías mocks):
```typescript
// Mock data
const tickets = [
  { id: 1, title: 'Test', ... }
];
```

####  Después (usar servicio real):
```typescript
import { getTickets } from '@/app/services/ticket.service';
import { ApiError } from '@/app/utils/api';
import type { Ticket } from '@/app/types';

const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  const fetchTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchTickets();
}, []);
```

---

### 6. **Crear Ticket Component**

####  Antes (mock):
```typescript
const handleSubmit = (data) => {
  // Mock: solo añadir al estado local
  setTickets([...tickets, { ...data, id: Date.now() }]);
};
```

####  Después (API real):
```typescript
import { createTicket } from '@/app/services/ticket.service';
import { ApiError } from '@/app/utils/api';

const handleSubmit = async (data: CreateTicketDTO) => {
  try {
    const ticket = await createTicket(data);
    
    // Actualizar lista de tickets
    setTickets((prev) => [ticket, ...prev]);
    
    // Mostrar mensaje de éxito
    toast.success('Ticket creado exitosamente');
    
    // Resetear formulario
    reset();
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    }
  }
};
```

---

### 7. **Detalle de Ticket Component**

####  Antes (mock):
```typescript
const ticket = tickets.find(t => t.id === ticketId);
```

####  Después (API real):
```typescript
import { getTicketById } from '@/app/services/ticket.service';
import type { Ticket } from '@/app/types';

const [ticket, setTicket] = useState<Ticket | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchTicket = async () => {
    try {
      const data = await getTicketById(ticketId);
      setTicket(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchTicket();
}, [ticketId]);
```

---

### 8. **Asignar Ticket (Técnico)**

####  Nuevo código:
```typescript
import { assignTechnician } from '@/app/services/ticket.service';

const handleAssign = async (ticketId: string) => {
  try {
    // Auto-asignarse
    const updatedTicket = await assignTechnician(ticketId);
    
    // Actualizar estado
    setTicket(updatedTicket);
    
    toast.success('Ticket asignado correctamente');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    }
  }
};
```

---

### 9. **Cambiar Estado de Ticket (Técnico)**

####  Nuevo código:
```typescript
import { updateTicketStatus } from '@/app/services/ticket.service';

const handleStatusChange = async (ticketId: string, newStatus: Ticket['status']) => {
  try {
    const updatedTicket = await updateTicketStatus(ticketId, newStatus);
    
    // Actualizar estado
    setTicket(updatedTicket);
    
    toast.success('Estado actualizado correctamente');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    }
  }
};
```

---

### 10. **Actualizar Ticket (Técnico)**

####  Nuevo código:
```typescript
import { updateTicket } from '@/app/services/ticket.service';

const handleUpdate = async (ticketId: string, data: UpdateTicketDTO) => {
  try {
    const updatedTicket = await updateTicket(ticketId, data);
    
    // Actualizar estado
    setTicket(updatedTicket);
    
    toast.success('Ticket actualizado correctamente');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    }
  }
};
```

---

##  Cambios en AuthContext.tsx

Si tienes un `AuthContext`, estos son los cambios recomendados:

###  Antes:
```typescript
import { User } from '../services/auth.service';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  // ...
}
```

###  Después:
```typescript
import { User, LoginCredentials } from '@/app/types';
import { login as loginService, logout as logoutService } from '@/app/services/auth.service';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar
    const storedUser = localStorage.getItem('solucionatech_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await loginService(credentials);
    setUser(response.user);
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

##  Checklist de Migración

### Autenticación
- [ ] Actualizar tipo `User` (id: number → id: string)
- [ ] Importar tipos desde `@/app/types`
- [ ] Actualizar `AuthContext` si existe
- [ ] Usar `ApiError` para manejo de errores

### Tickets
- [ ] Reemplazar datos mock por llamadas a servicios
- [ ] Importar funciones desde `@/app/services/ticket.service`
- [ ] Actualizar tipo `Ticket` (usar tipos centralizados)
- [ ] Agregar manejo de errores con `ApiError`
- [ ] Agregar estados de loading

### General
- [ ] Verificar que `.env` exista con `VITE_API_URL`
- [ ] Probar login/logout
- [ ] Probar crear ticket (cliente)
- [ ] Probar ver tickets (ambos roles)
- [ ] Probar asignar ticket (técnico)
- [ ] Probar cambiar estado (técnico)

---

##  Patrón Recomendado para Componentes

```typescript
import { useState, useEffect } from 'react';
import { ApiError } from '@/app/utils/api';
import { getTickets } from '@/app/services/ticket.service';
import type { Ticket } from '@/app/types';

export const TicketsComponent = () => {
  // Estados
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Cargar datos
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderizado
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
    </div>
  );
};
```

---

##  Errores Comunes

### 1. Error: "id is not a number"
**Causa:** Los IDs ahora son UUIDs (strings), no números.

**Solución:**
```typescript
//  Mal
const ticketId = parseInt(params.id);

// ✅ Bien
const ticketId = params.id; // Ya es string
```

### 2. Error: "VITE_API_URL is not defined"
**Causa:** Falta el archivo `.env`

**Solución:**
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Error: "Failed to fetch"
**Causa:** El backend no está corriendo.

**Solución:**
```bash
cd backend
npm run dev
```

### 4. Error: "401 Unauthorized"
**Causa:** Token expirado o inválido.

**Solución:**
```javascript
// Limpiar localStorage y hacer login nuevamente
localStorage.clear();
// Redirigir a login
```

---

##  Resultado Final

Después de la migración:

 No más datos mock
 Integración completa con backend
 Manejo de errores robusto
 TypeScript con tipos completos
 Código limpio y mantenible
 Estados de loading/error
 Autenticación JWT funcional

---

**¡Listo para migrar!** 
