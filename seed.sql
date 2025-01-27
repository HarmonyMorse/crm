-- Insert users
INSERT INTO users (id, email, role, name) VALUES
    ('78cfc8a3-28de-4cf4-b722-459f8f5fea90', 'admin@mycrm.com', 'admin', 'Admin User'),
    ('574f02f3-f774-4379-a7dc-fa46a6cf72a8', 'agent@mycrm.com', 'agent', 'Support Agent'),
    ('8fcaa60a-0474-47eb-94d6-5c5666eecd7f', 'customer1@mycrm.com', 'customer', 'Customer One'),
    ('e7fe2725-f69a-4794-bc12-eb7756244878', 'customer2@mycrm.com', 'customer', 'Customer Two'),
    ('9cdc0a1b-db38-423f-ada2-1d51bd9b5c12', 'customer3@mycrm.com', 'customer', 'Customer Three');

-- Insert teams
INSERT INTO teams (id, name) VALUES
    ('d2d4f26e-1b12-4c34-a78b-ba8e5ff33455', 'Technical Support'),
    ('f9c3a7d1-5e2b-4b41-8c9d-c8e4b4e9f6a3', 'Billing Support');

-- Add agent to teams
INSERT INTO team_members (team_id, user_id) VALUES
    ('d2d4f26e-1b12-4c34-a78b-ba8e5ff33455', '574f02f3-f774-4379-a7dc-fa46a6cf72a8');

-- Insert custom field definitions
INSERT INTO custom_field_definitions (id, name, field_type, required, options, active) VALUES
    ('b5d1c6a3-4e2f-4b8d-9c7a-d8e5f3a4b5c6', 'Product Version', 'select', true, '["v1.0", "v2.0", "v3.0"]'::jsonb, true),
    ('c6e2d7b4-5f3a-4c9e-8d8b-e9f4a5b6c7d8', 'Browser', 'text', false, null, true),
    ('d7f3e8c5-6a4b-4d0f-9e9c-f0a5b6c7d8e9', 'Operating System', 'select', true, '["Windows", "macOS", "Linux", "iOS", "Android"]'::jsonb, true),
    ('e8a4f9d6-7b5c-4e1a-af0d-a1b6c7d8e9f0', 'Expected Resolution Date', 'date', false, null, true),
    ('f9b5a0e7-8c6d-4f2b-ba1e-b2c7d8e9f0a1', 'Is Urgent', 'boolean', false, null, true);

-- Insert sample tickets
INSERT INTO tickets (
    id,
    title,
    description,
    status,
    priority,
    customer_id,
    assigned_agent_id,
    assigned_team_id,
    tags,
    custom_fields
) VALUES
    (
        'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
        'Cannot access dashboard',
        'I am unable to access the dashboard after the recent update.',
        'open',
        'high',
        '8fcaa60a-0474-47eb-94d6-5c5666eecd7f',
        '574f02f3-f774-4379-a7dc-fa46a6cf72a8',
        'd2d4f26e-1b12-4c34-a78b-ba8e5ff33455',
        ARRAY['access', 'dashboard', 'urgent'],
        '{
            "Product Version": {"type": "select", "value": "v2.0"},
            "Browser": {"type": "text", "value": "Chrome 120"},
            "Operating System": {"type": "select", "value": "Windows"},
            "Is Urgent": {"type": "boolean", "value": true}
        }'::jsonb
    ),
    (
        'b2c3d4e5-f6a7-5b8c-9d0e-f1a2b3c4d5e6',
        'Billing issue with subscription',
        'I was charged twice for my monthly subscription.',
        'pending',
        'medium',
        'e7fe2725-f69a-4794-bc12-eb7756244878',
        null,
        'f9c3a7d1-5e2b-4b41-8c9d-c8e4b4e9f6a3',
        ARRAY['billing', 'subscription'],
        '{
            "Expected Resolution Date": {"type": "date", "value": "2024-02-15"}
        }'::jsonb
    ),
    (
        'c3d4e5f6-a7b8-6c9d-0e1f-a2b3c4d5e6f7',
        'Feature request: Dark mode',
        'Would love to see a dark mode option in the app.',
        'open',
        'low',
        '9cdc0a1b-db38-423f-ada2-1d51bd9b5c12',
        null,
        'd2d4f26e-1b12-4c34-a78b-ba8e5ff33455',
        ARRAY['feature-request', 'ui'],
        '{
            "Product Version": {"type": "select", "value": "v3.0"},
            "Operating System": {"type": "select", "value": "macOS"},
            "Is Urgent": {"type": "boolean", "value": false}
        }'::jsonb
    );

-- Insert some ticket history
INSERT INTO ticket_history (ticket_id, user_id, message, message_type) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', '8fcaa60a-0474-47eb-94d6-5c5666eecd7f', 'Ticket created', 'customer'),
    ('a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', '574f02f3-f774-4379-a7dc-fa46a6cf72a8', 'Investigating the issue', 'agent'),
    ('b2c3d4e5-f6a7-5b8c-9d0e-f1a2b3c4d5e6', 'e7fe2725-f69a-4794-bc12-eb7756244878', 'Ticket created', 'customer'),
    ('c3d4e5f6-a7b8-6c9d-0e1f-a2b3c4d5e6f7', '9cdc0a1b-db38-423f-ada2-1d51bd9b5c12', 'Ticket created', 'customer');

-- Insert some notes
INSERT INTO notes (ticket_id, user_id, note_detail) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', '574f02f3-f774-4379-a7dc-fa46a6cf72a8', 'Checked logs - seeing 403 errors'),
    ('b2c3d4e5-f6a7-5b8c-9d0e-f1a2b3c4d5e6', '78cfc8a3-28de-4cf4-b722-459f8f5fea90', 'Contacted billing department for investigation'); 