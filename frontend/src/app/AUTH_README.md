# Sistema de Autenticación - SolucionaTech

## Arquitectura Implementada

El sistema de autenticación está completamente implementado usando React Context API y JWT (preparado para backend real).

### Estructura de Archivos

```
src/app/
├── services/
│   └── auth.service.ts       # Servicio de autenticación (llamadas al backend)
├── context/
│   └── AuthContext.tsx       # Context global de autenticación
├── hooks/
│   └── useAuth.ts           # Hook personalizado para usar autenticación
└── components/
    └── ProtectedRoute.tsx   # Componente para proteger rutas
```

## Características

### 1. Servicio de Autenticación (`auth.service.ts`)

- ✅ Funciones `login()` y `register()` (actualmente con mock data)
- ✅ Almacenamiento de token JWT en `localStorage`
- ✅ Almacenamiento de datos de usuario en `localStorage`
- ✅ Función `logout()` para cerrar sesión
- ✅ Funciones helper para manejar `localStorage`

**Próximo paso**: Reemplazar las funciones mock con llamadas reales al backend.

### 2. Context de Autenticación (`AuthContext.tsx`)

Provee el estado global de autenticación:

```typescript
interface AuthContextType {
  user: User | null;              // Usuario autenticado
  token: string | null;           // Token JWT
  isLoading: boolean;             // Estado de carga
  login: (credentials) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => void;
}
```

### 3. Hook `useAuth`

Hook personalizado para acceder al contexto de autenticación en cualquier componente:

```typescript
const { user, token, login, register, logout, isLoading } = useAuth();
```

### 4. Rutas Protegidas

El componente `ProtectedRoute` protege rutas que requieren autenticación:

```tsx
<ProtectedRoute allowedRoles={['client']}>
  <ClientDashboard />
</ProtectedRoute>
```

**Características**:
- Muestra loading mientras verifica autenticación
- Redirige a `/login` si no hay usuario autenticado
- Valida roles permitidos (opcional)
- Redirige al dashboard correcto según el rol si no tiene permiso

## Roles

El sistema maneja dos roles:

- `client` - Cliente (puede crear tickets y ver solo los suyos)
- `technician` - Técnico (puede ver todos los tickets, asignarlos y cambiar estados)

## Rutas Protegidas

Las siguientes rutas están protegidas:

| Ruta | Roles Permitidos |
|------|-----------------|
| `/client/dashboard` | `client` |
| `/technician/dashboard` | `technician` |
| `/tickets` | Ambos |
| `/tickets/:id` | Ambos |
| `/client/create-ticket` | `client` |

## Uso en Componentes

### Acceder a datos del usuario

```tsx
import { useAuth } from '../hooks/useAuth';

function MiComponente() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return <div>Hola, {user.name}!</div>;
}
```

### Cerrar sesión

```tsx
const { logout } = useAuth();

const handleLogout = () => {
  logout();
  navigate('/');
};
```

### Iniciar sesión

```tsx
const { login } = useAuth();

const handleLogin = async (credentials) => {
  try {
    await login(credentials);
    navigate('/client/dashboard');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
  }
};
```

## Persistencia de Sesión

- El token y los datos del usuario se guardan en `localStorage`
- La sesión persiste entre recargas de página
- Al recargar, el `AuthContext` restaura automáticamente la sesión desde `localStorage`

## Acceso Rápido (Demo)

Las páginas de Login y Register incluyen botones de acceso rápido para testing:

- **Como Cliente**: Crea sesión con rol `client`
- **Como Técnico**: Crea sesión con rol `technician`

## Próximos Pasos

1. ✅ Sistema de autenticación frontend completo
2. ⏳ Conectar con backend real (reemplazar mock data)
3. ⏳ Implementar refresh token
4. ⏳ Manejo de expiración de token
5. ⏳ Integrar sistema de tickets con autenticación

## Notas de Seguridad

⚠️ **Importante**: 
- Actualmente usa datos mock para desarrollo
- El token se guarda en `localStorage` (considerar alternativas más seguras en producción)
- No hay validación real del token todavía
- Las contraseñas no se validan con el backend

Una vez que el backend esté listo, actualizar `auth.service.ts` para hacer llamadas HTTP reales.
