import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicketList from '../components/tickets/TicketList';
import { supabase } from '../lib/supabaseClient';

// Mock supabase
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        },
        from: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
    }
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

const mockTickets = [
    {
        id: 1,
        title: 'Test Ticket 1',
        status: 'open',
        priority: 'high',
        created_at: '2024-01-01T00:00:00Z',
        customer: { name: 'John Doe', email: 'john@example.com' }
    },
    {
        id: 2,
        title: 'Test Ticket 2',
        status: 'pending',
        priority: 'medium',
        created_at: '2024-01-02T00:00:00Z',
        customer: { name: 'Jane Smith', email: 'jane@example.com' }
    }
];

describe('TicketList', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock auth
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'test-user-id' } }
        });

        vi.spyOn(supabase, 'from').mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: mockTickets, error: null })
                }),
                order: () => Promise.resolve({ data: mockTickets, error: null })
            })
        }));

        vi.spyOn(supabase, 'channel').mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockResolvedValue()
        });
    });

    it('shows loading state initially', async () => {
        // Mock database queries to never resolve
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue(new Promise(() => { }))
        });

        render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading tickets...')).toBeInTheDocument();
    });

    it('displays tickets for admin users', async () => {
        // Mock admin role
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null
        });
        const mockOrder = vi.fn().mockResolvedValue({
            data: mockTickets,
            error: null
        });

        supabase.from.mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
            order: mockOrder
        });

        render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('displays only user tickets for customers', async () => {
        // Mock customer role and their tickets
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'customer' },
                error: null
            })
        };

        const mockTicketsQuery = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
                data: [mockTickets[0]],
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValue(mockTicketsQuery);

        render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        });

        // Verify that customer_id filter was applied
        expect(mockTicketsQuery.eq).toHaveBeenCalledWith('customer_id', 'test-user-id');
    });

    it('handles sorting when clicking column headers', async () => {
        // Mock admin role and sorting
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
            })
        };

        const mockTicketsQuery = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockTickets,
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValue(mockTicketsQuery);

        render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Title')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Title'));
        });

        expect(supabase.from).toHaveBeenCalledWith('tickets');
        expect(mockTicketsQuery.order).toHaveBeenCalled();
    });

    it('displays error message when fetching fails', async () => {
        // Mock error response
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockRejectedValue(new Error('Failed to fetch'))
        });

        render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
        });
    });

    it('sets up and cleans up realtime subscription', async () => {
        const mockChannel = {
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        };
        supabase.channel.mockReturnValue(mockChannel);

        const { unmount } = render(
            <BrowserRouter>
                <TicketList />
            </BrowserRouter>
        );

        expect(supabase.channel).toHaveBeenCalledWith('tickets_channel');
        expect(mockChannel.subscribe).toHaveBeenCalled();

        unmount();
        expect(supabase.removeChannel).toHaveBeenCalled();
    });
}); 