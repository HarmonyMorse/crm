import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoginForm from './components/auth/LoginForm'
import RegistrationForm from './components/auth/RegistrationForm'
import PasswordReset from './components/auth/PasswordReset'
import Dashboard from './components/dashboard/Dashboard'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<LoginForm />} />
            <Route path="/auth/register" element={<RegistrationForm />} />
            <Route path="/auth/reset-password" element={<PasswordReset />} />

            {/* Protected routes - will be wrapped with ProtectedRoute component */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<div>Tickets (Coming Soon)</div>} />

            {/* Redirect root to dashboard or login based on auth state */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 route */}
            <Route path="*" element={<div>404 - Not Found</div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
