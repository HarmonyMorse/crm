import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TicketDetailPage } from '../../../pages/tickets/TicketDetailPage';
import { useTicket } from '../../../hooks/useTicket';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
import { AuthUser, UserRole } from '../../../types/auth.types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as RouterTypes from 'react-router-dom';

// Mock useTicket hook
vi.mock('../../../hooks/useTicket');

// Mock react-router-dom with all necessary exports
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof RouterTypes>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ ticketId: '1' }),
        Link: ({ children, ...props }: any) => <a {...props}>{children}</a>
    };
});

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

const mockTeamMembers: AuthUser[] = [
    {
        id: 'user1',
        email: 'user1@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'agent' as UserRole,
        team_id: 'team1'
    }
];

describe('TicketDetailPage', () => {
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

    const renderComponent = (ticketId = '1') => {
        return render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <Routes>
                        <Route path="*" element={<TicketDetailPage />} />
                    </Routes>
                </QueryClientProvider>
            </MemoryRouter>
        );
    };

    it('should render loading state', () => {
        (useTicket as any).mockReturnValue({
            ticket: undefined,
            comments: undefined,
            isLoading: true,
            isLoadingComments: true,
            error: null,
            commentsError: null
        });

        renderComponent();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render error state', () => {
        const error = new Error('Error loading ticket. Please try again later.');
        (useTicket as any).mockReturnValue({
            ticket: undefined,
            comments: undefined,
            isLoading: false,
            isLoadingComments: false,
            error,
            commentsError: null
        });

        renderComponent();

        expect(screen.getByText('Error loading ticket. Please try again later.')).toBeInTheDocument();
    });

    it('should render ticket details', () => {
        (useTicket as any).mockReturnValue({
            ticket: mockTicket,
            comments: mockComments,
            isLoading: false,
            isLoadingComments: false,
            error: null,
            commentsError: null,
            refetch: vi.fn(),
            addComment: { mutateAsync: vi.fn() },
            updateComment: { mutateAsync: vi.fn() },
            deleteComment: { mutateAsync: vi.fn() }
        });

        renderComponent();

        // Check ticket details
        expect(screen.getByText(mockTicket.subject)).toBeInTheDocument();
        expect(screen.getByText(mockTicket.description)).toBeInTheDocument();

        // Check status and priority selects
        const statusSelect = screen.getByLabelText('Status');
        const prioritySelect = screen.getByLabelText('Priority');

        expect(statusSelect).toBeInTheDocument();
        expect(prioritySelect).toBeInTheDocument();
        expect(statusSelect).toHaveValue(mockTicket.status);
        expect(prioritySelect).toHaveValue(mockTicket.priority);

        // Check comments
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText(mockComments[0].content)).toBeInTheDocument();
        expect(screen.getByText(`By ${mockComments[0].created_by}`)).toBeInTheDocument();

        // Check comment form
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
        expect(screen.getByText('Internal comment')).toBeInTheDocument();
        expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });
}); 