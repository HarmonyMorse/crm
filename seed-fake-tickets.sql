-- Generate 50 realistic tickets for AI metrics testing
DO $$
DECLARE
    ticket_id UUID;
    customer_ids UUID[] := ARRAY[
        '8fcaa60a-0474-47eb-94d6-5c5666eecd7f', 
        'e7fe2725-f69a-4794-bc12-eb7756244878', 
        '9cdc0a1b-db38-423f-ada2-1d51bd9b5c12'
    ];
    agent_id UUID := '574f02f3-f774-4379-a7dc-fa46a6cf72a8';
    team_ids UUID[] := ARRAY[
        'd2d4f26e-1b12-4c34-a78b-ba8e5ff33455', 
        'f9c3a7d1-5e2b-4b41-8c9d-c8e4b4e9f6a3'
    ];
    statuses TEXT[] := ARRAY['open', 'pending', 'resolved'];
    priorities TEXT[] := ARRAY['low', 'medium', 'high'];
    product_versions TEXT[] := ARRAY['v1.0', 'v2.0', 'v3.0'];
    os_versions TEXT[] := ARRAY['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    browsers TEXT[] := ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'];
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
        ticket_id := uuid_generate_v4();
        
        INSERT INTO tickets (
            id, title, description, status, priority, 
            customer_id, assigned_agent_id, assigned_team_id,
            tags, custom_fields
        ) VALUES (
            ticket_id,
            -- Realistic ticket titles
            CASE floor(random() * 10)
                WHEN 0 THEN 'Login issues after recent update'
                WHEN 1 THEN 'Payment gateway not working'
                WHEN 2 THEN 'Feature request: Dark mode'
                WHEN 3 THEN 'Dashboard loading slowly'
                WHEN 4 THEN 'Incorrect billing amount'
                WHEN 5 THEN 'Two-factor authentication not working'
                WHEN 6 THEN 'Export functionality broken'
                WHEN 7 THEN 'Mobile app crashing on launch'
                WHEN 8 THEN 'Search results not accurate'
                ELSE 'Unable to upload large files'
            END,
            -- Detailed descriptions
            (
                -- First sentence
                CASE floor(random() * 20)
                    WHEN 0 THEN 'After the recent update, I''m unable to login to my account.'
                    WHEN 1 THEN 'The payment gateway is returning an error when I try to complete my purchase.'
                    WHEN 2 THEN 'I would love to see a dark mode option in the app.'
                    WHEN 3 THEN 'The dashboard takes over 30 seconds to load.'
                    WHEN 4 THEN 'I was charged twice for my monthly subscription.'
                    WHEN 5 THEN 'The two-factor authentication is not sending the verification code.'
                    WHEN 6 THEN 'When I try to export my data, the system crashes.'
                    WHEN 7 THEN 'The mobile app crashes immediately after launch.'
                    WHEN 8 THEN 'The search results are not accurate and don''t match my queries.'
                    WHEN 9 THEN 'I''m unable to upload files larger than 10 MB.'
                    WHEN 10 THEN 'The notification system is not working properly.'
                    WHEN 11 THEN 'I''m experiencing frequent timeouts when accessing the API.'
                    WHEN 12 THEN 'The calendar feature is not syncing with my other devices.'
                    WHEN 13 THEN 'The font size in the mobile app is too small to read.'
                    WHEN 14 THEN 'The analytics dashboard is showing incorrect data.'
                    WHEN 15 THEN 'The email notifications are being marked as spam.'
                    WHEN 16 THEN 'The integration with third-party services is broken.'
                    WHEN 17 THEN 'The password reset functionality is not working.'
                    WHEN 18 THEN 'The user interface is not responsive on mobile devices.'
                    ELSE 'The auto-save feature is not working as expected.'
                END || ' ' ||
                -- Second sentence
                CASE floor(random() * 20)
                    WHEN 0 THEN 'I''ve tried resetting my password but still no success.'
                    WHEN 1 THEN 'This is urgent as I need to complete this transaction.'
                    WHEN 2 THEN 'It would be easier on the eyes during night-time usage.'
                    WHEN 3 THEN 'This makes it impossible to work efficiently.'
                    WHEN 4 THEN 'Please investigate and refund the duplicate charge.'
                    WHEN 5 THEN 'I''m locked out of my account and need immediate assistance.'
                    WHEN 6 THEN 'This is critical as I need the data for a client meeting.'
                    WHEN 7 THEN 'I''ve tried reinstalling but the issue persists.'
                    WHEN 8 THEN 'This makes it hard to find what I need quickly.'
                    WHEN 9 THEN 'The documentation says the limit should be 100 MB.'
                    WHEN 10 THEN 'I''ve missed important updates because of this.'
                    WHEN 11 THEN 'This is affecting our production environment.'
                    WHEN 12 THEN 'I''ve tried multiple devices but the issue remains.'
                    WHEN 13 THEN 'This is causing eye strain during extended use.'
                    WHEN 14 THEN 'This is leading to incorrect business decisions.'
                    WHEN 15 THEN 'Important messages are being missed as a result.'
                    WHEN 16 THEN 'Our workflow is being severely impacted.'
                    WHEN 17 THEN 'I''ve tried multiple times but still can''t reset.'
                    WHEN 18 THEN 'This is making the app unusable on my phone.'
                    ELSE 'I''ve lost important work because of this issue.'
                END || ' ' ||
                -- Third sentence
                CASE floor(random() * 20)
                    WHEN 0 THEN 'This started happening after the latest update.'
                    WHEN 1 THEN 'I''ve already contacted support but haven''t heard back.'
                    WHEN 2 THEN 'This has been an ongoing issue for several days now.'
                    WHEN 3 THEN 'I''ve tried clearing my cache but it didn''t help.'
                    WHEN 4 THEN 'This is affecting multiple users in our organization.'
                    WHEN 5 THEN 'I''ve checked my spam folder but nothing is there.'
                    WHEN 6 THEN 'This is causing significant delays in our operations.'
                    WHEN 7 THEN 'I''ve tried different browsers but the problem persists.'
                    WHEN 8 THEN 'This is making the feature essentially unusable.'
                    WHEN 9 THEN 'I''ve followed all the troubleshooting steps without success.'
                    WHEN 10 THEN 'This is happening across multiple devices and platforms.'
                    WHEN 11 THEN 'I''ve checked the status page but there are no reported outages.'
                    WHEN 12 THEN 'This is causing frustration among our team members.'
                    WHEN 13 THEN 'I''ve tried adjusting settings but nothing seems to work.'
                    WHEN 14 THEN 'This is affecting our ability to make data-driven decisions.'
                    WHEN 15 THEN 'I''ve verified my email settings but the issue continues.'
                    WHEN 16 THEN 'This is preventing us from completing critical tasks.'
                    WHEN 17 THEN 'I''ve tried different networks but the problem remains.'
                    WHEN 18 THEN 'This is making the app inaccessible for our team.'
                    ELSE 'I''ve submitted multiple reports but haven''t seen any resolution.'
                END
            ),
            statuses[floor(random() * array_length(statuses, 1)) + 1]::ticket_status,
            priorities[floor(random() * array_length(priorities, 1)) + 1]::ticket_priority,
            customer_ids[floor(random() * array_length(customer_ids, 1)) + 1],
            CASE WHEN random() < 0.7 THEN agent_id ELSE NULL END,
            team_ids[floor(random() * array_length(team_ids, 1)) + 1],
            -- Relevant tags
            CASE floor(random() * 4)
                WHEN 0 THEN ARRAY['login', 'authentication']
                WHEN 1 THEN ARRAY['billing', 'payment']
                WHEN 2 THEN ARRAY['performance', 'loading']
                ELSE ARRAY['mobile', 'crash']
            END,
            -- Realistic custom fields
            jsonb_build_object(
                'Product Version', jsonb_build_object('type', 'select', 'value', product_versions[floor(random() * array_length(product_versions, 1)) + 1]),
                'Browser', jsonb_build_object('type', 'text', 'value', browsers[floor(random() * array_length(browsers, 1)) + 1] || ' ' || floor(random() * 100)),
                'Operating System', jsonb_build_object('type', 'select', 'value', os_versions[floor(random() * array_length(os_versions, 1)) + 1]),
                'Is Urgent', jsonb_build_object('type', 'boolean', 'value', random() < 0.3)
            )
        );

        -- Add ticket history
        INSERT INTO ticket_history (ticket_id, user_id, message, message_type)
        VALUES (
            ticket_id,
            customer_ids[floor(random() * array_length(customer_ids, 1)) + 1],
            'Ticket created',
            'customer'
        );

        -- Add notes for some tickets
        IF random() < 0.5 THEN
            INSERT INTO notes (ticket_id, user_id, note_detail)
            VALUES (
                ticket_id,
                agent_id,
                CASE floor(random() * 3)
                    WHEN 0 THEN 'Investigated the issue, found potential root cause'
                    WHEN 1 THEN 'Contacted relevant team for more information'
                    ELSE 'Waiting for customer response'
                END
            );
        END IF;
    END LOOP;
END;
$$;