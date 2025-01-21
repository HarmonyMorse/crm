import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({
                data: { session: null },
                error: null
            })),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } }
            })),
            signInWithPassword: vi.fn(() => Promise.resolve({
                data: { session: null },
                error: null
            })),
            signUp: vi.fn(() => Promise.resolve({
                data: { user: null },
                error: null
            })),
            signOut: vi.fn(() => Promise.resolve({
                error: null
            })),
            resetPasswordForEmail: vi.fn(() => Promise.resolve({
                error: null
            })),
            updateUser: vi.fn(() => Promise.resolve({
                data: { user: null },
                error: null
            }))
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                        data: { role: 'customer', team_id: '123' },
                        error: null
                    }))
                }))
            }))
        }))
    }
}))

// Test component that uses auth context
const TestComponent = () => {
    const { user, loading, error, signIn } = useAuth()
    return (
        <div>
            {loading && <div>Loading...</div>}
            {error && <div>Error: {error.message}</div>}
            {user && <div>User: {user.email}</div>}
            <button onClick={() => signIn({
                email: 'test@example.com',
                password: 'password'
            }).catch(() => { })}>
                Sign In
            </button>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('provides loading state initially', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('handles successful sign in', async () => {
        const mockUser = { id: '123', email: 'test@example.com' }
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { session: { user: mockUser } },
            error: null
        })

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        const signInButton = screen.getByText('Sign In')
        await act(async () => {
            await userEvent.click(signInButton)
        })

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password'
            })
        })
    })

    it('handles sign in error', async () => {
        const errorMessage = 'Invalid credentials'
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { session: null },
            error: { message: errorMessage }
        })

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        const signInButton = screen.getByText('Sign In')
        await act(async () => {
            await userEvent.click(signInButton)
        })

        await waitFor(() => {
            expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
        }, { timeout: 1000 })
    })

    it('updates user state on session change', async () => {
        const mockUser = { id: '123', email: 'test@example.com' }
        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: { user: mockUser } },
            error: null
        })

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByText(`User: ${mockUser.email}`)).toBeInTheDocument()
        })
    })
}) 