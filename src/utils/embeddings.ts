import { supabase } from '../lib/supabaseClient'

export async function generateEmbeddings(ticketId: string, title: string, description: string) {
    try {
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
            body: { ticketId, title, description }
        })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error generating embeddings:', error)
        throw error
    }
} 