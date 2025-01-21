import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function TicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setTickets(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading tickets...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (tickets.length === 0) {
        return <div>No tickets found. Create your first ticket!</div>;
    }

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ color: '#e0e0e0' }}>Your Tickets</h2>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
                {tickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        style={{
                            padding: '16px',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            backgroundColor: '#1e1e1e'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: '0', fontSize: '1.1rem', color: '#e0e0e0' }}>{ticket.subject}</h3>
                            <span
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: ticket.status === 'new' ? '#1a365d' : '#1b4332',
                                    color: ticket.status === 'new' ? '#90cdf4' : '#90edb3',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {ticket.status}
                            </span>
                        </div>
                        {ticket.description && (
                            <p style={{ margin: '8px 0', color: '#9e9e9e' }}>
                                {ticket.description}
                            </p>
                        )}
                        <div style={{ fontSize: '0.875rem', color: '#757575', marginTop: '8px' }}>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TicketList; 