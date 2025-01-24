import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Check, Copy } from 'lucide-react';
import { CustomerInfoModal } from '../ui/CustomerInfoModal';

const PRIORITY_COLORS = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
};

const STATUS_COLORS = {
    open: 'bg-green-500/10 text-green-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    resolved: 'bg-blue-500/10 text-blue-400'
};

function TicketList() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [userRole, setUserRole] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Fetch user role and tickets
    useEffect(() => {
        const fetchUserRoleAndTickets = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Get user role
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (userError) throw userError;
                setUserRole(userData.role);

                // Fetch tickets based on role
                let query = supabase
                    .from('tickets')
                    .select(`
                        *,
                        customer:users!tickets_customer_id_fkey(
                            email,
                            name,
                            created_at
                        )
                    `)
                    .order(sortField, { ascending: sortDirection === 'asc' });

                // If user is a customer, only show their tickets
                if (userData.role === 'customer') {
                    query = query.eq('customer_id', user.id);
                }

                const { data: ticketsData, error: ticketsError } = await query;

                if (ticketsError) throw ticketsError;
                setTickets(ticketsData);
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRoleAndTickets();

        // Set up realtime subscription
        const channel = supabase
            .channel('tickets_channel')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets'
                },
                () => {
                    // Refresh tickets when there's a change
                    fetchUserRoleAndTickets();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sortField, sortDirection]);

    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleCopyId = async (id) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-foreground">Loading tickets...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
                <Button
                    onClick={() => navigate('/tickets/create')}
                    variant="default"
                >
                    Create Ticket
                </Button>
            </div>

            <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-2 text-left text-foreground">
                                ID
                            </th>
                            <th
                                className="px-4 py-2 text-left text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => handleSort('title')}
                            >
                                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            {userRole !== 'customer' && (
                                <th
                                    className="px-4 py-2 text-left text-foreground"
                                >
                                    Customer
                                </th>
                            )}
                            <th
                                className="px-4 py-2 text-left text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => handleSort('status')}
                            >
                                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-4 py-2 text-left text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => handleSort('priority')}
                            >
                                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-4 py-2 text-left text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => handleSort('created_at')}
                            >
                                Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-2 text-left text-foreground">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(ticket => (
                            <tr
                                key={ticket.id}
                                className="border-b border-border hover:bg-muted/50"
                            >
                                <td className="px-4 py-2 text-foreground">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleCopyId(ticket.id)}
                                    >
                                        {copiedId === ticket.id ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </td>
                                <td className="px-4 py-2 text-foreground">
                                    {ticket.title}
                                </td>
                                {userRole !== 'customer' && (
                                    <td className="px-4 py-2 text-foreground">
                                        <div className="flex items-center gap-2">
                                            <CustomerInfoModal customer={ticket.customer} />
                                            <span>{ticket.customer.name || ticket.customer.email}</span>
                                        </div>
                                    </td>
                                )}
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status]}`}>
                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <span className={PRIORITY_COLORS[ticket.priority]}>
                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-foreground">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    >
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TicketList; 