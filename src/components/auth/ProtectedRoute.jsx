import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/auth/login" replace />
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/auth/login" replace />
    }

    return children
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requiredRole: PropTypes.oneOf(['admin', 'agent', 'team_lead', 'customer'])
}

export default ProtectedRoute 