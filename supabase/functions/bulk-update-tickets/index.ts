import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface TicketUpdate {
  id: string;
  [key: string]: any;
}

interface RequestBody {
  tickets: TicketUpdate[];
  updates: {
    [key: string]: any;
  };
  reason?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { tickets, updates, reason } = await req.json() as RequestBody;

    if (!tickets?.length || !updates) {
      return new Response(
        JSON.stringify({ error: 'Missing tickets or updates in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Start a transaction
    const { data: result, error: transactionError } = await supabaseClient.rpc(
      'bulk_update_tickets',
      {
        p_ticket_ids: tickets.map(t => t.id),
        p_updates: updates,
        p_reason: reason || 'Bulk update via UI',
      }
    );

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      throw transactionError;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Successfully updated ${tickets.length} tickets`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during the bulk update',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 
