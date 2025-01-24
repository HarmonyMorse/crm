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

const mockCustomFields = [
    { id: 1, name: 'Priority Level', field_type: 'select', required: true, options: ['High', 'Medium', 'Low'], active: true },
    { id: 2, name: 'Due Date', field_type: 'date', required: false, active: true }
]

// Create mock functions
const mockEq = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockImplementation((field) => {
    if (field === 'created_at') {
        return { data: mockCustomFields, error: null }
    }
    return { data: mockTeams, error: null }
})

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn((table) => {
            const commonMethods = {
                select: () => ({
                    eq: mockEq,
                    order: mockOrder,
                }),
                update: () => ({
                    eq: () => ({
                        select: () => ({
                            single: () => ({
                                data: table === 'custom_field_definitions'
                                    ? { id: 1, name: 'Updated Field', field_type: 'text', required: true, active: true }
                                    : { id: 1, name: 'Updated Team', team_members: [] },
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
            }

            if (table === 'custom_field_definitions') {
                return {
                    ...commonMethods,
                    insert: () => ({
                        select: () => ({
                            single: () => ({
                                data: { id: 3, name: 'New Field', field_type: 'text', required: false, active: true },
                                error: null
                            })
                        })
                    })
                }
            }

            return {
                ...commonMethods,
                insert: () => ({
                    select: () => ({
                        single: () => ({
                            data: { id: 3, name: 'New Team', team_members: [] },
                            error: null
                        })
                    })
                })
            }
        }),
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
        expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /custom fields/i })).toBeInTheDocument()
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

    it('shows custom fields management section', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        // Click on Custom Fields tab
        fireEvent.click(screen.getByRole('tab', { name: /custom fields/i }))

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        expect(screen.getByText('Custom Fields Manager')).toBeInTheDocument()
        expect(screen.getByText('Priority Level')).toBeInTheDocument()
        expect(screen.getByText('Due Date')).toBeInTheDocument()
    })

    it('allows creating a new custom field', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        // Click on Custom Fields tab
        fireEvent.click(screen.getByRole('tab', { name: /custom fields/i }))

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        // Fill out the form
        fireEvent.change(screen.getByLabelText(/field name/i), {
            target: { value: 'New Field' }
        })

        // Submit the form
        fireEvent.click(screen.getByText(/add field/i))

        await waitFor(() => {
            expect(screen.getByText('New Field')).toBeInTheDocument()
        })
    })

    it('allows toggling custom field active state', async () => {
        render(
            <BrowserRouter>
                <AdminPortal />
            </BrowserRouter>
        )

        // Click on Custom Fields tab
        fireEvent.click(screen.getByRole('tab', { name: /custom fields/i }))

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

        // Find and click the active toggle button
        const toggleButton = screen.getAllByText('Active')[0]
        fireEvent.click(toggleButton)

        await waitFor(() => {
            expect(screen.getByText('Inactive')).toBeInTheDocument()
        })
    })
}) 