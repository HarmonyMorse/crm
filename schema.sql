DROP TABLE IF EXISTS tickets CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE ticket_status AS ENUM (
  'new',
  'closed'
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'new',
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
