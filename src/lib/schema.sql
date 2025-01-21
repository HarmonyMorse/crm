-- Purpose: A simplified schema that removes the "profiles" table and relies on auth.users instead

-- Drop the vector extension if it exists
DROP EXTENSION IF EXISTS vector CASCADE;

-- Cleanup existing schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions in public schema
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) AS args
        FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;

    -- Drop all tables in public schema
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all custom types
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typtype = 'e'
    )
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create ENUMs (excluding any user_role since profiles are removed)
CREATE TYPE ticket_status AS ENUM ('new', 'open', 'pending', 'on_hold', 'solved', 'closed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE article_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE team_role AS ENUM ('member', 'lead', 'admin');

-- Create tables without foreign keys first
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  lead_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Replaces "profile_teams" with "user_teams",
-- referencing auth.users directly instead of profiles
CREATE TABLE user_teams (
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, team_id)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  assignee_user_id UUID,
  customer_user_id UUID NOT NULL,
  team_id UUID,
  category_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_subject CHECK (char_length(subject) >= 3)
);

CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID,
  user_id UUID,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  parent_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID,
  author_user_id UUID NOT NULL,
  status article_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', content), 'B')
  ) STORED
);

CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE (article_id, version)
);

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(content_type, content_id)
);

-- Now add foreign keys, referencing auth.users(id) directly
ALTER TABLE teams
  ADD CONSTRAINT teams_lead_user_id_fkey 
  FOREIGN KEY (lead_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE user_teams
  ADD CONSTRAINT user_teams_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_teams_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_assignee_user_id_fkey 
  FOREIGN KEY (assignee_user_id) REFERENCES auth.users(id),
  ADD CONSTRAINT tickets_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id),
  ADD CONSTRAINT tickets_customer_user_id_fkey 
  FOREIGN KEY (customer_user_id) REFERENCES auth.users(id),
  ADD CONSTRAINT tickets_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE ticket_comments
  ADD CONSTRAINT ticket_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  ADD CONSTRAINT ticket_comments_ticket_id_fkey 
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE articles
  ADD CONSTRAINT articles_author_user_id_fkey
  FOREIGN KEY (author_user_id) REFERENCES auth.users(id);

ALTER TABLE article_versions
  ADD CONSTRAINT article_versions_article_id_fkey
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  ADD CONSTRAINT article_versions_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX idx_teams_lead_user_id ON teams(lead_user_id);

CREATE INDEX idx_user_teams_role ON user_teams(role);

CREATE INDEX idx_tickets_customer_user_id ON tickets(customer_user_id);
CREATE INDEX idx_tickets_assignee_user_id ON tickets(assignee_user_id);
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_author_user_id ON articles(author_user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_search_vector ON articles USING gin(search_vector);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON ticket_comments(user_id);

CREATE INDEX idx_embeddings_content_type_id ON embeddings(content_type, content_id);

-- Additional indexes for common queries and foreign keys
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_updated_at ON tickets(updated_at DESC);
CREATE INDEX idx_ticket_comments_parent_id ON ticket_comments(parent_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_updated_at ON articles(updated_at DESC);
CREATE INDEX idx_article_versions_article_id_version 
  ON article_versions(article_id, version DESC);

-- Enable RLS for tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Teams policies
DROP POLICY IF EXISTS "Teams are viewable by members" ON teams;
DROP POLICY IF EXISTS "Teams can be created by authenticated users" ON teams;
DROP POLICY IF EXISTS "Teams can be updated by team leads" ON teams;

CREATE POLICY "Teams are viewable by authenticated users"
ON teams FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teams can be created by authenticated users"
ON teams FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teams can be updated by team leads or creators"
ON teams FOR UPDATE
USING (
  auth.uid() = lead_user_id
  OR EXISTS (
    SELECT 1
    FROM user_teams ut
    WHERE ut.team_id = id
      AND ut.user_id = auth.uid()
      AND ut.role IN ('lead', 'admin')
  )
);

-- User Teams policies
DROP POLICY IF EXISTS "User teams are viewable by team members" ON user_teams;
DROP POLICY IF EXISTS "User teams can be created by authenticated users" ON user_teams;

CREATE POLICY "User teams are viewable by authenticated users"
ON user_teams FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "User teams can be created by team leads or self"
ON user_teams FOR INSERT
WITH CHECK (
  -- Users can add themselves
  user_id = auth.uid()
  OR
  -- Team leads can add others
  EXISTS (
    SELECT 1
    FROM teams t
    WHERE t.id = team_id
      AND t.lead_user_id = auth.uid()
  )
);

-- Tickets policies
CREATE POLICY "Tickets are viewable by assigned team members and customers"
ON tickets FOR SELECT
USING (
  customer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM user_teams ut
    WHERE ut.team_id = tickets.team_id
      AND ut.user_id = auth.uid()
  )
);

-- Comments policies
CREATE POLICY "Comments are viewable by ticket participants"
ON ticket_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_comments.ticket_id
      AND (
        t.customer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM user_teams ut
          WHERE ut.team_id = t.team_id
            AND ut.user_id = auth.uid()
        )
      )
  )
);

-- Articles policies
CREATE POLICY "Published articles are viewable by everyone"
ON articles FOR SELECT
USING (status = 'published');

CREATE POLICY "Articles are editable by team members"
ON articles FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM user_teams ut
    WHERE ut.user_id = auth.uid()
      AND ut.role IN ('admin', 'lead')
  )
);

-- No trigger or function needed for new user creation,
-- as we no longer store user data in a separate profiles table 