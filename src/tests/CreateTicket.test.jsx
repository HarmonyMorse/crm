import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import CreateTicket from '../pages/CreateTicket';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        },
        from: vi.fn()
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

describe('CreateTicket', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock authenticated user
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: { id: 'test-user-id', email: 'test@example.com' }
            },
            error: null
        });

        // Mock user role check
        const mockSingleUser = vi.fn().mockResolvedValue({ data: { role: 'customer' } });
        const mockEqUser = vi.fn().mockReturnValue({ single: mockSingleUser });
        const mockSelectUser = vi.fn().mockReturnValue({ eq: mockEqUser });

        supabase.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: mockSelectUser,
                    insert: vi.fn().mockReturnValue({ error: null })
                };
            }
            return {
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { id: 'new-ticket-id' }, error: null })
                    })
                }),
                select: mockSelectUser
            };
        });
    });

    it('renders the create ticket form', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CreateTicket />
                </BrowserRouter>
            );
        });

        // Check for form elements
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Priority' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Type a tag and press Enter/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Ticket/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CreateTicket />
                </BrowserRouter>
            );
        });

        // Try to submit without title
        const submitButton = screen.getByRole('button', { name: /Create Ticket/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        // Wait for validation state
        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: /title/i })).toHaveClass('border-red-500');
            expect(screen.getByText('Title is required')).toHaveClass('text-red-400');
        });
    });

    it('handles tag input correctly', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CreateTicket />
                </BrowserRouter>
            );
        });

        const tagInput = screen.getByPlaceholderText(/Type a tag and press Enter/i);

        // Add a tag
        await act(async () => {
            fireEvent.change(tagInput, { target: { value: 'bug' } });
            fireEvent.keyDown(tagInput, { key: 'Enter' });
        });

        // Check if tag is displayed
        expect(screen.getByText('bug')).toBeInTheDocument();
        expect(tagInput.value).toBe(''); // Input should be cleared

        // Add another tag
        await act(async () => {
            fireEvent.change(tagInput, { target: { value: 'urgent' } });
            fireEvent.keyDown(tagInput, { key: 'Enter' });
        });

        // Check if both tags are displayed
        expect(screen.getByText('bug')).toBeInTheDocument();
        expect(screen.getByText('urgent')).toBeInTheDocument();

        // Remove a tag
        await act(async () => {
            fireEvent.click(screen.getAllByText('×')[0]);
        });

        expect(screen.queryByText('bug')).not.toBeInTheDocument();
        expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('submits the form successfully', async () => {
        let capturedData = null;

        // Mock the insert chain
        const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-ticket-id' }, error: null });
        const mockSelect = vi.fn(() => ({ single: mockSingle }));
        const mockInsert = vi.fn((data) => {
            capturedData = data;
            return { select: mockSelect };
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { role: 'customer' } })
                        })
                    }),
                    insert: vi.fn().mockReturnValue({ error: null })
                };
            }
            return {
                insert: mockInsert,
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { role: 'customer' } })
                    })
                })
            };
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <CreateTicket />
                </BrowserRouter>
            );
        });

        // Fill out the form
        await act(async () => {
            fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
                target: { value: 'Test Ticket' }
            });
            fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
                target: { value: 'Test Description' }
            });
        });

        // Add a tag
        await act(async () => {
            const tagInput = screen.getByPlaceholderText(/Type a tag and press Enter/i);
            fireEvent.change(tagInput, { target: { value: 'bug' } });
            fireEvent.keyDown(tagInput, { key: 'Enter' });
        });

        // Submit the form
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Create Ticket/i }));
        });

        // Wait for the form submission
        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
        });

        // Verify the submitted data
        expect(capturedData).toMatchObject({
            title: 'Test Ticket',
            description: 'Test Description',
            tags: ['bug']
        });
    });

    it('handles submission errors', async () => {
        // Mock an error response
        const mockError = new Error('Failed to create ticket');

        supabase.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { role: 'customer' } })
                        })
                    }),
                    insert: vi.fn().mockReturnValue({ error: null })
                };
            }
            return {
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockRejectedValue(mockError)
                    })
                }),
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { role: 'customer' } })
                    })
                })
            };
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <CreateTicket />
                </BrowserRouter>
            );
        });

        // Fill out and submit the form
        await act(async () => {
            fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
                target: { value: 'Test Ticket' }
            });
            fireEvent.click(screen.getByRole('button', { name: /Create Ticket/i }));
        });

        // Check if error message is displayed
        expect(await screen.findByText(/Failed to create ticket/i)).toBeInTheDocument();
    });
}); 