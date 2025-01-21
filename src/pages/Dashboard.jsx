import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import TicketList from '../components/TicketList'

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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ margin: 0 }}>Dashboard</h1>
                <button
                    onClick={() => navigate('/create-ticket')}
                    style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Create Ticket
                </button>
            </div>
            <TicketList />
        </div>
    )
}

export default Dashboard 