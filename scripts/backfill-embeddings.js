import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '../.env' })

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.VITE_OPENAI_API_KEY
})

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function generateEmbedding(title, description) {
    const text = `${title} ${description}`.trim()
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    })
    return response.data[0].embedding
}

async function backfillEmbeddings() {
    try {
        // Get all tickets without embeddings
        const { data: tickets, error: fetchError } = await supabase
            .from('tickets')
            .select('id, title, description')
            .is('embedding', null)

        if (fetchError) throw fetchError

        console.log(`Found ${tickets.length} tickets without embeddings`)

        // Process tickets in batches to avoid rate limits
        const batchSize = 5
        for (let i = 0; i < tickets.length; i += batchSize) {
            const batch = tickets.slice(i, i + batchSize)

            console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(tickets.length / batchSize)}`)

            await Promise.all(batch.map(async (ticket) => {
                try {
                    const embedding = await generateEmbedding(ticket.title, ticket.description || '')

                    const { error: updateError } = await supabase
                        .from('tickets')
                        .update({ embedding })
                        .eq('id', ticket.id)

                    if (updateError) throw updateError

                    console.log(`Updated embedding for ticket ${ticket.id}`)
                } catch (error) {
                    console.error(`Error processing ticket ${ticket.id}:`, error)
                }
            }))

            // Add a small delay between batches to respect rate limits
            if (i + batchSize < tickets.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        console.log('Finished backfilling embeddings')
    } catch (error) {
        console.error('Error during backfill:', error)
        process.exit(1)
    }
}

backfillEmbeddings()