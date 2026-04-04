/**
 * seed.sql
 * Datos de prueba para SolucionaTech
 */

-- Limpiar datos existentes
TRUNCATE TABLE ticket_messages CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================
-- USUARIOS DE PRUEBA
-- ============================================
INSERT INTO users (id, name, email, password, role, created_at) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Juan Perez',
    'juan@cliente.com',
    '$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq',
    'client',
    NOW() - INTERVAL '30 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Maria Gonzalez',
    'maria@cliente.com',
    '$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq',
    'client',
    NOW() - INTERVAL '25 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Carlos Ramirez',
    'carlos@cliente.com',
    '$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq',
    'client',
    NOW() - INTERVAL '20 days'
  );

INSERT INTO users (id, name, email, password, role, created_at) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010',
    'Ana Martinez',
    'ana@tecnico.com',
    '$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq',
    'technician',
    NOW() - INTERVAL '60 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    'Luis Torres',
    'luis@tecnico.com',
    '$2b$10$K7L/gZbdKVWqFx3mJ5fBxuKZmWZQxVnQ0XJXqmZZQXJXqmZZQXJXq',
    'technician',
    NOW() - INTERVAL '55 days'
  );

-- ============================================
-- TICKETS DE PRUEBA
-- ============================================

INSERT INTO tickets (id, title, description, status, category, client_id, technician_id, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'No puedo acceder a mi cuenta',
    'Olvide mi contraseña y el correo de recuperacion no me llega',
    'pending',
    'software',
    '550e8400-e29b-41d4-a716-446655440001',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Error al subir archivos',
    'Cuando intento subir un archivo PDF me sale un error 500',
    'pending',
    'software',
    '550e8400-e29b-41d4-a716-446655440002',
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
  );

INSERT INTO tickets (id, title, description, status, category, client_id, technician_id, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'Lentitud en el sistema',
    'El dashboard tarda mucho en cargar, mas de 30 segundos',
    'assigned',
    'software',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440010',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '6 hours'
  );

INSERT INTO tickets (id, title, description, status, category, client_id, technician_id, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Bug en el formulario de contacto',
    'El boton de enviar no funciona en moviles',
    'in_progress',
    'software',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440011',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 hour'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'Solicitud de nueva funcionalidad',
    'Me gustaria poder exportar los reportes en formato Excel',
    'in_progress',
    'general',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440010',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
  );

INSERT INTO tickets (id, title, description, status, category, client_id, technician_id, created_at, updated_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'Error 404 en pagina de perfil',
    'Al hacer click en Mi Perfil me sale error 404',
    'resolved',
    'software',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440011',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'Cambio de diseño en header',
    'El logo se ve pixelado en pantallas grandes',
    'resolved',
    'hardware',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440010',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  );

-- ============================================
-- VERIFICACION DE DATOS
-- ============================================

SELECT role, COUNT(*) as total
FROM users
GROUP BY role;

SELECT status, COUNT(*) as total
FROM tickets
GROUP BY status
ORDER BY total DESC;

SELECT category, COUNT(*) as total
FROM tickets
GROUP BY category
ORDER BY category;
