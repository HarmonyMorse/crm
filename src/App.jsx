import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<div>Login Page (Coming Soon)</div>} />
            <Route path="/auth/register" element={<div>Register Page (Coming Soon)</div>} />
            <Route path="/auth/reset-password" element={<div>Reset Password Page (Coming Soon)</div>} />

            {/* Protected routes - will be wrapped with ProtectedRoute component */}
            <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />
            <Route path="/tickets" element={<div>Tickets (Coming Soon)</div>} />
            <Route path="/profile" element={<div>Profile (Coming Soon)</div>} />

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
