import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const navigate = useNavigate()

    useEffect(() => {
        // Check if user is authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/')
            }
        })
    }, [navigate])

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to your dashboard!</p>
            <button onClick={() => navigate('/create-ticket')}>Create Ticket</button>
        </div>
    )
}

export default Dashboard 