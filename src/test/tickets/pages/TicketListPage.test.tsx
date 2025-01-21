import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TicketListPage } from '../../../pages/tickets/TicketListPage';
import { useTickets } from '../../../hooks/useTickets';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useTickets hook
vi.mock('../../../hooks/useTickets');

const mockTickets = [
    {
        id: '1',
        subject: 'Test Ticket 1',
        description: 'Test Description 1',
        status: TicketStatus.New,
        priority: PriorityLevel.Medium,
        created_by: 'user1',
        team_id: 'team1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        subject: 'Test Ticket 2',
        description: 'Test Description 2',
        status: TicketStatus.Open,
        priority: PriorityLevel.High,
        created_by: 'user2',
        team_id: 'team1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

describe('TicketListPage', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false
                }
            }
        });
    });

    const renderComponent = () =>
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <TicketListPage />
                </MemoryRouter>
            </QueryClientProvider>
        );

    it('should render page title and create button', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: [],
            isLoading: false,
            error: null
        });

        renderComponent();

        expect(screen.getByText('Tickets')).toBeInTheDocument();
        expect(screen.getByText('Manage and track support tickets')).toBeInTheDocument();
        expect(screen.getByText('New Ticket')).toBeInTheDocument();
    });

    it('should render loading state', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: undefined,
            isLoading: true,
            error: null
        });

        renderComponent();

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render error state', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: undefined,
            isLoading: false,
            error: new Error('Failed to fetch tickets')
        });

        renderComponent();

        expect(
            screen.getByText('Error loading tickets. Please try again later.')
        ).toBeInTheDocument();
    });

    it('should render empty state', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: [],
            isLoading: false,
            error: null
        });

        renderComponent();

        expect(screen.getByText('No tickets found')).toBeInTheDocument();
        expect(
            screen.getByText('Try adjusting your filters or create a new ticket.')
        ).toBeInTheDocument();
    });

    it('should render tickets list', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: mockTickets,
            isLoading: false,
            error: null
        });

        renderComponent();

        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
        expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
        expect(screen.getByText('Test Description 1')).toBeInTheDocument();
        expect(screen.getByText('Test Description 2')).toBeInTheDocument();
        expect(screen.getByText(`Status: ${TicketStatus.New}`)).toBeInTheDocument();
        expect(screen.getByText(`Status: ${TicketStatus.Open}`)).toBeInTheDocument();
        expect(screen.getByText(`Priority: ${PriorityLevel.Medium}`)).toBeInTheDocument();
        expect(screen.getByText(`Priority: ${PriorityLevel.High}`)).toBeInTheDocument();
    });

    it('should have working navigation links', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: mockTickets,
            isLoading: false,
            error: null
        });

        renderComponent();

        const newTicketLink = screen.getByText('New Ticket');
        expect(newTicketLink).toHaveAttribute('href', '/tickets/new');

        const ticketLinks = screen.getAllByRole('link', { name: /Test Ticket/ });
        expect(ticketLinks[0]).toHaveAttribute('href', '/tickets/1');
        expect(ticketLinks[1]).toHaveAttribute('href', '/tickets/2');
    });
}); 