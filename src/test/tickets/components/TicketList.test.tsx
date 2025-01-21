import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TicketList } from '../../../components/tickets/TicketList/TicketList';
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

describe('TicketList', () => {
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

    const renderComponent = (props = {}) => {
        return render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <TicketList {...props} />
                </QueryClientProvider>
            </MemoryRouter>
        );
    };

    it('should render tickets list', async () => {
        (useTickets as any).mockReturnValue({
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

    it('should show loading state', () => {
        (useTickets as any).mockReturnValue({
            tickets: undefined,
            isLoading: true,
            error: null
        });

        renderComponent();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error state', () => {
        const mockError = new Error('Failed to fetch tickets');
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            tickets: undefined,
            isLoading: false,
            error: mockError
        });

        renderComponent();

        expect(screen.getByText('Error loading tickets. Please try again later.')).toBeInTheDocument();
    });

    it('should show empty state', () => {
        (useTickets as any).mockReturnValue({
            tickets: [],
            isLoading: false,
            error: null
        });

        renderComponent();

        expect(screen.getByText('No tickets found')).toBeInTheDocument();
    });

    it('should apply filters from props', () => {
        const filters = {
            status: [TicketStatus.New],
            priority: [PriorityLevel.High]
        };

        (useTickets as any).mockReturnValue({
            tickets: mockTickets,
            isLoading: false,
            error: null
        });

        renderComponent({ filters });

        expect(useTickets).toHaveBeenCalledWith({ params: filters });
    });
}); 