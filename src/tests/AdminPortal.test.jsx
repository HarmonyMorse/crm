import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import AdminPortal from '../pages/AdminPortal'

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({ data: [], error: null }),
            single: vi.fn(),
        })),
    },
}))

describe('AdminPortal', () => {
    it('renders the admin portal with tabs', () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        // Check for main heading
        expect(screen.getByText('Admin Portal')).toBeInTheDocument()

        // Check for tabs
        expect(screen.getByRole('tab', { name: /teams/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /agents/i })).toBeInTheDocument()
    })

    it('shows team management section by default', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        // Wait for loading state to finish
        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        // Check for team name input
        expect(screen.getByLabelText(/team name/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/enter team name/i)).toBeInTheDocument()
    })
}) 