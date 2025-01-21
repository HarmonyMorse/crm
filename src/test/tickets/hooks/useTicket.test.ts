import React from 'react';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTicket } from '../../../hooks/useTicket';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
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
        }
    });

    return builder;
};

// Mock supabase client
vi.mock('../../../lib/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

const mockTicket = {
    id: '44444444-4444-4444-4444-444444444444',
    subject: 'Test Ticket 1',
    description: 'Test Description 1',
    status: TicketStatus.New,
    priority: PriorityLevel.Medium,
    customer_user_id: '11111111-1111-1111-1111-111111111111',
    team_id: '33333333-3333-3333-3333-333333333333',
    created_at: '2025-01-21T20:43:31.062Z',
    updated_at: '2025-01-21T20:43:31.063Z'
};

const mockComments = [
    {
        id: '66666666-6666-6666-6666-666666666666',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        content: 'Test Comment 1',
        is_internal: false,
        user_id: '11111111-1111-1111-1111-111111111111',
        created_at: '2025-01-21T20:43:31.063Z',
        updated_at: '2025-01-21T20:43:31.063Z'
    },
    {
        id: '77777777-7777-7777-7777-777777777777',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        content: 'Test Comment 2',
        is_internal: true,
        user_id: '22222222-2222-2222-2222-222222222222',
        created_at: '2025-01-21T20:43:31.063Z',
        updated_at: '2025-01-21T20:43:31.063Z'
    }
];

describe('useTicket', () => {
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

    it('should fetch ticket successfully', async () => {
        const supabaseMock = createSupabaseMock({ data: mockTicket, error: null });
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.ticket).toEqual(mockTicket);
        expect(result.current.error).toBeNull();
        expect(supabaseMock.select).toHaveBeenCalledWith('*, assignee:assigned_to(id, email), creator:created_by(id, email), team:team_id(id, name)');
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should fetch comments successfully', async () => {
        const commentsMock = createSupabaseMock({ data: mockComments, error: null });
        (supabase.from as any).mockReturnValue(commentsMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await waitFor(() => !result.current.isLoadingComments);

        expect(result.current.comments).toEqual(mockComments);
        expect(commentsMock.select).toHaveBeenCalledWith('*, creator:created_by(id, email)');
        expect(commentsMock.eq).toHaveBeenCalledWith('ticket_id', '1');
    });

    it('should handle fetch error', async () => {
        const mockError = { message: 'Error loading ticket. Please try again later.' };
        const supabaseMock = createSupabaseMock({ data: null, error: mockError });
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await waitFor(() => !result.current.isLoading);

        expect(result.current.ticket).toBeUndefined();
        expect(result.current.error).toEqual(mockError);
    });

    it('should add comment successfully', async () => {
        const newComment = {
            content: 'New Comment',
            is_internal: false,
            created_by: 'user1'
        };

        const mockResponse = { data: { ...newComment, id: '3', ticket_id: '1' }, error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await act(async () => {
            await result.current.addComment.mutateAsync(newComment);
        });

        expect(supabaseMock.insert).toHaveBeenCalledWith([{ ...newComment, ticket_id: '1' }]);
        expect(supabaseMock.select).toHaveBeenCalledWith('*');
    });

    it('should update comment successfully', async () => {
        const updates = {
            id: '1',
            content: 'Updated Comment'
        };

        const mockResponse = { data: { ...mockComments[0], ...updates }, error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await act(async () => {
            await result.current.updateComment.mutateAsync(updates);
        });

        expect(supabaseMock.update).toHaveBeenCalledWith({ content: updates.content });
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', updates.id);
        expect(supabaseMock.select).toHaveBeenCalledWith('*');
    });

    it('should delete comment successfully', async () => {
        const mockResponse = { error: null };
        const supabaseMock = createSupabaseMock(mockResponse);
        (supabase.from as any).mockReturnValue(supabaseMock);

        const { result } = renderHook(() => useTicket('1'), { wrapper });

        await act(async () => {
            await result.current.deleteComment.mutateAsync('1');
        });

        expect(supabaseMock.delete).toHaveBeenCalled();
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', '1');
    });
}); 