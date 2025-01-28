import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the request body
        const { ticketId, title, description } = await req.json()

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: Deno.env.get('OPENAI_API_KEY')
        })

        // Create text to embed (combine title and description)
        const textToEmbed = `${title} ${description}`.trim()

        // Generate embedding using text-embedding-ada-002
        const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textToEmbed,
        })

        const [{ embedding }] = response.data

        // Update the ticket with its embedding
        const { data, error } = await supabaseClient
            .from('tickets')
            .update({ embedding })
            .eq('id', ticketId)
            .select()

        if (error) throw error

        return new Response(
            JSON.stringify({ success: true, data }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
}) 
