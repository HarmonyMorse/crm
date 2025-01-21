import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NewTicketPage } from '../../../pages/tickets/NewTicketPage';

describe('NewTicketPage', () => {
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
                    <NewTicketPage />
                </MemoryRouter>
            </QueryClientProvider>
        );

    it('should render page title and navigation', () => {
        renderComponent();

        expect(screen.getByText('Create New Ticket')).toBeInTheDocument();
        expect(screen.getByText('Back to Tickets')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to Tickets' }))
            .toHaveAttribute('href', '/tickets');
    });

    it('should render ticket form', () => {
        renderComponent();

        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByText(/priority/i)).toBeInTheDocument();
        expect(screen.getByText(/assign to team/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
    });

    it('should have proper layout structure', () => {
        renderComponent();

        // Check for main layout elements
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Create New Ticket' })).toBeInTheDocument();

        // Check for form container
        const formContainer = screen.getByRole('form');
        expect(formContainer).toBeInTheDocument();
        expect(formContainer).toHaveClass('space-y-6');
    });
}); 