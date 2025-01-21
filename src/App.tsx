import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy loaded components
const TicketListPage = React.lazy(() =>
    import('./pages/tickets/TicketListPage').then(module => ({
        default: module.TicketListPage
    }))
);

const TicketDetailPage = React.lazy(() =>
    import('./pages/tickets/TicketDetailPage').then(module => ({
        default: module.TicketDetailPage
    }))
);

const NewTicketPage = React.lazy(() =>
    import('./pages/tickets/NewTicketPage').then(module => ({
        default: module.NewTicketPage
    }))
);

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            {/* Ticket Routes */}
                            <Route
                                path="/tickets"
                                element={
                                    <ProtectedRoute>
                                        <TicketListPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/tickets/new"
                                element={
                                    <ProtectedRoute>
                                        <NewTicketPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/tickets/:ticketId"
                                element={
                                    <ProtectedRoute>
                                        <TicketDetailPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Redirect root to tickets */}
                            <Route path="/" element={<Navigate to="/tickets" replace />} />

                            {/* 404 catch-all */}
                            <Route path="*" element={<Navigate to="/tickets" replace />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </BrowserRouter>
        </QueryClientProvider>
    );
}; 