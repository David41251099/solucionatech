/**
 * schema.sql (version segura + verificacion)
 * SolucionaTech MVP
 */

-- ============================================
-- EXTENSION UUID
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'technician')),
  phone VARCHAR(20),
  address TEXT,
  city TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS city TEXT;

UPDATE users
SET city = 'Bucaramanga'
WHERE city IS NULL;

ALTER TABLE users
  ALTER COLUMN city SET NOT NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_city_check;

ALTER TABLE users
  ADD CONSTRAINT users_city_check
  CHECK (city IN ('Piedecuesta', 'Bucaramanga', 'Floridablanca', 'Girón'));

-- ============================================
-- TABLA: tickets
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),

  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'hardware', 'software', 'network')),

  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  city TEXT NOT NULL,

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
CREATE INDEX IF NOT EXISTS idx_tickets_city ON tickets(city);

-- ============================================
-- MIGRACION SEGURA (BD EXISTENTE)
-- ============================================
ALTER TABLE tickets DROP COLUMN IF EXISTS priority;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS city TEXT;
UPDATE tickets SET category = 'general' WHERE category IS NULL;
UPDATE tickets SET city = 'Bucaramanga' WHERE city IS NULL;
ALTER TABLE tickets ALTER COLUMN category SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN city SET NOT NULL;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled'));
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_category_check
  CHECK (category IN ('general', 'hardware', 'software', 'network'));
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_city_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_city_check
  CHECK (city IN ('Piedecuesta', 'Bucaramanga', 'Floridablanca', 'Girón'));
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
CREATE INDEX IF NOT EXISTS idx_tickets_city ON tickets(city);

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

