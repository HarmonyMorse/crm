import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ITicket, ITicketListParams } from '../types/ticket.types';

const TICKETS_QUERY_KEY = 'tickets';

interface UseTicketsOptions {
    params?: ITicketListParams;
    enabled?: boolean;
}

export const useTickets = ({ params, enabled = true }: UseTicketsOptions = {}) => {
    const queryClient = useQueryClient();

    // Fetch tickets with filtering, sorting, and pagination
    const {
        data: tickets,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: [TICKETS_QUERY_KEY, params],
        queryFn: async () => {
            let query = supabase
                .from('tickets')
                .select('*, assignee:assigned_to(id, email), creator:created_by(id, email), team:team_id(id, name)');

            // Apply filters
            if (params?.status?.length) {
                query = query.in('status', params.status);
            }
            if (params?.priority?.length) {
                query = query.in('priority', params.priority);
            }
            if (params?.assignee) {
                query = query.eq('assigned_to', params.assignee);
            }
            if (params?.team) {
                query = query.eq('team_id', params.team);
            }
            if (params?.search) {
                query = query.ilike('subject', `%${params.search}%`);
            }
            if (params?.dateRange) {
                query = query
                    .gte('created_at', params.dateRange.start)
                    .lte('created_at', params.dateRange.end);
            }
            if (params?.sort) {
                query = query.order(params.sort.field, { ascending: params.sort.direction === 'asc' });
            }

            // Apply pagination
            if (params?.page && params?.limit) {
                const start = (params.page - 1) * params.limit;
                const end = start + params.limit - 1;
                query = query.range(start, end);
            }

            const { data, error } = await query;

            if (error) {
                throw new Error('Error loading tickets. Please try again later.');
            }

            return data;
        },
        enabled
    });

    // Create ticket mutation
    const createTicket = useMutation({
        mutationFn: async (ticket: Omit<ITicket, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('tickets')
                .insert([ticket])
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
        }
    });

    // Update ticket mutation
    const updateTicket = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<ITicket> & { id: string }) => {
            const { data, error } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
        }
    });

    // Delete ticket mutation
    const deleteTicket = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('tickets')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
        }
    });

    return {
        tickets,
        isLoading,
        error,
        refetch,
        createTicket,
        updateTicket,
        deleteTicket
    };
}; 