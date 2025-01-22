import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthComponent from './Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateTicket from './pages/CreateTicket.jsx'
import TicketDetail from './components/tickets/TicketDetail'

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
    return <AuthComponent />
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets/create" element={<CreateTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App