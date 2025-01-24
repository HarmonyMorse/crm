-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS custom_field_definitions CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS custom_field_type CASCADE;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE message_type AS ENUM ('customer', 'agent', 'system');
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'date', 'boolean', 'select');

-- Create users table (separate from auth.users for additional fields)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role NOT NULL
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Create custom field definitions table
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  field_type custom_field_type NOT NULL,
  required BOOLEAN DEFAULT false,
  options JSONB, -- For select type fields to store options
  active BOOLEAN DEFAULT true,
  UNIQUE(name)
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'low',
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  note_detail TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_history table
CREATE TABLE ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type message_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX idx_tickets_assigned_team_id ON tickets(assigned_team_id);
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_notes_ticket_id ON notes(ticket_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_read_own ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

-- Tickets table policies
CREATE POLICY tickets_select_customer ON tickets
  FOR SELECT USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

CREATE POLICY tickets_insert_customer ON tickets
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

CREATE POLICY tickets_update_customer ON tickets
  FOR UPDATE USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

-- Notes table policies
CREATE POLICY notes_select_authorized ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND u.role IN ('admin', 'agent')
        )
      )
    )
  );

CREATE POLICY notes_insert_authorized ON notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND u.role IN ('admin', 'agent')
        )
      )
    )
  );

-- Ticket history policies
CREATE POLICY ticket_history_select_authorized ON ticket_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND u.role IN ('admin', 'agent')
        )
      )
    )
  );

CREATE POLICY ticket_history_insert_authorized ON ticket_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND u.role IN ('admin', 'agent')
        )
      )
    )
  );

-- Teams and team_members policies (only admin/agent access)
CREATE POLICY teams_admin_all ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

CREATE POLICY team_members_admin_all ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'agent')
    )
  );

-- Teams table policies
CREATE POLICY teams_select_all ON teams
  FOR SELECT USING (true);

CREATE POLICY teams_insert_admin ON teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY teams_update_admin ON teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY teams_delete_admin ON teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Team members policies
CREATE POLICY team_members_select_all ON team_members
  FOR SELECT USING (true);

CREATE POLICY team_members_insert_admin ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY team_members_delete_admin ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Update tickets policies to include team assignment
CREATE POLICY tickets_update_assigned ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR
        (u.role = 'agent' AND (
          u.id = assigned_agent_id OR
          EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = u.id
            AND tm.team_id = assigned_team_id
          )
        ))
      )
    )
  );

-- Custom field definitions policies
CREATE POLICY custom_field_definitions_select_all ON custom_field_definitions
  FOR SELECT USING (true);

CREATE POLICY custom_field_definitions_modify_admin ON custom_field_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );
