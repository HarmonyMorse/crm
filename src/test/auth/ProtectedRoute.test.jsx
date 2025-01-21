import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ProtectedRoute from '../../components/auth/ProtectedRoute'

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: null,
        loading: false,
        error: null
    }))
}))

// Mock protected component
const ProtectedComponent = () => <div>Protected Content</div>

// Mock login component
const LoginComponent = () => <div>Login Page</div>

// Mock loading component
const LoadingComponent = () => <div>Loading...</div>

describe('ProtectedRoute', () => {
    const renderWithRouter = (initialRoute = '/') => {
        return render(
            <MemoryRouter initialEntries={[initialRoute]}>
                <Routes>
                    <Route path="/auth/login" element={<LoginComponent />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <ProtectedComponent />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        )
    }

    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: false,
            error: null
        })
    })

    it('renders protected content when user is authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: '123', email: 'test@example.com', role: 'customer' },
            loading: false,
            error: null
        })

        renderWithRouter()
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: false,
            error: null
        })

        renderWithRouter()
        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('shows loading state while checking auth', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: true,
            error: null
        })

        renderWithRouter()
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('respects role requirements', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: '123', email: 'test@example.com', role: 'customer' },
            loading: false,
            error: null
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/auth/login" element={<LoginComponent />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <ProtectedComponent />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
})

// Add PropTypes for test components
ProtectedComponent.propTypes = {}
LoginComponent.propTypes = {}
LoadingComponent.propTypes = {} 