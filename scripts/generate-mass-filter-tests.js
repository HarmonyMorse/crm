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
    { query: "Find all high priority tickets about billing from last week" },
    { query: "Show me open tickets related to login issues" },
    { query: "Get pending tickets about mobile app crashes" },
    { query: "Find urgent tickets created in the last 3 days" },
    { query: "Show me resolved tickets about payment gateway" },
    { query: "Get all medium priority tickets about performance" },
    { query: "Find tickets about dark mode feature requests" },
    { query: "Show me open high priority tickets" },
    { query: "Get tickets about two-factor authentication issues" },
    { query: "Find pending tickets about export functionality" },
    { query: "Show me tickets about incorrect billing amounts" },
    { query: "Get all tickets about mobile app UI issues" },
    { query: "Find high priority tickets about API timeouts" },
    { query: "Show me open tickets about calendar sync problems" },
    { query: "Get tickets about font size issues in mobile app" },
    { query: "Find resolved tickets about analytics dashboard" },
    { query: "Show me tickets about email notifications being marked as spam" },
    { query: "Get all tickets about third-party integrations" },
    { query: "Find pending tickets about password reset functionality" },
    { query: "Show me high priority tickets about mobile app responsiveness" }
];

async function runTestCases() {
    try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Authentication failed');
        }

        for (const testCase of testCases) {
            try {
                console.log(`Running test case: ${testCase.query}`);

                const { data: functionResponse, error: invokeError } = await supabase.functions.invoke('filter-tickets', {
                    body: {
                        query: testCase.query,
                        userId: user.id
                    }
                });

                if (invokeError) {
                    throw invokeError;
                }

                const parsedResponse = typeof functionResponse === 'string'
                    ? JSON.parse(functionResponse)
                    : functionResponse;

                console.log(`✅ Test case executed: ${testCase.query}`);
                console.log('Response:', {
                    matchedCount: parsedResponse.metrics?.matched_count,
                    filtersApplied: Object.keys(parsedResponse.parsedFilters || {}).length,
                    filterId: parsedResponse.filterId
                });
            } catch (error) {
                console.error(`❌ Test case failed: ${testCase.query}`, error);
            }
        }

        console.log('\nAll test cases executed. Check the database for metrics.');
    } catch (error) {
        console.error('Error running test cases:', error);
        process.exit(1);
    }
}

runTestCases(); 