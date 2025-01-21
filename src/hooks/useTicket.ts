import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ITicket, ITicketComment } from '../types/ticket.types';

const TICKET_QUERY_KEY = 'ticket';
const TICKET_COMMENTS_QUERY_KEY = 'ticket-comments';

interface UseTicketOptions {
    enabled?: boolean;
}

export const useTicket = (ticketId: string, { enabled = true }: UseTicketOptions = {}) => {
    const queryClient = useQueryClient();

    // Fetch single ticket with related data
    const {
        data: ticket,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: [TICKET_QUERY_KEY, ticketId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, assignee:assigned_to(id, email), creator:created_by(id, email), team:team_id(id, name)')
                .eq('id', ticketId)
                .single();

            if (error) {
                throw new Error('Error loading ticket. Please try again later.');
            }

            return data;
        },
        enabled: enabled && !!ticketId
    });

    // Fetch ticket comments
    const {
        data: comments,
        isLoading: isLoadingComments,
        error: commentsError
    } = useQuery({
        queryKey: [TICKET_COMMENTS_QUERY_KEY, ticketId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ticket_comments')
                .select('*, creator:created_by(id, email)')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error('Error loading comments. Please try again later.');
            }

            return data;
        },
        enabled: enabled && !!ticketId
    });

    // Add comment mutation
    const addComment = useMutation({
        mutationFn: async (comment: Omit<ITicketComment, 'id' | 'ticket_id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('ticket_comments')
                .insert([{ ...comment, ticket_id: ticketId }])
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKET_COMMENTS_QUERY_KEY, ticketId] });
        }
    });

    // Update comment mutation
    const updateComment = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const { data, error } = await supabase
                .from('ticket_comments')
                .update({ content })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKET_COMMENTS_QUERY_KEY, ticketId] });
        }
    });

    // Delete comment mutation
    const deleteComment = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('ticket_comments')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKET_COMMENTS_QUERY_KEY, ticketId] });
        }
    });

    return {
        ticket,
        isLoading,
        error,
        refetch,
        comments,
        isLoadingComments,
        commentsError,
        addComment,
        updateComment,
        deleteComment
    };
}; 