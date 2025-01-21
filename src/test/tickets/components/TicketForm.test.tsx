import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TicketForm } from '../../../components/tickets/TicketCreate/TicketForm';
import { useTickets } from '../../../hooks/useTickets';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

// Mock useTickets hook
vi.mock('../../../hooks/useTickets');

describe('TicketForm', () => {
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

    const renderComponent = () =>
        render(
            <QueryClientProvider client={queryClient}>
                <TicketForm />
            </QueryClientProvider>
        );

    const fillForm = async () => {
        // Fill out form
        fireEvent.change(screen.getByLabelText(/subject/i), {
            target: { value: 'Test Subject' }
        });
        fireEvent.change(screen.getByLabelText(/description/i), {
            target: { value: 'Test Description' }
        });

        // Select priority
        const mediumPriorityRadio = screen.getByLabelText(PriorityLevel.Medium);
        fireEvent.click(mediumPriorityRadio);

        // Select team
        const teamRadio = screen.getByLabelText('Customer Support');
        fireEvent.click(teamRadio);
    };

    it('should render form fields', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: vi.fn(),
                isLoading: false
            }
        });

        renderComponent();

        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByText(/priority/i)).toBeInTheDocument();
        expect(screen.getByText(/assign to team/i)).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
        const mockCreateTicket = vi.fn().mockResolvedValue({});
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: mockCreateTicket,
                isLoading: false
            }
        });

        renderComponent();

        // Fill out form
        await fillForm();

        // Submit form
        const submitButton = screen.getByText(/create ticket/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockCreateTicket).toHaveBeenCalledWith({
                subject: 'Test Subject',
                description: 'Test Description',
                priority: PriorityLevel.Medium,
                team_id: '1',
                status: TicketStatus.New
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith('/tickets');
    });

    it('should show validation errors', () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: vi.fn(),
                isLoading: false
            }
        });

        renderComponent();

        // Try to submit without filling required fields
        const submitButton = screen.getByText(/create ticket/i);
        fireEvent.click(submitButton);

        // Check that the submit button is disabled
        expect(submitButton).toBeDisabled();
    });

    it('should handle file attachments', async () => {
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: vi.fn(),
                isLoading: false
            }
        });

        renderComponent();

        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const dropzone = screen.getByText(/drag & drop files here/i).closest('div');

        if (!dropzone) throw new Error('Dropzone not found');

        await act(async () => {
            fireEvent.drop(dropzone, {
                dataTransfer: {
                    files: [file],
                    items: [
                        { kind: 'file', type: file.type, getAsFile: () => file }
                    ],
                    types: ['Files']
                }
            });
        });

        await waitFor(() => {
            expect(screen.getByText('test.txt', { exact: true })).toBeInTheDocument();
        });
    });

    it('should show loading state during submission', async () => {
        const mockCreateTicket = vi.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: mockCreateTicket,
                isLoading: true
            }
        });

        renderComponent();

        // Fill form
        await fillForm();

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        fireEvent.click(submitButton);

        // Check loading state
        await waitFor(() => {
            expect(submitButton).toHaveTextContent(/creating\.\.\./i);
            expect(submitButton).toBeDisabled();
        });
    });

    it('should handle submission errors', async () => {
        const mockError = new Error('Failed to create ticket');
        const mockCreateTicket = vi.fn().mockRejectedValue(mockError);
        (useTickets as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            createTicket: {
                mutateAsync: mockCreateTicket,
                isLoading: false
            }
        });

        renderComponent();

        // Fill form
        await fillForm();

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        fireEvent.click(submitButton);

        // Check error state
        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(/error creating ticket/i);
        });
    });
}); 