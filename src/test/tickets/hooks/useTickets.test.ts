import React from 'react';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTickets } from '../../../hooks/useTickets';
import { PriorityLevel, TicketStatus, ITicketListParams } from '../../../types/ticket.types';
import { supabase } from '../../../lib/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a builder-style mock that properly chains
const createSupabaseMock = (finalResponse: any) => {
    const builder: any = {
        from: () => builder,
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        ilike: () => builder,
        range: () => builder,
        gte: () => builder,
        lte: () => builder,
        single: () => Promise.resolve(finalResponse),
    };

    // Add support for chaining and final resolution
    Object.keys(builder).forEach((key) => {
        vi.spyOn(builder, key);
        if (key !== 'then' && key !== 'single') {
            builder[key] = vi.fn().mockReturnValue(builder);
        }
    });

    // Make sure the builder itself is a Promise
    builder[Symbol.toStringTag] = 'Promise';

    // Override then to handle the data structure correctly
    builder.then = (resolve: any) => {
        if (typeof resolve === 'function') {
            // When used as a Promise, return just the data
            return Promise.resolve(finalResponse.data).then(resolve);
        }
        return Promise.resolve(finalResponse.data);
    };

    // Override catch to maintain the chain
    builder.catch = (reject: any) => {
        if (typeof reject === 'function' && finalResponse.error) {
            return Promise.reject(finalResponse.error).catch(reject);
        }
        return builder;
    };

    // Override single to return the response directly
    builder.single = () => {
        if (finalResponse.error) {
            return Promise.reject(finalResponse.error);
        }
        return Promise.resolve(finalResponse.data);
    };

    return builder;
};

// Mock supabase client
vi.mock('../../../lib/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

const mockTickets = [
    {
        id: '44444444-4444-4444-4444-444444444444',
        subject: 'Test Ticket 1',
        description: 'Test Description 1',
        status: TicketStatus.New,
        priority: PriorityLevel.Medium,
        customer_user_id: '11111111-1111-1111-1111-111111111111',
        team_id: '33333333-3333-3333-3333-333333333333',
        created_at: '2025-01-21T20:43:31.063Z',
        updated_at: '2025-01-21T20:43:31.063Z'
    },
    {
        id: '55555555-5555-5555-5555-555555555555',
        subject: 'Test Ticket 2',
        description: 'Test Description 2',
        status: TicketStatus.Open,
        priority: PriorityLevel.High,
        customer_user_id: '22222222-2222-2222-2222-222222222222',
        team_id: '33333333-3333-3333-3333-333333333333',
        created_at: '2025-01-21T20:43:31.063Z',
        updated_at: '2025-01-21T20:43:31.063Z'
    }
];

describe('useTickets', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false
                }
            }
        });
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    it('should fetch tickets successfully', async () => {
        const supabaseMock = createSupabaseMock({ data: mockTickets, error: null });
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.tickets).toEqual(mockTickets);
        expect(result.current.error).toBeNull();
        expect(supabaseMock.select).toHaveBeenCalledWith('*, assignee:assigned_to(id, email), creator:created_by(id, email), team:team_id(id, name)');
        expect(supabaseMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply filters correctly', async () => {
        const filters: ITicketListParams = {
            status: [TicketStatus.New],
            priority: [PriorityLevel.High],
            search: 'test',
            sort: {
                field: 'created_at',
                direction: 'desc'
            }
        };

        const supabaseMock = createSupabaseMock({ data: mockTickets, error: null });
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets({ params: filters }), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(supabaseMock.in).toHaveBeenCalledWith('status', filters.status);
        expect(supabaseMock.in).toHaveBeenCalledWith('priority', filters.priority);
        expect(supabaseMock.ilike).toHaveBeenCalledWith('subject', `%${filters.search}%`);
        expect(supabaseMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should create ticket successfully', async () => {
        const newTicket = {
            subject: 'New Ticket',
            description: 'New Description',
            status: TicketStatus.New,
            priority: PriorityLevel.Medium,
            customer_user_id: '11111111-1111-1111-1111-111111111111',
            team_id: '33333333-3333-3333-3333-333333333333'
        };

        const mockResponse = {
            data: {
                ...newTicket,
                id: '88888888-8888-8888-8888-888888888888'
            },
            error: null
        };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await act(async () => {
            await result.current.createTicket.mutateAsync(newTicket);
        });

        expect(supabaseMock.insert).toHaveBeenCalledWith([newTicket]);
        expect(supabaseMock.select).toHaveBeenCalledWith('*');
    });

    it('should update ticket successfully', async () => {
        const updates = {
            id: '44444444-4444-4444-4444-444444444444',
            subject: 'Updated Ticket',
            status: TicketStatus.Open
        };

        const mockResponse = { data: { ...mockTickets[0], ...updates }, error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await act(async () => {
            await result.current.updateTicket.mutateAsync(updates);
        });

        expect(supabaseMock.update).toHaveBeenCalledWith({ subject: updates.subject, status: updates.status });
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', updates.id);
        expect(supabaseMock.select).toHaveBeenCalledWith('*');
    });

    it('should delete ticket successfully', async () => {
        const mockResponse = { error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await act(async () => {
            await result.current.deleteTicket.mutateAsync('44444444-4444-4444-4444-444444444444');
        });

        expect(supabaseMock.delete).toHaveBeenCalled();
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', '44444444-4444-4444-4444-444444444444');
    });

    it('should handle fetch error', async () => {
        const mockError = { message: 'Error loading tickets. Please try again later.' };
        const supabaseMock = createSupabaseMock({ data: null, error: mockError });
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.tickets).toBeUndefined();
        expect(result.current.error).toEqual(mockError);
    });
}); 