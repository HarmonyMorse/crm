import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthComponent from './Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateTicket from './pages/CreateTicket.jsx'
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

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          session ? <Navigate to="/dashboard" /> : <AuthComponent />
        } />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
      </Routes>
    </Router>
  )
}

export default App