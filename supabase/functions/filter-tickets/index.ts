import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
// If you plan to use LangChain:
// import { SomeLangChainModule } from "langchain"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface ParsedFilters {
  status?: string
  priority?: string
  mention?: string
  dateRange?: {
    start?: string
    end?: string
  }
}

// Example placeholder function to extract filters via OpenAI.
async function parseQueryWithAI(userQuery: string, openai: OpenAI): Promise<ParsedFilters> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Extract structured filters from natural language ticket queries. 
          Return a JSON object with these fields (all optional):
          {
            "status": string (e.g., "open", "pending", "closed"),
            "priority": string (e.g., "low", "medium", "high"),
            "dateRange": {
              "start": string (ISO date),
              "end": string (ISO date)
            },
            "mention": string (text to search in description)
          }
          
          Example:
          Query: "find urgent pending tickets about billing from last week"
          Response: {
            "status": "pending",
            "priority": "high",
            "dateRange": {
              "start": "2024-01-21",
              "end": "2024-01-28"
            },
            "mention": "billing"
          }`
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0].message.content) {
      return {} as ParsedFilters;
    }

    const parsedResponse = JSON.parse(completion.choices[0].message.content) as ParsedFilters;
    console.log('OpenAI parsed filters:', parsedResponse);
    return parsedResponse;
  } catch (err) {
    console.error('Error parsing with OpenAI:', err);
    return {} as ParsedFilters;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received request method:', req.method);
    
    // Pull environment variables for Supabase & OpenAI
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing Supabase configuration." 
        }),
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Set up OpenAI
    let openai: OpenAI | null = null
    if (openAIApiKey) {
      openai = new OpenAI({ apiKey: openAIApiKey })
    }

    // Read user query from request body
    let body;
    try {
      body = await req.json()
      console.log('Received request body:', body);
    } catch (err) {
      console.error('Error parsing request body:', err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request body - failed to parse JSON." 
        }),
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    const { query } = body;
    if (!query) {
      console.error('No query provided in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No query provided." 
        }), 
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Parse filters using AI
    let parsedFilters: ParsedFilters = {};
    try {
      if (openai) {
        parsedFilters = await parseQueryWithAI(query, openai);
      }
    } catch (err) {
      console.error('Error parsing query with AI:', err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse query with AI: " + err.message 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // Construct and execute Supabase query
    try {
      let supabaseQuery = supabase
        .from("tickets")
        .select(`
          id,
          created_at,
          updated_at,
          status,
          priority,
          title,
          description,
          customer_id,
          assigned_agent_id,
          assigned_team_id,
          tags,
          custom_fields
        `)

      // Apply filters
      if (parsedFilters.status) {
        supabaseQuery = supabaseQuery.eq("status", parsedFilters.status.toLowerCase())
      }
      if (parsedFilters.priority) {
        supabaseQuery = supabaseQuery.eq("priority", parsedFilters.priority.toLowerCase())
      }
      if (parsedFilters.mention) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${parsedFilters.mention}%,description.ilike.%${parsedFilters.mention}%`)
      }
      if (parsedFilters.dateRange) {
        if (parsedFilters.dateRange.start) {
          supabaseQuery = supabaseQuery.gte("created_at", parsedFilters.dateRange.start)
        }
        if (parsedFilters.dateRange.end) {
          supabaseQuery = supabaseQuery.lte("created_at", parsedFilters.dateRange.end)
        }
      }

      console.log('Executing Supabase query with filters:', parsedFilters);
      const { data, error: queryError } = await supabaseQuery
      
      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw queryError;
      }

      console.log(`Query returned ${data?.length || 0} results`);
      return new Response(
        JSON.stringify({
          success: true,
          data,
          parsedFilters,
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      )
    } catch (err) {
      console.error('Error executing Supabase query:', err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database query failed: " + err.message 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }
  } catch (err) {
    console.error('Unhandled error in Edge Function:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error: " + err.message 
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
