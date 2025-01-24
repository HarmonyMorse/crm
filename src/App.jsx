import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AuthComponent from './Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateTicket from './pages/CreateTicket.jsx'
import TicketDetail from './components/tickets/TicketDetail'
import AdminPortal from './pages/AdminPortal'
import Navbar from './components/ui/navbar'
import { ThemeProvider } from './components/ui/theme-provider'
import UserSettings from './components/user/UserSettings'

// Protected route component that checks authentication
const ProtectedRoute = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// Admin route component that checks user role
const AdminRoute = () => {
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        setUserRole(profile?.role)
      }
      setLoading(false)
    }
    getUserRole()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <ThemeProvider>
        <AuthComponent />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <div className="container mx-auto py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets/create" element={<CreateTicket />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/settings" element={<UserSettings />} />

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPortal />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App