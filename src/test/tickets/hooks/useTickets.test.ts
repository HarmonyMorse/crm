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
        then: (callback: any) => Promise.resolve(finalResponse).then(callback)
    };

    // Add support for chaining and final resolution
    Object.keys(builder).forEach((key) => {
        vi.spyOn(builder, key);
        if (key !== 'then' && key !== 'single') {
            builder[key] = vi.fn().mockReturnValue(builder);
        } else if (key === 'single') {
            builder[key] = vi.fn().mockImplementation(() => Promise.resolve(finalResponse));
        }
    });

    // Override then to handle both direct calls and chained calls
    builder.then = (callback: any) => {
        if (typeof callback === 'function') {
            return Promise.resolve(finalResponse).then(callback);
        }
        return Promise.resolve(finalResponse);
    };

    // Add support for direct data access
    Object.defineProperty(builder, 'data', {
        get: () => finalResponse.data
    });

    Object.defineProperty(builder, 'error', {
        get: () => finalResponse.error
    });

    // Add support for promise-like behavior
    builder[Symbol.toStringTag] = 'Promise';
    builder.catch = (callback: any) => Promise.resolve(finalResponse).catch(callback);
    builder.finally = (callback: any) => Promise.resolve(finalResponse).finally(callback);

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
        id: '1',
        subject: 'Test Ticket 1',
        description: 'Test Description 1',
        status: TicketStatus.New,
        priority: PriorityLevel.Medium,
        created_by: 'user1',
        team_id: 'team1',
        created_at: '2025-01-21T20:43:31.063Z',
        updated_at: '2025-01-21T20:43:31.063Z'
    },
    {
        id: '2',
        subject: 'Test Ticket 2',
        description: 'Test Description 2',
        status: TicketStatus.Open,
        priority: PriorityLevel.High,
        created_by: 'user2',
        team_id: 'team1',
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
                    retry: false,
                    gcTime: 0,
                    staleTime: 0,
                    refetchOnWindowFocus: false,
                    refetchOnMount: false,
                    refetchOnReconnect: false
                }
            }
        });
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    it('should fetch tickets successfully', async () => {
        const mockResponse = { data: mockTickets, error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.tickets).toEqual(mockTickets);
        expect(result.current.error).toBeNull();
        expect(supabaseMock.select).toHaveBeenCalledWith('*, assignee:assigned_to(id, email), creator:created_by(id, email), team:team_id(id, name)');
    });

    it('should apply filters correctly', async () => {
        const mockResponse = { data: mockTickets, error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const params = {
            status: [TicketStatus.New],
            priority: [PriorityLevel.High],
            assignee: 'user1',
            team: 'team1',
            search: 'test',
            dateRange: {
                start: '2025-01-01',
                end: '2025-01-31'
            },
            sort: {
                field: 'created_at' as const,
                direction: 'asc' as const
            },
            page: 1,
            limit: 10
        };

        const { result } = renderHook(() => useTickets({ params }), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(supabaseMock.in).toHaveBeenCalledWith('status', params.status);
        expect(supabaseMock.in).toHaveBeenCalledWith('priority', params.priority);
        expect(supabaseMock.eq).toHaveBeenCalledWith('assigned_to', params.assignee);
        expect(supabaseMock.eq).toHaveBeenCalledWith('team_id', params.team);
        expect(supabaseMock.ilike).toHaveBeenCalledWith('subject', `%${params.search}%`);
        expect(supabaseMock.gte).toHaveBeenCalledWith('created_at', params.dateRange.start);
        expect(supabaseMock.lte).toHaveBeenCalledWith('created_at', params.dateRange.end);
        expect(supabaseMock.order).toHaveBeenCalledWith(params.sort.field, { ascending: true });
        expect(supabaseMock.range).toHaveBeenCalledWith(0, 9);
    });

    it('should create ticket successfully', async () => {
        const newTicket = {
            subject: 'New Ticket',
            description: 'New Description',
            status: TicketStatus.New,
            priority: PriorityLevel.Medium,
            created_by: 'user1',
            team_id: 'team1'
        };

        const mockResponse = { data: { ...newTicket, id: '3' }, error: null };
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
            id: '1',
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

        const { id, ...updateData } = updates;
        expect(supabaseMock.update).toHaveBeenCalledWith(updateData);
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', id);
        expect(supabaseMock.select).toHaveBeenCalledWith('*');
    });

    it('should delete ticket successfully', async () => {
        const mockResponse = { error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await act(async () => {
            await result.current.deleteTicket.mutateAsync('1');
        });

        expect(supabaseMock.delete).toHaveBeenCalled();
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should handle fetch error', async () => {
        const mockError = new Error('Error loading tickets. Please try again later.');
        const mockResponse = { data: null, error: mockError };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTickets(), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.tickets).toBeUndefined();
        expect(result.current.error).toEqual(mockError);
    });
}); 