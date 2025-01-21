import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TicketDetail } from '../../../components/tickets/TicketDetail/TicketDetail';
import { useTicket } from '../../../hooks/useTicket';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
import { AuthUser } from '../../../types/auth.types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useTicket hook
vi.mock('../../../hooks/useTicket');

const mockTeamMembers: AuthUser[] = [
    {
        id: 'user1',
        email: 'user1@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'agent'
    },
    {
        id: 'user2',
        email: 'user2@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'agent'
    }
];

const mockTicket = {
    id: '1',
    subject: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.New,
    priority: PriorityLevel.Medium,
    created_by: 'user1',
    team_id: 'team1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const mockComments = [
    {
        id: '1',
        ticket_id: '1',
        content: 'Test Comment 1',
        is_internal: false,
        created_by: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

describe('TicketDetail', () => {
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

    const renderComponent = () => {
        return render(
            React.createElement(QueryClientProvider, { client: queryClient },
                React.createElement(TicketDetail, {
                    ticketId: '1',
                    teamMembers: mockTeamMembers
                })
            )
        );
    };

    it('should render ticket details', () => {
        (useTicket as any).mockReturnValue({
            ticket: mockTicket,
            comments: mockComments,
            isLoading: false,
            isLoadingComments: false,
            error: null,
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: vi.fn()
        });

        renderComponent();

        // Check ticket details
        expect(screen.getByText(mockTicket.subject)).toBeInTheDocument();
        expect(screen.getByText(mockTicket.description)).toBeInTheDocument();

        // Check status select
        const statusSelect = screen.getByLabelText('Status:');
        expect(statusSelect).toBeInTheDocument();
        expect(statusSelect).toHaveValue(mockTicket.status);

        // Check priority select
        const prioritySelect = screen.getByLabelText('Priority:');
        expect(prioritySelect).toBeInTheDocument();
        expect(prioritySelect).toHaveValue(mockTicket.priority);

        // Check comments
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText(mockComments[0].content)).toBeInTheDocument();

        // Check comment form
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
        expect(screen.getByText('Internal comment')).toBeInTheDocument();
        expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    it('should handle status change', async () => {
        const mockRefetch = vi.fn();
        (useTicket as any).mockReturnValue({
            ticket: mockTicket,
            comments: mockComments,
            isLoading: false,
            isLoadingComments: false,
            error: null,
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: mockRefetch
        });

        renderComponent();

        const statusSelect = screen.getByLabelText('Status:');
        fireEvent.change(statusSelect, { target: { value: TicketStatus.Open } });

        expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle priority change', async () => {
        const mockRefetch = vi.fn();
        (useTicket as any).mockReturnValue({
            ticket: mockTicket,
            comments: mockComments,
            isLoading: false,
            isLoadingComments: false,
            error: null,
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: mockRefetch
        });

        renderComponent();

        const prioritySelect = screen.getByLabelText('Priority:');
        fireEvent.change(prioritySelect, { target: { value: PriorityLevel.High } });

        expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle adding a comment', async () => {
        const mockAddComment = vi.fn();
        (useTicket as any).mockReturnValue({
            ticket: mockTicket,
            comments: mockComments,
            isLoading: false,
            isLoadingComments: false,
            error: null,
            addComment: { mutateAsync: mockAddComment },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: vi.fn()
        });

        renderComponent();

        const commentInput = screen.getByPlaceholderText('Add a comment...');
        const internalCheckbox = screen.getByLabelText('Internal comment');
        const submitButton = screen.getByText('Add Comment');

        fireEvent.change(commentInput, { target: { value: 'New comment' } });
        fireEvent.click(internalCheckbox);
        fireEvent.click(submitButton);

        expect(mockAddComment).toHaveBeenCalledWith({
            content: 'New comment',
            is_internal: true,
            ticket_id: '1'
        });
    });

    it('should handle loading state', () => {
        (useTicket as any).mockReturnValue({
            ticket: null,
            comments: null,
            isLoading: true,
            isLoadingComments: true,
            error: null,
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: vi.fn()
        });

        renderComponent();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle error state', () => {
        (useTicket as any).mockReturnValue({
            ticket: null,
            comments: null,
            isLoading: false,
            isLoadingComments: false,
            error: new Error('Failed to load ticket'),
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() },
            refetch: vi.fn()
        });

        renderComponent();

        expect(screen.getByText('Error loading ticket. Please try again later.')).toBeInTheDocument();
    });
}); 