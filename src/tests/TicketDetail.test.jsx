import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams } from 'react-router-dom';
import TicketDetail from '../components/tickets/TicketDetail';
import { supabase } from '../lib/supabaseClient';

// Mock useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => vi.fn()
    };
});

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

const mockTicket = {
    id: 1,
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'open',
    priority: 'high',
    created_at: '2024-01-01T00:00:00Z',
    customer: { name: 'John Doe', email: 'john@example.com' }
};

const mockHistory = [
    {
        id: 1,
        ticket_id: 1,
        message: 'Ticket created',
        message_type: 'system',
        created_at: '2024-01-01T00:00:00Z',
        user: { name: 'System', email: 'system@example.com' }
    },
    {
        id: 2,
        ticket_id: 1,
        message: 'Status changed to pending',
        message_type: 'system',
        created_at: '2024-01-02T00:00:00Z',
        user: { name: 'Agent', email: 'agent@example.com' }
    }
];

const mockNotes = [
    {
        id: 1,
        ticket_id: 1,
        note_detail: 'Internal note 1',
        created_at: '2024-01-01T00:00:00Z',
        user: { name: 'Agent', email: 'agent@example.com' }
    }
];

describe('TicketDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useParams.mockReturnValue({ id: '1' });

        // Mock auth
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'test-user-id' } }
        });
    });

    it('shows loading state initially', () => {
        // Mock queries to never resolve
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue(new Promise(() => { }))
        });

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading ticket details...')).toBeInTheDocument();
    });

    it('displays ticket details for admin users', async () => {
        // Mock admin role
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null
            })
        };

        const mockTicketQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: mockTicket,
                error: null
            })
        };

        const mockHistoryQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockHistory,
                error: null
            })
        };

        const mockNotesQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockNotes,
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValueOnce(mockTicketQuery)
            .mockReturnValueOnce(mockHistoryQuery)
            .mockReturnValue(mockNotesQuery);

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Ticket/)).toBeInTheDocument();
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
            expect(screen.getByText(/Internal note 1/)).toBeInTheDocument();
        });
    });

    it('displays ticket details for customers without notes', async () => {
        // Mock customer role
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'customer' },
                error: null
            })
        };

        const mockTicketQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: mockTicket,
                error: null
            })
        };

        const mockHistoryQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockHistory,
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValueOnce(mockTicketQuery)
            .mockReturnValue(mockHistoryQuery);

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Ticket')).toBeInTheDocument();
            expect(screen.queryByText('Internal note 1')).not.toBeInTheDocument();
        });
    });

    it('handles status changes for agents', async () => {
        // Mock agent role
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'agent' },
                error: null
            })
        };

        const mockTicketQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: mockTicket,
                error: null
            })
        };

        const mockHistoryQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockHistory,
                error: null
            })
        };

        const mockNotesQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockNotes,
                error: null
            })
        };

        const mockUpdateQuery = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
                error: null
            })
        };

        const mockHistoryInsertQuery = {
            insert: vi.fn().mockResolvedValue({
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValueOnce(mockTicketQuery)
            .mockReturnValueOnce(mockHistoryQuery)
            .mockReturnValueOnce(mockNotesQuery)
            .mockReturnValueOnce(mockUpdateQuery)
            .mockReturnValue(mockHistoryInsertQuery);

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Ticket/)).toBeInTheDocument();
        });

        // Change status
        const pendingButton = screen.getByRole('button', { name: /pending/i });
        fireEvent.click(pendingButton);

        await waitFor(() => {
            expect(mockUpdateQuery.update).toHaveBeenCalledWith({ status: 'pending' });
            expect(mockHistoryInsertQuery.insert).toHaveBeenCalled();
        });
    });

    it('handles adding comments', async () => {
        // Mock customer role
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'customer' },
                error: null
            })
        };

        const mockTicketQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: mockTicket,
                error: null
            })
        };

        const mockHistoryQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: mockHistory,
                error: null
            })
        };

        const mockHistoryInsertQuery = {
            insert: vi.fn().mockResolvedValue({
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValueOnce(mockTicketQuery)
            .mockReturnValueOnce(mockHistoryQuery)
            .mockReturnValue(mockHistoryInsertQuery);

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Ticket/)).toBeInTheDocument();
        });

        // Add comment
        const commentInput = screen.getByPlaceholderText(/add a comment/i);
        fireEvent.change(commentInput, { target: { value: 'New comment' } });
        const form = commentInput.closest('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockHistoryInsertQuery.insert).toHaveBeenCalledWith({
                ticket_id: mockTicket.id,
                user_id: 'test-user-id',
                message: 'New comment',
                message_type: 'customer'
            });
        });
    });

    it('displays error message when fetching fails', async () => {
        const mockError = new Error('Failed to fetch');
        vi.spyOn(supabase, 'from').mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.reject(mockError)
                })
            })
        }));

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            const errorElement = screen.getByText((content, element) => {
                return element.className.includes('bg-red-900/20') && element.textContent === 'Error: Failed to fetch';
            });
            expect(errorElement).toBeInTheDocument();
        });
    });

    it('displays not found message when ticket does not exist', async () => {
        // Mock user role but no ticket
        const mockUserQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { role: 'customer' },
                error: null
            })
        };

        const mockTicketQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: null
            })
        };

        const mockHistoryQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [],
                error: null
            })
        };

        supabase.from
            .mockReturnValueOnce(mockUserQuery)
            .mockReturnValueOnce(mockTicketQuery)
            .mockReturnValue(mockHistoryQuery);

        render(
            <BrowserRouter>
                <TicketDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Ticket not found/i)).toBeInTheDocument();
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
                <TicketDetail />
            </BrowserRouter>
        );

        expect(supabase.channel).toHaveBeenCalledWith('ticket_detail');
        expect(mockChannel.subscribe).toHaveBeenCalled();

        unmount();
        expect(supabase.removeChannel).toHaveBeenCalled();
    });
}); 