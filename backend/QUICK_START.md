# 🚀 Guía de Inicio Rápido - SolucionaTech Backend

## 📋 Pasos para ejecutar el backend

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE solucionatech;

# Salir
\q
```

### 3. Aplicar esquema de base de datos

```bash
psql -U postgres -d solucionatech -f src/database/schema.sql
```

### 4. Generar hash bcrypt para usuarios de prueba

```bash
# Generar hash para "password123"
node scripts/generate-hash.js password123
```

**Copia el hash generado** y reemplázalo en todos los usuarios del archivo `src/database/seed.sql`

Ejemplo:
```sql
-- Reemplazar esto:
'$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq'

-- Con el hash real generado:
'$2b$10$abc123...tu_hash_real_aqui'
```

### 5. Cargar datos de prueba

```bash
psql -U postgres -d solucionatech -f src/database/seed.sql
```

### 6. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=solucionatech
DB_USER=postgres
DB_PASSWORD=tu_password_postgresql

JWT_SECRET=mi_secret_key_super_segura_xyz123
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

### 7. Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

Deberías ver:

```
🚀 Servidor corriendo en puerto 5000
📍 Entorno: development
✅ Conectado a PostgreSQL
```

---

## 🧪 Probar los endpoints

### Opción 1: Usando archivo test-auth.http

1. Instalar extensión **REST Client** en VSCode
2. Abrir archivo `test-auth.http`
3. Click en "Send Request" sobre cada endpoint

### Opción 2: Usando curl

```bash
# 1. Registrar usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "password123",
    "role": "client"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'

# Copiar el token de la respuesta

# 3. Obtener perfil (reemplaza TOKEN_AQUI)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN_AQUI"
```

### Opción 3: Usando Thunder Client / Postman

1. **POST** `http://localhost:5000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@test.com",
       "password": "password123",
       "role": "client"
     }
     ```

2. **POST** `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@test.com",
       "password": "password123"
     }
     ```
   - Copiar el `token` de la respuesta

3. **GET** `http://localhost:5000/api/auth/profile`
   - Headers:
     - `Authorization: Bearer TOKEN_AQUI`

---

## 👥 Usuarios de prueba (después de ejecutar seed.sql)

### Clientes
| Email | Password | Rol |
|-------|----------|-----|
| juan@cliente.com | password123 | client |
| maria@cliente.com | password123 | client |
| carlos@cliente.com | password123 | client |

### Técnicos
| Email | Password | Rol |
|-------|----------|-----|
| ana@tecnico.com | password123 | technician |
| luis@tecnico.com | password123 | technician |

---

## ✅ Checklist de verificación

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `solucionatech` creada
- [ ] Esquema aplicado (tablas `users` y `tickets` creadas)
- [ ] Hash bcrypt generado y actualizado en seed.sql
- [ ] Datos de prueba cargados
- [ ] Archivo `.env` configurado
- [ ] Dependencias npm instaladas
- [ ] Servidor iniciado en puerto 5000
- [ ] Endpoint `/health` responde OK
- [ ] Login funciona correctamente

---

## 🔧 Comandos útiles

```bash
# Verificar que las tablas existan
psql -U postgres -d solucionatech -c "\dt"

# Ver usuarios
psql -U postgres -d solucionatech -c "SELECT id, name, email, role FROM users;"

# Ver tickets
psql -U postgres -d solucionatech -c "SELECT id, title, status FROM tickets;"

# Reiniciar datos de prueba
psql -U postgres -d solucionatech -f src/database/seed.sql

# Logs del servidor
npm run dev
```

---

## 🐛 Solución de problemas

### Error: "password authentication failed"
- Verifica el password de PostgreSQL en `.env`
- Asegúrate de que PostgreSQL esté corriendo

### Error: "relation users does not exist"
- Ejecuta el schema.sql primero:
  ```bash
  psql -U postgres -d solucionatech -f src/database/schema.sql
  ```

### Error: "JWT_SECRET is not defined"
- Asegúrate de que el archivo `.env` exista
- Verifica que `JWT_SECRET` esté definido en `.env`

### Error: "Port 5000 already in use"
- Cambia el puerto en `.env`:
  ```env
  PORT=5001
  ```

---

## 📡 Endpoints disponibles

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (protegido)

### Health Check
- `GET /health` - Verificar que el servidor esté funcionando

---

## 📚 Siguiente paso

Una vez que el módulo de autenticación esté funcionando:

1. ✅ Autenticación completada
2. ⏭️ Implementar módulo de tickets
3. ⏭️ Integrar frontend con backend
4. ⏭️ Deploy
