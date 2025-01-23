import { render, screen, waitForElementToBeRemoved, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminPortal from '../pages/AdminPortal'

// Mock window.confirm
const mockConfirm = vi.fn(() => true)
window.confirm = mockConfirm

// Mock data
const mockTeams = [
    { id: 1, name: 'Team A', team_members: [] },
    { id: 2, name: 'Team B', team_members: [{ user: { id: 1, name: 'John Doe' } }] }
]

// Create mock functions
const mockEq = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockReturnValue({ data: mockTeams, error: null })

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(() => ({
            select: () => ({
                eq: mockEq,
                order: mockOrder,
            }),
            insert: () => ({
                select: () => ({
                    single: () => ({
                        data: { id: 3, name: 'New Team', team_members: [] },
                        error: null
                    })
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: () => ({
                            data: { id: 1, name: 'Updated Team', team_members: [] },
                            error: null
                        })
                    })
                })
            }),
            delete: () => ({
                eq: () => ({
                    data: null,
                    error: null
                })
            })
        })),
    }
}))

describe('AdminPortal', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the admin portal with tabs', () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        expect(screen.getByText('Admin Portal')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /teams/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /agents/i })).toBeInTheDocument()
    })

    it('shows team management section with teams list', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Team B')).toBeInTheDocument()
        expect(screen.getByText('0 members')).toBeInTheDocument()
        expect(screen.getByText('1 members')).toBeInTheDocument()
    })

    it('allows creating a new team', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        const input = screen.getByPlaceholderText(/enter team name/i)
        const submitButton = screen.getByText(/create team/i)

        fireEvent.change(input, { target: { value: 'New Team' } })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('New Team')).toBeInTheDocument()
        })
    })

    it('allows editing a team name', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        const editButton = screen.getAllByTitle('Edit team')[0]
        fireEvent.click(editButton)

        const input = screen.getByDisplayValue('Team A')
        fireEvent.change(input, { target: { value: 'Updated Team' } })

        const saveButton = screen.getByTitle('Save')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText('Updated Team')).toBeInTheDocument()
        })
    })

    it('allows deleting a team with confirmation', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        const deleteButton = screen.getAllByTitle('Delete team')[0]
        fireEvent.click(deleteButton)

        await waitFor(() => {
            expect(screen.queryByText('Team A')).not.toBeInTheDocument()
        })
    })
}) 