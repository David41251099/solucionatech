/**
 * schema.sql (version segura + verificacion)
 * SolucionaTech MVP
 */

-- ============================================
-- EXTENSION UUID
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'technician')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLA: tickets
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),

  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'hardware', 'software', 'network')),

  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,

  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician_id ON tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================
-- MIGRACION SEGURA (BD EXISTENTE)
-- ============================================
ALTER TABLE tickets DROP COLUMN IF EXISTS priority;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
UPDATE tickets SET category = 'general' WHERE category IS NULL;
ALTER TABLE tickets ALTER COLUMN category SET NOT NULL;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled'));
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_category_check
  CHECK (category IN ('general', 'hardware', 'software', 'network'));
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_technician_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_technician_check
  CHECK (
    (status = 'pending' AND technician_id IS NULL)
    OR (status IN ('assigned', 'in_progress') AND technician_id IS NOT NULL)
    OR (status IN ('resolved', 'cancelled'))
  );

DROP INDEX IF EXISTS idx_tickets_priority;
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);

-- ============================================
-- FUNCION: updated_at automatico
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (crear solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_tickets_updated_at'
  ) THEN
    CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ============================================
-- TABLA: ticket_messages
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT,
  attachment_url TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  system_event TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

UPDATE ticket_messages
SET type = 'text'
WHERE type IS NULL;

ALTER TABLE ticket_messages
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS system_event TEXT;

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at DESC);

-- ============================================
-- VERIFICACION COMPLETA (PARA pgAdmin)
-- ============================================

-- 1. Ver tablas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver columnas de cada tabla
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Ver constraints (CHECK, FK, PK)
SELECT conname AS constraint_name,
       conrelid::regclass AS table_name,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace;

-- 4. Ver valores permitidos en CHECK (status y category)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'tickets'::regclass;

-- 5. Ver triggers
SELECT tgname AS trigger_name,
       relname AS table_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE NOT tgisinternal;

-- 6. Conteo de registros por tabla
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION
SELECT 'tickets', COUNT(*) FROM tickets
UNION
SELECT 'ticket_messages', COUNT(*) FROM ticket_messages;
