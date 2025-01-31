import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Test cases with different filter scenarios
const testCases = [
    { query: "Find all high priority tickets about billing from last week", expectedFilters: { priority: 'high', mention: 'billing' } },
    { query: "Show me open tickets related to login issues", expectedFilters: { status: 'open', mention: 'login' } },
    { query: "Get pending tickets about mobile app crashes", expectedFilters: { status: 'pending', mention: 'mobile app crashes' } },
    { query: "Find urgent tickets created in the last 3 days", expectedFilters: { priority: 'high' } },
    { query: "Show me resolved tickets about payment gateway", expectedFilters: { status: 'resolved', mention: 'payment gateway' } },
    { query: "Get all medium priority tickets about performance", expectedFilters: { priority: 'medium', mention: 'performance' } },
    { query: "Find tickets about dark mode feature requests", expectedFilters: { mention: 'dark mode feature requests' } },
    { query: "Show me open high priority tickets", expectedFilters: { status: 'open', priority: 'high' } },
    { query: "Get tickets about two-factor authentication issues", expectedFilters: { mention: 'two-factor authentication' } },
    { query: "Find pending tickets about export functionality", expectedFilters: { status: 'pending', mention: 'export functionality' } },
    { query: "Show me tickets about incorrect billing amounts", expectedFilters: { mention: 'incorrect billing amounts' } },
    { query: "Get all tickets about mobile app UI issues", expectedFilters: { mention: 'mobile app UI issues' } },
    { query: "Find high priority tickets about API timeouts", expectedFilters: { priority: 'high', mention: 'API timeouts' } },
    { query: "Show me open tickets about calendar sync problems", expectedFilters: { status: 'open', mention: 'calendar sync' } },
    { query: "Get tickets about font size issues in mobile app", expectedFilters: { mention: 'font size issues' } },
    { query: "Find resolved tickets about analytics dashboard", expectedFilters: { status: 'resolved', mention: 'analytics dashboard' } },
    { query: "Show me tickets about email notifications being marked as spam", expectedFilters: { mention: 'email notifications being marked as spam' } },
    { query: "Get all tickets about third-party integrations", expectedFilters: { mention: 'third-party integrations' } },
    { query: "Find pending tickets about password reset functionality", expectedFilters: { status: 'pending', mention: 'password reset' } },
    { query: "Show me high priority tickets about mobile app responsiveness", expectedFilters: { priority: 'high', mention: 'mobile app responsiveness' } }
];


const TEST_USER_EMAIL = 'admin@mycrm.com';
const TEST_USER_PASSWORD = '12qw!@QW';

async function authenticateTestUser() {
    // First try to sign in
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
    });

    // If sign in fails, try to sign up
    if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD
        });

        if (signUpError) {
            throw new Error(`Authentication failed: ${signUpError.message}`);
        }
        return signUpData.user;
    }

    return signInData.user;
}

async function runTestCases() {
    try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Authentication failed');
        }

        let passed = 0;
        let failed = 0;

        for (const testCase of testCases) {
            try {
                console.log(`Running test case: ${testCase.query}`);

                const { data: functionResponse, error: invokeError } = await supabase.functions.invoke('filter-tickets', {
                    body: {
                        query: testCase.query,
                        userId: user.id,
                        skipMetrics: false
                    }
                });

                if (invokeError) {
                    throw invokeError;
                }

                const parsedResponse = typeof functionResponse === 'string'
                    ? JSON.parse(functionResponse)
                    : functionResponse;

                // Verify the parsed filters match expectations
                const filtersMatch = Object.keys(testCase.expectedFilters).every(key =>
                    parsedResponse.parsedFilters[key] === testCase.expectedFilters[key]
                );

                if (filtersMatch) {
                    console.log(`✅ Test passed: ${testCase.query}`);
                    passed++;
                } else {
                    console.log(`❌ Test failed: ${testCase.query}`);
                    console.log('Expected:', testCase.expectedFilters);
                    console.log('Actual:', parsedResponse.parsedFilters);
                    failed++;
                }
            } catch (error) {
                console.error(`❌ Test failed: ${testCase.query}`, error);
                failed++;
            }
        }

        console.log(`\nTest results: ${passed} passed, ${failed} failed`);
    } catch (error) {
        console.error('Error running test cases:', error);
        process.exit(1);
    }
}

authenticateTestUser().then(() => runTestCases());