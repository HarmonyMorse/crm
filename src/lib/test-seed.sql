-- Insert two users with valid UUIDs:
INSERT INTO auth.users (id, email) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user1@example.com'), 
  ('22222222-2222-2222-2222-222222222222', 'user2@example.com');

-- Insert one team with a valid UUID, referencing user1’s UUID as the lead:
INSERT INTO teams (id, name, description, lead_user_id) 
VALUES (
  '33333333-3333-3333-3333-333333333333', 
  'Test Team', 
  'A seed test team', 
  '11111111-1111-1111-1111-111111111111'
);

-- Insert user_teams records to link the two users with the team:
INSERT INTO user_teams (user_id, team_id, role) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'lead'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'member');

-- Insert tickets referencing those user and team UUIDs:
INSERT INTO tickets (
  id, subject, description, status, priority, customer_user_id, team_id
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444', 
    'Test Ticket 1', 
    'Test Description 1', 
    'new', 
    'medium', 
    '11111111-1111-1111-1111-111111111111', 
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 
    'Test Ticket 2', 
    'Test Description 2', 
    'open', 
    'high', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333'
  );

-- Insert ticket_comments referencing valid ticket and user UUIDs:
INSERT INTO ticket_comments (
  id, ticket_id, user_id, content, is_internal
)
VALUES
  (
    '66666666-6666-6666-6666-666666666666', 
    '44444444-4444-4444-4444-444444444444', 
    '11111111-1111-1111-1111-111111111111', 
    'Test Comment 1', 
    false
  ),
  (
    '77777777-7777-7777-7777-777777777777', 
    '44444444-4444-4444-4444-444444444444', 
    '22222222-2222-2222-2222-222222222222', 
    'Test Comment 2', 
    true
  );
